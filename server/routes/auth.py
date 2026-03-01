"""
Authentication routes - register, login, refresh, logout, OAuth.
Save as: routes/auth.py
"""

import os
import logging
from datetime import datetime, timezone

import httpx
from fastapi import APIRouter, Depends, HTTPException, Request, Response, status
from fastapi.responses import RedirectResponse
from pydantic import BaseModel, EmailStr, field_validator
from passlib.context import CryptContext
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from db.database import get_db
from models.users import User, OAuthAccount
from core.auth import (
    create_access_token,
    create_refresh_token,
    store_refresh_token,
    validate_refresh_token,
    revoke_refresh_token,
    revoke_all_refresh_tokens,
    REFRESH_TOKEN_EXPIRE_DAYS,
    get_current_user,
)
from core.cache import redis_client
from core.security import limiter
from config.settings import settings

CYAN = "\033[96m"
YELLOW = "\033[93m"
RED = "\033[91m"
RESET = "\033[0m"

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/auth", tags=["auth"])

# Password hashing─

pwd_context = CryptContext(schemes=["argon2"], deprecated="auto")


def hash_password(password: str) -> str:
    return pwd_context.hash(password)


def verify_password(plain: str, hashed: str) -> bool:
    return pwd_context.verify(plain, hashed)


# Cookie helper

COOKIE_NAME = "refresh_token"


def set_refresh_cookie(response: Response, token: str) -> None:
    is_prod = settings.ENVIRONMENT == "production"
    response.set_cookie(
        key=COOKIE_NAME,
        value=token,
        httponly=True,
        secure=is_prod,
        samesite="lax",
        max_age=REFRESH_TOKEN_EXPIRE_DAYS * 24 * 60 * 60,
        domain=".stellarbladeguide.com" if is_prod else None,
        path="/api/auth",
    )

def clear_refresh_cookie(response: Response) -> None:
    is_prod = settings.ENVIRONMENT == "production"
    response.delete_cookie(
        key=COOKIE_NAME,
        domain=".stellarbladeguide.com" if is_prod else None,
        path="/api/auth",
    )

# Schemas

class RegisterRequest(BaseModel):
    email: EmailStr
    username: str
    password: str

    @field_validator("username")
    @classmethod
    def username_valid(cls, v: str) -> str:
        v = v.strip()
        if len(v) < 3 or len(v) > 50:
            raise ValueError("Username must be between 3 and 50 characters")
        if not v.replace("_", "").replace("-", "").isalnum():
            raise ValueError("Username may only contain letters, numbers, hyphens, and underscores")
        return v

    @field_validator("password")
    @classmethod
    def password_strong(cls, v: str) -> str:
        if len(v) < 8:
            raise ValueError("Password must be at least 8 characters")
        return v


class LoginRequest(BaseModel):
    email: EmailStr
    password: str


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: dict


# Helper

def user_to_dict(user: User) -> dict:
    return {
        "id": user.id,
        "email": user.email,
        "username": user.username,
        "avatar_url": user.avatar_url,
        "role": user.role,
        "created_at": user.created_at.isoformat(),
    }


async def _issue_tokens(user: User, response: Response) -> dict:
    """Create access + refresh tokens, set cookie, return response body."""
    access_token = create_access_token(user.id, user.role)
    refresh_token = create_refresh_token()
    await store_refresh_token(user.id, refresh_token)
    set_refresh_cookie(response, f"{user.id}:{refresh_token}")
    return {
        "access_token": access_token,
        "token_type": "bearer",
        "user": user_to_dict(user),
    }


# Email / Password routes

@router.post("/register", response_model=TokenResponse, status_code=status.HTTP_201_CREATED)
@limiter.limit("10/minute")
async def register(
    request: Request,
    response: Response,
    body: RegisterRequest,
    db: AsyncSession = Depends(get_db),
):
    # Check for existing email
    existing = await db.execute(select(User).where(User.email == body.email))
    if existing.scalar_one_or_none():
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Email already registered")

    # Check for existing username
    existing = await db.execute(select(User).where(User.username == body.username))
    if existing.scalar_one_or_none():
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Username already taken")

    user = User(
        email=body.email,
        username=body.username,
        password_hash=hash_password(body.password),
    )
    db.add(user)
    await db.commit()
    await db.refresh(user)

    logger.info(f"{CYAN}New user registered: {user.username} ({user.email}){RESET}")
    return await _issue_tokens(user, response)


@router.post("/login", response_model=TokenResponse)
@limiter.limit("20/minute")
async def login(
    request: Request,
    response: Response,
    body: LoginRequest,
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(select(User).where(User.email == body.email, User.is_active == True))
    user = result.scalar_one_or_none()

    # Deliberate vague error - don't reveal whether email exists
    if not user or not user.password_hash or not verify_password(body.password, user.password_hash):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid email or password")

    return await _issue_tokens(user, response)


@router.post("/refresh", response_model=TokenResponse)
@limiter.limit("30/minute")
async def refresh(
    request: Request,
    response: Response,
    db: AsyncSession = Depends(get_db),
):
    token = request.cookies.get(COOKIE_NAME)
    if not token:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="No refresh token")

    # We need user_id — encode it in the cookie value as "user_id:token"
    try:
        user_id_str, refresh_token = token.split(":", 1)
        user_id = int(user_id_str)
    except (ValueError, AttributeError):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid refresh token format")

    if not await validate_refresh_token(user_id, refresh_token):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Refresh token invalid or expired")

    result = await db.execute(select(User).where(User.id == user_id, User.is_active == True))
    user = result.scalar_one_or_none()
    if not user:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="User not found")

    # Rotate: revoke old, issue new
    await revoke_refresh_token(user_id, refresh_token)
    return await _issue_tokens(user, response)


@router.post("/logout", status_code=status.HTTP_204_NO_CONTENT)
@limiter.limit("30/minute")
async def logout(request: Request, response: Response):
    token = request.cookies.get(COOKIE_NAME)
    if token:
        try:
            user_id_str, refresh_token = token.split(":", 1)
            await revoke_refresh_token(int(user_id_str), refresh_token)
        except (ValueError, AttributeError):
            pass  # Malformed cookie — just clear it
    clear_refresh_cookie(response)


@router.post("/logout-all", status_code=status.HTTP_204_NO_CONTENT)
@limiter.limit("10/minute")
async def logout_all(
    request: Request,
    response: Response,
    current_user: User = Depends(get_current_user),
):
    """Revoke all active sessions across all devices."""
    await revoke_all_refresh_tokens(current_user.id)
    clear_refresh_cookie(response)
    logger.info(f"{CYAN}User {current_user.username} logged out of all devices{RESET}")


class ChangePasswordRequest(BaseModel):
    current_password: str
    new_password: str

    @field_validator("new_password")
    @classmethod
    def password_strong(cls, v: str) -> str:
        if len(v) < 8:
            raise ValueError("Password must be at least 8 characters")
        return v


@router.post("/change-password", status_code=status.HTTP_204_NO_CONTENT)
@limiter.limit("10/minute")
async def change_password(
    request: Request,
    response: Response,
    body: ChangePasswordRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Change password. Requires current password. Revokes all existing sessions."""
    if not current_user.password_hash:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Account uses OAuth login — no password to change"
        )

    if not verify_password(body.current_password, current_user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Current password is incorrect"
        )

    if body.current_password == body.new_password:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="New password must be different from current password"
        )

    current_user.password_hash = hash_password(body.new_password)
    await db.commit()

    # Revoke all sessions and clear cookie — user must log in again
    await revoke_all_refresh_tokens(current_user.id)
    clear_refresh_cookie(response)

    logger.info(f"{CYAN}User {current_user.username} changed their password{RESET}")


# Password reset

import uuid
import resend

RESET_TOKEN_TTL = 60 * 15  # 15 minutes


async def _send_reset_email(email: str, token: str) -> None:
    """Send password reset email via Resend."""
    frontend_url = os.getenv("FRONTEND_URL", "https://stellarbladeguide.com")
    reset_url = f"{frontend_url}/reset-password?token={token}"

    resend.api_key = settings.RESEND_API_KEY

    resend.Emails.send({
        "from": "Stellar Blade Guide <noreply@stellarbladeguide.com>",
        "to": email,
        "subject": "Reset your password",
        "html": f"""
            <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto;">
                <h2>Reset your password</h2>
                <p>We received a request to reset your password. Click the link below to choose a new one.</p>
                <p>
                    <a href="{reset_url}" style="
                        display: inline-block;
                        padding: 12px 24px;
                        background: #3b82f6;
                        color: white;
                        text-decoration: none;
                        border-radius: 6px;
                        font-weight: bold;
                    ">Reset Password</a>
                </p>
                <p style="color: #6b7280; font-size: 14px;">
                    This link expires in 15 minutes. If you didn't request this, you can safely ignore this email.
                </p>
                <p style="color: #6b7280; font-size: 12px;">
                    Or copy this link: {reset_url}
                </p>
            </div>
        """,
    })


class ForgotPasswordRequest(BaseModel):
    email: EmailStr


class ResetPasswordRequest(BaseModel):
    token: str
    new_password: str

    @field_validator("new_password")
    @classmethod
    def password_strong(cls, v: str) -> str:
        if len(v) < 8:
            raise ValueError("Password must be at least 8 characters")
        return v


@router.post("/forgot-password", status_code=status.HTTP_204_NO_CONTENT)
@limiter.limit("5/minute")
async def forgot_password(
    request: Request,
    body: ForgotPasswordRequest,
    db: AsyncSession = Depends(get_db),
):
    """
    Send a password reset email if the account exists.
    Always returns 204 regardless — never reveal whether an email is registered.
    """
    result = await db.execute(select(User).where(User.email == body.email, User.is_active == True))
    user = result.scalar_one_or_none()

    if user and user.password_hash:
        token = str(uuid.uuid4())
        await redis_client.setex(f"password_reset:{token}", RESET_TOKEN_TTL, str(user.id))
        try:
            await _send_reset_email(user.email, token)
            logger.info(f"Password reset email sent to user {user.id}")
        except Exception as e:
            logger.error(f"{RED}Failed to send reset email to user {user.id}: {e}{RESET}")
            # Don't expose email errors to the client


@router.post("/reset-password", status_code=status.HTTP_204_NO_CONTENT)
@limiter.limit("10/minute")
async def reset_password(
    request: Request,
    response: Response,
    body: ResetPasswordRequest,
    db: AsyncSession = Depends(get_db),
):
    """Reset password using the token from the email link."""
    redis_key = f"password_reset:{body.token}"
    user_id_str = await redis_client.get(redis_key)

    if not user_id_str:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Reset token is invalid or has expired"
        )

    result = await db.execute(select(User).where(User.id == int(user_id_str), User.is_active == True))
    user = result.scalar_one_or_none()

    if not user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Reset token is invalid or has expired"
        )

    # Delete token immediately — one use only
    await redis_client.delete(redis_key)

    user.password_hash = hash_password(body.new_password)
    await db.commit()

    # Revoke all sessions — force re-login everywhere
    await revoke_all_refresh_tokens(user.id)
    clear_refresh_cookie(response)

    logger.info(f"{CYAN}User {user.id} successfully reset their password{RESET}")


# OAuth

GOOGLE_CLIENT_ID = os.getenv("GOOGLE_CLIENT_ID", "")
GOOGLE_CLIENT_SECRET = os.getenv("GOOGLE_CLIENT_SECRET", "")
GOOGLE_REDIRECT_URI = os.getenv("GOOGLE_REDIRECT_URI", "https://api.stellarbladeguide.com/api/auth/google/callback")

DISCORD_CLIENT_ID = os.getenv("DISCORD_CLIENT_ID", "")
DISCORD_CLIENT_SECRET = os.getenv("DISCORD_CLIENT_SECRET", "")
DISCORD_REDIRECT_URI = os.getenv("DISCORD_REDIRECT_URI", "https://api.stellarbladeguide.com/api/auth/discord/callback")

FRONTEND_URL = os.getenv("FRONTEND_URL", "https://stellarbladeguide.com")


async def _get_or_create_oauth_user(
    db: AsyncSession,
    provider: str,
    provider_user_id: str,
    email: str,
    username: str,
    avatar_url: str | None,
) -> User:
    """
    Find existing OAuth account → return its user.
    No OAuth account but email exists → link the provider to that account.
    Neither → create new user + OAuth account.
    """
    # 1. Existing OAuth account
    result = await db.execute(
        select(OAuthAccount).where(
            OAuthAccount.provider == provider,
            OAuthAccount.provider_user_id == provider_user_id,
        )
    )
    oauth_account = result.scalar_one_or_none()
    if oauth_account:
        result = await db.execute(select(User).where(User.id == oauth_account.user_id))
        return result.scalar_one()

    # 2. Email already registered — link provider
    result = await db.execute(select(User).where(User.email == email))
    user = result.scalar_one_or_none()
    if user:
        db.add(OAuthAccount(user_id=user.id, provider=provider, provider_user_id=provider_user_id))
        await db.commit()
        return user

    # 3. Brand new user
    # Ensure username is unique by appending a suffix if needed
    base_username = username[:45]
    final_username = base_username
    suffix = 1
    while True:
        result = await db.execute(select(User).where(User.username == final_username))
        if not result.scalar_one_or_none():
            break
        final_username = f"{base_username}{suffix}"
        suffix += 1

    user = User(email=email, username=final_username, avatar_url=avatar_url)
    db.add(user)
    await db.flush()
    db.add(OAuthAccount(user_id=user.id, provider=provider, provider_user_id=provider_user_id))
    await db.commit()
    await db.refresh(user)
    logger.info(f"{CYAN}New OAuth user created: {user.username} via {provider}{RESET}")
    return user


# Google

@router.get("/google")
@limiter.limit("20/minute")
async def google_login(request: Request):
    """Redirect user to Google's OAuth consent screen."""
    if not GOOGLE_CLIENT_ID:
        raise HTTPException(status_code=501, detail="Google OAuth not configured")
    params = (
        f"client_id={GOOGLE_CLIENT_ID}"
        f"&redirect_uri={GOOGLE_REDIRECT_URI}"
        f"&response_type=code"
        f"&scope=openid%20email%20profile"
        f"&access_type=offline"
    )
    return RedirectResponse(f"https://accounts.google.com/o/oauth2/v2/auth?{params}")


@router.get("/google/callback")
@limiter.limit("20/minute")
async def google_callback(
    request: Request,
    response: Response,
    code: str,
    db: AsyncSession = Depends(get_db),
):
    if not GOOGLE_CLIENT_ID:
        raise HTTPException(status_code=501, detail="Google OAuth not configured")

    async with httpx.AsyncClient() as client:
        # Exchange code for tokens
        token_resp = await client.post(
            "https://oauth2.googleapis.com/token",
            data={
                "code": code,
                "client_id": GOOGLE_CLIENT_ID,
                "client_secret": GOOGLE_CLIENT_SECRET,
                "redirect_uri": GOOGLE_REDIRECT_URI,
                "grant_type": "authorization_code",
            },
        )
        if token_resp.status_code != 200:
            raise HTTPException(status_code=400, detail="Failed to exchange Google code")

        google_token = token_resp.json().get("access_token")

        # Fetch user info
        userinfo_resp = await client.get(
            "https://www.googleapis.com/oauth2/v2/userinfo",
            headers={"Authorization": f"Bearer {google_token}"},
        )
        if userinfo_resp.status_code != 200:
            raise HTTPException(status_code=400, detail="Failed to fetch Google user info")

        info = userinfo_resp.json()

    provider_user_id = info["id"]
    email = info["email"]
    username = info.get("name", email.split("@")[0]).replace(" ", "_")
    avatar_url = info.get("picture")

    user = await _get_or_create_oauth_user(db, "google", provider_user_id, email, username, avatar_url)

    # Issue tokens then redirect to frontend with access token in query param
    # (Frontend reads it once on mount, stores in memory, then removes from URL)
    access_token = create_access_token(user.id, user.role)
    refresh_token = create_refresh_token()
    await store_refresh_token(user.id, refresh_token)

    redirect = RedirectResponse(url=f"{FRONTEND_URL}/oauth/callback?token={access_token}")
    set_refresh_cookie(redirect, f"{user.id}:{refresh_token}")
    return redirect


# Discord

@router.get("/discord")
@limiter.limit("20/minute")
async def discord_login(request: Request):
    """Redirect user to Discord's OAuth consent screen."""
    if not DISCORD_CLIENT_ID:
        raise HTTPException(status_code=501, detail="Discord OAuth not configured")
    params = (
        f"client_id={DISCORD_CLIENT_ID}"
        f"&redirect_uri={DISCORD_REDIRECT_URI}"
        f"&response_type=code"
        f"&scope=identify%20email"
    )
    return RedirectResponse(f"https://discord.com/api/oauth2/authorize?{params}")


@router.get("/discord/callback")
@limiter.limit("20/minute")
async def discord_callback(
    request: Request,
    response: Response,
    code: str,
    db: AsyncSession = Depends(get_db),
):
    if not DISCORD_CLIENT_ID:
        raise HTTPException(status_code=501, detail="Discord OAuth not configured")

    async with httpx.AsyncClient() as client:
        # Exchange code for tokens
        token_resp = await client.post(
            "https://discord.com/api/oauth2/token",
            data={
                "code": code,
                "client_id": DISCORD_CLIENT_ID,
                "client_secret": DISCORD_CLIENT_SECRET,
                "redirect_uri": DISCORD_REDIRECT_URI,
                "grant_type": "authorization_code",
            },
            headers={"Content-Type": "application/x-www-form-urlencoded"},
        )
        if token_resp.status_code != 200:
            raise HTTPException(status_code=400, detail="Failed to exchange Discord code")

        discord_token = token_resp.json().get("access_token")

        # Fetch user info
        userinfo_resp = await client.get(
            "https://discord.com/api/users/@me",
            headers={"Authorization": f"Bearer {discord_token}"},
        )
        if userinfo_resp.status_code != 200:
            raise HTTPException(status_code=400, detail="Failed to fetch Discord user info")

        info = userinfo_resp.json()

    provider_user_id = info["id"]
    email = info.get("email")
    if not email:
        raise HTTPException(status_code=400, detail="Discord account must have a verified email")

    username = info.get("username", email.split("@")[0])
    avatar_hash = info.get("avatar")
    avatar_url = f"https://cdn.discordapp.com/avatars/{provider_user_id}/{avatar_hash}.png" if avatar_hash else None

    user = await _get_or_create_oauth_user(db, "discord", provider_user_id, email, username, avatar_url)

    access_token = create_access_token(user.id, user.role)
    refresh_token = create_refresh_token()
    await store_refresh_token(user.id, refresh_token)

    redirect = RedirectResponse(url=f"{FRONTEND_URL}/oauth/callback?token={access_token}")
    set_refresh_cookie(redirect, f"{user.id}:{refresh_token}")
    return redirect
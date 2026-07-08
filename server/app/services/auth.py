import resend
from fastapi import Response
from passlib.context import CryptContext

from app.models.users import User
from app.core.auth import (
    create_access_token,
    create_refresh_token,
    store_refresh_token,
    REFRESH_TOKEN_EXPIRE_DAYS,
)
from app.config.settings import settings

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


# Password reset

RESET_TOKEN_TTL = 60 * 60  # 1 hour


async def _send_reset_email(email: str, token: str) -> None:
    """Send password reset email via Resend."""
    frontend_url = settings.FRONTEND_URL
    reset_url = f"{frontend_url}/reset-password?token={token}"

    resend.api_key = settings.RESEND_API_KEY

    resend.Emails.send({
        "from": "Stellar Blade Guide <noreply@stellarbladeguide.com>",
        "to": email,
        "subject": "Reset your password",
        "html": f"""
            <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto;">
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
                    This link expires in 1 hour. If you didn't request this, you can safely ignore this email.
                </p>
                <p style="color: #6b7280; font-size: 12px;">
                    Or copy this link: {reset_url}
                </p>
            </div>
        """,
    })

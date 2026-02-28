import os
import uuid
import logging
from datetime import datetime, timedelta, timezone
from typing import Optional

from fastapi import Depends, HTTPException, Request, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from jose import JWTError, jwt
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from db.database import get_db
from core.cache import redis_client

logger = logging.getLogger(__name__)

# Config

SECRET_KEY: str = os.getenv("JWT_SECRET_KEY", "")
ALGORITHM: str = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES: int = int(os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES", 15))
REFRESH_TOKEN_EXPIRE_DAYS: int = int(os.getenv("REFRESH_TOKEN_EXPIRE_DAYS", 7))

if not SECRET_KEY:
    raise RuntimeError("JWT_SECRET_KEY environment variable is not set")

bearer_scheme = HTTPBearer(auto_error=False)

# Token creation

def create_access_token(user_id: int, role: str) -> str:
    """Create a short-lived JWT access token."""
    expire = datetime.now(timezone.utc) + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    payload = {
        "sub": str(user_id),
        "role": role,
        "exp": expire,
        "iat": datetime.now(timezone.utc),
        "type": "access",
    }
    return jwt.encode(payload, SECRET_KEY, algorithm=ALGORITHM)


def create_refresh_token() -> str:
    """Create an opaque refresh token (UUID). Stored in Redis, not a JWT."""
    return str(uuid.uuid4())


# Redis helpers

def _refresh_key(user_id: int, token: str) -> str:
    return f"refresh:{user_id}:{token}"


async def store_refresh_token(user_id: int, token: str) -> None:
    """Persist refresh token in Redis with TTL."""
    key = _refresh_key(user_id, token)
    ttl = REFRESH_TOKEN_EXPIRE_DAYS * 24 * 60 * 60
    await redis_client.setex(key, ttl, "1")


async def validate_refresh_token(user_id: int, token: str) -> bool:
    """Return True if the refresh token exists in Redis."""
    key = _refresh_key(user_id, token)
    value = await redis_client.get(key)
    return value is not None


async def revoke_refresh_token(user_id: int, token: str) -> None:
    """Delete a single refresh token (logout)."""
    key = _refresh_key(user_id, token)
    await redis_client.delete(key)


async def revoke_all_refresh_tokens(user_id: int) -> None:
    """Delete all refresh tokens for a user (e.g. password change)."""
    pattern = f"refresh:{user_id}:*"
    keys = await redis_client.keys(pattern)
    if keys:
        await redis_client.delete(*keys)


# Token verification

def decode_access_token(token: str) -> dict:
    """
    Decode and verify a JWT access token.
    Raises HTTPException 401 on any failure.
    """
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        if payload.get("type") != "access":
            raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid token type")
        return payload
    except JWTError as exc:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired token",
        ) from exc


# FastAPI dependencies

async def get_current_user(
    credentials: Optional[HTTPAuthorizationCredentials] = Depends(bearer_scheme),
    db: AsyncSession = Depends(get_db),
):
    """
    Dependency: extracts and validates the Bearer token, returns the User ORM object.
    Raises 401 if missing or invalid.
    """
    if credentials is None:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Not authenticated")

    payload = decode_access_token(credentials.credentials)
    user_id = int(payload["sub"])

    # Lazy import to avoid circular dependency
    from models.users import User

    result = await db.execute(select(User).where(User.id == user_id, User.is_active == True))
    user = result.scalar_one_or_none()

    if user is None:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="User not found or inactive")

    return user


async def get_current_user_optional(
    credentials: Optional[HTTPAuthorizationCredentials] = Depends(bearer_scheme),
    db: AsyncSession = Depends(get_db),
):
    """
    Dependency: like get_current_user but returns None instead of raising 401.
    Use on endpoints that work for both guests and authenticated users.
    """
    if credentials is None:
        return None
    try:
        return await get_current_user(credentials, db)
    except HTTPException:
        return None


def require_role(*roles: str):
    """
    Dependency factory: raises 403 if the current user's role isn't in the allowed list.

    Usage:
        @router.delete("/comments/{id}")
        async def delete(user = Depends(require_role("moderator", "admin"))):
            ...
    """
    async def _check(user=Depends(get_current_user)):
        if user.role not in roles:
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Insufficient permissions")
        return user
    return _check
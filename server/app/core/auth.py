import os
import json
import time
import uuid
import logging
import jwt
import hashlib
from datetime import datetime, timedelta, timezone
from enum import Enum
from typing import Optional

from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from jwt.exceptions import InvalidTokenError
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.config.settings import settings
from app.db.database import get_db
from app.core.cache import redis_client

logger = logging.getLogger(__name__)

# Config

SECRET_KEY: str = os.getenv("JWT_SECRET_KEY", "")
ALGORITHM: str = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES: int = settings.ACCESS_TOKEN_EXPIRE_MINUTES
REFRESH_TOKEN_EXPIRE_DAYS: int = settings.REFRESH_TOKEN_EXPIRE_DAYS

if not SECRET_KEY:
    raise RuntimeError("JWT_SECRET_KEY environment variable is not set")

# Below 1, every session would be refused at its first refresh.
if settings.SESSION_MAX_AGE_DAYS < 1:
    raise RuntimeError("SESSION_MAX_AGE_DAYS must be at least 1")

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
# No try/except around Redis in these on purpose: token state must not fail
# open. An outage raises and surfaces as error_handler's 503 — the opposite of
# core/cache.py's degrade-to-Postgres.

def _hash_token(token: str) -> str:
    return hashlib.sha256(token.encode()).hexdigest()

def _refresh_key(user_id: int, token: str) -> str:
    return f"refresh:{user_id}:{_hash_token(token)}"


# Session value
# Each refresh key's value carries the start of its session, copied into the
# successor at every rotation, so the absolute lifetime survives rotation. It is a
# JSON object on purpose: every key minted before this shape holds the literal
# "1", which json.loads reads as the int 1, never a dict, so a legacy value can
# never pass for an epoch in 1970 and sign its owner out.

SESSION_VALUE_VERSION = 1


def encode_session_value(start: int) -> str:
    return json.dumps({"v": SESSION_VALUE_VERSION, "start": start}, separators=(",", ":"))


def session_start_from_value(value: str) -> int | None:
    """The session start this code wrote, or None for any value it did not write
    (the legacy "1", or anything unreadable). The route treats None as a session
    starting now, never as a refusal."""
    try:
        data = json.loads(value)
    except ValueError:
        return None
    if not isinstance(data, dict):
        return None
    version, start = data.get("v"), data.get("start")
    # type() rather than isinstance: True == 1, so a bool would pass as the
    # version, or as a start in 1970.
    if type(version) is not int or version != SESSION_VALUE_VERSION:
        return None
    if type(start) is not int or start <= 0:
        return None
    return start


def session_cap_exceeded(start: int) -> bool:
    """True once the session is older than SESSION_MAX_AGE_DAYS. The setting is
    read at call time, like the grace. A start in the future (clock skew) never
    reads as expired."""
    return time.time() - start > settings.SESSION_MAX_AGE_DAYS * 24 * 60 * 60


async def store_refresh_token(user_id: int, token: str, session_start: int | None = None) -> None:
    """Persist refresh token in Redis with TTL. A rotation passes the start of the
    session it continues; a new login passes nothing and the clock starts now."""
    key = _refresh_key(user_id, token)
    ttl = REFRESH_TOKEN_EXPIRE_DAYS * 24 * 60 * 60
    start = int(time.time()) if session_start is None else session_start
    await redis_client.setex(key, ttl, encode_session_value(start))


async def validate_refresh_token(user_id: int, token: str) -> str | None:
    """The token's stored value, or None if the token is gone."""
    key = _refresh_key(user_id, token)
    return await redis_client.get(key)


async def revoke_refresh_token(user_id: int, token: str) -> None:
    """Delete a single refresh token (logout)."""
    key = _refresh_key(user_id, token)
    await redis_client.delete(key)


# On rotation the old token is demoted, not deleted, so a browser that never
# received the rotation response can retry inside the grace window instead of
# being bricked. One script rather than TTL then EXPIRE: two refreshes racing
# on one cookie could both read the full TTL between the awaits and both mint.
_DEMOTE_LUA = """
local ttl = redis.call('TTL', KEYS[1])
if ttl == -2 then
  return -2
end
redis.call('EXPIRE', KEYS[1], ARGV[1])
return ttl
"""


async def demote_refresh_token(user_id: int, token: str) -> int:
    """Clamp a rotated-out token's TTL to the grace window, atomically, and
    return its TTL before clamping: -2 if the key was already gone, in which
    case nothing is written. The value is never read or written. The script
    object is built per call so the tests' per-fixture patch of redis_client
    reaches it; the grace is read from settings at call time for the same
    reason."""
    key = _refresh_key(user_id, token)
    script = redis_client.register_script(_DEMOTE_LUA)
    return int(await script(keys=[key], args=[settings.REFRESH_GRACE_SECONDS]))


class RotationOutcome(str, Enum):
    GONE = "gone"                # the key vanished between the route's GET and the demote
    GRACE_RETRY = "grace_retry"  # a superseded token retried inside its grace window
    ROTATED = "rotated"          # a first-time rotation


def classify_rotation(prior_ttl: int) -> RotationOutcome:
    """Name what demote_refresh_token's return means, so the route dispatches on
    an outcome instead of comparing TTLs inline."""
    if prior_ttl == -2:
        return RotationOutcome.GONE
    if 0 < prior_ttl <= settings.REFRESH_GRACE_SECONDS:
        return RotationOutcome.GRACE_RETRY
    return RotationOutcome.ROTATED


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
            raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Your session is invalid. Please sign in again.")
        return payload
    except InvalidTokenError as exc:
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
    from app.models.users import User

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
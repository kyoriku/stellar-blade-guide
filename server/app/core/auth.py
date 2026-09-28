import os
import json
import re
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


def new_session_id() -> str:
    return uuid.uuid4().hex


def create_refresh_token(sid: str) -> str:
    """Create an opaque refresh token, "{sid}.{secret}". Stored in Redis, not a
    JWT. The session id survives rotation (the successor reuses it), which is
    what lets a rotated-away token be recognised after its own key is gone."""
    return f"{sid}.{uuid.uuid4()}"


# Redis helpers
# No try/except around Redis in these on purpose: token state must not fail
# open. An outage raises and surfaces as error_handler's 503 — the opposite of
# core/cache.py's degrade-to-Postgres.

def _hash_token(token: str) -> str:
    return hashlib.sha256(token.encode()).hexdigest()

def _refresh_key(user_id: int, token: str) -> str:
    return f"refresh:{user_id}:{_hash_token(token)}"


# One key per session, under the swept prefix, so logout-all, a password change
# or reset and account deletion end every session with no code of their own. Its
# presence is what "this session is still signed in" means.
def _family_key(user_id: int, sid: str) -> str:
    return f"refresh:{user_id}:family:{sid}"


_SID_RE = re.compile(r"[0-9a-f]{32}")


def session_id_from_token(token: str) -> str | None:
    """The session id a token names, or None for a legacy token (a dotless uuid4
    from before session ids) or anything else not minted here."""
    sid, dot, _ = token.partition(".")
    return sid if dot and _SID_RE.fullmatch(sid) else None


def _refresh_ttl() -> int:
    return REFRESH_TOKEN_EXPIRE_DAYS * 24 * 60 * 60


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
    start = int(time.time()) if session_start is None else session_start
    await redis_client.setex(key, _refresh_ttl(), encode_session_value(start))


async def validate_refresh_token(user_id: int, token: str) -> str | None:
    """The token's stored value, or None if the token is gone."""
    key = _refresh_key(user_id, token)
    return await redis_client.get(key)


async def start_session_family(user_id: int, sid: str) -> None:
    await redis_client.set(_family_key(user_id, sid), "1", ex=_refresh_ttl())


async def revoke_session_family(user_id: int, sid: str) -> bool:
    """End a session. True if it was still alive, which is what makes a gone
    token's return a reuse rather than an idle expiry."""
    return await redis_client.delete(_family_key(user_id, sid)) == 1


async def revoke_refresh_token(user_id: int, token: str) -> None:
    """Delete a single refresh token (logout, the absolute cap) and, when the
    token names its session, the session's family in the same DEL, so a grace
    predecessor or a fork of it cannot mint afterwards."""
    keys = [_refresh_key(user_id, token)]
    sid = session_id_from_token(token)
    if sid is not None:
        keys.append(_family_key(user_id, sid))
    await redis_client.delete(*keys)


# On rotation the old token is demoted, not deleted, so a browser that never
# received the rotation response can retry inside the grace window instead of
# being bricked. One script rather than TTL then EXPIRE: two refreshes racing
# on one cookie could both read the full TTL between the awaits and both mint.
# A token already inside its grace is not clamped again, so the grace counts
# from the first rotation: re-arming it on every touch let anyone polling a
# copied cookie hold it in grace for good, and its owner's next refresh would
# never read as a reuse.
# KEYS[2], the session's family, is passed only for a token that names its
# session. A live token whose family is gone belongs to a session that has
# ended, so it is deleted and refused (-3). Otherwise the family is re-armed to
# the token TTL before the successor is written, so it always expires just
# before the newest token and an idle browser never reads as a reuse.
_DEMOTE_LUA = """
local ttl = redis.call('TTL', KEYS[1])
if ttl == -2 then
  return -2
end
if KEYS[2] then
  if redis.call('EXISTS', KEYS[2]) == 0 then
    redis.call('DEL', KEYS[1])
    return -3
  end
  redis.call('EXPIRE', KEYS[2], ARGV[2])
end
if ttl == -1 or ttl > tonumber(ARGV[1]) then
  redis.call('EXPIRE', KEYS[1], ARGV[1])
end
return ttl
"""


async def demote_refresh_token(user_id: int, token: str) -> int:
    """Clamp a rotated-out token's TTL to the grace window, atomically, never
    extending one already inside it, and return its TTL before clamping: -2 if the key was already gone, in which
    case nothing is written, or -3 if its session had ended, in which case the
    token key is deleted. The value is never read or written. The script
    object is built per call so the tests' per-fixture patch of redis_client
    reaches it; the grace is read from settings at call time for the same
    reason."""
    key = _refresh_key(user_id, token)
    sid = session_id_from_token(token)
    keys = [key] if sid is None else [key, _family_key(user_id, sid)]
    script = redis_client.register_script(_DEMOTE_LUA)
    return int(await script(keys=keys, args=[settings.REFRESH_GRACE_SECONDS, _refresh_ttl()]))


class RotationOutcome(str, Enum):
    GONE = "gone"                # the key vanished between the route's GET and the demote
    FAMILY_GONE = "family_gone"  # the token was live but its session had ended; the script deleted it
    GRACE_RETRY = "grace_retry"  # a superseded token retried inside its grace window
    ROTATED = "rotated"          # a first-time rotation


def classify_rotation(prior_ttl: int) -> RotationOutcome:
    """Name what demote_refresh_token's return means, so the route dispatches on
    an outcome instead of comparing TTLs inline. -3 is named before the
    fall-through, or a refused token would read as ROTATED and mint."""
    if prior_ttl == -2:
        return RotationOutcome.GONE
    if prior_ttl == -3:
        return RotationOutcome.FAMILY_GONE
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
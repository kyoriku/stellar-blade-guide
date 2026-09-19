"""
OAuth `state`: CSRF protection for the provider callbacks.

Two halves, and the hole stays open with either one alone:

  cookie  binds the flow to the browser that started it. A server-side record
          cannot do that: an attacker holds a valid unused state for their own
          flow and can hand it to a victim together with their own code.
  Redis   is the record of validity: expiry, single use, and which provider the
          state was issued for. A cookie cannot do that: clearing one is a
          request to the browser, not something the server can enforce.
"""
import hmac
import secrets

from fastapi import Request, Response

from app.config.settings import settings
# Looked up at call time, not imported by value, so the test suite's patch of
# app.core.cache.redis_client reaches this module without a patch of its own.
from app.core import cache

# The one number. Redis TTL and cookie Max-Age both read it, so the two halves
# cannot drift. Long enough for a password manager and a 2FA prompt at the
# provider, short enough that an abandoned flow does not linger.
OAUTH_STATE_TTL = 10 * 60

OAUTH_STATE_COOKIE = "oauth_state"

REASON_MISSING = "oauth-state-missing"
REASON_NO_COOKIE = "oauth-state-no-cookie"
REASON_MISMATCH = "oauth-state-mismatch"
REASON_UNKNOWN = "oauth-state-unknown"
REASON_REPLAYED = "oauth-state-replayed"

# Decided before the cookie has matched, so the cookie is left alone: it belongs
# to some other flow (or to nobody), and a forged callback must not be able to
# knock out the victim's own in-flight login.
COOKIE_UNTOUCHED_REASONS = frozenset({REASON_MISSING, REASON_NO_COOKIE, REASON_MISMATCH})

_PENDING = "pending"
_USED = "used"


def _state_key(provider: str, state: str) -> str:
    # Provider is part of the key so a state issued for one provider cannot be
    # spent at the other's callback.
    return f"oauth_state:{provider}:{state}"


def _cookie_scope() -> dict:
    # Same Domain and Path as the refresh cookie (services/auth.py). The Domain
    # lets a flow that starts on www finish on the apex redirect URI, and set and
    # clear must agree byte for byte or the clear is a silent no-op.
    is_prod = settings.ENVIRONMENT == "production"
    return {"domain": ".stellarbladeguide.com" if is_prod else None, "path": "/api/auth"}


async def issue_oauth_state(provider: str) -> str:
    """Create and record a pending state. No try/except around Redis: like the
    refresh-token helpers this fails closed, and error_handler answers 503."""
    state = secrets.token_urlsafe(32)
    await cache.redis_client.setex(_state_key(provider, state), OAUTH_STATE_TTL, _PENDING)
    return state


def set_oauth_state_cookie(response: Response, state: str) -> None:
    # Lax, not Strict: the provider's redirect back to the callback is a
    # cross-site top-level GET, which Lax sends and Strict withholds.
    response.set_cookie(
        key=OAUTH_STATE_COOKIE,
        value=state,
        httponly=True,
        secure=settings.ENVIRONMENT == "production",
        samesite="lax",
        max_age=OAUTH_STATE_TTL,
        **_cookie_scope(),
    )


def clear_oauth_state_cookie(response: Response) -> None:
    response.delete_cookie(key=OAUTH_STATE_COOKIE, **_cookie_scope())


def clear_oauth_state_cookie_headers() -> dict[str, str]:
    """Delete-cookie header for HTTPException responses, where headers set on the
    injected Response are dropped (same reason as clear_refresh_cookie_headers)."""
    response = Response()
    clear_oauth_state_cookie(response)
    return {"Set-Cookie": response.headers["set-cookie"]}


async def consume_oauth_state(request: Request, provider: str, state: str | None) -> str | None:
    """None when the state verifies (and is now spent); otherwise the reason.

    The three checks that need no Redis run first, so a flood of junk callbacks
    never reaches it.
    """
    if not state:
        return REASON_MISSING
    cookie = request.cookies.get(OAUTH_STATE_COOKIE)
    if not cookie:
        return REASON_NO_COOKIE
    # Bytes, because compare_digest raises TypeError on non-ASCII str and both
    # values are whatever the client sent.
    if not hmac.compare_digest(cookie.encode(), state.encode()):
        return REASON_MISMATCH

    # One atomic command: read the old value and tombstone it. XX is load bearing:
    # without it a miss would CREATE the key, and KEEPTTL on a new key means no TTL
    # at all. The tombstone inherits the remaining TTL, so it expires when the
    # state would have.
    previous = await cache.redis_client.set(
        _state_key(provider, state), _USED, xx=True, keepttl=True, get=True,
    )
    if previous is None:
        # Never issued, or issued and expired. Redis cannot tell these apart once
        # the key is gone, so the log does not pretend to.
        return REASON_UNKNOWN
    if previous != _PENDING:
        return REASON_REPLAYED
    return None

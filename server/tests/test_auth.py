"""
Tests for auth flow: register, login, token refresh, logout, and protected routes.

Uses the same SQLite-in-memory strategy as other test files, with its own fixture
chain because the User/OAuthAccount tables aren't in conftest's create_all.

fakeredis: conftest.py's autouse patch_redis patches app.core.cache.redis_client.
app/core/auth.py's token helpers (store_refresh_token, validate_refresh_token,
revoke_refresh_token) import redis_client directly from app.core.cache, giving
app.core.auth its own binding. The auth_client fixture patches that binding too so
all token operations hit the same in-memory FakeRedis.
"""

from __future__ import annotations

import logging
from types import SimpleNamespace
from unittest.mock import AsyncMock
from urllib.parse import parse_qs, urlsplit

import httpx
import pytest
import pytest_asyncio
import jwt
from datetime import datetime, timedelta, timezone

from fastapi import Depends, FastAPI
from fastapi.responses import JSONResponse
from httpx import AsyncClient, ASGITransport
from redis.exceptions import ConnectionError as RedisConnectionError
from sqlalchemy import select
from sqlalchemy.ext.asyncio import create_async_engine, async_sessionmaker, AsyncSession

import app.core.auth as core_auth
import app.core.cache as core_cache
import app.routers.auth as auth_routes
from app.db.database import Base, get_db
from app.core.usernames import username_problem
from app.middleware.logging import add_logging_middleware
from app.services.oauth_state import OAUTH_STATE_COOKIE, OAUTH_STATE_TTL
from app.models.users import User, OAuthAccount  # noqa: F401 — registers tables with Base
from app.middleware.rate_limit import setup_rate_limiter
from app.middleware.exception_handlers import add_exception_handlers
from app.routers.auth import router as auth_router
from app.services.auth import hash_password, user_to_dict
from app.services.users import user_to_response
from app.core.auth import get_current_user, SECRET_KEY, ALGORITHM


def _make_auth_app(db_session: AsyncSession) -> FastAPI:
    app = FastAPI()
    setup_rate_limiter(app)
    add_exception_handlers(app)

    async def override_get_db():
        yield db_session

    app.dependency_overrides[get_db] = override_get_db
    app.include_router(auth_router, prefix="/api")

    @app.get("/api/test-protected")
    async def _stub(user=Depends(get_current_user)):
        return JSONResponse({"user_id": user.id})

    return app


@pytest_asyncio.fixture
async def auth_db_engine():
    engine = create_async_engine("sqlite+aiosqlite:///:memory:", echo=False)
    async with engine.begin() as conn:
        await conn.run_sync(
            Base.metadata.create_all,
            tables=[User.__table__, OAuthAccount.__table__],
        )
    yield engine
    await engine.dispose()


@pytest_asyncio.fixture
async def auth_db_session(auth_db_engine):
    factory = async_sessionmaker(auth_db_engine, class_=AsyncSession, expire_on_commit=False)
    async with factory() as session:
        yield session


@pytest_asyncio.fixture
async def auth_client(auth_db_session, monkeypatch, fake_redis):
    monkeypatch.setattr(core_auth, "redis_client", fake_redis)
    async with AsyncClient(
        transport=ASGITransport(_make_auth_app(auth_db_session)),
        base_url="http://test",
    ) as c:
        yield c


@pytest_asyncio.fixture
async def test_user(auth_db_session):
    user = User(
        email="testuser@example.com",
        username="testuser",
        password_hash=hash_password("password123"),
    )
    auth_db_session.add(user)
    await auth_db_session.commit()
    await auth_db_session.refresh(user)
    return user


@pytest_asyncio.fixture
async def authenticated_client(auth_db_session, test_user, monkeypatch, fake_redis):
    monkeypatch.setattr(core_auth, "redis_client", fake_redis)
    app = _make_auth_app(auth_db_session)
    async with AsyncClient(transport=ASGITransport(app), base_url="http://test") as login_c:
        r = await login_c.post(
            "/api/auth/login",
            json={"email": test_user.email, "password": "password123"},
        )
        token = r.json()["access_token"]
    async with AsyncClient(
        transport=ASGITransport(app),
        base_url="http://test",
        headers={"Authorization": f"Bearer {token}"},
    ) as c:
        yield c


# ── Registration ──────────────────────────────────────────────────────────────

async def test_register_new_user_returns_token(auth_client):
    r = await auth_client.post("/api/auth/register", json={
        "email": "newuser@example.com",
        "username": "newuser",
        "password": "password123",
    })
    assert r.status_code == 201
    body = r.json()
    assert "access_token" in body
    assert body["token_type"] == "bearer"
    assert "user" in body
    assert "refresh_token" in r.cookies


async def test_register_duplicate_email_returns_409(auth_client, test_user):
    r = await auth_client.post("/api/auth/register", json={
        "email": test_user.email,
        "username": "otherusername",
        "password": "password123",
    })
    assert r.status_code == 409


async def test_register_invalid_password_returns_422(auth_client):
    r = await auth_client.post("/api/auth/register", json={
        "email": "short@example.com",
        "username": "shortpass",
        "password": "abc",
    })
    assert r.status_code == 422


async def test_register_invalid_email_returns_friendly_message(auth_client):
    r = await auth_client.post("/api/auth/register", json={
        "email": "not-an-email",
        "username": "bademail",
        "password": "password123",
    })
    assert r.status_code == 422
    # Custom message instead of the email-validator library default. The app's
    # RequestValidationError handler flattens 422s to a single string detail.
    assert "Please enter a valid email address" in r.json()["detail"]


async def test_register_normalizes_email_domain(auth_client):
    # FriendlyEmail must preserve EmailStr's normalization (lowercased domain,
    # stripped) so uniqueness lookups keep working.
    r = await auth_client.post("/api/auth/register", json={
        "email": "  Mixed@EXAMPLE.COM  ",
        "username": "mixedcase",
        "password": "password123",
    })
    assert r.status_code == 201
    assert r.json()["user"]["email"] == "Mixed@example.com"


# ── Login ─────────────────────────────────────────────────────────────────────

async def test_login_valid_credentials_returns_token(auth_client, test_user):
    r = await auth_client.post("/api/auth/login", json={
        "email": test_user.email,
        "password": "password123",
    })
    assert r.status_code == 200
    body = r.json()
    assert "access_token" in body
    assert body["token_type"] == "bearer"
    assert "refresh_token" in r.cookies


async def test_login_wrong_password_returns_401(auth_client, test_user):
    r = await auth_client.post("/api/auth/login", json={
        "email": test_user.email,
        "password": "wrongpassword",
    })
    assert r.status_code == 401


async def test_login_nonexistent_email_returns_401(auth_client):
    r = await auth_client.post("/api/auth/login", json={
        "email": "nobody@example.com",
        "password": "password123",
    })
    assert r.status_code == 401


# ── Token refresh ─────────────────────────────────────────────────────────────

async def test_refresh_valid_cookie_returns_new_token(auth_client, test_user):
    await auth_client.post("/api/auth/login", json={
        "email": test_user.email,
        "password": "password123",
    })
    r = await auth_client.post("/api/auth/refresh")
    assert r.status_code == 200
    assert "access_token" in r.json()


async def test_refresh_missing_cookie_returns_401(auth_client):
    r = await auth_client.post("/api/auth/refresh")
    assert r.status_code == 401


async def test_refresh_revoked_token_returns_401(auth_client, test_user):
    r_login = await auth_client.post("/api/auth/login", json={
        "email": test_user.email,
        "password": "password123",
    })
    # Capture raw cookie value before logout clears the client jar
    saved_value = r_login.cookies["refresh_token"]

    # Logout revokes the token in Redis and clears it from auth_client.cookies
    await auth_client.post("/api/auth/logout")

    # Re-send the revoked cookie as a raw header — cookies added to httpx's jar
    # via cookies.set(domain="test") are silently never sent to the dotless
    # "test" host, so the jar route would pass via the no-cookie branch instead.
    r = await auth_client.post(
        "/api/auth/refresh",
        headers={"Cookie": f"refresh_token={saved_value}"},
    )
    assert r.status_code == 401
    # Pin the branch: revoked-in-Redis, not missing/malformed cookie
    assert r.json()["detail"] == "Refresh token invalid or expired"


async def test_refresh_revoked_401_clears_cookie(auth_client, test_user):
    r_login = await auth_client.post("/api/auth/login", json={
        "email": test_user.email,
        "password": "password123",
    })
    saved_value = r_login.cookies["refresh_token"]
    await auth_client.post("/api/auth/logout")

    r = await auth_client.post(
        "/api/auth/refresh",
        headers={"Cookie": f"refresh_token={saved_value}"},
    )
    assert r.status_code == 401
    assert r.json()["detail"] == "Refresh token invalid or expired"
    # The definitive rejection must expire the dead cookie, or the browser
    # re-presents it on every visit for up to 7 days. Path must match the
    # set/clear lockstep invariant in services/auth.py.
    cookie = r.headers.get("set-cookie", "")
    assert cookie.startswith("refresh_token=")
    assert "Max-Age=0" in cookie
    assert "Path=/api/auth" in cookie


async def test_refresh_malformed_cookie_401_clears_cookie(auth_client):
    r = await auth_client.post(
        "/api/auth/refresh",
        headers={"Cookie": "refresh_token=garbage-without-a-colon"},
    )
    assert r.status_code == 401
    assert r.json()["detail"] == "Your session is invalid. Please sign in again."
    cookie = r.headers.get("set-cookie", "")
    assert cookie.startswith("refresh_token=")
    assert "Max-Age=0" in cookie
    assert "Path=/api/auth" in cookie


async def test_refresh_rotation_demotes_old_token_with_grace_ttl(auth_client, test_user, fake_redis):
    r_login = await auth_client.post("/api/auth/login", json={
        "email": test_user.email,
        "password": "password123",
    })
    old_value = r_login.cookies["refresh_token"]

    r1 = await auth_client.post("/api/auth/refresh")
    assert r1.status_code == 200

    # Rotation demotes rather than deletes: the old key survives with its TTL
    # clamped to the grace window
    user_id_str, raw_token = old_value.split(":", 1)
    key = core_auth._refresh_key(int(user_id_str), raw_token)
    ttl = await fake_redis.ttl(key)
    assert 0 < ttl <= core_auth.ROTATION_GRACE_SECONDS

    # A client that never received the rotation response (tab closed mid-refresh,
    # network drop) retries with the old cookie and recovers. Clear the jar — it
    # now holds the rotated cookie — and re-send the old value as a raw header
    # (see the revoked-token test above for why the jar can't be used).
    auth_client.cookies.clear()
    r2 = await auth_client.post(
        "/api/auth/refresh",
        headers={"Cookie": f"refresh_token={old_value}"},
    )
    assert r2.status_code == 200
    assert "access_token" in r2.json()


async def test_refresh_after_grace_expiry_returns_401(auth_client, test_user, fake_redis):
    r_login = await auth_client.post("/api/auth/login", json={
        "email": test_user.email,
        "password": "password123",
    })
    old_value = r_login.cookies["refresh_token"]

    r1 = await auth_client.post("/api/auth/refresh")
    assert r1.status_code == 200

    # Fast-forward past the grace window: the demoted key has expired
    user_id_str, raw_token = old_value.split(":", 1)
    await fake_redis.delete(core_auth._refresh_key(int(user_id_str), raw_token))

    auth_client.cookies.clear()
    r2 = await auth_client.post(
        "/api/auth/refresh",
        headers={"Cookie": f"refresh_token={old_value}"},
    )
    assert r2.status_code == 401
    assert r2.json()["detail"] == "Refresh token invalid or expired"


# ── Logout ────────────────────────────────────────────────────────────────────

async def test_logout_returns_204(auth_client, test_user):
    await auth_client.post("/api/auth/login", json={
        "email": test_user.email,
        "password": "password123",
    })
    r = await auth_client.post("/api/auth/logout")
    assert r.status_code == 204


async def test_logout_all_sweeps_demoted_grace_token(auth_client, test_user, fake_redis):
    # Explicit revocation must beat the rotation grace window: a token still in
    # its grace window (demoted, not deleted) has to die on logout-all, or a
    # "sign out everywhere" leaves a live token for up to the grace TTL.
    r_login = await auth_client.post("/api/auth/login", json={
        "email": test_user.email,
        "password": "password123",
    })
    old_value = r_login.cookies["refresh_token"]

    r1 = await auth_client.post("/api/auth/refresh")
    assert r1.status_code == 200
    access_token = r1.json()["access_token"]

    # The old token is now demoted (grace TTL), not gone.
    user_id_str, raw_token = old_value.split(":", 1)
    demoted_key = core_auth._refresh_key(int(user_id_str), raw_token)
    assert 0 < await fake_redis.ttl(demoted_key) <= core_auth.ROTATION_GRACE_SECONDS

    r = await auth_client.post(
        "/api/auth/logout-all",
        headers={"Authorization": f"Bearer {access_token}"},
    )
    assert r.status_code == 204

    # The wildcard sweep took the demoted key too, so re-presenting the
    # grace-window token now 401s instead of recovering.
    assert await fake_redis.get(demoted_key) is None
    auth_client.cookies.clear()
    r2 = await auth_client.post(
        "/api/auth/refresh",
        headers={"Cookie": f"refresh_token={old_value}"},
    )
    assert r2.status_code == 401
    assert r2.json()["detail"] == "Refresh token invalid or expired"


# ── Protected route ───────────────────────────────────────────────────────────

async def test_protected_valid_token_returns_200(authenticated_client):
    r = await authenticated_client.get("/api/test-protected")
    assert r.status_code == 200
    assert "user_id" in r.json()


async def test_protected_no_header_returns_401(auth_client):
    r = await auth_client.get("/api/test-protected")
    assert r.status_code == 401


async def test_protected_malformed_header_returns_401(auth_client):
    r = await auth_client.get("/api/test-protected", headers={"Authorization": "Token abc123"})
    assert r.status_code == 401


async def test_protected_expired_token_returns_401(auth_client, test_user):
    expired_token = jwt.encode(
        {
            "sub": str(test_user.id),
            "role": test_user.role,
            "type": "access",
            "exp": datetime.now(timezone.utc) - timedelta(seconds=1),
            "iat": datetime.now(timezone.utc) - timedelta(hours=1),
        },
        SECRET_KEY,
        algorithm=ALGORITHM,
    )
    r = await auth_client.get(
        "/api/test-protected",
        headers={"Authorization": f"Bearer {expired_token}"},
    )
    assert r.status_code == 401


# ── OAuth state (login CSRF) ─────────────────────────────────────────────────
#
# Without `state`, an attacker can start a login, keep their own authorization
# code, and get a victim's browser to finish the callback with it: the victim is
# now signed in to the attacker's account. The fix has two halves and these tests
# pin both. The cookie binds the flow to the browser that started it; Redis is
# the record of validity (expiry, single use, which provider). A valid Redis
# record on its own is NOT enough, which is what the no-cookie test is for.
#
# Both providers run through one helper, so every test runs for both.

PROVIDERS = ["google", "discord"]

AUTHORIZE_PREFIX = {
    # Everything before &state= must stay byte-identical to what the providers
    # were sent before this change.
    "google": (
        "https://accounts.google.com/o/oauth2/v2/auth"
        "?client_id=test-google-id&redirect_uri=http://test/api/auth/google/callback"
        "&response_type=code&scope=openid%20email%20profile&access_type=offline&state="
    ),
    "discord": (
        "https://discord.com/api/oauth2/authorize"
        "?client_id=test-discord-id&redirect_uri=http://test/api/auth/discord/callback"
        "&response_type=code&scope=identify%20email&state="
    ),
}

def _assert_refused(r, code: str, provider: str) -> None:
    """A refused callback is a browser navigation, so it is a redirect to the login
    page rather than a JSON body. 303, not the success path's 307, so the two stay
    distinguishable on the access line. The exact match is the point: a coarse
    public code and the provider name, and nothing from the request."""
    assert r.status_code == 303
    assert r.headers["location"] == f"http://test/login?oauth_error={code}&provider={provider}"


class _FakeProvider:
    """Recording stand-in for the httpx.AsyncClient the callbacks open. Answers
    the token exchange and the userinfo read for either provider, and keeps every
    call, so 'the provider was never contacted' is simply `calls == []`."""

    def __init__(self):
        self.calls = []
        # Tests mutate this. It defaults to a verified email under both providers'
        # spellings (Google's v2 endpoint says verified_email, Discord says
        # verified), so a test that is not about the flag gets an ordinary login.
        self.userinfo = {
            "id": "provider-user-1",
            "email": "oauth@example.com",
            "verified_email": True,
            "verified": True,
            "name": "OAuth User",       # Google's field
            "username": "oauthuser",    # Discord's field
        }
        self.token_status = 200
        self.userinfo_status = 200

    def __call__(self, **kwargs):  # httpx.AsyncClient(timeout=10)
        return self

    async def __aenter__(self):
        return self

    async def __aexit__(self, *exc):
        return False

    async def post(self, url, **kwargs):
        self.calls.append(("POST", url, kwargs.get("data", {})))
        return httpx.Response(self.token_status, json={"access_token": "provider-token"})

    async def get(self, url, **kwargs):
        self.calls.append(("GET", url, {}))
        return httpx.Response(self.userinfo_status, json=self.userinfo)


@pytest_asyncio.fixture
async def oauth(auth_db_session, monkeypatch, fake_redis):
    # store_refresh_token on the success path goes through core_auth's by-value
    # binding. The state helpers read app.core.cache.redis_client at call time, so
    # conftest's autouse patch already covers them.
    monkeypatch.setattr(core_auth, "redis_client", fake_redis)

    # The router copies its provider config at import, and CI has no server/.env.
    for name, value in {
        "GOOGLE_CLIENT_ID": "test-google-id",
        "GOOGLE_CLIENT_SECRET": "test-google-secret",
        "GOOGLE_REDIRECT_URI": "http://test/api/auth/google/callback",
        "DISCORD_CLIENT_ID": "test-discord-id",
        "DISCORD_CLIENT_SECRET": "test-discord-secret",
        "DISCORD_REDIRECT_URI": "http://test/api/auth/discord/callback",
        "FRONTEND_URL": "http://test",
    }.items():
        monkeypatch.setattr(auth_routes, name, value)

    # Swap the router's own `httpx` name rather than httpx.AsyncClient itself, so
    # the test client below keeps the real one.
    provider = _FakeProvider()
    monkeypatch.setattr(auth_routes, "httpx", SimpleNamespace(AsyncClient=provider))

    app = _make_auth_app(auth_db_session)
    seen = {}

    @app.middleware("http")
    async def probe(request, call_next):
        response = await call_next(request)
        seen["reject_reason"] = getattr(request.state, "reject_reason", None)
        return response

    add_logging_middleware(app)  # outermost, as in main.py

    async with AsyncClient(transport=ASGITransport(app), base_url="http://test") as c:
        yield SimpleNamespace(
            client=c, app=app, seen=seen, provider=provider, redis=fake_redis, db=auth_db_session,
        )


@pytest.fixture
def api_log(caplog):
    """The `api` logger does not propagate in production; force it on so caplog's
    root handler sees access lines (same fixture as test_logging.py)."""
    api_logger = logging.getLogger("api")
    previous = api_logger.propagate
    api_logger.propagate = True
    with caplog.at_level(logging.DEBUG):
        yield caplog
    api_logger.propagate = previous


def _app_records(caplog):
    """Records from the application's own loggers: `api` (the access log) and
    `app.*`. The fixture forces DEBUG on everything so nothing is missed, which also
    switches on the test client's request line (`httpx`) and the SQLite driver's
    statement log (`aiosqlite`, parameters included). Neither is the app's doing, and
    neither exists in production, which runs at INFO on asyncpg."""
    return [rec for rec in caplog.records if rec.name == "api" or rec.name.startswith("app.")]


def _key(provider: str, state: str) -> str:
    return f"oauth_state:{provider}:{state}"


async def _begin(o, provider: str) -> str:
    """Start a login in o.client's browser: returns the state, leaves the cookie
    in the jar."""
    r = await o.client.get(f"/api/auth/{provider}")
    assert r.status_code == 307
    return parse_qs(urlsplit(r.headers["location"]).query)["state"][0]


def _set_cookies(response) -> list[str]:
    return response.headers.get_list("set-cookie")


@pytest.mark.parametrize("provider", PROVIDERS)
async def test_oauth_login_sends_state_and_pins_it_to_the_browser(oauth, provider):
    r = await oauth.client.get(f"/api/auth/{provider}")
    assert r.status_code == 307

    location = r.headers["location"]
    assert location.startswith(AUTHORIZE_PREFIX[provider])
    state = location[len(AUTHORIZE_PREFIX[provider]):]
    assert len(state) >= 43  # token_urlsafe(32)

    (cookie,) = _set_cookies(r)
    assert cookie.startswith(f"{OAUTH_STATE_COOKIE}={state};")
    assert "HttpOnly" in cookie
    assert "SameSite=lax" in cookie  # Strict would be withheld on the provider's redirect back
    assert "Path=/api/auth" in cookie
    # One number for both halves: the cookie cannot outlive the record or vice versa.
    assert f"Max-Age={OAUTH_STATE_TTL}" in cookie

    assert await oauth.redis.get(_key(provider, state)) == "pending"
    assert 0 < await oauth.redis.ttl(_key(provider, state)) <= OAUTH_STATE_TTL


@pytest.mark.parametrize("provider", PROVIDERS)
async def test_oauth_callback_with_valid_state_logs_in_exactly_as_before(oauth, provider):
    state = await _begin(oauth, provider)

    r = await oauth.client.get(f"/api/auth/{provider}/callback", params={"code": "the-code", "state": state})

    assert r.status_code == 307
    assert oauth.seen["reject_reason"] is None
    prefix = "http://test/oauth/callback?token="
    assert r.headers["location"].startswith(prefix)
    payload = jwt.decode(r.headers["location"][len(prefix):], SECRET_KEY, algorithms=[ALGORITHM])
    assert payload["type"] == "access"

    refresh_cookie, state_cookie = _set_cookies(r)
    assert refresh_cookie.startswith("refresh_token=")
    assert "HttpOnly" in refresh_cookie and "Path=/api/auth" in refresh_cookie
    assert state_cookie.startswith(f'{OAUTH_STATE_COOKIE}="";') and "Max-Age=0" in state_cookie

    # Exactly the two provider calls, carrying the code that was presented.
    (exchange, userinfo) = oauth.provider.calls
    assert exchange[0] == "POST" and exchange[2]["code"] == "the-code"
    assert userinfo[0] == "GET"

    assert await oauth.redis.get(_key(provider, state)) == "used"

    # The session it minted is an ordinary one.
    assert (await oauth.client.post("/api/auth/refresh")).status_code == 200


@pytest.mark.parametrize("provider", PROVIDERS)
async def test_oauth_callback_without_state_is_rejected(oauth, provider):
    state = await _begin(oauth, provider)

    r = await oauth.client.get(f"/api/auth/{provider}/callback", params={"code": "the-code"})

    _assert_refused(r, "expired", provider)
    assert oauth.seen["reject_reason"] == "oauth-state-missing"
    assert oauth.provider.calls == []
    assert _set_cookies(r) == []  # the cookie never matched, so it is left alone
    assert await oauth.redis.get(_key(provider, state)) == "pending"


@pytest.mark.parametrize("provider", PROVIDERS)
async def test_oauth_callback_with_wrong_state_is_rejected(oauth, provider):
    state = await _begin(oauth, provider)

    r = await oauth.client.get(
        f"/api/auth/{provider}/callback", params={"code": "the-code", "state": "not-the-state"},
    )

    _assert_refused(r, "expired", provider)
    assert oauth.seen["reject_reason"] == "oauth-state-mismatch"
    assert oauth.provider.calls == []
    # A forged callback must not be able to knock out the victim's own in-flight
    # login: their cookie and their pending state both survive it.
    assert _set_cookies(r) == []
    assert await oauth.redis.get(_key(provider, state)) == "pending"


@pytest.mark.parametrize("provider", PROVIDERS)
async def test_oauth_valid_state_from_another_browser_is_rejected(oauth, provider):
    """The regression test for the bug. The attacker's state is genuinely valid
    and unused in Redis; what the victim's browser lacks is the cookie. A design
    that only checked the server-side record would pass this request."""
    attacker_state = await _begin(oauth, provider)

    async with AsyncClient(transport=ASGITransport(oauth.app), base_url="http://test") as victim:
        r = await victim.get(
            f"/api/auth/{provider}/callback", params={"code": "attackers-code", "state": attacker_state},
        )

    _assert_refused(r, "expired", provider)
    assert oauth.seen["reject_reason"] == "oauth-state-no-cookie"
    assert oauth.provider.calls == []
    assert "refresh_token" not in r.headers.get("set-cookie", "")
    assert await oauth.redis.get(_key(provider, attacker_state)) == "pending"


@pytest.mark.parametrize("provider", PROVIDERS)
async def test_oauth_expired_state_is_rejected(oauth, provider):
    state = await _begin(oauth, provider)
    # Fast-forward past the TTL: the record is gone, the browser still has its cookie.
    await oauth.redis.delete(_key(provider, state))

    r = await oauth.client.get(f"/api/auth/{provider}/callback", params={"code": "the-code", "state": state})

    _assert_refused(r, "expired", provider)
    assert oauth.seen["reject_reason"] == "oauth-state-unknown"
    assert oauth.provider.calls == []
    (cleared,) = _set_cookies(r)  # it matched, so it is spent
    assert cleared.startswith(f'{OAUTH_STATE_COOKIE}="";')


@pytest.mark.parametrize("provider", PROVIDERS)
async def test_oauth_never_issued_state_is_rejected_and_mints_no_key(oauth, provider):
    """Cookie and state agree, but the server never issued them. Pins XX on the
    consume: without it this request would CREATE the key, and KEEPTTL on a new key
    means no TTL, so junk callbacks would mint immortal keys."""
    r = await oauth.client.get(
        f"/api/auth/{provider}/callback",
        params={"code": "the-code", "state": "forged"},
        headers={"Cookie": f"{OAUTH_STATE_COOKIE}=forged"},
    )

    _assert_refused(r, "expired", provider)
    assert oauth.seen["reject_reason"] == "oauth-state-unknown"
    assert oauth.provider.calls == []
    assert await oauth.redis.keys("oauth_state:*") == []


@pytest.mark.parametrize("provider", PROVIDERS)
async def test_oauth_replayed_state_is_rejected(oauth, provider):
    state = await _begin(oauth, provider)
    first = await oauth.client.get(f"/api/auth/{provider}/callback", params={"code": "the-code", "state": state})
    assert first.status_code == 307

    # The success cleared the cookie from the jar, so re-present it as a raw
    # header: clearing a cookie is a request to the browser, and the server-side
    # tombstone is what actually enforces single use.
    oauth.client.cookies.clear()
    r = await oauth.client.get(
        f"/api/auth/{provider}/callback",
        params={"code": "a-fresh-code", "state": state},
        headers={"Cookie": f"{OAUTH_STATE_COOKIE}={state}"},
    )

    _assert_refused(r, "expired", provider)
    assert oauth.seen["reject_reason"] == "oauth-state-replayed"
    assert len(oauth.provider.calls) == 2  # only the first request reached the provider


@pytest.mark.parametrize("provider", PROVIDERS)
async def test_oauth_state_cannot_be_spent_at_the_other_provider(oauth, provider):
    other = "discord" if provider == "google" else "google"
    state = await _begin(oauth, provider)

    r = await oauth.client.get(f"/api/auth/{other}/callback", params={"code": "the-code", "state": state})

    _assert_refused(r, "expired", other)
    assert oauth.seen["reject_reason"] == "oauth-state-unknown"
    assert oauth.provider.calls == []
    assert await oauth.redis.get(_key(provider, state)) == "pending"


@pytest.mark.parametrize("provider", PROVIDERS)
async def test_oauth_provider_error_is_rejected_without_leaking_it(oauth, provider, api_log):
    """The user cancelled at the provider. `error` and `error_description` are
    request-controlled, so only their presence is used: the values reach neither
    the response nor any log line."""
    state = await _begin(oauth, provider)
    params = {"error": "access_denied-MARKER", "error_description": "cancelled-MARKER", "state": state}

    r = await oauth.client.get(f"/api/auth/{provider}/callback", params=params)

    _assert_refused(r, "cancelled", provider)
    assert oauth.seen["reject_reason"] == "oauth-provider-error"
    assert oauth.provider.calls == []
    assert "MARKER" not in r.headers["location"]
    app_records = _app_records(api_log)
    assert app_records  # the access line was captured, so the check below is not vacuous
    assert all("MARKER" not in rec.getMessage() for rec in app_records)

    # The abandoned flow is cleaned up: state spent, cookie cleared.
    assert await oauth.redis.get(_key(provider, state)) == "used"
    (cleared,) = _set_cookies(r)
    assert cleared.startswith(f'{OAUTH_STATE_COOKIE}="";')


@pytest.mark.parametrize("provider", PROVIDERS)
async def test_oauth_provider_error_does_not_excuse_a_bad_state(oauth, provider):
    """Anyone can send ?error=. It only counts once the state has verified."""
    async with AsyncClient(transport=ASGITransport(oauth.app), base_url="http://test") as stranger:
        r = await stranger.get(
            f"/api/auth/{provider}/callback", params={"error": "access_denied", "state": "whatever"},
        )

    _assert_refused(r, "expired", provider)
    assert oauth.seen["reject_reason"] == "oauth-state-no-cookie"


@pytest.mark.parametrize("provider", PROVIDERS)
async def test_oauth_non_ascii_state_is_a_mismatch_not_a_500(oauth, provider):
    """hmac.compare_digest raises TypeError on non-ASCII str, and the state is
    whatever the client sent. Pins the .encode()."""
    await _begin(oauth, provider)

    r = await oauth.client.get(f"/api/auth/{provider}/callback", params={"code": "the-code", "state": "étât"})

    _assert_refused(r, "expired", provider)
    assert oauth.seen["reject_reason"] == "oauth-state-mismatch"


@pytest.mark.parametrize("provider", PROVIDERS)
async def test_oauth_rejection_names_itself_in_the_access_log_and_nothing_else(oauth, provider, api_log):
    state = await _begin(oauth, provider)

    await oauth.client.get(
        f"/api/auth/{provider}/callback", params={"code": "SECRET-CODE", "state": "WRONG-STATE"},
    )

    lines = [rec.getMessage() for rec in api_log.records if rec.name == "api" and " → " in rec.getMessage()]
    assert lines[-1].endswith("(oauth-state-mismatch)\x1b[0m")
    for line in lines:
        assert "SECRET-CODE" not in line
        assert "WRONG-STATE" not in line
        assert state not in line


@pytest.mark.parametrize("provider", PROVIDERS)
async def test_oauth_login_fails_closed_when_redis_is_down(oauth, provider, monkeypatch):
    """Same convention as the refresh-token helpers: the error is not swallowed, so
    error_handler turns it into a 503. A login that went ahead without a recorded
    state could never complete anyway."""
    class _DownRedis:
        async def setex(self, *args, **kwargs):
            raise RedisConnectionError("redis is down")

    monkeypatch.setattr(core_cache, "redis_client", _DownRedis())

    with pytest.raises(RedisConnectionError):
        await oauth.client.get(f"/api/auth/{provider}")


# ── OAuth email linking: only a provider-verified email identifies anyone ─────
#
# The helper resolves a login in three steps: a known provider id, else an
# existing user with the same email (link), else a new user (create). The last
# two trust the email, so they only run for an email the provider has verified.
# Unverified, anyone can put a victim's address on a provider account: the link
# step would hand over the victim's account, and the create step would squat the
# address so the victim's own later login links into it.

VERIFIED_FLAG = {"google": "verified_email", "discord": "verified"}
_MISSING = object()

def _set_flag(o, provider: str, value) -> None:
    """Only the provider under test is changed. The other provider's spelling
    stays True in the payload, so a callback reading the wrong key would pass a
    login these tests expect to be refused."""
    if value is _MISSING:
        o.provider.userinfo.pop(VERIFIED_FLAG[provider], None)
    else:
        o.provider.userinfo[VERIFIED_FLAG[provider]] = value


async def _login(o, provider: str):
    state = await _begin(o, provider)
    return await o.client.get(f"/api/auth/{provider}/callback", params={"code": "the-code", "state": state})


async def _rows(o, model):
    return (await o.db.execute(select(model))).scalars().all()


@pytest.mark.parametrize("provider", PROVIDERS)
async def test_oauth_unverified_email_cannot_take_over_an_existing_account(oauth, provider, test_user):
    """The regression test for the finding. The provider account carries the
    victim's address but never proved it owns it."""
    oauth.provider.userinfo["email"] = test_user.email
    _set_flag(oauth, provider, False)

    r = await _login(oauth, provider)

    _assert_refused(r, "email-unverified", provider)
    assert oauth.seen["reject_reason"] == "oauth-email-unverified"
    # The flag lives in the userinfo, so both provider calls necessarily happened.
    # What matters is that nothing was written or issued afterwards.
    assert len(oauth.provider.calls) == 2
    assert await _rows(oauth, OAuthAccount) == []
    assert await oauth.redis.keys("refresh:*") == []
    assert all("refresh_token" not in c for c in _set_cookies(r))


@pytest.mark.parametrize("provider", PROVIDERS)
async def test_oauth_unverified_email_cannot_squat_an_address(oauth, provider):
    """No account exists yet. Creating one would reserve the address for the
    attacker, and the real owner's later login would link into it."""
    _set_flag(oauth, provider, False)

    r = await _login(oauth, provider)

    _assert_refused(r, "email-unverified", provider)
    assert oauth.seen["reject_reason"] == "oauth-email-unverified"
    assert await _rows(oauth, User) == []
    assert await _rows(oauth, OAuthAccount) == []


@pytest.mark.parametrize("provider", PROVIDERS)
@pytest.mark.parametrize(
    "value",
    [False, None, _MISSING, "true", "false", 1],
    ids=["False", "None", "missing", "str-true", "str-false", "int-1"],
)
async def test_oauth_verified_flag_is_judged_strictly(oauth, provider, value):
    """Parsed JSON, so truthiness is the wrong test: the string "false" is truthy.
    Only the boolean True passes, and an absent flag fails closed."""
    _set_flag(oauth, provider, value)

    r = await _login(oauth, provider)

    _assert_refused(r, "email-unverified", provider)
    assert oauth.seen["reject_reason"] == "oauth-email-unverified"
    assert await _rows(oauth, User) == []


@pytest.mark.parametrize("provider", PROVIDERS)
async def test_oauth_returning_user_is_not_locked_out_by_a_lapsed_flag(oauth, provider):
    """A returning user is matched on the provider's stable id and the email is
    never consulted, so the check must sit after that step, not before it."""
    assert (await _login(oauth, provider)).status_code == 307

    _set_flag(oauth, provider, False)
    r = await _login(oauth, provider)

    assert r.status_code == 307
    assert oauth.seen["reject_reason"] is None
    assert len(await _rows(oauth, User)) == 1


@pytest.mark.parametrize("provider", PROVIDERS)
async def test_oauth_provider_to_provider_linking_is_unchanged(oauth, provider):
    """An account with no password can only have been made by a provider login, so
    its address was proven then. A second provider on the same address still links."""
    other = "discord" if provider == "google" else "google"
    assert (await _login(oauth, other)).status_code == 307

    r = await _login(oauth, provider)

    assert r.status_code == 307
    assert oauth.seen["reject_reason"] is None
    (user,) = await _rows(oauth, User)
    assert user.password_hash is None
    links = await _rows(oauth, OAuthAccount)
    assert sorted(link.provider for link in links) == ["discord", "google"]
    assert {link.user_id for link in links} == {user.id}

    # The next login resolves on the provider id: no third link, no second user.
    assert (await _login(oauth, provider)).status_code == 307
    assert len(await _rows(oauth, OAuthAccount)) == 2
    assert len(await _rows(oauth, User)) == 1


@pytest.mark.parametrize("provider", PROVIDERS)
async def test_oauth_verified_new_user_is_created_as_before(oauth, provider):
    r = await _login(oauth, provider)

    assert r.status_code == 307
    (user,) = await _rows(oauth, User)
    assert user.email == "oauth@example.com"
    assert user.password_hash is None
    (link,) = await _rows(oauth, OAuthAccount)
    assert (link.user_id, link.provider) == (user.id, provider)


@pytest.mark.parametrize("provider", PROVIDERS)
async def test_oauth_unverified_rejection_names_itself_and_never_logs_the_email(oauth, provider, api_log):
    oauth.provider.userinfo["email"] = "victim-MARKER@example.com"
    _set_flag(oauth, provider, False)

    await _login(oauth, provider)

    lines = [rec.getMessage() for rec in api_log.records if rec.name == "api" and " → " in rec.getMessage()]
    assert lines[-1].endswith("(oauth-email-unverified)\x1b[0m")
    app_records = _app_records(api_log)
    assert app_records
    assert all("MARKER" not in rec.getMessage() for rec in app_records)


async def test_discord_without_an_email_is_refused_with_its_own_reason(oauth):
    """A presence test in the callback, before the helper is reached. It used to be
    a reason-less 400; every refusal now names itself in the access log."""
    oauth.provider.userinfo["email"] = None

    r = await _login(oauth, "discord")

    _assert_refused(r, "email-missing", "discord")
    assert oauth.seen["reject_reason"] == "oauth-email-missing"
    assert await _rows(oauth, User) == []


# ── A provider login never links into an account that has a password ─────────
#
# Registration never proves the address, so a password on an account means only
# that someone typed that address into the signup form. Linking a verified
# provider login into it would join the proven owner of the mailbox, silently,
# into an account someone else may hold the password to. The link is refused
# instead, with no writes and no session changes; the mailbox owner can always
# claim the account through Forgot password. An account with no password can only
# have been made by a provider login, so provider to provider linking stays.

async def _password_hash(o, user_id: int):
    """A fresh column read. The app and the test share one session, so an ORM
    attribute would show whatever the request left in the identity map."""
    return (await o.db.execute(select(User.password_hash).where(User.id == user_id))).scalar_one()


@pytest.mark.parametrize("provider", PROVIDERS)
async def test_oauth_link_into_a_password_account_is_refused(oauth, provider, test_user):
    """The regression test for the finding."""
    oauth.provider.userinfo["email"] = test_user.email
    original_hash = await _password_hash(oauth, test_user.id)

    r = await _login(oauth, provider)

    _assert_refused(r, "has-password", provider)
    assert oauth.seen["reject_reason"] == "oauth-email-has-password"
    assert await _rows(oauth, OAuthAccount) == []
    assert await _password_hash(oauth, test_user.id) == original_hash
    assert await oauth.redis.keys("refresh:*") == []
    assert all("refresh_token" not in c for c in _set_cookies(r))


@pytest.mark.parametrize("provider", PROVIDERS)
async def test_oauth_refused_link_leaves_existing_sessions_alone(oauth, provider, test_user):
    """No session changes: whoever is signed in with the password stays signed in."""
    login = await oauth.client.post(
        "/api/auth/login", json={"email": test_user.email, "password": "password123"},
    )
    assert login.status_code == 200
    oauth.provider.userinfo["email"] = test_user.email

    _assert_refused(await _login(oauth, provider), "has-password", provider)

    assert (await oauth.client.post("/api/auth/refresh")).status_code == 200


@pytest.mark.parametrize("provider", PROVIDERS)
async def test_oauth_returning_user_with_a_password_is_untouched(oauth, provider, test_user):
    """A password account that already has this provider linked resolves on the
    provider id, before the link step is ever reached."""
    oauth.db.add(OAuthAccount(user_id=test_user.id, provider=provider, provider_user_id="provider-user-1"))
    await oauth.db.commit()
    oauth.provider.userinfo["email"] = test_user.email
    original_hash = await _password_hash(oauth, test_user.id)

    r = await _login(oauth, provider)

    assert r.status_code == 307
    assert oauth.seen["reject_reason"] is None
    assert await _password_hash(oauth, test_user.id) == original_hash
    assert len(await _rows(oauth, OAuthAccount)) == 1


@pytest.mark.parametrize("provider", PROVIDERS)
async def test_oauth_any_password_blocks_a_new_link(oauth, provider, test_user):
    """The rule is about the password, not about how many providers are linked: a
    password account that already has one provider cannot gain the other."""
    other = "discord" if provider == "google" else "google"
    oauth.db.add(OAuthAccount(user_id=test_user.id, provider=other, provider_user_id="someone-else"))
    await oauth.db.commit()
    oauth.provider.userinfo["email"] = test_user.email

    r = await _login(oauth, provider)

    _assert_refused(r, "has-password", provider)
    (link,) = await _rows(oauth, OAuthAccount)
    assert link.provider == other


@pytest.mark.parametrize("provider", PROVIDERS)
async def test_oauth_has_password_refusal_names_itself_and_never_logs_the_email(oauth, provider, test_user, api_log):
    oauth.provider.userinfo["email"] = test_user.email

    await _login(oauth, provider)

    lines = [rec.getMessage() for rec in api_log.records if rec.name == "api" and " → " in rec.getMessage()]
    # Still named on the access line even though it is a 303 now, not a 400:
    # /api/auth lines always carry the reason.
    assert "303" in lines[-1]
    assert lines[-1].endswith("(oauth-email-has-password)\x1b[0m")
    app_records = _app_records(api_log)
    assert app_records
    assert all(test_user.email not in rec.getMessage() for rec in app_records)


# ── Refusals go to the login page, not to a JSON body ────────────────────────

@pytest.mark.parametrize(
    ("reason", "code"),
    [
        ("oauth-email-has-password", "has-password"),
        ("oauth-email-unverified", "email-unverified"),
        ("oauth-email-missing", "email-missing"),
        ("oauth-provider-error", "cancelled"),
        ("oauth-account-inactive", "deactivated"),
        # One code for every state failure: the guard was built to say nothing
        # about which check failed, and the URL is visible to the user.
        ("oauth-state-missing", "expired"),
        ("oauth-state-no-cookie", "expired"),
        ("oauth-state-mismatch", "expired"),
        ("oauth-state-unknown", "expired"),
        ("oauth-state-replayed", "expired"),
        ("oauth-code-missing", "failed"),
        ("oauth-exchange-failed", "failed"),
        ("oauth-userinfo-failed", "failed"),
        ("something-added-later", "failed"),
        (None, "failed"),
    ],
)
def test_public_oauth_error_code(reason, code):
    assert auth_routes._public_oauth_error(reason) == code


@pytest.mark.parametrize("provider", PROVIDERS)
async def test_oauth_refusal_url_carries_nothing_from_the_request(oauth, provider):
    """_assert_refused already matches the whole Location. This spells out why: every
    request-controlled field is loaded with a marker and none of it reaches the URL."""
    r = await oauth.client.get(
        f"/api/auth/{provider}/callback",
        params={"code": "MARKER", "state": "MARKER", "error": "MARKER", "error_description": "MARKER"},
        headers={"Cookie": f"{OAUTH_STATE_COOKIE}=MARKER"},
    )

    _assert_refused(r, "expired", provider)
    assert "MARKER" not in r.headers["location"]


@pytest.mark.parametrize("provider", PROVIDERS)
async def test_oauth_callback_without_a_code_names_itself(oauth, provider):
    state = await _begin(oauth, provider)

    r = await oauth.client.get(f"/api/auth/{provider}/callback", params={"state": state})

    _assert_refused(r, "failed", provider)
    assert oauth.seen["reject_reason"] == "oauth-code-missing"
    assert oauth.provider.calls == []


@pytest.mark.parametrize("provider", PROVIDERS)
@pytest.mark.parametrize(
    ("attr", "reason", "calls"),
    [("token_status", "oauth-exchange-failed", 1), ("userinfo_status", "oauth-userinfo-failed", 2)],
)
async def test_oauth_provider_refusing_us_names_itself(oauth, provider, attr, reason, calls):
    setattr(oauth.provider, attr, 400)

    r = await _login(oauth, provider)

    _assert_refused(r, "failed", provider)
    assert oauth.seen["reject_reason"] == reason
    assert len(oauth.provider.calls) == calls
    assert await _rows(oauth, User) == []


@pytest.mark.parametrize("provider", PROVIDERS)
async def test_oauth_unconfigured_provider_stays_a_loud_501(oauth, provider, monkeypatch):
    """Our configuration, not a refusal of the user: it is not dressed up as a
    redirect to the login page."""
    state = await _begin(oauth, provider)
    monkeypatch.setattr(auth_routes, f"{provider.upper()}_CLIENT_ID", "")

    r = await oauth.client.get(f"/api/auth/{provider}/callback", params={"code": "the-code", "state": state})

    assert r.status_code == 501
    assert "not configured" in r.json()["detail"]


# ── Provider names go through the site's username rule ───────────────────────
#
# Registration and Settings validate a typed name. The OAuth create step used to store
# the provider's display name unchecked, so a name ending in a zero-width space was a
# different string from an existing username, passed the uniqueness check, and rendered
# exactly like it in a comment thread. The cleaner and the rule are pinned on their own
# in test_usernames.py; these pin what the create step does with them.

NAME_FIELD = {"google": "name", "discord": "username"}


async def _usernames(o) -> list[str]:
    return list((await o.db.execute(select(User.username).order_by(User.id))).scalars())


@pytest.mark.parametrize("provider", PROVIDERS)
async def test_oauth_cannot_create_an_invisible_duplicate_of_an_existing_name(oauth, provider, test_user):
    """The regression test for the finding."""
    oauth.provider.userinfo[NAME_FIELD[provider]] = f"{test_user.username}\u200b"

    assert (await _login(oauth, provider)).status_code == 307

    assert await _usernames(oauth) == ["testuser", "testuser1"]


@pytest.mark.parametrize("provider", PROVIDERS)
async def test_oauth_generated_name_never_differs_from_an_existing_one_only_by_case(oauth, provider, test_user):
    """The site is choosing this name, so it costs the user nothing to keep it from
    landing as "TestUser" beside an existing "testuser"."""
    oauth.provider.userinfo[NAME_FIELD[provider]] = "TestUser"

    assert (await _login(oauth, provider)).status_code == 307

    assert await _usernames(oauth) == ["testuser", "TestUser1"]


@pytest.mark.parametrize("provider", PROVIDERS)
async def test_oauth_username_is_never_taken_from_the_email(oauth, provider):
    """A username is public and the email is shown to nobody but its owner. The old
    fallback published the address's local part when the provider sent no name."""
    oauth.provider.userinfo.pop(NAME_FIELD[provider])
    oauth.provider.userinfo["email"] = "distinctive-local-part@example.com"

    assert (await _login(oauth, provider)).status_code == 307

    (username,) = await _usernames(oauth)
    assert username.startswith("user_")
    assert "distinctive" not in username
    assert username_problem(username) is None


@pytest.mark.parametrize("provider", PROVIDERS)
async def test_oauth_created_name_is_one_settings_would_accept(oauth, provider):
    oauth.provider.userinfo[NAME_FIELD[provider]] = "\U0001f3ae  O'Brien.  \U0001f3ae"

    assert (await _login(oauth, provider)).status_code == 307

    (username,) = await _usernames(oauth)
    assert username == "O_Brien"
    assert username_problem(username) is None


@pytest.mark.parametrize("provider", PROVIDERS)
async def test_oauth_returning_user_is_never_renamed(oauth, provider):
    """Only the create step names anyone. Whatever the provider calls them later, a
    returning user keeps the name they have."""
    oauth.provider.userinfo[NAME_FIELD[provider]] = "First Name"
    assert (await _login(oauth, provider)).status_code == 307

    oauth.provider.userinfo[NAME_FIELD[provider]] = "someone else\u200b"
    assert (await _login(oauth, provider)).status_code == 307

    assert await _usernames(oauth) == ["First_Name"]


@pytest.mark.parametrize(("provider", "stored"), [("google", "OAuth_User"), ("discord", "oauthuser")])
async def test_oauth_ordinary_names_are_stored_exactly_as_before(oauth, provider, stored):
    """Nothing moves for an ordinary name: Google's spaces still become underscores,
    Discord's username is kept as is."""
    assert (await _login(oauth, provider)).status_code == 307
    assert await _usernames(oauth) == [stored]


# ── One account, one way in: a provider-only account has no password ─────────
#
# Forgot password used to tell a provider-only address to check its email and then send
# nothing, and Settings showed it a change-password form it could never use. The fix is
# to say what is true, not to add a door: the address is told it has no password, no
# reset token is minted, and the user object says whether a password exists. "Has a
# password" therefore stays exactly "came from registration", which is the premise of
# the has-password link refusal above.

@pytest.fixture
def reset_mail(monkeypatch, fake_redis):
    """The router binds its Redis client and its sender by value, so conftest's patch of
    app.core.cache.redis_client does not reach them. Nothing here may reach Resend."""
    sender = AsyncMock()
    monkeypatch.setattr(auth_routes, "_send_reset_email", sender)
    monkeypatch.setattr(auth_routes, "redis_client", fake_redis)
    return sender


async def _forgot(o, email: str):
    return await o.client.post("/api/auth/forgot-password", json={"email": email})


async def _deactivate(o, user) -> None:
    """Through the ORM object, not a bulk UPDATE: the app shares this session, and a
    bulk update would leave the identity map saying the account is still active."""
    user.is_active = False
    await o.db.commit()


@pytest.mark.parametrize("provider", PROVIDERS)
async def test_forgot_password_tells_a_provider_only_address_it_has_no_password(oauth, provider, reset_mail):
    """The regression test for the dead end. Nothing is sent and, above all, no token is
    minted: there must be nothing a provider-only account could redeem for a password."""
    assert (await _login(oauth, provider)).status_code == 307

    r = await _forgot(oauth, "oauth@example.com")

    assert r.status_code == 200
    assert r.json() == {"status": "no_password"}
    reset_mail.assert_not_awaited()
    assert await oauth.redis.keys("password_reset:*") == []


async def test_forgot_password_still_sends_a_password_account_its_link(oauth, test_user, reset_mail):
    """Unchanged behaviour, never tested before."""
    r = await _forgot(oauth, test_user.email)

    assert r.status_code == 204
    assert r.content == b""
    reset_mail.assert_awaited_once()
    email, token = reset_mail.await_args.args
    assert email == test_user.email
    assert await oauth.redis.get(f"password_reset:{token}") == str(test_user.id)


async def test_forgot_password_stays_generic_for_unknown_and_deactivated(oauth, test_user, reset_mail):
    """Only a live provider-only account is told anything. An unknown address and a
    deactivated account of either kind get the same empty 204 a password account gets,
    so none of those can be told apart."""
    assert (await _login(oauth, "google")).status_code == 307
    provider_only = (await oauth.db.execute(select(User).where(User.email == "oauth@example.com"))).scalar_one()
    await _deactivate(oauth, provider_only)
    await _deactivate(oauth, test_user)

    for email in ("nobody@example.com", test_user.email, "oauth@example.com"):
        r = await _forgot(oauth, email)
        assert (r.status_code, r.content) == (204, b"")

    reset_mail.assert_not_awaited()
    assert await oauth.redis.keys("password_reset:*") == []


@pytest.mark.parametrize("provider", PROVIDERS)
async def test_a_provider_only_account_cannot_get_a_password(oauth, provider, reset_mail):
    """Every route to a password is closed from this side: change-password refuses an
    account with no hash, and forgot-password minted nothing to redeem."""
    r = await _login(oauth, provider)
    access_token = r.headers["location"].split("token=", 1)[1]

    changed = await oauth.client.post(
        "/api/auth/change-password",
        json={"current_password": "anything-at-all", "new_password": "a-new-password-1"},
        headers={"Authorization": f"Bearer {access_token}"},
    )
    assert changed.status_code == 400
    assert "no password" in changed.json()["detail"]

    await _forgot(oauth, "oauth@example.com")
    assert await oauth.redis.keys("password_reset:*") == []
    (user,) = await _rows(oauth, User)
    assert await _password_hash(oauth, user.id) is None


async def test_the_user_object_says_whether_a_password_exists(oauth, test_user):
    registered = await oauth.client.post(
        "/api/auth/register",
        json={"email": "fresh@example.com", "username": "fresh_user", "password": "password123"},
    )
    assert registered.json()["user"]["has_password"] is True

    logged_in = await oauth.client.post(
        "/api/auth/login", json={"email": test_user.email, "password": "password123"},
    )
    assert logged_in.json()["user"]["has_password"] is True

    # A provider-created account, read the way the SPA reads it: through refresh.
    oauth.client.cookies.clear()
    assert (await _login(oauth, "google")).status_code == 307
    refreshed = await oauth.client.post("/api/auth/refresh")
    assert refreshed.json()["user"]["has_password"] is False


async def test_there_is_one_builder_of_the_user_object(test_user):
    """PATCH /api/users/me used to return a second, identical copy of this dict, which
    would have drifted the day only one of them learned a new field."""
    assert user_to_response(test_user) == user_to_dict(test_user)
    assert user_to_response(test_user)["has_password"] is True


# ── OAuth refuses a deactivated account, in both steps ───────────────────────
#
# Password login and /refresh already ignore a deactivated account. The OAuth path did
# not: a deactivated user was handed tokens that then failed everywhere, and in the link
# step gained a new provider link on the way.

@pytest.mark.parametrize("provider", PROVIDERS)
async def test_oauth_refuses_a_deactivated_returning_user(oauth, provider):
    """The regression test for the finding."""
    assert (await _login(oauth, provider)).status_code == 307
    (user,) = await _rows(oauth, User)
    await _deactivate(oauth, user)
    sessions_before = await oauth.redis.keys("refresh:*")

    r = await _login(oauth, provider)

    _assert_refused(r, "deactivated", provider)
    assert oauth.seen["reject_reason"] == "oauth-account-inactive"
    # No tokens are minted for an account that could not use them.
    assert await oauth.redis.keys("refresh:*") == sessions_before
    assert all("refresh_token" not in c for c in _set_cookies(r))


@pytest.mark.parametrize("provider", PROVIDERS)
async def test_oauth_deactivated_account_gains_no_new_link(oauth, provider):
    other = "discord" if provider == "google" else "google"
    assert (await _login(oauth, other)).status_code == 307
    (user,) = await _rows(oauth, User)
    await _deactivate(oauth, user)

    r = await _login(oauth, provider)

    _assert_refused(r, "deactivated", provider)
    (link,) = await _rows(oauth, OAuthAccount)
    assert link.provider == other


@pytest.mark.parametrize("provider", PROVIDERS)
async def test_oauth_deactivated_beats_has_password(oauth, provider, test_user):
    """Otherwise a deactivated password account would be told to sign in with a
    password that will not work."""
    await _deactivate(oauth, test_user)
    oauth.provider.userinfo["email"] = test_user.email

    r = await _login(oauth, provider)

    _assert_refused(r, "deactivated", provider)
    assert oauth.seen["reject_reason"] == "oauth-account-inactive"

"""
Tests for the users endpoints: the avatar pipeline of PATCH /api/users/me,
the avatar cleanup on DELETE /api/users/me and what it does to the account's
comments, and the admin routes' answer for an id past int4.

Avatar moderation deliberately fails CLOSED (503 + Retry-After), unlike
comment moderation which fails open: blocking comments during an OpenAI
outage breaks the site's main interaction, whereas an avatar can wait.
These tests pin that contract.

The pipeline is fetch-once: one streamed, size-capped, SSRF-guarded fetch of
the user-supplied URL; the fetched bytes are moderated (base64 data URL) and
uploaded (BytesIO). The TOCTOU pin in the clean-upload test asserts the same
bytes flow through all three stages.

Token injection follows the test_comments.py pattern: create_access_token()
is called directly, no login endpoint traffic.

External dependencies are stubbed at the app.services.users module level so
the real _fetch_avatar_image / check_image_moderation code paths execute
end-to-end through the endpoint:
  - httpx.AsyncClient  → scriptable stream() responses; records every URL
    requested and every chunk consumed
  - _resolve_host      → fixed public IP (no live DNS in the suite)
  - openai.AsyncOpenAI → moderation (raises / flagged / clean per test);
    call kwargs recorded
  - cloudinary.uploader.upload / .destroy → record what they received, the
    thread they ran on, and (for destroy) raise on demand

DDL strategy: users + oauth_accounts + comments via Base.metadata.create_all
(no JSONB columns). Every DELETE needs the comments table: the route erases the
account's comments before it deletes the user, and the ORM still SELECTs them
to nullify children.

conftest's autouse patch_redis / disable_rate_limits cover slowapi and
app.core.cache's Redis client. app.core.auth imports redis_client by value, so
the user_client fixture patches that one separately — without it the DELETE
path reaches the real Redis and fails across event loops.
"""

from __future__ import annotations

import asyncio
import base64
import logging
import threading
from datetime import datetime, timedelta, timezone
from types import SimpleNamespace

import httpx
import openai
import pytest
import pytest_asyncio
from fastapi import FastAPI
from httpx import AsyncClient, ASGITransport
from sqlalchemy import event, select
from sqlalchemy.dialects import postgresql
from sqlalchemy.exc import IntegrityError
from sqlalchemy.ext.asyncio import create_async_engine, async_sessionmaker, AsyncSession

import app.core.auth as core_auth
import app.routers.users as users_routes
from app.core.auth import create_access_token
from app.core.colours import RED, RESET, YELLOW
from app.db.database import Base, get_db
from app.middleware.rate_limit import setup_rate_limiter
from app.models.users import User, OAuthAccount  # noqa: F401 — registers tables with Base
from app.models.comments import Comment
from app.services.auth import hash_password
from app.services.users import MAX_AVATAR_BYTES
from app.routers.comments import router as comments_router
from app.routers.users import router as users_router

DEFAULT_IMAGE_BYTES = b"\x89PNG-not-really-a-png-but-bytes-are-bytes"
AVATAR_URL = "https://example.com/pic.png"
STUB_SECURE_URL = "https://res.cloudinary.com/test/avatar.webp"


def _make_users_app(db_session: AsyncSession) -> FastAPI:
    app = FastAPI()
    setup_rate_limiter(app)

    async def override_get_db():
        yield db_session

    app.dependency_overrides[get_db] = override_get_db
    app.include_router(users_router, prefix="/api")
    return app


@pytest_asyncio.fixture
async def users_db_engine():
    engine = create_async_engine("sqlite+aiosqlite:///:memory:", echo=False)
    async with engine.begin() as conn:
        await conn.run_sync(
            Base.metadata.create_all,
            # comments is required by every DELETE: the route erases the
            # account's comments, and db.delete(user) still SELECTs them to
            # nullify children (User.comments has no cascade).
            tables=[User.__table__, OAuthAccount.__table__, Comment.__table__],
        )
    yield engine
    await engine.dispose()


@pytest_asyncio.fixture
async def users_db_session(users_db_engine):
    factory = async_sessionmaker(users_db_engine, expire_on_commit=False)
    async with factory() as session:
        yield session


@pytest_asyncio.fixture
async def test_user(users_db_session):
    user = User(
        email="user@example.com",
        username="testuser",
        password_hash=hash_password("password123"),
    )
    users_db_session.add(user)
    await users_db_session.commit()
    await users_db_session.refresh(user)
    return user


@pytest_asyncio.fixture
async def user_client(users_db_session, test_user, monkeypatch, fake_redis):
    # app.core.auth imports redis_client by value, so conftest's patch of
    # app.core.cache.redis_client does not reach revoke_all_refresh_tokens on
    # the DELETE path. Same fixture pattern as test_auth.py.
    monkeypatch.setattr(core_auth, "redis_client", fake_redis)
    token = create_access_token(test_user.id, test_user.role)
    async with AsyncClient(
        transport=ASGITransport(_make_users_app(users_db_session)),
        base_url="http://test",
        headers={"Authorization": f"Bearer {token}"},
    ) as c:
        yield c


# ── PATCH /api/users/{id}/role and /deactivate (admin) ────────────────────────

@pytest_asyncio.fixture
async def admin_client(users_db_session):
    admin = User(email="admin@example.com", username="admin",
                 password_hash=hash_password("password123"), role="admin")
    users_db_session.add(admin)
    await users_db_session.commit()
    await users_db_session.refresh(admin)
    async with AsyncClient(
        transport=ASGITransport(_make_users_app(users_db_session)),
        base_url="http://test",
        headers={"Authorization": f"Bearer {create_access_token(admin.id, admin.role)}"},
    ) as c:
        yield c


@pytest.mark.parametrize("uid", [2**31, 2**63])
async def test_admin_routes_past_int4_are_the_user_404(admin_client, users_db_session, uid):
    # Postgres refuses 2**31 for an int4 parameter; SQLite holds it, so the row here
    # makes a guard with the wrong bound find it, and 2**63 raises with no guard.
    if uid < 2**63:
        users_db_session.add(User(id=uid, email="far@example.com", username="faraway",
                                  password_hash=hash_password("password123")))
        await users_db_session.commit()
    role = await admin_client.patch(f"/api/users/{uid}/role", json={"role": "moderator"})
    deactivate = await admin_client.patch(f"/api/users/{uid}/deactivate")
    for r in (role, deactivate):
        assert r.status_code == 404
        assert r.json() == {"detail": "User not found"}


# ── Avatar pipeline stubs ─────────────────────────────────────────────────────

class _StubResponse:
    def __init__(self, status_code, headers, chunks, consumed, chunk_delay=0):
        self.status_code = status_code
        self.headers = headers
        self._chunks = chunks
        self._consumed = consumed
        self._chunk_delay = chunk_delay

    @property
    def has_redirect_location(self):
        # Mirrors real httpx: status in the five redirect codes AND a Location
        # header. (httpx's is_redirect is a bare status check — the service code
        # must not use it, or a Location-less 3xx would KeyError.)
        return self.status_code in (301, 302, 303, 307, 308) and "location" in self.headers

    async def aiter_bytes(self):
        for chunk in self._chunks:
            if self._chunk_delay:
                await asyncio.sleep(self._chunk_delay)
            self._consumed.append(len(chunk))
            yield chunk


def _ok_image_response(body=DEFAULT_IMAGE_BYTES, content_type="image/png",
                       extra_headers=None, chunks=None, consumed=None, chunk_delay=0):
    headers = {"content-type": content_type}
    if extra_headers:
        headers.update(extra_headers)
    return _StubResponse(
        200, headers,
        chunks if chunks is not None else [body],
        consumed if consumed is not None else [],
        chunk_delay=chunk_delay,
    )


def _redirect_response(location):
    return _StubResponse(302, {"location": location}, [], [])


class _StubStreamContext:
    def __init__(self, response):
        self._response = response

    async def __aenter__(self):
        return self._response

    async def __aexit__(self, *exc):
        return False


class _StubHTTPClient:
    """Scriptable httpx.AsyncClient stand-in: serves one scripted response per
    stream() call and records every URL requested."""

    def __init__(self, script, requested_urls, request_headers):
        self._script = script
        self._requested = requested_urls
        self._request_headers = request_headers

    async def __aenter__(self):
        return self

    async def __aexit__(self, *exc):
        return False

    def stream(self, method, url, **kwargs):
        # Pin manual redirect handling: if this ever regressed to letting httpx
        # follow redirects itself, per-hop SSRF validation would be skipped and
        # the redirect tests below would pass vacuously.
        assert kwargs.get("follow_redirects") is False, (
            "redirects must be followed manually so every hop is validated"
        )
        self._requested.append(str(url))
        self._request_headers.append(kwargs.get("headers") or {})
        return _StubStreamContext(self._script.pop(0))


def _moderation_response(flagged: bool):
    return SimpleNamespace(
        results=[
            SimpleNamespace(
                flagged=flagged,
                categories=SimpleNamespace(harassment=flagged, violence=False),
            )
        ]
    )


async def _clean_moderation(**kwargs):
    return _moderation_response(flagged=False)


def _patch_avatar_pipeline(monkeypatch, moderation=_clean_moderation, responses=None):
    """Stub the avatar pipeline's externals. `moderation` stands in for
    client.moderations.create (its kwargs are recorded before delegating).
    `responses` scripts the stream() responses in order (default: one clean
    image/png 200). Returns a recorder namespace."""
    rec = SimpleNamespace(
        upload_calls=[],       # bytes received by cloudinary.uploader.upload
        moderation_calls=[],   # kwargs passed to moderations.create
        requested_urls=[],     # every URL our fetch actually requested
        request_headers=[],    # headers sent on each fetch
        resolved_hosts=[],     # every hostname handed to DNS resolution
        upload_kwargs=[],      # kwargs cloudinary.uploader.upload received
        upload_threads=[],     # thread each upload ran on
        openai_kwargs=[],      # kwargs the AsyncOpenAI client was built with
    )

    script = list(responses) if responses is not None else [_ok_image_response()]
    monkeypatch.setattr(
        "app.services.users.httpx.AsyncClient",
        lambda *a, **k: _StubHTTPClient(script, rec.requested_urls, rec.request_headers),
    )

    def _stub_resolve(hostname):
        rec.resolved_hosts.append(hostname)
        return ["93.184.216.34"]

    monkeypatch.setattr("app.services.users._resolve_host", _stub_resolve)

    async def _create(**kwargs):
        rec.moderation_calls.append(kwargs)
        return await moderation(**kwargs)

    def _stub_client(*a, **k):
        rec.openai_kwargs.append(k)
        return SimpleNamespace(moderations=SimpleNamespace(create=_create))

    monkeypatch.setattr("app.services.users.openai.AsyncOpenAI", _stub_client)

    def _stub_upload(file, **kwargs):
        rec.upload_calls.append(file.read())
        rec.upload_kwargs.append(kwargs)
        rec.upload_threads.append(threading.current_thread())
        return {"secure_url": STUB_SECURE_URL}

    monkeypatch.setattr("app.services.users.cloudinary.uploader.upload", _stub_upload)
    return rec


def _patch_cloudinary_destroy(monkeypatch, raises=None, result="ok"):
    """Stub cloudinary.uploader.destroy, recording public_id, kwargs and thread."""
    rec = SimpleNamespace(destroy_calls=[], destroy_kwargs=[], destroy_threads=[])

    def _stub_destroy(public_id, **kwargs):
        rec.destroy_calls.append(public_id)
        rec.destroy_kwargs.append(kwargs)
        rec.destroy_threads.append(threading.current_thread())
        if raises is not None:
            raise raises
        return {"result": result}

    monkeypatch.setattr("app.services.users.cloudinary.uploader.destroy", _stub_destroy)
    return rec


# ── PATCH /api/users/me — moderation contract ─────────────────────────────────

async def test_moderation_outage_returns_503(
    user_client, users_db_session, test_user, monkeypatch
):
    async def _create(**kwargs):
        raise ConnectionError("openai unreachable")

    rec = _patch_avatar_pipeline(monkeypatch, _create)

    r = await user_client.patch("/api/users/me", json={"avatar_url": AVATAR_URL})

    assert r.status_code == 503
    assert "temporarily unavailable" in r.json()["detail"]
    assert r.headers["Retry-After"] == "30"
    assert rec.upload_calls == []
    await users_db_session.refresh(test_user)
    assert test_user.avatar_url is None


async def test_flagged_image_returns_400(
    user_client, users_db_session, test_user, monkeypatch
):
    async def _create(**kwargs):
        return _moderation_response(flagged=True)

    rec = _patch_avatar_pipeline(monkeypatch, _create)

    r = await user_client.patch("/api/users/me", json={"avatar_url": AVATAR_URL})

    assert r.status_code == 400
    assert "rejected by content moderation" in r.json()["detail"]
    assert rec.upload_calls == []
    await users_db_session.refresh(test_user)
    assert test_user.avatar_url is None


async def test_clean_image_uploads_and_sets_avatar(
    user_client, users_db_session, test_user, monkeypatch
):
    rec = _patch_avatar_pipeline(monkeypatch)

    r = await user_client.patch("/api/users/me", json={"avatar_url": AVATAR_URL})

    assert r.status_code == 200
    assert r.json()["avatar_url"] == STUB_SECURE_URL

    # TOCTOU guard: moderation and Cloudinary must both receive exactly the bytes
    # our single fetch returned — if either ever goes back to the URL, a hostile
    # server could serve a clean image to the moderator and different content to
    # the upload. Pin bytes-fetched == bytes-moderated == bytes-uploaded.
    moderated_url = rec.moderation_calls[0]["input"][0]["image_url"]["url"]
    prefix = "data:image/png;base64,"
    assert moderated_url.startswith(prefix)
    assert base64.b64decode(moderated_url[len(prefix):]) == DEFAULT_IMAGE_BYTES
    assert rec.upload_calls == [DEFAULT_IMAGE_BYTES]

    await users_db_session.refresh(test_user)
    assert test_user.avatar_url == STUB_SECURE_URL


# ── PATCH /api/users/me — moderation error classification ─────────────────────

def _api_status_error(cls, status):
    """Build a real SDK exception so these tests break if the hierarchy shifts."""
    request = httpx.Request("POST", "https://api.openai.com/v1/moderations")
    return cls("boom", response=httpx.Response(status, request=request), body=None)


async def test_moderation_rejecting_the_image_returns_400(
    user_client, users_db_session, test_user, monkeypatch
):
    # A 400 from OpenAI means it looked at THIS image and could not decode it
    # (SVG, BMP, HEIC, empty body...). That is the user's problem and retrying
    # will never help, so it must not masquerade as a transient outage.
    async def _create(**kwargs):
        raise _api_status_error(openai.BadRequestError, 400)

    rec = _patch_avatar_pipeline(monkeypatch, _create)

    r = await user_client.patch("/api/users/me", json={"avatar_url": AVATAR_URL})

    assert r.status_code == 400
    assert "format is not supported" in r.json()["detail"]
    assert "Retry-After" not in r.headers
    assert rec.upload_calls == []
    await users_db_session.refresh(test_user)
    assert test_user.avatar_url is None


@pytest.mark.parametrize(
    "exc_cls, status",
    [
        (openai.AuthenticationError, 401),    # our key expired — our outage, not theirs
        (openai.PermissionDeniedError, 403),  # our org lost access
        (openai.RateLimitError, 429),
        (openai.InternalServerError, 500),
    ],
)
async def test_transient_moderation_failures_return_503(
    user_client, monkeypatch, exc_cls, status
):
    async def _create(**kwargs):
        raise _api_status_error(exc_cls, status)

    rec = _patch_avatar_pipeline(monkeypatch, _create)

    r = await user_client.patch("/api/users/me", json={"avatar_url": AVATAR_URL})

    assert r.status_code == 503
    assert "temporarily unavailable" in r.json()["detail"]
    assert r.headers["Retry-After"] == "30"
    assert rec.upload_calls == []


async def test_api_connection_error_returns_503(user_client, monkeypatch):
    # APIConnectionError is NOT an APIStatusError — it has no status_code and
    # must fall through to the fail-closed 503 path.
    async def _create(**kwargs):
        raise openai.APIConnectionError(
            request=httpx.Request("POST", "https://api.openai.com/v1/moderations")
        )

    rec = _patch_avatar_pipeline(monkeypatch, _create)

    r = await user_client.patch("/api/users/me", json={"avatar_url": AVATAR_URL})

    assert r.status_code == 503
    assert r.headers["Retry-After"] == "30"
    assert rec.upload_calls == []


# ── PATCH /api/users/me — size cap ────────────────────────────────────────────

async def test_oversize_stream_aborts_at_cap(user_client, monkeypatch):
    consumed = []
    chunk = b"x" * (1024 * 1024)  # 1 MB
    # 12 MB served with NO Content-Length header — only the streaming cap can
    # catch this; the fast reject never fires.
    resp = _ok_image_response(chunks=[chunk] * 12, consumed=consumed)
    rec = _patch_avatar_pipeline(monkeypatch, responses=[resp])

    r = await user_client.patch("/api/users/me", json={"avatar_url": AVATAR_URL})

    assert r.status_code == 400
    assert "too large" in r.json()["detail"]
    assert rec.moderation_calls == []
    assert rec.upload_calls == []
    # Mid-stream abort: reading stopped at the first chunk past the 10 MB cap
    # (the 11th) instead of draining all 12.
    assert len(consumed) == 11


async def test_oversize_content_length_fast_rejects(user_client, monkeypatch):
    consumed = []
    resp = _ok_image_response(
        chunks=[b"x" * 100],
        consumed=consumed,
        extra_headers={"content-length": str(MAX_AVATAR_BYTES + 1)},
    )
    rec = _patch_avatar_pipeline(monkeypatch, responses=[resp])

    r = await user_client.patch("/api/users/me", json={"avatar_url": AVATAR_URL})

    assert r.status_code == 400
    assert "too large" in r.json()["detail"]
    assert consumed == []  # rejected on the header alone, zero chunks read
    assert rec.moderation_calls == []
    assert rec.upload_calls == []


async def test_compressed_response_rejected(user_client, monkeypatch):
    # Decompression bomb: Content-Length carries the COMPRESSED size and
    # aiter_bytes() yields decoded bytes, so a few KB could expand past the cap
    # before the streaming check fires. Compressed responses are refused
    # outright rather than decoded.
    consumed = []
    resp = _ok_image_response(
        chunks=[b"x" * 100],
        consumed=consumed,
        extra_headers={"content-encoding": "gzip", "content-length": "4893"},
    )
    rec = _patch_avatar_pipeline(monkeypatch, responses=[resp])

    r = await user_client.patch("/api/users/me", json={"avatar_url": AVATAR_URL})

    assert r.status_code == 400
    detail = r.json()["detail"]
    assert "could not be processed" in detail
    # Not the size message: a 4 KB gzipped body is not "too large", and saying
    # so would send someone chasing the wrong problem.
    assert "too large" not in detail
    assert consumed == []
    assert rec.moderation_calls == []
    assert rec.upload_calls == []


async def test_fetch_requests_identity_encoding(user_client, monkeypatch):
    rec = _patch_avatar_pipeline(monkeypatch)

    r = await user_client.patch("/api/users/me", json={"avatar_url": AVATAR_URL})

    assert r.status_code == 200
    assert rec.request_headers[0]["Accept-Encoding"] == "identity"


async def test_non_image_content_type_returns_400(user_client, monkeypatch):
    resp = _ok_image_response(content_type="text/html", chunks=[b"<html>"])
    rec = _patch_avatar_pipeline(monkeypatch, responses=[resp])

    r = await user_client.patch("/api/users/me", json={"avatar_url": AVATAR_URL})

    assert r.status_code == 400
    assert "does not point to an image" in r.json()["detail"]
    assert rec.moderation_calls == []
    assert rec.upload_calls == []


# ── PATCH /api/users/me — deadlines and blocking calls ────────────────────────

async def test_slow_drip_fetch_times_out(user_client, monkeypatch):
    # The reported DoS: httpx's timeout is per-operation, so a server trickling
    # one chunk at a time resets it forever and holds a pooled DB connection
    # open with it. The total deadline is what stops that. Constants are patched
    # down so the test proves the behaviour without actually waiting 15s.
    monkeypatch.setattr("app.services.users.AVATAR_FETCH_TIMEOUT", 0.05)
    resp = _ok_image_response(chunks=[b"x" * 10] * 50, chunk_delay=0.2)
    rec = _patch_avatar_pipeline(monkeypatch, responses=[resp])

    r = await user_client.patch("/api/users/me", json={"avatar_url": AVATAR_URL})

    assert r.status_code == 504
    assert "took too long" in r.json()["detail"]
    assert rec.moderation_calls == []
    assert rec.upload_calls == []


async def test_cloudinary_upload_runs_off_the_event_loop(user_client, monkeypatch):
    # cloudinary's SDK is synchronous; called inline it blocks every other
    # request, not just this one. It must run in a worker thread, and it must
    # carry its own timeout — cancelling the coroutine cannot stop the thread.
    rec = _patch_avatar_pipeline(monkeypatch)

    r = await user_client.patch("/api/users/me", json={"avatar_url": AVATAR_URL})

    assert r.status_code == 200
    assert rec.upload_threads[0] is not threading.main_thread()
    assert rec.upload_kwargs[0]["timeout"] > 0


async def test_moderation_client_has_explicit_bounds(user_client, monkeypatch):
    # Guards against a silent revert to the SDK defaults (600s x 3 retries),
    # which would hold a pooled DB connection for ~30 minutes during an outage.
    rec = _patch_avatar_pipeline(monkeypatch)

    r = await user_client.patch("/api/users/me", json={"avatar_url": AVATAR_URL})

    assert r.status_code == 200
    kwargs = rec.openai_kwargs[0]
    assert kwargs["timeout"] > 0
    assert kwargs["max_retries"] <= 1


# ── PATCH /api/users/me — SSRF guard ──────────────────────────────────────────

async def test_http_url_rejected(user_client, monkeypatch):
    rec = _patch_avatar_pipeline(monkeypatch)

    r = await user_client.patch(
        "/api/users/me", json={"avatar_url": "http://example.com/pic.png"}
    )

    assert r.status_code == 400
    assert "must use https" in r.json()["detail"]
    assert rec.requested_urls == []  # rejected before any fetch


async def test_private_targets_rejected(user_client, monkeypatch):
    rec = _patch_avatar_pipeline(monkeypatch)

    # Literal link-local IP (cloud metadata endpoint) — no DNS involved.
    r = await user_client.patch(
        "/api/users/me", json={"avatar_url": "https://169.254.169.254/pic.png"}
    )
    assert r.status_code == 400
    assert "host is not allowed" in r.json()["detail"]
    assert rec.requested_urls == []

    # Hostname resolving to a private address.
    monkeypatch.setattr("app.services.users._resolve_host", lambda h: ["10.0.0.5"])
    r = await user_client.patch(
        "/api/users/me", json={"avatar_url": "https://internal.example.com/pic.png"}
    )
    assert r.status_code == 400
    assert "host is not allowed" in r.json()["detail"]
    assert rec.requested_urls == []


async def test_redirect_hops_are_followed_and_validated(
    user_client, users_db_session, test_user, monkeypatch
):
    responses = [
        _redirect_response("https://cdn.example.com/real-pic.png"),
        _ok_image_response(),
    ]
    rec = _patch_avatar_pipeline(monkeypatch, responses=responses)

    r = await user_client.patch("/api/users/me", json={"avatar_url": AVATAR_URL})

    assert r.status_code == 200
    assert rec.requested_urls == [AVATAR_URL, "https://cdn.example.com/real-pic.png"]
    await users_db_session.refresh(test_user)
    assert test_user.avatar_url == STUB_SECURE_URL


async def test_redirect_to_private_target_rejected(user_client, monkeypatch):
    responses = [_redirect_response("https://127.0.0.1/steal")]
    rec = _patch_avatar_pipeline(monkeypatch, responses=responses)

    r = await user_client.patch("/api/users/me", json={"avatar_url": AVATAR_URL})

    assert r.status_code == 400
    assert "host is not allowed" in r.json()["detail"]
    # The redirect hop was validated and rejected — the private target was
    # never actually requested.
    assert rec.requested_urls == [AVATAR_URL]
    assert rec.moderation_calls == []
    assert rec.upload_calls == []


async def test_redirect_without_location_returns_400(user_client, monkeypatch):
    # A 3xx with no Location header: httpx's is_redirect would call this a
    # redirect and the Location lookup would KeyError into a 500-ish path, so
    # the service uses has_redirect_location and falls through to a clean 400.
    resp = _StubResponse(302, {}, [], [])
    rec = _patch_avatar_pipeline(monkeypatch, responses=[resp])

    r = await user_client.patch("/api/users/me", json={"avatar_url": AVATAR_URL})

    assert r.status_code == 400
    assert "Could not fetch image from URL" in r.json()["detail"]
    assert rec.moderation_calls == []
    assert rec.upload_calls == []


async def test_idna_host_is_validated_in_punycode_form(user_client, monkeypatch):
    # httpx.URL.host returns the IDNA-DECODED unicode host while the request is
    # sent to the punycode raw_host, and the two can encode to different
    # registrable domains. Validating the decoded form would check one domain
    # and connect to another, bypassing the SSRF guard entirely.
    rec = _patch_avatar_pipeline(monkeypatch)

    r = await user_client.patch(
        "/api/users/me", json={"avatar_url": "https://xn--fa-hia.example/pic.png"}
    )

    assert r.status_code == 200
    assert rec.resolved_hosts == ["xn--fa-hia.example"]  # not "faß.example"


async def test_all_resolved_addresses_must_be_global(user_client, monkeypatch):
    # A hostname resolving to both a public and a private address must reject:
    # the guard checks every answer, not just the first.
    rec = _patch_avatar_pipeline(monkeypatch)
    monkeypatch.setattr(
        "app.services.users._resolve_host", lambda h: ["93.184.216.34", "127.0.0.1"]
    )

    r = await user_client.patch("/api/users/me", json={"avatar_url": AVATAR_URL})

    assert r.status_code == 400
    assert "host is not allowed" in r.json()["detail"]
    assert rec.requested_urls == []


async def test_too_many_redirects_rejected(user_client, monkeypatch):
    responses = [
        _redirect_response(f"https://example.com/hop{i}") for i in range(4)
    ]
    rec = _patch_avatar_pipeline(monkeypatch, responses=responses)

    r = await user_client.patch("/api/users/me", json={"avatar_url": AVATAR_URL})

    assert r.status_code == 400
    assert "Too many redirects" in r.json()["detail"]
    assert len(rec.requested_urls) == 4  # MAX_REDIRECTS + 1 requests, then give up
    assert rec.moderation_calls == []
    assert rec.upload_calls == []


# ── PATCH /api/users/me: renaming ─────────────────────────────────────────────

async def _other_account(session, username: str) -> None:
    session.add(User(email=f"{username}@example.com", username=username, password_hash="x"))
    await session.commit()


async def test_renaming_to_a_taken_username_gets_a_409(user_client, users_db_session):
    await _other_account(users_db_session, "taken")

    r = await user_client.patch("/api/users/me", json={"username": "taken"})

    assert (r.status_code, r.json()["detail"]) == (409, "Username already taken")


async def test_a_rename_that_loses_a_race_gets_the_checks_409(user_client, users_db_session, monkeypatch):
    """Two accounts renaming to one free username can both pass the check before either
    commits, and the avatar work between them can take seconds. The loser's commit hits
    the unique key, which used to answer 500; it now gets the check's own 409."""
    await _other_account(users_db_session, "taken")
    real = users_routes._refuse_taken_username
    calls = []

    async def first_misses(db, username):
        # The other rename's commit lands after this check, so the check misses.
        calls.append(username)
        if len(calls) > 1:
            await real(db, username)

    monkeypatch.setattr(users_routes, "_refuse_taken_username", first_misses)

    r = await user_client.patch("/api/users/me", json={"username": "taken"})

    assert (r.status_code, r.json()["detail"]) == (409, "Username already taken")
    assert calls == ["taken", "taken"]  # checked again after the collision


async def test_a_rename_collision_the_check_cannot_name_is_not_swallowed(user_client, users_db_session, monkeypatch):
    """Only a collision the check can name becomes its 409. Anything else is re-raised,
    so it stays a 500, never a 200 that kept the old name."""
    await _other_account(users_db_session, "taken")

    async def never_finds(db, username):
        return None

    monkeypatch.setattr(users_routes, "_refuse_taken_username", never_finds)

    with pytest.raises(IntegrityError):
        await user_client.patch("/api/users/me", json={"username": "taken"})


# ── DELETE /api/users/me ──────────────────────────────────────────────────────

async def _user_exists(session, user_id) -> bool:
    from sqlalchemy import select
    result = await session.execute(select(User).where(User.id == user_id))
    return result.scalar_one_or_none() is not None


async def test_delete_account_removes_cloudinary_avatar(
    user_client, users_db_session, test_user, monkeypatch
):
    # Deleting an account used to leave the avatar in Cloudinary forever.
    rec = _patch_cloudinary_destroy(monkeypatch)
    user_id = test_user.id

    r = await user_client.delete("/api/users/me")

    assert r.status_code == 204
    assert rec.destroy_calls == [f"stellar-blade/avatars/user-{user_id}.webp"]
    assert not await _user_exists(users_db_session, user_id)


async def test_cloudinary_failure_does_not_block_account_deletion(
    user_client, users_db_session, test_user, monkeypatch
):
    # Deleting the account is what the user actually asked for. Cloudinary being
    # down must not stand between them and that — which also pins the ordering,
    # since a pre-commit call could not survive this.
    rec = _patch_cloudinary_destroy(monkeypatch, raises=ConnectionError("cloudinary down"))
    user_id = test_user.id

    r = await user_client.delete("/api/users/me")

    assert r.status_code == 204
    assert rec.destroy_calls == [f"stellar-blade/avatars/user-{user_id}.webp"]
    assert not await _user_exists(users_db_session, user_id)


async def test_orphaned_avatar_is_logged(
    user_client, users_db_session, test_user, monkeypatch, caplog
):
    # The failure is swallowed by design, so this log line is the only record
    # that an unreachable asset exists — there is no Cloudinary reconciliation
    # script. If it is ever weakened, the orphan becomes untraceable.
    _patch_cloudinary_destroy(monkeypatch, raises=ConnectionError("cloudinary down"))
    user_id = test_user.id

    with caplog.at_level(logging.ERROR, logger="app.services.users"):
        r = await user_client.delete("/api/users/me")

    assert r.status_code == 204
    errors = [rec for rec in caplog.records if rec.levelno == logging.ERROR]
    assert any(f"user-{user_id}.webp" in rec.getMessage() for rec in errors)


async def test_avatar_destroy_runs_off_the_event_loop(
    user_client, users_db_session, test_user, monkeypatch
):
    rec = _patch_cloudinary_destroy(monkeypatch)

    r = await user_client.delete("/api/users/me")

    assert r.status_code == 204
    assert rec.destroy_threads[0] is not threading.main_thread()
    assert rec.destroy_kwargs[0]["timeout"] > 0


# ── DELETE /api/users/me: the account's comments ──────────────────────────────
#
# Deleting an account erases each of its comments the way DELETE /comments/{id}
# erases one, and each keeps its own updated_at. Before, deleting the user had
# SQLAlchemy clear user_id with an UPDATE that the column's onupdate stamped with
# the moment of deletion: the text stayed up, and every comment of the account
# carried the same time in the comment data anyone can load.

# One page's comments, by the account the tests delete (a) and by another (b):
# name -> (author, the comment it replies to, already deleted, day posted).
PAGE = {
    "a_thread": ("a", None, False, 1),        # b replies to it
    "a_lone": ("a", None, False, 2),          # nothing replies to it
    "a_gone": ("a", None, True, 3),           # a deleted it earlier
    "b_top": ("b", None, False, 4),           # a replies to it
    "b_gone": ("b", None, True, 5),           # deleted; only a's reply keeps it up
    "b_reply": ("b", "a_thread", False, 6),
    "a_reply": ("a", "b_top", False, 7),
    "a_keeps_up": ("a", "b_gone", False, 8),
}
A_COMMENTS = [name for name, (author, *_) in PAGE.items() if author == "a"]
B_COMMENTS = [name for name, (author, *_) in PAGE.items() if author == "b"]
TEXT = {name: f"The text of {name}" for name in PAGE}


@pytest_asyncio.fixture
async def account_db(users_db_engine):
    """A fresh session per use, as the app opens one per request."""
    return async_sessionmaker(users_db_engine, expire_on_commit=False)


@pytest_asyncio.fixture
async def page_comments(account_db):
    """Seeds PAGE. Each comment gets its own times, last edited some hours after it
    was posted. Returns account a's id and the comment ids by name."""
    async with account_db() as s:
        users = {"a": User(email="a@example.com", username="accounta"),
                 "b": User(email="b@example.com", username="accountb")}
        s.add_all(users.values())
        await s.flush()
        ids = {}
        for name, (author, parent, deleted, day) in PAGE.items():
            posted = datetime(2026, 1, day, 12, 0, tzinfo=timezone.utc)
            comment = Comment(
                user_id=users[author].id, content_type="walkthrough", content_id=1,
                parent_id=ids[parent] if parent else None,
                body="[deleted]" if deleted else TEXT[name], is_deleted=deleted,
                created_at=posted, updated_at=posted + timedelta(hours=day),
            )
            s.add(comment)
            await s.flush()
            ids[name] = comment.id
        await s.commit()
        return SimpleNamespace(a_id=users["a"].id, ids=ids)


@pytest_asyncio.fixture
async def account_client(account_db, page_comments, monkeypatch, fake_redis):
    """Account a's client, on an app with the users and comments routes and a session
    per request, so the delete runs with none of the comments loaded, as in production."""
    monkeypatch.setattr(core_auth, "redis_client", fake_redis)
    _patch_cloudinary_destroy(monkeypatch)

    async def per_request_db():
        async with account_db() as session:
            yield session

    app = FastAPI()
    setup_rate_limiter(app)
    app.dependency_overrides[get_db] = per_request_db
    app.include_router(users_router, prefix="/api")
    app.include_router(comments_router, prefix="/api")
    token = create_access_token(page_comments.a_id, "user")
    async with AsyncClient(
        transport=ASGITransport(app),
        base_url="http://test",
        headers={"Authorization": f"Bearer {token}"},
    ) as c:
        yield c


async def _comment_rows(account_db, ids) -> dict:
    """name -> (user_id, is_deleted, body, updated_at), as stored."""
    async with account_db() as s:
        rows = await s.execute(
            select(Comment.id, Comment.user_id, Comment.is_deleted, Comment.body, Comment.updated_at)
        )
        by_id = {row.id: tuple(row)[1:] for row in rows}
    return {name: by_id[cid] for name, cid in ids.items()}


async def test_deleting_an_account_erases_its_comments(account_client, account_db, page_comments):
    before = await _comment_rows(account_db, page_comments.ids)
    assert before["a_lone"][2] == TEXT["a_lone"]

    r = await account_client.delete("/api/users/me")
    assert r.status_code == 204

    after = await _comment_rows(account_db, page_comments.ids)
    for name in A_COMMENTS:
        assert after[name][:3] == (None, True, "[deleted]"), name
    for name in B_COMMENTS:
        assert after[name] == before[name], name


async def test_a_deleted_accounts_comments_leave_the_list_as_deleted_ones_do(account_client, page_comments):
    r = await account_client.delete("/api/users/me")
    assert r.status_code == 204

    listed = await account_client.get("/api/comments/walkthrough/1")
    assert listed.status_code == 200
    ids = page_comments.ids
    shape = [
        (c["id"], c["body"], c["user"] and c["user"]["username"],
         [(reply["id"], reply["body"]) for reply in c.get("replies", [])])
        for c in listed.json()
    ]
    # a's comment that b replied to shows "[deleted]" with no author, and the reply
    # stays. a's lone comment and a's replies are gone, and so is b's deleted comment,
    # which only a's reply kept up.
    assert shape == [
        (ids["a_thread"], "[deleted]", None, [(ids["b_reply"], TEXT["b_reply"])]),
        (ids["b_top"], TEXT["b_top"], "accountb", []),
    ]
    for name in A_COMMENTS:
        assert TEXT[name] not in listed.text, name


async def test_deleting_an_account_keeps_each_comments_updated_at(account_client, account_db, page_comments):
    before = await _comment_rows(account_db, page_comments.ids)

    r = await account_client.delete("/api/users/me")
    assert r.status_code == 204

    after = await _comment_rows(account_db, page_comments.ids)
    assert {name: row[3] for name, row in after.items()} == {name: row[3] for name, row in before.items()}
    # No two share a time, so none ties one comment to another.
    assert len({row[3] for row in after.values()}) == len(PAGE)


async def test_the_account_row_is_locked_before_its_comments_are_erased(account_client, users_db_engine):
    # A comment the account posts from another tab while the delete runs must commit
    # before the erase or fail its foreign key once the account is gone: one that slipped
    # in between kept its text. On Postgres the route's FOR UPDATE on the account row
    # does that, since a comment INSERT's foreign key check waits behind it. SQLite
    # ignores FOR UPDATE, so this pins the statements the route sends, in order.
    sent = []

    def record(conn, clauseelement, multiparams, params, execution_options):
        sent.append(clauseelement)

    event.listen(users_db_engine.sync_engine, "before_execute", record)
    try:
        r = await account_client.delete("/api/users/me")
    finally:
        event.remove(users_db_engine.sync_engine, "before_execute", record)
    assert r.status_code == 204

    shown = [str(statement.compile(dialect=postgresql.dialect())) for statement in sent]
    lock = [i for i, sql in enumerate(shown) if "FROM users" in sql and sql.endswith("FOR UPDATE")]
    erase = [i for i, sql in enumerate(shown) if sql.startswith("UPDATE comments")]
    delete = [i for i, sql in enumerate(shown) if sql.startswith("DELETE FROM users")]
    assert len(lock) == len(erase) == len(delete) == 1, shown
    assert lock[0] < erase[0] < delete[0]


async def test_a_compressed_responses_encoding_is_logged_cleaned(user_client, monkeypatch, caplog):
    """The image server is whoever the link names, and h11 passes ESC and bytes from 0x80
    in a header, so the Content-Encoding it sends is cleaned and capped like a request's."""
    encoding = "gz\x1b[2Jip\x85" + chr(0x2028) + "z" * 100 + "TAIL"
    _patch_avatar_pipeline(monkeypatch, responses=[_ok_image_response(extra_headers={"content-encoding": encoding})])
    caplog.set_level(logging.WARNING, logger="app.services.users")

    r = await user_client.patch("/api/users/me", json={"avatar_url": AVATAR_URL})

    assert r.status_code == 400
    (message,) = [rec.getMessage() for rec in caplog.records if "compressed avatar" in rec.getMessage()]
    field = message.split("content-encoding: ", 1)[1].rsplit(")", 1)[0]
    assert field.isprintable()
    assert field.startswith("gz\\x1b[2jip\\x85\\u2028zz")  # lower-cased by the service
    assert field.endswith("…") and len(field) == 41


@pytest.mark.parametrize("url", [
    "https://[::1MARKER]/pic.png",  # httpx: Invalid IPv6 address, quoting the host
    "https://" + chr(0x2603) + "MARKER" + chr(0xAD) + "--.example/pic.png",  # Invalid IDNA hostname
])
async def test_a_failed_avatar_fetch_logs_the_error_class_never_the_link(user_client, test_user, monkeypatch, caplog, url):
    """httpx's errors describe the link the user gave, and the link isn't kept."""
    _patch_avatar_pipeline(monkeypatch)
    caplog.set_level(logging.ERROR, logger="app.routers.users")

    r = await user_client.patch("/api/users/me", json={"avatar_url": url})

    assert r.status_code == 400
    assert [rec.getMessage() for rec in caplog.records if rec.name == "app.routers.users"] == [
        f"{RED}Failed to upload avatar for user {test_user.id}: InvalidURL{RESET}",
    ]


async def test_a_flagged_avatar_logs_no_categories(user_client, monkeypatch, caplog):
    """The access line beside it holds the IP, and the categories can say self-harm."""
    async def _flagged(**kwargs):
        return _moderation_response(flagged=True)

    _patch_avatar_pipeline(monkeypatch, moderation=_flagged)
    caplog.set_level(logging.WARNING, logger="app.services.users")

    r = await user_client.patch("/api/users/me", json={"avatar_url": AVATAR_URL})

    assert r.status_code == 400
    assert [rec.getMessage() for rec in caplog.records if rec.name == "app.services.users"] == [
        f"{YELLOW}Avatar image flagged by moderation{RESET}",
    ]

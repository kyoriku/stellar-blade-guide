import hmac

import pytest
import pytest_asyncio
import app.middleware.origin_check as origin_check_module
from fastapi import FastAPI
from fastapi.responses import JSONResponse
from httpx import AsyncClient, ASGITransport

from app.config.settings import settings
from app.middleware.origin_check import add_origin_check_middleware


def make_origin_check_app() -> FastAPI:
    app = FastAPI()
    add_origin_check_middleware(app)

    @app.get("/api/test")
    async def stub():
        return JSONResponse({"ok": True})

    @app.api_route("/api/health", methods=["GET", "HEAD"])
    async def health():
        return JSONResponse({"status": "ok"})

    return app


@pytest_asyncio.fixture
async def origin_client(monkeypatch):
    monkeypatch.setattr(settings, "DEBUG", False)
    monkeypatch.setattr(origin_check_module, "ORIGIN_SECRET", "test-secret")
    app = make_origin_check_app()
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as c:
        yield c


async def test_no_header_returns_404(origin_client):
    r = await origin_client.get("/api/test")
    assert r.status_code == 404


@pytest.mark.parametrize(
    "value",
    [
        pytest.param("wrong", id="other"),
        pytest.param("test-secreT", id="same-length"),
        pytest.param("test-secre", id="prefix"),
        pytest.param("test-secret-", id="extended"),
        pytest.param("", id="empty"),
    ],
)
async def test_wrong_secret_returns_404(origin_client, value):
    r = await origin_client.get("/api/test", headers={"x-origin-secret": value})
    assert r.status_code == 404


async def test_correct_secret_passes_through(origin_client):
    r = await origin_client.get("/api/test", headers={"x-origin-secret": "test-secret"})
    assert r.status_code == 200


@pytest.mark.parametrize(
    "raw",
    [
        pytest.param(b"t\xe9st-secret", id="latin-1"),
        pytest.param("t\u00e9st-secret".encode(), id="utf-8"),
        pytest.param(b"test-secret\xff", id="trailing-0xff"),
    ],
)
async def test_non_ascii_header_is_a_404_not_a_500(origin_client, raw):
    # Starlette decodes header bytes as latin-1, so this reaches the compare as a
    # non-ASCII str, which compare_digest refuses with a TypeError. On bytes it is
    # just a mismatch.
    r = await origin_client.get("/api/test", headers={"x-origin-secret": raw})
    assert r.status_code == 404


async def test_a_non_ascii_secret_matches_the_header_as_starlette_decodes_it(origin_client, monkeypatch):
    # Pins today's behaviour on purpose: the header counts as the text Starlette
    # decodes (latin-1), so the secret's latin-1 bytes match and its UTF-8 bytes
    # don't. Comparing raw bytes instead would flip both, and should be a decision.
    secret = "t\u00e9st-secret"
    monkeypatch.setattr(origin_check_module, "ORIGIN_SECRET", secret)
    r = await origin_client.get("/api/test", headers={"x-origin-secret": secret.encode("latin-1")})
    assert r.status_code == 200
    r = await origin_client.get("/api/test", headers={"x-origin-secret": secret.encode()})
    assert r.status_code == 404


@pytest.mark.parametrize(
    "raw",
    [
        pytest.param(b"test-secret\xff", id="the-env-bytes"),
        pytest.param(b"test-secret", id="what-ignore-gives"),
        pytest.param(b"test-secret?", id="what-replace-gives"),
        pytest.param(b"test-secret\\udcff", id="what-backslashreplace-gives"),
        pytest.param(b"test-secret\xed\xb3\xbf", id="surrogatepass-bytes"),
    ],
)
async def test_a_secret_that_is_not_utf8_rejects_with_a_404(origin_client, monkeypatch, raw):
    # The env held b"test-secret\xff", which os.getenv hands over with a lone
    # surrogate that a strict encode refuses. No header can equal it, so every
    # request is a 404, as with !=. Each header is what a looser encoding would match.
    secret = b"test-secret\xff".decode("utf-8", "surrogateescape")
    monkeypatch.setattr(origin_check_module, "ORIGIN_SECRET", secret)
    r = await origin_client.get("/api/test", headers={"x-origin-secret": raw})
    assert r.status_code == 404


async def test_an_empty_secret_rejects_a_request_with_no_header(origin_client, monkeypatch):
    # compare_digest(b"", b"") is True, so the empty-secret check must stay: without
    # it, a server with no secret set would let in every request without the header.
    monkeypatch.setattr(origin_check_module, "ORIGIN_SECRET", "")
    r = await origin_client.get("/api/test")
    assert r.status_code == 404


async def test_debug_skips_the_check(origin_client, monkeypatch):
    monkeypatch.setattr(settings, "DEBUG", True)
    r = await origin_client.get("/api/test")
    assert r.status_code == 200


async def test_the_compare_is_constant_time_on_bytes(origin_client, monkeypatch):
    # No response shows timing, so this pins the mechanism: hmac.compare_digest
    # (called by attribute, so the patch reaches it), on bytes, the secret second.
    # The right value goes through it too, so a == or != shortcut in front would show.
    calls = []
    real = hmac.compare_digest

    def spy(a, b):
        calls.append((a, b))
        return real(a, b)

    monkeypatch.setattr(hmac, "compare_digest", spy)
    wrong = await origin_client.get("/api/test", headers={"x-origin-secret": "test-secreT"})
    right = await origin_client.get("/api/test", headers={"x-origin-secret": "test-secret"})
    assert (wrong.status_code, right.status_code) == (404, 200)
    assert calls == [(b"test-secreT", b"test-secret"), (b"test-secret", b"test-secret")]


async def test_railway_health_check_bypasses_check(origin_client):
    # Railway's health checks arrive with this Host and no secret; they must pass.
    r = await origin_client.get("/api/health", headers={"host": "healthcheck.railway.app"})
    assert r.status_code == 200
    r = await origin_client.head("/api/health", headers={"host": "healthcheck.railway.app"})
    assert r.status_code == 200


async def test_railway_host_does_not_bypass_check_on_other_paths(origin_client):
    # The exemption is pinned to the health path: a spoofed health-check Host must not
    # open any data endpoint, whatever Railway's edge routing does.
    r = await origin_client.get("/api/test", headers={"host": "healthcheck.railway.app"})
    assert r.status_code == 404
    r = await origin_client.get("/api/health/", headers={"host": "healthcheck.railway.app"})
    assert r.status_code == 404

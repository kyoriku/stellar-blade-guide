"""
Tests for ETagMiddleware header propagation.

The 304 branch used to create a bare StarletteResponse(status_code=304, headers={"ETag": etag}),
dropping all headers set by upstream middleware. The fix copies response.headers into the
304 the same way the 200 branch does.

App setup mirrors production middleware order: ETagMiddleware (outer) wraps
security-header middleware (inner) which wraps the route handler.
"""

from httpx import AsyncClient, ASGITransport
from fastapi import FastAPI
from fastapi.responses import JSONResponse
from starlette.requests import Request
from starlette.middleware.gzip import GZipMiddleware

from middleware.etag import ETagMiddleware, EXCLUDED_304_HEADERS


def make_etag_app(path: str = "/api/test/") -> FastAPI:
    app = FastAPI()

    @app.middleware("http")
    async def security_headers(request: Request, call_next):
        response = await call_next(request)
        response.headers["X-Content-Type-Options"] = "nosniff"
        response.headers["Strict-Transport-Security"] = "max-age=63072000; includeSubDomains"
        if request.url.path.startswith("/api/"):
            response.headers["X-Robots-Tag"] = "noindex"
        return response

    app.add_middleware(ETagMiddleware)
    app.add_middleware(GZipMiddleware, minimum_size=1000)

    @app.get(path)
    async def endpoint():
        return JSONResponse({"data": "ok"})

    return app


async def test_200_includes_etag():
    """First request returns 200 with an ETag header."""
    app = make_etag_app()
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        r = await client.get("/api/test/")
        assert r.status_code == 200
        assert "etag" in r.headers


async def test_304_returned_on_matching_etag():
    """Repeat request with a matching If-None-Match returns 304."""
    app = make_etag_app()
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        r1 = await client.get("/api/test/")
        etag = r1.headers["etag"]

        r2 = await client.get("/api/test/", headers={"if-none-match": etag})
        assert r2.status_code == 304


async def test_304_preserves_security_headers():
    """304 carries the same security headers as the original 200."""
    app = make_etag_app()
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        r1 = await client.get("/api/test/")
        etag = r1.headers["etag"]

        r2 = await client.get("/api/test/", headers={"if-none-match": etag})
        assert r2.status_code == 304
        assert r2.headers.get("x-content-type-options") == "nosniff"
        assert "max-age=63072000" in r2.headers.get("strict-transport-security", "")
        assert r2.headers.get("x-robots-tag") == "noindex"
        assert r2.headers.get("etag") == etag


async def test_304_non_api_path_excludes_x_robots_tag():
    """Non-/api/ paths must not carry X-Robots-Tag on 304."""
    app = make_etag_app("/public/resource/")
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        r1 = await client.get("/public/resource/")
        etag = r1.headers["etag"]

        r2 = await client.get("/public/resource/", headers={"if-none-match": etag})
        assert r2.status_code == 304
        assert "x-robots-tag" not in r2.headers
        assert r2.headers.get("x-content-type-options") == "nosniff"


async def test_304_excludes_body_headers():
    """304 must not carry body-describing headers (content-length, content-encoding,
    transfer-encoding) regardless of what the original 200 sent."""
    app = make_etag_app()
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        r1 = await client.get("/api/test/")
        etag = r1.headers["etag"]

        r2 = await client.get("/api/test/", headers={"if-none-match": etag})
        assert r2.status_code == 304
        for header in EXCLUDED_304_HEADERS:
            assert header not in r2.headers

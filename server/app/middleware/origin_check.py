import hmac
import os
from fastapi import Request
from fastapi.responses import JSONResponse
from app.config.settings import settings

ORIGIN_SECRET = os.getenv("ORIGIN_SECRET", "")


async def origin_check_middleware(request: Request, call_next):
    # Skip in local dev
    if settings.DEBUG:
        return await call_next(request)

    # Allow Railway's internal health checks, which arrive over its private network
    # with this Host. The path pin keeps the exemption to the health endpoint, so a
    # request that forges the Host reaches nothing else. It must match the
    # health-check path configured in Railway.
    if (
        request.headers.get("host", "").startswith("healthcheck.railway.app")
        and request.url.path == "/api/health"
    ):
        return await call_next(request)

    provided = request.headers.get("x-origin-secret", "")
    # Constant time, on bytes: compare_digest raises TypeError on a non-ASCII str, and
    # the header is whatever the client sent. The secret goes second, so the work
    # follows its length. surrogatepass is for an env value that isn't UTF-8, which
    # os.getenv hands over as lone surrogates; it gives different strings different
    # bytes, so this still matches exactly when provided == ORIGIN_SECRET.
    if not ORIGIN_SECRET or not hmac.compare_digest(
        provided.encode(), ORIGIN_SECRET.encode(errors="surrogatepass")
    ):
        # Printed by the logging middleware, so this 404 is distinguishable from
        # the router's unknown-path 404 in the access log.
        request.state.reject_reason = "origin-secret"
        return JSONResponse(status_code=404, content={"error": "Not Found"})

    return await call_next(request)


def add_origin_check_middleware(app):
    app.middleware("http")(origin_check_middleware)

import os
from fastapi import Request
from fastapi.responses import JSONResponse
from app.config.settings import settings

ORIGIN_SECRET = os.getenv("ORIGIN_SECRET", "")


async def origin_check_middleware(request: Request, call_next):
    # Skip in local dev
    if settings.DEBUG:
        return await call_next(request)

    # Allow Railway's internal health checks. They arrive over Railway's private mesh
    # with this Host and never pass through the public edge. An outside caller cannot
    # spoof it: Railway's edge routes on the Host header, and this hostname is not
    # registered, so the request dies at the edge (verified 2026-09-12, see
    # docs/prod-origin-topology.md). The path pin keeps the exemption no wider than
    # the health endpoint even if that routing behaviour ever changes. It must match
    # the health-check path configured in Railway and edge rule 2.
    if (
        request.headers.get("host", "").startswith("healthcheck.railway.app")
        and request.url.path == "/api/health"
    ):
        return await call_next(request)

    provided = request.headers.get("x-origin-secret", "")
    if not ORIGIN_SECRET or provided != ORIGIN_SECRET:
        # Printed by the logging middleware, so this 404 is distinguishable from
        # the router's unknown-path 404 in the access log.
        request.state.reject_reason = "origin-secret"
        return JSONResponse(status_code=404, content={"error": "Not Found"})

    return await call_next(request)


def add_origin_check_middleware(app):
    app.middleware("http")(origin_check_middleware)

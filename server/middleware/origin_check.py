import os
from fastapi import Request
from fastapi.responses import JSONResponse
from config.settings import settings

ORIGIN_SECRET = os.getenv("ORIGIN_SECRET", "")


async def origin_check_middleware(request: Request, call_next):
    # Skip in local dev
    if settings.DEBUG:
        return await call_next(request)

    # Allow Railway's internal health checks (no host spoofing possible here)
    if request.headers.get("host", "").startswith("healthcheck.railway.app"):
        return await call_next(request)

    provided = request.headers.get("x-origin-secret", "")
    if not ORIGIN_SECRET or provided != ORIGIN_SECRET:
        return JSONResponse(status_code=404, content={"error": "Not Found"})

    return await call_next(request)


def add_origin_check_middleware(app):
    app.middleware("http")(origin_check_middleware)

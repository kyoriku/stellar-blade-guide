import re
from fastapi import Request
from fastapi.responses import JSONResponse
from config.settings import settings

LOCALHOST_IPS = {"127.0.0.1", "::1", "::ffff:127.0.0.1"}

ALLOWED_PREFIXES = (
    '/api/',
    '/assets/',
    '/docs',
    '/redoc',
    '/openapi.json',
)

ALLOWED_EXACT = {
    '/robots.txt',
    '/sitemap.xml',
}

# Paths that look like normal URL segments (letters, digits, hyphens, slashes)
SPA_SAFE_PATH = re.compile(r'^/[a-z0-9\-/]*$')


def is_localhost(ip: str) -> bool:
    return settings.DEBUG and ip in LOCALHOST_IPS


def get_client_ip(request: Request) -> str:
    fastly_ip = request.headers.get("fastly-client-ip")
    if fastly_ip:
        return fastly_ip.strip()

    real_ip = request.headers.get("x-real-ip")
    if real_ip:
        return real_ip.strip()

    forwarded_for = request.headers.get("x-forwarded-for")
    if forwarded_for:
        return forwarded_for.split(",")[-1].strip()

    return request.client.host


async def bot_filter_middleware(request: Request, call_next):
    original_path = request.url.path
    normalized = original_path.lower().rstrip('/') or '/'

    # Skip in dev
    if is_localhost(get_client_ip(request)):
        return await call_next(request)

    # Reject path traversal attempts
    if '..' in normalized:
        request.state.bot_blocked = True
        return JSONResponse(status_code=404, content={"error": "Not Found"})

    # Allow API, static assets, and SEO files (case-sensitive)
    if original_path.startswith(ALLOWED_PREFIXES) or original_path in ALLOWED_EXACT:
        return await call_next(request)

    # Allow normal-shaped URLs through to React Router
    if SPA_SAFE_PATH.match(normalized):
        return await call_next(request)

    # Everything else (file extensions, weird chars) = probe
    request.state.bot_blocked = True
    return JSONResponse(status_code=404, content={"error": "Not Found"})


def add_bot_filter_middleware(app):
    app.middleware("http")(bot_filter_middleware)
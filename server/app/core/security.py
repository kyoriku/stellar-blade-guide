from slowapi import Limiter
from fastapi import Request
from app.config.settings import settings


def get_client_ip(request: Request) -> str:
    """Resolve the real client IP from proxy headers.

    Canonical implementation, shared by the rate limiter, bot filter, and logging.
    """
    # Cloudflare sets this — strips any client-supplied version
    cf_ip = request.headers.get("cf-connecting-ip")
    if cf_ip:
        return cf_ip.strip()

    # Fastly (Railway's CDN) — now unreliable with CF in front, but kept as fallback
    fastly_ip = request.headers.get("fastly-client-ip")
    if fastly_ip:
        return fastly_ip.strip()

    real_ip = request.headers.get("x-real-ip")
    if real_ip:
        return real_ip.strip()

    forwarded_for = request.headers.get("x-forwarded-for")
    if forwarded_for:
        # First IP = original client
        return forwarded_for.split(",")[0].strip()

    # Fallback to direct connection IP (only used in local dev)
    return request.client.host


# Redis failures must never take routes down: bound socket waits to 2s, fall
# back to per-process in-memory limits while Redis is unreachable (slowapi
# rechecks the backend with exponential backoff), and swallow anything else.
limiter = Limiter(
    key_func=get_client_ip,
    storage_uri=settings.REDIS_URL,
    storage_options={"socket_connect_timeout": 2, "socket_timeout": 2},
    swallow_errors=True,
    in_memory_fallback_enabled=True,
)

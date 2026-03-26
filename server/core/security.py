from slowapi import Limiter
from fastapi import Request
from config.settings import settings

def get_client_ip_for_limiter(request: Request) -> str:
    """Get real client IP from proxy headers for rate limiting."""
    fastly_ip = request.headers.get("fastly-client-ip")
    if fastly_ip:
        return fastly_ip.strip()
    
    real_ip = request.headers.get("x-real-ip")
    if real_ip:
        return real_ip.strip()


    forwarded_for = request.headers.get("x-forwarded-for")
    if forwarded_for:
        return forwarded_for.split(",")[-1].strip()

    # Fallback to direct connection IP (only used in local dev)
    return request.client.host

limiter = Limiter(
    key_func=get_client_ip_for_limiter,  # Use custom function instead of get_remote_address
    storage_uri=settings.REDIS_URL
)
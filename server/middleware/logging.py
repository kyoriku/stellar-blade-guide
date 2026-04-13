import time
import logging
from fastapi import Request
from middleware.bot_filter import get_client_ip

logger = logging.getLogger("api")


def parse_ua(ua: str) -> str:
    """Extract short browser identifier from User-Agent string."""
    if 'bot' in ua.lower() or 'crawl' in ua.lower() or 'spider' in ua.lower():
        return ua.split('/')[0] if '/' in ua else ua[:30]
    if 'Firefox/' in ua:
        return 'Firefox/' + ua.split('Firefox/')[1].split(' ')[0]
    if 'Chrome/' in ua and 'Edg/' not in ua:
        return 'Chrome/' + ua.split('Chrome/')[1].split(' ')[0]
    if 'Edg/' in ua:
        return 'Edge/' + ua.split('Edg/')[1].split(' ')[0]
    if 'Safari/' in ua and 'Chrome/' not in ua:
        return 'Safari/' + ua.split('Version/')[1].split(' ')[0] if 'Version/' in ua else 'Safari'
    return ua[:30]


async def log_requests_middleware(request: Request, call_next):
    start_time = time.time()
    response = await call_next(request)
    duration_ms = (time.time() - start_time) * 1000
    
    # Skip logging for bot/banned requests
    if getattr(request.state, "bot_blocked", False):
        return response

    # Only log API routes
    if not request.url.path.startswith("/api/"):
        response.headers["X-Process-Time"] = str(duration_ms / 1000)
        return response
    
    client_ip = get_client_ip(request)
    user_agent = request.headers.get("user-agent", "-")
    cache_status = getattr(request.state, "cache_status", None)
    db_time = getattr(request.state, "db_time", None)
    
    log_parts = [
        f'{client_ip} → {request.method} {request.url.path}',
        f'{response.status_code}',
        f'{duration_ms:.0f}ms',
    ]
    
    if cache_status:
        log_parts.append(cache_status)
    if db_time:
        log_parts.append(f'DB: {db_time:.0f}ms')
    
    log_parts.append(f'UA: {parse_ua(user_agent)}')

    logger.info(' | '.join(log_parts))

    response.headers["X-Process-Time"] = str(duration_ms / 1000)
    return response


def add_logging_middleware(app):
    app.middleware("http")(log_requests_middleware)
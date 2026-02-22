import time
import logging
from fastapi import Request
from middleware.honeypot import get_client_ip
from core.cache import redis_client

logger = logging.getLogger("api")

async def log_requests_middleware(request: Request, call_next):
    start_time = time.time()
    response = await call_next(request)
    duration_ms = (time.time() - start_time) * 1000
    
    # Skip logging for bot/banned requests (flagged by honeypot middleware)
    if getattr(request.state, "bot_blocked", False):
        return response
    
    client_ip = get_client_ip(request)
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
    
    logger.info(' | '.join(log_parts))
    
    # Track stats in Redis (fire-and-forget, don't slow down responses)
    try:
        pipe = redis_client.pipeline(transaction=False)
        pipe.hincrby("stats:endpoints", request.url.path, 1)
        pipe.pfadd("stats:unique_ips", client_ip)
        if cache_status:
            pipe.hincrby("stats:cache", cache_status, 1)
        pipe.hincrby("stats:status_codes", str(response.status_code), 1)
        await pipe.execute()
    except Exception:
        pass  # Stats are nice-to-have, never block requests
    
    response.headers["X-Process-Time"] = str(duration_ms / 1000)
    return response

def add_logging_middleware(app):
    app.middleware("http")(log_requests_middleware)
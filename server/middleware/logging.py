import time
import logging
from fastapi import Request
from middleware.honeypot import get_client_ip

logger = logging.getLogger("api")

async def log_requests_middleware(request: Request, call_next):
    start_time = time.time()
    response = await call_next(request)
    duration_ms = (time.time() - start_time) * 1000
    
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
    
    response.headers["X-Process-Time"] = str(duration_ms / 1000)
    return response

def add_logging_middleware(app):
    app.middleware("http")(log_requests_middleware)
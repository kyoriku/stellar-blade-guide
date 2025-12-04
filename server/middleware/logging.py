import time
import logging
from fastapi import Request
from config.settings import settings

logger = logging.getLogger(__name__)

async def log_requests_middleware(request: Request, call_next):
    start_time = time.time()
    response = await call_next(request)
    duration_ms = (time.time() - start_time) * 1000
    
    # Only log in debug/dev mode
    if settings.DEBUG:
        cache_status = getattr(request.state, "cache_status", None)
        db_time = getattr(request.state, "db_time", None)
        
        log_parts = [
            f"→ {request.method} {request.url.path}",
            f"STATUS: {response.status_code}",
            f"TOTAL: {duration_ms:.0f}ms"
        ]
        
        if cache_status:
            log_parts.append(f"CACHE: {cache_status}")
        if db_time:
            log_parts.append(f"DB: {db_time:.0f}ms")
        
        logger.info(" | ".join(log_parts))
    
    response.headers["X-Process-Time"] = str(duration_ms / 1000)
    return response

def add_logging_middleware(app):
    app.middleware("http")(log_requests_middleware)
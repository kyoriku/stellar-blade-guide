# # import time
# # import logging
# # from fastapi import Request

# # logger = logging.getLogger(__name__)


# # async def log_requests_middleware(request: Request, call_next):
# #     start_time = time.time()
    
# #     # Log request
# #     logger.info(f"→ {request.method} {request.url.path}")
    
# #     # Process request
# #     response = await call_next(request)
    
# #     # Calculate duration
# #     duration = time.time() - start_time
    
# #     # Get cache status if set
# #     cache_status = getattr(request.state, "cache_status", None)
# #     cache_info = f" | CACHE: {cache_status}" if cache_status else ""
    
# #     # Log response
# #     logger.info(
# #         f"← {request.method} {request.url.path} "
# #         f"[{response.status_code}] {duration:.3f}s{cache_info}"
# #     )
    
# #     # Add timing header
# #     response.headers["X-Process-Time"] = str(duration)
    
# #     return response



# # def add_logging_middleware(app):
# #     app.middleware("http")(log_requests_middleware)

# import time
# import logging
# from fastapi import Request

# logger = logging.getLogger(__name__)


# async def log_requests_middleware(request: Request, call_next):
#     start_time = time.time()
    
#     # Process request
#     response = await call_next(request)
    
#     # Calculate duration
#     duration_ms = (time.time() - start_time) * 1000
    
#     # Get cache status and DB time if set
#     cache_status = getattr(request.state, "cache_status", None)
#     db_time = getattr(request.state, "db_time", None)
    
#     # Build compact log line
#     log_parts = [
#         f"→ {request.method} {request.url.path}",
#         f"[{response.status_code}]",
#         f"{duration_ms:.0f}ms"
#     ]
    
#     if cache_status:
#         log_parts.append(f"CACHE: {cache_status}")
    
#     if db_time:
#         log_parts.append(f"DB: {db_time:.0f}ms")
    
#     logger.info(" | ".join(log_parts))
    
#     # Add timing header
#     response.headers["X-Process-Time"] = str(duration_ms / 1000)
    
#     return response


# def add_logging_middleware(app):
#     app.middleware("http")(log_requests_middleware)

import time
import logging
from fastapi import Request

logger = logging.getLogger(__name__)


async def log_requests_middleware(request: Request, call_next):
    start_time = time.time()
    
    # Process request
    response = await call_next(request)
    
    # Calculate duration
    duration_ms = (time.time() - start_time) * 1000
    
    # Get cache status and DB time if set
    cache_status = getattr(request.state, "cache_status", None)
    db_time = getattr(request.state, "db_time", None)
    
    # Build compact log line with labels
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
    
    # Add timing header
    response.headers["X-Process-Time"] = str(duration_ms / 1000)
    
    return response


def add_logging_middleware(app):
    app.middleware("http")(log_requests_middleware)
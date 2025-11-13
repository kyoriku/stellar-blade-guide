"""
Request timing middleware for performance monitoring.
"""
import time
from fastapi import Request

async def timing_middleware(request: Request, call_next):
    """
    Add timing information to response headers.
    Useful for performance monitoring.
    """
    start_time = time.time()
    response = await call_next(request)
    process_time = time.time() - start_time
    
    response.headers["X-Process-Time"] = str(process_time)
    response.headers["X-Request-ID"] = str(id(request))
    
    return response

def add_timing_middleware(app):
    """Add timing middleware to the FastAPI app."""
    app.middleware("http")(timing_middleware)
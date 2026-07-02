import logging
from fastapi import Request
from fastapi.responses import JSONResponse
from redis.exceptions import RedisError

logger = logging.getLogger(__name__)

async def error_handler_middleware(request: Request, call_next):
    try:
        return await call_next(request)
    except RedisError as e:
        # Redis-backed paths that can't fail open (refresh tokens, password
        # reset) surface as a dependency outage, not an application error.
        logger.warning(f"Redis unavailable for {request.url.path}: {e}")
        return JSONResponse(
            status_code=503,
            content={
                "error": "Service temporarily unavailable",
                "message": "Please try again shortly.",
                "path": request.url.path
            },
            headers={"Retry-After": "30"}
        )
    except Exception as e:
        logger.error(f"Unhandled error: {e}", exc_info=True)
        # Never surface raw exception text to the client (even in DEBUG) — it's
        # logged above with a full traceback. Return a fixed friendly message.
        return JSONResponse(
            status_code=500,
            content={
                "error": "Internal server error",
                "message": "Something went wrong on our end. Please try again later.",
                "path": request.url.path
            }
        )

def add_error_handler_middleware(app):
    app.middleware("http")(error_handler_middleware)
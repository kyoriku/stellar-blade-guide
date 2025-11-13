import logging
from fastapi import Request
from fastapi.responses import JSONResponse
from config.settings import settings

logger = logging.getLogger(__name__)

async def error_handler_middleware(request: Request, call_next):
    try:
        return await call_next(request)
    except Exception as e:
        logger.error(f"Unhandled error: {e}", exc_info=True)
        return JSONResponse(
            status_code=500,
            content={
                "error": "Internal server error",
                "message": str(e) if settings.DEBUG else "An error occurred",
                "path": request.url.path
            }
        )

def add_error_handler_middleware(app):
    app.middleware("http")(error_handler_middleware)
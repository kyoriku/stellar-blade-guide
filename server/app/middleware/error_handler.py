import logging
from fastapi import Request
from fastapi.responses import JSONResponse
from redis.exceptions import RedisError
from sqlalchemy.exc import DBAPIError

from app.core.logging import LOG_PATH_MAX, sanitize_log_field
from app.middleware.exception_handlers import INVALID_INPUT_DETAIL

logger = logging.getLogger(__name__)

# SQLSTATE class 22, "data exception", is the database refusing a value: what drivers
# such as psycopg raise as DataError. Through asyncpg, SQLAlchemy reports it as a plain
# DBAPIError, so only the code tells it apart. Three codes in the class come from the
# site's own SQL, never a request's value, so they stay 500s: an exhausted id sequence
# (2200H), an overflow (22003; asyncpg refuses an out-of-range argument before the
# query is sent) and a division by zero (22012).
_OWN_SQL_SQLSTATES = frozenset({"2200H", "22003", "22012"})


def _bad_value_sqlstate(exc: Exception) -> str | None:
    """The SQLSTATE of a database error caused by a bad value in the request, else None."""
    sqlstate = getattr(exc.orig, "sqlstate", None) if isinstance(exc, DBAPIError) else None
    if not isinstance(sqlstate, str) or not sqlstate.startswith("22") or sqlstate in _OWN_SQL_SQLSTATES:
        return None
    if sqlstate == "22000":
        # asyncpg could not encode a value, before the query was sent. A request's
        # value can only be an int out of range or text UTF-8 can't hold: every field
        # is typed, so a value of the wrong type (a TypeError) is the site's own bug.
        encoder_error = getattr(exc.orig.__cause__, "__cause__", None)
        if not isinstance(encoder_error, (OverflowError, UnicodeEncodeError)):
            return None
    return sqlstate

async def error_handler_middleware(request: Request, call_next):
    try:
        return await call_next(request)
    except RedisError as e:
        # Redis-backed paths that can't fail open (refresh tokens, OAuth state,
        # password reset) surface as a dependency outage, not an application error.
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
        sqlstate = _bad_value_sqlstate(e)
        if sqlstate:
            # A value no guard caught, such as a NUL, a lone surrogate or an id past
            # int4: a bad request, not an outage. The warning keeps a real bug in view.
            # It names the code and the route, never the message, which quotes the value.
            request.state.reject_reason = "db-data-error"
            logger.warning(
                f"Database refused a value ({sqlstate}): "
                f"{request.method} {sanitize_log_field(request.url.path, LOG_PATH_MAX)}"
            )
            return JSONResponse(status_code=400, content={"detail": INVALID_INPUT_DETAIL})
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
import logging
import re
import sys
import traceback
from typing import Optional

from fastapi.exceptions import ValidationException
from pydantic import ValidationError
from sqlalchemy.exc import StatementError

from app.config.settings import settings

# Caps for fields copied into a log line from a request, or from another server's
# answer. Each is cleaned by sanitize_log_field first. Starlette's request.url.path
# already drops \t \r \n (urlsplit), but every other control / line-break character
# (ESC for ANSI injection, NUL, VT/FF, NEL, U+2028/9) survives percent-decoding and
# would otherwise land on the terminal / Railway stream verbatim, and a path
# parameter keeps \n as well. The search text is handed over by its route
# (request.state) rather than read here, but it is the user's input all the same.
LOG_PATH_MAX = 256   # wide enough to keep a full sqlmap-style payload readable
LOG_UA_MAX = 48      # parse_ua's browser branches have no cap of their own
LOG_IP_MAX = 45      # longest textual IPv6 (incl. IPv4-mapped); in dev the fallback can be X-Forwarded-For text, so untrusted
LOG_COLO_MAX = 3     # IATA airport code; hard-sliced so the column never widens
LOG_QUERY_MAX = 40   # search text; the API allows 100 and the line is already wide
LOG_EXC_MAX = 256    # an exception's own text
LOG_SQL_MAX = 512    # the SQL a failed statement ran: placeholders only, values are bound

# Anything shaped like an email address: written plainly or percent-encoded (%40),
# typed only as far as the @, or cut short by a cap. Railway keeps every line for 90
# days and can't delete one early, so no field may carry one, whoever typed it. The
# local part is any run of characters that isn't whitespace or one of the delimiters
# in _NOT_LOCAL, so apostrophes, symbols, other scripts and invisible characters are
# masked with it, while / = ? : and the like keep a path or a query readable around
# it. A match starts only where the character before can't belong to a local part,
# so each run is scanned once, from its start, and the search stays linear on any
# input; without that lookbehind, 1 MB of letters ending in " @" takes minutes.
# The at signs an address can be written with: the ASCII one, its percent-encoding,
# and the full-width and small forms that look like it.
AT_SIGNS = ("@", "%40", "\uff20", "\ufe6b")
_NOT_LOCAL = r'\s@/=?:;,<>()\[\]"\\\uff20\ufe6b'
EMAIL_SHAPE = re.compile(
    rf"(?<![^{_NOT_LOCAL}])(?:[^{_NOT_LOCAL}%]|%(?!40))++(?:@|%40|\uff20|\ufe6b)(?:[\w-]+(?:\.[\w-]+)*)?"
)


def sanitize_log_field(value: str, limit: int) -> str:
    """Render `value` safe for a single log line.

    Anything shaped like an email address becomes [email]; every non-printable
    character (C0/C1 controls, ESC, U+2028/2029, NEL, ...) becomes its Python escape
    (`\\n`, `\\x1b`, ...) so it reads as text instead of acting on the stream; anything
    past `limit` is dropped behind a marker.
    """
    if any(sign in value for sign in AT_SIGNS):
        value = EMAIL_SHAPE.sub('[email]', value)
    cleaned = ''.join(ch if ch.isprintable() else repr(ch)[1:-1] for ch in value)
    if len(cleaned) > limit:
        return cleaned[:limit] + '…'
    return cleaned


def _db_attr(exc: BaseException, name: str):
    """`name` from a database error or what it wraps: SQLAlchemy's error wraps its
    asyncpg adapter's, which wraps asyncpg's own, and each carries different parts."""
    seen = set()
    while exc is not None and id(exc) not in seen:
        seen.add(id(exc))
        value = getattr(exc, name, None)
        if value:
            return value
        exc = getattr(exc, "orig", None) or getattr(exc, "__cause__", None)
    return None


def _validation_summary(exc: ValidationError | ValidationException) -> str:
    """Where each check failed and how: the field's location and the error's type."""
    errors = exc.errors()
    fields = ", ".join(f"{'.'.join(str(part) for part in e.get('loc', ()))} {e.get('type', '-')}" for e in errors)
    return f"{len(errors)} {'error' if len(errors) == 1 else 'errors'}: {fields}"


def _innermost(exc: BaseException) -> BaseException:
    """What a database error wraps, all the way down: asyncpg's own error, or the OSError
    a failed connection raised."""
    seen = set()
    while id(exc) not in seen:
        seen.add(id(exc))
        inner = getattr(exc, "orig", None) or exc.__cause__
        if inner is None:
            return exc
        exc = inner
    return exc


def exc_text(exc: BaseException, limit: int = LOG_EXC_MAX) -> str:
    """An exception for one log line: its class, then its text, cleaned and capped.

    Two kinds give something other than their text:
    - A database error gives its class, SQLSTATE and constraint: the server's text
      quotes values (a unique violation's DETAIL names the duplicate email address or
      username), and hide_parameters only hides SQLAlchemy's own parameter dump. One
      with no SQLSTATE is the client's own (a busy or closed connection, a wrong
      argument count), whose text says what went wrong and holds no value, so that
      text follows. asyncpg's error for an argument it can't encode quotes the value,
      and it carries SQLSTATE 22000, so it never shows its text.
    - A validation error gives where each check failed and how: its text quotes the
      data it checked, such as a response holding a username.
    """
    name = type(exc).__name__
    if isinstance(exc, StatementError) or hasattr(exc, "sqlstate") or type(exc).__module__.startswith("asyncpg"):
        sqlstate = _db_attr(exc, "sqlstate")
        constraint = _db_attr(exc, "constraint_name")
        detail = f"SQLSTATE {sqlstate or '-'}" + (f", constraint {constraint}" if constraint else "")
        if not sqlstate:
            try:
                detail += f": {_innermost(exc)}"
            except Exception:
                detail += ": (its text could not be read)"
        return f"{name} ({sanitize_log_field(detail, limit)})"
    if isinstance(exc, (ValidationError, ValidationException)):
        try:
            summary = _validation_summary(exc)
        except Exception:
            summary = "its errors could not be read"
        return f"{name} ({sanitize_log_field(summary, limit)})"
    try:
        text = str(exc)
    except Exception:
        text = "(its text could not be read)"
    return f"{name}: {sanitize_log_field(text, limit)}"


def _frames_of(exc: BaseException) -> str:
    block = "Traceback (most recent call last):\n" + "".join(traceback.format_tb(exc.__traceback__)) + exc_text(exc)
    statement = getattr(exc, "statement", None)
    if isinstance(statement, str) and statement:
        block += "\nSQL: " + sanitize_log_field(statement, LOG_SQL_MAX)
    return block


def exc_frames(exc: BaseException) -> str:
    """A traceback for the log, oldest exception first as Python prints one: each
    exception's frames (file, line and source line, never a value) named by exc_text
    instead of its own text, the SQL a failed statement ran, and Python's line saying
    how each exception led to the next."""
    chain, seen = [], set()
    while exc is not None and id(exc) not in seen:
        seen.add(id(exc))
        chain.append(exc)
        if exc.__cause__ is not None:
            exc = exc.__cause__
        elif exc.__context__ is not None and not exc.__suppress_context__:
            exc = exc.__context__
        else:
            exc = None
    ordered = chain[::-1]
    parts = [_frames_of(ordered[0])]
    for older, newer in zip(ordered, ordered[1:]):
        if newer.__cause__ is older:
            parts.append("The above exception was the direct cause of the following exception:")
        else:
            parts.append("During handling of the above exception, another exception occurred:")
        parts.append(_frames_of(newer))
    return "\n\n".join(parts)


class _NamedTracebacks(logging.Filter):
    """Writes a record's exception the way error_handler does: named by exc_text, with
    exc_frames, never its raw text. The app never logs with exc_info (test_log_privacy
    holds it to that), but uvicorn does for an exception that escapes the app, such as
    one raised after the response has started (a dependency's cleanup, say), and so do
    libraries such as SQLAlchemy's pool and asyncio."""

    def filter(self, record: logging.LogRecord) -> bool:
        exc = record.exc_info[1] if record.exc_info else None
        if exc is not None:
            record.msg = f"{record.getMessage().rstrip()}: {exc_text(exc)}\n{exc_frames(exc)}"
            record.args = None
            record.exc_info = None
            record.exc_text = None
        return True


def setup_logging(log_level: Optional[str] = None) -> None:
    level = log_level or settings.LOG_LEVEL
    
    formatter = logging.Formatter(
        fmt='%(levelname)s: %(name)s: %(message)s',
    )
    
    console_handler = logging.StreamHandler(sys.stdout)
    console_handler.setFormatter(formatter)
    console_handler.addFilter(_NamedTracebacks())
    
    root_logger = logging.getLogger()
    root_logger.setLevel(level)
    root_logger.addHandler(console_handler)
    
    logging.getLogger("uvicorn.access").setLevel(logging.WARNING)
    uvicorn_error = logging.getLogger("uvicorn.error")
    uvicorn_error.setLevel(logging.INFO)
    # uvicorn's records go to its own handler, not the root's, so its error logger
    # gets the filter too.
    if not any(isinstance(f, _NamedTracebacks) for f in uvicorn_error.filters):
        uvicorn_error.addFilter(_NamedTracebacks())

    api_logger = logging.getLogger("api")
    api_handler = logging.StreamHandler(sys.stdout)
    api_handler.setFormatter(logging.Formatter('%(message)s'))
    api_logger.handlers = [api_handler]
    api_logger.propagate = False

    logging.getLogger("httpx").setLevel(logging.WARNING)
    logging.getLogger("openai").setLevel(logging.WARNING)

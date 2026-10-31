import logging
import re
import sys
from typing import Optional

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


def setup_logging(log_level: Optional[str] = None) -> None:
    level = log_level or settings.LOG_LEVEL
    
    formatter = logging.Formatter(
        fmt='%(levelname)s: %(name)s: %(message)s',
    )
    
    console_handler = logging.StreamHandler(sys.stdout)
    console_handler.setFormatter(formatter)
    
    root_logger = logging.getLogger()
    root_logger.setLevel(level)
    root_logger.addHandler(console_handler)
    
    logging.getLogger("uvicorn.access").setLevel(logging.WARNING)
    logging.getLogger("uvicorn.error").setLevel(logging.INFO)

    api_logger = logging.getLogger("api")
    api_handler = logging.StreamHandler(sys.stdout)
    api_handler.setFormatter(logging.Formatter('%(message)s'))
    api_logger.handlers = [api_handler]
    api_logger.propagate = False

    logging.getLogger("httpx").setLevel(logging.WARNING)
    logging.getLogger("openai").setLevel(logging.WARNING)

import time
import logging
from datetime import datetime
from zoneinfo import ZoneInfo
from fastapi import Request
from app.core.security import get_client_ip
from app.core.colours import GREEN, RED, YELLOW, CYAN, GRAY, RESET

logger = logging.getLogger("api")

LOG_TZ = ZoneInfo("America/New_York")

# Caps for request-controlled fields. Each is copied from the request into the
# access line, so it is neutralised first. Starlette's request.url.path already
# drops \t \r \n (urlsplit), but every other control / line-break character —
# ESC for ANSI injection, NUL, VT/FF, NEL, U+2028/9 — survives percent-decoding
# and would otherwise land on the terminal / Railway stream verbatim.
LOG_PATH_MAX = 256   # wide enough to keep a full sqlmap-style payload readable
LOG_UA_MAX = 48      # parse_ua's browser branches have no cap of their own
LOG_IP_MAX = 45      # longest textual IPv6 (incl. IPv4-mapped); header-derived, so untrusted


def sanitize_log_field(value: str, limit: int) -> str:
    """Render `value` safe for a single log line.

    Every non-printable character (C0/C1 controls, ESC, U+2028/2029, NEL, ...)
    becomes its Python escape (`\\n`, `\\x1b`, ...) so it reads as text instead of
    acting on the stream; anything past `limit` is dropped behind a marker.
    """
    cleaned = ''.join(ch if ch.isprintable() else repr(ch)[1:-1] for ch in value)
    if len(cleaned) > limit:
        return cleaned[:limit] + '…'
    return cleaned


def parse_ua(ua: str) -> str:
    """Extract short browser identifier from User-Agent string."""
    if 'bot' in ua.lower() or 'crawl' in ua.lower() or 'spider' in ua.lower():
        for part in ua.split():
            if 'bot' in part.lower() or 'crawl' in part.lower() or 'spider' in part.lower():
                return part.split('/')[0]
        return ua[:30]
    if 'Firefox/' in ua:
        return 'Firefox/' + ua.split('Firefox/')[1].split(' ')[0]
    if 'Chrome/' in ua and 'Edg/' not in ua:
        return 'Chrome/' + ua.split('Chrome/')[1].split(' ')[0]
    if 'Edg/' in ua:
        return 'Edge/' + ua.split('Edg/')[1].split(' ')[0]
    if 'Safari/' in ua and 'Chrome/' not in ua:
        return 'Safari/' + ua.split('Version/')[1].split(' ')[0] if 'Version/' in ua else 'Safari'
    return ua[:30]


def color_status(status: int) -> str:
    padded = f'{status}'.ljust(3)
    if status < 300:
        return f'{GREEN}{padded}{RESET}'   # 2xx success
    if status < 400:
        return f'{CYAN}{padded}{RESET}'    # 3xx redirect / 304 cache hit
    if status < 500:
        return f'{YELLOW}{padded}{RESET}'  # 4xx client error
    return f'{RED}{padded}{RESET}'         # 5xx server fault


def color_duration(ms: float) -> str:
    padded = f'{ms:.0f}ms'.rjust(6)
    if ms < 100:
        return f'{GREEN}{padded}{RESET}'
    if ms < 300:
        return f'{YELLOW}{padded}{RESET}'
    return f'{RED}{padded}{RESET}'


def color_cache(status: str) -> str:
    padded = status.ljust(4)
    if status == "HIT":
        return f'{GREEN}{padded}{RESET}'
    if status == "MISS":
        return f'{YELLOW}{padded}{RESET}'
    return f'{RED}{padded}{RESET}'


async def log_requests_middleware(request: Request, call_next):
    # Skip OPTIONS preflight noise
    if request.method == "OPTIONS":
        return await call_next(request)

    start_time = time.time()

    try:
        response = await call_next(request)
    except Exception as exc:
        duration_ms = (time.time() - start_time) * 1000
        client_ip = sanitize_log_field(get_client_ip(request), LOG_IP_MAX)
        path = sanitize_log_field(request.url.path, LOG_PATH_MAX)
        # An exception message can echo request input, so it is as untrusted as the path.
        detail = sanitize_log_field(str(exc), LOG_PATH_MAX)
        logger.error(
            f'{datetime.now(LOG_TZ).strftime("%m-%d %H:%M:%S")} · {client_ip:<15} → {request.method:<6} '
            f'{RED}500{RESET} {color_duration(duration_ms)} | {path} | unhandled exception: {detail}'
        )
        raise

    duration_ms = (time.time() - start_time) * 1000

    # Only log API routes
    if not request.url.path.startswith("/api/"):
        response.headers["X-Process-Time"] = str(duration_ms / 1000)
        return response

    client_ip = sanitize_log_field(get_client_ip(request), LOG_IP_MAX)
    path = sanitize_log_field(request.url.path, LOG_PATH_MAX)
    user_agent = request.headers.get("user-agent", "-")
    cache_status = getattr(request.state, "cache_status", None)
    db_time = getattr(request.state, "db_time", None)

    # Fixed-width columns
    log_parts = [
        f'{datetime.now(LOG_TZ).strftime("%m-%d %H:%M:%S")} · {client_ip:<15} → {request.method:<6}',
        color_status(response.status_code),
        color_duration(duration_ms),
        color_cache(cache_status) if cache_status else '    ',
        f'DB: {db_time:>3.0f}ms' if db_time else '         ',
    ]

    log_line = ' | '.join(log_parts) + f' | {path}'

    # Only show UA for auth endpoints or non-2xx responses — appended after path
    if request.url.path.startswith("/api/auth") or response.status_code >= 400:
        log_line += f' | {GRAY}UA: {sanitize_log_field(parse_ua(user_agent), LOG_UA_MAX)}{RESET}'
        # auth_fail_reason: set by auth routes on 401 (no-cookie vs revoked-or-expired).
        # reject_reason: set by whichever layer answered a 404 (origin_check,
        # bot_filter, the SPA catch-all's unknown-/api/ branch). Either way the
        # access log alone says who answered and why.
        reason = (
            getattr(request.state, "auth_fail_reason", None)
            or getattr(request.state, "reject_reason", None)
        )
        if reason:
            log_line += f' {GRAY}({reason}){RESET}'

    if response.status_code >= 500:
        logger.error(log_line)
    elif response.status_code >= 400:
        logger.warning(log_line)
    else:
        logger.info(log_line)

    response.headers["X-Process-Time"] = str(duration_ms / 1000)
    return response


def add_logging_middleware(app):
    app.middleware("http")(log_requests_middleware)

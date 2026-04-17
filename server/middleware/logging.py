import time
import logging
from datetime import datetime
from zoneinfo import ZoneInfo
from fastapi import Request
from middleware.bot_filter import get_client_ip

logger = logging.getLogger("api")

# ANSI colors
GREEN = "\033[92m"
RED = "\033[91m"
YELLOW = "\033[93m"
CYAN = "\033[96m"
GRAY = "\033[90m"
RESET = "\033[0m"

LOG_TZ = ZoneInfo("America/New_York")


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
        return f'{GREEN}{padded}{RESET}'
    if status < 400:
        return f'{YELLOW}{padded}{RESET}'
    return f'{RED}{padded}{RESET}'


def color_duration(ms: float) -> str:
    padded = f'{ms:.0f}ms'.rjust(6)
    if ms < 50:
        return f'{GREEN}{padded}{RESET}'
    if ms < 200:
        return f'{YELLOW}{padded}{RESET}'
    return f'{RED}{padded}{RESET}'


def color_cache(status: str) -> str:
    padded = status.ljust(4)
    if status == "HIT":
        return f'{GREEN}{padded}{RESET}'
    return f'{RED}{padded}{RESET}'


async def log_requests_middleware(request: Request, call_next):
    start_time = time.time()
    response = await call_next(request)
    duration_ms = (time.time() - start_time) * 1000

    # Skip logging for bot/banned requests
    if getattr(request.state, "bot_blocked", False):
        return response

    # Only log API routes
    if not request.url.path.startswith("/api/"):
        response.headers["X-Process-Time"] = str(duration_ms / 1000)
        return response

    client_ip = get_client_ip(request)
    user_agent = request.headers.get("user-agent", "-")
    cache_status = getattr(request.state, "cache_status", None)
    db_time = getattr(request.state, "db_time", None)

    # Fixed-width columns 
    log_parts = [
        f'{datetime.now(LOG_TZ).strftime("%H:%M:%S")} · {client_ip:<15} → {request.method:<4}',
        color_status(response.status_code),
        color_duration(duration_ms),
        color_cache(cache_status) if cache_status else '    ',
        f'DB: {db_time:>3.0f}ms' if db_time else '         ',
    ]

    log_line = ' | '.join(log_parts) + f' | {request.url.path}'

    # Only show UA for auth endpoints or non-2xx responses — appended after path
    if request.url.path.startswith("/api/auth") or response.status_code >= 400:
        log_line += f' | {GRAY}UA: {parse_ua(user_agent)}{RESET}'

    logger.info(log_line)

    response.headers["X-Process-Time"] = str(duration_ms / 1000)
    return response


def add_logging_middleware(app):
    app.middleware("http")(log_requests_middleware)
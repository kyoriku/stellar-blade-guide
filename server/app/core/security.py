import ipaddress

from slowapi import Limiter
from fastapi import Request
from app.config.settings import settings


def cf_connecting_ip(request: Request) -> str | None:
    """CF-Connecting-IP as a canonical address, or None when it is missing or is not one.

    Strips only HTTP's own whitespace (space and tab): h11 trims it but httptools, the
    parser prod runs, keeps it at the end of a value. A bare strip() would also accept
    an address padded with NBSP or NEL. A zone id is free text, so an address carrying
    one is refused.
    """
    try:
        addr = ipaddress.ip_address(request.headers.get("cf-connecting-ip", "").strip(" \t"))
    except ValueError:
        return None
    if getattr(addr, "scope_id", None):
        return None
    return str(addr)


def get_client_ip(request: Request) -> str:
    """The client address for the rate limiter and the access log.

    CF-Connecting-IP when it holds an IP address: Cloudflare sets it on every proxied
    request and refuses one a client sends (403, Error 1000), and Railway's Edge Rule
    turns away anything that skipped Cloudflare. Otherwise the connection's client
    address: the socket peer, or the X-Forwarded-For entry uvicorn picks when the peer
    is a proxy it trusts (127.0.0.1 by default; every peer under the Dockerfile's
    --forwarded-allow-ips '*', where it is the first entry). No other header is
    read: each can carry text the client wrote (Cloudflare appends to X-Forwarded-For
    and passes the others through). Never empty: slowapi skips the limit for an empty
    key.
    """
    cf_ip = cf_connecting_ip(request)
    if cf_ip:
        return cf_ip
    if request.client and request.client.host:
        return request.client.host
    return "unknown"


def rate_limit_key(request: Request) -> str:
    """The limiter's key: get_client_ip, with an IPv6 address widened to its /64.

    A /64 is one LAN, the smallest prefix a subscriber holds (home sites usually get
    a /56 or /48), so a per-address key would give them 2**64 buckets. An IPv4-mapped
    address counts as its IPv4 address (a naive /64 would put all of them in ::/64).
    Anything that is not an address shares one bucket, so raw text never reaches
    slowapi's unsanitised 429 log line. The parameter must be named `request`: slowapi
    calls a key function without one bare, swallows the TypeError, runs every limited
    route unlimited and then answers 500, and marks the worker's storage dead.
    """
    try:
        addr = ipaddress.ip_address(get_client_ip(request))
    except ValueError:
        return "unknown"
    if addr.version == 6:
        if addr.ipv4_mapped:
            return str(addr.ipv4_mapped)
        return str(ipaddress.IPv6Network((int(addr) >> 64 << 64, 64)))
    return str(addr)


# Redis failures must never take routes down: bound socket waits to 2s, fall
# back to per-process in-memory limits while Redis is unreachable (slowapi
# rechecks the backend with exponential backoff), and swallow anything else.
#
# key_style="endpoint" gives each route one counter per client, however its URL is
# spelled (/comments/7, /comments/07). A strategy change must also change the key
# names (key_style or a key_prefix): fixed-window keeps a Redis string and
# moving-window a list under the same name, so a strategy-only change meets live
# keys of the other type, and each WRONGTYPE moves that worker onto per-process
# counting until its next backend check.
limiter = Limiter(
    key_func=rate_limit_key,
    key_style="endpoint",
    strategy="moving-window",
    storage_uri=settings.REDIS_URL,
    storage_options={"socket_connect_timeout": 2, "socket_timeout": 2},
    swallow_errors=True,
    in_memory_fallback_enabled=True,
)

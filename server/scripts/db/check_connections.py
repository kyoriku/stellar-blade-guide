"""
Check that the Postgres and Redis this process is pointed at answer a real query.

Usage:
  uv run python scripts/db/check_connections.py [--wait SECONDS]   # default 30

prod_seed.py runs it first, before its typed confirmation, with the same
DATABASE_URL and REDIS_URL it gives the seeders, so the check reaches exactly
what they will, through the same engine (app.db.database) and Redis client
(app.core.cache). Postgres must answer SELECT 1, Redis an authenticated PING.

Each URL is first read the way its driver will read it, and the two differ.
SQLAlchemy ends a password at the first '@', so with a second '@' the rest of
the password becomes part of the host. redis-py ends the host part at the first
'/', '?' or '#', even inside a password. A URL with more than one '@', one its
driver can't parse, or one its driver reads a different host from stops the
check at once, with nothing probed: no retry can fix it, and the host it would
look up holds part of the password.

A connection that is refused, reset, lost or too slow is retried until --wait
runs out: a tunnel can take a moment to carry traffic. Anything else stops at
once, because waiting won't fix it: a refused password, an unknown database, a
URL key the driver rejects, a server that refuses TLS. Exits 0 when both
answered, 1 if not. However a connection's cleanup behaves, the process is gone
within --wait plus 20 seconds.

Through the SSH tunnel, prod Postgres doesn't check the password (the
connection arrives from inside its own container), so SELECT 1 proves the
tunnel and the server, not the password in the URL. Redis checks its password.

A host other than host.docker.internal didn't come through the tunnels, so its
password and traffic may have crossed the network in plain text. That gets a
warning, never a stop.

Prints the host, port and database each driver will use, never a URL's user
name or password, and every form of a password is replaced with ***** in error
text.
"""

import argparse
import asyncio
import importlib
import os
import ssl
import sys
import threading
import time
from pathlib import Path
from urllib.parse import parse_qs, unquote, urlsplit

project_root = Path(__file__).parent.parent.parent
sys.path.insert(0, str(project_root))

from app.core.colours import GREEN, RED, RESET, YELLOW  # noqa: E402

TUNNEL_HOST = "host.docker.internal"
DEFAULT_WAIT = 30.0
# A cold Postgres attempt is about 18 round trips (startup, SQLAlchemy's first-connect
# queries, BEGIN, SELECT 1, ROLLBACK), so this leaves room for a slow link. A tunnel that
# accepts and never answers is still bounded by --wait.
ATTEMPT_TIMEOUT = 15.0
RETRY_INTERVAL = 1.0
# How long after --wait the process may still be cleaning up before it gives up: asyncpg
# answers a cancelled query by sending a cancel request through the same, possibly dead,
# tunnel, and SQLAlchemy's cleanup waits on that with no timeout of its own.
HARD_LIMIT_GRACE = 20.0


class UrlError(Exception):
    """A URL the driver can't parse. The parser's own message quotes part of the URL,
    password included, so only this fixed text gets out."""


def split_url(url):
    """(userinfo, host, port, path) as the URL is written: the credentials end at its LAST
    '@', so a raw '/', '?', '#' or '@' in a password stays with them. That's the host the
    user meant. A driver can read another (see reading()), and url_problem refuses that.
    userinfo is None when there is no '@'. None when the host or port doesn't parse."""
    scheme, sep, tail = url.partition("://")
    if not sep or not scheme:
        return None
    userinfo, at, rest = tail.rpartition("@")
    if not at:
        userinfo, rest = None, tail
    for mark in ("?", "#"):
        rest = rest.split(mark, 1)[0]
    hostport, slash, path = rest.partition("/")
    try:
        parts = urlsplit("//" + hostport)
        host, port = parts.hostname, parts.port
    except ValueError:
        return None
    if not host:
        return None
    return userinfo, host, port, (slash + path if slash else "")


def _postgres_reading(url):
    """As SQLAlchemy reads it for the seeders' engine: the user name ends at the first ':'
    or '/', the password at the FIRST '@', and the host runs from there to a ':', '/' or
    '?', taking in any second '@'."""
    from sqlalchemy.engine import make_url

    try:
        found = make_url(url)
    except Exception:       # its message quotes the URL, password included
        return None
    return found.host, found.port, found.database


def _redis_reading(url):
    """As redis-py reads it for app.core.cache: the host part ends at the first '/', '?'
    or '#', even inside a password, and the credentials end at the LAST '@' before that."""
    from redis.asyncio.connection import parse_url

    try:
        found = parse_url(url)
    except Exception:       # its message quotes the URL, password included
        return None
    return found.get("host"), found.get("port"), found.get("db")


# For each URL: the driver that reads it, how, and the shape it expects.
DRIVERS = {
    "Postgres": ("SQLAlchemy", _postgres_reading, "postgresql://user:password@host:port/database"),
    "Redis": ("redis-py", _redis_reading, "redis://default:password@host:port"),
}
ENCODING = "Percent-encode the user name and password: @ as %40, / as %2F, ? as %3F, # as %23."


def reading(name, url):
    """(host, port, database) the driver for name will connect with, or None when it can't
    parse url. Show it only once url_problem has passed: a misread host holds part of the
    password."""
    return DRIVERS[name][1](url)


def url_problem(name, url):
    """(what is wrong, how to fix it) when the driver for name won't connect where url
    says, else None. Fixed text only, nothing from the URL."""
    driver, _, shape = DRIVERS[name]
    if url.count("@") > 1:
        return "the URL has more than one @", "Write an @ in the password as %40."
    found = reading(name, url)
    if found is None or not found[0]:
        return f"{driver} can't parse the URL", f"It expects {shape}. {ENCODING}"
    written = split_url(url)
    if written is None or (found[0].lower(), found[1]) != (written[1].lower(), written[2]):
        return f"{driver} reads a different host from the one written", ENCODING
    return None


def where(name, url):
    """host:port/database as the driver for name will connect, for display. Never the user
    name or password, so a URL url_problem refuses isn't shown at all."""
    if url_problem(name, url) is not None:
        return "(not shown)"
    host, port, database = reading(name, url)
    if ":" in host:
        host = f"[{host}]"
    shown = f"{host}:{port}" if port else host
    return shown + (f"/{database}" if database not in (None, "") else "")


def secrets_in(*urls):
    """Every form a URL's credentials can take in error text, longest first so no fragment
    survives a replace: the userinfo, its password, both percent-decoded, and any password=
    query value. A userinfo with no ':' counts whole, since it may be a password pasted
    without its user name."""
    found = set()
    for url in urls:
        parsed = split_url(url)
        candidates = []
        if parsed is not None and parsed[0]:
            userinfo = parsed[0]
        elif parsed is None:
            # Too broken to parse (a dropped '/', say): everything between the scheme and
            # the last '@' is credentials.
            head, at, _ = url.rpartition("@")
            userinfo = head.partition(":")[2].lstrip("/") if at else ""
        else:
            userinfo = ""
        if userinfo:
            _, colon, password = userinfo.partition(":")
            candidates += [userinfo, password] if colon else [userinfo]
        candidates += parse_qs(url.partition("?")[2]).get("password", [])
        for value in candidates:
            for form in (value, unquote(value)):
                if form:
                    found.add(form)
    return sorted(found, key=len, reverse=True)


def redact(text, secrets):
    for secret in secrets:
        text = text.replace(secret, "*****")
    return text


def _chain(exc):
    """The exception, what SQLAlchemy wrapped (.orig), and what it was raised from, each
    once. Not __context__: an unrelated error handled earlier mustn't make a real failure
    look retryable."""
    seen = set()
    stack = [exc]
    while stack:
        e = stack.pop()
        if e is None or id(e) in seen:
            continue
        seen.add(id(e))
        yield e
        stack.extend([getattr(e, "orig", None), e.__cause__])


def _stops_at_once(e):
    """Connection-shaped errors that a retry can't fix."""
    import redis

    if isinstance(e, redis.exceptions.AuthenticationError):
        return True     # a ConnectionError subclass, so it must be ruled out first
    if isinstance(e, ssl.SSLCertVerificationError):
        return True
    if type(e) is ConnectionError and "rejected SSL upgrade" in str(e):
        return True
    return False


def _is_transient(e):
    import asyncpg
    import redis

    if isinstance(e, (OSError, TimeoutError)):     # refused, reset, DNS, timed out
        return True
    if isinstance(e, (asyncpg.exceptions.ConnectionDoesNotExistError,      # lost mid-startup
                      asyncpg.exceptions.CannotConnectNowError)):          # server starting up
        return True
    if isinstance(e, (redis.exceptions.ConnectionError, redis.exceptions.TimeoutError)):
        return True
    return False


def retryable(exc):
    """True for a failure a tunnel coming up could still clear."""
    links = list(_chain(exc))
    if any(_stops_at_once(e) for e in links):
        return False
    return any(_is_transient(e) for e in links)


def describe(exc, secrets):
    """'Type sqlstate: first line of the message', redacted."""
    root = exc
    while getattr(root, "orig", None) is not None:
        root = root.orig
    sqlstate = getattr(root, "sqlstate", None) or getattr(exc, "sqlstate", None)
    label = type(root).__name__ + (f" {sqlstate}" if sqlstate else "")
    text = str(root).strip().splitlines()[0] if str(root).strip() else ""
    return redact(f"{label}: {text}" if text else label, secrets)


async def wait_for(name, url, probe, answered, *, deadline, wait, secrets, out,
                   attempt_timeout=ATTEMPT_TIMEOUT, interval=RETRY_INTERVAL,
                   clock=time.monotonic, sleep=asyncio.sleep):
    """Run probe until it succeeds, a failure can't be retried, or the deadline passes.
    Writes its lines through out as they happen. Returns True when it answered."""
    shown = redact(where(name, url), secrets)
    tries = 0
    last = None
    ok = False
    while True:
        tries += 1
        cap = max(0.1, min(attempt_timeout, deadline - clock()))
        try:
            async with asyncio.timeout(cap):
                await probe()
            note = "" if tries == 1 else f" (try {tries})"
            out(f"  {GREEN}{name}{RESET} {shown}: {answered}{note}")
            ok = True
            break
        except Exception as e:
            if not retryable(e):
                out(f"  {RED}{name}{RESET} {shown}: stopped, {describe(e, secrets)}")
                break
            if last is None:
                out(f"  {name} {shown}: not answering yet ({describe(e, secrets)}), "
                    f"retrying for up to {wait:g} s")
            last = e
        remaining = deadline - clock()
        if remaining <= 0:
            out(f"  {RED}{name}{RESET} {shown}: no answer in {wait:g} s "
                f"(last: {describe(last, secrets)})")
            break
        await sleep(min(interval, remaining))

    found = reading(name, url)
    if found is None or not found[0] or found[0].lower() != TUNNEL_HOST:
        out(f"  {YELLOW}[WARN]{RESET} {name} at {shown} isn't the tunnel host ({TUNNEL_HOST}): "
            f"its password and traffic may cross the network in plain text")
    return ok


async def run_checks(targets, *, wait, out, attempt_timeout=ATTEMPT_TIMEOUT,
                     interval=RETRY_INTERVAL, clock=time.monotonic, sleep=asyncio.sleep):
    """targets: (name, url, probe, answered) tuples, probed concurrently against one
    deadline. Every URL is read first, and one its driver would misread stops the check
    with nothing probed. True when every one answered."""
    problems = [(name, url_problem(name, url)) for name, url, _, _ in targets]
    for name, problem in problems:
        if problem is not None:
            what, fix = problem
            out(f"  {RED}{name}{RESET}: stopped, {what}. {fix}")
    if any(problem is not None for _, problem in problems):
        return False
    secrets = secrets_in(*(url for _, url, _, _ in targets))
    deadline = clock() + wait
    results = await asyncio.gather(*(
        wait_for(name, url, probe, answered, deadline=deadline, wait=wait, secrets=secrets,
                 out=out, attempt_timeout=attempt_timeout, interval=interval, clock=clock,
                 sleep=sleep)
        for name, url, probe, answered in targets))
    return all(results)


def _import_parsing(module, variable, shape):
    """Import a module that parses a URL at import time, turning a parse failure into a
    fixed-text UrlError."""
    from sqlalchemy.exc import ArgumentError

    try:
        return importlib.import_module(module)
    except (ValueError, ArgumentError):
        raise UrlError(f"{variable} doesn't parse (expected {shape})") from None


async def _probe_postgres():
    # Imported here, not at the top: a malformed URL fails at import, and that failure must
    # get the same handling as any other.
    database = _import_parsing("app.db.database", "DATABASE_URL", DRIVERS["Postgres"][2])
    from sqlalchemy import text

    async with database.engine.connect() as conn:
        await conn.execute(text("SELECT 1"))


async def _probe_redis():
    cache = _import_parsing("app.core.cache", "REDIS_URL", DRIVERS["Redis"][2])
    if not await cache.redis_client.ping():
        raise RuntimeError("PING did not answer")


async def _close_clients():
    """Best effort, a few seconds each: an exit that leaves the pool to the garbage
    collector prints warnings, and a close stuck on a dead tunnel mustn't hold the exit."""
    database = sys.modules.get("app.db.database")
    cache = sys.modules.get("app.core.cache")
    closers = []
    if database is not None:
        closers.append(database.engine.dispose)
    if cache is not None:
        closers.append(cache.redis_client.aclose)
    for close in closers:
        try:
            await asyncio.wait_for(close(), 5)
        except Exception:
            pass


def _urls():
    """The URLs the probes connect to: app.config.settings loads server/.env when the
    environment doesn't set them, and rewrites the Postgres scheme the way the seeders see it."""
    try:
        from app.config.settings import settings

        return settings.DATABASE_URL, settings.REDIS_URL
    except Exception:
        return os.environ.get("DATABASE_URL", ""), os.environ.get("REDIS_URL", "redis://localhost:6379")


async def main(wait):
    db_url, redis_url = _urls()
    parsed = split_url(redis_url)
    redis_answer = ("answered PING after AUTH" if parsed and parsed[0] and ":" in parsed[0]
                    else "answered PING without a password")
    targets = [
        ("Postgres", db_url, _probe_postgres, "answered SELECT 1"),
        ("Redis", redis_url, _probe_redis, redis_answer),
    ]
    try:
        return await run_checks(targets, wait=wait, out=lambda line: print(line, flush=True))
    finally:
        await _close_clients()


def run_with_hard_limit(make_coro, *, limit, out=print):
    """asyncio.run(make_coro()), but never longer than limit seconds: a connection whose
    cleanup is stuck on a dead tunnel would otherwise keep the process, and prod_seed.py
    reading its output, waiting for good."""
    def give_up():
        out(f"  {RED}Check{RESET} still running after {limit:g} s: a connection's cleanup is "
            f"stuck, likely on a dead tunnel; giving up")
        sys.stdout.flush()
        os._exit(1)

    timer = threading.Timer(limit, give_up)
    timer.daemon = True
    timer.start()
    try:
        return asyncio.run(make_coro())
    finally:
        timer.cancel()


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Wait until DATABASE_URL and REDIS_URL answer a real query.")
    parser.add_argument("--wait", type=float, default=DEFAULT_WAIT,
                        help=f"seconds to keep retrying connection errors (default {DEFAULT_WAIT:g})")
    args = parser.parse_args()
    ok = run_with_hard_limit(lambda: main(args.wait), limit=args.wait + HARD_LIMIT_GRACE,
                             out=lambda line: print(line, flush=True))
    sys.exit(0 if ok else 1)

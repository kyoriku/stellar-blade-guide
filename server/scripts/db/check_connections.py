"""
Check that the Postgres and Redis this process is pointed at answer a real query.

Usage:
  uv run python scripts/db/check_connections.py [--wait SECONDS]   # default 30
  uv run python scripts/db/check_connections.py --only postgres    # or redis: just that one

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
answered, 1 when one didn't answer in time, 3 when one stopped at once.
However a connection's cleanup behaves, the process is gone within --wait plus
20 seconds.

The other scripts that read prod (search_eval.py, cache_stats.py,
purge_api_cache.py --singular-walkthroughs, and the local diff and migrations)
call require() once they have pointed DATABASE_URL or REDIS_URL at prod, before
anything imports the app's engine or Redis client. It runs this file as a child,
waits 10 s rather than 30, and stops the script with exit 2 and the railway
connect line to run when prod doesn't answer. They show URLs with mask(), the
same display as prod_seed.py's header.

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
import errno
import importlib
import os
import signal
import socket
import ssl
import subprocess
import sys
import threading
import time
from pathlib import Path
from urllib.parse import parse_qs, unquote, urlsplit

project_root = Path(__file__).parent.parent.parent
sys.path.insert(0, str(project_root))

from app.core.colours import GREEN, RED, RESET, YELLOW  # noqa: E402

TUNNEL_HOST = "host.docker.internal"
# The tunnels' usual ports, for a tunnel URL that names none (prod_seed.py uses the same).
TUNNEL_DEFAULT_PORTS = {"Postgres": 15432, "Redis": 16379}
DEFAULT_WAIT = 30.0
# What require() gives a script: it isn't the first step of a long run, and 10 s still
# covers a tunnel that has just been opened.
SCRIPT_WAIT = 10.0

# The CLI's exit statuses.
EXIT_NO_ANSWER = 1      # a service didn't answer before --wait ran out
EXIT_STOPPED = 3        # a service stopped the check at once: waiting wouldn't fix it
# What a script that require()s prod exits with when prod doesn't answer or can't be used:
# nothing ran, the same as argparse's own 2.
EXIT_UNREACHABLE = 2
EXIT_INTERRUPTED = 130

# The variable each service's URL is read from, by the app and by require().
URL_VARIABLES = {"Postgres": "DATABASE_URL", "Redis": "REDIS_URL"}
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


def mask(name, url):
    """A URL for display, as prod_seed.py's header shows it: the scheme, '*****@' when the
    URL carries credentials, and where the driver will connect. Never the user name, the
    password or the query string, and a URL url_problem refuses isn't shown at all, since
    the host a driver misreads holds part of the password. prod_seed.py keeps its own copy
    (_mask); a test keeps the two equal."""
    problem = url_problem(name, url)
    if problem is not None:
        return f"(not shown: {problem[0]})"
    scheme = url.partition("://")[0]
    credentials = "*****@" if split_url(url)[0] is not None else ""
    return f"{scheme}://{credentials}{where(name, url)}"


def tunnel_commands(pairs):
    """The railway connect line for each (name, url) written to reach prod through a tunnel
    on the Mac, going by the host as written: that's what the tunnel was opened for. The port
    is the URL's, or the tunnel's usual one when it names none. A URL anywhere else gets no
    line. prod_seed.py's _tunnel_commands gives the same lines; a test keeps them equal."""
    lines = []
    for name, url in pairs:
        parsed = split_url(url)
        if parsed is None or parsed[1] != TUNNEL_HOST:
            continue
        port = parsed[2] or TUNNEL_DEFAULT_PORTS[name]
        lines.append(f"railway connect {name} --tunnel-only -P {port} --environment production 2>/dev/null")
    return lines


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


def lost(exc):
    """True when exc says a connection to Postgres or Redis was refused, dropped or timed
    out, which is what a closed or dropped tunnel looks like, as opposed to the database
    refusing a statement. Narrower than retryable(), which only ever sees a probe's errors:
    a broken pipe to this script's own output, a file error, or anything from requests (the
    Cloudflare calls) isn't a lost tunnel."""
    import asyncpg
    import redis

    links = list(_chain(exc))
    if any(type(e).__module__.split(".")[0] == "requests" for e in links):
        return False
    for e in links:
        if getattr(e, "connection_invalidated", False):      # SQLAlchemy saw a disconnect
            return True
        if isinstance(e, (ConnectionRefusedError, ConnectionResetError, ConnectionAbortedError,
                          socket.gaierror, TimeoutError)):
            return True
        if isinstance(e, OSError) and (e.errno in (errno.ENETUNREACH, errno.EHOSTUNREACH)
                                       or str(e).startswith("Multiple exceptions:")):
            return True     # the second: asyncio's text when every address of a host refused
        if isinstance(e, (asyncpg.exceptions.PostgresConnectionError,     # SQLSTATE class 08
                          asyncpg.exceptions.CannotConnectNowError)):
            return True
        if (isinstance(e, (redis.exceptions.ConnectionError, redis.exceptions.TimeoutError))
                and not isinstance(e, redis.exceptions.AuthenticationError)):
            return True
    return False


def _subject(names):
    return " or ".join(names)


def _service_urls(names):
    """(name, url) for each service, from the variables the app reads them from."""
    return [(name, os.environ.get(URL_VARIABLES[name], "")) for name in names]


def _advice(pairs, dropped):
    """The arrow line and the railway connect line(s) for the tunnels these URLs go through.
    Nothing when none does, so a URL pointing anywhere else isn't told to open a tunnel."""
    commands = tunnel_commands(pairs)
    if not commands:
        return []
    if dropped:
        head = ("If its tunnel dropped, reopen it in a Mac tab" if len(commands) == 1
                else "If a tunnel dropped, reopen it in a Mac tab")
    else:
        head = ("If its tunnel isn't open, run this in a Mac tab" if len(commands) == 1
                else "If the tunnels aren't open, run these in two Mac tabs")
    return [f"  → {head}, then run this again:"] + [f"      {command}" for command in commands]


def _culprit(exc):
    """The link of exc that says what happened: the driver's own error, not the wrappers
    SQLAlchemy puts around it, else the system's."""
    import asyncpg
    import redis

    links = list(_chain(exc))
    for kinds in ((asyncpg.exceptions.PostgresError, redis.exceptions.RedisError), (OSError,)):
        for e in links:
            if isinstance(e, kinds):
                return e
    return exc


def _reason(exc, secrets):
    """describe() of the culprit, except that a timeout, which carries no text, says what
    happened."""
    culprit = _culprit(exc)
    if isinstance(culprit, TimeoutError) and not str(culprit).strip():
        return "no answer in time"
    return describe(culprit, secrets)


def no_answer_message(names, seconds):
    """A script's last words when its watchdog ends it (scripts/db/seed_guard.py): the
    database stopped answering partway through."""
    lines = [(f"{RED}✗ No answer from prod {_subject(names)} for {seconds:g} s; its tunnel may "
              f"have dropped.{RESET}")]
    return "\n".join(lines + _advice(_service_urls(names), dropped=True))


def lost_message(names, reason):
    """A script's last words when its connection to prod was lost partway through."""
    lines = [f"{RED}✗ Lost prod {_subject(names)} partway through ({reason}).{RESET}"]
    return "\n".join(lines + _advice(_service_urls(names), dropped=True))


def report_lost(names, exc):
    """Print lost_message for exc (one lost() is true for), its text redacted."""
    secrets = secrets_in(*(url for _, url in _service_urls(names)))
    print(lost_message(names, _reason(exc, secrets)), flush=True)


async def wait_for(name, url, probe, answered, *, deadline, wait, secrets, out,
                   attempt_timeout=ATTEMPT_TIMEOUT, interval=RETRY_INTERVAL,
                   clock=time.monotonic, sleep=asyncio.sleep, stopped=None):
    """Run probe until it succeeds, a failure can't be retried, or the deadline passes.
    Writes its lines through out as they happen. Returns True when it answered. A failure
    that can't be retried adds name to the stopped list, when one is given."""
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
                if stopped is not None:
                    stopped.append(name)
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
                     interval=RETRY_INTERVAL, clock=time.monotonic, sleep=asyncio.sleep,
                     stopped=None):
    """targets: (name, url, probe, answered) tuples, probed concurrently against one
    deadline. Every URL is read first, and one its driver would misread stops the check
    with nothing probed. True when every one answered. Each one that stopped the check at
    once, rather than not answering in time, goes in the stopped list when one is given."""
    problems = [(name, url_problem(name, url)) for name, url, _, _ in targets]
    for name, problem in problems:
        if problem is not None:
            what, fix = problem
            out(f"  {RED}{name}{RESET}: stopped, {what}. {fix}")
            if stopped is not None:
                stopped.append(name)
    if any(problem is not None for _, problem in problems):
        return False
    secrets = secrets_in(*(url for _, url, _, _ in targets))
    deadline = clock() + wait
    results = await asyncio.gather(*(
        wait_for(name, url, probe, answered, deadline=deadline, wait=wait, secrets=secrets,
                 out=out, attempt_timeout=attempt_timeout, interval=interval, clock=clock,
                 sleep=sleep, stopped=stopped)
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


async def main(wait, only=None, stopped=None):
    """Check both services, or just `only` ("postgres" or "redis")."""
    db_url, redis_url = _urls()
    parsed = split_url(redis_url)
    redis_answer = ("answered PING after AUTH" if parsed and parsed[0] and ":" in parsed[0]
                    else "answered PING without a password")
    targets = [
        ("Postgres", db_url, _probe_postgres, "answered SELECT 1"),
        ("Redis", redis_url, _probe_redis, redis_answer),
    ]
    if only:
        targets = [target for target in targets if target[0].lower() == only]
    try:
        return await run_checks(targets, wait=wait, out=lambda line: print(line, flush=True),
                                stopped=stopped)
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


def _run_check(argv):
    """Run the check as a child in its own process group, so a Ctrl+C reaches only this
    script, which then ends the child at once, as prod_seed.py ends its steps. Returns the
    child's exit status."""
    proc = subprocess.Popen(argv, process_group=0)
    try:
        return proc.wait()
    except BaseException:
        try:
            os.killpg(proc.pid, signal.SIGKILL)
        except ProcessLookupError:
            pass
        proc.wait()
        raise


def require(names, *, wait=SCRIPT_WAIT):
    """Stop this script, with nothing done, unless the prod services it reads answer.

    names are "Postgres" and/or "Redis", read from DATABASE_URL and REDIS_URL, which the
    script has just pointed at PROD_DATABASE_URL and PROD_REDIS_URL. Call it before importing
    anything that builds the app's engine or Redis client: they parse their URL at import,
    and a parser's error quotes the password. The check runs as a child, as prod_seed.py runs
    it, so a connection stuck on a dead tunnel can't hold this process. Exits
    EXIT_UNREACHABLE when the check fails, naming the tunnel to open when one could be the
    cause, and 130 on Ctrl+C."""
    plural = len(names) > 1
    print(f"Checking that prod {' and '.join(names)} answer{'' if plural else 's'} "
          f"(scripts/db/check_connections.py)", flush=True)
    argv = [sys.executable, str(Path(__file__).resolve()), "--wait", f"{wait:g}"]
    if not plural:
        argv += ["--only", names[0].lower()]
    try:
        code = _run_check(argv)
    except KeyboardInterrupt:
        print("Interrupted: nothing ran.", flush=True)
        sys.exit(EXIT_INTERRUPTED)
    if code == 0:
        return
    if code == EXIT_STOPPED:
        # A misread URL, a refused password, an unknown database: no tunnel will fix it.
        print(f"{RED}✗ Prod {_subject(names)} can't be used as set up (see the line above), so "
              f"this stopped before doing anything.{RESET}", flush=True)
    else:
        lines = [(f"{RED}✗ Prod {_subject(names)} didn't answer (see above), so this stopped "
                  f"before doing anything.{RESET}")]
        print("\n".join(lines + _advice(_service_urls(names), dropped=False)), flush=True)
    sys.exit(EXIT_UNREACHABLE)


if __name__ == "__main__":
    parser = argparse.ArgumentParser(
        allow_abbrev=False,
        description="Wait until DATABASE_URL and REDIS_URL answer a real query.")
    parser.add_argument("--wait", type=float, default=DEFAULT_WAIT,
                        help=f"seconds to keep retrying connection errors (default {DEFAULT_WAIT:g})")
    parser.add_argument("--only", choices=("postgres", "redis"),
                        help="check just this one")
    args = parser.parse_args()
    stopped = []
    ok = run_with_hard_limit(lambda: main(args.wait, args.only, stopped),
                             limit=args.wait + HARD_LIMIT_GRACE,
                             out=lambda line: print(line, flush=True))
    sys.exit(0 if ok else EXIT_STOPPED if stopped else EXIT_NO_ANSWER)

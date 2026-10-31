"""
Testing strategy for server/tests/

REDIS — fakeredis.aioredis.FakeRedis, one fresh instance per test:
    app/core/cache.py holds a module-level `redis_client` that `get_cache` and
    `set_cache` use directly. We monkeypatch that attribute before each test
    with a FakeRedis instance (decode_responses=True so it behaves like the
    production client). Each test gets an empty cache, making cache-miss and
    cache-hit scenarios trivially controllable without needing a real Redis.

RATE LIMITER — disabled for the whole suite (autouse disable_rate_limits):
    The slowapi limiter's storage is real Redis (moving windows, one counter per
    route and client), and every test shares client IP 127.0.0.1 (the httpx
    ASGITransport default). Counts would therefore accumulate ACROSS suite runs:
    two back-to-back `pytest` runs inside one minute would 429 on the tighter
    auth limits (register 5/min, login 10/min) and fail spuriously. So slowapi's
    public `enabled` flag is off per test. setup_rate_limiter(app) is still
    required in each file's client fixture — the @limiter.limit decorators read
    request.app.state.limiter either way — and with the limiter disabled the
    suite needs no real Redis at all. A test that asserts a 429 opts back in with
    the rate_limits_on fixture, which counts in process memory instead.

DATABASE + HTTP CLIENT — per test file, not here:
    Each test file builds its own SQLite in-memory engine (restricted to the
    tables its router needs; see test_collectibles_route.py for the JSONB
    workaround) and a bare per-test FastAPI app mounting only the router under
    test. app.main.app is deliberately not used: it carries bot-filter
    middleware, a Redis lifespan ping, Cloudinary config, ETag, gzip, and
    every router. All irrelevant here and some (the bot filter in particular)
    could silently reject test requests.

LOG GUARD: every test (autouse log_guard, at the end of this file):
    Railway keeps each log line for 90 days and can't delete or redact one early.
    The app's own loggers run at INFO, as in production, and a test errors at
    teardown if a record production would write holds an email address, or a raw
    control character before any traceback it carries. A test that sends hostile
    input proves its own escaping; this catches the line nobody thought to test.
"""

# Import-time env contract — must precede every `app.*` import below.
#
# Three modules read env at module scope and fail hard when it is missing:
#   app/db/database.py       builds the engine; DATABASE_URL defaults to '' and
#                            create_async_engine('') raises ArgumentError
#   app/core/auth.py         raises RuntimeError without JWT_SECRET_KEY
#   app/services/comments.py constructs AsyncOpenAI, which raises without a key
#
# The suite never reaches any of them (per-file SQLite engines with get_db
# overridden, fakeredis, monkeypatched moderation) — only the imports have to
# succeed. CI has no server/.env, so these values are what let `uv run pytest`
# run from a bare clone.
#
# DATABASE_URL is forced rather than defaulted: in the dev container it is
# injected as container environment pointing at the real dev Postgres, and a
# future test that forgot its get_db override would otherwise reach it. The
# dummy URL keeps the asyncpg dialect the engine's connect_args are written
# for; it is parsed but never connected to.
#
# ENVIRONMENT is forced too, because an unset one now means production. That would
# stop app/config/settings.py at import for the production secrets CI lacks, and it
# would give every response Secure, Domain=.stellarbladeguide.com cookies, which the
# test client at http://test never sends back (the auth and OAuth tests rely on its
# cookie jar). A test that wants production monkeypatches settings.ENVIRONMENT.
import os

os.environ["DATABASE_URL"] = "postgresql+asyncpg://test:test@localhost:5432/test"
os.environ["ENVIRONMENT"] = "development"
os.environ.setdefault("JWT_SECRET_KEY", "test-secret-key-not-used-in-production")
os.environ.setdefault("OPENAI_API_KEY", "test-openai-key")

import logging
import re

import pytest
import pytest_asyncio
import fakeredis.aioredis
from limits.storage import MemoryStorage

import app.core.cache
from app.core.colours import CYAN, GRAY, GREEN, MAGENTA, RED, RESET, YELLOW
from app.core.security import limiter


@pytest.fixture(autouse=True)
def disable_rate_limits():
    limiter.enabled = False
    yield
    limiter.enabled = True


@pytest.fixture
def rate_limits_on(monkeypatch):
    """Limits on for one test, counted in process memory, so it sees real 429s.

    The limiter's own storage is the dev Redis. Every piece the request path can
    reach (the strategy, its storage, the outage fallback and its dead flag) is
    swapped before the first hit, so nothing connects, and monkeypatch restores
    them all afterwards. Never call limiter.reset(): it clears whatever storage the
    limiter holds. Decorate probe routes once, at module scope: decorating a
    function twice stacks its limits.
    """
    storage = MemoryStorage()
    strategy = type(limiter._limiter)
    monkeypatch.setattr(limiter, "_storage", storage)
    monkeypatch.setattr(limiter, "_limiter", strategy(storage))
    monkeypatch.setattr(limiter, "_fallback_limiter", strategy(MemoryStorage()))
    monkeypatch.setattr(limiter, "_storage_dead", False)
    monkeypatch.setattr(limiter, "enabled", True)
    return limiter


@pytest_asyncio.fixture
async def fake_redis():
    redis = fakeredis.aioredis.FakeRedis(decode_responses=True)
    yield redis
    await redis.aclose()


@pytest_asyncio.fixture(autouse=True)
async def patch_redis(fake_redis, monkeypatch):
    monkeypatch.setattr(app.core.cache, "redis_client", fake_redis)


# ── LOG GUARD: no email address, no raw control character ─────────────────────
#
# Railway keeps every line the server writes for 90 days and can't delete or redact
# one early. So a line must never carry an email address, and nothing copied from a
# request may break a line or forge one. Every test runs with the app's own loggers
# (`api`, `app.*`) at INFO, production's level: the suite's root logger stays at
# WARNING, so without this an INFO line such as the sign-up line would never be
# written and nothing could check it. Each record production would write is judged
# as it is written, and the test errors at teardown when one holds:
#   - anything shaped like an email address, plain, percent-encoded (%40) or with a
#     look-alike at sign, in its message or its traceback;
#   - a raw non-printable character (a newline, CR, ESC, NEL, U+2028) other than the
#     colours module's own codes. A traceback is several lines by nature, so it may
#     hold newlines but nothing else unprintable: the one exc_info renders, and the
#     frames error_handler's and seo_head's records carry after their first line, as
#     does uvicorn's once setup_logging's filter has run (the loggers whose message
#     holds a traceback on purpose). Anywhere else a newline fails.
# The test SQLite driver's DEBUG statement log (aiosqlite, on when a fixture forces
# DEBUG) carries bound parameters, emails included. Production runs asyncpg at INFO,
# so those records are skipped, as are records below the level production writes.
# The pattern is independent of core/logging.py's, so it can check that one.

# Any run of characters but whitespace and a few delimiters, so a local part in any
# script, with symbols or with an invisible character, counts; no / or ?, which in a
# log line split a path or a query from what follows.
EMAIL_SHAPE = re.compile(r"[^\s@\"(),:;<>\[\]\\/?]+(?:@|%40|\uff20|\ufe6b)[\w-]+")
APP_COLOURS = (GREEN, RED, YELLOW, CYAN, MAGENTA, GRAY, RESET)
TRACEBACK = "\nTraceback (most recent call last):\n"
FRAMES_IN_MESSAGE = ("app.middleware.error_handler", "app.seo_head", "uvicorn.error")
PRODUCTION_FORMAT = logging.Formatter("%(levelname)s: %(name)s: %(message)s")
# Loggers production holds above INFO: setup_logging raises httpx, openai and
# uvicorn.access to WARNING, and SQLAlchemy sets its own WARNING at import.
PRODUCTION_FLOORS = {
    "httpx": logging.WARNING,
    "openai": logging.WARNING,
    "uvicorn.access": logging.WARNING,
    "sqlalchemy": logging.WARNING,
}
NOT_IN_PRODUCTION = ("aiosqlite",)


def _under(name: str, prefix: str) -> bool:
    return name == prefix or name.startswith(prefix + ".")


def written_in_production(record: logging.LogRecord) -> bool:
    if any(_under(record.name, prefix) for prefix in NOT_IN_PRODUCTION):
        return False
    floor = next(
        (level for prefix, level in PRODUCTION_FLOORS.items() if _under(record.name, prefix)),
        logging.INFO,
    )
    return record.levelno >= floor


def _unprintable(text: str, allowed: str = "") -> list[str]:
    for code in APP_COLOURS:
        text = text.replace(code, "")
    return sorted({ch for ch in text if not ch.isprintable() and ch not in allowed})


def log_problems(record: logging.LogRecord) -> list[str]:
    """What is wrong with one record as production would write it, if anything."""
    written = PRODUCTION_FORMAT.format(record)  # the message plus any traceback
    problems = [f"an email address ({found!r})" for found in EMAIL_SHAPE.findall(written)]
    message = record.getMessage()
    line, frames = message, ""
    if record.name in FRAMES_IN_MESSAGE and TRACEBACK in message:
        line, frames = message.split(TRACEBACK, 1)
    raw = _unprintable(line) + _unprintable(frames + (record.exc_text or ""), allowed="\n")
    if raw:
        problems.append("a raw " + ", ".join(repr(ch) for ch in sorted(set(raw))))
    return problems


class _EveryRecord(logging.Handler):
    """Each record production would write, judged once as it is written, whichever
    logger handed it over: the `api` logger doesn't propagate in production, and
    fixtures switch that on and off. The record is kept with its verdict, so its id
    can't be reused by a later one."""

    def __init__(self):
        super().__init__()
        self.verdicts = {}

    def emit(self, record):
        if id(record) in self.verdicts or not written_in_production(record):
            return
        try:
            problems = log_problems(record)
        except Exception as exc:  # a record that can't be written is a problem of its own
            problems = [f"a record that can't be formatted ({type(exc).__name__})"]
        self.verdicts[id(record)] = (record, problems)


@pytest.fixture(autouse=True)
def log_guard():
    handler = _EveryRecord()
    watched = (logging.getLogger(), logging.getLogger("api"))
    levels = {name: logging.getLogger(name).level for name in ("api", "app")}
    for name in levels:
        logging.getLogger(name).setLevel(logging.INFO)
    for logger in watched:
        logger.addHandler(handler)
    yield
    for logger in watched:
        logger.removeHandler(handler)
    for name, level in levels.items():
        logging.getLogger(name).setLevel(level)
    found = [
        f"{record.name} ({record.pathname}:{record.lineno}) wrote {problem}"
        for record, problems in handler.verdicts.values()
        for problem in problems
    ]
    if found:
        pytest.fail("A log line production would write holds:\n" + "\n".join(found), pytrace=False)

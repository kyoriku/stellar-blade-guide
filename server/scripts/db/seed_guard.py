"""Bounds for the scripts that write to, or read from, prod's database through a tunnel.

A dead tunnel can't be timed out from inside asyncio. asyncpg's query timeout fires, but
SQLAlchemy then waits on a shielded close, which waits with no limit on a cancel request
sent through the same dead tunnel. So these scripts use their own engine, which tells the
server to end a transaction whose client has gone, and a watchdog thread that ends the
process when the database hasn't answered for a while. The live app's engine
(app/db/database.py) is untouched.
"""

import os
import threading
import time

from sqlalchemy import event
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine
from sqlalchemy.pool import NullPool

from app.config.settings import settings

# Seconds without an answer from the database before the watchdog ends the process. Every
# statement is bounded at 10 s and every lock wait at 5 s, so a live link never gets here.
NO_ANSWER_SECONDS = 30

# asyncpg's limit for a connection to open, and for each statement's answer.
ANSWER_SECONDS = 10

# A seeder's last line when the watchdog ends it, by how far the run had got.
NO_ANSWER = {
    "writing": (f"✗ No answer from the database for {NO_ANSWER_SECONDS} s; the tunnel may have "
                "dropped. This seeder committed nothing."),
    "committing": ("✗ No answer from the database while committing: prod may or may not have "
                   "these changes. They're recorded, so the next run purges them either way."),
    "committed": ("✗ No answer from the database after the commit: prod has these changes and "
                  "they're recorded, but Redis wasn't cleared. Run it again, or prod_seed.py "
                  "--purge-only."),
}

# Startup settings for every session these scripts open, in milliseconds.
SESSION_SETTINGS = {
    "statement_timeout": "10000",                      # as the app's engine
    "lock_timeout": "5000",                            # wait at most 5 s behind another lock
    "idle_in_transaction_session_timeout": "30000",    # end a transaction whose client vanished
    "transaction_timeout": "120000",                   # and any transaction open past 2 min (PG 17)
}


def seed_engine(name):
    """An engine for one script: a fresh connection per session (no pool, so no pre-ping),
    a 10 s connect timeout where asyncpg's default is 60 s, and the session settings above.
    `name` becomes the session's application_name, so it can be found in pg_stat_activity."""
    return create_async_engine(
        settings.DATABASE_URL,
        poolclass=NullPool,
        hide_parameters=not settings.DEBUG,
        connect_args={
            "timeout": ANSWER_SECONDS,
            "command_timeout": ANSWER_SECONDS,
            "server_settings": {**SESSION_SETTINGS, "application_name": name},
        },
    )


def seed_sessionmaker(engine):
    return async_sessionmaker(bind=engine, class_=AsyncSession, expire_on_commit=False)


class Watchdog:
    """Ends the process when the database hasn't answered for `limit` seconds.

    Start it before the first statement; watch_engine() makes every new connection and every
    finished statement reset it; stop it once the database work is done. On expiry it writes
    the line `message()` returns straight to stdout and exits with `exit_code` at once,
    skipping every cleanup that could wait on a dead tunnel."""

    def __init__(self, limit, exit_code, message):
        self.limit = limit
        self.exit_code = exit_code
        self.message = message
        self._deadline = None
        self._lock = threading.Lock()
        self._thread = None

    def start(self):
        with self._lock:
            self._deadline = time.monotonic() + self.limit
        if self._thread is None:
            self._thread = threading.Thread(target=self._watch, name="watchdog", daemon=True)
            self._thread.start()

    def reset(self):
        with self._lock:
            if self._deadline is not None:
                self._deadline = time.monotonic() + self.limit

    def stop(self):
        with self._lock:
            self._deadline = None

    def _watch(self):
        while True:
            with self._lock:
                expired = self._deadline is not None and time.monotonic() >= self._deadline
            if expired:
                self._expire()
            time.sleep(0.2)

    def _expire(self):
        try:
            os.write(1, (self.message() + "\n").encode())
        finally:
            os._exit(self.exit_code)


def watch_engine(engine, watchdog):
    """Reset the watchdog on every new connection and after every statement."""
    sync_engine = engine.sync_engine
    event.listen(sync_engine, "connect", lambda *args: watchdog.reset())
    event.listen(sync_engine, "after_cursor_execute", lambda *args: watchdog.reset())


def lock_timed_out(exc):
    """True when the database refused because a lock wait hit lock_timeout (55P03)."""
    seen, stack = set(), [exc]
    while stack:
        e = stack.pop()
        if e is None or id(e) in seen:
            continue
        seen.add(id(e))
        if getattr(e, "sqlstate", None) == "55P03":
            return True
        stack += [getattr(e, "orig", None), e.__cause__]
    return False


def unreachable(exc):
    """True when the database couldn't be reached or the connection was lost (refused, no
    answer in time, dropped), as opposed to the database refusing a statement."""
    return isinstance(exc, OSError) or bool(getattr(exc, "connection_invalidated", False))


def first_line(exc):
    """The first line of an error's text, for a one-line failure message. A timeout carries
    no text, so it says what timed out."""
    text = str(exc).strip()
    if not text and isinstance(exc, TimeoutError):
        return f"no answer within {ANSWER_SECONDS} s"
    return text.splitlines()[0][:300] if text else type(exc).__name__


def failure_line(phase, exc):
    """A seeder's last line when a database step raises, by how far the run had got:
    "writing" (nothing committed), "committing" or "committed"."""
    reason = first_line(exc)
    if phase == "writing":
        if unreachable(exc):
            return (f"✗ Couldn't reach the database ({reason}); the tunnel may have dropped. "
                    f"Nothing was written.")
        hint = (" Another session holds a lock the seed needs: an earlier seed's session may "
                "still be open, and prod ends it within 2 minutes." if lock_timed_out(exc) else "")
        return f"✗ The database refused the seed: {reason}.{hint} Nothing was written."
    if phase == "committing":
        return (f"✗ The commit failed: {reason}. Prod may or may not have these changes. They're "
                f"recorded, so the next run purges them either way.")
    return (f"✗ After the commit: {reason}. Prod has these changes and they're recorded, but "
            f"Redis wasn't cleared. Run it again, or prod_seed.py --purge-only.")

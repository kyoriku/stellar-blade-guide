"""
The seeders' transaction and failure contract (scripts/db/seed_collectibles.py and
scripts/db/seed_walkthroughs.py) and the guard they share (scripts/db/seed_guard.py).

A seeder writes in one transaction and records its changes in the purge ledger before its
COMMIT, so a run that stops partway leaves prod either as it was or owing a purge the next
run makes. The order of those steps is read from the source. The transaction itself needs a
real PostgreSQL, which the suite doesn't have, so it was checked against a throwaway database.
"""
import ast
import subprocess
import sys
import time
from pathlib import Path
from types import SimpleNamespace

import pytest
from sqlalchemy import text
from sqlalchemy.ext.asyncio import create_async_engine

from scripts.cache import clear_content_cache
from scripts.db import seed_collectibles, seed_guard, seed_walkthroughs

SERVER = Path(seed_guard.__file__).resolve().parents[2]
SEEDERS = {
    "seed_collectibles": (SERVER / "scripts" / "db" / "seed_collectibles.py", "seed_database"),
    "seed_walkthroughs": (SERVER / "scripts" / "db" / "seed_walkthroughs.py", "seed_walkthroughs"),
}


def _parse(name):
    path, function = SEEDERS[name]
    tree = ast.parse(path.read_text(encoding="utf-8"))
    seed = next(node for node in ast.walk(tree)
                if isinstance(node, ast.AsyncFunctionDef) and node.name == function)
    return tree, seed


def _calls(node, name):
    """The line of every call to `name`, plain or as an attribute, under `node`."""
    return sorted(call.lineno for call in ast.walk(node) if isinstance(call, ast.Call)
                  and name in (getattr(call.func, "id", None), getattr(call.func, "attr", None)))


@pytest.mark.parametrize("name", SEEDERS)
def test_the_watchdog_is_running_before_the_first_statement(name):
    """The first statement checks out a connection, so a dead tunnel can hang there too."""
    _, seed = _parse(name)
    assert _calls(seed, "watch_engine")[0] < _calls(seed, "start")[0] < _calls(seed, "execute")[0]


@pytest.mark.parametrize("name", SEEDERS)
def test_changes_are_recorded_before_the_commit_and_redis_is_cleared_after(name):
    """A COMMIT that lands and then loses its answer must still be purged by the next run,
    and Redis must answer before anything is committed it couldn't then clear."""
    _, seed = _parse(name)
    ping, record = _calls(seed, "ping")[0], _calls(seed, "record")[0]
    commit, clear = _calls(seed, "commit")[0], _calls(seed, "invalidate_cache_pattern")[0]
    assert ping < record < commit < clear


@pytest.mark.parametrize("name", SEEDERS)
def test_nothing_is_committed_or_rolled_back_inside_the_item_loop(name):
    """A per-item commit is what left prod part-written; a per-item rollback expired every
    loaded row and failed everything after it."""
    _, seed = _parse(name)
    loop = next(node for node in ast.walk(seed)
                if isinstance(node, ast.For) and ast.unparse(node.target) == "item")
    assert not _calls(loop, "commit") and not _calls(loop, "rollback")


@pytest.mark.parametrize("name", SEEDERS)
def test_counted_problems_roll_back_and_fail_before_anything_is_recorded(name):
    _, seed = _parse(name)
    guard = next(node for node in ast.walk(seed)
                 if isinstance(node, ast.If) and ast.unparse(node.test) == "errors")
    assert _calls(guard, "rollback")
    assert any(isinstance(node, ast.Return) and ast.unparse(node.value) == "1"
               for node in ast.walk(guard))
    assert guard.lineno < _calls(seed, "record")[0]


@pytest.mark.parametrize("name", SEEDERS)
def test_the_sequence_is_reset_only_after_the_commit(name):
    """setval isn't transactional: inside the transaction a rollback would leave it moved."""
    _, seed = _parse(name)
    reset = f"reset_{name.split('_', 1)[1]}_sequence"
    assert _calls(seed, "commit")[0] < _calls(seed, reset)[0]


@pytest.mark.parametrize("name", SEEDERS)
def test_a_failed_database_step_prints_the_shared_failure_line(name):
    _, seed = _parse(name)
    handler = next(node for node in ast.walk(seed) if isinstance(node, ast.ExceptHandler)
                   and ast.unparse(node.type) == "Exception")
    assert _calls(handler, "failure_line")


@pytest.mark.parametrize("name", SEEDERS)
def test_the_script_exits_with_the_seeders_status(name):
    tree, _ = _parse(name)
    main = next(node for node in tree.body
                if isinstance(node, ast.If) and "__main__" in ast.unparse(node.test))
    assert "sys.exit(asyncio.run(" in ast.unparse(main)


@pytest.mark.parametrize("name", SEEDERS)
@pytest.mark.parametrize("status", [0, 1])
def test_check_mode_exits_with_the_checks_status_before_any_seed(name, status):
    """prod_seed.py runs both --check against prod before any seeder writes. A check that fell
    through to the seed would write the very entries it had just refused."""
    path, seed_name = SEEDERS[name]
    tree = ast.parse(path.read_text(encoding="utf-8"))
    entry = next(node for node in tree.body
                 if isinstance(node, ast.If) and "__main__" in ast.unparse(node.test))
    seeded = []

    def run_entry(argv):
        ns = {"__name__": "__main__", "sys": SimpleNamespace(argv=[path.name, *argv], exit=sys.exit),
              "check_main": lambda: status, seed_name: lambda: "the seed",
              "asyncio": SimpleNamespace(run=lambda coro: seeded.append(coro) or 0)}
        with pytest.raises(SystemExit) as ended:
            exec(compile(ast.Module(body=[entry], type_ignores=[]), str(path), "exec"), ns)  # noqa: S102 -- the seeder's own entry point
        return ended.value.code

    assert run_entry(["--check"]) == status and seeded == []
    assert run_entry([]) == 0 and seeded == ["the seed"]


def test_the_manual_clear_covers_both_seeders_patterns():
    seeded = set(seed_collectibles.CACHE_PATTERNS) | set(seed_walkthroughs.CACHE_PATTERNS)
    assert seeded <= set(clear_content_cache.CONTENT_PATTERNS)


def test_the_seeders_engine_bounds_every_session(monkeypatch):
    captured = {}
    monkeypatch.setattr(seed_guard, "create_async_engine",
                        lambda url, **kwargs: captured.update(kwargs) or object())
    seed_guard.seed_engine("seed_collectibles")
    assert captured["poolclass"].__name__ == "NullPool"
    args = captured["connect_args"]
    assert args["timeout"] == 10 and args["command_timeout"] == 10
    assert args["server_settings"] == {
        "statement_timeout": "10000",
        "lock_timeout": "5000",
        "idle_in_transaction_session_timeout": "30000",
        "transaction_timeout": "120000",
        "application_name": "seed_collectibles",
    }


def _run(script):
    return subprocess.run([sys.executable, "-c", script], capture_output=True, text=True,
                          timeout=30, cwd=SERVER, check=False)


def test_the_watchdog_ends_a_stuck_process_with_its_line_and_code():
    started = time.monotonic()
    done = _run(
        "import time\n"
        "from scripts.db.seed_guard import Watchdog\n"
        "Watchdog(0.5, 7, lambda: 'no answer from the database').start()\n"
        "time.sleep(20)\n"
        "print('not reached')\n")
    assert done.returncode == 7
    assert "no answer from the database" in done.stdout
    assert "not reached" not in done.stdout
    assert time.monotonic() - started < 15


def test_resetting_the_watchdog_keeps_a_working_process_alive():
    done = _run(
        "import time\n"
        "from scripts.db.seed_guard import Watchdog\n"
        "w = Watchdog(0.5, 7, lambda: 'no answer')\n"
        "w.start()\n"
        "for _ in range(15):\n"
        "    time.sleep(0.1)\n"
        "    w.reset()\n"
        "w.stop()\n"
        "time.sleep(1)\n"
        "print('finished')\n")
    assert done.returncode == 0
    assert "finished" in done.stdout and "no answer" not in done.stdout


class _CountingWatchdog:
    def __init__(self):
        self.resets = 0

    def reset(self):
        self.resets += 1


async def test_every_connection_and_statement_resets_the_watchdog():
    watchdog = _CountingWatchdog()
    engine = create_async_engine("sqlite+aiosqlite://")
    seed_guard.watch_engine(engine, watchdog)
    async with engine.connect() as conn:
        await conn.execute(text("SELECT 1"))
        after_connect_and_one = watchdog.resets
        await conn.execute(text("SELECT 2"))
    await engine.dispose()
    assert after_connect_and_one >= 2
    assert watchdog.resets == after_connect_and_one + 1


class _LockNotAvailable(Exception):
    sqlstate = "55P03"


def _lock_timeout():
    wrapped = RuntimeError("canceling statement due to lock timeout")
    wrapped.orig = _LockNotAvailable()
    return wrapped


def test_a_lock_timeout_is_told_apart_from_other_refusals():
    assert seed_guard.lock_timed_out(_lock_timeout())
    assert not seed_guard.lock_timed_out(RuntimeError("duplicate key value"))


def test_a_dead_link_reads_as_unreachable_not_as_a_refusal():
    """A tunnel that's closed, or that accepts and never answers, isn't the database refusing
    the seed. A timeout carries no text, so the line says what timed out."""
    assert seed_guard.failure_line("writing", TimeoutError()) == (
        "✗ Couldn't reach the database (no answer within 10 s); the tunnel may have dropped. "
        "Nothing was written.")
    refused = ConnectionRefusedError(111, "Connect call failed ('127.0.0.1', 15432)")
    assert seed_guard.failure_line("writing", refused).startswith(
        "✗ Couldn't reach the database ([Errno 111] Connect call failed")


def test_a_connection_lost_mid_statement_reads_as_unreachable():
    lost = RuntimeError("connection was closed in the middle of operation")
    lost.connection_invalidated = True      # set by SQLAlchemy on a disconnect
    assert seed_guard.failure_line("writing", lost).startswith("✗ Couldn't reach the database")


def test_a_refusal_names_the_database_and_a_lock_timeout_adds_its_hint():
    assert seed_guard.failure_line("writing", RuntimeError("duplicate key value")) == (
        "✗ The database refused the seed: duplicate key value. Nothing was written.")
    line = seed_guard.failure_line("writing", _lock_timeout())
    assert line.startswith("✗ The database refused the seed: canceling statement due to lock timeout.")
    assert "an earlier seed's session may still be open" in line


def test_after_the_writes_the_line_says_what_prod_may_have():
    assert seed_guard.failure_line("committing", TimeoutError()).startswith(
        "✗ The commit failed: no answer within 10 s. Prod may or may not have these changes.")
    assert "Redis wasn't cleared" in seed_guard.failure_line("committed", RuntimeError("gone"))

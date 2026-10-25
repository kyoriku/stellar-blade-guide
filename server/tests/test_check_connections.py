"""scripts/db/check_connections.py: what it retries, what stops it, what it prints.

Fake probes and real (short) timings, no network. The URLs carry a distinctive
password, since conftest's DATABASE_URL uses 'test' for the user and the database too.
"""

import asyncio
import errno
import os
import socket
import ssl
import subprocess
import sys
import time
from pathlib import Path

import asyncpg
import pytest
import redis
import requests
from sqlalchemy.exc import DBAPIError

from scripts.db import check_connections as cc

PASSWORD = "p@ss-ZQ9"
ENCODED = "p%40ss-ZQ9"
PG_URL = f"postgresql://postgres:{ENCODED}@host.docker.internal:15432/railway"
REDIS_URL = f"redis://default:{ENCODED}@host.docker.internal:16379"
FAST = {"attempt_timeout": 0.05, "interval": 0.01}


def _probe(*outcomes):
    """A probe that raises each exception in turn, then answers. Counts its calls."""
    calls = {"n": 0}

    async def probe():
        calls["n"] += 1
        if calls["n"] <= len(outcomes):
            raise outcomes[calls["n"] - 1]

    return probe, calls


async def _run(probe, url=PG_URL, wait=1.0, name="Postgres", **kw):
    lines = []
    ok = await cc.run_checks([(name, url, probe, "answered SELECT 1")],
                             wait=wait, out=lines.append, **{**FAST, **kw})
    return ok, lines


async def test_connection_errors_are_retried_until_it_answers():
    probe, calls = _probe(ConnectionRefusedError("refused"), TimeoutError(),
                          redis.exceptions.ConnectionError("reset"),
                          asyncpg.exceptions.CannotConnectNowError("starting up"))
    ok, lines = await _run(probe)
    assert ok and calls["n"] == 5
    assert sum("not answering yet" in line for line in lines) == 1
    assert "answered SELECT 1 (try 5)" in lines[-1]


async def test_a_connection_lost_mid_startup_is_retried():
    probe, calls = _probe(asyncpg.exceptions.ConnectionDoesNotExistError(
        "connection was closed in the middle of operation"))
    ok, _ = await _run(probe)
    assert ok and calls["n"] == 2


@pytest.mark.parametrize("error", [
    redis.exceptions.AuthenticationError("invalid username-password pair"),
    asyncpg.exceptions.InvalidPasswordError('password authentication failed for user "postgres"'),
    asyncpg.exceptions.InvalidCatalogNameError('database "railway" does not exist'),
    DBAPIError("SELECT 1", None, asyncpg.exceptions.InvalidPasswordError("rejected")),
    TypeError("connect() got an unexpected keyword argument 'sslmode'"),
    ConnectionError('PostgreSQL server at "host:15432" rejected SSL upgrade'),
    ssl.SSLCertVerificationError("certificate verify failed"),
    RuntimeError("PING did not answer"),
], ids=lambda e: type(e).__name__)
async def test_failures_that_waiting_cant_fix_stop_at_once(error):
    probe, calls = _probe(error, error, error)
    ok, lines = await _run(probe)
    assert not ok and calls["n"] == 1
    assert "stopped" in lines[0]


async def test_the_sqlstate_shows_when_there_is_one():
    probe, _ = _probe(asyncpg.exceptions.InvalidPasswordError("password authentication failed"))
    _, lines = await _run(probe)
    assert "InvalidPasswordError 28P01: password authentication failed" in lines[0]


async def test_it_gives_up_at_the_deadline():
    probe, calls = _probe(*[ConnectionRefusedError("refused")] * 1000)
    started = time.monotonic()
    ok, lines = await _run(probe, wait=0.3)
    assert not ok and calls["n"] > 1
    assert "no answer in 0.3 s (last: ConnectionRefusedError: refused)" in lines[-1]
    assert time.monotonic() - started < 1.0


async def test_a_probe_that_never_answers_is_capped_each_attempt():
    async def hangs():
        await asyncio.sleep(10)

    started = time.monotonic()
    ok, lines = await _run(hangs, wait=0.3)
    assert not ok
    assert "no answer in 0.3 s (last: TimeoutError)" in lines[-1]
    assert time.monotonic() - started < 1.0


async def test_both_services_share_one_deadline():
    async def slow():
        await asyncio.sleep(0.2)

    lines = []
    started = time.monotonic()
    ok = await cc.run_checks([("Postgres", PG_URL, slow, "answered SELECT 1"),
                              ("Redis", REDIS_URL, slow, "answered PING after AUTH")],
                             wait=1.0, out=lines.append, attempt_timeout=1.0, interval=0.01)
    assert ok and time.monotonic() - started < 0.35
    assert len(lines) == 2


async def test_a_host_other_than_the_tunnel_gets_a_warning_not_a_stop():
    probe, _ = _probe()
    ok, lines = await _run(probe, url=f"postgresql://postgres:{ENCODED}@roundhouse.proxy.rlwy.net:40404/railway")
    assert ok
    assert any("[WARN]" in line and "isn't the tunnel host" in line for line in lines)

    probe, _ = _probe()
    ok, lines = await _run(probe)
    assert ok and not any("[WARN]" in line for line in lines)

    probe, _ = _probe()            # hostnames are case-insensitive
    ok, lines = await _run(probe, url=PG_URL.replace("host.docker.internal", "Host.Docker.Internal"))
    assert ok and not any("[WARN]" in line for line in lines)


async def test_the_password_never_reaches_the_output():
    query_url = "postgresql://postgres@host.docker.internal:15432/railway?password=Qq-77-secret"
    errors = [ConnectionRefusedError(f"connect to postgres:{PASSWORD}@host failed"),
              ConnectionRefusedError(f"dsn postgres:{ENCODED}@host"),
              asyncpg.exceptions.InvalidPasswordError(f"bad password {PASSWORD}")]
    probe, _ = _probe(*errors)
    _, lines = await _run(probe)
    probe, _ = _probe(ConnectionRefusedError("Qq-77-secret"),
                      asyncpg.exceptions.InvalidPasswordError("Qq-77-secret"))
    _, more = await _run(probe, url=query_url)
    text = "\n".join(lines + more)
    assert PASSWORD not in text and ENCODED not in text and "Qq-77-secret" not in text
    assert "*****" in text


def test_secrets_survive_an_unparseable_url():
    secrets = cc.secrets_in("redis://default:sekret-91@[::1:6379")
    assert cc.redact("auth default:sekret-91 failed", secrets) == "auth ***** failed"


def test_where_shows_no_credentials():
    assert cc.where("Postgres", PG_URL + "?ssl=require") == "host.docker.internal:15432/railway"
    assert cc.where("Redis", REDIS_URL) == "host.docker.internal:16379"


def test_where_shows_what_the_driver_reads_not_what_is_written():
    # SQLAlchemy keeps the host's case and reads a '#' into the database name; redis-py
    # reads the path as a db number.
    assert (cc.where("Postgres", "postgresql://postgres:x@Host.Docker.Internal:15432/rail#way")
            == "Host.Docker.Internal:15432/rail#way")
    assert cc.where("Redis", "redis://default:x@host.docker.internal:16379/03") == "host.docker.internal:16379/3"


# Shapes a hand-edited URL can take. SQLAlchemy ends a password at the FIRST '@'; redis-py
# ends the host part at the first '/', '?' or '#', then takes the credentials to the last '@'.
AWKWARD = [
    "postgresql://postgres:Ab3/sekret-91@host.docker.internal:15432/railway",
    "postgresql://postgres:Ab3?sekret-91@host.docker.internal:15432/railway",
    "postgresql://postgres:Ab3#sekret-91@host.docker.internal:15432/railway",
    "postgresql://postgres:Ab3@sekret-91@host.docker.internal:15432/railway",
    "postgresql://postgres:12/sekret-91@host.docker.internal:15432/railway",
    "redis://default:Ab3/sekret-91@host.docker.internal:16379",
    "redis://sekret-91@host.docker.internal:16379",
    "postgresql://postgres:sekret-91host.docker.internal:15432/railway",
    "postgresql:/postgres:sekret-91@host.docker.internal:15432/railway",
    "redis://default:x[sekret-91@host.docker.internal:16379",
    "redis://default:sekret-91＠host.docker.internal:16379",
    "postgresql://postgres@host.docker.internal:15432/railway?password=sekret-91",
]


@pytest.mark.parametrize("name", ["Postgres", "Redis"])
@pytest.mark.parametrize("url", AWKWARD)
def test_where_never_shows_credentials(url, name):
    shown = cc.where(name, url)
    assert "sekret" not in shown and "Ab3" not in shown and "12/" not in shown


@pytest.mark.parametrize("url", [u for i, u in enumerate(AWKWARD) if i not in (7, 10)])
def test_every_findable_credential_is_redacted(url):
    assert "sekret-91" not in cc.redact(f"driver said: {url}", cc.secrets_in(url))


def test_a_raw_slash_in_a_postgres_password_reads_as_written():
    # SQLAlchemy's password runs to the first '@', '/' and all.
    assert cc.url_problem("Postgres", AWKWARD[0]) is None
    assert cc.reading("Postgres", AWKWARD[0]) == ("host.docker.internal", 15432, "railway")


TWO_AT_PG = "postgresql://postgres:sekret-91@Qz7@host.docker.internal:15432/railway"
TWO_AT_REDIS = "redis://default:sekret-91@Qz7@host.docker.internal:16379"
# A raw '/' ends redis-py's host part: the user name becomes the host, and the start of the
# password the port.
SLASH_REDIS = "redis://default:4071/sekret-91@host.docker.internal:16379"


def test_each_driver_reads_the_host_its_own_way():
    # SQLAlchemy ends the password at the first '@', so the host it would look up holds the
    # rest of the password. redis-py takes the last '@' but stops the host part at a '/'.
    assert cc.reading("Postgres", TWO_AT_PG) == ("Qz7@host.docker.internal", 15432, "railway")
    assert cc.reading("Redis", TWO_AT_REDIS) == ("host.docker.internal", 16379, None)
    assert cc.reading("Redis", SLASH_REDIS) == ("default", 4071, None)


@pytest.mark.parametrize("name,url", [("Postgres", TWO_AT_PG), ("Redis", TWO_AT_REDIS)])
async def test_more_than_one_at_stops_at_once_with_nothing_probed(name, url):
    probe, calls = _probe()
    started = time.monotonic()
    ok, lines = await _run(probe, url=url, name=name, wait=30.0)
    text = "\n".join(lines)
    assert not ok and calls["n"] == 0
    assert "stopped, the URL has more than one @. Write an @ in the password as %40." in text
    assert "sekret" not in text and "Qz7" not in text
    assert time.monotonic() - started < 1.0


async def test_a_host_the_driver_misreads_stops_at_once_with_nothing_probed():
    probe, calls = _probe()
    started = time.monotonic()
    ok, lines = await _run(probe, url=SLASH_REDIS, name="Redis", wait=30.0)
    text = "\n".join(lines)
    assert not ok and calls["n"] == 0
    assert ("stopped, redis-py reads a different host from the one written. "
            "Percent-encode the user name and password: @ as %40, / as %2F") in text
    assert "4071" not in text and "sekret" not in text and "default" not in text
    assert time.monotonic() - started < 1.0


async def test_a_url_the_driver_cant_parse_stops_before_any_probe():
    probe, calls = _probe()
    ok, lines = await _run(probe, url=AWKWARD[7], wait=30.0)     # a dropped '@'
    text = "\n".join(lines)
    assert not ok and calls["n"] == 0
    assert ("stopped, SQLAlchemy can't parse the URL. "
            "It expects postgresql://user:password@host:port/database.") in text
    assert "sekret" not in text


async def test_every_url_is_read_before_either_is_probed():
    pg_probe, pg_calls = _probe()
    redis_probe, redis_calls = _probe()
    lines = []
    ok = await cc.run_checks([("Postgres", PG_URL, pg_probe, "answered SELECT 1"),
                              ("Redis", TWO_AT_REDIS, redis_probe, "answered PING after AUTH")],
                             wait=1.0, out=lines.append, **FAST)
    assert not ok and pg_calls["n"] == 0 and redis_calls["n"] == 0
    assert len(lines) == 1 and "Redis" in lines[0]


async def test_a_url_that_fails_at_import_gets_fixed_text(monkeypatch):
    # The backstop behind url_problem: a parse failure at import time, whose message
    # quotes the URL, never gets out.
    def broken(name):
        raise ValueError(f"invalid literal for int() with base 10: '{PASSWORD}host:15432'")

    monkeypatch.setattr(cc.importlib, "import_module", broken)
    lines = []
    ok = await cc.run_checks([("Postgres", PG_URL, cc._probe_postgres, "answered SELECT 1")],
                             wait=1.0, out=lines.append, **FAST)
    text = "\n".join(lines)
    assert not ok
    assert "stopped, UrlError: DATABASE_URL doesn't parse" in text
    assert PASSWORD not in text and ENCODED not in text


def test_a_stuck_cleanup_still_ends_the_process_within_the_hard_limit():
    script = (
        "import asyncio\n"
        "from scripts.db import check_connections as cc\n"
        "async def stuck():\n"
        "    await asyncio.shield(asyncio.sleep(60))\n"
        "cc.run_with_hard_limit(stuck, limit=0.5, out=lambda line: print(line, flush=True))\n"
    )
    started = time.monotonic()
    done = subprocess.run([sys.executable, "-c", script], capture_output=True, text=True,
                          timeout=20, cwd=Path(cc.__file__).resolve().parents[2])
    assert done.returncode == 1
    assert "giving up" in done.stdout
    assert time.monotonic() - started < 10


# What the other prod-reading scripts share: mask(), tunnel_commands(), lost(), require().

@pytest.mark.parametrize("name,url,shown", [
    ("Postgres", PG_URL, "postgresql://*****@host.docker.internal:15432/railway"),
    ("Redis", REDIS_URL, "redis://*****@host.docker.internal:16379"),
    # The old regex printed these two whole: a password with no user name, and one in the query.
    ("Redis", "redis://sekret-91@host.docker.internal:16379", "redis://*****@host.docker.internal:16379"),
    ("Postgres", "postgresql://postgres@host.docker.internal:15432/railway?password=sekret-91",
     "postgresql://*****@host.docker.internal:15432/railway"),
    ("Postgres", "postgresql+asyncpg://dev.example/sbg", "postgresql+asyncpg://dev.example/sbg"),
    ("Postgres", "postgresql://u:sekret-91@[::1]:5432/db", "postgresql://*****@[::1]:5432/db"),
    # And kept the half after a second '@'.
    ("Postgres", "postgresql://postgres:sekret-91@Qz7@host.docker.internal:15432/railway",
     "(not shown: the URL has more than one @)"),
])
def test_mask_shows_where_never_who(name, url, shown):
    assert cc.mask(name, url) == shown


def test_tunnel_commands_name_only_the_tunnels_the_urls_go_through():
    assert cc.tunnel_commands([("Postgres", PG_URL), ("Redis", REDIS_URL)]) == [
        "railway connect Postgres --tunnel-only -P 15432 --environment production 2>/dev/null",
        "railway connect Redis --tunnel-only -P 16379 --environment production 2>/dev/null",
    ]
    # The port the URL names, else the tunnel's usual one.
    assert cc.tunnel_commands([("Postgres", PG_URL.replace(":15432", ":25432"))]) == [
        "railway connect Postgres --tunnel-only -P 25432 --environment production 2>/dev/null"]
    assert cc.tunnel_commands([("Redis", "redis://default:x@host.docker.internal")]) == [
        "railway connect Redis --tunnel-only -P 16379 --environment production 2>/dev/null"]
    # A URL that doesn't go through a tunnel isn't told to open one.
    assert cc.tunnel_commands([("Postgres", "postgresql://postgres:x@postgres:5432/db")]) == []


def _from(exc, cause):
    exc.__cause__ = cause
    return exc


@pytest.mark.parametrize("exc", [
    ConnectionRefusedError(111, "Connect call failed"),
    ConnectionResetError(104, "Connection reset by peer"),
    socket.gaierror(-2, "Name or service not known"),
    TimeoutError(),
    OSError(errno.EHOSTUNREACH, "No route to host"),
    OSError("Multiple exceptions: [Errno 111] Connect call failed ('::1', 15432, 0, 0), "
            "[Errno 111] Connect call failed ('127.0.0.1', 15432)"),
    asyncpg.exceptions.ConnectionDoesNotExistError("connection was closed in the middle of operation"),
    DBAPIError("SELECT 1", None, Exception("connection is closed"), connection_invalidated=True),
    _from(RuntimeError("wrapped"), ConnectionResetError(104, "Connection reset by peer")),
    redis.exceptions.ConnectionError("Error 111 connecting to host.docker.internal:16379."),
    redis.exceptions.TimeoutError("Timeout reading from socket"),
])
def test_a_refused_or_dropped_connection_counts_as_lost(exc):
    assert cc.lost(exc)


@pytest.mark.parametrize("exc", [
    BrokenPipeError(32, "Broken pipe"),        # this script's own output, piped into head
    FileNotFoundError(2, "No such file or directory", "search-baseline.json"),
    requests.exceptions.ConnectTimeout("timed out"),
    # A failed Cloudflare call, as purge_api_cache raises it: from a requests error, even one
    # that carries a timeout of its own.
    _from(RuntimeError("batch 1 timed out after 10s (ReadTimeout)"),
          _from(requests.exceptions.ReadTimeout("read timed out"), TimeoutError())),
    redis.exceptions.AuthenticationError("invalid username-password pair"),
    asyncpg.exceptions.QueryCanceledError("canceling statement due to statement timeout"),
    ValueError("not a connection problem"),
])
def test_anything_else_is_not_a_lost_tunnel(exc):
    assert not cc.lost(exc)


@pytest.fixture
def prod_env(monkeypatch):
    monkeypatch.setenv("DATABASE_URL", PG_URL)
    monkeypatch.setenv("REDIS_URL", REDIS_URL)


def _stub_check(monkeypatch, outcome):
    """require()'s child, scripted: an exit status, or an exception to raise."""
    calls = []

    def run_check(argv):
        calls.append(argv)
        if isinstance(outcome, BaseException):
            raise outcome
        return outcome

    monkeypatch.setattr(cc, "_run_check", run_check)
    return calls


def test_require_returns_quietly_when_prod_answers(prod_env, monkeypatch, capsys):
    calls = _stub_check(monkeypatch, 0)
    cc.require(["Postgres"])
    assert calls[0][1:] == [cc.__file__, "--wait", "10", "--only", "postgres"]
    assert capsys.readouterr().out == "Checking that prod Postgres answers (scripts/db/check_connections.py)\n"


def test_no_answer_stops_the_script_and_names_the_tunnel(prod_env, monkeypatch, capsys):
    _stub_check(monkeypatch, cc.EXIT_NO_ANSWER)
    with pytest.raises(SystemExit) as stopped:
        cc.require(["Postgres"])
    assert stopped.value.code == cc.EXIT_UNREACHABLE == 2
    out = capsys.readouterr().out
    assert "✗ Prod Postgres didn't answer (see above), so this stopped before doing anything." in out
    assert "  → If its tunnel isn't open, run this in a Mac tab, then run this again:" in out
    assert "      railway connect Postgres --tunnel-only -P 15432 --environment production 2>/dev/null" in out
    assert "Redis" not in out
    assert PASSWORD not in out and ENCODED not in out


def test_both_services_name_both_tunnels(prod_env, monkeypatch, capsys):
    calls = _stub_check(monkeypatch, cc.EXIT_NO_ANSWER)
    with pytest.raises(SystemExit):
        cc.require(["Postgres", "Redis"])
    assert "--only" not in calls[0]
    out = capsys.readouterr().out
    assert "Checking that prod Postgres and Redis answer (" in out
    assert "✗ Prod Postgres or Redis didn't answer" in out
    assert "→ If the tunnels aren't open, run these in two Mac tabs, then run this again:" in out
    assert out.count("railway connect") == 2


def test_a_check_that_stopped_at_once_names_no_tunnel(prod_env, monkeypatch, capsys):
    """A misread URL, a refused password or an unknown database: no tunnel will fix it."""
    _stub_check(monkeypatch, cc.EXIT_STOPPED)
    with pytest.raises(SystemExit) as stopped:
        cc.require(["Redis"])
    assert stopped.value.code == 2
    out = capsys.readouterr().out
    assert "✗ Prod Redis can't be used as set up (see the line above), so this stopped before doing anything." in out
    assert "railway connect" not in out


def test_a_url_off_the_tunnel_host_isnt_told_to_open_a_tunnel(monkeypatch, capsys):
    monkeypatch.setenv("DATABASE_URL", "postgresql://postgres:x@postgres:5432/db")
    _stub_check(monkeypatch, cc.EXIT_NO_ANSWER)
    with pytest.raises(SystemExit):
        cc.require(["Postgres"])
    out = capsys.readouterr().out
    assert "didn't answer" in out and "→" not in out and "railway connect" not in out


def test_ctrl_c_during_the_check_ends_quietly(prod_env, monkeypatch, capsys):
    _stub_check(monkeypatch, KeyboardInterrupt())
    with pytest.raises(SystemExit) as stopped:
        cc.require(["Postgres"])
    assert stopped.value.code == 130
    assert capsys.readouterr().out.endswith("Interrupted: nothing ran.\n")


def test_the_check_runs_in_its_own_process_group():
    """So a Ctrl+C reaches only the script, which ends the child itself."""
    leads = "import os, sys; sys.exit(0 if os.getpgrp() == os.getpid() else 5)"
    assert cc._run_check([sys.executable, "-c", leads]) == 0


def test_an_interrupted_check_is_killed_with_its_group(monkeypatch):
    killed = []

    class _Proc:
        pid = 4242
        waits = 0

        def wait(self):
            self.waits += 1
            if self.waits == 1:
                raise KeyboardInterrupt
            return -9

    proc = _Proc()
    monkeypatch.setattr(cc.subprocess, "Popen", lambda argv, process_group: proc)
    monkeypatch.setattr(cc.os, "killpg", lambda pid, sig: killed.append((pid, sig)))
    with pytest.raises(KeyboardInterrupt):
        cc._run_check(["check"])
    assert killed == [(4242, cc.signal.SIGKILL)] and proc.waits == 2


def test_the_cli_exits_1_for_no_answer_and_3_for_a_check_that_stopped():
    """require() names a tunnel only on 1. prod_seed.py treats any non-zero alike."""
    env = {**os.environ, "DATABASE_URL": "postgresql://postgres:x@127.0.0.1:1/db",
           "REDIS_URL": "redis://default:x@127.0.0.1:2"}
    cwd = Path(cc.__file__).resolve().parents[2]

    def run(*args):
        return subprocess.run([sys.executable, cc.__file__, "--wait", "0.3", *args], env=env, cwd=cwd,
                              capture_output=True, text=True, timeout=60, check=False)

    no_answer = run("--only", "postgres")
    assert no_answer.returncode == 1, no_answer.stdout
    assert "Redis" not in no_answer.stdout
    env["DATABASE_URL"] = "postgresql://postgres:x@y@127.0.0.1:1/db"
    stopped = run("--only", "postgres")
    assert stopped.returncode == 3, stopped.stdout
    assert "more than one @" in stopped.stdout


def test_lost_and_no_answer_messages_name_the_tunnel_and_hide_the_password(prod_env, capsys):
    cc.report_lost(["Postgres"], ConnectionResetError(104, f"reset while sending {PASSWORD}"))
    out = capsys.readouterr().out
    assert ("✗ Lost prod Postgres partway through (ConnectionResetError: [Errno 104] reset while "
            "sending *****).") in out
    assert "  → If its tunnel dropped, reopen it in a Mac tab, then run this again:" in out
    assert "railway connect Postgres --tunnel-only -P 15432" in out
    assert PASSWORD not in out
    # A timeout carries no text of its own.
    cc.report_lost(["Postgres"], TimeoutError())
    assert "partway through (no answer in time)." in capsys.readouterr().out
    text = cc.no_answer_message(["Redis"], 30)
    assert "✗ No answer from prod Redis for 30 s; its tunnel may have dropped." in text
    assert "railway connect Redis --tunnel-only -P 16379" in text

"""prod_seed.py's run, read from its source: the steps, every failure's lines and next
command, the retry, --purge-all, --purge-only and Ctrl+C.

Importing prod_seed.py would load server/.env, check the prod variables and open a seed log,
so the functions under test are pulled out with ast and run in a namespace holding only what
they use, with every child process scripted. run_logged's process-group kill is checked on a
real child and grandchild.
"""

import argparse
import ast
import os
import signal
import subprocess
import sys
import time
from pathlib import Path
from types import SimpleNamespace

import pytest

SCRIPTS = Path(__file__).resolve().parent.parent / "scripts"
PROD_SEED = SCRIPTS / "prod_seed.py"
FUNCTIONS = {"parse_args", "owed_lines", "failed", "run_seed", "interrupted"}
CONSTANTS = {"STEPS", "CLEAR_STEP", "PURGE_LABEL", "CHECK_LABEL", "PURGE_RETRIES",
             "PURGE_BACKOFF_SECONDS", "EXIT_TRANSIENT", "EXIT_INTERRUPTED", "REFILL_WAIT_SECONDS"}
TUNNELS = ["railway connect Postgres --tunnel-only -P 15432 --environment production 2>/dev/null",
           "railway connect Redis --tunnel-only -P 16379 --environment production 2>/dev/null"]


class _Log:
    def __init__(self):
        self.records = []

    def info(self, message):
        self.records.append(("INFO", message))

    def warning(self, message):
        self.records.append(("WARNING", message))

    def error(self, message):
        self.records.append(("ERROR", message))

    def text(self, level=None):
        return "\n".join(m for lvl, m in self.records if level in (None, lvl))


def _load(names, **globals_):
    tree = ast.parse(PROD_SEED.read_text(encoding="utf-8"))
    keep = [node for node in tree.body
            if (isinstance(node, ast.FunctionDef) and node.name in names)
            or (isinstance(node, ast.Assign)
                and any(isinstance(t, ast.Name) and t.id in CONSTANTS for t in node.targets))]
    found = {n.name for n in keep if isinstance(n, ast.FunctionDef)}
    assert found == names, f"missing from prod_seed.py: {names - found}"
    ns = {"argparse": argparse, "os": os, "signal": signal, "subprocess": subprocess,
          "CYAN": "", "GREEN": "", "RED": "", "YELLOW": "", "RESET": "",
          "LOG_PATH": "logs/seed/seed-test.log", "log": _Log(), "_stopped_at_check": False,
          **globals_}
    exec(compile(ast.Module(body=keep, type_ignores=[]), str(PROD_SEED), "exec"), ns)  # noqa: S102 -- prod_seed.py's own functions
    return ns


class _IO:
    """The run's outside world, scripted: each script's exits in order (the last repeats)."""

    def __init__(self, exits=None, answer="seed prod", owed=(), interrupt_at=None):
        self.exits = {key: list(value) for key, value in (exits or {}).items()}
        self.answer = answer
        self._owed = list(owed)
        self.interrupt_at = interrupt_at
        self.calls, self.slept = [], []
        self.now = 1000.0
        self.step = None

    def run(self, cmd):
        script = next(part for part in cmd if part.endswith(".py")).rsplit("/", 1)[1]
        key = f"{script} --check" if "--check" in cmd else script
        self.calls.append(cmd)
        if key == self.interrupt_at:
            raise KeyboardInterrupt
        outcomes = self.exits.get(key, [(0, [])])
        return outcomes.pop(0) if len(outcomes) > 1 else outcomes[0]

    def ask(self, prompt):
        if self.answer is KeyboardInterrupt:
            raise KeyboardInterrupt
        return self.answer

    def owed(self):
        return self._owed

    def sleep(self, seconds):
        self.slept.append(seconds)
        self.now += seconds

    def clock(self):
        return self.now

    def tunnel_commands(self):
        return TUNNELS

    def scripts(self):
        return [" ".join(part for part in cmd if part.endswith(".py") or part.startswith("--"))
                for cmd in self.calls]


def _opts(*argv):
    return _load({"parse_args"})["parse_args"](list(argv))


def _run(*argv, **io_kwargs):
    ns = _load(FUNCTIONS)
    io = _IO(**io_kwargs)
    code = ns["run_seed"](ns["parse_args"](list(argv)), {}, io)
    return code, io, ns["log"], ns


SEED_STEPS = ["scripts/db/check_connections.py", "scripts/db/seed_walkthroughs.py --check",
              "scripts/db/seed_collectibles.py --check",
              "scripts/db/seed_collectibles.py", "scripts/db/seed_walkthroughs.py",
              "scripts/cache/clear_content_cache.py", "scripts/cache/purge_api_cache.py --clear-ledger"]


# ── Flags ────────────────────────────────────────────────────────────────────

def test_no_fallback_is_accepted_and_changes_nothing():
    plain, with_flag = _opts(), _opts("--no-fallback")
    assert with_flag.no_fallback and not plain.no_fallback
    assert (plain.purge_all, plain.purge_only) == (with_flag.purge_all, with_flag.purge_only)
    # It no longer contradicts --purge-all: neither one purges the zone.
    assert _opts("--purge-all", "--no-fallback").purge_all


def test_an_unknown_flag_stops_before_anything_runs(capsys):
    with pytest.raises(SystemExit) as stopped:
        _opts("--purge-al")
    assert stopped.value.code == 2
    assert "unrecognized arguments: --purge-al" in capsys.readouterr().err


# ── A clean run ──────────────────────────────────────────────────────────────

def test_a_clean_run_seeds_waits_clears_and_purges_in_that_order():
    code, io, log, _ = _run()
    assert code == 0
    assert io.scripts() == SEED_STEPS
    # The last clear waits until 15 s after the last COMMIT (the scripted clock stands still).
    assert io.slept == [15]
    assert "--- Prod seed complete ---" in log.text("INFO")
    assert log.text("ERROR") == ""


def test_the_run_never_purges_the_zone():
    """No path in either script purges everything, so the image cache always stays warm."""
    for path in (PROD_SEED, SCRIPTS / "cache" / "purge_api_cache.py"):
        source = path.read_text(encoding="utf-8")
        assert "purge_everything" not in source, path


# ── Failures: each stops the run, says what's owed and what to run next ───────

def test_a_seeder_failure_stops_before_the_clear_and_the_purge():
    reason = "✗ 2 problem(s) with the seed data (listed above). Nothing was written."
    code, io, log, _ = _run(exits={"seed_collectibles.py": [(1, ["...", reason])]})
    assert code == 1
    assert io.scripts() == SEED_STEPS[:4]
    errors = log.text("ERROR")
    assert f"[FAILED] Seeding prod collectibles database (exit 1): {reason}" in errors
    assert "Owed a purge: nothing" in errors
    assert "Fix the cause, then run it again: uv run python scripts/prod_seed.py" in errors
    assert TUNNELS[0] in errors


def test_a_local_image_path_stops_the_run_before_any_seeder_writes():
    """An image path the URL swap never turned into an R2 URL works on dev and breaks on prod,
    so both seeders' --check run before either seeder writes."""
    reason = ("✗ Luke's Memory [817]: 1 image path(s) still point at the local masters folder, "
              "such as /assets/images/Wasteland/Plant/a.jpg. Run the image pipeline "
              "(dev_workflow.py collectibles), commit, then seed prod.")
    code, io, log, _ = _run(exits={"seed_collectibles.py --check": [(1, ["...", reason])]})
    assert code == 1
    assert io.scripts() == SEED_STEPS[:3]
    assert "scripts/db/seed_collectibles.py" not in io.scripts()
    assert f"[FAILED] Checking collectible files (exit 1): {reason}" in log.text("ERROR")


def test_a_seeder_failure_after_an_earlier_commit_names_what_is_owed():
    """Collectibles committed and recorded, then the walkthroughs failed: the run says the
    collectibles still need their purge, and how to make it before fixing the cause."""
    code, _io, log, _ = _run(exits={"seed_walkthroughs.py": [(1, ["✗ The database refused the seed"])]},
                            owed=[("20261026-101500", ["collectibles"])])
    assert code == 1
    errors = log.text("ERROR")
    assert "20261026-101500: collectibles" in errors
    assert "To purge what's owed first: uv run python scripts/prod_seed.py --purge-only" in errors


def test_a_failed_clear_stops_before_the_purge():
    code, io, log, _ = _run(exits={"clear_content_cache.py": [(1, ["✗ Clearing collectibles:* failed"])]})
    assert code == 1
    assert "scripts/cache/purge_api_cache.py --clear-ledger" not in io.scripts()
    assert "Next: uv run python scripts/prod_seed.py --purge-only" in log.text("ERROR")


def test_a_purge_that_cant_build_its_list_is_not_retried_and_never_escalates():
    reason = "✗ No answer from the database for 30 s while building the URL list; nothing was purged."
    code, io, log, _ = _run(exits={"purge_api_cache.py": [(2, [reason])]})
    assert code == 1
    assert io.scripts().count("scripts/cache/purge_api_cache.py --clear-ledger") == 1
    errors = log.text("ERROR")
    assert f"[FAILED] Purging seeded API URLs (exit 2): {reason}" in errors
    assert "Next: uv run python scripts/prod_seed.py --purge-only" in errors
    assert TUNNELS[0] in errors


def test_a_cloudflare_refusal_names_the_credentials_not_the_tunnels():
    reason = "✗ Cloudflare refused the purge: batch 1 got HTTP 403 from Cloudflare."
    code, _io, log, _ = _run(exits={"purge_api_cache.py": [(2, [reason])]})
    assert code == 1
    assert reason in log.text("ERROR") and TUNNELS[0] not in log.text("ERROR")


def test_a_transient_purge_failure_is_retried_three_times_then_stops():
    code, io, log, _ = _run(exits={"purge_api_cache.py": [(1, ["✗ Cloudflare kept failing: HTTP 503"])]})
    assert code == 1
    assert io.scripts().count("scripts/cache/purge_api_cache.py --clear-ledger") == 3
    assert io.slept == [15, 2, 5]
    assert "Next: uv run python scripts/prod_seed.py --purge-only" in log.text("ERROR")


def test_a_transient_purge_failure_that_clears_up_succeeds():
    code, io, _log, _ = _run(exits={"purge_api_cache.py": [(1, ["503"]), (0, [])]})
    assert code == 0
    assert io.scripts().count("scripts/cache/purge_api_cache.py --clear-ledger") == 2


def test_a_failed_connection_check_runs_nothing_and_names_the_tunnels():
    code, io, log, ns = _run(exits={"check_connections.py": [(1, [])]})
    assert code == 1
    assert io.scripts() == ["scripts/db/check_connections.py"]
    assert "[STOPPED] Checking prod connections (exit 1): nothing was run" in log.text("ERROR")
    assert ns["_stopped_at_check"] is True


def test_any_answer_but_seed_prod_aborts_with_nothing_run():
    code, io, log, _ = _run(answer="no")
    assert code == 1
    assert io.scripts() == ["scripts/db/check_connections.py"]
    assert "Aborted: nothing was run" in log.text("WARNING") and log.text("ERROR") == ""


# ── --purge-all and --purge-only ─────────────────────────────────────────────

def test_purge_all_purges_every_api_url_and_still_seeds():
    code, io, _log, _ = _run("--purge-all")
    assert code == 0
    assert io.scripts()[-1] == "scripts/cache/purge_api_cache.py --clear-ledger --all"
    assert "scripts/db/seed_collectibles.py" in io.scripts()


def test_purge_only_skips_the_seeders_and_the_wait():
    code, io, log, _ = _run("--purge-only", owed=[("20261026-101500", ["collectibles"])])
    assert code == 0
    assert io.scripts() == ["scripts/db/check_connections.py", "scripts/cache/clear_content_cache.py",
                            "scripts/cache/purge_api_cache.py --clear-ledger"]
    assert io.slept == []
    assert "--- Purge complete ---" in log.text("INFO")


def test_purge_only_with_nothing_owed_says_so_and_runs_nothing():
    code, io, log, _ = _run("--purge-only")
    assert code == 0 and io.calls == []
    assert "Nothing is owed a purge" in log.text("INFO")


def test_purge_only_with_purge_all_purges_everything_even_with_nothing_owed():
    code, io, _log, _ = _run("--purge-only", "--purge-all")
    assert code == 0
    assert io.scripts()[-1] == "scripts/cache/purge_api_cache.py --clear-ledger --all"


# ── Ctrl+C ───────────────────────────────────────────────────────────────────

def _interrupt(*argv, **io_kwargs):
    ns = _load(FUNCTIONS)
    io = _IO(**io_kwargs)
    with pytest.raises(KeyboardInterrupt):
        ns["run_seed"](ns["parse_args"](list(argv)), {}, io)
    return ns["interrupted"](io), io, ns["log"]


def test_ctrl_c_at_the_prompt_aborts_with_nothing_run():
    code, _io, log = _interrupt(answer=KeyboardInterrupt)
    assert code == 1
    assert "Aborted: nothing was run" in log.text("WARNING") and log.text("ERROR") == ""


def test_ctrl_c_in_a_seeder_says_it_was_all_or_nothing_and_to_run_again():
    code, _io, log = _interrupt(interrupt_at="seed_collectibles.py")
    assert code == 130
    errors = log.text("ERROR")
    assert "[INTERRUPTED] during Seeding prod collectibles database" in errors
    assert "all in prod or not at all" in errors and "Run it again" in errors


def test_ctrl_c_in_the_purge_points_at_purge_only():
    code, _io, log = _interrupt(interrupt_at="purge_api_cache.py",
                                owed=[("20261026-101500", ["collectibles", "walkthroughs"])])
    assert code == 130
    errors = log.text("ERROR")
    assert "[INTERRUPTED] during Purging seeded API URLs" in errors
    assert "20261026-101500: collectibles, walkthroughs" in errors
    assert "--purge-only" in errors


def test_ctrl_c_in_the_connection_check_says_nothing_was_run():
    code, _io, log = _interrupt(interrupt_at="check_connections.py")
    assert code == 130
    assert "nothing was run" in log.text("WARNING") and log.text("ERROR") == ""


def test_the_run_lock_is_taken_before_anything_runs():
    tree = ast.parse(PROD_SEED.read_text(encoding="utf-8"))
    main = next(node for node in tree.body if isinstance(node, ast.FunctionDef) and node.name == "main")
    calls = {getattr(c.func, "attr", getattr(c.func, "id", None)): c.lineno
             for c in ast.walk(main) if isinstance(c, ast.Call)}
    assert "LOCK_NB" in ast.unparse(main)
    assert calls["flock"] < calls["run_seed"]


class _LockHeld:
    """fcntl, as a second run finds it: another run holds the lock."""
    LOCK_EX, LOCK_NB = 2, 4

    @staticmethod
    def flock(fd, flags):
        raise BlockingIOError


class _LockFree(_LockHeld):
    @staticmethod
    def flock(fd, flags):
        pass


def _entry_point(tmp_path, fcntl, argv=(), seed=lambda: 0):
    """Run prod_seed.py's own `if __name__ == "__main__"` block around its real main(), with
    everything after the lock stubbed. Returns (exit status, reminders printed, log)."""
    tree = ast.parse(PROD_SEED.read_text(encoding="utf-8"))
    keep = [node for node in tree.body
            if (isinstance(node, ast.FunctionDef) and node.name in {"parse_args", "main"})
            or (isinstance(node, ast.If) and "__main__" in ast.unparse(node.test))]
    reminders = []

    def run_seed(opts, env, io):
        return seed()

    ns = {"__name__": "__main__", "argparse": argparse, "os": os, "time": time,
          "SimpleNamespace": SimpleNamespace, "fcntl": fcntl,
          "sys": SimpleNamespace(argv=["prod_seed.py", *argv], exit=sys.exit),
          "LOG_DIR": tmp_path, "LOG_PATH": tmp_path / "seed-test.log", "RUN_ID": "test",
          "PROD_DATABASE_URL": "postgresql://db", "PROD_REDIS_URL": "redis://cache",
          "_mask": lambda name, url: name, "_ledger": lambda: SimpleNamespace(owed=list),
          "scripts_dir": tmp_path, "run_logged": None, "_tunnel_commands": lambda: TUNNELS,
          "run_seed": run_seed, "interrupted": lambda io: 130, "offer_bucket_prune": lambda: None,
          "remind_to_close_tunnels": lambda: reminders.append("reminded"),
          "CYAN": "", "GREEN": "", "RED": "", "YELLOW": "", "RESET": "", "log": _Log(),
          "_run_lock": None, "_run_started": False}
    with pytest.raises(SystemExit) as ended:
        exec(compile(ast.Module(body=keep, type_ignores=[]), str(PROD_SEED), "exec"), ns)  # noqa: S102 -- prod_seed.py's own entry point
    return ended.value.code, len(reminders), ns["log"]


def test_a_run_the_lock_refuses_leaves_the_tunnels_to_the_run_holding_it(tmp_path):
    """The closing reminder is for this run's own tunnels. A run the lock refused used to end
    by telling you to close the tunnels the running seed was using."""
    code, reminders, log = _entry_point(tmp_path, _LockHeld)
    assert (code, reminders) == (1, 0)
    assert "leave the tunnels open: that run is using them" in log.text("WARNING")
    assert log.text("ERROR") == ""      # nothing ran: grep -l ERROR finds failed runs only


def _ctrl_c():
    raise KeyboardInterrupt


@pytest.mark.parametrize(("argv", "seed", "status"), [
    ((), lambda: 0, 0),                    # done
    ((), lambda: 1, 1),                    # a failed step
    ((), _ctrl_c, 130),                    # Ctrl+C
    (("--purge-only",), lambda: 0, 0),
])
def test_a_run_holding_the_lock_reminds_you_to_close_the_tunnels_however_it_ends(
        tmp_path, argv, seed, status):
    assert _entry_point(tmp_path, _LockFree, argv, seed)[:2] == (status, 1)


def test_a_flag_argparse_rejects_stops_before_the_lock_and_reminds_of_nothing(tmp_path):
    assert _entry_point(tmp_path, _LockFree, ("--purge-al",))[:2] == (2, 0)


# ── run_logged ends the whole step on Ctrl+C ─────────────────────────────────

def test_ctrl_c_kills_the_step_and_its_children_at_once():
    """uv runs Python as its own child, so killing only the direct child would leave the
    seeder running. The step's whole process group goes."""
    ns = _load({"run_logged", "_redact"}, _SECRETS=[])
    interrupted = []

    def info(line):
        if line.startswith("ready") and not interrupted:
            interrupted.append(line)
            raise KeyboardInterrupt

    ns["log"].info = info
    # A shell standing in for uv, with a long-running grandchild in the same group.
    cmd = ["sh", "-c", 'sleep 60 & echo "ready $!"; wait']
    started = time.monotonic()
    with pytest.raises(KeyboardInterrupt):
        ns["run_logged"](cmd)
    grandchild = int(interrupted[0].split()[1])
    assert time.monotonic() - started < 10
    for _ in range(50):
        if not _alive(grandchild):
            break
        time.sleep(0.1)
    else:
        pytest.fail("the grandchild outlived the step")


def _alive(pid):
    """A killed process whose parent died first can linger as a zombie until something reaps
    it; that is dead, not running."""
    try:
        state = Path(f"/proc/{pid}/stat").read_text().rsplit(")", 1)[1].split()[0]
    except (FileNotFoundError, ProcessLookupError):
        return False
    return state != "Z"


# ── An interactive step keeps the terminal ───────────────────────────────────

_PROMPTING_CHILD = ("import os\n"
                    "print(f'same group {os.getpgrp() == os.getpgid(os.getppid())}', flush=True)\n"
                    "answer = input(\"Type 'prune' to delete: \")\nprint(f'got {answer!r}')")


def test_an_interactive_step_shows_its_prompt_before_it_is_answered():
    """prune_bucket.py asks for a typed 'prune' on a line it doesn't end. Read line by line
    through a pipe, that prompt only showed once it had been answered, so the run looked
    stuck. An interactive step keeps the terminal, pipes here that this test reads as they fill,
    and stays in the foreground process group, where a terminal lets it read."""
    import threading

    run_logged = next(node for node in ast.parse(PROD_SEED.read_text(encoding="utf-8")).body
                      if isinstance(node, ast.FunctionDef) and node.name == "run_logged")
    runner = (
        "import os, signal, subprocess, sys\n"
        "class log:\n"
        "    info = warning = error = staticmethod(lambda message: print(message, file=sys.stderr))\n"
        "_redact = str\n"
        f"{ast.unparse(run_logged)}\n"
        f"sys.exit(run_logged([sys.executable, '-c', {_PROMPTING_CHILD!r}], interactive=True)[0])\n")
    proc = subprocess.Popen([sys.executable, "-c", runner], stdin=subprocess.PIPE,
                            stdout=subprocess.PIPE, stderr=subprocess.PIPE)
    seen = bytearray()
    prompt_shown = threading.Event()

    def read():
        while chunk := proc.stdout.read1(1024):
            seen.extend(chunk)
            if b"Type 'prune' to delete: " in seen:
                prompt_shown.set()

    reader = threading.Thread(target=read, daemon=True)
    reader.start()
    shown_before_the_answer = prompt_shown.wait(10)
    try:
        proc.stdin.write(b"prune\n")
        proc.stdin.close()
    except BrokenPipeError:     # the runner already ended; the assertions below say why
        pass
    proc.wait(timeout=10)
    reader.join(5)
    logged = proc.stderr.read()      # the stand-in log writes to stderr
    assert shown_before_the_answer, f"the prompt only showed after the answer: {bytes(seen)!r}"
    assert b"got 'prune'" in seen and proc.returncode == 0
    assert b"same group True" in seen, "the child left its parent's process group: a terminal would stop its read"
    assert b"exit 0" in logged      # its output isn't logged, but its exit status is


@pytest.mark.parametrize(("code", "logged"), [
    (0, "prune_bucket.py finished: the prune ledger is empty"),
    (1, "prune_bucket.py exited 1; ledger kept"),
], ids=["finished", "failed"])
def test_the_prune_offer_runs_prune_bucket_as_an_interactive_step(tmp_path, code, logged):
    """The seed log is the run's only record, so it says how the prune ended (exit 0 always
    leaves the ledger empty) though prune_bucket.py's own output goes to the terminal."""
    (tmp_path / "images").mkdir()
    (tmp_path / "images" / "prune-pending.json").write_text('["stellar-blade/x.webp"]', encoding="utf-8")
    calls = []

    def run_logged(cmd, **kwargs):
        calls.append((cmd, kwargs))
        return code, []

    ns = _load({"offer_bucket_prune"}, scripts_dir=tmp_path, run_logged=run_logged,
               input=lambda prompt: "y")
    ns["offer_bucket_prune"]()
    assert [cmd[-1] for cmd, _ in calls] == ["scripts/images/prune_bucket.py"]
    assert calls[0][1].get("interactive") is True
    assert logged in ns["log"].text()

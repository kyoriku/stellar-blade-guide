# scripts/prod_seed.py
"""
Usage:
  uv run scripts/prod_seed.py                 # seed, then purge the changed API URLs
  uv run scripts/prod_seed.py --purge-all     # seed, then purge every API URL
  uv run scripts/prod_seed.py --purge-only    # no seeding: purge what earlier runs left
                                              # owed (with --purge-all, every API URL)
  uv run scripts/prod_seed.py --no-fallback   # accepted and ignored: a failed purge never
                                              # escalates, so it's no longer needed

Requires PROD_DATABASE_URL, PROD_REDIS_URL, CLOUDFLARE_ZONE_ID and
CLOUDFLARE_API_TOKEN to be set in server/.env (gitignored). Exits before
doing anything if any are missing.

Prod's Postgres and Redis have no public address. PROD_DATABASE_URL and
PROD_REDIS_URL point at SSH tunnels you open by hand first, one Mac tab each
(scripts/images/PIPELINE.md, Seeding prod):

  railway connect Postgres --tunnel-only -P 15432 --environment production 2>/dev/null
  railway connect Redis --tunnel-only -P 16379 --environment production 2>/dev/null

Before the typed confirmation, the run sends each a real query
(scripts/db/check_connections.py) and stops, with nothing run, if either fails.
It ends by reminding you to close both tunnels with Ctrl+C in their tabs: while
the Postgres one is open, anything on the Mac, every container included, can
log in to prod Postgres without a password.

Each seeder writes in one transaction and records what it changes in the purge
ledger (scripts/cache/purge_manifest.py) before its COMMIT. So a run that stops
partway leaves prod as it was, or owing a purge that the next run, or
--purge-only, makes. Every failure stops the run and says what failed, what is
still owed a purge, and what to run next. Nothing here purges the whole zone,
so cached images always stay warm. Only one run at a time: a second one stops.

Every run writes a timestamped log to server/logs/seed/ (gitignored). That file
is the only record a purge happened at all, so it carries the run ID, the URLs
purged, the Cloudflare response status, and each retry separately with its real
error text. `grep -l ERROR logs/seed/*.log` finds the runs that failed or were
interrupted.
"""

import argparse
import fcntl
import importlib.util
import logging
import signal
import subprocess
import sys
import os
import re
import time
from datetime import datetime
from pathlib import Path
from types import SimpleNamespace
from urllib.parse import parse_qs, unquote, urlsplit
from zoneinfo import ZoneInfo

from dotenv import load_dotenv

# ANSI constants and the log timezone are inlined (values match
# app/core/colours.py and app/middleware/logging.py). No app import means no
# sys.path bootstrap for import sorters to hoist things above.
CYAN = "\033[36m"
GREEN = "\033[32m"
RED = "\033[31m"
YELLOW = "\033[33m"
RESET = "\033[0m"

# Same zone the access log stamps, so a purge lines up against the traffic it
# affected without mental arithmetic.
LOG_TZ = ZoneInfo("America/New_York")


load_dotenv(Path(__file__).parent.parent / ".env")

scripts_dir = Path(__file__).parent

RUN_ID = datetime.now(LOG_TZ).strftime("%Y%m%d-%H%M%S")
LOG_DIR = scripts_dir.parent / "logs" / "seed"

ANSI_RE = re.compile(r"\x1b\[[0-9;]*m")

# A transient Cloudflare failure is retried; anything else would fail the same way again.
PURGE_RETRIES = 3
PURGE_BACKOFF_SECONDS = (2, 5)
EXIT_TRANSIENT = 1   # purge_api_cache.py: retry is worth attempting
EXIT_INTERRUPTED = 130

# The last cache clear waits until this long after the last COMMIT. A request that read the
# old rows just before a COMMIT can still be writing them to Redis for up to 10 s (the
# statement timeout) plus 2 s (the Redis timeout); clearing after that leaves nothing stale
# for the purge to refill the edge from.
REFILL_WAIT_SECONDS = 15

# The devcontainer reaches the Mac's tunnels at this host. A URL pointing anywhere else
# isn't going through one.
TUNNEL_HOST = "host.docker.internal"
TUNNEL_DEFAULT_PORTS = {"Postgres": 15432, "Redis": 16379}


class _PlainFormatter(logging.Formatter):
    """Timestamped, ANSI-free lines for the log file.

    Messages carry ANSI and embedded newlines for the terminal's benefit; the
    file wants neither. Every physical line gets its own timestamp and level so
    the file greps line-by-line — a message like "[SUCCESS] ...\\n" would
    otherwise leave an unprefixed blank line behind.
    """

    def formatTime(self, record, datefmt=None):
        # logging's default converter is localtime; pin it so file timestamps
        # and RUN_ID agree even if the machine is not in LOG_TZ.
        return datetime.fromtimestamp(record.created, LOG_TZ).strftime(
            datefmt or "%Y-%m-%d %H:%M:%S")

    def format(self, record):
        stamp = self.formatTime(record, self.datefmt)
        text = ANSI_RE.sub("", record.getMessage())
        return "\n".join(
            f"{stamp} {record.levelname:<7} {line.rstrip()}"
            for line in text.splitlines() if line.strip()
        )


class _DropBlank(logging.Filter):
    """Spacer lines are terminal formatting; they carry nothing to timestamp."""

    def filter(self, record):
        return bool(ANSI_RE.sub("", record.getMessage()).strip())


def _unique_log_path():
    """RUN_ID is second-granularity, so two runs inside one second would share a
    file (FileHandler appends) and interleave, leaving the run ID ambiguous for
    anything that needs to tie a record back to one run. Keep the documented
    seed-YYYYMMDD-HHMMSS.log shape and only disambiguate on a real collision."""
    global RUN_ID
    candidate = LOG_DIR / f"seed-{RUN_ID}.log"
    suffix = 2
    while candidate.exists():
        RUN_ID = f"{datetime.now(LOG_TZ).strftime('%Y%m%d-%H%M%S')}-{suffix}"
        candidate = LOG_DIR / f"seed-{RUN_ID}.log"
        suffix += 1
    return candidate


def _setup_logging():
    """Terminal output is unchanged — bare message, ANSI intact — while the file
    gets a timestamp and level and has ANSI stripped so it greps cleanly.
    StreamHandler.emit flushes per record, so a run killed halfway still leaves
    everything it had written on disk. No rotation: the folder is disposable."""
    LOG_DIR.mkdir(parents=True, exist_ok=True)
    log_path = _unique_log_path()

    logger = logging.getLogger("prod_seed")
    logger.setLevel(logging.INFO)
    logger.propagate = False

    stream = logging.StreamHandler(sys.stdout)
    stream.setFormatter(logging.Formatter("%(message)s"))
    logger.addHandler(stream)

    file_handler = logging.FileHandler(log_path, encoding="utf-8")
    file_handler.setFormatter(_PlainFormatter(datefmt="%Y-%m-%d %H:%M:%S"))
    file_handler.addFilter(_DropBlank())
    logger.addHandler(file_handler)

    return logger, log_path


log, LOG_PATH = _setup_logging()

REQUIRED = ["PROD_DATABASE_URL", "PROD_REDIS_URL",
            "CLOUDFLARE_ZONE_ID", "CLOUDFLARE_API_TOKEN"]
missing = [n for n in REQUIRED if not os.getenv(n)]
if missing:
    log.error(f"{RED}Missing required environment variables: {', '.join(missing)}{RESET}")
    log.error("  → Set them in server/.env (gitignored)")
    sys.exit(1)

PROD_DATABASE_URL = os.environ["PROD_DATABASE_URL"]
PROD_REDIS_URL = os.environ["PROD_REDIS_URL"]
CLOUDFLARE_ZONE_ID = os.environ["CLOUDFLARE_ZONE_ID"]
CLOUDFLARE_API_TOKEN = os.environ["CLOUDFLARE_API_TOKEN"]

STEPS = [
    # First, before anything writes: a refusal from the walkthrough seeder itself would
    # land after the collectibles are written. This one only reads the seed files.
    ("Checking walkthrough files", [
     "uv", "run", "python", "scripts/db/seed_walkthroughs.py", "--check"]),
    ("Seeding prod collectibles database", [
     "uv", "run", "python", "scripts/db/seed_collectibles.py"]),
    ("Seeding prod walkthroughs database", [
     "uv", "run", "python", "scripts/db/seed_walkthroughs.py"]),
]

# Every content pattern, once more, right before the purge (see REFILL_WAIT_SECONDS).
CLEAR_STEP = ("Clearing prod content cache", [
    "uv", "run", "python", "scripts/cache/clear_content_cache.py"])
PURGE_LABEL = "Purging seeded API URLs"
CHECK_LABEL = "Checking prod connections"


def _split_url(url):
    """(userinfo, host, port, path) as the URL is written: the credentials end at its LAST
    '@', so a raw '/', '?', '#' or '@' in a password stays with them. That's the host the
    user meant; a driver can read another (_reading). userinfo is None when there is no
    '@'. None when the host or port doesn't parse.
    scripts/db/check_connections.py has the same function; a test keeps the two in step."""
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


def _reading(name, url):
    """(host, port, database) as the driver for name reads url: SQLAlchemy for Postgres,
    which ends the password at the FIRST '@', and redis-py for Redis, which ends the host at
    the first '/', '?' or '#'. None when it can't parse url.
    scripts/db/check_connections.py reads them the same way; a test keeps the two in step."""
    from redis.asyncio.connection import parse_url
    from sqlalchemy.engine import make_url

    try:
        if name == "Postgres":
            found = make_url(url)
            return found.host, found.port, found.database
        found = parse_url(url)
        return found.get("host"), found.get("port"), found.get("db")
    except Exception:       # its message quotes the URL, password included
        return None


def _url_problem(name, url):
    """Why the connection check will stop on url before connecting, or None, in its words
    (check_connections.url_problem, which also says how to fix it; a test keeps the two in
    step)."""
    driver = "SQLAlchemy" if name == "Postgres" else "redis-py"
    if url.count("@") > 1:
        return "the URL has more than one @"
    found = _reading(name, url)
    if found is None or not found[0]:
        return f"{driver} can't parse the URL"
    written = _split_url(url)
    if written is None or (found[0].lower(), found[1]) != (written[1].lower(), written[2]):
        return f"{driver} reads a different host from the one written"
    return None


def _mask(name, url):
    """Where the driver for name will connect, never the credentials: no user name, no
    password, no query string. A URL the connection check will stop on isn't shown, since
    the host a driver misreads holds part of the password."""
    problem = _url_problem(name, url)
    if problem is not None:
        return f"(not shown: {problem})"
    host, port, database = _reading(name, url)
    if ":" in host:
        host = f"[{host}]"
    scheme = url.partition("://")[0]
    credentials = "*****@" if _split_url(url)[0] is not None else ""
    return (f"{scheme}://{credentials}{host}" + (f":{port}" if port else "")
            + (f"/{database}" if database not in (None, "") else ""))


def _url_secrets(url):
    """The forms a URL's credentials take in a child's output: the userinfo, its password,
    any password= query value, each also percent-decoded. A userinfo with no ':' counts
    whole (a password pasted without its user name)."""
    parsed = _split_url(url)
    candidates = []
    if parsed is not None and parsed[0]:
        userinfo = parsed[0]
    elif parsed is None:
        # Too broken to parse (a dropped '/', say): everything between the scheme and the
        # last '@' is credentials.
        head, at, _ = url.rpartition("@")
        userinfo = head.partition(":")[2].lstrip("/") if at else ""
    else:
        userinfo = ""
    if userinfo:
        _, colon, password = userinfo.partition(":")
        candidates += [userinfo, password] if colon else [userinfo]
    candidates += parse_qs(url.partition("?")[2]).get("password", [])
    found = set()
    for value in candidates:
        for form in (value, unquote(value)):
            if form:
                found.add(form)
    return sorted(found, key=len, reverse=True)


def _tunnel_ports(urls):
    """(name, port) for each (name, url) written to go through a tunnel opened on the Mac.
    By the host as written, not as a driver reads it: that's what the tunnel was opened
    for, so a URL the check stops on as misread still gets its tunnel named."""
    found = []
    for name, url in urls:
        parsed = _split_url(url)
        if parsed is not None and parsed[1] == TUNNEL_HOST and parsed[2]:
            found.append((name, parsed[2]))
    return found


def _tunnel_commands():
    """The railway connect line for each tunnel, with the ports server/.env points at."""
    ports = dict(TUNNEL_DEFAULT_PORTS)
    ports.update(_tunnel_ports((("Postgres", PROD_DATABASE_URL), ("Redis", PROD_REDIS_URL))))
    return [f"railway connect {name} --tunnel-only -P {port} --environment production 2>/dev/null"
            for name, port in ports.items()]


def remind_to_close_tunnels():
    """The run's last word when it went through tunnels: an open Postgres tunnel lets anything
    on the Mac, every container included, into prod without a password."""
    tunnels = _tunnel_ports((("Postgres", PROD_DATABASE_URL), ("Redis", PROD_REDIS_URL)))
    if not tunnels:
        return
    ports = " ".join(f"-iTCP:{port}" for _, port in tunnels)
    if _stopped_at_check:
        # The tunnels may never have been opened, and the user may be about to retry.
        log.info(f"\n{YELLOW}[TUNNELS]{RESET} If you opened a tunnel and aren't running this again "
                 f"now, close it with Ctrl+C in its tab, then check on the Mac that nothing is "
                 f"listening (no output means closed):")
    else:
        names = " and ".join(name for name, _ in tunnels)
        which = ("tunnels with Ctrl+C in their tabs" if len(tunnels) > 1
                 else "tunnel with Ctrl+C in its tab")
        log.info(f"\n{YELLOW}[TUNNELS]{RESET} Close the {names} {which}, then check on the Mac "
                 f"that nothing is listening (no output means closed):")
    log.info(f"  lsof -nP {ports} -sTCP:LISTEN\n")


# Set when the connection check stops the run, so the closing reminder doesn't tell the
# user to close tunnels the STOPPED message just told them to open.
_stopped_at_check = False

# Longest first, so no fragment of a secret survives a replace.
_SECRETS = sorted(
    {CLOUDFLARE_API_TOKEN, CLOUDFLARE_ZONE_ID,
     *_url_secrets(PROD_DATABASE_URL), *_url_secrets(PROD_REDIS_URL)} - {""},
    key=len, reverse=True)


def _redact(text):
    """The zone ID sits in the purge URL, so it can surface in a child's error
    text or a requests exception message, and a driver's error can quote part of
    a database URL. Nothing secret reaches the log file."""
    out = str(text)
    for secret in _SECRETS:
        out = out.replace(secret, "*****")
    return out


def run_logged(cmd, env=None, cwd=None, own_group=True):
    """Run a child process, streaming its output live to the terminal and into
    the log file line by line.

    Capturing wholesale would hide progress during a 30s seed; streaming keeps
    the terminal identical to before while still getting the child's real error
    text on disk — the retry logic is only useful if a 503 is distinguishable
    from a 403 afterwards. Children get PYTHONUNBUFFERED because print() into a
    pipe is block-buffered, which would otherwise batch all output to the end.

    A child that doesn't read the terminal runs in its own process group, so a
    Ctrl+C reaches only this script, which then ends the whole step at once: uv
    and its Python child alike, before any cleanup can wait on a dead tunnel.
    """
    child_env = dict(env or os.environ)
    child_env["PYTHONUNBUFFERED"] = "1"
    proc = subprocess.Popen(
        cmd, env=child_env, cwd=cwd, stdout=subprocess.PIPE,
        stderr=subprocess.STDOUT, text=True, bufsize=1,
        process_group=0 if own_group else None)
    tail = []
    try:
        for line in proc.stdout:
            line = _redact(line.rstrip("\n"))
            log.info(line)
            if line.strip():
                tail.append(line.strip())
        proc.wait()
    except KeyboardInterrupt:
        try:
            if own_group:
                os.killpg(proc.pid, signal.SIGKILL)
            else:
                proc.kill()
        except ProcessLookupError:
            pass
        proc.wait()
        raise
    return proc.returncode, tail


def offer_bucket_prune():
    """Post-seed hook for the reference-driven prune (scripts/images/PIPELINE.md):
    pruned images leave bucket objects pending until prod stops referencing
    them, which is true once this seed + purge has succeeded. Offers to run
    prune_bucket.py here; that tool's own typed 'prune' confirmation still
    applies. Declining keeps the ledger and prints the standalone command."""
    import json
    ledger = scripts_dir / "images" / "prune-pending.json"
    try:
        pending = json.loads(ledger.read_text()) if ledger.exists() else []
    except Exception as e:
        log.warning(f"{RED}[WARN]{RESET} could not read prune ledger ({e}); skipping offer")
        return
    if not pending:
        return
    log.info(f"{CYAN}[PENDING]{RESET} {len(pending)} pruned image(s) still have bucket objects.")
    answer = input(
        "Run prune_bucket.py now? (its own 'prune' confirm still applies) [y/N]: ").strip().lower()
    if answer != "y":
        log.info("  → Ledger kept. Later: uv run python scripts/images/prune_bucket.py\n")
        return
    code, _ = run_logged(
        ["uv", "run", "python", "scripts/images/prune_bucket.py"],
        cwd=scripts_dir.parent, own_group=False)
    if code != 0:
        log.warning("  → prune_bucket did not complete; ledger kept."
                    " Later: uv run python scripts/images/prune_bucket.py\n")


def parse_args(argv):
    """The flags. An unknown one stops the run before anything happens, so a typo can't
    quietly run something else. Abbreviations are off: argparse would otherwise read
    --purge-al as --purge-all."""
    parser = argparse.ArgumentParser(
        prog="prod_seed.py", allow_abbrev=False,
        description="Seed prod from server/seed-data, then purge the API URLs that changed.")
    parser.add_argument("--purge-all", action="store_true",
                        help="purge every API URL, not only the changed ones; images stay cached")
    parser.add_argument("--purge-only", action="store_true",
                        help="no seeding: purge what earlier runs left owed "
                             "(with --purge-all, every API URL)")
    parser.add_argument("--no-fallback", action="store_true",
                        help="no longer needed: a failed purge never escalates; does nothing")
    return parser.parse_args(argv)


def _ledger():
    """scripts/cache/purge_manifest.py, loaded by path: this script keeps server/ off
    sys.path, and that module imports nothing from the app."""
    spec = importlib.util.spec_from_file_location(
        "purge_manifest", scripts_dir / "cache" / "purge_manifest.py")
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    return module


def owed_lines(owed):
    """What the ledger says is still owed a purge, as log lines."""
    if not owed:
        return ["  Owed a purge: nothing"]
    lines = ["  Owed a purge (scripts/cache/purge-manifest.json):"]
    for name, sections in owed:
        lines.append(f"    {name}" + (f": {', '.join(sections)}" if sections else ""))
    return lines


def failed(label, code, tail, kind, opts, io):
    """Log a failed step, what is owed, and what to run next. Returns the exit status."""
    reason = tail[-1] if tail else f"exit {code}"
    log.error(f"{RED}[FAILED]{RESET} {label} (exit {code}): {reason}")
    owed = io.owed()
    for line in owed_lines(owed):
        log.error(line)
    all_flag = " --purge-all" if opts.purge_all else ""
    if kind == "seed":
        log.error(f"  → Fix the cause, then run it again: uv run python scripts/prod_seed.py{all_flag}")
        if owed:
            log.error("  → To purge what's owed first: uv run python scripts/prod_seed.py --purge-only")
    else:
        log.error(f"  → Next: uv run python scripts/prod_seed.py --purge-only{all_flag}")
    if "Cloudflare" not in reason:
        log.error("  → If a tunnel dropped, reopen it first:")
        for command in io.tunnel_commands():
            log.error(f"      {command}")
    log.info(f"  Log: {LOG_PATH}")
    return 1


def run_seed(opts, env, io):
    """Everything after the header: the check, the confirmation, the seeders, the last cache
    clear and the purge. `io` supplies run(cmd), ask(prompt), owed(), sleep(seconds), clock()
    and tunnel_commands(); io.step names the running step for an interrupt. Returns the exit
    status."""
    global _stopped_at_check
    if opts.purge_only and not opts.purge_all and not io.owed():
        log.info(f"\n{GREEN}Nothing is owed a purge.{RESET} To purge every API URL anyway: "
                 f"uv run python scripts/prod_seed.py --purge-only --purge-all")
        return 0

    # Before the typed confirmation, through the same env, URLs and Redis client the
    # seeders get: a closed tunnel or a refused password stops the run here.
    io.step = CHECK_LABEL
    log.info(f"\n{CYAN}[RUNNING]{RESET} {CHECK_LABEL}")
    code, _ = io.run(["uv", "run", "python", "scripts/db/check_connections.py"])
    if code != 0:
        _stopped_at_check = True
        log.error(f"{RED}[STOPPED]{RESET} {CHECK_LABEL} (exit {code}): nothing was run")
        log.error("  → If the tunnels aren't open, run these in two Mac tabs, then run this again:")
        for command in io.tunnel_commands():
            log.error(f"      {command}")
        log.error("  → More: scripts/images/PIPELINE.md, Seeding prod")
        return 1
    log.info(f"{GREEN}[SUCCESS]{RESET} {CHECK_LABEL}")

    io.step = None    # an interrupt at the prompt aborts with nothing run
    answer = io.ask(f"\nType {CYAN}seed prod{RESET} to continue: ").strip()
    if answer != "seed prod":
        # A warning, not an error: answering 'no' is also how a run checks the tunnels
        # without seeding, and `grep -l ERROR logs/seed/*.log` is for runs that failed.
        log.warning(f"{RED}Aborted: nothing was run{RESET}")
        return 1
    log.info("  Confirmed, starting\n")

    if not opts.purge_only:
        last_commit = io.clock()
        for label, cmd in STEPS:
            io.step = label
            log.info(f"{CYAN}[RUNNING]{RESET} {label}")
            code, tail = io.run(cmd)
            if code != 0:
                return failed(label, code, tail, "seed", opts, io)
            log.info(f"{GREEN}[SUCCESS]{RESET} {label}\n")
            if "--check" not in cmd:
                last_commit = io.clock()
        wait = REFILL_WAIT_SECONDS - (io.clock() - last_commit)
        if wait > 0:
            io.step = "the wait before the last cache clear"
            log.info(f"  Waiting {wait:.0f} s, so no request still reading the old rows can "
                     f"refill Redis after the clear")
            io.sleep(wait)

    label, cmd = CLEAR_STEP
    io.step = label
    log.info(f"{CYAN}[RUNNING]{RESET} {label}")
    code, tail = io.run(cmd)
    if code != 0:
        return failed(label, code, tail, "purge", opts, io)
    log.info(f"{GREEN}[SUCCESS]{RESET} {label}\n")

    io.step = PURGE_LABEL
    purge_cmd = ["uv", "run", "python", "scripts/cache/purge_api_cache.py", "--clear-ledger"]
    if opts.purge_all:
        purge_cmd.append("--all")
    for attempt in range(1, PURGE_RETRIES + 1):
        if attempt == 1:
            log.info(f"{CYAN}[RUNNING]{RESET} {PURGE_LABEL}")
        else:
            log.warning(f"{YELLOW}[RETRY {attempt}/{PURGE_RETRIES}]{RESET} {PURGE_LABEL}")
        code, tail = io.run(purge_cmd)
        if code == 0:
            break
        if code != EXIT_TRANSIENT or attempt == PURGE_RETRIES:
            return failed(PURGE_LABEL, code, tail, "purge", opts, io)
        reason = tail[-1] if tail else f"exit {code}"
        log.warning(f"{YELLOW}[FAILED]{RESET} {PURGE_LABEL} — transient, "
                    f"attempt {attempt}/{PURGE_RETRIES}: {reason}")
        delay = PURGE_BACKOFF_SECONDS[min(attempt - 1, len(PURGE_BACKOFF_SECONDS) - 1)]
        log.info(f"  → retrying in {delay}s")
        io.sleep(delay)
    log.info(f"{GREEN}[SUCCESS]{RESET} {PURGE_LABEL}\n")

    log.info(f"{GREEN}--- {'Purge' if opts.purge_only else 'Prod seed'} complete ---{RESET}")
    log.info(f"  Log: {LOG_PATH}\n")
    return 0


def interrupted(io):
    """Log a Ctrl+C: where it landed, what is owed, and what to run next. Returns the exit
    status."""
    step = io.step
    if step is None:
        log.warning(f"{RED}Aborted: nothing was run{RESET}")
        return 1
    if step == CHECK_LABEL:
        log.warning(f"{RED}Interrupted during {CHECK_LABEL}: nothing was run{RESET}")
        return EXIT_INTERRUPTED
    log.error(f"{RED}[INTERRUPTED]{RESET} during {step}: that step was stopped at once")
    for line in owed_lines(io.owed()):
        log.error(line)
    if step in (CLEAR_STEP[0], PURGE_LABEL, "the wait before the last cache clear"):
        log.error("  → The seeding finished. Next: uv run python scripts/prod_seed.py --purge-only")
    else:
        log.error("  → A seeder's changes are all in prod or not at all. "
                  "Run it again: uv run python scripts/prod_seed.py")
    log.info(f"  Log: {LOG_PATH}")
    return EXIT_INTERRUPTED


def main():
    opts = parse_args(sys.argv[1:])

    global _run_lock
    _run_lock = open(LOG_DIR / "prod_seed.lock", "w")  # noqa: SIM115 -- held for the whole run
    try:
        fcntl.flock(_run_lock, fcntl.LOCK_EX | fcntl.LOCK_NB)
    except BlockingIOError:
        log.error(f"{RED}Another prod seed is running.{RESET} Wait for it to finish; "
                  f"its log is the newest in {LOG_DIR}.")
        return 1

    if opts.purge_only:
        purge_plan = ("every API URL (--purge-only --purge-all), no seeding" if opts.purge_all
                      else "what earlier runs left owed (--purge-only), no seeding")
    elif opts.purge_all:
        purge_plan = "every API URL (--purge-all); images stay cached"
    else:
        purge_plan = "the changed API URLs; a failed purge stops the run"

    owed = _ledger().owed()
    log.info(f"\n{CYAN}--- Prod seed ---{RESET}")
    log.info(f"  Run ID:   {RUN_ID}")
    log.info(f"  Log:      {LOG_PATH}")
    log.info(f"  Database: {_mask('Postgres', PROD_DATABASE_URL)}")
    log.info(f"  Redis:    {_mask('Redis', PROD_REDIS_URL)}")
    log.info(f"  Purge:    {purge_plan}")
    log.info("  Owed:     " + ("nothing from earlier runs" if not owed else "; ".join(
        f"{name} ({', '.join(sections)})" if sections else name for name, sections in owed)))
    if opts.no_fallback:
        log.info("  --no-fallback: no longer needed; a failed purge never escalates, so it does nothing")

    env = os.environ.copy()
    env["DATABASE_URL"] = PROD_DATABASE_URL
    env["REDIS_URL"] = PROD_REDIS_URL
    # Ties the two seeders and the purge into one run. The seeders record their changes in
    # the ledger under this id, and the purge requires that run's records. A --purge-only run
    # has no records of its own, so it purges whatever earlier runs left. It is also the log
    # filename, so a log line and a ledger entry can be matched up afterwards.
    if opts.purge_only:
        env.pop("SEED_RUN_ID", None)
    else:
        env["SEED_RUN_ID"] = RUN_ID

    io = SimpleNamespace(
        step=None,
        run=lambda cmd: run_logged(cmd, env=env, cwd=scripts_dir.parent),
        ask=input,
        owed=lambda: _ledger().owed(),
        sleep=time.sleep,
        clock=time.monotonic,
        tunnel_commands=_tunnel_commands,
    )
    try:
        code = run_seed(opts, env, io)
    except KeyboardInterrupt:
        return interrupted(io)
    if code == 0 and not opts.purge_only:
        try:
            offer_bucket_prune()
        except KeyboardInterrupt:
            log.warning(f"{YELLOW}Prune offer interrupted:{RESET} the ledger is kept. "
                        f"Later: uv run python scripts/images/prune_bucket.py")
    return code


# Held for the whole run: the OS releases the lock when the process exits, however it does.
_run_lock = None


if __name__ == "__main__":
    try:
        sys.exit(main())
    finally:
        # Every way out once the run has started: done, aborted, a failed step, Ctrl+C.
        remind_to_close_tunnels()

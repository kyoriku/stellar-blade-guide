import sys
import os
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

import json
import re
import traceback
from datetime import datetime
from pathlib import Path
from zoneinfo import ZoneInfo

import boto3
from botocore.config import Config
from dotenv import load_dotenv

load_dotenv()

# Stage B of the reference-driven prune: deletes the bucket objects that
# generate_variants.py's prune gate ledgered after their masters and staged
# files were removed. Run this AFTER prod_seed.py — prod's DB references the
# old URLs until it is reseeded, so deleting these objects earlier would 404
# live images. Dry-run listing first, typed 'prune' to proceed; the run is
# FATAL if any ledgered key is still referenced anywhere (that means the
# ledger is stale or a reference came back — resolve before deleting).

LEDGER_FILE = Path(__file__).parent / 'prune-pending.json'
UPLOAD_WORKERS = 16

# Every run with something to prune writes logs/prune/prune-<id>.log (gitignored): every line
# it prints, and every key it deletes as it deletes it. The ledger is emptied once the
# deletion succeeds, so this log is then the only record of what went. The id is the seed's
# run id when prod_seed.py starts it, so the two logs pair up; otherwise the time.
SERVER_DIR = Path(__file__).resolve().parents[2]
LOG_DIR = SERVER_DIR / 'logs' / 'prune'
LOG_TZ = ZoneInfo('America/New_York')     # as the seed log
ANSI_RE = re.compile(r'\x1b\[[0-9;]*m')

_log_file = None


def _open_log():
    """Open this run's log for appending, and return its path."""
    global _log_file
    run_id = os.environ.get('SEED_RUN_ID') or datetime.now(LOG_TZ).strftime('%Y%m%d-%H%M%S')
    LOG_DIR.mkdir(parents=True, exist_ok=True)
    path = LOG_DIR / f'prune-{run_id}.log'
    _log_file = open(path, 'a', encoding='utf-8')  # noqa: SIM115 -- open for the whole run
    return path


def log_only(text):
    """Write text to the log, each line stamped, without colour codes. Nothing before the
    log is open."""
    if _log_file is None:
        return
    stamp = datetime.now(LOG_TZ).strftime('%Y-%m-%d %H:%M:%S')
    for line in ANSI_RE.sub('', text).splitlines():
        if line.strip():
            _log_file.write(f'{stamp} {line.rstrip()}\n')
    _log_file.flush()


def say(text=''):
    """Print text and log it."""
    print(text, flush=True)
    log_only(text)


def _close_log():
    global _log_file
    if _log_file is not None:
        _log_file.close()
        _log_file = None


def get_client():
    return boto3.client(
        's3',
        endpoint_url=f"https://{os.getenv('R2_ACCOUNT_ID')}.r2.cloudflarestorage.com",
        aws_access_key_id=os.getenv('R2_ACCESS_KEY_ID'),
        aws_secret_access_key=os.getenv('R2_SECRET_ACCESS_KEY'),
        config=Config(request_checksum_calculation='when_required'),
    )


def list_bucket(client, bucket):
    keys, token = set(), None
    while True:
        kwargs = {'Bucket': bucket, 'MaxKeys': 1000}
        if token:
            kwargs['ContinuationToken'] = token
        resp = client.list_objects_v2(**kwargs)
        keys.update(obj['Key'] for obj in resp.get('Contents', []))
        if not resp.get('IsTruncated'):
            return keys
        token = resp.get('NextContinuationToken')


def referenced_keys():
    """The live reference set as derived keys — same code path as the
    manifest check (no reimplementation)."""
    from images.generate_variants import collect_references, derive_key
    r2_refs, local_refs = collect_references()
    return r2_refs | {derive_key(Path(rel)) for rel in local_refs}


def main():
    print("\033[36m=== Prune Bucket (Stage B) ===\033[0m")
    if not LEDGER_FILE.exists() or not (ledger := json.loads(LEDGER_FILE.read_text())):
        print("Ledger empty — nothing to prune.")
        return

    path = _open_log()
    log_only("=== Prune Bucket (Stage B) ===")
    say(f"Log: {path.relative_to(SERVER_DIR)}")

    entries = ledger
    object_keys = [k for e in entries for k in e['object_keys']]
    say(f"Ledger: {len(entries)} image(s), {len(object_keys)} bucket object(s) pending\n")

    # FATAL precondition: no ledgered key may be referenced anywhere. A hit
    # means the ledger is stale or a reference reappeared after pruning.
    live = referenced_keys()
    conflicts = sorted({e['key'] for e in entries} & live)
    if conflicts:
        say(f"\033[31m✗ {len(conflicts)} ledgered key(s) are REFERENCED again — refusing to run:\033[0m")
        for k in conflicts[:10]:
            say(f"\033[31m    {k}\033[0m")
        say("\033[31m  Resolve the references (or remove the entries from the ledger) first.\033[0m")
        sys.exit(1)
    say(f"\033[32m✓ No ledgered key is referenced anywhere\033[0m")

    client = get_client()
    bucket = os.getenv('R2_BUCKET')
    existing = list_bucket(client, bucket)
    say(f"\033[32m✓ Bucket currently holds {len(existing)} objects\033[0m\n")

    absent = [k for k in object_keys if k not in existing]
    present = [k for k in object_keys if k in existing]
    if absent:
        say(f"\033[90m→ {len(absent)} ledgered object(s) not in bucket (never uploaded) — skipped\033[0m")

    say("\033[33m=== DRY RUN — objects that would be deleted ===\033[0m")
    for k in present[:10]:
        say(f"\033[33m  would DELETE: {k}\033[0m")
    if len(present) > 10:
        say(f"\033[90m  ... and {len(present) - 10} more\033[0m")
    if not present:
        say("  (none in bucket — clearing ledger)")
        LEDGER_FILE.write_text('[]')
        return

    if not sys.stdin.isatty():
        say("\033[31m✗ Non-interactive run — the typed confirmation is required. Nothing deleted.\033[0m")
        sys.exit(1)
    try:
        answer = input(f"\nType 'prune' to delete these {len(present)} object(s): ")
    except EOFError:
        answer = ''
    if answer.strip() != 'prune':
        say("\033[33mDeclined — ledger kept, nothing deleted.\033[0m")
        sys.exit(1)
    log_only("Confirmed: 'prune' typed")

    deleted, errors = 0, []
    for i in range(0, len(present), 1000):
        chunk = present[i:i + 1000]
        resp = client.delete_objects(
            Bucket=bucket,
            Delete={'Objects': [{'Key': k} for k in chunk], 'Quiet': True})
        errs = resp.get('Errors', [])
        errors += errs
        failed = {e.get('Key') for e in errs}
        gone = [k for k in chunk if k not in failed]
        deleted += len(gone)
        for k in gone:      # the log's record, one key a line, as each batch goes
            log_only(f"deleted {k}")
    if errors:
        say(f"\033[31m✗ {len(errors)} deletion error(s); ledger kept for retry:\033[0m")
        for e in errors[:10]:
            say(f"\033[31m    {e.get('Key')}: {e.get('Code')} {e.get('Message')}\033[0m")
        sys.exit(1)

    after = list_bucket(client, bucket)
    residual = [k for k in present if k in after]
    say(f"\n\033[36m=== Summary ===\033[0m")
    say(f"\033[32m✓ Deleted: {deleted}\033[0m")
    say(f"→ Bucket count: {len(existing)} -> {len(after)} (expected {len(existing) - len(present)})")
    say(f"→ Residual pruned keys: {len(residual)} (0 expected)")
    if residual or len(after) != len(existing) - len(present):
        say("\033[31m✗ Post-verification mismatch — ledger kept; investigate\033[0m")
        sys.exit(1)
    LEDGER_FILE.write_text('[]')
    say(f"\033[32m✓ Post-verification clean; ledger cleared\033[0m")


def run():
    """main(), with an interruption or an error written to the log too."""
    try:
        main()
    except KeyboardInterrupt:
        log_only("Interrupted (Ctrl+C): the ledger is kept; every key deleted before it is listed above")
        raise
    except Exception:
        log_only("Stopped on an error:\n" + traceback.format_exc())
        raise
    finally:
        _close_log()


if __name__ == '__main__':
    run()

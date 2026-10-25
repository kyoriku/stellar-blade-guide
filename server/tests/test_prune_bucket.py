"""prune_bucket.py's log: every line it prints, and every key it deletes as it deletes it.
The ledger is emptied once the deletion succeeds, so the log is then the only record of what
went. The bucket, the reference scan and the prompt are stand-ins."""

import json

import pytest

from scripts.images import prune_bucket

KEYS = [f"stellar-blade/collectibles/eidos-7/street/stellar-blade-{n}.webp" for n in range(3)]


class _Bucket:
    def __init__(self, keys, failing=()):
        self.keys = set(keys)
        self.failing = set(failing)

    def list_objects_v2(self, **_):
        return {"Contents": [{"Key": key} for key in sorted(self.keys)], "IsTruncated": False}

    def delete_objects(self, Bucket, Delete):
        errors = []
        for obj in Delete["Objects"]:
            if obj["Key"] in self.failing:
                errors.append({"Key": obj["Key"], "Code": "AccessDenied", "Message": "Access Denied"})
            else:
                self.keys.discard(obj["Key"])
        return {"Errors": errors}


class _Terminal:
    def isatty(self):
        return True


@pytest.fixture
def pruning(tmp_path, monkeypatch):
    """A ledger of three keys, all in the bucket; returns (the bucket, the ledger file, the
    log folder)."""
    ledger = tmp_path / "prune-pending.json"
    ledger.write_text(json.dumps([{"key": "stellar-blade/collectibles/eidos-7/street/stellar-blade-x",
                                   "object_keys": KEYS}]))
    bucket = _Bucket(KEYS + ["stellar-blade/site/og-banner.webp"])
    monkeypatch.setattr(prune_bucket, "LEDGER_FILE", ledger)
    monkeypatch.setattr(prune_bucket, "SERVER_DIR", tmp_path)
    monkeypatch.setattr(prune_bucket, "LOG_DIR", tmp_path / "logs" / "prune")
    monkeypatch.setattr(prune_bucket, "referenced_keys", lambda: set())
    monkeypatch.setattr(prune_bucket, "get_client", lambda: bucket)
    monkeypatch.setattr(prune_bucket.sys, "stdin", _Terminal())
    monkeypatch.setattr("builtins.input", lambda prompt: "prune")
    monkeypatch.setenv("R2_BUCKET", "bucket")
    monkeypatch.setenv("SEED_RUN_ID", "20261025-130659")
    return bucket, ledger, tmp_path / "logs" / "prune"


def _log(folder):
    [path] = folder.iterdir()
    return path.name, path.read_text(encoding="utf-8")


def test_the_log_holds_every_line_and_every_deleted_key(pruning, capsys):
    _, ledger, folder = pruning
    prune_bucket.run()
    name, text = _log(folder)
    assert name == "prune-20261025-130659.log"      # the seed's run id, so the logs pair up
    assert "\x1b[" not in text
    for line in ("Ledger: 1 image(s), 3 bucket object(s) pending", "Confirmed: 'prune' typed",
                 "✓ Deleted: 3", "✓ Post-verification clean; ledger cleared"):
        assert line in text
    for key in KEYS:
        assert f"deleted {key}" in text
    assert json.loads(ledger.read_text()) == []
    # The terminal gets the same lines, colours included.
    assert "Log: logs/prune/prune-20261025-130659.log" in capsys.readouterr().out


def test_a_decline_is_logged_and_deletes_nothing(pruning, monkeypatch):
    bucket, ledger, folder = pruning
    monkeypatch.setattr("builtins.input", lambda prompt: "no")
    with pytest.raises(SystemExit):
        prune_bucket.run()
    _, text = _log(folder)
    assert "Declined" in text
    assert not any(f"deleted {key}" in text for key in KEYS)
    assert bucket.keys >= set(KEYS) and json.loads(ledger.read_text())


def test_a_failed_deletion_logs_what_went_and_what_didnt(pruning, monkeypatch):
    bucket, ledger, folder = pruning
    bucket.failing = {KEYS[1]}
    with pytest.raises(SystemExit):
        prune_bucket.run()
    _, text = _log(folder)
    assert f"deleted {KEYS[0]}" in text and f"deleted {KEYS[2]}" in text
    assert f"deleted {KEYS[1]}" not in text
    assert f"{KEYS[1]}: AccessDenied Access Denied" in text
    assert json.loads(ledger.read_text())       # kept for the retry


def test_an_error_is_logged_with_its_traceback(pruning, monkeypatch):
    def broken(client, bucket):
        raise RuntimeError("R2 refused the listing")

    monkeypatch.setattr(prune_bucket, "list_bucket", broken)
    with pytest.raises(RuntimeError):
        prune_bucket.run()
    _, text = _log(folder := pruning[2])
    assert "Stopped on an error:" in text and "RuntimeError: R2 refused the listing" in text
    assert folder.exists()


def test_an_empty_ledger_writes_no_log(pruning):
    _, ledger, folder = pruning
    ledger.write_text("[]")
    prune_bucket.run()
    assert not folder.exists()


def test_by_hand_the_log_is_named_by_the_time(pruning, monkeypatch):
    monkeypatch.delenv("SEED_RUN_ID")
    prune_bucket.run()
    name, _ = _log(pruning[2])
    assert name.startswith("prune-20") and len(name) == len("prune-YYYYMMDD-HHMMSS.log")

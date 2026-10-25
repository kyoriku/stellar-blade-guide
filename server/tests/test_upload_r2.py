"""upload_r2.py: only --overwrite replaces bytes at an existing URL, so only --overwrite purges
an image, and only the URLs it replaced. The bucket and Cloudflare are stand-ins."""

import pytest

from scripts.cache import purge_api_cache
from scripts.images import upload_r2

BASE = "https://img.example.test"
EXISTING = ["stellar-blade/collectibles/eidos-7/street/stellar-blade-1.webp",
            "stellar-blade/collectibles/eidos-7/street/stellar-blade-1-w640.webp"]
NEW = "stellar-blade/collectibles/eidos-7/street/stellar-blade-2.webp"


class _Bucket:
    def __init__(self, existing, failing=()):
        self.existing = list(existing)
        self.failing = set(failing)
        self.put = []

    def list_objects_v2(self, **_):
        return {"Contents": [{"Key": key} for key in self.existing], "IsTruncated": False}

    def put_object(self, Key, **_):
        if Key in self.failing:
            raise RuntimeError(f"upload of {Key} failed")
        self.put.append(Key)


@pytest.fixture
def staged(tmp_path, monkeypatch):
    for key in EXISTING + [NEW]:
        path = tmp_path / key
        path.parent.mkdir(parents=True, exist_ok=True)
        path.write_bytes(b"webp")
    monkeypatch.setattr(upload_r2, "STAGING_DIR", tmp_path)
    for name, value in [("R2_ACCOUNT_ID", "acct"), ("R2_ACCESS_KEY_ID", "key"),
                        ("R2_SECRET_ACCESS_KEY", "secret"), ("R2_BUCKET", "bucket"),
                        ("R2_PUBLIC_BASE_URL", BASE + "/"), ("CLOUDFLARE_ZONE_ID", "zone"),
                        ("CLOUDFLARE_API_TOKEN", "token")]:
        monkeypatch.setenv(name, value)
    purges = []     # one entry per call, so even an empty purge shows
    monkeypatch.setattr(purge_api_cache, "purge", lambda urls: purges.append(sorted(urls)) or len(urls))
    return purges


def _bucket(monkeypatch, **kwargs):
    bucket = _Bucket(EXISTING, **kwargs)
    monkeypatch.setattr(upload_r2, "get_client", lambda: bucket)
    return bucket


def test_overwrite_purges_exactly_the_urls_it_replaced(staged, monkeypatch):
    bucket = _bucket(monkeypatch)
    assert upload_r2.main(["--overwrite"], ask=lambda: "overwrite") == 0
    assert sorted(bucket.put) == sorted(EXISTING + [NEW])
    # The new object had no cached copy, so it isn't purged; nothing else is either.
    assert staged == [sorted(f"{BASE}/{key}" for key in EXISTING)]


def test_a_normal_upload_never_purges(staged, monkeypatch):
    """Nor needs Cloudflare's credentials: only --overwrite does."""
    monkeypatch.delenv("CLOUDFLARE_ZONE_ID")
    monkeypatch.delenv("CLOUDFLARE_API_TOKEN")
    bucket = _bucket(monkeypatch)
    assert upload_r2.main([], ask=lambda: "yes") == 0
    assert bucket.put == [NEW]          # existing keys are skipped
    assert staged == []


def test_overwrite_checks_the_cloudflare_credentials_before_uploading(staged, monkeypatch, capsys):
    monkeypatch.delenv("CLOUDFLARE_API_TOKEN")
    bucket = _bucket(monkeypatch)
    assert upload_r2.main(["--overwrite"], ask=lambda: "overwrite") == 1
    assert bucket.put == [] and staged == []
    assert "CLOUDFLARE_API_TOKEN" in capsys.readouterr().out


def test_a_failed_purge_fails_the_run_and_says_to_run_it_again(staged, monkeypatch, capsys):
    _bucket(monkeypatch)

    def refuse(urls):
        raise purge_api_cache.CloudflareRefused("batch 1 got HTTP 403 from Cloudflare")

    monkeypatch.setattr(purge_api_cache, "purge", refuse)
    assert upload_r2.main(["--overwrite"], ask=lambda: "overwrite") == 1
    assert "Run upload_r2.py --overwrite again" in capsys.readouterr().out


def test_replaced_urls_are_purged_even_when_an_upload_failed(staged, monkeypatch):
    """The client may see an error for a PUT that R2 applied; purging an unchanged object is
    harmless, missing a changed one isn't."""
    _bucket(monkeypatch, failing={EXISTING[0]})
    assert upload_r2.main(["--overwrite"], ask=lambda: "overwrite") == 1
    assert staged == [sorted(f"{BASE}/{key}" for key in EXISTING)]


def test_declining_uploads_and_purges_nothing_and_stops_the_workflow(staged, monkeypatch):
    """dev_workflow.py stops on this exit status, rather than swapping in R2 URLs for files
    that were never uploaded."""
    bucket = _bucket(monkeypatch)
    assert upload_r2.main(["--overwrite"], ask=lambda: "no") == upload_r2.EXIT_DECLINED == 3
    assert upload_r2.main([], ask=lambda: "y") == 3
    assert bucket.put == [] and staged == []


def test_nothing_new_to_upload_asks_nothing(staged, monkeypatch, capsys):
    """Every staged key is already in the bucket: there is nothing to confirm, so a run of the
    workflow for text-only edits isn't stopped by a prompt about zero files."""
    bucket = _Bucket(EXISTING + [NEW])
    monkeypatch.setattr(upload_r2, "get_client", lambda: bucket)

    def no_prompt():
        raise AssertionError("asked to confirm an empty upload")

    assert upload_r2.main([], ask=no_prompt) == 0
    assert bucket.put == [] and staged == []
    assert "Nothing new to upload" in capsys.readouterr().out

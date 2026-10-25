"""update_r2_urls.py's confirmation: a typed 'yes', the word upload_r2.py asks for, and nothing
to ask when there is nothing to swap. A decline exits 3, which stops dev_workflow.py before
it seeds dev with local paths that work on dev and break on prod."""

import ast
import json
from pathlib import Path

import pytest

from scripts.images import update_r2_urls

LOCAL = "/assets/images/Wasteland/Plant/Stellar Blade_20240524024153.jpg"
KEY = "stellar-blade/collectibles/wasteland/plant/stellar-blade-20240524024153"


class _Swap:
    def __init__(self, would_change):
        self.would_change = would_change
        self.applied = 0

    def dry(self):
        return self.would_change

    def apply(self):
        self.applied += 1
        return self.would_change


@pytest.mark.parametrize("answer", ["yes", "YES", " yes "])
def test_a_typed_yes_applies_the_swap(answer):
    swap = _Swap(3)
    assert update_r2_urls.run_with_confirm(swap.dry, swap.apply, ask=lambda: answer) == 0
    assert swap.applied == 1


@pytest.mark.parametrize("answer", ["y", "no", "", "yes please"])
def test_any_other_answer_applies_nothing_and_stops_the_workflow(answer, capsys):
    swap = _Swap(3)
    status = update_r2_urls.run_with_confirm(swap.dry, swap.apply, ask=lambda: answer)
    assert status == update_r2_urls.EXIT_DECLINED == 3
    assert swap.applied == 0
    assert "Exited without changes" in capsys.readouterr().out


def test_end_of_input_counts_as_declining():
    def closed():
        raise EOFError

    swap = _Swap(3)
    assert update_r2_urls.run_with_confirm(swap.dry, swap.apply, ask=closed) == 3
    assert swap.applied == 0


def test_nothing_to_swap_asks_nothing(capsys):
    def no_prompt():
        raise AssertionError("asked to confirm an empty swap")

    swap = _Swap(0)
    assert update_r2_urls.run_with_confirm(swap.dry, swap.apply, ask=no_prompt) == 0
    assert swap.applied == 0
    assert "Nothing to swap" in capsys.readouterr().out


def test_the_dry_run_counts_what_it_would_swap_and_changes_nothing(tmp_path, monkeypatch):
    """The count is what decides whether there is anything to ask about."""
    seed = tmp_path / "seed-data" / "collectibles" / "wasteland" / "plant.json"
    seed.parent.mkdir(parents=True)
    seed.write_text(json.dumps([{"id": 817, "images": [{"url": LOCAL}]}]), encoding="utf-8")
    staging = tmp_path / "r2-staging"
    (staging / KEY).parent.mkdir(parents=True)
    (staging / f"{KEY}.webp").write_bytes(b"webp")
    monkeypatch.setattr(update_r2_urls, "SEED_BASE", tmp_path / "seed-data")
    monkeypatch.setattr(update_r2_urls, "STAGING_DIR", staging)
    before = seed.read_text(encoding="utf-8")

    assert update_r2_urls.rewrite_seed(True, "collectibles") == 1
    assert seed.read_text(encoding="utf-8") == before
    assert update_r2_urls.rewrite_seed(False, "collectibles") == 1
    assert json.loads(seed.read_text(encoding="utf-8"))[0]["images"][0]["url"] == (
        f"{update_r2_urls.R2_BASE}/{KEY}.webp")
    assert update_r2_urls.rewrite_seed(True, "collectibles") == 0


def test_the_script_exits_with_the_confirmation_status():
    tree = ast.parse(Path(update_r2_urls.__file__).read_text(encoding="utf-8"))
    main = next(node for node in tree.body
                if isinstance(node, ast.If) and "__main__" in ast.unparse(node.test))
    assert "sys.exit(run_with_confirm(" in ast.unparse(main)

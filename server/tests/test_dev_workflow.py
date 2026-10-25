"""dev_workflow.py stops at a declined step, so the dev seed never runs on R2 URLs for files
that were never uploaded, or on local paths that work on dev and break on prod. Each step's
process is scripted."""

import subprocess
import sys
from pathlib import Path
from types import SimpleNamespace

from scripts import dev_workflow

SERVER = Path(dev_workflow.__file__).resolve().parents[1]


def _workflow(monkeypatch, exits):
    """Run the collectibles workflow with each step exiting as scripted (0 once they run out).
    Returns (exit status, the scripts that ran)."""
    ran = []

    def run(cmd, cwd=None):
        ran.append(next(part for part in cmd if part.endswith(".py")).rsplit("/", 1)[1])
        return subprocess.CompletedProcess(cmd, exits[len(ran) - 1] if len(ran) <= len(exits) else 0)

    monkeypatch.setattr(dev_workflow, "subprocess", SimpleNamespace(run=run))
    monkeypatch.setattr(sys, "argv", ["dev_workflow.py", "collectibles"])
    monkeypatch.chdir(SERVER)
    try:
        dev_workflow.main()
    except SystemExit as stopped:
        return stopped.code, ran
    return 0, ran


def test_a_declined_upload_stops_before_the_swap_and_the_seed(monkeypatch, capsys):
    code, ran = _workflow(monkeypatch, [0, dev_workflow.EXIT_DECLINED])
    assert code == 3
    assert ran == ["generate_variants.py", "upload_r2.py"]
    assert "You declined step 2, so nothing after it ran" in capsys.readouterr().out


def test_a_declined_swap_stops_before_the_dev_seed(monkeypatch, capsys):
    code, ran = _workflow(monkeypatch, [0, 0, 3])
    assert code == 3
    assert ran == ["generate_variants.py", "upload_r2.py", "update_r2_urls.py"]
    assert "You declined step 3" in capsys.readouterr().out


def test_a_failed_step_still_stops_as_a_failure(monkeypatch, capsys):
    code, ran = _workflow(monkeypatch, [0, 1])
    assert code == 1
    assert ran == ["generate_variants.py", "upload_r2.py"]
    out = capsys.readouterr().out
    assert "Workflow stopped at step 2" in out and "declined" not in out


def test_every_step_runs_when_each_succeeds(monkeypatch, capsys):
    code, ran = _workflow(monkeypatch, [0, 0, 0, 0])
    assert code == 0
    assert ran == ["generate_variants.py", "upload_r2.py", "update_r2_urls.py", "seed_collectibles.py"]
    assert "Collectibles workflow complete!" in capsys.readouterr().out

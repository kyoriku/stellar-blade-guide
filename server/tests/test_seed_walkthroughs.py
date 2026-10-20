"""
The walkthrough seeder's depth guard (scripts/db/seed_walkthroughs.py). The stored
search_vector reads at most MAX_DEPTH containers below a section key, so the seeder
refuses a file holding text any deeper, before anything is written, and prod_seed.py
runs that check before any seeder writes. The order of the scripts' steps is read from
their source; prod_seed.py is never imported.
"""
import ast
from pathlib import Path

from scripts.db import seed_walkthroughs

SCRIPTS = Path(__file__).resolve().parents[1] / "scripts"


def _function(tree, name):
    return next(node for node in ast.walk(tree)
                if isinstance(node, (ast.FunctionDef, ast.AsyncFunctionDef)) and node.name == name)


def _call_lines(node, name):
    """The line of every call to `name`, plain or as an attribute, under `node`."""
    return sorted(call.lineno for call in ast.walk(node) if isinstance(call, ast.Call)
                  and name in (getattr(call.func, "id", None), getattr(call.func, "attr", None)))


def test_check_depth_refuses_text_too_deep_to_index_and_names_it(capsys):
    fine = {"title": "Lost Device", "content": [{"order": 1, "text": "Grab it.", "fish": [{"spots": {"night": "Pier"}}]}]}
    deep = {"title": "Fishing Spots", "content": [{"order": 1, "fish": [{"spots": {"night": ["Pier"]}}]}]}

    assert seed_walkthroughs.check_depth([fine]) is True
    assert seed_walkthroughs.check_depth([fine, deep]) is False

    out = capsys.readouterr().out
    assert "Fishing Spots" in out and "content[0].fish[0].spots.night[0]" in out
    assert "Lost Device" not in out


def test_the_walkthrough_seeder_checks_depth_before_it_opens_the_database():
    tree = ast.parse((SCRIPTS / "db" / "seed_walkthroughs.py").read_text(encoding="utf-8"))
    seed = _function(tree, "seed_walkthroughs")
    checks, sessions = _call_lines(seed, "check_depth"), _call_lines(seed, "get_db")
    assert checks and sessions
    assert checks[0] < sessions[0]
    # --check runs the same check and nothing else: no session, no seeding.
    main = next(node for node in tree.body if isinstance(node, ast.If) and "__main__" in ast.unparse(node.test))
    check_mode = next(node for node in ast.walk(main) if isinstance(node, ast.If) and "--check" in ast.unparse(node.test))
    assert _call_lines(check_mode, "check_depth")
    assert not _call_lines(check_mode, "get_db") and not _call_lines(check_mode, "seed_walkthroughs")


def test_check_markers_refuses_a_file_still_marked_verify_and_names_it(capsys):
    clean = {"title": "Looking Glass", "content": [{"order": 1, "text": "Take the rod."}]}
    marked_text = {"title": "Fishing", "content": [{"order": 1, "text": "[VERIFY] Clyde sells it."}]}
    marked_field = {"title": "Fishing Spots", "objectives": ["[VERIFY] catch them"], "content": []}

    assert seed_walkthroughs.check_markers([clean]) is True
    assert seed_walkthroughs.check_markers([clean, marked_text, marked_field]) is False

    out = capsys.readouterr().out
    assert "Fishing:" in out and "Fishing Spots:" in out
    assert "Looking Glass" not in out


def test_only_check_mode_refuses_verify_markers():
    tree = ast.parse((SCRIPTS / "db" / "seed_walkthroughs.py").read_text(encoding="utf-8"))
    # Dev seeding keeps marked drafts so they show on the dev page.
    assert not _call_lines(_function(tree, "seed_walkthroughs"), "check_markers")
    main = next(node for node in tree.body if isinstance(node, ast.If) and "__main__" in ast.unparse(node.test))
    check_mode = next(node for node in ast.walk(main) if isinstance(node, ast.If) and "--check" in ast.unparse(node.test))
    assert _call_lines(check_mode, "check_markers") and _call_lines(check_mode, "check_depth")


def _prod_seed_steps():
    """The commands in prod_seed.py's STEPS, read from its source. The script is never
    imported: it reads its environment at import and exits without the PROD_* variables."""
    tree = ast.parse((SCRIPTS / "prod_seed.py").read_text(encoding="utf-8"))
    steps = next(node for node in tree.body if isinstance(node, ast.Assign)
                 and any(getattr(target, "id", None) == "STEPS" for target in node.targets))
    return [command for _label, command in ast.literal_eval(steps.value)]


def test_prod_seed_checks_the_walkthrough_files_before_any_seeder_writes():
    steps = _prod_seed_steps()
    check = next(i for i, command in enumerate(steps)
                 if "scripts/db/seed_walkthroughs.py" in command and "--check" in command)
    writes = [i for i, command in enumerate(steps) if "--check" not in command
              and any(arg.startswith("scripts/db/seed_") for arg in command)]
    assert any("scripts/db/seed_collectibles.py" in steps[i] for i in writes)
    assert check < min(writes)

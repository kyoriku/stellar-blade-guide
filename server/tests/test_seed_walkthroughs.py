"""
The walkthrough seeder's file checks (scripts/db/seed_walkthroughs.py). The stored
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
    checks, engines = _call_lines(seed, "check_depth"), _call_lines(seed, "seed_engine")
    assert checks and engines
    assert checks[0] < engines[0]
    # --check runs the same check and nothing else: no engine, no seeding.
    check_main = _function(tree, "check_main")
    assert _call_lines(check_main, "check_depth")
    assert not _call_lines(check_main, "seed_engine") and not _call_lines(check_main, "seed_walkthroughs")
    main = next(node for node in tree.body if isinstance(node, ast.If) and "__main__" in ast.unparse(node.test))
    check_mode = next(node for node in ast.walk(main) if isinstance(node, ast.If) and "--check" in ast.unparse(node.test))
    assert _call_lines(check_mode, "check_main") and not _call_lines(check_mode, "seed_walkthroughs")


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
    check_main = _function(tree, "check_main")
    assert _call_lines(check_main, "check_markers") and _call_lines(check_main, "check_depth")


def test_check_mode_refuses_a_local_image_path_and_names_the_walkthrough(tmp_path, monkeypatch, capsys):
    """Dev serves /assets/images/... and prod doesn't, so a path the URL swap never turned into
    an R2 URL stops prod_seed.py's first step. A dev seed still takes it, for the preview."""
    folder = tmp_path / "seed-data" / "walkthroughs" / "side-quests"
    folder.mkdir(parents=True)
    (folder / "1-a.json").write_text(
        '{"title": "Lost Ark", "thumbnail_url": "/assets/images/Walkthroughs/Side_Quests/Lost_Ark/a.jpg",'
        ' "content": [{"order": 1, "text": "Go."}]}', encoding="utf-8")
    monkeypatch.setattr(seed_walkthroughs, "project_root", tmp_path)
    assert seed_walkthroughs.check_main() == 1
    out = capsys.readouterr().out
    assert "✗ Lost Ark: 1 image path(s) still point at the local masters folder" in out
    assert "/assets/images/Walkthroughs/Side_Quests/Lost_Ark/a.jpg" in out
    tree = ast.parse((SCRIPTS / "db" / "seed_walkthroughs.py").read_text(encoding="utf-8"))
    assert not _call_lines(_function(tree, "seed_walkthroughs"), "check_local_paths")


def test_check_mode_fails_when_there_are_no_walkthrough_files(tmp_path, monkeypatch, capsys):
    """A missing or empty seed-data folder used to pass --check and then seed nothing."""
    monkeypatch.setattr(seed_walkthroughs, "project_root", tmp_path)
    assert seed_walkthroughs.check_main() == 1
    (tmp_path / "seed-data" / "walkthroughs").mkdir(parents=True)
    assert seed_walkthroughs.check_main() == 1
    assert "No walkthrough files found" in capsys.readouterr().out


def test_check_mode_passes_a_clean_file(tmp_path, monkeypatch):
    folder = tmp_path / "seed-data" / "walkthroughs" / "main-story"
    folder.mkdir(parents=True)
    (folder / "1-a.json").write_text('{"title": "A", "content": [{"order": 1, "text": "Go."}]}', encoding="utf-8")
    monkeypatch.setattr(seed_walkthroughs, "project_root", tmp_path)
    assert seed_walkthroughs.check_main() == 0


def test_every_walkthrough_whose_slug_changes_lets_go_of_it_first():
    """Slugs are unique and checked at once, so inside one transaction a swap or a chain of
    moves only works if every row that changes slug gives up its current one first."""
    current = {1: "a", 2: "b", 3: "c"}
    # 1 and 2 swap, 3 keeps its slug, 4 is new.
    assert seed_walkthroughs.slugs_to_move(current, {1: "b", 2: "a", 3: "c", 4: "d"}) == [1, 2]
    assert seed_walkthroughs.slugs_to_move(current, {1: "a", 2: "b", 3: "c"}) == []
    # A temporary slug can never be a real one, and never collides between rows.
    assert seed_walkthroughs.temporary_slug(1) != seed_walkthroughs.temporary_slug(2)
    assert seed_walkthroughs.temporary_slug(7).startswith("__")


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

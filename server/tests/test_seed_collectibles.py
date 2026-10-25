"""seed_collectibles.py --check, which prod_seed.py runs before any seeder writes. It reads only
the seed files, so it needs no database: a local image path works on dev and breaks on prod,
and this is where a prod seed refuses one."""

import ast
import json
from pathlib import Path

from scripts.db import seed_collectibles

SEEDER = Path(seed_collectibles.__file__)
R2_URL = "https://img.stellarbladeguide.com/stellar-blade/collectibles/wasteland/plant/a.webp"


def _seed(tmp_path, monkeypatch, entries):
    folder = tmp_path / "seed-data" / "collectibles" / "wasteland"
    folder.mkdir(parents=True)
    (folder / "plant.json").write_text(json.dumps(entries), encoding="utf-8")
    monkeypatch.setattr(seed_collectibles, "project_root", tmp_path)


def _entry(collectible_id, title, url):
    return {"id": collectible_id, "title": title, "level": "Wasteland", "location": "Plant",
            "types": ["Memorystick"], "description": {"type": "text", "content": "x"},
            "images": [{"url": url, "alt": title, "order": 1}]}


def test_check_mode_refuses_a_local_image_path_and_names_the_entry(tmp_path, monkeypatch, capsys):
    _seed(tmp_path, monkeypatch, [_entry(817, "Luke's Memory", "/assets/images/Wasteland/Plant/a.jpg"),
                                  _entry(818, "Go's Memory", R2_URL)])
    assert seed_collectibles.check_main() == 1
    out = capsys.readouterr().out
    assert ("✗ Luke's Memory [817]: 1 image path(s) still point at the local masters folder, "
            "such as /assets/images/Wasteland/Plant/a.jpg.") in out
    assert "[818]" not in out


def test_check_mode_passes_entries_the_url_swap_has_reached(tmp_path, monkeypatch):
    _seed(tmp_path, monkeypatch, [_entry(818, "Go's Memory", R2_URL)])
    assert seed_collectibles.check_main() == 0


def test_check_mode_fails_when_there_are_no_seed_files(tmp_path, monkeypatch, capsys):
    monkeypatch.setattr(seed_collectibles, "project_root", tmp_path)
    assert seed_collectibles.check_main() == 1
    assert "No seed data found!" in capsys.readouterr().out


def test_only_check_mode_refuses_local_paths():
    """A dev seed still takes them, so new images show on dev before the swap."""
    tree = ast.parse(SEEDER.read_text(encoding="utf-8"))
    seed = next(node for node in tree.body
                if isinstance(node, ast.AsyncFunctionDef) and node.name == "seed_database")
    assert "local_image_paths" not in ast.unparse(seed)
    main = next(node for node in tree.body
                if isinstance(node, ast.If) and "__main__" in ast.unparse(node.test))
    check = next(node for node in ast.walk(main)
                 if isinstance(node, ast.If) and "--check" in ast.unparse(node.test))
    assert "check_main()" in ast.unparse(check) and "seed_database" not in ast.unparse(check)

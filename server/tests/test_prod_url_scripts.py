"""The committed scripts that read prod besides prod_seed.py: search_eval.py, cache_stats.py
and purge_api_cache.py --singular-walkthroughs. Each checks that prod answers before the app
builds anything from its URL (a parser's error quotes the password, and a closed tunnel
should say so plainly), and shows URLs with check_connections.mask. Read from their source:
importing them would parse their flags and point the app at prod."""

import ast
from pathlib import Path

import pytest

SCRIPTS = Path(__file__).resolve().parents[1] / "scripts"
OLD_MASK = "//([^:/@]+):[^@]*@"     # the regex every script used to carry: it leaked passwords


def _tree(rel):
    return ast.parse((SCRIPTS / rel).read_text(encoding="utf-8"))


def _app_imports(node):
    return [n for n in ast.walk(node)
            if isinstance(n, ast.ImportFrom) and (n.module or "").split(".")[0] == "app"]


def _require_calls(node):
    return [n for n in ast.walk(node) if isinstance(n, ast.Call)
            and isinstance(n.func, ast.Attribute) and n.func.attr == "require"]


@pytest.mark.parametrize("rel,names", [("search_eval.py", ["Postgres"]),
                                       ("cache/cache_stats.py", ["Redis"])])
def test_the_check_comes_before_anything_from_the_app(rel, names):
    tree = _tree(rel)
    [call] = _require_calls(tree)
    assert ast.literal_eval(call.args[0]) == names
    assert call.lineno < min(n.lineno for n in _app_imports(tree))
    branch = next(n for n in tree.body if isinstance(n, ast.If)
                  and any(c is call for c in ast.walk(n)))
    assert "prod" in ast.unparse(branch.test).lower()


def test_the_singular_purge_checks_prod_before_the_app_import():
    main = next(n for n in _tree("cache/purge_api_cache.py").body
                if isinstance(n, ast.FunctionDef) and n.name == "main")
    [call] = _require_calls(main)
    assert ast.literal_eval(call.args[0]) == ["Postgres"]
    assert call.lineno < min(n.lineno for n in _app_imports(main))
    branch = next(n for n in ast.walk(main) if isinstance(n, ast.If)
                  and any(c is call for c in ast.walk(n)))
    assert ast.unparse(branch.test) == "singular"


@pytest.mark.parametrize("rel", ["search_eval.py", "cache/cache_stats.py", "cache/purge_api_cache.py"])
def test_no_script_keeps_a_mask_of_its_own(rel):
    source = (SCRIPTS / rel).read_text(encoding="utf-8")
    assert OLD_MASK not in source
    assert not any(isinstance(n, ast.FunctionDef) and n.name == "_mask" for n in ast.walk(ast.parse(source)))
    assert "cc.mask(" in source


def test_search_eval_takes_no_abbreviated_flags():
    """argparse would otherwise read --pro, or --p, as --prod."""
    parsers = [n for n in ast.walk(_tree("search_eval.py")) if isinstance(n, ast.Call)
               and ast.unparse(n.func).endswith("ArgumentParser")]
    assert parsers
    for parser in parsers:
        assert any(k.arg == "allow_abbrev" and k.value.value is False for k in parser.keywords)


def test_search_eval_reads_prod_under_a_watchdog():
    """Through a tunnel that freezes, a statement's cleanup can wait for good
    (scripts/db/seed_guard.py), so --prod reads through the scripts' own engine and its
    watchdog ends the run with the plain message."""
    tree = _tree("search_eval.py")
    prod_blocks = [n for n in tree.body if isinstance(n, ast.If) and ast.unparse(n.test) == "ARGS.prod"]
    text = "\n".join(ast.unparse(block) for block in prod_blocks)
    assert "engine = seed_engine('search_eval')" in text
    assert "AsyncSessionLocal = seed_sessionmaker(engine)" in text
    assert "watch_engine(engine, WATCHDOG)" in text
    # Its os._exit drops anything still buffered: every line must already be out.
    assert "sys.stdout.reconfigure(line_buffering=True)" in text
    main = next(n for n in tree.body if isinstance(n, ast.AsyncFunctionDef) and n.name == "main")
    assert "WATCHDOG.start()" in ast.unparse(main) and "WATCHDOG.stop()" in ast.unparse(main)

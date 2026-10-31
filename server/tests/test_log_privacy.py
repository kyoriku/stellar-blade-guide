"""What no log line may hold, read from the source (app/**/*.py).

Railway keeps every line the server writes for 90 days and can't delete or redact one
early. Every logging call, every print, and every request.state field the access line
prints is read here, so a line no test reaches is covered too; the conftest log guard
checks the lines the suite runs.
- None may mention anything called `email` or `username`: a line that needs to name an
  account uses its number.
- None may print an exception's own text. An exception reaches a line only through
  exc_text or exc_frames (or as type(e)), which clean it, cap it and never quote a
  database or validation error's values; exc_info and logger.exception print the raw
  text, so neither is used.
"""

import ast
from pathlib import Path

APP = Path(__file__).resolve().parents[1] / "app"
LOG_METHODS = {"debug", "info", "warning", "warn", "error", "exception", "critical", "log"}
# Set on request.state by a handler or a layer and printed on the access line.
ACCESS_LINE_FIELDS = {"reject_reason", "auth_fail_reason", "search_query", "search_corrected"}
# What no line may name, in an attribute, a variable or a dict key.
PERSONAL = ("email", "username")


def _names_a_person(node: ast.AST) -> bool:
    for child in ast.walk(node):
        if isinstance(child, ast.Attribute) and any(word in child.attr.lower() for word in PERSONAL):
            return True
        if isinstance(child, ast.Name) and any(word in child.id.lower() for word in PERSONAL):
            return True
        if isinstance(child, ast.Constant) and child.value in PERSONAL:  # info["email"]
            return True
    return False


def _log_sites(tree: ast.AST):
    for node in ast.walk(tree):
        if isinstance(node, ast.Call):
            func = node.func
            if (isinstance(func, ast.Attribute) and func.attr in LOG_METHODS) or (
                isinstance(func, ast.Name) and func.id == "print"
            ):
                yield node
        elif isinstance(node, ast.Assign) and any(
            isinstance(target, ast.Attribute) and target.attr in ACCESS_LINE_FIELDS for target in node.targets
        ):
            yield node


def _parents(tree: ast.AST) -> dict:
    return {child: node for node in ast.walk(tree) for child in ast.iter_child_nodes(node)}


ALLOWED_WRAPPERS = {"exc_text", "exc_frames", "type"}


def _raw_exceptions(tree: ast.AST) -> list:
    """Log sites that print an exception other than through an allowed wrapper."""
    caught = {node.name for node in ast.walk(tree) if isinstance(node, ast.ExceptHandler) and node.name}
    parents = _parents(tree)
    found = []
    for site in _log_sites(tree):
        if isinstance(site, ast.Call) and (
            any(keyword.arg == "exc_info" for keyword in site.keywords)
            or (isinstance(site.func, ast.Attribute) and site.func.attr == "exception")
        ):
            found.append(site)
            continue
        for node in ast.walk(site):
            if isinstance(node, ast.Name) and node.id in caught:
                parent = parents.get(node)
                wrapped = (
                    isinstance(parent, ast.Call) and isinstance(parent.func, ast.Name)
                    and parent.func.id in ALLOWED_WRAPPERS and node in parent.args
                )
                if not wrapped:
                    found.append(site)
                    break
    return found


def test_no_log_line_prints_an_exceptions_raw_text():
    found = [
        f"{path.relative_to(APP.parent)}:{site.lineno}"
        for path in sorted(APP.rglob("*.py"))
        for site in _raw_exceptions(ast.parse(path.read_text(encoding="utf-8"), filename=str(path)))
    ]
    assert found == []


def test_no_log_line_names_an_email_or_a_username():
    found = [
        f"{path.relative_to(APP.parent)}:{site.lineno}"
        for path in sorted(APP.rglob("*.py"))
        for site in _log_sites(ast.parse(path.read_text(encoding="utf-8"), filename=str(path)))
        if _names_a_person(site)
    ]
    assert found == []

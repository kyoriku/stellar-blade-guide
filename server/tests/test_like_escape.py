"""
Pure tests for escape_like (app/db/database.py), the helper every ILIKE fallback
runs its URL-derived pattern through. Pairing it with .ilike(..., escape=LIKE_ESCAPE)
is what makes `%` and `_` in a slug match literally instead of acting as wildcards.
"""

from app.db.database import LIKE_ESCAPE, escape_like


def test_escape_char_is_a_single_backslash():
    # Both dialects in play render `ESCAPE '\'`; a multi-char escape is a SQL error.
    assert LIKE_ESCAPE == "\\"
    assert len(LIKE_ESCAPE) == 1


def test_plain_text_passes_through():
    assert escape_like("Eidos 7") == "Eidos 7"
    assert escape_like("") == ""


def test_percent_is_escaped():
    assert escape_like("%") == "\\%"
    assert escape_like("%25") == "\\%25"


def test_underscore_is_escaped():
    assert escape_like("eidos_7") == "eidos\\_7"


def test_backslash_is_escaped_before_the_metachars():
    # A literal backslash must not be left free to escape the `%` we add next.
    assert escape_like("\\") == "\\\\"
    assert escape_like("\\%") == "\\\\\\%"


def test_mixed_input():
    assert escape_like("a%b_c\\d") == "a\\%b\\_c\\\\d"

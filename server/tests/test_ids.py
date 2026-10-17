"""The one check for client-supplied row ids (app/core/ids.py)."""

from app.core.ids import INT4_MAX, is_row_id


def test_row_ids_are_the_positive_int4_range():
    assert INT4_MAX == 2**31 - 1
    cases = [-1, 0, 1, INT4_MAX, INT4_MAX + 1, 2**63]
    assert [is_row_id(i) for i in cases] == [False, False, True, True, False, False]

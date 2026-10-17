"""Row ids the database can hold."""

# Every table's id, and every column that refers to one, is integer (int4). A larger
# value names no row, and asyncpg refuses to bind one to an int4 parameter, so a query
# that took it would fail. A route answers such an id the way it answers one it
# doesn't know, before any query.
INT4_MAX = 2**31 - 1


def is_row_id(value: int) -> bool:
    """True for a value some row's id could be: 1 up to int4's maximum."""
    return 0 < value <= INT4_MAX

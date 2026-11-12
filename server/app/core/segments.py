"""URL path segments that could name something stored."""


def is_text_segment(value: str) -> bool:
    """False for a segment no level, type, walkthrough or page name could match.

    Postgres refuses a NUL in a text parameter, so a lookup that binds one fails,
    and os.path.realpath raises on one. No stored name holds a control character
    either, so callers answer such a segment with a 404 before any lookup. The path
    guard (app/middleware/path_guard.py) checks the whole path before any route."""
    return value.isprintable()

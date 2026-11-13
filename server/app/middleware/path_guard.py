"""Answers a request whose path isn't printable text, before any layer below reads it.

The layers read request.url.path, which urlsplit rebuilds without tab, CR or LF, while
the router matches the decoded path itself: a newline inside it misses the SPA catch-all,
and a trailing one is ignored by the catch-all and by every route ending in literal text
(an id parameter strips it too). No page, file or API route is named with a character
that isn't printable text, so the request is refused here, as the router would see it.
"""
from fastapi import Request

from app.core.segments import is_text_segment
from app.middleware.not_found import refusal


async def path_guard_middleware(request: Request, call_next):
    # No DEBUG bypass, unlike its neighbours: the router misreads these paths in dev too.
    path = request.scope["path"]
    if is_text_segment(path):
        return await call_next(request)
    request.state.reject_reason = "unprintable-path"
    return await refusal(request, {"detail": "Not Found"})


def add_path_guard_middleware(app):
    app.middleware("http")(path_guard_middleware)

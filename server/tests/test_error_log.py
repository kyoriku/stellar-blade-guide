"""What error_handler's 500 record holds (app/middleware/error_handler.py).

Railway keeps every line for 90 days and can't delete one early. The record carries
the frames, so it still says where a failure happened, and names each exception in
the chain by exc_text (app/core/logging.py): an exception's own text is cleaned and
capped, a validation error gives only where each check failed, and a database
error's text never appears (test_db_data_errors.py).
"""

from __future__ import annotations

import logging

from fastapi import FastAPI
from httpx import AsyncClient, ASGITransport
from pydantic import BaseModel

from app.core.logging import exc_frames
from app.middleware.error_handler import add_error_handler_middleware

ANSI_PROBE = "\x1b[2J"  # a sequence the colours module never writes


class _Profile(BaseModel):
    id: int
    username: str


def _error_handler_app():
    app = FastAPI()
    add_error_handler_middleware(app)

    @app.get("/api/echo/{rest:path}")
    async def _echo(rest: str):
        # An exception whose text echoes the request, as urlparse's did for a Referer.
        raise RuntimeError("bad segment: " + rest)

    @app.get("/api/profile", response_model=_Profile)
    async def _profile():
        # A response that doesn't fit its model: a list where one profile belongs.
        return [{"id": 7, "username": "profile-MARKER"}]

    return app


async def test_an_unhandled_error_never_logs_its_text_raw(caplog):
    """The 500's record carries its frames; each exception in them is named by its
    class and its text, cleaned like any field copied from a request."""
    caplog.set_level(logging.WARNING, logger="app.middleware.error_handler")
    async with AsyncClient(transport=ASGITransport(_error_handler_app()), base_url="http://test") as c:
        r = await c.get("/api/echo/a%1B%5B2Jb%E2%80%A8jane@example.com")
    assert r.status_code == 500
    (record,) = caplog.records
    written = logging.Formatter("%(message)s").format(record)
    cleaned = "RuntimeError: bad segment: a\\x1b[2Jb\\u2028[email]"
    assert written.startswith(f"Unhandled error: {cleaned} on GET /api/echo/a\\x1b[2Jb\\u2028[email]\n")
    assert ", in _echo\n" in written  # the frames still say where it failed
    assert written.endswith("\n" + cleaned)
    assert ANSI_PROBE not in written and chr(0x2028) not in written and "jane" not in written


async def test_a_validation_error_logs_where_it_failed_never_the_data(caplog):
    """A validation error's text quotes the data it checked, here a response holding a
    username. The record names where each check failed and how, never the value."""
    caplog.set_level(logging.WARNING, logger="app.middleware.error_handler")
    async with AsyncClient(transport=ASGITransport(_error_handler_app()), base_url="http://test") as c:
        r = await c.get("/api/profile")
    assert r.status_code == 500
    (record,) = caplog.records
    written = logging.Formatter("%(message)s").format(record)
    first, frames = written.split("\n", 1)
    assert first == "Unhandled error: ResponseValidationError (1 error: response model_attributes_type) on GET /api/profile"
    assert frames.startswith("Traceback (most recent call last):\n")
    assert "MARKER" not in written


class _Falsy(Exception):
    """An exception whose truth value is False, as one defining __len__ can be."""

    def __len__(self):
        return 0


def test_the_frames_say_how_each_exception_led_to_the_next():
    """Python's own lines between the links, so the record still says which exception
    caused which and which was raised while handling another. A cause is followed
    even when the exception itself is falsy."""
    try:
        try:
            try:
                raise _Falsy("first")
            except _Falsy as first:
                raise KeyError("second") from first
        except KeyError:
            raise RuntimeError("third")
    except RuntimeError as third:
        written = exc_frames(third)

    links = written.split("\n\n")
    assert [part for part in links if not part.startswith("Traceback")] == [
        "The above exception was the direct cause of the following exception:",
        "During handling of the above exception, another exception occurred:",
    ]
    assert written.count("Traceback (most recent call last):") == 3
    assert written.index("_Falsy: first") < written.index("KeyError: 'second'") < written.index("RuntimeError: third")

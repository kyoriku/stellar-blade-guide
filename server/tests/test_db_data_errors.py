"""
The backstop for a value the database refuses (app/middleware/error_handler.py).

Every known bad value has a guard of its own, such as the comment body check
(schemas/comments.py), the int4 id check (core/ids.py) and the path segment check
(core/segments.py). The backstop is for the one nobody has found yet, so it is tested on
a route that has no guard at all.

SQLite raises none of these errors (it stores a NUL, binds any id up to int8, raising a
plain OverflowError only from 2**63, and raises a plain UnicodeEncodeError for a lone
surrogate), so the stand-in database raises what the dev Postgres did, translated by
SQLAlchemy's own asyncpg dialect. There (2026-10-17, SQLAlchemy 2.0.44, asyncpg 0.30.0;
again 2026-10-24, SQLAlchemy 2.0.45, asyncpg 0.31.0)
all three arrived as a plain DBAPIError, never sqlalchemy.exc.DataError, whose orig
carries an SQLSTATE in class 22.
"""

from __future__ import annotations

import json
import logging
from types import SimpleNamespace

import asyncpg
import pytest
from fastapi import Depends, FastAPI
from httpx import AsyncClient, ASGITransport
from pydantic import BaseModel
from sqlalchemy import select
from sqlalchemy.dialects.postgresql.asyncpg import AsyncAdapt_asyncpg_connection, PGDialect_asyncpg
from sqlalchemy.exc import DataError, DBAPIError

import app.middleware.error_handler as error_handler
from app.db.database import get_db
from app.middleware.error_handler import add_error_handler_middleware
from app.models.collectibles import Level


def _as_raised_through_asyncpg(error: Exception) -> DBAPIError:
    """An asyncpg error as a query raises it: translated by SQLAlchemy's asyncpg dialect
    itself, then wrapped the way the engine wraps it."""
    dialect = PGDialect_asyncpg()
    dbapi = dialect.import_dbapi()
    connection = AsyncAdapt_asyncpg_connection(dbapi, SimpleNamespace(is_closed=lambda: False))
    try:
        connection._handle_exception(error)
    except dbapi.Error as translated:
        return DBAPIError.instance("SELECT 1", {}, translated, dbapi.Error, dialect=dialect)
    raise AssertionError("the dialect did not translate the error")


def _bind_error(message: str, cause: Exception) -> asyncpg.exceptions.DataError:
    # asyncpg refuses a value it cannot encode before the query is sent.
    error = asyncpg.exceptions.DataError(f"invalid input for query argument $1 ({message})")
    error.__cause__ = cause
    return error


# The three known cases: the value each one sends, and what the dev Postgres raised for it.
KNOWN_CASES = {
    "nul": ("a" + chr(0) + "b", "22021",
            asyncpg.exceptions.CharacterNotInRepertoireError('invalid byte sequence for encoding "UTF8": 0x00')),
    "int4": (2**31, "22000",
             _bind_error("value out of int32 range", OverflowError("value out of int32 range"))),
    "surrogate": ("a" + chr(0xD800) + "b", "22000",
                  _bind_error("surrogates not allowed", UnicodeEncodeError("utf-8", "a" + chr(0xD800), 1, 2, "surrogates not allowed"))),
}

# Errors that are not a request's bad value: class-22 codes the site's own SQL raises,
# asyncpg refusing a value of the wrong type (only the site binds one), and the other
# classes. All of them must stay 500s.
NOT_BAD_VALUES = {
    "wrong-type": _bind_error("'str' object cannot be interpreted as an integer",
                              TypeError("'str' object cannot be interpreted as an integer")),
    "sequence-exhausted": asyncpg.exceptions.SequenceGeneratorLimitExceededError(
        'nextval: reached maximum value of sequence "user_progress_id_seq" (2147483647)'),
    "overflow": asyncpg.exceptions.NumericValueOutOfRangeError("integer out of range"),
    "division-by-zero": asyncpg.exceptions.DivisionByZeroError("division by zero"),
    "unique-violation": asyncpg.exceptions.UniqueViolationError(
        'duplicate key value violates unique constraint "uq_user_collectible"'),
    "undefined-column": asyncpg.exceptions.UndefinedColumnError('column "no_such_column" does not exist'),
    "connection-gone": asyncpg.exceptions.ConnectionDoesNotExistError("connection was closed in the middle of operation"),
}


class _Probe(BaseModel):
    value: str | int


def _make_app(error: Exception, seen: dict) -> FastAPI:
    app = FastAPI()
    add_error_handler_middleware(app)

    @app.middleware("http")  # outermost, where the access log reads the reason
    async def record_reason(request, call_next):
        response = await call_next(request)
        seen["reject_reason"] = getattr(request.state, "reject_reason", None)
        return response

    class _Database:
        """Stands in for the session, refusing the query as Postgres did."""

        async def execute(self, statement):
            raise _as_raised_through_asyncpg(error)

    async def override_get_db():
        yield _Database()

    app.dependency_overrides[get_db] = override_get_db

    @app.post("/api/unguarded")
    async def unguarded(body: _Probe, db=Depends(get_db)):
        # No guard of any kind: the client's value goes straight into the query.
        await db.execute(select(Level.id).where(Level.name == body.value))
        return {"ok": True}

    return app


async def _post(error: Exception, value):
    seen = {}
    async with AsyncClient(transport=ASGITransport(_make_app(error, seen)), base_url="http://test") as c:
        # Built by hand: json.dumps writes a lone surrogate as an ASCII escape, as a
        # browser's JSON.stringify does, where the test client's json= might not.
        r = await c.post("/api/unguarded", headers={"Content-Type": "application/json"},
                         content=json.dumps({"value": value}))
    return r, seen


def test_the_known_cases_arrive_as_a_plain_dbapi_error_with_a_class_22_code():
    # Why the backstop reads the code: through asyncpg, none of the three is a DataError.
    for value, sqlstate, error in KNOWN_CASES.values():
        raised = _as_raised_through_asyncpg(error)
        assert type(raised) is DBAPIError
        assert not isinstance(raised, DataError)
        assert raised.orig.sqlstate == sqlstate
        assert raised.orig.__cause__ is error


@pytest.mark.parametrize("case", KNOWN_CASES)
async def test_a_bad_value_on_an_unguarded_route_is_a_400(case, caplog):
    value, sqlstate, error = KNOWN_CASES[case]
    caplog.set_level(logging.WARNING, logger=error_handler.logger.name)

    r, seen = await _post(error, value)

    assert r.status_code == 400
    assert r.json() == {"detail": "Some of the information you entered is invalid."}
    assert seen["reject_reason"] == "db-data-error"
    lines = [(rec.levelno, rec.getMessage()) for rec in caplog.records]
    assert lines == [(logging.WARNING, f"Database refused a value ({sqlstate}): POST /api/unguarded")]
    # Never the driver's message: asyncpg's quotes the value that was refused.
    assert not any(str(error) in rec.getMessage() or str(error) in (rec.exc_text or "") for rec in caplog.records)


@pytest.mark.parametrize("case", NOT_BAD_VALUES)
async def test_a_database_error_that_is_not_a_bad_value_stays_a_500(case, caplog):
    caplog.set_level(logging.WARNING, logger=error_handler.logger.name)

    r, seen = await _post(NOT_BAD_VALUES[case], "ok")

    assert r.status_code == 500
    assert r.json()["error"] == "Internal server error"
    assert seen["reject_reason"] is None
    assert [(rec.levelno, rec.getMessage().split(":")[0]) for rec in caplog.records] == [
        (logging.ERROR, "Unhandled error")
    ]


async def test_a_unique_violation_never_logs_the_key_it_names(caplog):
    """Postgres names the duplicate key in a unique violation's DETAIL, and asyncpg puts
    the DETAIL in the error's text: an email address when two sign-ups race for one.
    The 500 is logged by class, SQLSTATE and constraint, with its frames, and never with
    that text, in the message or in a traceback."""
    error = asyncpg.exceptions.PostgresError.new({  # built the way asyncpg builds a server error
        "C": "23505",
        "M": 'duplicate key value violates unique constraint "ix_users_email"',
        "D": "Key (email)=(racer-MARKER@example.com) already exists.",
        "s": "public", "t": "users", "n": "ix_users_email",
    })
    assert type(error) is asyncpg.exceptions.UniqueViolationError
    assert "racer-MARKER@example.com" in str(error)  # the hazard is real, so the check below bites
    caplog.set_level(logging.WARNING, logger=error_handler.logger.name)

    r, _ = await _post(error, "ok")

    assert r.status_code == 500
    (record,) = caplog.records
    written = logging.Formatter("%(message)s").format(record)  # with any traceback, as production writes it
    assert "MARKER" not in written
    first, frames = written.split("\n", 1)
    assert first == "Unhandled error: IntegrityError (SQLSTATE 23505, constraint ix_users_email) on POST /api/unguarded"
    # Where it failed is still logged: the frames, down to the route that ran the query.
    assert frames.startswith("Traceback (most recent call last):\n")
    assert ", in unguarded\n" in frames
    # And the SQL it ran, which holds placeholders only: every value is bound.
    assert written.endswith("\nSQL: SELECT 1")


async def test_a_client_side_database_error_keeps_its_text(caplog):
    """An error with no SQLSTATE is asyncpg's own, about the connection or the call, and
    its text holds no value, so the record keeps it: without it, a busy connection, a
    closed one and a wrong argument count would all read the same."""
    error = asyncpg.exceptions.InterfaceError("cannot perform operation: another operation is in progress")
    caplog.set_level(logging.WARNING, logger=error_handler.logger.name)

    r, _ = await _post(error, "ok")

    assert r.status_code == 500
    (record,) = caplog.records
    assert record.getMessage().split("\n", 1)[0] == (
        "Unhandled error: InterfaceError (SQLSTATE -: cannot perform operation: another operation is in progress)"
        " on POST /api/unguarded"
    )


async def test_an_argument_asyncpg_cannot_encode_never_shows_its_value(caplog):
    """asyncpg's error for an argument it can't encode quotes the value, and carries
    SQLSTATE 22000, so the record names it by class and code only."""
    error = _bind_error("'value-MARKER': expected int, got str", TypeError("expected int, got str"))
    assert "value-MARKER" in str(error)  # the hazard is real, so the check below bites
    caplog.set_level(logging.WARNING, logger=error_handler.logger.name)

    r, _ = await _post(error, "ok")

    assert r.status_code == 500
    (record,) = caplog.records
    written = logging.Formatter("%(message)s").format(record)
    assert written.split("\n", 1)[0] == "Unhandled error: DBAPIError (SQLSTATE 22000) on POST /api/unguarded"
    assert "MARKER" not in written

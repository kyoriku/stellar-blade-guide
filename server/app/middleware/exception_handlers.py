"""Custom FastAPI exception handlers.

Registered on both the production app (main.py) and the test apps via
add_exception_handlers(), so error response shapes match what tests assert.
"""
from fastapi import FastAPI, Request
from fastapi.exceptions import RequestValidationError
from fastapi.responses import JSONResponse


async def validation_exception_handler(request: Request, exc: RequestValidationError):
    """Flatten FastAPI's verbose 422 (which echoes loc/input/type) into one
    clean, friendly string. Custom Pydantic validators prefix their messages
    with 'Value error, ' — strip it so users see plain text."""
    messages = []
    for err in exc.errors():
        msg = str(err.get("msg", "")).replace("Value error, ", "")
        if msg:
            messages.append(msg)
    detail = "; ".join(messages) if messages else "Some of the information you entered is invalid."
    return JSONResponse(status_code=422, content={"detail": detail})


def add_exception_handlers(app: FastAPI) -> None:
    app.add_exception_handler(RequestValidationError, validation_exception_handler)

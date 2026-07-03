# Temporary compatibility shim for the app/ layout migration: keeps the old
# `uvicorn main:app` target working (e.g. a Railway dashboard start-command
# override) for one deploy cycle. Delete once production runs app.main:app.
from app.main import app  # noqa: F401

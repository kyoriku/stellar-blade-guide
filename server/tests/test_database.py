"""The engine leaves SQL parameters out of errors and logs unless DEBUG is on.

app.db.database builds its engine at import, so each DEBUG value needs a fresh
interpreter: reloading the module here would also mint a new declarative Base, one
the models are not bound to.
"""

import os
import subprocess
import sys
from pathlib import Path

import pytest

SERVER = Path(__file__).resolve().parents[1]
PROBE = "from app.db.database import engine; print(engine.sync_engine.hide_parameters)"


@pytest.mark.parametrize(("debug", "hidden"), [("true", "False"), ("false", "True")])
def test_engine_hides_parameters_unless_debug(debug, hidden):
    env = {
        **os.environ,
        "DEBUG": debug,
        # Building the engine never connects, so the target only has to parse.
        "DATABASE_URL": "postgresql+asyncpg://probe:probe@localhost:5432/probe",
    }
    probe = subprocess.run(
        [sys.executable, "-c", PROBE],
        cwd=SERVER, env=env, capture_output=True, text=True, timeout=60,
    )
    assert probe.returncode == 0, probe.stderr
    assert probe.stdout.strip() == hidden

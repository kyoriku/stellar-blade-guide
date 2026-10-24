"""The app never redirects a trailing slash.

Starlette's slash redirect answers with an absolute Location built from the request
scheme, which is http now that production trusts no proxy headers (test_proxy_trust.py).
This imports app.main in a fresh interpreter, because settings are read at import; its
env is built from scratch, as in test_settings.py.
"""

import json
import os
import subprocess
import sys
from pathlib import Path

SERVER = Path(__file__).resolve().parents[1]

# An encoded newline: Python's "." stops at a newline, so the SPA catch-all misses this
# path while a path parameter ([^/]+) takes it. That made it the one request that
# reached the slash redirect.
PROBE = """
import asyncio, json, httpx
from app.main import app

async def probe():
    transport = httpx.ASGITransport(app=app)
    async with httpx.AsyncClient(transport=transport, base_url="http://localhost") as client:
        response = await client.get("/api/walkthroughs/a%0Ab/")
    print("RESULT", json.dumps([response.status_code, response.headers.get("location")]))

asyncio.run(probe())
"""


def test_the_app_never_redirects_a_trailing_slash(tmp_path):
    env = {
        "PATH": os.environ["PATH"],
        "PYTHONPATH": str(SERVER),
        "PYTHON_DOTENV_DISABLED": "1",
        # DEBUG steps the origin and bot checks aside, and development allows it.
        "ENVIRONMENT": "development",
        "DEBUG": "true",
        # Read at import; nothing connects.
        "DATABASE_URL": "postgresql+asyncpg://probe:probe@localhost:5432/probe",
        "JWT_SECRET_KEY": "probe-secret-not-used",
        "OPENAI_API_KEY": "probe-openai-key",
    }
    result = subprocess.run(
        [sys.executable, "-c", PROBE],
        cwd=tmp_path,
        env=env,
        capture_output=True,
        text=True,
        timeout=60,
    )
    assert result.returncode == 0, result.stderr
    (line,) = [out for out in result.stdout.splitlines() if out.startswith("RESULT ")]
    status, location = json.loads(line.removeprefix("RESULT "))
    assert (status, location) == (404, None)

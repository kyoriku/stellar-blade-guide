"""Production trusts no proxy headers, and uvicorn logs no query string of its own.

Railway runs the Dockerfile's start command (it has no custom one), so these tests parse
that command the way uvicorn does, with every variable set that could turn either back on.
"""

import json
import shlex
from pathlib import Path

from uvicorn.config import Config
from uvicorn.main import main as uvicorn_main
from uvicorn.middleware.proxy_headers import ProxyHeadersMiddleware

DOCKERFILE = Path(__file__).resolve().parents[2] / "Dockerfile"


def _start_command_args():
    """The arguments the Dockerfile's CMD passes to uvicorn, once sh fills in the port."""
    (cmd,) = [line for line in DOCKERFILE.read_text().splitlines() if line.startswith("CMD ")]
    shell, flag, script = json.loads(cmd.removeprefix("CMD "))
    assert (shell, flag) == ("/bin/sh", "-c")
    words = shlex.split(script.replace("${PORT:-8000}", "8000").replace("$PORT", "8000"))
    assert words[0] == "exec"  # uvicorn replaces the shell as PID 1, so it gets SIGTERM
    program, *args = words[1:]
    assert program.endswith("/uvicorn")
    return args


async def _stand_in_app(scope, receive, send):
    # Config.load() would import app.main:app; any ASGI app shows what wraps it.
    pass


def test_production_start_command_trusts_no_proxy_headers(monkeypatch):
    # Each of these turns trust on when the command leaves it to the environment.
    monkeypatch.setenv("FORWARDED_ALLOW_IPS", "*")
    monkeypatch.setenv("UVICORN_FORWARDED_ALLOW_IPS", "*")
    monkeypatch.setenv("UVICORN_PROXY_HEADERS", "true")
    params = uvicorn_main.make_context("uvicorn", _start_command_args()).params
    assert params["app"] == "app.main:app"
    assert params["proxy_headers"] is False
    # What uvicorn builds from them: no proxy-headers layer around the app. ws="none"
    # skips loading the websockets library, which only adds its deprecation warnings.
    config = Config(
        _stand_in_app,
        proxy_headers=params["proxy_headers"],
        forwarded_allow_ips=params["forwarded_allow_ips"],
        ws="none",
        log_config=None,
    )
    config.load()
    assert not isinstance(config.loaded_app, ProxyHeadersMiddleware)


def test_production_start_command_logs_no_query_string(monkeypatch):
    # uvicorn's WebSocket handshake line and its access line each write the request's
    # query string as sent, outside the app's cleaning. These turn them back on when the
    # command leaves them to the environment.
    monkeypatch.setenv("UVICORN_WS", "auto")
    monkeypatch.setenv("UVICORN_ACCESS_LOG", "true")
    params = uvicorn_main.make_context("uvicorn", _start_command_args()).params
    assert params["ws"] == "none"  # no route takes a WebSocket
    assert params["access_log"] is False  # the app writes its own (app/middleware/logging.py)

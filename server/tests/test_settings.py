"""Unset means production: what prod's env no longer sets comes from the code defaults.

app/config/settings.py reads the environment once, at import, so each case runs in a
fresh interpreter. Its env is built from scratch rather than copied: by now the suite's
own os.environ holds conftest's forced ENVIRONMENT=development and, in the dev container,
everything server/.env sets (settings.py loaded it at conftest's first app import).
PYTHON_DOTENV_DISABLED stops the child loading server/.env itself, and it runs in a
scratch directory, so walking up from there finds no .env either.
"""

import json
import os
import subprocess
import sys
from pathlib import Path

import pytest
from fastapi import Response

import app.config.settings as settings_module
from app.config.settings import settings
from app.services.auth import set_refresh_cookie
from app.services.oauth_state import set_oauth_state_cookie

SERVER = Path(__file__).resolve().parents[1]

# The values prod used to set by hand, which now come from the defaults.
PROBE = (
    "import json; from app.config.settings import settings as s; print(json.dumps("
    "{k: getattr(s, k) for k in ('ENVIRONMENT', 'ALLOWED_HOSTS', 'CACHE_TTL', 'LOG_LEVEL', 'FRONTEND_URL')}))"
)

PRODUCTION = {
    "ENVIRONMENT": "production",
    "ALLOWED_HOSTS": ["stellarbladeguide.com", "www.stellarbladeguide.com", "healthcheck.railway.app"],
    "CACHE_TTL": 2592000,
    "LOG_LEVEL": "INFO",
    "FRONTEND_URL": "https://stellarbladeguide.com",
}

# Prod's env after the trim, exactly. A name added here must be set on Railway first.
REQUIRED = {
    "DATABASE_URL", "REDIS_URL", "JWT_SECRET_KEY", "ORIGIN_SECRET", "OPENAI_API_KEY",
    "RESEND_API_KEY", "CLOUDINARY_CLOUD_NAME", "CLOUDINARY_API_KEY", "CLOUDINARY_API_SECRET",
    "GOOGLE_CLIENT_ID", "GOOGLE_CLIENT_SECRET", "DISCORD_CLIENT_ID", "DISCORD_CLIENT_SECRET",
}

# Stand-ins for prod's secrets, all different, so an error that echoed one would show.
SECRETS = {name: f"stand-in-{i:02}" for i, name in enumerate(sorted(REQUIRED))}

# The settings an empty value must not break.
EMPTY_TAKES_DEFAULT = ("ENVIRONMENT", "ALLOWED_HOSTS", "CACHE_TTL", "LOG_LEVEL", "FRONTEND_URL")


def _probe(tmp_path, env):
    return subprocess.run(
        [sys.executable, "-c", PROBE],
        cwd=tmp_path,
        env={"PATH": os.environ["PATH"], "PYTHONPATH": str(SERVER), "PYTHON_DOTENV_DISABLED": "1", **env},
        capture_output=True,
        text=True,
        timeout=60,
    )


def _values(result):
    assert result.returncode == 0, result.stderr
    return json.loads(result.stdout)


def test_unset_variables_take_production_values(tmp_path):
    assert _values(_probe(tmp_path, SECRETS)) == PRODUCTION


def test_empty_variables_take_production_values(tmp_path):
    # Railway hands a blank value, or a reference that didn't resolve, to the app as ''.
    blank = {name: "" for name in EMPTY_TAKES_DEFAULT}
    assert _values(_probe(tmp_path, {**SECRETS, **blank})) == PRODUCTION


@pytest.mark.parametrize("name", sorted(REQUIRED))
def test_production_refuses_to_start_without_each_required_variable(tmp_path, name):
    rest = {key: value for key, value in SECRETS.items() if key != name}
    for env in (rest, {**rest, name: ""}):
        result = _probe(tmp_path, env)
        assert result.returncode != 0
        assert f"Missing environment variables: {name}" in result.stderr
        # Names only: no value of any other variable reaches the deploy log.
        assert not any(value in result.stderr for value in SECRETS.values())


def test_the_required_list_is_prods_env():
    assert set(settings_module.REQUIRED_IN_PRODUCTION) == REQUIRED


def test_an_unknown_environment_is_refused(tmp_path):
    # Every cookie check compares with 'production', so a typo would quietly mean dev.
    result = _probe(tmp_path, {**SECRETS, "ENVIRONMENT": "prod"})
    assert result.returncode != 0
    assert "ENVIRONMENT must be 'production' or 'development', not 'prod'" in result.stderr


def test_production_refuses_debug(tmp_path):
    # DEBUG turns off the origin check. In dev, a server/.env that lost its ENVIRONMENT
    # still has DEBUG=True, so it stops here instead of handing out prod cookies.
    result = _probe(tmp_path, {**SECRETS, "DEBUG": "true"})
    assert result.returncode != 0
    assert "DEBUG=true needs ENVIRONMENT=development" in result.stderr


def test_development_needs_no_secrets_and_allows_loopback(tmp_path):
    values = _values(_probe(tmp_path, {"ENVIRONMENT": "development", "DEBUG": "true"}))
    assert values["ENVIRONMENT"] == "development"
    assert values["ALLOWED_HOSTS"] == PRODUCTION["ALLOWED_HOSTS"] + ["localhost", "127.0.0.1"]


def test_allowed_hosts_replaces_the_whole_list(tmp_path):
    values = _values(_probe(tmp_path, {**SECRETS, "ALLOWED_HOSTS": " a.example , b.example ,"}))
    assert values["ALLOWED_HOSTS"] == ["a.example", "b.example"]


def test_frontend_url_drops_a_trailing_slash(tmp_path):
    # Every absolute URL the server sends out joins a path onto it.
    values = _values(_probe(tmp_path, {**SECRETS, "FRONTEND_URL": "http://localhost:3000/"}))
    assert values["FRONTEND_URL"] == "http://localhost:3000"


def test_production_cookies_carry_the_site_domain_and_secure(monkeypatch):
    # What an unset ENVIRONMENT now gets. The cookie helpers read it at call time.
    monkeypatch.setattr(settings, "ENVIRONMENT", "production")
    for set_cookie in (set_refresh_cookie, set_oauth_state_cookie):
        response = Response()
        set_cookie(response, "value")
        header = response.headers["set-cookie"]
        assert "Domain=.stellarbladeguide.com" in header
        assert "Secure" in header

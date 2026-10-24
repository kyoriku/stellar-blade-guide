"""The password rule (app/core/passwords.py), passlib's real limit, and the client mirror."""

from pathlib import Path

import pytest
from passlib.exc import PasswordSizeError

from app.core.passwords import (
    CURRENT_PASSWORD_MAX_LENGTH,
    NEW_PASSWORD_MAX_LENGTH,
    password_problem,
)
from app.services.auth import hash_password

TOO_SHORT = "Password must be at least 8 characters"
NEW_TOO_LONG = "Password must be at most 128 characters"
CURRENT_TOO_LONG = "Password must be at most 4096 characters"
CANT_USE = "Password contains a character that can't be used"
EMOJI = chr(0x1F600)  # one character, four UTF-8 bytes
SURROGATE = chr(0xD800)  # half a surrogate pair, which has no UTF-8 form
CLIENT = Path(__file__).resolve().parents[2] / "client" / "src" / "utils" / "validatePassword.ts"


@pytest.mark.parametrize(
    "password, new, problem",
    [
        pytest.param("a" * 7, True, TOO_SHORT, id="new-under-min"),
        pytest.param("a" * 8, True, None, id="new-at-min"),
        pytest.param("a" * 128, True, None, id="new-at-max"),
        pytest.param("a" * 129, True, NEW_TOO_LONG, id="new-just-over"),
        pytest.param("a" * 1_000_000, True, NEW_TOO_LONG, id="new-far-over"),
        pytest.param(EMOJI * 128, True, None, id="new-counts-characters"),
        pytest.param(EMOJI * 129, True, NEW_TOO_LONG, id="new-characters-over"),
        pytest.param("a" * 7, False, None, id="current-has-no-min"),
        pytest.param("a" * 4096, False, None, id="current-at-max"),
        pytest.param("a" * 4097, False, CURRENT_TOO_LONG, id="current-just-over"),
        pytest.param("a" * 1_000_000, False, CURRENT_TOO_LONG, id="current-far-over"),
        pytest.param(EMOJI * 4096, False, None, id="current-counts-characters"),
        pytest.param(EMOJI * 4097, False, CURRENT_TOO_LONG, id="current-characters-over"),
        pytest.param("a" * 129, False, None, id="stored-over-the-new-cap-still-checks"),
        pytest.param("password" + SURROGATE, True, CANT_USE, id="new-surrogate"),
        pytest.param("password" + SURROGATE, False, CANT_USE, id="current-surrogate"),
        pytest.param("abc" + SURROGATE, True, TOO_SHORT, id="short-surrogate-keeps-todays-answer"),
        pytest.param("pass" + chr(0) + "word", True, None, id="nul-is-fine"),
    ],
)
def test_password_problem(password, new, problem):
    assert password_problem(password, new=new) == problem


def test_the_checked_limit_is_passlibs():
    # The live limit, not passlib.utils.MAX_PASSWORD_SIZE: the check reads a copy taken
    # at import, after server/.env was loaded, so this also catches an override there.
    hash_password("p" * CURRENT_PASSWORD_MAX_LENGTH)
    with pytest.raises(PasswordSizeError):
        hash_password("p" * (CURRENT_PASSWORD_MAX_LENGTH + 1))
    # Every new password can be hashed, and then checked at sign-in.
    assert NEW_PASSWORD_MAX_LENGTH <= CURRENT_PASSWORD_MAX_LENGTH


def _client_constant(source: str, name: str) -> int:
    prefix = f"export const {name} = "
    (line,) = [line for line in source.splitlines() if line.startswith(prefix)]
    return int(line.removeprefix(prefix))


def test_the_client_mirrors_both_limits_and_their_message():
    # A missing file or a changed line fails here; nothing is skipped.
    source = CLIENT.read_text()
    template_line = "const tooLong = (max: number) => `Password must be at most ${max} characters`"
    assert template_line in source.splitlines()
    for name, limit, new in (
        ("NEW_PASSWORD_MAX_LENGTH", NEW_PASSWORD_MAX_LENGTH, True),
        ("CURRENT_PASSWORD_MAX_LENGTH", CURRENT_PASSWORD_MAX_LENGTH, False),
    ):
        client_limit = _client_constant(source, name)
        assert client_limit == limit
        message = "Password must be at most ${max} characters".replace("${max}", str(client_limit))
        assert message == password_problem("p" * (limit + 1), new=new)

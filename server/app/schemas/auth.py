from typing import Annotated

from email_validator import validate_email, EmailNotValidError
from pydantic import AfterValidator, BaseModel, field_validator

from app.core.passwords import password_problem
from app.core.usernames import username_problem


# Validated email type used by all auth request models. Mirrors what Pydantic's
# EmailStr did (strip + email-validator + normalized form, so stored/looked-up
# values are byte-for-byte unchanged) but raises a friendly message instead of
# the library's technical default. The server stays the authority on validity.
def _validate_email(v: str) -> str:
    try:
        return validate_email(v.strip(), check_deliverability=False).normalized
    except EmailNotValidError:
        raise ValueError("Please enter a valid email address")


FriendlyEmail = Annotated[str, AfterValidator(_validate_email)]


def _new_password(v: str) -> str:
    problem = password_problem(v, new=True)
    if problem:
        raise ValueError(problem)
    return v


def _current_password(v: str) -> str:
    problem = password_problem(v, new=False)
    if problem:
        raise ValueError(problem)
    return v


# A password being set (register, change, reset) and one checked against the stored hash
# (login, change's current password). A new one stops at 128 and needs the minimum; a
# checked one stops at passlib's 4096, which every stored password already meets.
NewPassword = Annotated[str, AfterValidator(_new_password)]
CurrentPassword = Annotated[str, AfterValidator(_current_password)]


class RegisterRequest(BaseModel):
    email: FriendlyEmail
    username: str
    password: NewPassword

    @field_validator("username")
    @classmethod
    def username_valid(cls, v: str) -> str:
        v = v.strip()
        problem = username_problem(v)
        if problem:
            raise ValueError(problem)
        return v


class LoginRequest(BaseModel):
    email: FriendlyEmail
    password: CurrentPassword


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: dict


class ChangePasswordRequest(BaseModel):
    current_password: CurrentPassword
    new_password: NewPassword


class ForgotPasswordRequest(BaseModel):
    email: FriendlyEmail


class ResetPasswordRequest(BaseModel):
    token: str
    new_password: NewPassword

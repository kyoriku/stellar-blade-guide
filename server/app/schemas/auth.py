from typing import Annotated

from email_validator import validate_email, EmailNotValidError
from pydantic import AfterValidator, BaseModel, field_validator


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


class RegisterRequest(BaseModel):
    email: FriendlyEmail
    username: str
    password: str

    @field_validator("username")
    @classmethod
    def username_valid(cls, v: str) -> str:
        v = v.strip()
        if len(v) < 3 or len(v) > 50:
            raise ValueError("Username must be between 3 and 50 characters")
        if not v.replace("_", "").replace("-", "").isalnum():
            raise ValueError("Username may only contain letters, numbers, hyphens, and underscores")
        return v

    @field_validator("password")
    @classmethod
    def password_strong(cls, v: str) -> str:
        if len(v) < 8:
            raise ValueError("Password must be at least 8 characters")
        return v


class LoginRequest(BaseModel):
    email: FriendlyEmail
    password: str


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: dict


class ChangePasswordRequest(BaseModel):
    current_password: str
    new_password: str

    @field_validator("new_password")
    @classmethod
    def password_strong(cls, v: str) -> str:
        if len(v) < 8:
            raise ValueError("Password must be at least 8 characters")
        return v


class ForgotPasswordRequest(BaseModel):
    email: FriendlyEmail


class ResetPasswordRequest(BaseModel):
    token: str
    new_password: str

    @field_validator("new_password")
    @classmethod
    def password_strong(cls, v: str) -> str:
        if len(v) < 8:
            raise ValueError("Password must be at least 8 characters")
        return v

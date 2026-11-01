from typing import Literal, Optional

from pydantic import BaseModel, ConfigDict, StrictBool, field_validator


class AdminUser(BaseModel):
    """One account on the admin page. The address is masked; only the reveal route
    (RevealedEmail) ever sends one whole."""
    id: int
    username: str
    avatar_url: Optional[str]
    email_masked: str
    # As stored: user, moderator or admin. The column has no constraint and admins are
    # made by hand in SQL, so a mistyped role must still list (rather than fail the
    # whole answer), where Make moderator can put it right.
    role: str
    is_active: bool
    created_at: str


class RevealedEmail(BaseModel):
    id: int
    email: str


# Every body refuses a field it doesn't know, so a misspelled one is a 422 rather than
# a request that quietly does something else.

# The longest address the users table holds.
SEARCH_MAX_LENGTH = 255


class AdminSearchRequest(BaseModel):
    model_config = ConfigDict(extra="forbid")

    q: str

    @field_validator("q")
    @classmethod
    def at_most_the_longest_address(cls, v: str) -> str:
        # Counted here, in code points, rather than with Field(max_length=...): with a
        # constraint, pydantic refuses a lone surrogate outright, and the route answers a
        # NUL or a lone surrogate with [] (no username or address holds either).
        if len(v) > SEARCH_MAX_LENGTH:
            raise ValueError(f"Search text can't be longer than {SEARCH_MAX_LENGTH} characters")
        return v


class AdminRoleRequest(BaseModel):
    model_config = ConfigDict(extra="forbid")

    # Never "admin": no route makes or unmakes an admin.
    role: Literal["user", "moderator"]


class AdminActiveRequest(BaseModel):
    model_config = ConfigDict(extra="forbid")

    # JSON true or false only: a lax bool would also take strings such as "off" and
    # numbers such as 0.
    active: StrictBool

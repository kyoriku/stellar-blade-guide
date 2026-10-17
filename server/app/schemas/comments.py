from typing import Annotated, Optional

from pydantic import AfterValidator, BaseModel, field_validator

from app.core.ids import is_row_id


def _row_id(v: int) -> int:
    # The route never looks the content up, so this is its only check: an id no row
    # can have names nothing, and one past int4 would fail the INSERT.
    if not is_row_id(v):
        raise ValueError("content_id must be a valid id")
    return v


class CreateCommentRequest(BaseModel):
    content_type: str
    content_id: Annotated[int, AfterValidator(_row_id)]
    body: str
    parent_id: Optional[int] = None

    @field_validator("content_type")
    @classmethod
    def content_type_valid(cls, v: str) -> str:
        allowed = {"walkthrough", "collectible", "level"}
        if v not in allowed:
            raise ValueError(f"content_type must be one of: {', '.join(allowed)}")
        return v

    @field_validator("body")
    @classmethod
    def body_not_empty(cls, v: str) -> str:
        return _clean_body(v)


class UpdateCommentRequest(BaseModel):
    body: str

    @field_validator("body")
    @classmethod
    def body_not_empty(cls, v: str) -> str:
        return _clean_body(v)


def _clean_body(v: str) -> str:
    """The body both requests store: stripped, 1 to 2000 characters, and text the
    database can hold. One copy, so create and edit cannot drift apart."""
    v = v.strip()
    if len(v) < 1:
        raise ValueError("Comment body cannot be empty")
    if len(v) > 2000:
        raise ValueError("Comment body cannot exceed 2000 characters")
    # Postgres refuses a NUL in text, and a lone surrogate (half of an emoji's pair,
    # U+D800 to U+DFFF) has no UTF-8 form, so asyncpg cannot send it. Either would get
    # past the moderation call and fail at the write. Line breaks and tabs are ordinary
    # comment text, which is why this is not isprintable().
    if chr(0) in v:
        raise ValueError("Comment body cannot contain a null character")
    try:
        v.encode("utf-8")
    except UnicodeEncodeError:
        raise ValueError("Comment body contains a character that can't be saved") from None
    return v

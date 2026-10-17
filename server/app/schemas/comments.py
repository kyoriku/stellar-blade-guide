from typing import Optional

from pydantic import BaseModel, field_validator


class CreateCommentRequest(BaseModel):
    content_type: str
    content_id: int
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
        v = v.strip()
        if len(v) < 1:
            raise ValueError("Comment body cannot be empty")
        if len(v) > 2000:
            raise ValueError("Comment body cannot exceed 2000 characters")
        # Postgres refuses a NUL in text, so one would reach the INSERT, after the
        # moderation call, as a 500. Only NUL: line breaks are ordinary comment text,
        # which is why this is not isprintable().
        if chr(0) in v:
            raise ValueError("Comment body cannot contain a null character")
        return v


class UpdateCommentRequest(BaseModel):
    body: str

    @field_validator("body")
    @classmethod
    def body_not_empty(cls, v: str) -> str:
        v = v.strip()
        if len(v) < 1:
            raise ValueError("Comment body cannot be empty")
        if len(v) > 2000:
            raise ValueError("Comment body cannot exceed 2000 characters")
        if chr(0) in v:  # as CreateCommentRequest
            raise ValueError("Comment body cannot contain a null character")
        return v

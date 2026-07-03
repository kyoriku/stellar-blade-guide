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
        return v

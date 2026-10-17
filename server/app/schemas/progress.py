from pydantic import BaseModel, ConfigDict, Field, field_validator, model_validator
from typing import List, Literal, Optional


class ProgressWriteResponse(BaseModel):
    """Response for the idempotent PUT/DELETE progress verbs. added/removed
    mean the row changed; already_complete/not_found mean it was a no-op —
    the client uses the no-op statuses as a stale-cache drift signal."""
    status: Literal["added", "already_complete", "removed", "not_found"]
    collectible_id: int


class SyncRequest(BaseModel):
    # Twice the catalog (1,056 entries) leaves room to grow; past that a body can
    # only be junk, and every id is a bound parameter.
    collectible_ids: List[int] = Field(max_length=2000)


class SyncResponse(BaseModel):
    status: str
    added: int


class BulkProgressRequest(BaseModel):
    """One bulk change over a scope the server resolves itself. Nothing has a
    default: a missing action or scope is a 422, so "everything" happens only
    when it is named."""

    # A misspelled or stray field must fail, not fall through to a wider scope.
    model_config = ConfigDict(extra="forbid")

    action: Literal["clear", "mark_found"]
    scope: Literal["everything", "level", "type"]
    level: Optional[str] = Field(default=None, min_length=1, max_length=100)
    type: Optional[str] = Field(default=None, min_length=1, max_length=100)
    cycle: Optional[Literal["Base", "NG+", "NG++", "DLC"]] = None

    @field_validator("level", "type", "cycle", mode="before")
    @classmethod
    def no_explicit_null(cls, v, info):
        # Validators skip defaults, so this only fires on a null that was sent.
        # Leaving one spelling for "all cycles" means a client that loses its cycle
        # to null cannot widen the scope it showed the user.
        if v is None:
            raise ValueError(f"omit {info.field_name} instead of sending null")
        return v

    @field_validator("level", "type")
    @classmethod
    def printable(cls, v, info):
        # Postgres refuses a NUL in a text parameter, so a control character would
        # fail the lookup instead of getting the 422 any other unknown name gets.
        if v is not None and not v.isprintable():
            raise ValueError(f"{info.field_name} must be printable text")
        return v

    @model_validator(mode="after")
    def target_matches_scope(self):
        if self.scope == "level" and self.level is None:
            raise ValueError("level is required when scope is 'level'")
        if self.scope != "level" and self.level is not None:
            raise ValueError("level is only allowed when scope is 'level'")
        if self.scope == "type" and self.type is None:
            raise ValueError("type is required when scope is 'type'")
        if self.scope != "type" and self.type is not None:
            raise ValueError("type is only allowed when scope is 'type'")
        return self


class BulkPreviewResponse(BaseModel):
    """What the same request would change now. quantity is the Progress page's
    unit (a found xN entry counts N); entries is the row count behind it."""
    entries: int
    quantity: int
    scope_entries: int
    # The scope's ids, so a device can drop them from its unsynced guest copy
    # after a clear (otherwise its next sign-in sync would add them back).
    scope_ids: List[int]


class BulkProgressResponse(BaseModel):
    entries: int
    quantity: int
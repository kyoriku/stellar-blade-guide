from pydantic import BaseModel
from typing import List, Literal


class ProgressWriteResponse(BaseModel):
    """Response for the idempotent PUT/DELETE progress verbs. added/removed
    mean the row changed; already_complete/not_found mean it was a no-op —
    the client uses the no-op statuses as a stale-cache drift signal."""
    status: Literal["added", "already_complete", "removed", "not_found"]
    collectible_id: int


class SyncRequest(BaseModel):
    collectible_ids: List[int]


class SyncResponse(BaseModel):
    status: str
    added: int
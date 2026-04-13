from pydantic import BaseModel
from typing import List


class ToggleResponse(BaseModel):
    status: str
    collectible_id: int


class SyncRequest(BaseModel):
    collectible_ids: List[int]


class SyncResponse(BaseModel):
    status: str
    added: int
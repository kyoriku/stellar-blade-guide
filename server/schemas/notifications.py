from datetime import datetime
from typing import Optional, List

from pydantic import BaseModel


class NotificationItem(BaseModel):
    id: int
    type: str
    actor_username: Optional[str]  # null if the actor's account was deleted
    label: str
    url: str
    content_type: str  # so the client can invalidate the right comments cache
    content_id: int
    is_read: bool
    created_at: datetime


class NotificationList(BaseModel):
    items: List[NotificationItem]
    unread_count: int

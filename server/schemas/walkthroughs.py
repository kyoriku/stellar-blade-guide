
from pydantic import BaseModel
from typing import List, Optional

class ContentImage(BaseModel):
    url: str
    alt: str
    order: int

class BossInfo(BaseModel):
    name: str
    balance_diamonds: Optional[int] = None
    key_attacks: Optional[List[str]] = None

class WalkthroughContent(BaseModel):
    order: int
    section_title: Optional[str] = None
    text: str
    tip: Optional[str] = None
    warning: Optional[str] = None
    is_boss: bool = False
    boss_info: Optional[BossInfo] = None
    images: List[ContentImage] = []

class Walkthrough(BaseModel):
    id: int
    slug: str
    title: str
    subtitle: Optional[str]
    level: Optional[str]
    mission_type: str
    objectives: Optional[List[str]]
    content: List[WalkthroughContent]
    display_order: int

class WalkthroughListItem(BaseModel):
    id: int
    slug: str
    title: str
    subtitle: Optional[str]
    level: Optional[str]
    mission_type: str
    display_order: int
# # from pydantic import BaseModel
# # from typing import List, Optional, Literal, Union

# # class CombatInfo(BaseModel):
# #     enemies: Optional[List[str]] = None
# #     recommended_level: Optional[int] = None
# #     difficulty: Optional[str] = None
# #     balance_diamonds: Optional[int] = None
# #     phases: Optional[int] = None
# #     strategy: Optional[str] = None
# #     key_attacks: Optional[List[str]] = None
# #     key_mechanics: Optional[List[str]] = None

# # class StepNote(BaseModel):
# #     type: Literal["tip", "warning", "collectible_reference"]
# #     content: str
# #     collectible_id: Optional[int] = None
# #     collectible_ids: Optional[List[int]] = None

# # class StepImage(BaseModel):
# #     url: str
# #     alt: str
# #     order: int

# # class WalkthroughStep(BaseModel):
# #     step_number: int
# #     instruction: str
# #     type: Literal["navigation", "combat", "objective", "boss", "dialogue"]
# #     combat_info: Optional[CombatInfo] = None
# #     notes: List[StepNote] = []
# #     images: List[StepImage] = []

# # class WalkthroughResponse(BaseModel):
# #     id: int
# #     type: str
# #     level: Optional[str]
# #     title: str
# #     subtitle: Optional[str]
# #     prerequisites: Optional[List[str]]
# #     rewards: Optional[List[str]]
# #     steps: List[WalkthroughStep]
# #     display_order: int

# # class WalkthroughListItem(BaseModel):
# #     id: int
# #     type: str
# #     level: Optional[str]
# #     title: str
# #     subtitle: Optional[str]
# #     display_order: int






# from pydantic import BaseModel
# from typing import List, Optional

# class ContentImage(BaseModel):
#     url: str
#     alt: str
#     order: int

# class WalkthroughContent(BaseModel):
#     order: int
#     text: str
#     is_boss: Optional[bool] = False
#     boss_tips: Optional[List[str]] = None
#     images: List[ContentImage] = []

# class Walkthrough(BaseModel):
#     id: int
#     title: str
#     subtitle: Optional[str]
#     level: Optional[str]
#     mission_type: str
#     objectives: Optional[List[str]]
#     content: List[WalkthroughContent]
#     display_order: int

# class WalkthroughListItem(BaseModel):
#     id: int
#     title: str
#     subtitle: Optional[str]
#     level: Optional[str]
#     mission_type: str
#     display_order: int






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
    title: str
    subtitle: Optional[str]
    level: Optional[str]
    mission_type: str
    objectives: Optional[List[str]]
    content: List[WalkthroughContent]
    display_order: int

class WalkthroughListItem(BaseModel):
    id: int
    title: str
    subtitle: Optional[str]
    level: Optional[str]
    mission_type: str
    display_order: int
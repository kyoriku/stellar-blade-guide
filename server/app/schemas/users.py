from typing import Dict, List, Optional

from pydantic import BaseModel, field_validator


class UserResponse(BaseModel):
    id: int
    email: str
    username: str
    avatar_url: Optional[str]
    role: str
    created_at: str

    class Config:
        from_attributes = True


class UpdateProfileRequest(BaseModel):
    username: Optional[str] = None
    avatar_url: Optional[str] = None

    @field_validator("username")
    @classmethod
    def username_valid(cls, v: Optional[str]) -> Optional[str]:
        if v is None:
            return v
        v = v.strip()
        if len(v) < 3 or len(v) > 50:
            raise ValueError("Username must be between 3 and 50 characters")
        if not v.replace("_", "").replace("-", "").isalnum():
            raise ValueError("Username may only contain letters, numbers, hyphens, and underscores")
        return v


class OverallStat(BaseModel):
    completed: int
    total: int


class TypeStat(BaseModel):
    name: str
    slug: str
    category: str  # category_group with NULL coalesced to "collectibles"
    completed: int
    total: int


class LevelStat(BaseModel):
    name: str
    order: int
    completed: int
    total: int


class CycleStat(BaseModel):
    name: str
    completed: int
    total: int


class UserStatsResponse(BaseModel):
    total: OverallStat
    types: List[TypeStat]
    levels: List[LevelStat]
    cycles: List[CycleStat]
    # Sparse {collectible_id: quantity} for quantity > 1 entries only (~15
    # rows) — lets the client quantity-weight its live numerator without
    # fetching the catalog. All counts above are quantity-weighted.
    quantity_overrides: Dict[int, int]
    comments_posted: int
    member_since: str


class UpdateRoleRequest(BaseModel):
    role: str

    @field_validator("role")
    @classmethod
    def role_valid(cls, v: str) -> str:
        allowed = {"user", "moderator", "admin"}
        if v not in allowed:
            raise ValueError(f"Role must be one of: {', '.join(allowed)}")
        return v

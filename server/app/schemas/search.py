from pydantic import BaseModel
from typing import Optional


class SearchResult(BaseModel):
    kind: str           # "collectibles"|"upgrades"|"cosmetics"|"materials"|"walkthrough"|"level"
    id: int
    title: str
    snippet: Optional[str]   # description excerpt, subtitle, or None
    navigation_url: str      # ready-to-use frontend path
    score: float


class SearchResponse(BaseModel):
    query: str
    total: int
    results: list[SearchResult]

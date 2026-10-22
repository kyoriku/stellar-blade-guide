from pydantic import BaseModel
from typing import Optional


class SearchResult(BaseModel):
    kind: str           # "collectibles"|"upgrades"|"cosmetics"|"walkthrough"|"level"|"type"|"walkthrough_type"
    # A walkthrough section found by its title is a "walkthrough" result titled with the
    # section and linking it, with id -(walkthrough id * 1000 + its position), so it never
    # equals a page's id. Clients only use ids as keys.
    id: int
    title: str
    snippet: Optional[str]   # description excerpt, subtitle, or None
    navigation_url: str      # ready-to-use frontend path
    score: float


class SearchResponse(BaseModel):
    query: str
    total: int
    results: list[SearchResult]
    # The typo-corrected query the results are for, when the fallback ran. Optional, so
    # a cached response from before the field existed still validates.
    corrected: Optional[str] = None

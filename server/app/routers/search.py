import time

from fastapi import APIRouter, Depends, Query, Request
from sqlalchemy.ext.asyncio import AsyncSession

from app.config.settings import settings
from app.db.database import get_db
from app.schemas.search import SearchResponse
from app.core.cache import get_cache, set_cache
from app.core.security import limiter
from app.services.search import _execute_search

SEARCH_RATE_LIMIT = "30/minute"
# Shared with security_headers.py, which advertises the same value as s-maxage.
# Search has no purge path (arbitrary ?q= cannot be enumerated), so the TTL is
# the only thing bounding staleness — see settings.SEARCH_CACHE_TTL.
SEARCH_CACHE_TTL = settings.SEARCH_CACHE_TTL

router = APIRouter(prefix="/search", tags=["search"])


@router.get("/", response_model=SearchResponse)
@limiter.limit(SEARCH_RATE_LIMIT)
async def search(
    request: Request,
    q: str = Query(..., min_length=2, max_length=100),
    limit: int = Query(default=20, ge=1, le=50),
    db: AsyncSession = Depends(get_db),
):
    q_normalized = q.strip().lower()
    cache_key = f"search:{q_normalized}:{limit}"

    cached = await get_cache(cache_key)
    if cached:
        request.state.cache_status = "HIT"
        return cached

    request.state.cache_status = "MISS"
    db_start = time.time()

    results = await _execute_search(db, q_normalized, limit)
    request.state.db_time = (time.time() - db_start) * 1000
    response = SearchResponse(query=q_normalized, total=len(results), results=results)
    await set_cache(cache_key, response.model_dump(), ttl=SEARCH_CACHE_TTL)
    return response

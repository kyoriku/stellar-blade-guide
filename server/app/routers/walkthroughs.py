import time
from urllib.parse import quote

from fastapi import APIRouter, HTTPException, Depends, Request
from fastapi.responses import RedirectResponse
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from typing import List

from app.db.database import get_db, LIKE_ESCAPE, escape_like
from app.models.walkthroughs import Walkthrough as WalkthroughModel
from app.schemas.walkthroughs import Walkthrough as WalkthroughSchema, WalkthroughListItem
from app.core.cache import get_cache, set_cache, walkthrough_cache_keys
from app.core.navigation import canonical_url_type, normalize_type as _normalize_type
from app.core.security import limiter
from app.core.segments import is_text_segment
from app.config.settings import settings

router = APIRouter(prefix="/walkthroughs", tags=["walkthroughs"])


def _serialize_list_item(w) -> dict:
    """Convert a Walkthrough ORM object to a list item response."""
    return {
        "id": w.id,
        "slug": w.slug,
        "title": w.title,
        "subtitle": w.subtitle,
        "level": w.level,
        "mission_type": w.mission_type,
        "display_order": w.display_order,
        "thumbnail_url": w.thumbnail_url,
        "available_after": w.available_after
    }


def _serialize_full(w) -> dict:
    """Convert a Walkthrough ORM object to a full response with content."""
    return {
        **_serialize_list_item(w),
        "objectives": w.objectives,
        "content": w.content,
        "rewards": w.rewards,
    }


@router.get("/", response_model=List[WalkthroughListItem])
@limiter.limit(settings.RATE_LIMIT_PER_MINUTE)
async def get_all_walkthroughs(request: Request, db: AsyncSession = Depends(get_db)):
    """Get all walkthroughs (summary view)."""
    cache_key = "walkthroughs:all"
    cached_data = await get_cache(cache_key)
    if cached_data:
        request.state.cache_status = "HIT"
        return cached_data

    request.state.cache_status = "MISS"
    db_start = time.perf_counter()

    result = await db.execute(
        select(WalkthroughModel).order_by(WalkthroughModel.display_order)
    )
    walkthroughs = result.scalars().all()

    request.state.db_time = (time.perf_counter() - db_start) * 1000

    response = [_serialize_list_item(w) for w in walkthroughs]
    await set_cache(cache_key, response, ttl=settings.CACHE_TTL)
    return response


@router.get("/{walkthrough_type}", response_model=List[WalkthroughListItem])
@limiter.limit(settings.RATE_LIMIT_PER_MINUTE)
async def get_walkthroughs_by_type(walkthrough_type: str, request: Request, db: AsyncSession = Depends(get_db)):
    """Get walkthroughs by type (main-story, side-quests, etc.)."""
    # One URL per resource: any other spelling of a known type (side-quest for
    # side-quests) gets a permanent redirect. It is no-store, like every non-200, so
    # the edge never keeps a copy the seed purge can't reach.
    canonical = canonical_url_type(walkthrough_type)
    if canonical:
        return RedirectResponse(f"{settings.API_PREFIX}/walkthroughs/{canonical}", status_code=308)

    if not is_text_segment(walkthrough_type):
        # The unknown-type 404, before a NUL can reach Postgres, which refuses it.
        raise HTTPException(status_code=404, detail="No walkthroughs found for this type")

    normalized_type = _normalize_type(walkthrough_type)

    # Raw on purpose: mission_type matching below is exact and case-sensitive, so a
    # canonicalised key would serve spellings the DB rejects (see core/cache.py).
    cache_key = f"walkthroughs:type:{normalized_type}"
    cached_data = await get_cache(cache_key)
    if cached_data:
        request.state.cache_status = "HIT"
        return cached_data

    request.state.cache_status = "MISS"
    db_start = time.perf_counter()

    result = await db.execute(
        select(WalkthroughModel)
        .where(WalkthroughModel.mission_type == normalized_type)
        .order_by(WalkthroughModel.display_order)
    )
    walkthroughs = result.scalars().all()

    if not walkthroughs:
        raise HTTPException(
            status_code=404, detail="No walkthroughs found for this type")

    request.state.db_time = (time.perf_counter() - db_start) * 1000

    response = [_serialize_list_item(w) for w in walkthroughs]
    await set_cache(cache_key, response, ttl=settings.CACHE_TTL)
    return response


async def lookup_walkthrough(db: AsyncSession, normalized_type: str, slug: str):
    """Find one walkthrough by normalized mission type and slug, or None.

    Shared by the API handler below and the server-side head injection
    (app/seo_head.py) so the query logic exists exactly once.
    """
    # Nothing stored can match, and Postgres would refuse a NUL.
    if not (is_text_segment(normalized_type) and is_text_segment(slug)):
        return None

    # Exact match
    result = await db.execute(
        select(WalkthroughModel).where(
            (WalkthroughModel.mission_type == normalized_type) &
            (WalkthroughModel.slug == slug)
        )
    )
    walkthrough = result.scalar_one_or_none()

    # Case-insensitive fallback. Both patterns come from the URL, so they are
    # escaped: a `%` segment must not match every row (and then blow up
    # scalar_one_or_none()).
    if not walkthrough:
        formatted_type = normalized_type.replace('-', ' ').title()
        formatted_slug = slug.replace('-', ' ').title()

        result = await db.execute(
            select(WalkthroughModel).where(
                (WalkthroughModel.mission_type.ilike(escape_like(formatted_type), escape=LIKE_ESCAPE)) &
                (WalkthroughModel.slug.ilike(escape_like(formatted_slug), escape=LIKE_ESCAPE))
            )
        )
        walkthrough = result.scalar_one_or_none()

    return walkthrough


@router.get("/{walkthrough_type}/{slug}", response_model=WalkthroughSchema)
@limiter.limit(settings.RATE_LIMIT_PER_MINUTE)
async def get_walkthrough_by_slug(
    walkthrough_type: str,
    slug: str,
    request: Request,
    db: AsyncSession = Depends(get_db)
):
    """Get specific walkthrough by type and slug with full content."""
    # The same redirect as the type list. The slug is quoted whole, so a ? or # in it
    # stays inside the path segment.
    canonical = canonical_url_type(walkthrough_type)
    if canonical:
        return RedirectResponse(
            f"{settings.API_PREFIX}/walkthroughs/{canonical}/{quote(slug, safe='')}", status_code=308)

    normalized_type = _normalize_type(walkthrough_type)

    cache_key, _ = walkthrough_cache_keys(normalized_type, slug)
    cached_data = await get_cache(cache_key)
    if cached_data:
        request.state.cache_status = "HIT"
        return cached_data

    request.state.cache_status = "MISS"
    db_start = time.perf_counter()

    walkthrough = await lookup_walkthrough(db, normalized_type, slug)

    if not walkthrough:
        raise HTTPException(
            status_code=404,
            detail=f"Walkthrough not found: {walkthrough_type}/{slug}"
        )

    request.state.db_time = (time.perf_counter() - db_start) * 1000

    response = _serialize_full(walkthrough)
    await set_cache(cache_key, response, ttl=settings.CACHE_TTL)
    return response

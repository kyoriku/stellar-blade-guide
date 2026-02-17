import time
from fastapi import APIRouter, HTTPException, Depends, Request
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from typing import List

from db.database import get_db
from models.walkthroughs import Walkthrough as WalkthroughModel
from schemas.walkthroughs import Walkthrough as WalkthroughSchema, WalkthroughListItem
from core.cache import get_cache, set_cache
from core.security import limiter
from config.settings import settings

router = APIRouter(prefix="/walkthroughs", tags=["walkthroughs"])


def _normalize_type(walkthrough_type: str) -> str:
    """Normalize plural type slugs to singular DB values.
    e.g. 'side-quests' -> 'side-quest', 'bosses' -> 'boss'
    """
    if walkthrough_type.endswith('es'):
        return walkthrough_type[:-2]
    elif walkthrough_type.endswith('s'):
        return walkthrough_type[:-1]
    return walkthrough_type


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
        "thumbnail_url": w.thumbnail_url
    }


def _serialize_full(w) -> dict:
    """Convert a Walkthrough ORM object to a full response with content."""
    return {
        **_serialize_list_item(w),
        "objectives": w.objectives,
        "content": w.content,
    }


@router.get("/", response_model=List[WalkthroughListItem])
@limiter.limit(settings.RATE_LIMIT_PER_MINUTE)
async def get_all_walkthroughs(request: Request, db: AsyncSession = Depends(get_db)):
    """Get all walkthroughs (summary view)."""
    cache_key = "walkthroughs:all"
    cached_data = await get_cache(cache_key)
    if cached_data:
        return cached_data

    result = await db.execute(
        select(WalkthroughModel).order_by(WalkthroughModel.display_order)
    )
    walkthroughs = result.scalars().all()

    response = [_serialize_list_item(w) for w in walkthroughs]
    await set_cache(cache_key, response, ttl=settings.CACHE_TTL)
    return response


@router.get("/{walkthrough_type}", response_model=List[WalkthroughListItem])
@limiter.limit(settings.RATE_LIMIT_PER_MINUTE)
async def get_walkthroughs_by_type(walkthrough_type: str, request: Request, db: AsyncSession = Depends(get_db)):
    """Get walkthroughs by type (main-story, side-quest, etc.)."""
    normalized_type = _normalize_type(walkthrough_type)

    cache_key = f"walkthroughs:type:{normalized_type}"
    cached_data = await get_cache(cache_key)
    if cached_data:
        request.state.cache_status = "HIT"
        return cached_data

    request.state.cache_status = "MISS"
    db_start = time.time()

    result = await db.execute(
        select(WalkthroughModel)
        .where(WalkthroughModel.mission_type == normalized_type)
        .order_by(WalkthroughModel.display_order)
    )
    walkthroughs = result.scalars().all()

    if not walkthroughs:
        raise HTTPException(status_code=404, detail="No walkthroughs found for this type")

    request.state.db_time = (time.time() - db_start) * 1000

    response = [_serialize_list_item(w) for w in walkthroughs]
    await set_cache(cache_key, response, ttl=settings.CACHE_TTL)
    return response


@router.get("/{walkthrough_type}/{slug}", response_model=WalkthroughSchema)
@limiter.limit(settings.RATE_LIMIT_PER_MINUTE)
async def get_walkthrough_by_slug(
    walkthrough_type: str,
    slug: str,
    request: Request,
    db: AsyncSession = Depends(get_db)
):
    """Get specific walkthrough by type and slug with full content."""
    normalized_type = _normalize_type(walkthrough_type)

    cache_key = f"walkthrough:{normalized_type}:{slug}"
    cached_data = await get_cache(cache_key)
    if cached_data:
        request.state.cache_status = "HIT"
        return cached_data

    request.state.cache_status = "MISS"
    db_start = time.time()

    # Exact match
    result = await db.execute(
        select(WalkthroughModel).where(
            (WalkthroughModel.mission_type == normalized_type) &
            (WalkthroughModel.slug == slug)
        )
    )
    walkthrough = result.scalar_one_or_none()

    # Case-insensitive fallback
    if not walkthrough:
        formatted_type = normalized_type.replace('-', ' ').title()
        formatted_slug = slug.replace('-', ' ').title()

        result = await db.execute(
            select(WalkthroughModel).where(
                (WalkthroughModel.mission_type.ilike(formatted_type)) &
                (WalkthroughModel.slug.ilike(formatted_slug))
            )
        )
        walkthrough = result.scalar_one_or_none()

    if not walkthrough:
        raise HTTPException(
            status_code=404,
            detail=f"Walkthrough not found: {walkthrough_type}/{slug}"
        )

    request.state.db_time = (time.time() - db_start) * 1000

    response = _serialize_full(walkthrough)
    await set_cache(cache_key, response, ttl=settings.CACHE_TTL)
    return response
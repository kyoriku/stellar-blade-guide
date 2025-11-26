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

@router.get("/", response_model=List[WalkthroughListItem])
@limiter.limit(settings.RATE_LIMIT_PER_MINUTE)
async def get_all_walkthroughs(request: Request, db: AsyncSession = Depends(get_db)):
    """Get all walkthroughs (summary view)"""
    cache_key = "walkthroughs:all"
    cached_data = await get_cache(cache_key)
    if cached_data:
        return cached_data
    
    result = await db.execute(
        select(WalkthroughModel).order_by(WalkthroughModel.display_order)
    )
    walkthroughs = result.scalars().all()
    
    response = [{
        "id": w.id,
        "slug": w.slug,
        "title": w.title,
        "subtitle": w.subtitle,
        "level": w.level,
        "mission_type": w.mission_type,
        "display_order": w.display_order,
        "thumbnail_url": w.thumbnail_url
    } for w in walkthroughs]
    
    await set_cache(cache_key, response, ttl=settings.CACHE_TTL_LONG)
    return response

@router.get("/{walkthrough_id}", response_model=WalkthroughSchema)
@limiter.limit(settings.RATE_LIMIT_PER_MINUTE)
async def get_walkthrough_by_id(walkthrough_id: int, request: Request, db: AsyncSession = Depends(get_db)):
    """Get specific walkthrough with full content"""
    cache_key = f"walkthrough:id:{walkthrough_id}"
    cached_data = await get_cache(cache_key)
    if cached_data:
        return cached_data
    
    result = await db.execute(
        select(WalkthroughModel).where(WalkthroughModel.id == walkthrough_id)
    )
    walkthrough = result.scalar_one_or_none()
    
    if not walkthrough:
        raise HTTPException(status_code=404, detail="Walkthrough not found")
    
    response = {
        "id": walkthrough.id,
        "slug": walkthrough.slug,
        "title": walkthrough.title,
        "subtitle": walkthrough.subtitle,
        "level": walkthrough.level,
        "mission_type": walkthrough.mission_type,
        "objectives": walkthrough.objectives,
        "content": walkthrough.content,
        "display_order": walkthrough.display_order,
        "thumbnail_url": walkthrough.thumbnail_url
    }
    
    await set_cache(cache_key, response, ttl=settings.CACHE_TTL_LONG)
    return response

@router.get("/type/{walkthrough_type}", response_model=List[WalkthroughListItem])
@limiter.limit(settings.RATE_LIMIT_PER_MINUTE)
async def get_walkthroughs_by_type(walkthrough_type: str, request: Request, db: AsyncSession = Depends(get_db)):
    """Get walkthroughs by type (main_story, side_quest, etc.)"""
    
    # Normalize: side-quests → side-quest
    normalized_type = walkthrough_type
    if normalized_type.endswith('es'):
        normalized_type = normalized_type[:-2]  # bosses → boss (if needed)
    elif normalized_type.endswith('s'):
        normalized_type = normalized_type[:-1]  # side-quests → side-quest
    
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

    request.state.db_time = (time.time() - db_start) * 1000  # in ms

    response = [{
        "id": w.id,
        "slug": w.slug,
        "title": w.title,
        "subtitle": w.subtitle,
        "level": w.level,
        "mission_type": w.mission_type,
        "display_order": w.display_order,
        "thumbnail_url": w.thumbnail_url
    } for w in walkthroughs]
    
    await set_cache(cache_key, response, ttl=settings.CACHE_TTL_LONG)
    return response

@router.get("/type/{walkthrough_type}/{slug}", response_model=WalkthroughSchema)
@limiter.limit(settings.RATE_LIMIT_PER_MINUTE)
async def get_walkthrough_by_slug(
    walkthrough_type: str, 
    slug: str, 
    request: Request, 
    db: AsyncSession = Depends(get_db)
):
    """Get specific walkthrough by type and slug with full content"""
    
    # Normalize: side-quests → side-quest
    normalized_type = walkthrough_type
    if normalized_type.endswith('es'):
        normalized_type = normalized_type[:-2]
    elif normalized_type.endswith('s'):
        normalized_type = normalized_type[:-1]
    
    cache_key = f"walkthrough:{normalized_type}:{slug}"
    cached_data = await get_cache(cache_key)
    if cached_data:
        request.state.cache_status = "HIT"
        return cached_data
    
    request.state.cache_status = "MISS"
    db_start = time.time()
    
    # Try exact match first
    result = await db.execute(
        select(WalkthroughModel).where(
            (WalkthroughModel.mission_type == normalized_type) &
            (WalkthroughModel.slug == slug)
        )
    )
    walkthrough = result.scalar_one_or_none()
    
    # Try case-insensitive if no exact match
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
    
    request.state.db_time = (time.time() - db_start) * 1000  # in ms
    
    response = {
        "id": walkthrough.id,
        "slug": walkthrough.slug,
        "title": walkthrough.title,
        "subtitle": walkthrough.subtitle,
        "level": walkthrough.level,
        "mission_type": walkthrough.mission_type,
        "objectives": walkthrough.objectives,
        "content": walkthrough.content,
        "display_order": walkthrough.display_order,
        "thumbnail_url": walkthrough.thumbnail_url
    }
    
    await set_cache(cache_key, response, ttl=settings.CACHE_TTL_LONG)
    return response

@router.get("/level/{level_name}", response_model=List[WalkthroughListItem])
@limiter.limit(settings.RATE_LIMIT_PER_MINUTE)
async def get_walkthroughs_by_level(level_name: str, request: Request, db: AsyncSession = Depends(get_db)):
    """Get walkthroughs by level"""
    cache_key = f"walkthroughs:level:{level_name}"
    cached_data = await get_cache(cache_key)
    if cached_data:
        return cached_data
    
    # Try exact match first
    result = await db.execute(
        select(WalkthroughModel).where(WalkthroughModel.level == level_name)
    )
    walkthroughs = result.scalars().all()
    
    # Try case-insensitive if no exact match
    if not walkthroughs:
        formatted_name = level_name.replace('-', ' ').title()
        result = await db.execute(
            select(WalkthroughModel).where(WalkthroughModel.level.ilike(formatted_name))
        )
        walkthroughs = result.scalars().all()
    
    if not walkthroughs:
        raise HTTPException(status_code=404, detail="No walkthroughs found for this level")
    
    response = [{
        "id": w.id,
        "slug": w.slug,
        "title": w.title,
        "subtitle": w.subtitle,
        "level": w.level,
        "mission_type": w.mission_type,
        "display_order": w.display_order,
        "thumbnail_url": w.thumbnail_url
    } for w in walkthroughs]
    
    await set_cache(cache_key, response, ttl=settings.CACHE_TTL_LONG)
    return response
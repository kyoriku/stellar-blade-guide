from fastapi import APIRouter, HTTPException, Depends, Request
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from typing import List

from db.database import get_db
from models.collectibles import Level, Location
from schemas.collectibles import LevelResponse, LocationResponse
from core.cache import get_cache, set_cache
from core.security import limiter
from config.settings import settings

router = APIRouter(prefix="/levels", tags=["levels"])

@router.get("/", response_model=List[LevelResponse])
@limiter.limit(settings.RATE_LIMIT_PER_MINUTE)
async def get_all_levels(request: Request, db: AsyncSession = Depends(get_db)):
    cache_key = "levels:all"
    cached_data = await get_cache(cache_key)
    if cached_data:
        return cached_data
    
    result = await db.execute(select(Level).order_by(Level.display_order))
    levels = result.scalars().all()
    response = [{"id": l.id, "name": l.name, "display_order": l.display_order} for l in levels]
    await set_cache(cache_key, response, ttl=settings.CACHE_TTL_SHORT)
    return response

@router.get("/{level_name}/locations", response_model=List[LocationResponse])
@limiter.limit(settings.RATE_LIMIT_PER_MINUTE)
async def get_locations_by_level(level_name: str, request: Request, db: AsyncSession = Depends(get_db)):
    cache_key = f"locations:level:{level_name}"
    cached_data = await get_cache(cache_key)
    if cached_data:
        return cached_data
    
    result = await db.execute(select(Level).filter(Level.name == level_name))
    level = result.scalar_one_or_none()
    
    if not level:
        formatted_name = level_name.replace('-', ' ').title()
        result = await db.execute(select(Level).filter(Level.name.ilike(formatted_name)))
        level = result.scalar_one_or_none()

    if not level:
        raise HTTPException(status_code=404, detail="Level not found")

    result = await db.execute(select(Location).filter(Location.level_id == level.id).order_by(Location.display_order))
    locations = result.scalars().all()
    response = [{"id": loc.id, "name": loc.name, "display_order": loc.display_order} for loc in locations]
    await set_cache(cache_key, response, ttl=settings.CACHE_TTL_LONG)
    return response
import time
import logging
from fastapi import APIRouter, HTTPException, Depends, Request
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from sqlalchemy.orm import joinedload
from typing import List

from app.db.database import get_db
from app.models.collectibles import Location, Collectible
from app.schemas.collectibles import (
    CollectibleResponse,
    CollectibleWithLocationResponse,
)
from app.core.cache import get_cache, set_cache
from app.core.security import limiter
from app.config.settings import settings
from app.services.collectibles import (
    _serialize_collectible,
    _resolve_level,
    _get_items_by_type,
)

logger = logging.getLogger(__name__)
collectibles_router = APIRouter(prefix="/collectibles", tags=["collectibles"])
upgrades_router = APIRouter(prefix="/upgrades", tags=["upgrades"])
cosmetics_router = APIRouter(prefix="/cosmetics", tags=["cosmetics"])
materials_router = APIRouter(prefix="/materials", tags=["materials"])
levels_router = APIRouter(prefix="/levels", tags=["levels"])


@levels_router.get("/{level_name}")
@limiter.limit(settings.RATE_LIMIT_PER_MINUTE)
async def get_collectibles_by_level(level_name: str, request: Request, db: AsyncSession = Depends(get_db)):
    """Get all collectibles for a level, grouped by location."""
    cache_key = f"collectibles:level:{level_name}"
    cached_data = await get_cache(cache_key)
    if cached_data:
        request.state.cache_status = "HIT"
        return cached_data

    request.state.cache_status = "MISS"
    db_start = time.time()

    level = await _resolve_level(level_name, db)

    stmt = select(Location).filter(Location.level_id == level.id).options(
        joinedload(Location.collectibles).joinedload(Collectible.types),
        joinedload(Location.collectibles).joinedload(Collectible.images)
    ).order_by(Location.display_order)

    result = await db.execute(stmt)
    locations = result.unique().scalars().all()

    request.state.db_time = (time.time() - db_start) * 1000

    response = []
    for loc in locations:
        collectibles = sorted(loc.collectibles, key=lambda c: c.display_order)
        response.append({
            "level_id": level.id,
            "location_id": loc.id,
            "location_name": loc.name,
            "location_order": loc.display_order,
            "collectibles": [_serialize_collectible(c) for c in collectibles]
        })

    await set_cache(cache_key, response, ttl=settings.CACHE_TTL)
    return response


@levels_router.get("/{level_name}/{location_name}", response_model=List[CollectibleResponse])
@limiter.limit(settings.RATE_LIMIT_PER_MINUTE)
async def get_collectibles_by_location(level_name: str, location_name: str, request: Request, db: AsyncSession = Depends(get_db)):
    """Get collectibles for a specific location within a level."""
    cache_key = f"collectibles:level:{level_name}:location:{location_name}"
    cached_data = await get_cache(cache_key)
    if cached_data:
        return cached_data

    level = await _resolve_level(level_name, db)

    result = await db.execute(
        select(Location).filter(Location.level_id == level.id, Location.name == location_name)
    )
    location = result.scalar_one_or_none()

    if not location:
        formatted = location_name.replace('-', ' ').title()
        result = await db.execute(
            select(Location).filter(Location.level_id == level.id, Location.name.ilike(formatted))
        )
        location = result.scalar_one_or_none()

    if not location:
        raise HTTPException(status_code=404, detail="Location not found")

    stmt = select(Collectible).filter(Collectible.location_id == location.id).options(
        joinedload(Collectible.types),
        joinedload(Collectible.images)
    ).order_by(Collectible.display_order)

    result = await db.execute(stmt)
    collectibles = result.unique().scalars().all()

    if not collectibles:
        raise HTTPException(status_code=404, detail="No collectibles found for this location")

    response = [_serialize_collectible(c) for c in collectibles]
    await set_cache(cache_key, response, ttl=settings.CACHE_TTL)
    return response


@collectibles_router.get("/", response_model=List[CollectibleWithLocationResponse])
@limiter.limit(settings.RATE_LIMIT_PER_MINUTE)
async def get_all_collectibles(request: Request, db: AsyncSession = Depends(get_db)):
    """Get all collectibles with level and location info."""
    cache_key = "collectibles:all"
    cached_data = await get_cache(cache_key)
    if cached_data:
        return cached_data

    stmt = select(Collectible).options(
        joinedload(Collectible.types),
        joinedload(Collectible.location).joinedload(Location.level),
        joinedload(Collectible.images)
    ).order_by(Collectible.display_order)

    result = await db.execute(stmt)
    collectibles = result.unique().scalars().all()

    response = [{
        **_serialize_collectible(c),
        "level": c.location.level.name,
        "location": c.location.name,
    } for c in collectibles]

    await set_cache(cache_key, response, ttl=settings.CACHE_TTL)
    return response


@collectibles_router.get("/{type_name}")
@limiter.limit(settings.RATE_LIMIT_PER_MINUTE)
async def get_collectibles_by_type(type_name: str, request: Request, db: AsyncSession = Depends(get_db)):
    """Get collectibles by type (collectibles category only)."""
    return await _get_items_by_type(type_name, "collectibles", request, db)


@upgrades_router.get("/{type_name}")
@limiter.limit(settings.RATE_LIMIT_PER_MINUTE)
async def get_upgrades_by_type(type_name: str, request: Request, db: AsyncSession = Depends(get_db)):
    """Get upgrades by type."""
    return await _get_items_by_type(type_name, "upgrades", request, db)


@cosmetics_router.get("/{type_name}")
@limiter.limit(settings.RATE_LIMIT_PER_MINUTE)
async def get_cosmetics_by_type(type_name: str, request: Request, db: AsyncSession = Depends(get_db)):
    """Get cosmetics by type."""
    return await _get_items_by_type(type_name, "cosmetics", request, db)


@materials_router.get("/{type_name}")
@limiter.limit(settings.RATE_LIMIT_PER_MINUTE)
async def get_materials_by_type(type_name: str, request: Request, db: AsyncSession = Depends(get_db)):
    """Get materials by type."""
    return await _get_items_by_type(type_name, "materials", request, db)
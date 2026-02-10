import time
import logging
from fastapi import APIRouter, HTTPException, Depends, Request
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from sqlalchemy.orm import joinedload
from typing import List

from db.database import get_db
from models.collectibles import Level, Location, CollectibleType, Collectible
from schemas.collectibles import (
    CollectibleResponse,
    CollectibleWithLocationResponse,
    TypeResponse
)
from core.cache import get_cache, set_cache
from core.security import limiter
from config.settings import settings
# from services.collectibles_service import get_collectibles_by_type

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/collectibles", tags=["collectibles"])

@router.get("/", response_model=List[CollectibleWithLocationResponse])
@limiter.limit(settings.RATE_LIMIT_PER_MINUTE)
async def get_all_collectibles(request: Request, db: AsyncSession = Depends(get_db)):
    """Get all collectibles - cached for 30 minutes"""
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
        "id": c.id,
        "title": c.title,
        "description": c.description,
        "display_order": c.display_order,
        "types": [t.name for t in c.types],
        "level": c.location.level.name,
        "location": c.location.name,
        "images": [{"id": img.id, "url": img.cloudinary_url, "alt": img.alt_text, "order": img.display_order} for img in c.images]
    } for c in collectibles]
    
    await set_cache(cache_key, response, ttl=settings.CACHE_TTL)
    return response

@router.get("/levels/{level_name}")
@limiter.limit(settings.RATE_LIMIT_PER_MINUTE)
async def get_collectibles_by_level(level_name: str, request: Request, db: AsyncSession = Depends(get_db)):
    """Get collectibles by level - cached for 30 minutes"""
    cache_key = f"collectibles:level:{level_name}"
    cached_data = await get_cache(cache_key)
    if cached_data:
        request.state.cache_status = "HIT"
        return cached_data

    request.state.cache_status = "MISS"
    db_start = time.time()

    result = await db.execute(select(Level).filter(Level.name == level_name))
    level = result.scalar_one_or_none()
    
    if not level:
        formatted_name = level_name.replace('-', ' ').title()
        result = await db.execute(select(Level).filter(Level.name.ilike(formatted_name)))
        level = result.scalar_one_or_none()
    
    if not level:
        raise HTTPException(status_code=404, detail="Level not found")
    
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
            "location_id": loc.id,
            "location_name": loc.name,
            "location_order": loc.display_order,
            "collectibles": [{
                "id": c.id,
                "title": c.title,
                "description": c.description,
                "display_order": c.display_order,
                "types": [t.name for t in c.types],
                "images": [{"id": img.id, "url": img.cloudinary_url, "alt": img.alt_text, "order": img.display_order} for img in c.images]
            } for c in collectibles]
        })

    await set_cache(cache_key, response, ttl=settings.CACHE_TTL)
    return response

@router.get("/types/{type_name}")
@limiter.limit(settings.RATE_LIMIT_PER_MINUTE)
async def get_collectibles_by_type(type_name: str, request: Request, db: AsyncSession = Depends(get_db)):
    """Get collectibles by type - cached for 30 minutes"""
    cache_key = f"collectibles:type:{type_name}"
    cached_data = await get_cache(cache_key)
    if cached_data:
        request.state.cache_status = "HIT"
        return cached_data

    request.state.cache_status = "MISS"
    db_start = time.time()

    result = await db.execute(select(CollectibleType).filter(CollectibleType.name == type_name))
    collectible_type = result.scalars().first()
    
    if not collectible_type:
        formatted_type = type_name.replace('-', ' ').title()
        if formatted_type.endswith('es'):
            formatted_type = formatted_type[:-2]
        elif formatted_type.endswith('s'):
            formatted_type = formatted_type[:-1]
        result = await db.execute(select(CollectibleType).filter(CollectibleType.name.ilike(f"%{formatted_type}%")))
        collectible_type = result.scalars().first()
    
    if not collectible_type:
        raise HTTPException(status_code=404, detail="Type not found")
    
    stmt = select(Collectible).join(
        Collectible.types
    ).filter(
        CollectibleType.id == collectible_type.id
    ).options(
        joinedload(Collectible.types),
        joinedload(Collectible.location).joinedload(Location.level),
        joinedload(Collectible.images)
    ).order_by(Collectible.display_order)
    
    result = await db.execute(stmt)
    collectibles = result.unique().scalars().all()
    
    if not collectibles:
        raise HTTPException(status_code=404, detail="No collectibles found for this type")
    
    levels_dict = {}
    for c in collectibles:
        level = c.location.level
        location = c.location
        
        if level.id not in levels_dict:
            levels_dict[level.id] = {
                "level_id": level.id,
                "level_name": level.name,
                "level_order": level.display_order,
                "locations": {}
            }
        
        if location.id not in levels_dict[level.id]["locations"]:
            levels_dict[level.id]["locations"][location.id] = {
                "location_id": location.id,
                "location_name": location.name,
                "location_order": location.display_order,
                "collectibles": []
            }
        
        levels_dict[level.id]["locations"][location.id]["collectibles"].append({
            "id": c.id,
            "title": c.title,
            "description": c.description,
            "display_order": c.display_order,
            "types": [t.name for t in c.types],
            "images": [{"id": img.id, "url": img.cloudinary_url, "alt": img.alt_text, "order": img.display_order} for img in c.images]
        })
    
    request.state.db_time = (time.time() - db_start) * 1000
    
    response = []
    for level_data in sorted(levels_dict.values(), key=lambda x: x["level_order"]):
        level_data["locations"] = sorted(level_data["locations"].values(), key=lambda x: x["location_order"])
        response.append(level_data)

    await set_cache(cache_key, response, ttl=settings.CACHE_TTL)
    return response

@router.get("/levels/{level_name}/locations/{location_name}", response_model=List[CollectibleResponse])
@limiter.limit(settings.RATE_LIMIT_PER_MINUTE)
async def get_collectibles_by_location(level_name: str, location_name: str, request: Request, db: AsyncSession = Depends(get_db)):
    """Get collectibles by location - cached for 60 minutes"""
    cache_key = f"collectibles:level:{level_name}:location:{location_name}"
    cached_data = await get_cache(cache_key)
    if cached_data:
        return cached_data
    
    result = await db.execute(select(Level).filter(Level.name == level_name))
    level = result.scalar_one_or_none()
    
    if not level:
        formatted_level = level_name.replace('-', ' ').title()
        result = await db.execute(select(Level).filter(Level.name.ilike(formatted_level)))
        level = result.scalar_one_or_none()
    
    if not level:
        raise HTTPException(status_code=404, detail="Level not found")

    result = await db.execute(select(Location).filter(
        Location.level_id == level.id,
        Location.name == location_name
    ))
    location = result.scalar_one_or_none()
    
    if not location:
        formatted_location = location_name.replace('-', ' ').title()
        result = await db.execute(select(Location).filter(
            Location.level_id == level.id,
            Location.name.ilike(formatted_location)
        ))
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
    
    response = [{
        "id": c.id,
        "title": c.title,
        "description": c.description,
        "display_order": c.display_order,
        "types": [t.name for t in c.types],
        "images": [{"id": img.id, "url": img.cloudinary_url, "alt": img.alt_text, "order": img.display_order} for img in c.images]
    } for c in collectibles]

    await set_cache(cache_key, response, ttl=settings.CACHE_TTL)
    return response
import time
import logging
from fastapi import APIRouter, HTTPException, Depends, Request
from sqlalchemy.orm import Session, joinedload
from typing import List

from app.api.deps import get_db
from app.models.collectibles import Level, Location, CollectibleType, Collectible
from app.schemas.collectibles import (
    CollectibleCreate,
    CollectibleResponse,
    CollectibleWithLocationResponse,
    TypeResponse
)
from app.core.cache import get_cache, set_cache
from app.core.security import limiter
from app.config import settings

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/collectibles", tags=["collectibles"])

@router.get("/types", response_model=List[TypeResponse])
@limiter.limit(settings.RATE_LIMIT_PER_MINUTE)
def get_all_collectible_types(request: Request, db: Session = Depends(get_db)):
    """Get all collectible types - cached for 10 minutes"""
    cache_key = "types:all"
    cached_data = get_cache(cache_key)
    if cached_data:
        return cached_data
    
    types = db.query(CollectibleType).order_by(CollectibleType.name).all()
    result = [{"id": t.id, "name": t.name} for t in types]
    set_cache(cache_key, result, ttl=settings.CACHE_TTL_SHORT)
    return result

@router.get("/", response_model=List[CollectibleWithLocationResponse])
@limiter.limit(settings.RATE_LIMIT_PER_MINUTE)
def get_all_collectibles(request: Request, db: Session = Depends(get_db)):
    """Get all collectibles - cached for 30 minutes"""
    cache_key = "collectibles:all"
    cached_data = get_cache(cache_key)
    if cached_data:
        return cached_data
    
    collectibles = db.query(Collectible).options(
        joinedload(Collectible.types),
        joinedload(Collectible.location).joinedload(Location.level),
        joinedload(Collectible.images)
    ).order_by(Collectible.display_order).all()
    
    result = [{
        "id": c.id,
        "title": c.title,
        "description": c.description,
        "display_order": c.display_order,
        "types": [t.name for t in c.types],
        "level": c.location.level.name,
        "location": c.location.name,
        "images": [{"id": img.id, "url": img.cloudinary_url, "alt": img.alt_text, "order": img.display_order} for img in c.images]
    } for c in collectibles]
    
    set_cache(cache_key, result, ttl=settings.CACHE_TTL_MEDIUM)
    print (result[0])
    return result

@router.get("/levels/{level_name}")
@limiter.limit(settings.RATE_LIMIT_PER_MINUTE)
def get_collectibles_by_level(level_name: str, request: Request, db: Session = Depends(get_db)):
    """Get collectibles by level - cached for 30 minutes"""
    cache_key = f"collectibles:level:{level_name}"
    cached_data = get_cache(cache_key, endpoint=request.url.path)
    if cached_data:
        request.state.cache_status = "HIT"
        return cached_data

    request.state.cache_status = "MISS"

    db_start = time.time()

    level = db.query(Level).filter(Level.name == level_name).first()
    if not level:
        formatted_name = level_name.replace('-', ' ').title()
        level = db.query(Level).filter(Level.name.ilike(formatted_name)).first()
    
    if not level:
        raise HTTPException(status_code=404, detail="Level not found")
    
    locations = db.query(Location).filter(Location.level_id == level.id).options(
        joinedload(Location.collectibles).joinedload(Collectible.types),
        joinedload(Location.collectibles).joinedload(Collectible.images)
    ).order_by(Location.display_order).all()
    
    request.state.db_time = (time.time() - db_start) * 1000

    result = []
    for loc in locations:
        collectibles = sorted(loc.collectibles, key=lambda c: c.display_order)
        result.append({
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

    set_cache(cache_key, result, ttl=settings.CACHE_TTL_SHORT, endpoint=request.url.path)
    return result

@router.get("/types/{type_name}")
@limiter.limit(settings.RATE_LIMIT_PER_MINUTE)
def get_collectibles_by_type(type_name: str, request: Request, db: Session = Depends(get_db)):
    """Get collectibles by type - cached for 30 minutes"""
    cache_key = f"collectibles:type:{type_name}"
    cached_data = get_cache(cache_key)
    if cached_data:
        request.state.cache_status = "HIT"
        return cached_data

    request.state.cache_status = "MISS"

    db_start = time.time()

    collectible_type = db.query(CollectibleType).filter(CollectibleType.name == type_name).first()
    if not collectible_type:
        formatted_type = type_name.replace('-', ' ').title()
        if formatted_type.endswith('es'):
            formatted_type = formatted_type[:-2]
        elif formatted_type.endswith('s'):
            formatted_type = formatted_type[:-1]
        collectible_type = db.query(CollectibleType).filter(CollectibleType.name.ilike(f"%{formatted_type}%")).first()
    
    if not collectible_type:
        raise HTTPException(status_code=404, detail="Type not found")
    
    collectibles = db.query(Collectible).join(
        Collectible.types
    ).filter(
        CollectibleType.id == collectible_type.id
    ).options(
        joinedload(Collectible.types),
        joinedload(Collectible.location).joinedload(Location.level),
        joinedload(Collectible.images)
    ).order_by(Collectible.display_order).all()
    
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
    
    result = []
    for level_data in sorted(levels_dict.values(), key=lambda x: x["level_order"]):
        level_data["locations"] = sorted(level_data["locations"].values(), key=lambda x: x["location_order"])
        result.append(level_data)

    set_cache(cache_key, result, ttl=settings.CACHE_TTL_SHORT)
    return result

@router.get("/{level_name}/{location_name}", response_model=List[CollectibleResponse])
@limiter.limit(settings.RATE_LIMIT_PER_MINUTE)
def get_collectibles_by_location(level_name: str, location_name: str, request: Request, db: Session = Depends(get_db)):
    """Get collectibles by location - cached for 60 minutes"""
    cache_key = f"collectibles:level:{level_name}:location:{location_name}"
    cached_data = get_cache(cache_key)
    if cached_data:
        return cached_data
    
    level = db.query(Level).filter(Level.name == level_name).first()
    if not level:
        formatted_level = level_name.replace('-', ' ').title()
        level = db.query(Level).filter(Level.name.ilike(formatted_level)).first()
    if not level:
        raise HTTPException(status_code=404, detail="Level not found")

    location = db.query(Location).filter(
        Location.level_id == level.id,
        Location.name == location_name
    ).first()
    if not location:
        formatted_location = location_name.replace('-', ' ').title()
        location = db.query(Location).filter(
            Location.level_id == level.id,
            Location.name.ilike(formatted_location)
        ).first()
    if not location:
        raise HTTPException(status_code=404, detail="Location not found")

    collectibles = db.query(Collectible).filter(Collectible.location_id == location.id).options(
        joinedload(Collectible.types),
        joinedload(Collectible.images)
    ).order_by(Collectible.display_order).all()
    
    if not collectibles:
        raise HTTPException(status_code=404, detail="No collectibles found for this location")
    
    result = [{
        "id": c.id,
        "title": c.title,
        "description": c.description,
        "display_order": c.display_order,
        "types": [t.name for t in c.types],
        "images": [{"id": img.id, "url": img.cloudinary_url, "alt": img.alt_text, "order": img.display_order} for img in c.images]
    } for c in collectibles]

    set_cache(cache_key, result, ttl=settings.CACHE_TTL_LONG)
    return result
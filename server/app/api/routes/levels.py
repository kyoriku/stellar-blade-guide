from fastapi import APIRouter, HTTPException, Depends, Request
from sqlalchemy.orm import Session
from typing import List

from app.api.deps import get_db
from app.models.collectibles import Level, Location
from app.schemas.collectibles import LevelResponse, LocationResponse
from app.core.cache import get_cache, set_cache
from app.core.security import limiter
from app.config import settings

router = APIRouter(prefix="/levels", tags=["levels"])

@router.get("/", response_model=List[LevelResponse])
@limiter.limit(settings.RATE_LIMIT_PER_MINUTE)
def get_all_levels(request: Request, db: Session = Depends(get_db)):
    """Get all levels - cached for 60 minutes"""
    cache_key = "levels:all"
    cached_data = get_cache(cache_key)
    if cached_data:
        return cached_data
    
    levels = db.query(Level).order_by(Level.display_order).all()
    result = [{"id": l.id, "name": l.name, "display_order": l.display_order} for l in levels]
    set_cache(cache_key, result, ttl=settings.CACHE_TTL_SHORT)
    return result

@router.get("/{level_name}/locations", response_model=List[LocationResponse])
@limiter.limit(settings.RATE_LIMIT_PER_MINUTE)
def get_locations_by_level(level_name: str, request: Request, db: Session = Depends(get_db)):
    """Get locations by level - cached for 60 minutes"""
    cache_key = f"locations:level:{level_name}"
    cached_data = get_cache(cache_key)
    if cached_data:
        return cached_data
    
    level = db.query(Level).filter(Level.name == level_name).first()
    if not level:
        formatted_name = level_name.replace('-', ' ').title()
        level = db.query(Level).filter(Level.name.ilike(formatted_name)).first()
    
    if not level:
        raise HTTPException(status_code=404, detail="Level not found")
    
    locations = db.query(Location).filter(Location.level_id == level.id).order_by(Location.display_order).all()
    result = [{"id": loc.id, "name": loc.name, "display_order": loc.display_order} for loc in locations]
    set_cache(cache_key, result, ttl=settings.CACHE_TTL_LONG)
    return result
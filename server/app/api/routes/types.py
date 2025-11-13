from fastapi import APIRouter, Depends, Request
from sqlalchemy.orm import Session
from typing import List

from app.api.deps import get_db
from app.models.collectibles import CollectibleType
from app.schemas.collectibles import TypeResponse
from app.core.cache import get_cache, set_cache
from app.core.security import limiter
from app.config import settings

router = APIRouter(prefix="/types", tags=["types"])

@router.get("/", response_model=List[TypeResponse])
@limiter.limit(settings.RATE_LIMIT_PER_MINUTE)
def get_collectible_types(request: Request, db: Session = Depends(get_db)):
    """Get all collectible types - cached for 60 minutes"""
    cache_key = "types:all"
    cached_data = get_cache(cache_key)
    if cached_data:
        return cached_data
    
    types = db.query(CollectibleType).order_by(CollectibleType.name).all()
    result = [{"id": t.id, "name": t.name} for t in types]
    set_cache(cache_key, result, ttl=settings.CACHE_TTL_LONG)
    return result
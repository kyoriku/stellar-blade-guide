from fastapi import APIRouter, Depends, Request
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from typing import List

from db.database import get_db
from models.collectibles import CollectibleType
from schemas.collectibles import TypeResponse
from core.cache import get_cache, set_cache
from core.security import limiter
from config.settings import settings

router = APIRouter(prefix="/types", tags=["types"])

@router.get("/", response_model=List[TypeResponse])
@limiter.limit(settings.RATE_LIMIT_PER_MINUTE)
async def get_collectible_types(request: Request, db: AsyncSession = Depends(get_db)):
    cache_key = "types:all"
    cached_data = await get_cache(cache_key)
    if cached_data:
        return cached_data
    
    result = await db.execute(select(CollectibleType).order_by(CollectibleType.name))
    types = result.scalars().all()
    response = [{"id": t.id, "name": t.name} for t in types]
    await set_cache(cache_key, response, ttl=settings.CACHE_TTL_LONG)
    return response
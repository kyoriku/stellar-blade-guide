# # from fastapi import APIRouter, HTTPException, Depends
# # from sqlalchemy.orm import Session, joinedload
# # from database import get_db_session
# # from models import Level, Location, Collectible
# # from redis_config import get_cache, set_cache

# # router = APIRouter(prefix="/levels", tags=["levels"])

# # def get_db():
# #     db = get_db_session()
# #     try:
# #         yield db
# #     finally:
# #         db.close()

# # @router.get("/")
# # def get_all_levels(db: Session = Depends(get_db)):
# #     """Get all levels - cached for 10 minutes"""
# #     cache_key = "levels:all"
    
# #     cached_data = get_cache(cache_key)
# #     if cached_data:
# #         return cached_data
    
# #     levels = db.query(Level).order_by(Level.display_order).all()
# #     result = [{"id": l.id, "name": l.name, "display_order": l.display_order} for l in levels]
    
# #     set_cache(cache_key, result, expire=600)
    
# #     return result

# # @router.get("/{level_name}/locations")
# # def get_locations_by_level(level_name: str, db: Session = Depends(get_db)):
# #     """Get locations for a specific level - cached for 10 minutes"""
# #     cache_key = f"locations:level:{level_name}"
    
# #     cached_data = get_cache(cache_key)
# #     if cached_data:
# #         return cached_data
    
# #     level = db.query(Level).filter(Level.name == level_name).first()
    
# #     if not level:
# #         formatted_name = level_name.replace('-', ' ').title()
# #         level = db.query(Level).filter(Level.name.ilike(formatted_name)).first()
    
# #     if not level:
# #         raise HTTPException(status_code=404, detail="Level not found")
    
# #     locations = db.query(Location).filter(Location.level_id == level.id).order_by(Location.display_order).all()
# #     result = [{"id": loc.id, "name": loc.name, "display_order": loc.display_order} for loc in locations]
    
# #     set_cache(cache_key, result, expire=600)
    
# #     return result

# # @router.get("/{level_name}")
# # def get_collectibles_by_level(level_name: str, db: Session = Depends(get_db)):
# #     """Get all collectibles for a specific level, grouped by location - cached for 5 minutes"""
# #     cache_key = f"collectibles:level:{level_name}"
    
# #     cached_data = get_cache(cache_key)
# #     if cached_data:
# #         return cached_data
    
# #     level = db.query(Level).filter(Level.name == level_name).first()
    
# #     if not level:
# #         formatted_name = level_name.replace('-', ' ').title()
# #         level = db.query(Level).filter(Level.name.ilike(formatted_name)).first()
    
# #     if not level:
# #         raise HTTPException(status_code=404, detail="Level not found")
    
# #     locations = db.query(Location).filter(Location.level_id == level.id).options(
# #         joinedload(Location.collectibles).joinedload(Collectible.type),
# #         joinedload(Location.collectibles).joinedload(Collectible.images)
# #     ).order_by(Location.display_order).all()
    
# #     result = []
# #     for loc in locations:
# #         collectibles = sorted(loc.collectibles, key=lambda c: c.display_order)
# #         result.append({
# #             "location_id": loc.id,
# #             "location_name": loc.name,
# #             "location_order": loc.display_order,
# #             "collectibles": [{
# #                 "id": c.id,
# #                 "title": c.title,
# #                 "description": c.description,
# #                 "display_order": c.display_order,
# #                 "type": c.type.name,
# #                 "images": [{"id": img.id, "url": img.cloudinary_url, "alt": img.alt_text, "order": img.display_order} for img in c.images]
# #             } for c in collectibles]
# #         })
    
# #     set_cache(cache_key, result, expire=300)
    
# #     return result

# # @router.get("/{level_name}/locations/{location_name}/collectibles")
# # def get_collectibles_by_location(level_name: str, location_name: str, db: Session = Depends(get_db)):
# #     """Get collectibles for a specific location within a level - cached for 5 minutes"""
# #     cache_key = f"collectibles:level:{level_name}:location:{location_name}"
    
# #     cached_data = get_cache(cache_key)
# #     if cached_data:
# #         return cached_data
    
# #     level = db.query(Level).filter(Level.name == level_name).first()
# #     if not level:
# #         raise HTTPException(status_code=404, detail="Level not found")
    
# #     location = db.query(Location).filter(
# #         Location.level_id == level.id,
# #         Location.name == location_name
# #     ).first()
# #     if not location:
# #         raise HTTPException(status_code=404, detail="Location not found")
    
# #     collectibles = db.query(Collectible).filter(Collectible.location_id == location.id).options(
# #         joinedload(Collectible.type),
# #         joinedload(Collectible.images)
# #     ).order_by(Collectible.display_order).all()
    
# #     if not collectibles:
# #         raise HTTPException(status_code=404, detail="No collectibles found for this location")
    
# #     result = [{
# #         "id": c.id,
# #         "title": c.title,
# #         "description": c.description,
# #         "display_order": c.display_order,
# #         "type": c.type.name,
# #         "images": [{"id": img.id, "url": img.cloudinary_url, "alt": img.alt_text, "order": img.display_order} for img in c.images]
# #     } for c in collectibles]
    
# #     set_cache(cache_key, result, expire=300)
    
# #     return result

# from fastapi import APIRouter, HTTPException, Depends
# from sqlalchemy.orm import Session
# from database import get_db_session
# from models import Level, Location
# from redis_config import get_cache, set_cache

# router = APIRouter(prefix="/levels", tags=["levels"])

# def get_db():
#     db = get_db_session()
#     try:
#         yield db
#     finally:
#         db.close()

# @router.get("/")
# def get_all_levels(db: Session = Depends(get_db)):
#     """Get all levels - cached for 60 minutes"""
#     cache_key = "levels:all"
#     cached_data = get_cache(cache_key)
#     if cached_data:
#         return cached_data
    
#     levels = db.query(Level).order_by(Level.display_order).all()
#     result = [{"id": l.id, "name": l.name, "display_order": l.display_order} for l in levels]
#     set_cache(cache_key, result, expire=600)
#     return result

# @router.get("/{level_name}/locations")
# def get_locations_by_level(level_name: str, db: Session = Depends(get_db)):
#     """Get locations by level - cached for 60 minutes"""
#     cache_key = f"locations:level:{level_name}"
#     cached_data = get_cache(cache_key)
#     if cached_data:
#         return cached_data
    
#     level = db.query(Level).filter(Level.name == level_name).first()
#     if not level:
#         formatted_name = level_name.replace('-', ' ').title()
#         level = db.query(Level).filter(Level.name.ilike(formatted_name)).first()
    
#     if not level:
#         raise HTTPException(status_code=404, detail="Level not found")
    
#     locations = db.query(Location).filter(Location.level_id == level.id).order_by(Location.display_order).all()
#     result = [{"id": loc.id, "name": loc.name, "display_order": loc.display_order} for loc in locations]
#     set_cache(cache_key, result, expire=3600)
#     return result

from fastapi import APIRouter, HTTPException, Depends, Request
from sqlalchemy.orm import Session
from database import get_db_session
from models import Level, Location
from redis_config import get_cache, set_cache
from slowapi import Limiter
from slowapi.util import get_remote_address

limiter = Limiter(key_func=get_remote_address)

router = APIRouter(prefix="/levels", tags=["levels"])

def get_db():
    db = get_db_session()
    try:
        yield db
    finally:
        db.close()

@router.get("/")
@limiter.limit("100/minute")
def get_all_levels(request: Request, db: Session = Depends(get_db)):
    """Get all levels - cached for 60 minutes"""
    cache_key = "levels:all"
    cached_data = get_cache(cache_key)
    if cached_data:
        return cached_data
    
    levels = db.query(Level).order_by(Level.display_order).all()
    result = [{"id": l.id, "name": l.name, "display_order": l.display_order} for l in levels]
    set_cache(cache_key, result, expire=600)
    return result

@router.get("/{level_name}/locations")
@limiter.limit("100/minute")
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
    set_cache(cache_key, result, expire=3600)
    return result
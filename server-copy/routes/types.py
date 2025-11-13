# from fastapi import APIRouter, HTTPException, Depends
# from sqlalchemy.orm import Session, joinedload
# from database import get_db_session
# from models import CollectibleType, Collectible, Location
# from redis_config import get_cache, set_cache

# router = APIRouter(prefix="/types", tags=["types"])

# def get_db():
#     db = get_db_session()
#     try:
#         yield db
#     finally:
#         db.close()

# @router.get("/")
# def get_all_types(db: Session = Depends(get_db)):
#     """Get all collectible types - cached for 10 minutes"""
#     cache_key = "types:all"
    
#     cached_data = get_cache(cache_key)
#     if cached_data:
#         return cached_data
    
#     types = db.query(CollectibleType).order_by(CollectibleType.name).all()
#     result = [{"id": t.id, "name": t.name} for t in types]
    
#     set_cache(cache_key, result, expire=600)
    
#     return result

# @router.get("/{type_name}")
# def get_collectibles_by_type(type_name: str, db: Session = Depends(get_db)):
#     """Get all collectibles of a specific type, organized by level and location - cached for 5 minutes"""
#     cache_key = f"collectibles:type:{type_name}"
    
#     cached_data = get_cache(cache_key)
#     if cached_data:
#         return cached_data
    
#     collectible_type = db.query(CollectibleType).filter(CollectibleType.name == type_name).first()
    
#     if not collectible_type:
#         formatted_type = type_name.replace('-', ' ').title()
#         if formatted_type.endswith('s'):
#             formatted_type = formatted_type[:-1]
#         collectible_type = db.query(CollectibleType).filter(CollectibleType.name.ilike(f"%{formatted_type}%")).first()
    
#     if not collectible_type:
#         raise HTTPException(status_code=404, detail="Type not found")
    
#     collectibles = db.query(Collectible).filter(Collectible.type_id == collectible_type.id).options(
#         joinedload(Collectible.location).joinedload(Location.level),
#         joinedload(Collectible.images)
#     ).order_by(Collectible.display_order).all()
    
#     if not collectibles:
#         raise HTTPException(status_code=404, detail="No collectibles found for this type")
    
#     levels_dict = {}
#     for c in collectibles:
#         level = c.location.level
#         location = c.location
        
#         if level.id not in levels_dict:
#             levels_dict[level.id] = {
#                 "level_id": level.id,
#                 "level_name": level.name,
#                 "level_order": level.display_order,
#                 "locations": {}
#             }
        
#         if location.id not in levels_dict[level.id]["locations"]:
#             levels_dict[level.id]["locations"][location.id] = {
#                 "location_id": location.id,
#                 "location_name": location.name,
#                 "location_order": location.display_order,
#                 "collectibles": []
#             }
        
#         levels_dict[level.id]["locations"][location.id]["collectibles"].append({
#             "id": c.id,
#             "title": c.title,
#             "description": c.description,
#             "display_order": c.display_order,
#             "type": c.type.name,
#             "images": [{"id": img.id, "url": img.cloudinary_url, "alt": img.alt_text, "order": img.display_order} for img in c.images]
#         })
    
#     result = []
#     for level_data in sorted(levels_dict.values(), key=lambda x: x["level_order"]):
#         level_data["locations"] = sorted(level_data["locations"].values(), key=lambda x: x["location_order"])
#         result.append(level_data)
    
#     set_cache(cache_key, result, expire=300)
    
#     return result

from fastapi import APIRouter, HTTPException, Depends
from sqlalchemy.orm import Session
from database import get_db_session
from models import CollectibleType
from redis_config import get_cache, set_cache

router = APIRouter(prefix="/types", tags=["types"])

def get_db():
    db = get_db_session()
    try:
        yield db
    finally:
        db.close()

@router.get("/")
def get_collectible_types(db: Session = Depends(get_db)):
    """Get all collectible types - cached for 60 minutes"""
    cache_key = "types:all"
    cached_data = get_cache(cache_key)
    if cached_data:
        return cached_data
    
    types = db.query(CollectibleType).order_by(CollectibleType.name).all()
    result = [{"id": t.id, "name": t.name} for t in types]
    set_cache(cache_key, result, expire=3600)
    return result
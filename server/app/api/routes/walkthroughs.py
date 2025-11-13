# from fastapi import APIRouter, HTTPException, Depends, Request
# from sqlalchemy.orm import Session
# from typing import List

# from app.api.deps import get_db
# from app.models.walkthroughs import Walkthrough
# from app.schemas.walkthroughs import WalkthroughResponse, WalkthroughListItem
# from app.core.cache import get_cache, set_cache
# from app.core.security import limiter
# from app.config import settings

# router = APIRouter(prefix="/walkthroughs", tags=["walkthroughs"])

# @router.get("/", response_model=List[WalkthroughListItem])
# @limiter.limit(settings.RATE_LIMIT_PER_MINUTE)
# def get_all_walkthroughs(request: Request, db: Session = Depends(get_db)):
#     """Get all walkthroughs (summary view)"""
#     cache_key = "walkthroughs:all"
#     cached_data = get_cache(cache_key)
#     if cached_data:
#         return cached_data
    
#     walkthroughs = db.query(Walkthrough).order_by(Walkthrough.display_order).all()
#     result = [{
#         "id": w.id,
#         "type": w.type,
#         "level": w.level,
#         "title": w.title,
#         "subtitle": w.subtitle,
#         "display_order": w.display_order
#     } for w in walkthroughs]
    
#     set_cache(cache_key, result, ttl=settings.CACHE_TTL_LONG)
#     return result

# @router.get("/{walkthrough_id}", response_model=WalkthroughResponse)
# @limiter.limit(settings.RATE_LIMIT_PER_MINUTE)
# def get_walkthrough_by_id(walkthrough_id: int, request: Request, db: Session = Depends(get_db)):
#     """Get specific walkthrough with full steps"""
#     cache_key = f"walkthrough:id:{walkthrough_id}"
#     cached_data = get_cache(cache_key)
#     if cached_data:
#         return cached_data
    
#     walkthrough = db.query(Walkthrough).filter(Walkthrough.id == walkthrough_id).first()
    
#     if not walkthrough:
#         raise HTTPException(status_code=404, detail="Walkthrough not found")
    
#     result = {
#         "id": walkthrough.id,
#         "type": walkthrough.type,
#         "level": walkthrough.level,
#         "title": walkthrough.title,
#         "subtitle": walkthrough.subtitle,
#         "prerequisites": walkthrough.prerequisites,
#         "rewards": walkthrough.rewards,
#         "steps": walkthrough.steps,
#         "display_order": walkthrough.display_order
#     }
    
#     set_cache(cache_key, result, ttl=settings.CACHE_TTL_LONG)
#     return result

# @router.get("/type/{walkthrough_type}", response_model=List[WalkthroughListItem])
# @limiter.limit(settings.RATE_LIMIT_PER_MINUTE)
# def get_walkthroughs_by_type(walkthrough_type: str, request: Request, db: Session = Depends(get_db)):
#     """Get walkthroughs by type (main_story, side_quest, boss, etc.)"""
#     cache_key = f"walkthroughs:type:{walkthrough_type}"
#     cached_data = get_cache(cache_key)
#     if cached_data:
#         return cached_data
    
#     walkthroughs = db.query(Walkthrough).filter(
#         Walkthrough.type == walkthrough_type
#     ).order_by(Walkthrough.display_order).all()
    
#     if not walkthroughs:
#         raise HTTPException(status_code=404, detail="No walkthroughs found for this type")
    
#     result = [{
#         "id": w.id,
#         "type": w.type,
#         "level": w.level,
#         "title": w.title,
#         "subtitle": w.subtitle,
#         "display_order": w.display_order
#     } for w in walkthroughs]
    
#     set_cache(cache_key, result, ttl=settings.CACHE_TTL_LONG)
#     return result

# @router.get("/level/{level_name}", response_model=List[WalkthroughListItem])
# @limiter.limit(settings.RATE_LIMIT_PER_MINUTE)
# def get_walkthroughs_by_level(level_name: str, request: Request, db: Session = Depends(get_db)):
#     """Get walkthroughs by level"""
#     cache_key = f"walkthroughs:level:{level_name}"
#     cached_data = get_cache(cache_key)
#     if cached_data:
#         return cached_data
    
#     # Try exact match first
#     walkthroughs = db.query(Walkthrough).filter(Walkthrough.level == level_name).all()
    
#     # Try case-insensitive if no exact match
#     if not walkthroughs:
#         formatted_name = level_name.replace('-', ' ').title()
#         walkthroughs = db.query(Walkthrough).filter(
#             Walkthrough.level.ilike(formatted_name)
#         ).all()
    
#     if not walkthroughs:
#         raise HTTPException(status_code=404, detail="No walkthroughs found for this level")
    
#     result = [{
#         "id": w.id,
#         "type": w.type,
#         "level": w.level,
#         "title": w.title,
#         "subtitle": w.subtitle,
#         "display_order": w.display_order
#     } for w in walkthroughs]
    
#     set_cache(cache_key, result, ttl=settings.CACHE_TTL_LONG)
#     return result

from fastapi import APIRouter, HTTPException, Depends, Request
from sqlalchemy.orm import Session
from typing import List

from app.api.deps import get_db
from app.models.walkthroughs import Walkthrough as WalkthroughModel
from app.schemas.walkthroughs import Walkthrough as WalkthroughSchema, WalkthroughListItem
from app.core.cache import get_cache, set_cache
from app.core.security import limiter
from app.config import settings

router = APIRouter(prefix="/walkthroughs", tags=["walkthroughs"])

@router.get("/", response_model=List[WalkthroughListItem])
@limiter.limit(settings.RATE_LIMIT_PER_MINUTE)
def get_all_walkthroughs(request: Request, db: Session = Depends(get_db)):
    """Get all walkthroughs (summary view)"""
    cache_key = "walkthroughs:all"
    cached_data = get_cache(cache_key)
    if cached_data:
        return cached_data
    
    walkthroughs = db.query(WalkthroughModel).order_by(WalkthroughModel.display_order).all()
    result = [{
        "id": w.id,
        "title": w.title,
        "subtitle": w.subtitle,
        "level": w.level,
        "mission_type": w.mission_type,
        "display_order": w.display_order
    } for w in walkthroughs]
    
    set_cache(cache_key, result, ttl=settings.CACHE_TTL_LONG)
    return result

@router.get("/{walkthrough_id}", response_model=WalkthroughSchema)
@limiter.limit(settings.RATE_LIMIT_PER_MINUTE)
def get_walkthrough_by_id(walkthrough_id: int, request: Request, db: Session = Depends(get_db)):
    """Get specific walkthrough with full content"""
    cache_key = f"walkthrough:id:{walkthrough_id}"
    cached_data = get_cache(cache_key)
    if cached_data:
        return cached_data
    
    walkthrough = db.query(WalkthroughModel).filter(WalkthroughModel.id == walkthrough_id).first()
    
    if not walkthrough:
        raise HTTPException(status_code=404, detail="Walkthrough not found")
    
    result = {
        "id": walkthrough.id,
        "title": walkthrough.title,
        "subtitle": walkthrough.subtitle,
        "level": walkthrough.level,
        "mission_type": walkthrough.mission_type,
        "objectives": walkthrough.objectives,
        "content": walkthrough.content,
        "display_order": walkthrough.display_order
    }
    
    set_cache(cache_key, result, ttl=settings.CACHE_TTL_LONG)
    return result

@router.get("/type/{walkthrough_type}", response_model=List[WalkthroughListItem])
@limiter.limit(settings.RATE_LIMIT_PER_MINUTE)
def get_walkthroughs_by_type(walkthrough_type: str, request: Request, db: Session = Depends(get_db)):
    """Get walkthroughs by type (main_story, side_quest, etc.)"""
    cache_key = f"walkthroughs:type:{walkthrough_type}"
    cached_data = get_cache(cache_key)
    if cached_data:
        return cached_data
    
    walkthroughs = db.query(WalkthroughModel).filter(
        WalkthroughModel.mission_type == walkthrough_type
    ).order_by(WalkthroughModel.display_order).all()
    
    if not walkthroughs:
        raise HTTPException(status_code=404, detail="No walkthroughs found for this type")
    
    result = [{
        "id": w.id,
        "title": w.title,
        "subtitle": w.subtitle,
        "level": w.level,
        "mission_type": w.mission_type,
        "display_order": w.display_order
    } for w in walkthroughs]
    
    set_cache(cache_key, result, ttl=settings.CACHE_TTL_LONG)
    return result

@router.get("/level/{level_name}", response_model=List[WalkthroughListItem])
@limiter.limit(settings.RATE_LIMIT_PER_MINUTE)
def get_walkthroughs_by_level(level_name: str, request: Request, db: Session = Depends(get_db)):
    """Get walkthroughs by level"""
    cache_key = f"walkthroughs:level:{level_name}"
    cached_data = get_cache(cache_key)
    if cached_data:
        return cached_data
    
    # Try exact match first
    walkthroughs = db.query(WalkthroughModel).filter(WalkthroughModel.level == level_name).all()
    
    # Try case-insensitive if no exact match
    if not walkthroughs:
        formatted_name = level_name.replace('-', ' ').title()
        walkthroughs = db.query(WalkthroughModel).filter(
            WalkthroughModel.level.ilike(formatted_name)
        ).all()
    
    if not walkthroughs:
        raise HTTPException(status_code=404, detail="No walkthroughs found for this level")
    
    result = [{
        "id": w.id,
        "title": w.title,
        "subtitle": w.subtitle,
        "level": w.level,
        "mission_type": w.mission_type,
        "display_order": w.display_order
    } for w in walkthroughs]
    
    set_cache(cache_key, result, ttl=settings.CACHE_TTL_LONG)
    return result
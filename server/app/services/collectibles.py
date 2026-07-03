import time

from fastapi import HTTPException, Request
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, or_
from sqlalchemy.orm import joinedload

from app.models.collectibles import Level, Location, CollectibleType, Collectible
from app.core.cache import get_cache, set_cache
from app.config.settings import settings


def _serialize_collectible(c) -> dict:
    """Convert a Collectible ORM object to a response dict."""
    return {
        "id": c.id,
        "title": c.title,
        "description": c.description,
        "display_order": c.display_order,
        "cycle": c.cycle,
        "quantity": c.quantity,
        "subtype": c.subtype,
        "types": [t.name for t in c.types],
        "images": [
            {"id": img.id, "url": img.cloudinary_url, "alt": img.alt_text, "order": img.display_order}
            for img in c.images
        ]
    }


def _normalize_slug(slug: str) -> str:
    """Convert a URL slug to a DB-friendly name for fuzzy matching.
    e.g. 'beta-cores' -> 'Beta Core', 'passes' -> 'Pass', 'documents' -> 'Document'
    """
    formatted = slug.replace('-', ' ').title()
    if formatted.endswith(('sses', 'shes', 'ches', 'xes', 'zes')):
        formatted = formatted[:-2]
    elif formatted.endswith('s'):
        formatted = formatted[:-1]
    return formatted


async def _resolve_level(level_name: str, db: AsyncSession) -> Level:
    """Find a level by exact name or slug, raise 404 if not found."""
    result = await db.execute(select(Level).filter(Level.name == level_name))
    level = result.scalar_one_or_none()

    if not level:
        formatted = level_name.replace('-', ' ').title()
        result = await db.execute(select(Level).filter(Level.name.ilike(formatted)))
        level = result.scalar_one_or_none()

    if not level:
        raise HTTPException(status_code=404, detail="Level not found")

    return level


async def _resolve_type(type_name: str, category: str, db: AsyncSession) -> CollectibleType:
    """Find a collectible type by name within a category, raise 404 if not found."""
    if category == 'collectibles':
        category_filter = or_(
            CollectibleType.category_group == 'collectibles',
            CollectibleType.category_group.is_(None)
        )
    else:
        category_filter = CollectibleType.category_group == category

    # Exact match
    result = await db.execute(
        select(CollectibleType).filter(CollectibleType.name == type_name, category_filter)
    )
    found = result.scalars().first()
    if found:
        return found

    # Fuzzy match
    normalized = _normalize_slug(type_name)
    result = await db.execute(
        select(CollectibleType).filter(CollectibleType.name.ilike(f"%{normalized}%"), category_filter)
    )
    found = result.scalars().first()
    if found:
        return found

    raise HTTPException(status_code=404, detail=f"{category.title()} type not found")


def _group_by_level(collectibles, type_id: int = 0) -> list:
    """Group collectibles into a level > location > collectibles hierarchy."""
    levels_dict = {}

    for c in collectibles:
        level = c.location.level
        location = c.location

        if level.id not in levels_dict:
            levels_dict[level.id] = {
                "level_id": level.id,
                "level_name": level.name,
                "level_order": level.display_order,
                "type_id": type_id,
                "locations": {}
            }

        if location.id not in levels_dict[level.id]["locations"]:
            levels_dict[level.id]["locations"][location.id] = {
                "location_id": location.id,
                "location_name": location.name,
                "location_order": location.display_order,
                "collectibles": []
            }

        levels_dict[level.id]["locations"][location.id]["collectibles"].append(
            _serialize_collectible(c)
        )

    response = []
    for level_data in sorted(levels_dict.values(), key=lambda x: x["level_order"]):
        level_data["locations"] = sorted(level_data["locations"].values(), key=lambda x: x["location_order"])
        response.append(level_data)

    return response


async def _get_items_by_type(type_name: str, category: str, request: Request, db: AsyncSession):
    """Shared handler for all category type endpoints (collectibles, upgrades, cosmetics, materials)."""
    cache_key = f"{category}:type:{type_name}"
    cached_data = await get_cache(cache_key)
    if cached_data:
        request.state.cache_status = "HIT"
        return cached_data

    request.state.cache_status = "MISS"
    db_start = time.time()

    collectible_type = await _resolve_type(type_name, category, db)

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
        raise HTTPException(status_code=404, detail=f"No {category} found for this type")

    request.state.db_time = (time.time() - db_start) * 1000

    response = _group_by_level(collectibles, type_id=collectible_type.id)
    await set_cache(cache_key, response, ttl=settings.CACHE_TTL)
    return response

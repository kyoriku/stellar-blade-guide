import logging
import re
from fastapi import APIRouter, Depends, Query, Request
from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.database import get_db
from app.schemas.search import SearchResult, SearchResponse
from app.core.cache import get_cache, set_cache
from app.core.security import limiter

logger = logging.getLogger(__name__)

SEARCH_RATE_LIMIT = "30/minute"
SEARCH_CACHE_TTL = 3600   # 1 hour
_TRGM_THRESHOLD = 0.15

router = APIRouter(prefix="/search", tags=["search"])

_COLLECTIBLES_SQL = text("""
    WITH primary_type AS (
        SELECT DISTINCT ON (ctm.collectible_id)
            ctm.collectible_id,
            ctm.type_id,
            ct.slug,
            ct.category_group
        FROM collectible_type_mappings ctm
        JOIN collectible_types ct ON ctm.type_id = ct.id
        ORDER BY ctm.collectible_id, ctm.type_id
    )
    SELECT
        c.id,
        c.title,
        c.description,
        pt.type_id      AS type_id,
        pt.slug         AS type_slug,
        pt.category_group,
        GREATEST(
            ts_rank(to_tsvector('english', c.title), plainto_tsquery('english', :q)),
            similarity(c.title, :q)::float
        ) AS score
    FROM collectibles c
    JOIN primary_type pt ON c.id = pt.collectible_id
    WHERE
        to_tsvector('english', c.title) @@ plainto_tsquery('english', :q)
        OR similarity(c.title, :q) > :threshold
    ORDER BY score DESC
    LIMIT :limit
""")

# All collectibles mapped to the given types, ordered exactly as the type page
# flattens them (level -> location -> collectible display_order, per
# collectibles._group_by_level). Feeds _build_slug_map so search anchors match
# the page's positional slug suffixes.
_TYPE_COLLECTIBLES_SQL = text("""
    SELECT ctm.type_id AS type_id, c.id AS id, c.title AS title
    FROM collectibles c
    JOIN collectible_type_mappings ctm ON ctm.collectible_id = c.id
    JOIN locations loc ON c.location_id = loc.id
    JOIN levels    lv  ON loc.level_id = lv.id
    WHERE ctm.type_id = ANY(:type_ids)
    ORDER BY ctm.type_id, lv.display_order, loc.display_order, c.display_order
""")

_WALKTHROUGHS_SQL = text("""
    SELECT
        w.id,
        w.title,
        w.subtitle,
        w.slug,
        w.mission_type,
        GREATEST(
            ts_rank(
                to_tsvector('english', w.title || ' ' || COALESCE(w.subtitle, '')),
                plainto_tsquery('english', :q)
            ),
            similarity(w.title, :q)::float
        ) AS score
    FROM walkthroughs w
    WHERE
        to_tsvector('english', w.title || ' ' || COALESCE(w.subtitle, '')) @@ plainto_tsquery('english', :q)
        OR similarity(w.title, :q) > :threshold
    ORDER BY score DESC
    LIMIT :limit
""")

_LEVELS_SQL = text("""
    SELECT
        lv.id,
        lv.name,
        (
            SELECT COALESCE(SUM(COALESCE(c.quantity, 1)), 0)
            FROM locations loc
            JOIN collectibles c ON c.location_id = loc.id
            WHERE loc.level_id = lv.id
        ) AS collectible_count,
        GREATEST(
            ts_rank(to_tsvector('english', lv.name), plainto_tsquery('english', :q)),
            similarity(lv.name, :q)::float
        ) AS score
    FROM levels lv
    WHERE
        to_tsvector('english', lv.name) @@ plainto_tsquery('english', :q)
        OR similarity(lv.name, :q) > :threshold
    ORDER BY score DESC
    LIMIT :limit
""")


def _level_slug(name: str) -> str:
    return name.lower().replace(" ", "-")


def _slugify_title(title: str) -> str:
    title = title.lower()
    title = re.sub(r"★+", lambda m: f" {len(m.group())} ", title)
    title = re.sub(r"'", "", title)
    title = re.sub(r"[^a-z0-9Ͱ-Ͽ]+", "-", title)
    return title.strip("-")


def _build_slug_map(collectibles: list[tuple[int, str]]) -> dict[int, str]:
    """Server mirror of client buildSlugMap (slugify.ts): collectibles sharing a
    base slug get positional -1/-2 suffixes in the given order; unique slugs stay
    bare. `collectibles` must be ordered exactly as the type page flattens them
    (level -> location -> collectible display_order)."""
    counts: dict[str, int] = {}
    for _id, title in collectibles:
        base = _slugify_title(title)
        counts[base] = counts.get(base, 0) + 1
    used: dict[str, int] = {}
    out: dict[int, str] = {}
    for _id, title in collectibles:
        base = _slugify_title(title)
        if counts[base] > 1:
            used[base] = used.get(base, 0) + 1
            out[_id] = f"{base}-{used[base]}"
        else:
            out[_id] = base
    return out


def _strip_links(text: str) -> str:
    return re.sub(r'\[\[[^\]|]+\|([^\]]+)\]\]', r'\1', text)


def _extract_snippet(description: dict | None) -> str | None:
    if not description:
        return None
    text_content = description.get("content")
    if text_content:
        cleaned = _strip_links(text_content)
        return (cleaned[:120] + '...') if len(cleaned) > 120 else cleaned
    items = description.get("items")
    if items:
        cleaned = _strip_links(items[0])
        return (cleaned[:120] + '...') if len(cleaned) > 120 else cleaned
    return None


async def _execute_search(db: AsyncSession, q: str, limit: int) -> list[SearchResult]:
    """Run FTS + pg_trgm queries across collectibles, walkthroughs, and levels.

    Each source is queried independently so a failure in one doesn't block the
    others. Results are merged, ranked by score, and sliced to limit.
    """
    params = {"q": q, "limit": limit, "threshold": _TRGM_THRESHOLD}
    results: list[SearchResult] = []

    try:
        rows = (await db.execute(_COLLECTIBLES_SQL, params)).mappings().all()

        # Duplicate-title collectibles (e.g. "Body Core") render on the type page
        # with positional slug suffixes (#body-core-1, -2, …). Reproduce that
        # dedup so search anchors scroll to the right card. One slug map per
        # matched primary type, in the page's flatten order.
        type_ids = {row["type_id"] for row in rows}
        slug_maps: dict[int, dict[int, str]] = {}
        if type_ids:
            try:
                type_rows = (await db.execute(
                    _TYPE_COLLECTIBLES_SQL, {"type_ids": list(type_ids)}
                )).mappings().all()
                grouped: dict[int, list[tuple[int, str]]] = {}
                for tr in type_rows:
                    grouped.setdefault(tr["type_id"], []).append((tr["id"], tr["title"]))
                slug_maps = {tid: _build_slug_map(items) for tid, items in grouped.items()}
            except Exception as e:
                logger.error("Search slug-map build failed: %s", e)  # fall back to bare slugs

        for row in rows:
            collectible_slug = slug_maps.get(row["type_id"], {}).get(row["id"]) or _slugify_title(row["title"])
            results.append(SearchResult(
                kind=row["category_group"],
                id=row["id"],
                title=row["title"],
                snippet=_extract_snippet(row["description"]),
                navigation_url=f"/{row['category_group']}/{row['type_slug']}#{collectible_slug}",
                score=float(row["score"]),
            ))
    except Exception as e:
        logger.error("Search collectibles query failed: %s", e)

    try:
        rows = (await db.execute(_WALKTHROUGHS_SQL, params)).mappings().all()
        for row in rows:
            results.append(SearchResult(
                kind="walkthrough",
                id=row["id"],
                title=row["title"],
                snippet=row["subtitle"],
                navigation_url=f"/walkthroughs/{row['mission_type']}/{row['slug']}",
                score=float(row["score"]),
            ))
    except Exception as e:
        logger.error("Search walkthroughs query failed: %s", e)

    try:
        rows = (await db.execute(_LEVELS_SQL, params)).mappings().all()
        for row in rows:
            count = row["collectible_count"]
            results.append(SearchResult(
                kind="level",
                id=row["id"],
                title=row["name"],
                snippet=f"{count} collectible{'s' if count != 1 else ''}",
                navigation_url=f"/levels/{_level_slug(row['name'])}",
                score=float(row["score"]),
            ))
    except Exception as e:
        logger.error("Search levels query failed: %s", e)

    results.sort(key=lambda r: r.score, reverse=True)
    return results[:limit]


@router.get("/", response_model=SearchResponse)
@limiter.limit(SEARCH_RATE_LIMIT)
async def search(
    request: Request,
    q: str = Query(..., min_length=2, max_length=100),
    limit: int = Query(default=20, ge=1, le=50),
    db: AsyncSession = Depends(get_db),
):
    q_normalized = q.strip().lower()
    cache_key = f"search:{q_normalized}:{limit}"

    cached = await get_cache(cache_key)
    if cached:
        return cached

    results = await _execute_search(db, q_normalized, limit)
    response = SearchResponse(query=q_normalized, total=len(results), results=results)
    await set_cache(cache_key, response.model_dump(), ttl=SEARCH_CACHE_TTL)
    return response

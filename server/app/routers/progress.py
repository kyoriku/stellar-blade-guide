import logging
from fastapi import APIRouter, Depends, HTTPException, Request, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import Integer, Select, and_, delete, exists, literal, select
from sqlalchemy.dialects.postgresql import insert as pg_insert
from typing import List

from app.db.database import get_db
from app.models.users import User
from app.models.progress import UserProgress
from app.models.collectibles import (
    Collectible,
    CollectibleType,
    Level,
    Location,
    collectible_type_mappings,
)
from app.schemas.progress import (
    BulkPreviewResponse,
    BulkProgressRequest,
    BulkProgressResponse,
    ProgressWriteResponse,
    SyncRequest,
    SyncResponse,
)
from app.core.auth import get_current_user
from app.core.colours import CYAN, RESET
from app.core.security import limiter
from app.config.settings import settings

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/progress", tags=["progress"])

# PUT and DELETE each count once per client across every collectible id. A checkbox
# click is one request, and Tab+Space ticking a whole type runs 120-240 a minute;
# two people ticking behind one address reach about 120.
PROGRESS_WRITE_RATE_LIMIT = "300/minute"


@router.get("", response_model=List[int])
@limiter.limit(settings.RATE_LIMIT_PER_MINUTE)
async def get_progress(
    request: Request,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Return all completed collectible IDs for the current user."""
    result = await db.execute(
        select(UserProgress.collectible_id)
        .where(UserProgress.user_id == current_user.id)
    )
    return result.scalars().all()


@router.post("/sync", response_model=SyncResponse, status_code=status.HTTP_200_OK)
@limiter.limit("10/minute")
async def sync_progress(
    request: Request,
    body: SyncRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Bulk import progress from localStorage on first login."""
    if not body.collectible_ids:
        return {"status": "ok", "added": 0}

    # Get existing progress to avoid duplicates
    result = await db.execute(
        select(UserProgress.collectible_id)
        .where(UserProgress.user_id == current_user.id)
    )
    existing_ids = set(result.scalars().all())

    # Validate collectible IDs exist in the database
    valid_result = await db.execute(
        select(Collectible.id).where(Collectible.id.in_(body.collectible_ids))
    )
    valid_ids = set(valid_result.scalars().all())

    new_ids = [cid for cid in body.collectible_ids if cid in valid_ids and cid not in existing_ids]

    # Route the insert through an upsert as a safety net: a concurrent sync (or a
    # PUT racing this) could re-add a cid that passed the existing_ids dedup
    # above, violating uq_user_collectible -> IntegrityError -> 500. ON CONFLICT
    # DO NOTHING absorbs that. The "added" count stays based on new_ids (accurate
    # fast-path; best-effort under a concurrent race).
    if new_ids:
        await db.execute(
            pg_insert(UserProgress)
            .values([
                {"user_id": current_user.id, "collectible_id": cid}
                for cid in new_ids
            ])
            .on_conflict_do_nothing(constraint="uq_user_collectible")
        )

    await db.commit()
    return {"status": "ok", "added": len(new_ids)}


# One bulk write can stand in for the whole catalog of single-item writes, so it
# gets the sync route's budget rather than the per-item one.
BULK_WRITE_RATE_LIMIT = "10/minute"


async def _scope_ids(db: AsyncSession, req: BulkProgressRequest) -> Select:
    """The scope's collectible ids, as a subquery.

    Exact lookups only: the client sends back names and slugs the server gave it,
    and a destructive action must not guess the way the page resolvers do (any
    case for levels, any unique substring for types). Branches on req.scope alone,
    so a stray target field can never pick the scope."""
    stmt = select(Collectible.id)
    if req.scope == "level":
        level_id = (await db.execute(
            select(Level.id).where(Level.name == req.level)
        )).scalar_one_or_none()
        if level_id is None:
            raise HTTPException(status_code=422, detail="Unknown level")
        stmt = stmt.join(Location, Location.id == Collectible.location_id).where(
            Location.level_id == level_id
        )
    elif req.scope == "type":
        type_id = (await db.execute(
            select(CollectibleType.id).where(CollectibleType.slug == req.type)
        )).scalar_one_or_none()
        if type_id is None:
            raise HTTPException(status_code=422, detail="Unknown type")
        stmt = stmt.join(
            collectible_type_mappings,
            collectible_type_mappings.c.collectible_id == Collectible.id,
        ).where(collectible_type_mappings.c.type_id == type_id)
    if req.cycle is not None:
        stmt = stmt.where(Collectible.cycle == req.cycle)
    return stmt


def _clear_stmt(user_id: int, scope: Select):
    return (
        delete(UserProgress)
        .where(
            UserProgress.user_id == user_id,
            UserProgress.collectible_id.in_(scope),
        )
        .returning(UserProgress.collectible_id)
    )


def _mark_found_stmt(user_id: int, scope: Select):
    return (
        pg_insert(UserProgress)
        .from_select(
            ["user_id", "collectible_id"],
            select(literal(user_id, Integer), Collectible.id)
            .where(
                # The IN also keeps a WHERE on this SELECT for "everything": SQLite
                # cannot parse INSERT ... SELECT ... ON CONFLICT without one.
                Collectible.id.in_(scope),
                # Postgres takes a nextval() for every source row before it checks
                # conflicts, so rows the user already has are filtered out here,
                # not left to ON CONFLICT, which stays as the guard for a tick
                # committed concurrently. This only halves what a clear/mark loop
                # burns; the integer id column is the real exposure.
                ~exists().where(
                    UserProgress.user_id == user_id,
                    UserProgress.collectible_id == Collectible.id,
                ),
            )
            # One lock order for overlapping bulk writers.
            .order_by(Collectible.id),
        )
        .on_conflict_do_nothing(constraint="uq_user_collectible")
        .returning(UserProgress.collectible_id)
    )


def _describe_scope(req: BulkProgressRequest) -> str:
    # Every part has passed validation or an exact DB match before this is logged.
    if req.scope == "level":
        target = f"level {req.level}"
    elif req.scope == "type":
        target = f"type {req.type}"
    else:
        target = "everything"
    return f"{target} ({req.cycle})" if req.cycle else target


@router.post("/bulk/preview", response_model=BulkPreviewResponse)
@limiter.limit(settings.RATE_LIMIT_PER_MINUTE)
async def preview_bulk_progress(
    request: Request,
    body: BulkProgressRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """What the same body sent to /bulk would change now, without changing it."""
    scope = await _scope_ids(db, body)
    rows = (await db.execute(
        select(
            Collectible.id,
            Collectible.quantity,
            UserProgress.id.is_not(None).label("found"),
        )
        # The user predicate belongs in the join, not the WHERE: in the WHERE it
        # would drop every collectible this user has not found.
        .outerjoin(UserProgress, and_(
            UserProgress.collectible_id == Collectible.id,
            UserProgress.user_id == current_user.id,
        ))
        .where(Collectible.id.in_(scope))
    )).all()
    clearing = body.action == "clear"
    changing = [r for r in rows if bool(r.found) == clearing]
    return {
        "entries": len(changing),
        "quantity": sum(r.quantity for r in changing),
        "scope_entries": len(rows),
        "scope_ids": sorted(r.id for r in rows),
    }


@router.post("/bulk", response_model=BulkProgressResponse)
@limiter.limit(BULK_WRITE_RATE_LIMIT)
async def apply_bulk_progress(
    request: Request,
    body: BulkProgressRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Clear, or mark found, every collectible in one scope, in one statement."""
    scope = await _scope_ids(db, body)
    quantity = dict((await db.execute(
        select(Collectible.id, Collectible.quantity).where(Collectible.id.in_(scope))
    )).all())

    if body.action == "clear":
        result = await db.execute(
            _clear_stmt(current_user.id, scope),
            # Nothing in the session needs syncing, and the default would widen the
            # RETURNING to the row ids as well.
            execution_options={"synchronize_session": False},
        )
    else:
        result = await db.execute(_mark_found_stmt(current_user.id, scope))
    # Counted from the returned ids: with RETURNING the ORM result has no rowcount,
    # and aiosqlite would report -1.
    changed = result.scalars().all()
    await db.commit()

    logger.info(
        f"{CYAN}User {current_user.id} bulk {body.action} {_describe_scope(body)}: "
        f"{len(changed)} changed{RESET}"
    )
    return {
        "entries": len(changed),
        # .get: a seed running between the two statements can add an id to the
        # scope, and a KeyError here would turn a committed write into a 500.
        "quantity": sum(quantity.get(cid, 1) for cid in changed),
    }


async def _require_collectible(db: AsyncSession, collectible_id: int) -> None:
    result = await db.execute(
        select(Collectible.id).where(Collectible.id == collectible_id)
    )
    if not result.scalar_one_or_none():
        raise HTTPException(status_code=404, detail="Collectible not found")


@router.put("/{collectible_id}", response_model=ProgressWriteResponse, status_code=status.HTTP_200_OK)
@limiter.limit(PROGRESS_WRITE_RATE_LIMIT)
async def set_progress(
    request: Request,
    collectible_id: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Idempotently mark a collectible as found. A re-assert against an existing
    row reports already_complete instead of inverting it (the retired blind
    toggle deleted rows when a stale tab re-sent completions)."""
    await _require_collectible(db, collectible_id)

    result = await db.execute(
        pg_insert(UserProgress)
        .values(user_id=current_user.id, collectible_id=collectible_id)
        .on_conflict_do_nothing(constraint="uq_user_collectible")
    )
    await db.commit()
    # rowcount 0 means the ON CONFLICT path fired: the row already existed.
    write_status = "added" if result.rowcount else "already_complete"
    return {"status": write_status, "collectible_id": collectible_id}


@router.delete("/{collectible_id}", response_model=ProgressWriteResponse, status_code=status.HTTP_200_OK)
@limiter.limit(PROGRESS_WRITE_RATE_LIMIT)
async def unset_progress(
    request: Request,
    collectible_id: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Idempotently mark a collectible as not found. Deleting an absent row is a
    no-op reported as not_found, not an error — 200 keeps re-asserts harmless."""
    await _require_collectible(db, collectible_id)

    result = await db.execute(
        delete(UserProgress).where(
            UserProgress.user_id == current_user.id,
            UserProgress.collectible_id == collectible_id,
        )
    )
    await db.commit()
    write_status = "removed" if result.rowcount else "not_found"
    return {"status": write_status, "collectible_id": collectible_id}
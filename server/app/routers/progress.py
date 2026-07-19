import logging
from fastapi import APIRouter, Depends, HTTPException, Request, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, delete
from sqlalchemy.dialects.postgresql import insert as pg_insert
from typing import List

from app.db.database import get_db
from app.models.users import User
from app.models.progress import UserProgress
from app.models.collectibles import Collectible
from app.schemas.progress import ProgressWriteResponse, SyncRequest, SyncResponse
from app.core.auth import get_current_user
from app.core.security import limiter
from app.config.settings import settings

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/progress", tags=["progress"])


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
    # toggle racing this) could re-add a cid that passed the existing_ids dedup
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


async def _require_collectible(db: AsyncSession, collectible_id: int) -> None:
    result = await db.execute(
        select(Collectible.id).where(Collectible.id == collectible_id)
    )
    if not result.scalar_one_or_none():
        raise HTTPException(status_code=404, detail="Collectible not found")


@router.put("/{collectible_id}", response_model=ProgressWriteResponse, status_code=status.HTTP_200_OK)
@limiter.limit(settings.RATE_LIMIT_PER_MINUTE)
async def set_progress(
    request: Request,
    collectible_id: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Idempotently mark a collectible as found. A re-assert against an existing
    row reports already_complete instead of inverting it — the POST toggle below
    deleted rows when a stale tab re-sent completions."""
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
@limiter.limit(settings.RATE_LIMIT_PER_MINUTE)
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


# Retired blind-toggle route, kept registered as a 410 signpost: SPA tabs from
# before the intent-verb deploy still POST here, and the old client surfaces
# this detail string in its error toast — a loud, instructive failure instead
# of a 404. No auth on purpose: a dead-session stale tab gets the instruction
# directly rather than a 401 that kicks off a doomed refresh cycle.
@router.post("/{collectible_id}")
@limiter.limit(settings.RATE_LIMIT_PER_MINUTE)
async def toggle_progress(request: Request, collectible_id: int):
    raise HTTPException(
        status_code=status.HTTP_410_GONE,
        detail="This version of the guide is out of date — refresh the page to keep tracking progress.",
    )
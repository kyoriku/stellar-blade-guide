import logging
from fastapi import APIRouter, Depends, HTTPException, Request, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from typing import List

from db.database import get_db
from models.users import User
from models.progress import UserProgress
from models.collectibles import Collectible
from schemas.progress import SyncRequest, SyncResponse, ToggleResponse
from core.auth import get_current_user
from core.security import limiter
from config.settings import settings

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

    for cid in new_ids:
        db.add(UserProgress(user_id=current_user.id, collectible_id=cid))

    await db.commit()
    return {"status": "ok", "added": len(new_ids)}


@router.post("/{collectible_id}", response_model=ToggleResponse, status_code=status.HTTP_200_OK)
@limiter.limit(settings.RATE_LIMIT_PER_MINUTE)
async def toggle_progress(
    request: Request,
    collectible_id: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Toggle a collectible as found/unfound."""
    # Check collectible exists
    collectible = await db.execute(
        select(Collectible.id).where(Collectible.id == collectible_id)
    )
    if not collectible.scalar_one_or_none():
        raise HTTPException(status_code=404, detail="Collectible not found")

    result = await db.execute(
        select(UserProgress)
        .where(
            UserProgress.user_id == current_user.id,
            UserProgress.collectible_id == collectible_id,
        )
    )
    existing = result.scalar_one_or_none()

    if existing:
        await db.delete(existing)
        await db.commit()
        return {"status": "removed", "collectible_id": collectible_id}

    entry = UserProgress(user_id=current_user.id, collectible_id=collectible_id)
    db.add(entry)
    await db.commit()
    return {"status": "added", "collectible_id": collectible_id}
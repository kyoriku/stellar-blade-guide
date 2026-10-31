import logging

import httpx
from fastapi import APIRouter, Depends, HTTPException, Request, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import and_, case, func, select, update
from sqlalchemy.exc import IntegrityError

from app.config.settings import settings
from app.db.database import get_db
from app.models.collectibles import (
    Collectible,
    CollectibleType,
    Level,
    Location,
    collectible_type_mappings,
)
from app.models.comments import Comment
from app.models.progress import UserProgress
from app.models.users import User
from app.core.auth import get_current_user, require_role
from app.core.security import limiter
from app.core.colours import CYAN, RED, RESET
from app.core.ids import is_row_id
from app.core.logging import exc_text
from app.schemas.users import UpdateProfileRequest, UpdateRoleRequest, UserStatsResponse
from app.services.users import (
    user_to_response,
    upload_avatar_to_cloudinary,
    delete_avatar_from_cloudinary,
)

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/users", tags=["users"])


# Routes

async def _refuse_taken_username(db: AsyncSession, username: str) -> None:
    """The 409 for a username another account already has."""
    existing = await db.execute(select(User).where(User.username == username))
    if existing.scalar_one_or_none():
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Username already taken")


@router.patch("/me")
@limiter.limit("5/minute")
async def update_me(
    request: Request,
    body: UpdateProfileRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Update the authenticated user's username or avatar."""
    renaming = bool(body.username) and body.username != current_user.username
    if renaming:
        await _refuse_taken_username(db, body.username)
        current_user.username = body.username

    if body.avatar_url is not None:
      if body.avatar_url == "":
          await delete_avatar_from_cloudinary(current_user.id)
          current_user.avatar_url = None
      else:
          try:
              cloudinary_url = await upload_avatar_to_cloudinary(body.avatar_url, current_user.id)
              current_user.avatar_url = cloudinary_url
          except HTTPException:
              raise
          except Exception as e:
              # httpx's text describes the link or the image server's answer and can
              # quote its host, and the link isn't kept, so httpx errors are logged by
              # class only.
              detail = type(e).__name__ if isinstance(e, (httpx.HTTPError, httpx.InvalidURL)) else exc_text(e)
              logger.error(f"{RED}Failed to upload avatar for user {current_user.id}: {detail}{RESET}")
              raise HTTPException(status_code=400, detail="Failed to process avatar image")

    try:
        await db.commit()
    except IntegrityError:
        # Another account took this username between the check above and this
        # commit; the avatar work in between can take seconds. It gets the check's
        # own 409; a collision the check can't name stays a 500. If the request also
        # changed the avatar, the new image is already on the account's one
        # Cloudinary asset while the row keeps the old link.
        await db.rollback()
        if renaming:
            await _refuse_taken_username(db, body.username)
        raise
    await db.refresh(current_user)

    logger.info(f"{CYAN}User {current_user.id} updated their profile{RESET}")
    return user_to_response(current_user)


@router.delete("/me", status_code=status.HTTP_204_NO_CONTENT)
@limiter.limit("5/minute")
async def delete_me(
    request: Request,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Permanently delete the authenticated user's account and all their data."""
    from app.core.auth import revoke_all_refresh_tokens
    user_id = current_user.id

    await revoke_all_refresh_tokens(user_id)
    # Lock the account row first. A comment the account posts from another tab meanwhile
    # then either commits before the erase below, which sees it, or waits on this lock
    # (its foreign key check needs the row) and fails once the account is gone, rather
    # than slipping in after the erase with its text. SQLite ignores FOR UPDATE.
    await db.execute(select(User.id).where(User.id == user_id).with_for_update())
    # Each comment is erased as DELETE /comments/{id} erases one, so the list leaves it
    # out, or shows "[deleted]" while a reply to it is up. user_id is cleared here, not
    # by deleting the user, whose UPDATE would stamp every comment with one updated_at
    # (the column's onupdate) and tie them to one account.
    await db.execute(
        update(Comment)
        .where(Comment.user_id == user_id)
        .values(user_id=None, is_deleted=True, body="[deleted]", updated_at=Comment.updated_at)
    )
    await db.delete(current_user)
    await db.commit()
    logger.info(f"{CYAN}User {user_id} deleted their account{RESET}")

    # After the commit: deleting the account is what the user actually asked
    # for, so a slow or failing Cloudinary call must not block or roll it back.
    # The public_id is derived from the user id, so deleting the row first
    # loses nothing, and destroying a non-existent asset is a no-op.
    await delete_avatar_from_cloudinary(user_id)


CYCLE_DISPLAY_ORDER = ("Base", "NG+", "NG++", "DLC")
CATEGORY_DISPLAY_ORDER = ("collectibles", "upgrades", "cosmetics")


@router.get("/me/stats", response_model=UserStatsResponse)
@limiter.limit(settings.RATE_LIMIT_PER_MINUTE)
async def get_my_stats(
    request: Request,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Aggregate the authenticated user's collectible completion.

    All counts are quantity-weighted (a checked xN entry credits N — the
    site-wide unit; entries remain the tracking granularity). Not
    Redis-cached: per-user responses have no invalidation hook today and the
    whole aggregation is a handful of indexed reads. Edge caching is already
    suppressed by the /api/users/me no-store allowlist prefix.
    """
    progress_on = and_(
        UserProgress.collectible_id == Collectible.id,
        UserProgress.user_id == current_user.id,
    )
    # uq_user_collectible guarantees at most one joined progress row per
    # collectible, so summing quantity over matched rows never double-credits.
    weighted_total = func.coalesce(func.sum(Collectible.quantity), 0)
    weighted_completed = func.coalesce(
        func.sum(case((UserProgress.id.is_not(None), Collectible.quantity), else_=0)), 0
    )

    overall = (await db.execute(
        select(
            weighted_total.label("total"),
            weighted_completed.label("completed"),
        )
        .select_from(Collectible)
        .outerjoin(UserProgress, progress_on)
    )).one()

    # A dual-typed collectible counts once per type here, so per-type totals
    # can sum above the overall — buckets are per-type views, not a partition.
    type_rows = (await db.execute(
        select(
            CollectibleType.name,
            CollectibleType.slug,
            func.coalesce(CollectibleType.category_group, "collectibles").label("category"),
            weighted_total.label("total"),
            weighted_completed.label("completed"),
        )
        .select_from(CollectibleType)
        .outerjoin(
            collectible_type_mappings,
            collectible_type_mappings.c.type_id == CollectibleType.id,
        )
        .outerjoin(Collectible, Collectible.id == collectible_type_mappings.c.collectible_id)
        .outerjoin(UserProgress, progress_on)
        .group_by(CollectibleType.id)
        .order_by(func.coalesce(CollectibleType.display_order, 0), CollectibleType.name)
    )).all()

    level_rows = (await db.execute(
        select(
            Level.name,
            Level.display_order,
            weighted_total.label("total"),
            weighted_completed.label("completed"),
        )
        .select_from(Level)
        .join(Location, Location.level_id == Level.id)
        .join(Collectible, Collectible.location_id == Location.id)
        .outerjoin(UserProgress, progress_on)
        .group_by(Level.id)
        .order_by(Level.display_order)
    )).all()

    cycle_rows = (await db.execute(
        select(
            Collectible.cycle,
            weighted_total.label("total"),
            weighted_completed.label("completed"),
        )
        .select_from(Collectible)
        .outerjoin(UserProgress, progress_on)
        .group_by(Collectible.cycle)
    )).all()

    # The cycles each level and type holds, read from the catalog so a new item
    # in a new cycle shows up without a client release.
    level_cycle_rows = (await db.execute(
        select(Level.name, Collectible.cycle)
        .select_from(Level)
        .join(Location, Location.level_id == Level.id)
        .join(Collectible, Collectible.location_id == Location.id)
        .distinct()
    )).all()
    type_cycle_rows = (await db.execute(
        select(CollectibleType.slug, Collectible.cycle)
        .select_from(CollectibleType)
        .join(collectible_type_mappings, collectible_type_mappings.c.type_id == CollectibleType.id)
        .join(Collectible, Collectible.id == collectible_type_mappings.c.collectible_id)
        .distinct()
    )).all()

    # Category rollups count each collectible once per category group: a
    # dual-typed item's two types share a group, so aggregating over the raw
    # mappings (like the per-type query) would double-count it. DISTINCT
    # collapses the two mapping rows before the outer sum.
    cat_subq = (
        select(
            Collectible.id.label("cid"),
            Collectible.quantity.label("qty"),
            func.coalesce(CollectibleType.category_group, "collectibles").label("category"),
        )
        .select_from(Collectible)
        .join(collectible_type_mappings, collectible_type_mappings.c.collectible_id == Collectible.id)
        .join(CollectibleType, CollectibleType.id == collectible_type_mappings.c.type_id)
        .distinct()
        .subquery()
    )
    category_rows = (await db.execute(
        select(
            cat_subq.c.category,
            func.coalesce(func.sum(cat_subq.c.qty), 0).label("total"),
            func.coalesce(
                func.sum(case((UserProgress.id.is_not(None), cat_subq.c.qty), else_=0)), 0
            ).label("completed"),
        )
        .select_from(cat_subq)
        .outerjoin(UserProgress, and_(
            UserProgress.collectible_id == cat_subq.c.cid,
            UserProgress.user_id == current_user.id,
        ))
        .group_by(cat_subq.c.category)
    )).all()
    cat_rank = {name: i for i, name in enumerate(CATEGORY_DISPLAY_ORDER)}
    category_rows = sorted(
        category_rows, key=lambda r: cat_rank.get(r.category, len(CATEGORY_DISPLAY_ORDER))
    )

    override_rows = (await db.execute(
        select(Collectible.id, Collectible.quantity).where(Collectible.quantity > 1)
    )).all()
    # Fixed display order applied in Python — portable across Postgres and the
    # SQLite test engine, unlike CASE/array_position ordering in SQL.
    cycle_rank = {name: i for i, name in enumerate(CYCLE_DISPLAY_ORDER)}
    cycle_rows = sorted(cycle_rows, key=lambda r: cycle_rank.get(r.cycle, len(CYCLE_DISPLAY_ORDER)))

    def cycles_by(rows) -> dict[str, list[str]]:
        found: dict[str, set[str]] = {}
        for key, cycle in rows:
            found.setdefault(key, set()).add(cycle)
        return {
            key: sorted(cycles, key=lambda c: (cycle_rank.get(c, len(CYCLE_DISPLAY_ORDER)), c))
            for key, cycles in found.items()
        }

    level_cycles = cycles_by(level_cycle_rows)
    type_cycles = cycles_by(type_cycle_rows)

    # Mirrors the public read path (is_deleted + is_approved filters), so the
    # count equals comments the user can actually see rendered.
    comments_posted = (await db.execute(
        select(func.count())
        .select_from(Comment)
        .where(
            Comment.user_id == current_user.id,
            Comment.is_deleted == False,  # noqa: E712
            Comment.is_approved == True,  # noqa: E712
        )
    )).scalar_one()

    return {
        "total": {"completed": overall.completed, "total": overall.total},
        "categories": [
            {"category": r.category, "completed": r.completed, "total": r.total}
            for r in category_rows
        ],
        "types": [
            {
                "name": r.name,
                "slug": r.slug,
                "category": r.category,
                "completed": r.completed,
                "total": r.total,
                "cycles": type_cycles.get(r.slug, []),
            }
            for r in type_rows
        ],
        "levels": [
            {
                "name": r.name,
                "order": r.display_order,
                "completed": r.completed,
                "total": r.total,
                "cycles": level_cycles.get(r.name, []),
            }
            for r in level_rows
        ],
        "cycles": [
            {"name": r.cycle, "completed": r.completed, "total": r.total}
            for r in cycle_rows
        ],
        "quantity_overrides": {r.id: r.quantity for r in override_rows},
        "comments_posted": comments_posted,
        "member_since": current_user.created_at.isoformat(),
    }


# Admin-only

@router.patch("/{user_id}/role")
@limiter.limit("20/minute")
async def update_user_role(
    request: Request,
    user_id: int,
    body: UpdateRoleRequest,
    db: AsyncSession = Depends(get_db),
    _admin: User = Depends(require_role("admin")),
):
    """Admin only: change a user's role."""
    if not is_row_id(user_id):
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")
    result = await db.execute(select(User).where(User.id == user_id))
    user = result.scalar_one_or_none()
    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")

    user.role = body.role
    await db.commit()
    await db.refresh(user)

    logger.info(f"{CYAN}Admin updated user {user_id} role to {body.role}{RESET}")
    return user_to_response(user)


@router.patch("/{user_id}/deactivate")
@limiter.limit("20/minute")
async def deactivate_user(
    request: Request,
    user_id: int,
    db: AsyncSession = Depends(get_db),
    _admin: User = Depends(require_role("admin")),
):
    """Admin only: deactivate a user account."""
    if not is_row_id(user_id):
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")
    result = await db.execute(select(User).where(User.id == user_id))
    user = result.scalar_one_or_none()
    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")

    user.is_active = False
    await db.commit()

    logger.info(f"{CYAN}Admin deactivated user {user_id}{RESET}")
    return {"status": "ok", "message": f"User {user_id} deactivated"}
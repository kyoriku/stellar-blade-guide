import logging

from fastapi import APIRouter, Depends, HTTPException, Request, status
from sqlalchemy import select, update, func
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.database import get_db
from app.models.notifications import Notification
from app.models.users import User
from app.models.comments import Comment  # noqa: F401 — FK target, keep mapper happy
from app.models.collectibles import CollectibleType, Level
from app.models.walkthroughs import Walkthrough
from app.core.auth import get_current_user
from app.core.security import limiter
from app.config.settings import settings
from app.schemas.notifications import NotificationItem, NotificationList

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/notifications", tags=["notifications"])

# How many notifications the bell/list shows.
_LIMIT = 30


def _level_slug(name: str) -> str:
    return name.lower().replace(" ", "-")


async def _build_label_urls(db: AsyncSession, notifications: list[Notification]) -> dict:
    """Map (content_type, content_id) -> (label, base_url), batched by type.

    Defensive: a missing row (deleted content) or a query error falls back to a
    generic label/url rather than failing the whole list.
    """
    by_type: dict[str, set[int]] = {"collectible": set(), "walkthrough": set(), "level": set()}
    for n in notifications:
        if n.content_type in by_type:
            by_type[n.content_type].add(n.content_id)

    out: dict[tuple, tuple] = {}

    if by_type["collectible"]:
        try:
            rows = (await db.execute(
                select(CollectibleType).where(CollectibleType.id.in_(by_type["collectible"]))
            )).scalars()
            for r in rows:
                # Label from the slug (the plural form shown in the nav/URL, e.g.
                # "documents" -> "Documents") rather than the singular DB `name`,
                # so the toast/bell label matches the page the link goes to.
                label = r.slug.replace("-", " ").title()
                out[("collectible", r.id)] = (label, f"/{r.category_group}/{r.slug}")
        except Exception as e:
            logger.warning(f"notification collectible label lookup failed: {e}")

    if by_type["walkthrough"]:
        try:
            rows = (await db.execute(
                select(Walkthrough).where(Walkthrough.id.in_(by_type["walkthrough"]))
            )).scalars()
            for r in rows:
                out[("walkthrough", r.id)] = (r.title, f"/walkthroughs/{r.mission_type}/{r.slug}")
        except Exception as e:
            logger.warning(f"notification walkthrough label lookup failed: {e}")

    if by_type["level"]:
        try:
            rows = (await db.execute(
                select(Level).where(Level.id.in_(by_type["level"]))
            )).scalars()
            for r in rows:
                out[("level", r.id)] = (r.name, f"/levels/{_level_slug(r.name)}")
        except Exception as e:
            logger.warning(f"notification level label lookup failed: {e}")

    return out


@router.get("", response_model=NotificationList)
@limiter.limit(settings.RATE_LIMIT_PER_MINUTE)
async def list_notifications(
    request: Request,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Recent notifications for the current user + unread count."""
    # Outer join the actor so a deleted actor (actor_id SET NULL) yields a null username.
    rows = (await db.execute(
        select(Notification, User.username)
        .outerjoin(User, Notification.actor_id == User.id)
        .where(Notification.user_id == current_user.id)
        .order_by(Notification.created_at.desc())
        .limit(_LIMIT)
    )).all()

    notifications = [n for n, _ in rows]
    label_urls = await _build_label_urls(db, notifications)

    items = []
    for n, actor_username in rows:
        label, base_url = label_urls.get((n.content_type, n.content_id), ("a comment", "#"))
        url = f"{base_url}#comment-{n.comment_id}" if (n.comment_id and base_url != "#") else base_url
        items.append(NotificationItem(
            id=n.id,
            type=n.type,
            actor_username=actor_username,  # may be None — client renders "Someone"
            label=label,
            url=url,
            content_type=n.content_type,
            content_id=n.content_id,
            is_read=n.is_read,
            created_at=n.created_at,
        ))

    unread_count = (await db.execute(
        select(func.count())
        .select_from(Notification)
        .where(Notification.user_id == current_user.id, Notification.is_read == False)  # noqa: E712
    )).scalar_one()

    return NotificationList(items=items, unread_count=unread_count)


@router.patch("/{notification_id}/read", status_code=status.HTTP_200_OK)
@limiter.limit(settings.RATE_LIMIT_PER_MINUTE)
async def mark_read(
    request: Request,
    notification_id: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Mark a single notification read (only the owner's)."""
    result = await db.execute(
        update(Notification)
        .where(Notification.id == notification_id, Notification.user_id == current_user.id)
        .values(is_read=True)
    )
    await db.commit()
    if result.rowcount == 0:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Notification not found")
    return {"status": "read", "id": notification_id}


@router.post("/read-all", status_code=status.HTTP_200_OK)
@limiter.limit(settings.RATE_LIMIT_PER_MINUTE)
async def mark_all_read(
    request: Request,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Mark all of the current user's notifications read."""
    await db.execute(
        update(Notification)
        .where(Notification.user_id == current_user.id, Notification.is_read == False)  # noqa: E712
        .values(is_read=True)
    )
    await db.commit()
    return {"status": "all-read"}

import logging

from fastapi import APIRouter, Depends, HTTPException, Request, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.db.database import get_db
from app.models.users import User
from app.core.auth import get_current_user, require_role
from app.core.security import limiter
from app.core.colours import CYAN, RED, RESET
from app.config.settings import settings
from app.schemas.users import UpdateProfileRequest, UpdateRoleRequest
from app.services.users import (
    user_to_response,
    upload_avatar_to_cloudinary,
    delete_avatar_from_cloudinary,
)

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/users", tags=["users"])


# Routes

@router.get("/me")
@limiter.limit(settings.RATE_LIMIT_PER_MINUTE)
async def get_me(
    request: Request,
    current_user: User = Depends(get_current_user),
):
    """Return the authenticated user's profile."""
    return user_to_response(current_user)


@router.patch("/me")
@limiter.limit("20/minute")
async def update_me(
    request: Request,
    body: UpdateProfileRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Update the authenticated user's username or avatar."""
    if body.username and body.username != current_user.username:
        existing = await db.execute(select(User).where(User.username == body.username))
        if existing.scalar_one_or_none():
            raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Username already taken")
        current_user.username = body.username

    if body.avatar_url is not None:
      if body.avatar_url == "":
          delete_avatar_from_cloudinary(current_user.id)
          current_user.avatar_url = None
      else:
          try:
              cloudinary_url = await upload_avatar_to_cloudinary(body.avatar_url, current_user.id)
              current_user.avatar_url = cloudinary_url
          except HTTPException:
              raise
          except Exception as e:
              logger.error(f"{RED}Failed to upload avatar for user {current_user.id}: {e}{RESET}")
              raise HTTPException(status_code=400, detail="Failed to process avatar image")

    await db.commit()
    await db.refresh(current_user)

    logger.info(f"{CYAN}User {current_user.username} updated their profile{RESET}")
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
    await revoke_all_refresh_tokens(current_user.id)
    await db.delete(current_user)
    await db.commit()
    logger.info(f"{CYAN}User {current_user.username} deleted their account{RESET}")


@router.get("/{user_id}")
@limiter.limit(settings.RATE_LIMIT_PER_MINUTE)
async def get_user(
    request: Request,
    user_id: int,
    db: AsyncSession = Depends(get_db),
):
    """Public profile — returns limited info (no email)."""
    result = await db.execute(select(User).where(User.id == user_id, User.is_active == True))
    user = result.scalar_one_or_none()
    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")

    return {
        "id": user.id,
        "username": user.username,
        "avatar_url": user.avatar_url,
        "role": user.role,
        "created_at": user.created_at.isoformat(),
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
    result = await db.execute(select(User).where(User.id == user_id))
    user = result.scalar_one_or_none()
    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")

    user.is_active = False
    await db.commit()

    logger.info(f"{CYAN}Admin deactivated user {user_id}{RESET}")
    return {"status": "ok", "message": f"User {user_id} deactivated"}
import logging
import httpx
import cloudinary
import cloudinary.uploader
import openai
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, Request, status
from pydantic import BaseModel, field_validator
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from db.database import get_db
from models.users import User
from core.auth import get_current_user, require_role
from core.security import limiter
from config.settings import settings

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/users", tags=["users"])


# Schemas

class UserResponse(BaseModel):
    id: int
    email: str
    username: str
    avatar_url: Optional[str]
    role: str
    created_at: str

    class Config:
        from_attributes = True


class UpdateProfileRequest(BaseModel):
    username: Optional[str] = None
    avatar_url: Optional[str] = None

    @field_validator("username")
    @classmethod
    def username_valid(cls, v: Optional[str]) -> Optional[str]:
        if v is None:
            return v
        v = v.strip()
        if len(v) < 3 or len(v) > 50:
            raise ValueError("Username must be between 3 and 50 characters")
        if not v.replace("_", "").replace("-", "").isalnum():
            raise ValueError("Username may only contain letters, numbers, hyphens, and underscores")
        return v


class UpdateRoleRequest(BaseModel):
    role: str

    @field_validator("role")
    @classmethod
    def role_valid(cls, v: str) -> str:
        allowed = {"user", "moderator", "admin"}
        if v not in allowed:
            raise ValueError(f"Role must be one of: {', '.join(allowed)}")
        return v


# Helpers

def user_to_response(user: User) -> dict:
    return {
        "id": user.id,
        "email": user.email,
        "username": user.username,
        "avatar_url": user.avatar_url,
        "role": user.role,
        "created_at": user.created_at.isoformat(),
    }

async def check_image_moderation(url: str) -> None:
    """Check image against OpenAI moderation API. Raises HTTPException if flagged."""
    client = openai.AsyncOpenAI(api_key=settings.OPENAI_API_KEY)
    response = await client.moderations.create(
        model="omni-moderation-latest",
        input=[{"type": "image_url", "image_url": {"url": url}}]
    )
    result = response.results[0]
    if result.flagged:
        flagged_categories = [cat for cat, flagged in result.categories.__dict__.items() if flagged]
        logger.warning(f"Avatar image flagged by moderation: {flagged_categories}")
        raise HTTPException(status_code=400, detail="Image was rejected by content moderation")

async def upload_avatar_to_cloudinary(url: str, user_id: int) -> str:
    async with httpx.AsyncClient() as client:
        response = await client.get(url, follow_redirects=True, timeout=10)
        if response.status_code != 200:
            raise HTTPException(status_code=400, detail="Could not fetch image from URL")
        content_type = response.headers.get("content-type", "")
        if not content_type.startswith("image/"):
            raise HTTPException(status_code=400, detail="URL does not point to an image")

    await check_image_moderation(url)  # check before uploading

    result = cloudinary.uploader.upload(
        url,
        folder="stellar-blade/avatars",
        public_id=f"user-{user_id}.webp",
        overwrite=True,
        transformation=[
            {"width": 100, "height": 100, "crop": "fill", "gravity": "face", "quality": "auto"}
        ],
        format="webp"
    )
    return result["secure_url"]

def delete_avatar_from_cloudinary(user_id: int) -> None:
    """Delete a user's avatar from Cloudinary."""
    try:
        cloudinary.uploader.destroy(f"stellar-blade/avatars/user-{user_id}.webp")
    except Exception as e:
        logger.warning(f"Failed to delete Cloudinary avatar for user {user_id}: {e}")


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
              logger.error(f"Failed to upload avatar for user {current_user.id}: {e}")
              raise HTTPException(status_code=400, detail="Failed to process avatar image")

    await db.commit()
    await db.refresh(current_user)

    logger.info(f"User {current_user.username} updated their profile")
    return user_to_response(current_user)


@router.delete("/me", status_code=status.HTTP_204_NO_CONTENT)
@limiter.limit("5/minute")
async def delete_me(
    request: Request,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Permanently delete the authenticated user's account and all their data."""
    from core.auth import revoke_all_refresh_tokens
    await revoke_all_refresh_tokens(current_user.id)
    await db.delete(current_user)
    await db.commit()
    logger.info(f"User {current_user.username} deleted their account")


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

    logger.info(f"Admin updated user {user_id} role to {body.role}")
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

    logger.info(f"Admin deactivated user {user_id}")
    return {"status": "ok", "message": f"User {user_id} deactivated"}
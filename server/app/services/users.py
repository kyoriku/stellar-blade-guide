import logging
import httpx
import cloudinary
import cloudinary.uploader
import openai

from fastapi import HTTPException

from app.models.users import User
from app.core.colours import YELLOW, RESET
from app.config.settings import settings

logger = logging.getLogger(__name__)


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
        logger.warning(f"{YELLOW}Avatar image flagged by moderation: {flagged_categories}{RESET}")
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
        logger.warning(f"{YELLOW}Failed to delete Cloudinary avatar for user {user_id}: {e}{RESET}")

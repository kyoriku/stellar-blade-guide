import logging
import os

from openai import AsyncOpenAI

from app.models.comments import Comment
from app.core.colours import YELLOW, RESET

openai_client = AsyncOpenAI(api_key=os.getenv("OPENAI_API_KEY"))

logger = logging.getLogger(__name__)


async def _moderate_content(text: str) -> bool:
    """Returns True if safe, False if flagged."""
    try:
        response = await openai_client.moderations.create(input=text)
        return not response.results[0].flagged
    except Exception:
        logger.warning(f"{YELLOW}OpenAI moderation check failed, failing open{RESET}")
        return True  # fail open — don't break comments if OpenAI is down


def comment_to_dict(comment: Comment, include_replies: bool = False) -> dict:
    data = {
        "id": comment.id,
        "content_type": comment.content_type,
        "content_id": comment.content_id,
        "parent_id": comment.parent_id,
        "body": comment.body if not comment.is_deleted else "[deleted]",
        "is_deleted": comment.is_deleted,
        "created_at": comment.created_at.isoformat(),
        "updated_at": comment.updated_at.isoformat(),
        "user": None,
    }

    if comment.user and not comment.is_deleted:
        data["user"] = {
            "id": comment.user.id,
            "username": comment.user.username,
            "avatar_url": comment.user.avatar_url,
            "role": comment.user.role,
        }

    if include_replies and comment.replies:
      data["replies"] = [
          comment_to_dict(r)
          for r in comment.replies
          if r.is_approved and not r.is_deleted
      ]

    return data

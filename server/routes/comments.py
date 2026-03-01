import logging
import os
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, Request, status
from pydantic import BaseModel, field_validator
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, and_, or_
from sqlalchemy import exists as sa_exists
from sqlalchemy.orm import selectinload, aliased

from db.database import get_db
from models.comments import Comment
from models.users import User
from core.auth import get_current_user
from core.security import limiter
from config.settings import settings
from openai import AsyncOpenAI

CYAN = "\033[96m"
YELLOW = "\033[93m"
RED = "\033[91m"
RESET = "\033[0m"

openai_client = AsyncOpenAI(api_key=os.getenv("OPENAI_API_KEY"))

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/comments", tags=["comments"])

async def _moderate_content(text: str) -> bool:
    """Returns True if safe, False if flagged."""
    try:
        response = await openai_client.moderations.create(input=text)
        return not response.results[0].flagged
    except Exception:
        logger.warning(f"{YELLOW}OpenAI moderation check failed, failing open{RESET}")
        return True  # fail open — don't break comments if OpenAI is down


# Schemas

class CreateCommentRequest(BaseModel):
    content_type: str
    content_id: int
    body: str
    parent_id: Optional[int] = None
    content_name: Optional[str] = None 

    @field_validator("content_type")
    @classmethod
    def content_type_valid(cls, v: str) -> str:
        allowed = {"walkthrough", "collectible", "level"}
        if v not in allowed:
            raise ValueError(f"content_type must be one of: {', '.join(allowed)}")
        return v

    @field_validator("body")
    @classmethod
    def body_not_empty(cls, v: str) -> str:
        v = v.strip()
        if len(v) < 1:
            raise ValueError("Comment body cannot be empty")
        if len(v) > 2000:
            raise ValueError("Comment body cannot exceed 2000 characters")
        return v


class UpdateCommentRequest(BaseModel):
    body: str

    @field_validator("body")
    @classmethod
    def body_not_empty(cls, v: str) -> str:
        v = v.strip()
        if len(v) < 1:
            raise ValueError("Comment body cannot be empty")
        if len(v) > 2000:
            raise ValueError("Comment body cannot exceed 2000 characters")
        return v


# Helpers

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

# Read

@router.get("/{content_type}/{content_id}")
@limiter.limit(settings.RATE_LIMIT_PER_MINUTE)
async def get_comments(
    request: Request,
    content_type: str,
    content_id: int,
    db: AsyncSession = Depends(get_db),
):
    allowed_types = {"walkthrough", "collectible", "level"}
    if content_type not in allowed_types:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid content type")

    Reply = aliased(Comment)
    has_live_replies = sa_exists().where(
        and_(
            Reply.parent_id == Comment.id,
            Reply.is_deleted == False,
            Reply.is_approved == True,
        )
    )

    result = await db.execute(
        select(Comment)
        .options(
            selectinload(Comment.user),
            selectinload(Comment.replies).selectinload(Comment.user),
        )
        .where(
            and_(
                Comment.content_type == content_type,
                Comment.content_id == content_id,
                Comment.parent_id == None,
                Comment.is_approved == True,
                or_(
                    Comment.is_deleted == False,
                    has_live_replies,
                )
            )
        )
        .order_by(Comment.created_at.asc())
    )
    comments = result.scalars().all()
    return [comment_to_dict(c, include_replies=True) for c in comments]


# Create

@router.post("/", status_code=status.HTTP_201_CREATED)
@limiter.limit("10/minute")
async def create_comment(
    request: Request,
    body: CreateCommentRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Create a new comment. Requires authentication."""

    # If replying, verify parent exists and belongs to the same content
    if body.parent_id is not None:
        result = await db.execute(select(Comment).where(Comment.id == body.parent_id))
        parent = result.scalar_one_or_none()
        if not parent:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Parent comment not found")
        if parent.content_type != body.content_type or parent.content_id != body.content_id:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Reply must belong to the same content")
        if parent.parent_id is not None:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Cannot reply to a reply")

    if not await _moderate_content(body.body):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Comment was flagged as inappropriate"
        )

    comment = Comment(
        user_id=current_user.id,
        content_type=body.content_type,
        content_id=body.content_id,
        parent_id=body.parent_id,
        body=body.body.strip(),
    )
    db.add(comment)
    await db.commit()
    await db.refresh(comment)

    # Re-fetch with user relationship loaded
    result = await db.execute(
        select(Comment)
        .options(selectinload(Comment.user))
        .where(Comment.id == comment.id)
    )
    comment = result.scalar_one()

    name_part = f": {body.content_name} (ID: {body.content_id})" if body.content_name else f" {body.content_id}"
    logger.info(f"{CYAN}User {current_user.username} commented on {body.content_type}{name_part}{RESET}")
    return comment_to_dict(comment)


# Update

@router.patch("/{comment_id}")
@limiter.limit("20/minute")
async def update_comment(
    request: Request,
    comment_id: int,
    body: UpdateCommentRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Edit your own comment. Moderators and admins can edit any comment."""
    result = await db.execute(
        select(Comment)
        .options(selectinload(Comment.user))
        .where(Comment.id == comment_id)
    )
    comment = result.scalar_one_or_none()

    if not comment or comment.is_deleted:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Comment not found")

    is_owner = comment.user_id == current_user.id
    # is_privileged = current_user.role in ("moderator", "admin")

    # if not is_owner and not is_privileged:
    if not is_owner:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Cannot edit this comment")

    comment.body = body.body.strip()
    await db.commit()
    await db.refresh(comment)

    return comment_to_dict(comment)


# Delete

@router.delete("/{comment_id}", status_code=status.HTTP_204_NO_CONTENT)
@limiter.limit("20/minute")
async def delete_comment(
    request: Request,
    comment_id: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """
    Soft-delete a comment. Body is replaced with [deleted] but replies are preserved.
    Users can delete their own. Moderators and admins can delete any.
    """
    result = await db.execute(select(Comment).where(Comment.id == comment_id))
    comment = result.scalar_one_or_none()

    if not comment or comment.is_deleted:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Comment not found")

    is_owner = comment.user_id == current_user.id
    is_privileged = current_user.role in ("moderator", "admin")

    if not is_owner and not is_privileged:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Cannot delete this comment")

    comment.is_deleted = True
    comment.body = "[deleted]"
    await db.commit()
    logger.info(f"{CYAN}User {current_user.username} deleted comment {comment_id} on {comment.content_type} {comment.content_id}{RESET}")


# Moderation

# @router.get("/moderation/queue")
# @limiter.limit("30/minute")
# async def moderation_queue(
#     request: Request,
#     db: AsyncSession = Depends(get_db),
#     _mod: User = Depends(require_role("moderator", "admin")),
# ):
#     """Moderator/admin only: list all unapproved comments."""
#     result = await db.execute(
#         select(Comment)
#         .options(selectinload(Comment.user))
#         .where(Comment.is_approved == False, Comment.is_deleted == False)
#         .order_by(Comment.created_at.asc())
#     )
#     comments = result.scalars().all()
#     return [comment_to_dict(c) for c in comments]


# @router.patch("/{comment_id}/approve")
# @limiter.limit("30/minute")
# async def approve_comment(
#     request: Request,
#     comment_id: int,
#     db: AsyncSession = Depends(get_db),
#     _mod: User = Depends(require_role("moderator", "admin")),
# ):
#     """Moderator/admin only: approve a comment in the moderation queue."""
#     result = await db.execute(select(Comment).where(Comment.id == comment_id))
#     comment = result.scalar_one_or_none()

#     if not comment:
#         raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Comment not found")

#     comment.is_approved = True
#     await db.commit()

#     logger.info(f"Comment {comment_id} approved by moderator")
#     return {"status": "ok", "comment_id": comment_id}
"""The admin dashboard's API: every account, masked emails revealed one at a time,
roles, deactivation and deletion.

The admin check sits on the router, so no route here can miss it. The role is read
from the database on every request (require_role over get_current_user); the access
token's role claim is never read. Admin accounts, the caller's own included, can't be
changed through any of these routes, and no route can make or unmake an admin. Every
limit here counts per admin account, not per address (admin_rate_key).
"""
import logging
from typing import List

from fastapi import APIRouter, Depends, HTTPException, Request, status
from sqlalchemy import func, or_, select, update
from sqlalchemy.ext.asyncio import AsyncSession

from app.config.settings import settings
from app.core.auth import require_role, revoke_all_refresh_tokens
from app.core.colours import CYAN, RESET
from app.core.ids import is_row_id
from app.core.security import limiter, rate_limit_key
from app.db.database import LIKE_ESCAPE, escape_like, get_db
from app.models.users import User
from app.schemas.admin import (
    AdminActiveRequest,
    AdminRoleRequest,
    AdminSearchRequest,
    AdminUser,
    RevealedEmail,
)
from app.services.users import admin_user_row, delete_account

logger = logging.getLogger(__name__)

_admin_role = require_role("admin")


async def require_admin(request: Request, admin: User = Depends(_admin_role)) -> User:
    """The check every route here sits behind. It also notes whose request this is,
    for admin_rate_key: FastAPI resolves it before slowapi checks a route's limit."""
    request.state.admin_id = admin.id
    return admin


def admin_rate_key(request: Request) -> str:
    """The limit key on every route here: the admin's account, not the address, so
    all of the account's sessions share one budget wherever they call from. A stolen
    token can't multiply it across addresses, though it can spend it. The address is
    only a fallback, since require_admin always runs first. The parameter must be
    named request, or slowapi calls this bare."""
    admin_id = getattr(request.state, "admin_id", None)
    return f"admin:{admin_id}" if admin_id is not None else rate_limit_key(request)


router = APIRouter(prefix="/admin", tags=["admin"], dependencies=[Depends(require_admin)])

# Each reveal sends a whole address and is logged, so it gets a day limit as well as a
# minute one, as deletion does. slowapi stops at the first limit that fails, so a burst
# the minute limit refuses never spends the day's budget. A refusal shows the site's
# rate-limit sentence, which says to wait a moment though a day limit can take hours to
# free; one admin is unlikely to meet them.
REVEAL_RATE_LIMIT = "10/minute;100/day"
# A search by a whole address confirms it, as a reveal does, so the search has a day
# limit too. It is ten times the reveal's: the box searches as the admin types.
ADMIN_SEARCH_RATE_LIMIT = "100/minute;1000/day"
ADMIN_WRITE_RATE_LIMIT = "20/minute"
ADMIN_DELETE_RATE_LIMIT = "5/minute;50/day"

USER_NOT_FOUND = "User not found"
ADMIN_TARGET = "Admin accounts can't be changed here."

# Newest first; the id breaks a tie, so the order never depends on the query plan.
NEWEST_FIRST = (User.created_at.desc(), User.id.desc())


async def _target(request: Request, db: AsyncSession, user_id: int) -> User:
    """The account an {id} route acts on: a 404 for an id no account has (one outside
    int4 included, before any query), and a 403 for any admin account, the caller's
    own included."""
    if not is_row_id(user_id):
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=USER_NOT_FOUND)
    user = (await db.execute(select(User).where(User.id == user_id))).scalar_one_or_none()
    if user is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=USER_NOT_FOUND)
    if user.role == "admin":
        request.state.reject_reason = "admin-target"
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail=ADMIN_TARGET)
    return user


async def _write_unless_admin(db: AsyncSession, user_id: int, **values) -> None:
    """One guarded UPDATE, the comment edit's pattern: it writes only while the row
    exists and isn't an admin's, so a deletion or a promotion by SQL that lands after
    _target is a 404 rather than a write to the wrong account."""
    result = await db.execute(
        update(User).where(User.id == user_id, User.role != "admin").values(**values)
    )
    if result.rowcount != 1:
        await db.rollback()
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=USER_NOT_FOUND)
    await db.commit()


@router.get("/users", response_model=List[AdminUser])
@limiter.limit(settings.RATE_LIMIT_PER_MINUTE, key_func=admin_rate_key)
async def list_users(request: Request, db: AsyncSession = Depends(get_db)):
    """Every account, newest first. There are few enough that the page takes them all."""
    users = (await db.execute(select(User).order_by(*NEWEST_FIRST))).scalars().all()
    return [admin_user_row(user) for user in users]


@router.post("/users/search", response_model=List[AdminUser])
@limiter.limit(ADMIN_SEARCH_RATE_LIMIT, key_func=admin_rate_key)
async def search_users(
    request: Request,
    body: AdminSearchRequest,
    admin: User = Depends(require_admin),
    db: AsyncSession = Depends(get_db),
):
    """Accounts whose username holds the text, or whose email is exactly it, both
    case-insensitive, in the list's order. A POST, so a typed address stays out of
    URLs and every request log."""
    admin_id = admin.id
    q = body.q.strip()
    query = select(User).order_by(*NEWEST_FIRST)
    if q:
        if not _storable(q):
            return []
        query = query.where(or_(
            User.username.ilike(f"%{escape_like(q)}%", escape=LIKE_ESCAPE),
            func.lower(User.email) == func.lower(q),
        ))
    users = (await db.execute(query)).scalars().all()
    # No username holds an @ (core/usernames.py), so with one in the text every match
    # is an address typed whole: it ties that address to the account, as a reveal
    # does, so it is logged like one, by account number. The text never is.
    if "@" in q:
        for user in users:
            logger.info(f"{CYAN}Admin {admin_id} found user {user.id} by email address{RESET}")
    return [admin_user_row(user) for user in users]


def _storable(text: str) -> bool:
    """Whether a text parameter can carry the text: Postgres refuses a NUL, and asyncpg
    can't encode a lone surrogate. No username or address holds either, so a search
    for one finds nothing, without a query."""
    if chr(0) in text:
        return False
    try:
        text.encode("utf-8")
    except UnicodeEncodeError:
        return False
    return True


@router.post("/users/{user_id}/email", response_model=RevealedEmail)
@limiter.limit(REVEAL_RATE_LIMIT, key_func=admin_rate_key)
async def reveal_email(
    request: Request,
    user_id: int,
    admin: User = Depends(require_admin),
    db: AsyncSession = Depends(get_db),
):
    """One account's whole address. The only answer that holds one, so every reveal
    is logged, by account number."""
    admin_id = admin.id
    target = await _target(request, db, user_id)
    logger.info(f"{CYAN}Admin {admin_id} revealed the email address of user {target.id}{RESET}")
    return {"id": target.id, "email": target.email}


@router.put("/users/{user_id}/role", response_model=AdminUser)
@limiter.limit(ADMIN_WRITE_RATE_LIMIT, key_func=admin_rate_key)
async def set_role(
    request: Request,
    user_id: int,
    body: AdminRoleRequest,
    admin: User = Depends(require_admin),
    db: AsyncSession = Depends(get_db),
):
    """Make an account a moderator or a user again."""
    admin_id = admin.id
    target = await _target(request, db, user_id)
    # No reload after: the guarded UPDATE's session sync has already set the new role
    # on target, and a reload would fail if the account were deleted meanwhile.
    await _write_unless_admin(db, target.id, role=body.role)
    logger.info(f"{CYAN}Admin {admin_id} set user {target.id} role to {body.role}{RESET}")
    return admin_user_row(target)


@router.put("/users/{user_id}/active", response_model=AdminUser)
@limiter.limit(ADMIN_WRITE_RATE_LIMIT, key_func=admin_rate_key)
async def set_active(
    request: Request,
    user_id: int,
    body: AdminActiveRequest,
    admin: User = Depends(require_admin),
    db: AsyncSession = Depends(get_db),
):
    """Deactivate or reactivate an account. Its sessions end first either way:
    deactivating signs it out everywhere, and reactivating can't bring back a session
    left over from an earlier deactivation. Reactivating an active account changes
    nothing, its sessions included: the press may come from a list loaded before the
    last reactivation."""
    admin_id = admin.id
    target = await _target(request, db, user_id)
    if body.active and target.is_active:
        return admin_user_row(target)
    await revoke_all_refresh_tokens(target.id)
    # No reload after, as in set_role.
    await _write_unless_admin(db, target.id, is_active=body.active)
    done = "reactivated" if body.active else "deactivated"
    logger.info(f"{CYAN}Admin {admin_id} {done} user {target.id}{RESET}")
    return admin_user_row(target)


@router.delete("/users/{user_id}", status_code=status.HTTP_204_NO_CONTENT)
@limiter.limit(ADMIN_DELETE_RATE_LIMIT, key_func=admin_rate_key)
async def delete_user(
    request: Request,
    user_id: int,
    admin: User = Depends(require_admin),
    db: AsyncSession = Depends(get_db),
):
    """Delete an account through the same function Settings uses, a deactivated one
    included (its owner can't sign in to do it). The function logs the deletion. A
    404 when another deletion got there first."""
    admin_id = admin.id
    target = await _target(request, db, user_id)
    if not await delete_account(db, target, admin_id=admin_id):
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=USER_NOT_FOUND)

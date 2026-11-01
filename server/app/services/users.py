import asyncio
import base64
import io
import ipaddress
import logging
import socket

import httpx
import cloudinary
import cloudinary.uploader
import openai

from fastapi import HTTPException, status
from sqlalchemy import select, update
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.comments import Comment
from app.models.users import User
from app.core.auth import revoke_all_refresh_tokens
from app.core.colours import CYAN, GRAY, RED, YELLOW, RESET
from app.config.settings import settings
from app.core.logging import exc_text, sanitize_log_field
from app.services.auth import user_to_dict

logger = logging.getLogger(__name__)

# Cloudinary's free-tier per-image limit — the binding constraint, not OpenAI's
# 20 MB moderation cap. Also bounds how much of a hostile URL we buffer in memory.
MAX_AVATAR_BYTES = 10 * 1024 * 1024
MAX_REDIRECTS = 3

# httpx timeouts are PER-OPERATION, so a server dripping one byte at a time
# never trips them. get_current_user checks a pooled DB connection out before
# this route body runs, so an unbounded avatar upload holds that connection
# until the client gives up. These deadlines are what bound the hold.
AVATAR_PIPELINE_TIMEOUT = 25   # hard bound on how long a pooled DB connection can be held
AVATAR_FETCH_TIMEOUT = 15      # the whole redirect loop, not per hop
CLOUDINARY_TIMEOUT = 15
MODERATION_TIMEOUT = 10.0
MODERATION_MAX_RETRIES = 1

# Moderation statuses that mean "try again later", not "your image is bad":
# 401/403 are OUR credentials failing (expired/revoked key, org permission) — an
# outage on our side, so surfacing it as a per-user 400 would blame the user for
# our misconfiguration AND hide the real problem. 408/429 are transient by
# definition. Everything else in 4xx means OpenAI looked at this specific image
# and could not decode it.
_MODERATION_RETRY_STATUSES = {401, 403, 408, 429}


def user_to_response(user: User) -> dict:
    # One builder. This used to be a second copy of the same dict, which would have
    # drifted the day only one of them learned a new field.
    return user_to_dict(user)


def mask_email(email: str) -> str:
    """An address as the admin page shows it before a reveal: the first character of
    each half, then the last label of the domain. kyoriku@gmail.com becomes
    k***@g***.com. Anything not shaped like local@name.tld becomes *** whole, so a
    malformed address never shows more than a well-formed one."""
    local, at, domain = email.partition("@")
    labels = domain.split(".")
    if not at or not local or "@" in domain or len(labels) < 2 or not all(labels):
        return "***"
    return f"{local[0]}***@{labels[0][0]}***.{labels[-1]}"


def admin_user_row(user: User) -> dict:
    """One account as every admin list, role and status answer gives it (AdminUser).
    The address is masked: only the reveal route ever sends one whole."""
    return {
        "id": user.id,
        "username": user.username,
        "avatar_url": user.avatar_url,
        "email_masked": mask_email(user.email),
        "role": user.role,
        "is_active": user.is_active,
        "created_at": user.created_at.isoformat(),
    }


ADMIN_UNDELETABLE = "Admin accounts can't be deleted."


async def delete_account(db: AsyncSession, user: User, *, admin_id: int | None = None) -> bool:
    """Delete an account and everything tied to it: Settings (DELETE /api/users/me)
    and the admin page (DELETE /api/admin/users/{id}, which passes admin_id) both
    come here.

    An admin account is refused everywhere with a 403, before its sessions are
    touched, so the site can't lose its admin through the app. The role is read
    again under the row lock, since a promotion by SQL can land after the caller
    loaded the row: that is refused too, and its only cost is the account's
    sessions, already ended by then.

    False when the account was already gone at the lock (another deletion won), with
    nothing written, logged or sent to Cloudinary; True once it is deleted."""
    if user.role == "admin":
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail=ADMIN_UNDELETABLE)
    user_id = user.id

    # Before anything changes: a Redis outage is a 503 with the account untouched.
    await revoke_all_refresh_tokens(user_id)
    # Lock the account row first. A comment the account posts from another tab meanwhile
    # then either commits before the erase below, which sees it, or waits on this lock
    # (its foreign key check needs the row) and fails once the account is gone, rather
    # than slipping in after the erase with its text. SQLite ignores FOR UPDATE.
    role = (await db.execute(
        select(User.role).where(User.id == user_id).with_for_update()
    )).scalar_one_or_none()
    if role is None:
        await db.rollback()
        return False
    if role == "admin":
        await db.rollback()
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail=ADMIN_UNDELETABLE)

    # Each comment is erased as DELETE /comments/{id} erases one, so the list leaves it
    # out, or shows "[deleted]" while a reply to it is up. user_id is cleared here, not
    # by deleting the user, whose UPDATE would stamp every comment with one updated_at
    # (the column's onupdate) and tie them to one account.
    await db.execute(
        update(Comment)
        .where(Comment.user_id == user_id)
        .values(user_id=None, is_deleted=True, body="[deleted]", updated_at=Comment.updated_at)
    )
    # The ORM deletes the OAuth links; the database cascades remove the progress and
    # the notifications the account received, and clear it from the ones it caused.
    await db.delete(user)
    await db.commit()
    # Logged as it commits, by account number: the line is the deletion's only record,
    # so a deploy or a crash during the avatar call below must not cost it.
    if admin_id is None:
        logger.info(f"{CYAN}User {user_id} deleted their account{RESET}")
    else:
        logger.info(f"{CYAN}Admin {admin_id} deleted user {user_id}{RESET}")

    # After the commit: deleting the account is what was asked for, so a slow or
    # failing Cloudinary call must not block or roll it back. The public_id is derived
    # from the user id, so deleting the row first loses nothing, and destroying a
    # non-existent asset is a no-op.
    await delete_avatar_from_cloudinary(user_id)
    return True

def _resolve_host(hostname: str) -> list[str]:
    """DNS-resolve a hostname to its addresses. Module-level so tests can stub it."""
    try:
        infos = socket.getaddrinfo(hostname, None)
    except socket.gaierror:
        raise HTTPException(status_code=400, detail="Could not fetch image from URL")
    return [info[4][0] for info in infos]

async def _validate_avatar_url(url: str) -> None:
    """SSRF guard, applied to every redirect hop: https only, and the host must
    resolve exclusively to globally routable addresses (rejects loopback,
    private, link-local/metadata, CGN, and reserved ranges)."""
    parsed = httpx.URL(url)
    if parsed.scheme != "https":
        raise HTTPException(status_code=400, detail="Avatar URL must use https")
    # raw_host, not host: .host is IDNA-decoded unicode, while the request goes
    # out to the punycode raw_host. Validating the decoded form would let an
    # attacker point the two names at different addresses.
    host = parsed.raw_host.decode("ascii", "replace")
    if not host:
        raise HTTPException(status_code=400, detail="Avatar URL host is not allowed")
    try:
        ipaddress.ip_address(host)  # literal IP — no DNS needed
        addresses = [host]
    except ValueError:
        addresses = await asyncio.to_thread(_resolve_host, host)
    for address in addresses:
        if not ipaddress.ip_address(address).is_global:
            raise HTTPException(status_code=400, detail="Avatar URL host is not allowed")

async def _fetch_avatar_image(url: str) -> tuple[bytes, str]:
    """Fetch the avatar image exactly once, with SSRF and size guards. Returns
    (bytes, content_type); those bytes are what gets moderated and uploaded —
    the URL is never dereferenced again after this."""
    try:
        # httpx's per-operation timeout below resets on every chunk received, so
        # a drip-feeding server would otherwise keep this open forever. This
        # deadline covers the whole loop — every hop, every byte.
        async with asyncio.timeout(AVATAR_FETCH_TIMEOUT):
            async with httpx.AsyncClient() as client:
                # Manual redirect loop: every hop gets the scheme/host validation, so a
                # redirect to http or to an internal address rejects before any request.
                for _ in range(MAX_REDIRECTS + 1):
                    await _validate_avatar_url(url)
                    async with client.stream(
                        "GET", url,
                        follow_redirects=False,
                        timeout=10,
                        # Images are already compressed; asking for identity keeps
                        # well-behaved servers from handing us an expandable body.
                        headers={"Accept-Encoding": "identity"},
                    ) as response:
                        # has_redirect_location, not is_redirect: the latter is a bare
                        # status-code check, so a 3xx with no Location would KeyError.
                        if response.has_redirect_location:
                            url = str(httpx.URL(url).join(response.headers["location"]))
                            continue
                        if response.status_code != 200:
                            raise HTTPException(status_code=400, detail="Could not fetch image from URL")
                        content_type = response.headers.get("content-type", "")
                        if not content_type.startswith("image/"):
                            raise HTTPException(status_code=400, detail="URL does not point to an image")
                        # A compressed body defeats the size cap: Content-Length is the
                        # COMPRESSED size and aiter_bytes() yields decoded bytes, so a few
                        # KB can expand past MAX_AVATAR_BYTES before the streaming check
                        # fires. We ask for identity above; a server that ignores that
                        # gets rejected here.
                        encoding = response.headers.get("content-encoding", "").strip().lower()
                        if encoding and encoding != "identity":
                            logger.warning(f"{YELLOW}Rejecting compressed avatar response (content-encoding: {sanitize_log_field(encoding, 40)}){RESET}")
                            raise HTTPException(
                                status_code=400,
                                detail="Image could not be processed. Try uploading a different file.",
                            )
                        content_length = response.headers.get("content-length", "")
                        if (content_length.isascii() and content_length.isdigit()
                                and int(content_length) > MAX_AVATAR_BYTES):
                            raise HTTPException(status_code=400, detail="Image is too large (max 10 MB)")
                        data = bytearray()
                        async for chunk in response.aiter_bytes():
                            data.extend(chunk)
                            if len(data) > MAX_AVATAR_BYTES:
                                # abort mid-stream — Content-Length can be absent or lie
                                raise HTTPException(status_code=400, detail="Image is too large (max 10 MB)")
                        return bytes(data), content_type
    except TimeoutError:
        logger.warning(f"{YELLOW}Avatar fetch exceeded {AVATAR_FETCH_TIMEOUT}s deadline{RESET}")
        raise HTTPException(status_code=504, detail="Image URL took too long to respond.")
    raise HTTPException(status_code=400, detail="Too many redirects")

async def check_image_moderation(image_bytes: bytes, content_type: str) -> None:
    """Moderate the actual fetched image bytes (as a base64 data URL) — never a
    URL, so the moderated content is byte-identical to what gets uploaded.
    Raises HTTPException(400) if flagged, HTTPException(503) if the moderation
    service is unavailable.

    Deliberately fails closed (unlike comment moderation, which fails open):
    blocking comments during an OpenAI outage breaks the site's main
    interaction, whereas an avatar can wait."""
    mime = content_type.split(";")[0].strip()
    data_url = f"data:{mime};base64,{base64.b64encode(image_bytes).decode()}"
    # Explicit bounds: the SDK defaults to a 600s timeout with 2 retries, i.e.
    # ~30 minutes of holding a pooled DB connection during an OpenAI incident.
    client = openai.AsyncOpenAI(
        api_key=settings.OPENAI_API_KEY,
        timeout=MODERATION_TIMEOUT,
        max_retries=MODERATION_MAX_RETRIES,
    )
    try:
        response = await client.moderations.create(
            model="omni-moderation-latest",
            input=[{"type": "image_url", "image_url": {"url": data_url}}]
        )
        result = response.results[0]
    except Exception as e:
        status = getattr(e, "status_code", None) if isinstance(e, openai.APIStatusError) else None
        if status is not None and 400 <= status < 500 and status not in _MODERATION_RETRY_STATUSES:
            logger.warning(f"{YELLOW}Moderation API rejected avatar image ({status}): {exc_text(e)}{RESET}")
            raise HTTPException(
                status_code=400,
                detail="Image format is not supported. Use PNG, JPEG, GIF, or WebP.",
            )
        logger.warning(f"{YELLOW}OpenAI moderation unreachable, rejecting avatar upload: {exc_text(e)}{RESET}")
        raise HTTPException(
            status_code=503,
            detail="Avatar upload is temporarily unavailable. Please try again in a moment.",
            headers={"Retry-After": "30"},
        )
    if result.flagged:
        # Not the categories: the access line beside it holds the IP, and they can say
        # self-harm or sexual content involving minors.
        logger.warning(f"{YELLOW}Avatar image flagged by moderation{RESET}")
        raise HTTPException(status_code=400, detail="Image was rejected by content moderation")

async def upload_avatar_to_cloudinary(url: str, user_id: int) -> str:
    """Fetch, moderate, and store an avatar under a single hard deadline.

    The deadline is what bounds how long the caller's pooled DB connection is
    held: get_current_user checks one out before the route body runs, and the
    pool is small enough that a handful of unbounded uploads would exhaust it."""
    try:
        async with asyncio.timeout(AVATAR_PIPELINE_TIMEOUT):
            data, content_type = await _fetch_avatar_image(url)
            await check_image_moderation(data, content_type)  # moderate the exact bytes we upload

            # The outer deadline frees this coroutine but does NOT stop this
            # thread — asyncio cannot cancel a running to_thread call. The
            # timeout passed to Cloudinary is the actual bound on the thread.
            return await asyncio.to_thread(_upload_to_cloudinary_sync, data, user_id)
    except TimeoutError:
        logger.warning(f"{YELLOW}Avatar pipeline exceeded {AVATAR_PIPELINE_TIMEOUT}s deadline for user {user_id}{RESET}")
        raise HTTPException(
            status_code=503,
            detail="Avatar upload is temporarily unavailable. Please try again in a moment.",
            headers={"Retry-After": "30"},
        )

def _upload_to_cloudinary_sync(data: bytes, user_id: int) -> str:
    result = cloudinary.uploader.upload(
        io.BytesIO(data),
        folder="stellar-blade/avatars",
        public_id=f"user-{user_id}.webp",
        overwrite=True,
        transformation=[
            {"width": 100, "height": 100, "crop": "fill", "gravity": "face", "quality": "auto"}
        ],
        format="webp",
        timeout=CLOUDINARY_TIMEOUT,
    )
    return result["secure_url"]

async def delete_avatar_from_cloudinary(user_id: int) -> None:
    """Delete a user's avatar from Cloudinary. Never raises.

    Runs off the event loop because the SDK is synchronous, and is bounded by
    CLOUDINARY_TIMEOUT. Failures are swallowed so they cannot block whatever
    the caller was actually doing — which makes the log line below the only
    record that an orphaned asset exists, since there is no reconciliation
    script for Cloudinary."""
    public_id = f"stellar-blade/avatars/user-{user_id}.webp"

    def _destroy() -> None:
        try:
            result = cloudinary.uploader.destroy(public_id, timeout=CLOUDINARY_TIMEOUT)
            status = (result or {}).get("result")
            if status == "ok":
                logger.info(f"{CYAN}Deleted Cloudinary avatar {public_id}{RESET}")
            elif status == "not found":
                # Normal: OAuth users and users who never uploaded have no asset.
                logger.info(f"{GRAY}No Cloudinary avatar to delete for {public_id}{RESET}")
            else:
                logger.warning(f"{YELLOW}Unexpected Cloudinary destroy result for {public_id}: {status}{RESET}")
        except Exception as e:
            logger.error(f"{RED}Failed to delete Cloudinary avatar {public_id}; the asset may be orphaned: {exc_text(e)}{RESET}")

    # Cancelling this coroutine does NOT stop the thread; CLOUDINARY_TIMEOUT
    # above is the actual bound on how long it lives.
    await asyncio.to_thread(_destroy)

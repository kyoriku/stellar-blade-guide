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

from fastapi import HTTPException

from app.models.users import User
from app.core.colours import YELLOW, RESET
from app.config.settings import settings

logger = logging.getLogger(__name__)

# Cloudinary's free-tier per-image limit — the binding constraint, not OpenAI's
# 20 MB moderation cap. Also bounds how much of a hostile URL we buffer in memory.
MAX_AVATAR_BYTES = 10 * 1024 * 1024
MAX_REDIRECTS = 3


def user_to_response(user: User) -> dict:
    return {
        "id": user.id,
        "email": user.email,
        "username": user.username,
        "avatar_url": user.avatar_url,
        "role": user.role,
        "created_at": user.created_at.isoformat(),
    }

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
    async with httpx.AsyncClient() as client:
        # Manual redirect loop: every hop gets the scheme/host validation, so a
        # redirect to http or to an internal address rejects before any request.
        for _ in range(MAX_REDIRECTS + 1):
            await _validate_avatar_url(url)
            async with client.stream("GET", url, follow_redirects=False, timeout=10) as response:
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
    client = openai.AsyncOpenAI(api_key=settings.OPENAI_API_KEY)
    try:
        response = await client.moderations.create(
            model="omni-moderation-latest",
            input=[{"type": "image_url", "image_url": {"url": data_url}}]
        )
        result = response.results[0]
    except Exception as e:
        logger.warning(f"{YELLOW}OpenAI moderation unreachable, rejecting avatar upload: {e}{RESET}")
        raise HTTPException(
            status_code=503,
            detail="Avatar upload is temporarily unavailable. Please try again in a moment.",
            headers={"Retry-After": "30"},
        )
    if result.flagged:
        flagged_categories = [cat for cat, flagged in result.categories.__dict__.items() if flagged]
        logger.warning(f"{YELLOW}Avatar image flagged by moderation: {flagged_categories}{RESET}")
        raise HTTPException(status_code=400, detail="Image was rejected by content moderation")

async def upload_avatar_to_cloudinary(url: str, user_id: int) -> str:
    data, content_type = await _fetch_avatar_image(url)
    await check_image_moderation(data, content_type)  # moderate the exact bytes we upload

    result = cloudinary.uploader.upload(
        io.BytesIO(data),
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

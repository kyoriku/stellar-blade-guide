import os
from fastapi import APIRouter, Request, HTTPException
from core.cache import invalidate_cache_pattern, get_cache_stats

ADMIN_SECRET = os.getenv("ADMIN_SECRET")
router = APIRouter(prefix="/admin/cache", tags=["admin"])

def check_secret(request: Request):
    secret = request.headers.get("X-ADMIN-SECRET")
    if secret != ADMIN_SECRET:
        raise HTTPException(status_code=401, detail="Unauthorized")

@router.post("/flush")
async def flush_cache(request: Request):
    check_secret(request)
    await invalidate_cache_pattern("*")
    return {"status": "ok", "message": "cache cleared"}

@router.get("/stats")
async def cache_stats(request: Request):
    check_secret(request)
    stats = await get_cache_stats()
    return {"status": "ok", "stats": stats}
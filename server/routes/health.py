from fastapi import APIRouter, Request
from core.cache import redis_client

router = APIRouter()

@router.get("/health")
async def health_check(request: Request):
    redis_status = "connected"
    try:
        await redis_client.ping()
    except:
        redis_status = "disconnected"
    return {"status": "healthy", "redis": redis_status}
from contextlib import asynccontextmanager
from fastapi import FastAPI, Request

from app.config import settings
from app.core.logging import setup_logging
from app.core.cache import redis_client
from app.middleware.cors import add_cors_middleware
from app.middleware.rate_limit import add_rate_limit_middleware, limiter
from app.middleware.logging import add_logging_middleware
from app.api.routes import levels, collectibles, types, walkthroughs
from app.api.routes.admin import router as admin_router

# Configure logging
setup_logging()

@asynccontextmanager
async def lifespan(app: FastAPI):
    """Handle startup and shutdown events"""
    # === Startup ===
    try:
        redis_client.ping()
        print("\033[92m✓ Redis connection established\033[0m")
    except Exception as e:
        print(f"\033[91m✗ Redis connection failed: {e}\033[0m")

    try:
        yield
    finally:
    
    # === Shutdown ===
        try:
            redis_client.close()
            print("\033[92m✓ Redis connection closed\033[0m")
        except Exception as e:
            print(f"\033[91m✗ Error closing Redis: {e}\033[0m")

# Initialize FastAPI app
app = FastAPI(
    title=settings.PROJECT_NAME,
    lifespan=lifespan
)

# Middleware
add_cors_middleware(app)
add_rate_limit_middleware(app)
add_logging_middleware(app)

# Routers
app.include_router(levels.router, prefix=settings.API_PREFIX)
app.include_router(collectibles.router, prefix=settings.API_PREFIX)
app.include_router(types.router, prefix=settings.API_PREFIX)
app.include_router(walkthroughs.router, prefix=settings.API_PREFIX)
app.include_router(admin_router, prefix=settings.API_PREFIX)

# Health check and root endpoints
@app.get("/")
@limiter.limit(settings.RATE_LIMIT_PER_MINUTE)
def root(request: Request):
    return {"message": settings.PROJECT_NAME}

@app.get("/health")
def health_check(request: Request):
    """Check API and Redis health"""
    redis_status = "connected"
    try:
        redis_client.ping()
    except:
        redis_status = "disconnected"
    return {"status": "healthy", "redis": redis_status}
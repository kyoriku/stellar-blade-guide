from contextlib import asynccontextmanager
from fastapi import FastAPI, Request

from config.settings import settings
from core.logging import setup_logging
from core.cache import redis_client
from core.security import limiter
from middleware.cors import add_cors_middleware
from middleware.rate_limit import add_rate_limit_middleware
from middleware.logging import add_logging_middleware
from middleware.error_handler import add_error_handler_middleware
from middleware.security_headers import add_security_headers_middleware
from middleware.honeypot import add_banned_ip_middleware, add_honeypot_middleware
from routes import levels, collectibles, types, walkthroughs, admin

setup_logging()

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup
    try:
        await redis_client.ping()
        print("\033[92m✓ Redis connection established\033[0m")
    except Exception as e:
        print(f"\033[91m✗ Redis connection failed: {e}\033[0m")
    try:
      yield
    finally:
    # Shutdown
        try:
            await redis_client.close()
            print("\033[92m✓ Redis connection closed\033[0m")
        except Exception as e:
            print(f"\033[91m✗ Error closing Redis: {e}\033[0m")

app = FastAPI(title=settings.PROJECT_NAME, lifespan=lifespan)

# Middleware
add_cors_middleware(app)
add_rate_limit_middleware(app)
add_logging_middleware(app)
add_error_handler_middleware(app)
add_security_headers_middleware(app)
add_banned_ip_middleware(app)
add_honeypot_middleware(app)

# Routes
app.include_router(levels.router, prefix=settings.API_PREFIX)
app.include_router(collectibles.router, prefix=settings.API_PREFIX)
app.include_router(types.router, prefix=settings.API_PREFIX)
app.include_router(walkthroughs.router, prefix=settings.API_PREFIX)
app.include_router(admin.router, prefix=settings.API_PREFIX)

@app.get("/")
@limiter.limit(settings.RATE_LIMIT_PER_MINUTE)
async def root(request: Request):
    return {"message": settings.PROJECT_NAME}

@app.get("/health")
async def health_check(request: Request):
    redis_status = "connected"
    try:
        await redis_client.ping()
    except:
        redis_status = "disconnected"
    return {"status": "healthy", "redis": redis_status}
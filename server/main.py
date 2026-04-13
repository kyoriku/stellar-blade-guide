import os
import cloudinary
from contextlib import asynccontextmanager
from fastapi import FastAPI, Request
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse, Response
from starlette.middleware.gzip import GZipMiddleware

from config.settings import settings
from core.logging import setup_logging
from core.cache import redis_client
from middleware.rate_limit import add_rate_limit_middleware
from middleware.logging import add_logging_middleware
from middleware.error_handler import add_error_handler_middleware
from middleware.security_headers import add_security_headers_middleware
from middleware.bot_filter import add_bot_filter_middleware
from middleware.etag import ETagMiddleware
from routes import levels, collectibles, types, walkthroughs, admin, auth, users, comments, health, progress
setup_logging()

cloudinary.config(
    cloud_name=settings.CLOUDINARY_CLOUD_NAME,
    api_key=settings.CLOUDINARY_API_KEY,
    api_secret=settings.CLOUDINARY_API_SECRET,
    secure=True
)

@asynccontextmanager
async def lifespan(app: FastAPI):
    try:
        await redis_client.ping()
        print("\033[92m✓ Redis connection established\033[0m")
    except Exception as e:
        print(f"\033[91m✗ Redis connection failed: {e}\033[0m")
    try:
        yield
    finally:
        try:
            await redis_client.close()
            print("\033[92m✓ Redis connection closed\033[0m")
        except Exception as e:
            print(f"\033[91m✗ Error closing Redis: {e}\033[0m")

app = FastAPI(
    title=settings.PROJECT_NAME,
    lifespan=lifespan,
    docs_url="/docs" if settings.DEBUG else None,
    redoc_url="/redoc" if settings.DEBUG else None,
    openapi_url="/openapi.json" if settings.DEBUG else None,
)

# Middleware
add_rate_limit_middleware(app)
add_logging_middleware(app)
add_error_handler_middleware(app)
add_security_headers_middleware(app)
add_bot_filter_middleware(app)
app.add_middleware(ETagMiddleware)
app.add_middleware(GZipMiddleware, minimum_size=1000)

# Routes
app.include_router(health.router, prefix=settings.API_PREFIX)
app.include_router(levels.router, prefix=settings.API_PREFIX)
app.include_router(collectibles.levels_router, prefix=settings.API_PREFIX)
app.include_router(collectibles.collectibles_router, prefix=settings.API_PREFIX)
app.include_router(collectibles.upgrades_router, prefix=settings.API_PREFIX)
app.include_router(collectibles.cosmetics_router, prefix=settings.API_PREFIX)
app.include_router(collectibles.materials_router, prefix=settings.API_PREFIX)
app.include_router(types.router, prefix=settings.API_PREFIX)
app.include_router(walkthroughs.router, prefix=settings.API_PREFIX)
app.include_router(admin.router, prefix=settings.API_PREFIX)
app.include_router(auth.router, prefix=settings.API_PREFIX)
app.include_router(users.router, prefix=settings.API_PREFIX)
app.include_router(comments.router, prefix=settings.API_PREFIX)
app.include_router(progress.router, prefix=settings.API_PREFIX)

# Static file serving
CLIENT_DIST = os.path.join(os.path.dirname(__file__), '../client/dist')

if os.path.exists(CLIENT_DIST):
    app.mount('/assets', StaticFiles(directory=f'{CLIENT_DIST}/assets'), name='assets')

    @app.api_route('/{full_path:path}', methods=["GET", "HEAD"], include_in_schema=False)
    async def serve_spa(full_path: str):
        if full_path.startswith('api/'):
            return Response(status_code=404)
        file_path = os.path.join(CLIENT_DIST, full_path)
        if os.path.isfile(file_path):
            return FileResponse(file_path)
        return FileResponse(os.path.join(CLIENT_DIST, 'index.html'))
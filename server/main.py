import os
import cloudinary
from contextlib import asynccontextmanager
from fastapi import FastAPI, HTTPException
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
from starlette.middleware.gzip import GZipMiddleware

from config.settings import settings
from core.logging import setup_logging
from core.cache import redis_client
from core.colours import GREEN, RED, RESET
from middleware.rate_limit import setup_rate_limiter
from middleware.logging import add_logging_middleware
from middleware.error_handler import add_error_handler_middleware
from middleware.security_headers import add_security_headers_middleware, add_trusted_host_middleware
from middleware.bot_filter import add_bot_filter_middleware
from middleware.etag import ETagMiddleware
from middleware.origin_check import add_origin_check_middleware
from routes import levels, collectibles, types, walkthroughs, admin, auth, users, comments, health, progress, search
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
        print(f"{GREEN}✓ Redis connection established{RESET}")
    except Exception as e:
        print(f"{RED}✗ Redis connection failed: {e}{RESET}")
    try:
        yield
    finally:
        try:
            await redis_client.close()
            print(f"{GREEN}✓ Redis connection closed{RESET}")
        except Exception as e:
            print(f"{RED}✗ Error closing Redis: {e}{RESET}")

app = FastAPI(
    title=settings.PROJECT_NAME,
    lifespan=lifespan,
    docs_url="/docs" if settings.DEBUG else None,
    redoc_url="/redoc" if settings.DEBUG else None,
    openapi_url="/openapi.json" if settings.DEBUG else None,
)

# Middleware — registered inner→outer. Starlette PREPENDS each layer, so the
# LAST registered runs FIRST on a request. Resulting request order (outer→inner):
#   logging → security_headers → TrustedHost → error_handler
#     → GZip → ETag → origin_check → bot_filter → route
# logging outermost: times + logs everything, including rejections.
# security_headers + TrustedHost outer to error_handler: even 500s/400s get
# security headers + Cache-Control: no-store.
setup_rate_limiter(app)              # not a request-chain layer: limiter + exception handler only

add_bot_filter_middleware(app)       # innermost (closest to route)
add_origin_check_middleware(app)
app.add_middleware(ETagMiddleware)
app.add_middleware(GZipMiddleware, minimum_size=1000)
add_error_handler_middleware(app)
add_trusted_host_middleware(app)
add_security_headers_middleware(app)
add_logging_middleware(app)          # outermost (runs first)

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
app.include_router(search.router, prefix=settings.API_PREFIX)

@app.get("/.well-known/traffic-advice", include_in_schema=False)
async def traffic_advice():
    return [{"user_agent": "prefetch-proxy", "fraction": 1.0}]

# Static file serving
CLIENT_DIST = os.path.join(os.path.dirname(__file__), '../client/dist')

if os.path.exists(CLIENT_DIST):
    app.mount('/assets', StaticFiles(directory=f'{CLIENT_DIST}/assets'), name='assets')

    real_dist = os.path.realpath(CLIENT_DIST)

    @app.api_route('/{full_path:path}', methods=["GET", "HEAD"], include_in_schema=False)
    async def serve_spa(full_path: str):
        # Unknown API paths should 404 instead of falling through to the SPA
        if full_path == 'api' or full_path.startswith('api/'):
            raise HTTPException(status_code=404)
        file_path = os.path.realpath(os.path.join(CLIENT_DIST, full_path))
        if file_path.startswith(real_dist + os.sep) and os.path.isfile(file_path):
            return FileResponse(file_path)
        return FileResponse(os.path.join(CLIENT_DIST, 'index.html'))
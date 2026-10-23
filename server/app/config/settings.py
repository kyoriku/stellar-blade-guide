import os
from dotenv import load_dotenv

load_dotenv()


def _env(name: str, default: str) -> str:
    # Unset and empty both take the default, and every default in this file is
    # production's value. Railway passes a blank value or an unresolved reference as ''.
    return os.getenv(name) or default


# Unset means production; dev sets ENVIRONMENT=development in server/.env.
_ENVIRONMENT = _env('ENVIRONMENT', 'production')
_DEBUG = os.getenv('DEBUG', 'False').lower() == 'true'

# What production cannot serve without, checked by name before anything below reads it.
# A missing one stops every worker at import, so the deploy fails Railway's health check
# instead of going live with OAuth, email or avatars broken, or the whole site
# (ORIGIN_SECRET 404s every request, REDIS_URL takes auth down). Names only, never values.
REQUIRED_IN_PRODUCTION = (
    'DATABASE_URL', 'REDIS_URL', 'JWT_SECRET_KEY', 'ORIGIN_SECRET', 'OPENAI_API_KEY',
    'RESEND_API_KEY', 'CLOUDINARY_CLOUD_NAME', 'CLOUDINARY_API_KEY', 'CLOUDINARY_API_SECRET',
    'GOOGLE_CLIENT_ID', 'GOOGLE_CLIENT_SECRET', 'DISCORD_CLIENT_ID', 'DISCORD_CLIENT_SECRET',
)

if _ENVIRONMENT not in ('production', 'development'):
    # 'prod' or 'Production' would otherwise get dev cookies at every == 'production' check.
    raise RuntimeError(f"ENVIRONMENT must be 'production' or 'development', not {_ENVIRONMENT!r}")
if _ENVIRONMENT == 'production':
    if _DEBUG:
        # DEBUG turns off the origin check and the bot filter and serves /docs, which is
        # never right in production. It also stops a dev setup that lost its ENVIRONMENT.
        raise RuntimeError('DEBUG=true needs ENVIRONMENT=development')
    _missing = [name for name in REQUIRED_IN_PRODUCTION if not os.getenv(name)]
    if _missing:
        raise RuntimeError(f"Missing environment variables: {', '.join(_missing)}")


def _allowed_hosts() -> list[str]:
    # The site's two hosts and the Host Railway's health checks send; development adds
    # loopback. ALLOWED_HOSTS replaces the whole list.
    hosts = 'stellarbladeguide.com,www.stellarbladeguide.com,healthcheck.railway.app'
    if _ENVIRONMENT == 'development':
        hosts += ',localhost,127.0.0.1'
    return [h.strip() for h in _env('ALLOWED_HOSTS', hosts).split(',') if h.strip()]


class Settings:
    # Environment
    ENVIRONMENT: str = _ENVIRONMENT

    # Database
    DATABASE_URL: str = os.getenv('DATABASE_URL', '').replace(
        'postgresql://', 
        'postgresql+asyncpg://'
    )
    # DATABASE_URL: str = os.getenv('DATABASE_URL')
    
    # Redis
    REDIS_URL: str = os.getenv('REDIS_URL', 'redis://localhost:6379')
    
    # Cache TTL (in seconds)
    CACHE_TTL: int = int(_env('CACHE_TTL', '2592000'))  # 30 days — Redis + CDN s-maxage
    SWR_TTL: int = 604800  # 7 days — CDN stale-while-revalidate
    # Search is the one cached content route with no invalidation path: its URLs
    # carry an arbitrary ?q=, so they cannot be enumerated for a by-URL purge and
    # /api/search is deliberately absent from purge_api_cache.py's CACHED_PREFIXES.
    # With nothing able to evict it, the TTL is the ONLY bound on staleness, so
    # this value is both the Redis TTL and the edge s-maxage — routers/search.py
    # and middleware/security_headers.py both read it, because the two drifting
    # apart is exactly how a stale result outlives its cache entry.
    SEARCH_CACHE_TTL: int = 3600  # 1 hour — Redis + CDN s-maxage for /api/search
    
    # Rate Limiting
    RATE_LIMIT_PER_MINUTE: str = "100/minute"
    
    # API
    API_PREFIX: str = "/api"
    PROJECT_NAME: str = "Stellar Blade Guide API"

    # Trusted hosts (TrustedHostMiddleware)
    ALLOWED_HOSTS: list[str] = _allowed_hosts()

    # Logging
    LOG_LEVEL: str = _env('LOG_LEVEL', 'INFO')
    DEBUG: bool = _DEBUG

    # Auth (app/core/auth.py reads JWT_SECRET_KEY itself)
    # The client proactively refreshes every 14 min (AuthContext.tsx) — keep this
    # above that cadence or sessions expire between refreshes.
    ACCESS_TOKEN_EXPIRE_MINUTES: int = int(os.getenv('ACCESS_TOKEN_EXPIRE_MINUTES', 15))
    REFRESH_TOKEN_EXPIRE_DAYS: int = int(os.getenv('REFRESH_TOKEN_EXPIRE_DAYS', 7))
    # Rotation reuse grace: a just-superseded refresh token is still honored for
    # this long, so a lost Set-Cookie response / killed tab mid-rotation / wake
    # double-fire recovers instead of logging the user out. Threat tradeoff: a
    # stolen cookie replayed against a rotating victim gains <= this window,
    # nothing against an idle one.
    REFRESH_GRACE_SECONDS: int = int(os.getenv('REFRESH_GRACE_SECONDS', 60))
    # Absolute session lifetime, counted from the login: a session is refused at its
    # first refresh past this age, however often it rotated. The idle window above
    # slides on every rotation, so without this an open tab would never sign in again.
    SESSION_MAX_AGE_DAYS: int = int(os.getenv('SESSION_MAX_AGE_DAYS', 90))
    # The origin the browser uses: the site in production, Vite on :3000 in dev. Every
    # absolute URL the server sends out is built from it.
    FRONTEND_URL: str = _env('FRONTEND_URL', 'https://stellarbladeguide.com').rstrip('/')

    # OpenAI
    OPENAI_API_KEY: str = os.getenv('OPENAI_API_KEY', '')

    # Email
    RESEND_API_KEY: str = os.getenv('RESEND_API_KEY', '')

    # Cloudinary
    CLOUDINARY_CLOUD_NAME: str = os.getenv('CLOUDINARY_CLOUD_NAME', '')
    CLOUDINARY_API_KEY: str = os.getenv('CLOUDINARY_API_KEY', '')
    CLOUDINARY_API_SECRET: str = os.getenv('CLOUDINARY_API_SECRET', '')

    # OAuth - Google
    GOOGLE_CLIENT_ID: str = os.getenv('GOOGLE_CLIENT_ID', '')
    GOOGLE_CLIENT_SECRET: str = os.getenv('GOOGLE_CLIENT_SECRET', '')
    GOOGLE_REDIRECT_URI: str = os.getenv('GOOGLE_REDIRECT_URI', '')

    # OAuth - Discord
    DISCORD_CLIENT_ID: str = os.getenv('DISCORD_CLIENT_ID', '')
    DISCORD_CLIENT_SECRET: str = os.getenv('DISCORD_CLIENT_SECRET', '')
    DISCORD_REDIRECT_URI: str = os.getenv('DISCORD_REDIRECT_URI', '')

settings = Settings()
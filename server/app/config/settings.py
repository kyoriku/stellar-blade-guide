import os
from dotenv import load_dotenv

load_dotenv()

class Settings:
    # Environment
    ENVIRONMENT: str = os.getenv('ENVIRONMENT', 'development')

    # Database
    DATABASE_URL: str = os.getenv('DATABASE_URL', '').replace(
        'postgresql://', 
        'postgresql+asyncpg://'
    )
    # DATABASE_URL: str = os.getenv('DATABASE_URL')
    
    # Redis
    REDIS_URL: str = os.getenv('REDIS_URL', 'redis://localhost:6379')
    
    # Cache TTL (in seconds)
    CACHE_TTL: int = int(os.getenv('CACHE_TTL', 2592000))  # 30 days — Redis + CDN s-maxage
    SWR_TTL: int = 604800  # 7 days — CDN stale-while-revalidate
    
    # Rate Limiting
    RATE_LIMIT_PER_MINUTE: str = "100/minute"
    
    # API
    API_PREFIX: str = "/api"
    PROJECT_NAME: str = "Stellar Blade Guide API"

    # Trusted hosts (TrustedHostMiddleware). Defaults to the production hosts so a
    # missing env var fails to a working config; override via ALLOWED_HOSTS.
    # healthcheck.railway.app is included so Railway health checks pass host validation.
    ALLOWED_HOSTS: list[str] = [
        h.strip() for h in os.getenv(
            'ALLOWED_HOSTS',
            'stellarbladeguide.com,www.stellarbladeguide.com,healthcheck.railway.app,localhost,127.0.0.1'
        ).split(',') if h.strip()
    ]
    
    # Logging
    LOG_LEVEL: str = os.getenv('LOG_LEVEL', 'INFO')
    DEBUG: bool = os.getenv('DEBUG', 'False').lower() == 'true'

    # Auth
    JWT_SECRET_KEY: str = os.getenv('JWT_SECRET_KEY', '')
    # The client proactively refreshes every 14 min (AuthContext.tsx) — keep this
    # above that cadence or sessions expire between refreshes.
    ACCESS_TOKEN_EXPIRE_MINUTES: int = int(os.getenv('ACCESS_TOKEN_EXPIRE_MINUTES', 15))
    REFRESH_TOKEN_EXPIRE_DAYS: int = int(os.getenv('REFRESH_TOKEN_EXPIRE_DAYS', 7))
    FRONTEND_URL: str = os.getenv('FRONTEND_URL', 'https://stellarbladeguide.com')

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
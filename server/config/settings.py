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
    CACHE_TTL: int = int(os.getenv('CACHE_TTL', 86400))  # 24 hours
    
    # CORS
    CORS_ORIGINS: list = os.getenv(
        'CORS_ORIGINS',
        'http://localhost:3000,https://stellarbladeguide.com'
    ).split(',')
    
    # Rate Limiting
    RATE_LIMIT_PER_MINUTE: str = "100/minute"
    
    # API
    API_PREFIX: str = "/api"
    PROJECT_NAME: str = "Stellar Blade Guide API"
    
    # Logging
    LOG_LEVEL: str = os.getenv('LOG_LEVEL', 'INFO')
    DEBUG: bool = os.getenv('DEBUG', 'False').lower() == 'true'

    # Auth
    JWT_SECRET_KEY: str = os.getenv('JWT_SECRET_KEY', '')
    ACCESS_TOKEN_EXPIRE_MINUTES: int = int(os.getenv('ACCESS_TOKEN_EXPIRE_MINUTES', 15))
    REFRESH_TOKEN_EXPIRE_DAYS: int = int(os.getenv('REFRESH_TOKEN_EXPIRE_DAYS', 7))
    FRONTEND_URL: str = os.getenv('FRONTEND_URL', 'https://stellarbladeguide.com')

    # Email
    RESEND_API_KEY: str = os.getenv('RESEND_API_KEY', '')

    # OAuth - Google
    GOOGLE_CLIENT_ID: str = os.getenv('GOOGLE_CLIENT_ID', '')
    GOOGLE_CLIENT_SECRET: str = os.getenv('GOOGLE_CLIENT_SECRET', '')
    GOOGLE_REDIRECT_URI: str = os.getenv('GOOGLE_REDIRECT_URI', 'https://api.stellarbladeguide.com/api/auth/google/callback')

    # OAuth - Discord
    DISCORD_CLIENT_ID: str = os.getenv('DISCORD_CLIENT_ID', '')
    DISCORD_CLIENT_SECRET: str = os.getenv('DISCORD_CLIENT_SECRET', '')
    DISCORD_REDIRECT_URI: str = os.getenv('DISCORD_REDIRECT_URI', 'https://api.stellarbladeguide.com/api/auth/discord/callback')

settings = Settings()
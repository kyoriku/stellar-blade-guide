import os
from dotenv import load_dotenv

load_dotenv()

class Settings:
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

settings = Settings()
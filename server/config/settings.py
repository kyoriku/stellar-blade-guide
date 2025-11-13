import os
from dotenv import load_dotenv

load_dotenv()

class Settings:
    # Database
    # DATABASE_URL: str = os.getenv('DATABASE_URL', '').replace(
    #     'postgresql://', 
    #     'postgresql+asyncpg://'
    # )
    DATABASE_URL: str = os.getenv('DATABASE_URL')
    
    # Redis
    REDIS_URL: str = os.getenv('REDIS_URL', 'redis://localhost:6379')
    
    # Cache TTL (in seconds)
    CACHE_TTL_SHORT: int = int(os.getenv('CACHE_TTL_SHORT', 600))
    CACHE_TTL_MEDIUM: int = int(os.getenv('CACHE_TTL_MEDIUM', 1800))
    CACHE_TTL_LONG: int = int(os.getenv('CACHE_TTL_LONG', 3600))
    
    # CORS
    CORS_ORIGINS: list = [
        "http://localhost:3000",
        "http://stellarbladeguide.com",
        "https://stellarbladeguide.com"
    ]
    
    # Rate Limiting
    RATE_LIMIT_PER_MINUTE: str = "100/minute"
    
    # API
    API_PREFIX: str = "/api"
    PROJECT_NAME: str = "Stellar Blade Guide API"
    
    # Logging
    LOG_LEVEL: str = os.getenv('LOG_LEVEL', 'INFO')
    DEBUG: bool = os.getenv('DEBUG', 'False').lower() == 'true'

settings = Settings()
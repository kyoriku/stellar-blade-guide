from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.util import get_remote_address
from slowapi.errors import RateLimitExceeded
from app.config import settings

# Initialize rate limiter
limiter = Limiter(
    key_func=get_remote_address,
    storage_uri=settings.REDIS_URL
)

def add_rate_limit_middleware(app):
    app.state.limiter = limiter
    app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)
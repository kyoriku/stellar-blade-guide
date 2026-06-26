from slowapi import _rate_limit_exceeded_handler
from slowapi.errors import RateLimitExceeded
from core.security import limiter

def setup_rate_limiter(app):
    """Register slowapi rate limiting.

    Not a middleware: this only attaches the Limiter to app.state (read by the
    per-route @limiter.limit(...) decorators) and installs the RateLimitExceeded
    exception handler. Limiting is per-route — there is no global default limit.
    """
    app.state.limiter = limiter
    app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)
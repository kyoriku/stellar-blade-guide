from starlette.middleware.trustedhost import TrustedHostMiddleware
from fastapi import FastAPI, Request, Response
import os
from config.settings import settings

def add_security_headers_middleware(app: FastAPI):
    allowed_hosts_str = os.getenv(
        'ALLOWED_HOSTS',
        'localhost,127.0.0.1'
    )
    allowed_hosts = [host.strip() for host in allowed_hosts_str.split(',')]
    
    app.add_middleware(
        TrustedHostMiddleware,
        allowed_hosts=allowed_hosts
    )

    CSP = (
        "default-src 'self'; "
        "script-src 'self' 'unsafe-inline'; "
        "style-src 'self' 'unsafe-inline'; "
        "img-src 'self' data: https://res.cloudinary.com https://lh3.googleusercontent.com https://cdn.discordapp.com; "
        "connect-src 'self'; "
        "font-src 'self'; "
        "frame-src 'none'; "
        "frame-ancestors 'none'; "
        "object-src 'none';"
    )

    @app.middleware("http")
    async def apply_security_headers(request: Request, call_next):
        response: Response = await call_next(request)

        response.headers["X-Content-Type-Options"] = "nosniff"
        response.headers["X-Frame-Options"] = "DENY"
        response.headers["Cross-Origin-Opener-Policy"] = "same-origin"
        response.headers["Cross-Origin-Resource-Policy"] = "same-origin"
        response.headers["Strict-Transport-Security"] = "max-age=63072000; includeSubDomains"
        response.headers["Referrer-Policy"] = "strict-origin-when-cross-origin"
        response.headers["Permissions-Policy"] = "geolocation=(), microphone=()"
        if not settings.DEBUG:
            response.headers["Content-Security-Policy"] = CSP

        # Cache-Control
        if request.method in ("GET", "HEAD") and response.status_code == 200:
            if request.url.path.startswith("/assets/"):
                response.headers["Cache-Control"] = "public, max-age=31536000, immutable"
            elif request.url.path.startswith("/api/"):
                if request.url.path.startswith("/api/progress"):
                    response.headers["Cache-Control"] = "no-store"
                else:
                    response.headers["Cache-Control"] = "public, max-age=300, stale-while-revalidate=3600"
            else:
                response.headers["Cache-Control"] = "no-cache"
        else:
            response.headers["Cache-Control"] = "no-store"

        return response
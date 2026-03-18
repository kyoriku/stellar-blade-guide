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
        response.headers["Strict-Transport-Security"] = "max-age=63072000; includeSubDomains"
        response.headers["Referrer-Policy"] = "no-referrer"
        response.headers["Permissions-Policy"] = "geolocation=(), microphone=()"
        response.headers["Server"] = "SecureAPI"
        response.headers["Content-Security-Policy"] = CSP

        # Cache-Control
        if request.method == "GET" and response.status_code == 200:
            if request.url.path.startswith("/assets/"):
                response.headers["Cache-Control"] = "public, max-age=31536000, immutable"
            elif request.url.path.startswith("/api/"):
                response.headers["Cache-Control"] = "public, max-age=300, stale-while-revalidate=3600"
            else:
                response.headers["Cache-Control"] = "no-store"
        else:
            response.headers["Cache-Control"] = "no-store"

        return response
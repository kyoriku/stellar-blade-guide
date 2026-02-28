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

    @app.middleware("http")
    async def apply_security_headers(request: Request, call_next):
        response: Response = await call_next(request)

        response.headers["X-Frame-Options"] = "DENY"
        response.headers["X-Content-Type-Options"] = "nosniff"
        response.headers["Strict-Transport-Security"] = "max-age=63072000; includeSubDomains"
        response.headers["Referrer-Policy"] = "no-referrer"
        response.headers["Permissions-Policy"] = "geolocation=(), microphone=()"
        response.headers["Cache-Control"] = "public, max-age=300, stale-while-revalidate=3600"
        response.headers["Server"] = "SecureAPI"

        if settings.DEBUG:
            response.headers["Content-Security-Policy"] = (
                "default-src 'none'; "
                "script-src 'unsafe-inline' https://cdn.jsdelivr.net https://unpkg.com; "
                "style-src 'unsafe-inline' https://fonts.googleapis.com https://cdn.jsdelivr.net; "
                "font-src https://fonts.gstatic.com; "
                "img-src 'self' data: https:; "
                "connect-src 'self'; "
                "worker-src blob:; "
            )
        else:
            response.headers["Content-Security-Policy"] = "default-src 'none'"

        return response
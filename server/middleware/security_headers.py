from starlette.middleware.trustedhost import TrustedHostMiddleware
from fastapi import FastAPI, Request, Response
import os

def add_security_headers_middleware(app: FastAPI):
    # Read allowed hosts from environment variable
    # Default includes localhost for local development
    allowed_hosts_str = os.getenv(
        'ALLOWED_HOSTS',
        'localhost,127.0.0.1'
    )
    allowed_hosts = [host.strip() for host in allowed_hosts_str.split(',')]
    
    # Trusted host protection
    app.add_middleware(
        TrustedHostMiddleware,
        allowed_hosts=allowed_hosts
    )

    # Async middleware to apply security headers manually
    @app.middleware("http")
    async def apply_security_headers(request: Request, call_next):
        # print("Security middleware running for:", request.url)
        response: Response = await call_next(request)

        # Security headers
        response.headers["X-Frame-Options"] = "DENY"
        response.headers["X-Content-Type-Options"] = "nosniff"
        response.headers["Strict-Transport-Security"] = "max-age=63072000; includeSubDomains"
        response.headers["Referrer-Policy"] = "no-referrer"
        response.headers["Permissions-Policy"] = "geolocation=(), microphone=()"
        response.headers["Server"] = "SecureAPI"  # optional

        return response
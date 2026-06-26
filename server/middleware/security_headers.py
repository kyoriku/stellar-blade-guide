from starlette.middleware.trustedhost import TrustedHostMiddleware
from fastapi import FastAPI, Request, Response
from config.settings import settings


def add_trusted_host_middleware(app: FastAPI):
    """Validate the Host header against settings.ALLOWED_HOSTS (anti-spoofing)."""
    app.add_middleware(
        TrustedHostMiddleware,
        allowed_hosts=settings.ALLOWED_HOSTS,
    )


def add_security_headers_middleware(app: FastAPI):
    CSP = (
        "default-src 'self'; "
        "script-src 'self' 'unsafe-inline' https://static.cloudflareinsights.com; "
        "style-src 'self' 'unsafe-inline'; "
        "img-src 'self' data: https://res.cloudinary.com https://lh3.googleusercontent.com https://cdn.discordapp.com; "
        "connect-src 'self' https://cloudflareinsights.com; "
        "font-src 'self'; "
        "base-uri 'self'; "
        "form-action 'self'; "
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
        response.headers["Permissions-Policy"] = "geolocation=(), microphone=(), camera=(), payment=()"
        if not settings.DEBUG:
            response.headers["Content-Security-Policy"] = CSP

        # Tell bots not to index /api/ responses
        if request.url.path.startswith("/api/"):
            response.headers["X-Robots-Tag"] = "noindex"

        # Cache-Control — treat 304 like its 200 so conditional GETs stay cacheable
        if request.method in ("GET", "HEAD") and response.status_code in (200, 304):
            if request.url.path.startswith("/assets/"):
                response.headers["Cache-Control"] = "public, max-age=31536000, immutable"
            elif request.url.path in ("/robots.txt", "/sitemap.xml"):
                # 6 hours
                response.headers["Cache-Control"] = "public, max-age=21600"
            elif request.url.path.startswith("/api/"):
                if request.url.path.startswith(("/api/progress", "/api/auth", "/api/comments", "/api/health")):
                    response.headers["Cache-Control"] = "no-store"
                else:
                    response.headers[
                        "Cache-Control"] = f"public, max-age=3600, s-maxage={settings.CACHE_TTL}, stale-while-revalidate={settings.SWR_TTL}"
            else:
                response.headers["Cache-Control"] = "no-cache"
        else:
            response.headers["Cache-Control"] = "no-store"

        return response

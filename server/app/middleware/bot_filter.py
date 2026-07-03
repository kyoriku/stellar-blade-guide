import logging
import re
from urllib.parse import urlparse
from fastapi import Request
from fastapi.responses import JSONResponse
from app.config.settings import settings
from app.core.colours import RED, RESET
from app.core.security import get_client_ip

logger = logging.getLogger("api")

LOCALHOST_IPS = {"127.0.0.1", "::1", "::ffff:127.0.0.1"}

REFERER_ALLOWED_HOSTS = {
    "stellarbladeguide.com",
    "www.stellarbladeguide.com",
    "localhost",
    "127.0.0.1",
}

REFERER_EXEMPT_PATHS = {
    "/api/health",
}

REFERER_EXEMPT_PREFIXES = (
    "/api/auth/",
)

ALLOWED_PREFIXES = (
    '/api/',
    '/assets/',
    '/.well-known/',
)

ALLOWED_EXACT = {
    '/robots.txt',
    '/sitemap.xml',
}

# Pure bot-signature path prefixes that pass the regex but are never legitimate
BOT_SIGNATURES = (
    # WordPress
    '/wp-admin',
    '/wp-content',
    '/wp-includes',
    '/wp-login',
    '/wp-json',
    '/wp-config',
    '/wordpress',

    # Other CMS admin panels
    '/phpmyadmin',
    '/administrator',    # Joomla
    '/typo3',            # TYPO3
    '/ghost',            # Ghost CMS
    '/drupal',
    '/joomla',
    '/magento',
    '/admin/controller',

    # Framework / stack probes
    '/laravel',
    '/symfony',
    '/codeigniter',
    '/kubernetes',
    '/terraform',
    '/jenkins',

    # System/config probes (lowercase versions that regex misses)
    '/etc/',
    '/proc/',
    '/var/',
    '/tmp/',
    '/actuator',         # Spring Boot actuator
    '/server-status',
    '/server-info',
    '/xmlrpc',
    '/kubeconfig',

    # API docs / dev tools probes
    '/swagger',
    '/scalar',
    '/v3/api-docs',
    '/api-docs',
    '/docs',           # FastAPI Swagger UI
    '/redoc',          # FastAPI ReDoc UI
    '/graphql',
    '/graphiql',
    '/playground',
    '/graphql-playground',
    '/voyager',
    '/mini-profiler-resources',
    '/debug',

    # Spring Boot / k8s management
    '/manage',
    '/management',
    '/healthz',
    '/livez',
    '/readyz',

    # Common attack endpoints
    '/shell',
    '/cmd',
    '/webshell',
    '/backdoor',
    '/phpinfo',

    # Directory listing probes
    '/static',
    '/content',
    '/files',
    '/uploads',
)


def is_localhost(ip: str) -> bool:
    return settings.DEBUG and ip in LOCALHOST_IPS


# Paths that look like normal URL segments (letters, digits, hyphens, slashes — no empty segments).
# Each '/' is a mandatory delimiter between segments so a slash-free run has exactly one
# decomposition — this keeps matching LINEAR. Do NOT rewrite as `(?:[a-z0-9\-]+/?)*`: that
# nested-quantifier form backtracks catastrophically (ReDoS) on inputs like a long alnum run
# followed by a '.' (e.g. a hashed `*.webp`), which pins the GIL and gets the worker SIGKILLed
# by uvicorn's health-check.
SPA_SAFE_PATH = re.compile(r'^/([a-z0-9\-]+(?:/[a-z0-9\-]+)*/?)?$')


async def bot_filter_middleware(request: Request, call_next):
    original_path = request.url.path
    normalized = original_path.lower().rstrip('/') or '/'

    # Skip in dev
    if is_localhost(get_client_ip(request)):
        return await call_next(request)

    # Block /api/* requests with a Referer from an unrecognised domain
    if (
        original_path.startswith("/api/")
        and original_path not in REFERER_EXEMPT_PATHS
        and not original_path.startswith(REFERER_EXEMPT_PREFIXES)
    ):
        referer = request.headers.get("referer")
        if referer:
            hostname = urlparse(referer).hostname or ""
            if hostname not in REFERER_ALLOWED_HOSTS:
                logger.warning("%sBlocked referer %s on %s%s",
                               RED, referer, original_path, RESET)
                return JSONResponse(status_code=404, content={"error": "Not Found"})

    # Allow API, static assets, and SEO files (case-sensitive)
    if original_path.startswith(ALLOWED_PREFIXES) or original_path in ALLOWED_EXACT:
        return await call_next(request)

    # Block known bot-signature paths (checked before regex since they'd otherwise pass)
    if any(normalized.startswith(sig) for sig in BOT_SIGNATURES):
        return JSONResponse(status_code=404, content={"error": "Not Found"})

    # Length-guard backstop before the regex (the linear pattern above already prevents
    # ReDoS). The deepest SPA route is `walkthroughs/:type/:slug`; the longest real path
    # in the sitemap is 60 chars and the structural worst case is ~150, so 512 only ever
    # rejects absurd probe paths — it never clips a legitimate route.
    if len(normalized) > 512:
        return JSONResponse(status_code=404, content={"error": "Not Found"})

    # Allow normal-shaped URLs through to React Router
    if SPA_SAFE_PATH.match(normalized):
        return await call_next(request)

    # Everything else (file extensions, weird chars) = probe
    return JSONResponse(status_code=404, content={"error": "Not Found"})


def add_bot_filter_middleware(app):
    app.middleware("http")(bot_filter_middleware)

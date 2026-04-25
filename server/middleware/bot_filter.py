import re
from fastapi import Request
from fastapi.responses import JSONResponse
from config.settings import settings

LOCALHOST_IPS = {"127.0.0.1", "::1", "::ffff:127.0.0.1"}

ALLOWED_PREFIXES = (
    '/api/',
    '/assets/',
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


def get_client_ip(request: Request) -> str:
    fastly_ip = request.headers.get("fastly-client-ip")
    if fastly_ip:
        return fastly_ip.strip()

    real_ip = request.headers.get("x-real-ip")
    if real_ip:
        return real_ip.strip()

    forwarded_for = request.headers.get("x-forwarded-for")
    if forwarded_for:
        return forwarded_for.split(",")[-1].strip()

    return request.client.host


# Paths that look like normal URL segments (letters, digits, hyphens, slashes — no empty segments)
SPA_SAFE_PATH = re.compile(r'^/(?:[a-z0-9\-]+/?)*$')


async def bot_filter_middleware(request: Request, call_next):
    original_path = request.url.path
    normalized = original_path.lower().rstrip('/') or '/'

    # Skip in dev
    if is_localhost(get_client_ip(request)):
        return await call_next(request)

    # Allow API, static assets, and SEO files (case-sensitive)
    if original_path.startswith(ALLOWED_PREFIXES) or original_path in ALLOWED_EXACT:
        return await call_next(request)

    # Block known bot-signature paths (checked before regex since they'd otherwise pass)
    if any(normalized.startswith(sig) for sig in BOT_SIGNATURES):
        request.state.bot_blocked = True
        return JSONResponse(status_code=404, content={"error": "Not Found"})

    # Allow normal-shaped URLs through to React Router
    if SPA_SAFE_PATH.match(normalized):
        return await call_next(request)

    # Everything else (file extensions, weird chars) = probe
    request.state.bot_blocked = True
    return JSONResponse(status_code=404, content={"error": "Not Found"})


def add_bot_filter_middleware(app):
    app.middleware("http")(bot_filter_middleware)
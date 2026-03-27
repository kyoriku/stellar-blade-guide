from fastapi import Request
from fastapi.responses import JSONResponse
from config.settings import settings

LOCALHOST_IPS = {"127.0.0.1", "::1", "::ffff:127.0.0.1"}

OBVIOUS_BOT_PATHS = [
    '/.git', '/.env', '/.aws', '/.ssh', '/.config',
    '/wp-admin', '/wp-login', '/wp-includes', '/wp-content',
    '/phpmyadmin', '/admin', '/backup', '/database',
    '/config', '/composer.json', '/package.json',
    '/laravel', '/.github', '/.gitlab-ci', '/terraform',
    '/.kube', '/kubernetes', '/docker-compose',
]

SUSPICIOUS_EXTENSIONS = [
    '.php', '.asp', '.aspx', '.jsp',
    '.yaml', '.yml', '.map', '.toml', '.tfvars', '.tfstate'
]

SAFE_PATHS = [
    '/sitemap.xml',
    '/robots.txt',
    '/favicon.ico',
    '/favicon.svg',
]


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

async def bot_filter_middleware(request: Request, call_next):
    path = request.url.path.lower()

    if is_localhost(get_client_ip(request)):
        return await call_next(request)

    if any(path == safe for safe in SAFE_PATHS):
        return await call_next(request)

    if (any(path.startswith(p) for p in OBVIOUS_BOT_PATHS)
        or any(path.endswith(ext) for ext in SUSPICIOUS_EXTENSIONS)
        or '.env' in path):
        request.state.bot_blocked = True
        return JSONResponse(status_code=404, content={"error": "Not Found"})

    return await call_next(request)

def add_bot_filter_middleware(app):
    app.middleware("http")(bot_filter_middleware)
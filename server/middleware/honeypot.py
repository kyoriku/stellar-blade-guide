import time
from fastapi import Request, Response
from fastapi.responses import JSONResponse
from core.cache import redis_client
from config.settings import settings
import logging

logger = logging.getLogger(__name__)

# ANSI color codes
RED = '\033[31m'
YELLOW = '\033[33m'
GREEN = '\033[32m'
CYAN = '\033[36m'
MAGENTA = '\033[35m'
RESET = '\033[0m'

LOCALHOST_IPS = {"127.0.0.1", "::1", "::ffff:127.0.0.1"}

# Paths that are NEVER legitimate - immediate ban
OBVIOUS_BOT_PATHS = [
    '/.git', '/.env', '/.aws', '/.ssh', '/.config',
    '/wp-admin', '/wp-login', '/wp-includes', '/wp-content',
    '/phpmyadmin', '/admin', '/backup', '/database',
    '/config', '/composer.json', '/package.json',
    '/laravel', '/.github', '/.gitlab-ci', '/terraform',
    '/.kube', '/kubernetes', '/docker-compose',
]

# File extensions that indicate bot scanning
SUSPICIOUS_EXTENSIONS = [
    '.php', '.asp', '.aspx', '.jsp', '.xml',
    '.yaml', '.yml', '.map', '.toml', '.tfvars', '.tfstate'
]

def is_localhost(ip: str) -> bool:
    """Check if IP is localhost - only skip in local dev"""
    return settings.DEBUG and ip in LOCALHOST_IPS

def get_client_ip(request: Request) -> str:
    """
    Get real client IP from proxy headers.
    Railway (and most reverse proxies) set X-Forwarded-For header.
    """
    forwarded_for = request.headers.get("x-forwarded-for")
    if forwarded_for:
        # X-Forwarded-For can be: "client, proxy1, proxy2"
        # First IP is the real client
        return forwarded_for.split(",")[0].strip()
    
    # Fallback to direct connection IP (only used in local dev)
    return request.client.host

async def is_banned(ip: str) -> bool:
    """Check if IP is currently banned"""
    try:
        banned = await redis_client.get(f"badbot:{ip}")
        return banned is not None
    except Exception as e:
        logger.error(f"{RED}Error checking ban status: {e}{RESET}")
        return False

def get_ban_duration(attempt_count: int) -> int:
    """Get escalating ban duration based on violations"""
    if attempt_count >= 3:
        return 31536000  # 365 days (1 year)
    if attempt_count >= 2:
        return 7776000   # 90 days
    if attempt_count >= 1:
        return 2592000   # 30 days
    return 0

async def track_suspicious_activity(ip: str, path: str):
    """Track suspicious activity and ban if threshold reached"""
    try:
        # Track individual IP violations
        key = f"bot_attempts:{ip}"
        current_attempts = int(await redis_client.get(key) or "0")
        new_attempts = current_attempts + 1
        
        # Determine ban duration
        ban_duration = get_ban_duration(new_attempts)
        
        # Counter TTL = ban duration + 30 day buffer
        counter_ttl = ban_duration + 2592000
        
        # Store attempt count
        await redis_client.setex(key, counter_ttl, str(new_attempts))
        
        # Log activity
        logger.warning(
            f"{YELLOW}[SUSPICIOUS]{RESET} {MAGENTA}{ip}{RESET} → {path} "
            f"(offense #{new_attempts})"
        )
        
        # Ban if threshold reached
        if ban_duration > 0:
            await redis_client.setex(f"badbot:{ip}", ban_duration, "true")
            
            ban_days = round(ban_duration / 86400)
            
            logger.error(
                f"{RED}[IP BANNED]{RESET} {MAGENTA}{ip}{RESET} banned for "
                f"{YELLOW}{ban_days} days{RESET} (offense #{new_attempts})"
            )
            
    except Exception as e:
        logger.error(f"{RED}Error tracking suspicious activity: {e}{RESET}")

async def check_banned_ip_middleware(request: Request, call_next):
    """Middleware to block banned IPs"""
    client_ip = get_client_ip(request)
    
    if is_localhost(client_ip):
        return await call_next(request)
    
    banned = await is_banned(client_ip)
    
    if banned:
        # Flag so logging middleware skips this request
        request.state.bot_blocked = True
        
        # Log once per hour per IP to reduce spam
        log_key = f"blocked_log:{client_ip}"
        already_logged = await redis_client.get(log_key)
        
        if not already_logged:
            logger.warning(
                f"{RED}[BLOCKED]{RESET} {MAGENTA}{client_ip}{RESET} → "
                f"{request.url.path}"
            )
            await redis_client.setex(log_key, 3600, "true")
        
        # Return 404 instead of 403 (don't reveal defense)
        return JSONResponse(status_code=404, content={"error": "Not Found"})
    
    return await call_next(request)

async def bot_honeypot_middleware(request: Request, call_next):
    """Honeypot middleware for detecting bots"""
    path = request.url.path.lower()
    client_ip = get_client_ip(request)
    
    if is_localhost(client_ip):
        return await call_next(request)
    
    # Check for obvious bot paths
    is_obvious_bot = any(path.startswith(bot_path.lower()) for bot_path in OBVIOUS_BOT_PATHS)
    
    # Check for suspicious extensions
    has_suspicious_ext = any(path.endswith(ext) for ext in SUSPICIOUS_EXTENSIONS)
    
    if is_obvious_bot or has_suspicious_ext:
        # Flag so logging middleware skips this request
        request.state.bot_blocked = True
        
        await track_suspicious_activity(client_ip, path)
        return JSONResponse(status_code=404, content={"error": "Not Found"})
    
    return await call_next(request)

def add_banned_ip_middleware(app):
    """Add IP ban checking middleware"""
    app.middleware("http")(check_banned_ip_middleware)

def add_honeypot_middleware(app):
    """Add bot honeypot middleware"""
    app.middleware("http")(bot_honeypot_middleware)
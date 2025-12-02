import time
from fastapi import Request, Response
from fastapi.responses import JSONResponse
from core.cache import redis_client
import logging

logger = logging.getLogger(__name__)

# ANSI color codes
RED = '\033[91m'
YELLOW = '\033[93m'
GREEN = '\033[92m'
CYAN = '\033[96m'
MAGENTA = '\033[95m'
RESET = '\033[0m'

# Paths that are NEVER legitimate - immediate long ban
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

def get_client_ip(request: Request) -> str:
    """
    Get real client IP from proxy headers.
    Railway (and most reverse proxies) set X-Forwarded-For header.
    """
    # Check X-Forwarded-For header (set by Railway/proxies)
    forwarded_for = request.headers.get("x-forwarded-for")
    if forwarded_for:
        # X-Forwarded-For can be: "client, proxy1, proxy2"
        # First IP is the real client
        return forwarded_for.split(",")[0].strip()
    
    # Fallback to direct connection IP (only used in local dev)
    return request.client.host

def get_subnet(ip: str) -> str:
    """Extract subnet from IP (first 3 octets)"""
    parts = ip.split('.')
    if len(parts) != 4:
        return ip
    return f"{parts[0]}.{parts[1]}.{parts[2]}"

async def is_banned(ip: str) -> bool:
    """Check if IP is currently banned"""
    try:
        banned = await redis_client.get(f"badbot:{ip}")
        return banned is not None
    except Exception as e:
        logger.error(f"{RED}Error checking ban status: {e}{RESET}")
        return False

def get_ban_duration(attempt_count: int, is_high_severity: bool = False) -> int:
    """Get escalating ban duration based on violations"""
    # High severity = immediate 7-day ban
    if is_high_severity and attempt_count >= 1:
        return 604800  # 7 days
    
    # Progressive escalation
    if attempt_count >= 10:
        return 2592000  # 30 days
    if attempt_count >= 7:
        return 604800   # 7 days
    if attempt_count >= 4:
        return 86400    # 1 day
    if attempt_count >= 2:
        return 3600     # 1 hour
    return 0  # No ban until 2+ violations

async def track_suspicious_activity(ip: str, path: str, severity: str = 'low'):
    """Track suspicious activity with subnet awareness"""
    try:
        # Track individual IP violations
        key = f"bot_attempts:{ip}"
        current_attempts = await redis_client.get(key) or "0"
        current_attempts = int(current_attempts)
        is_first_offense = current_attempts == 0
        
        multiplier = 3 if severity == 'high' else 1
        new_attempts = current_attempts + multiplier
        
        # Track subnet violations (detect IP rotation)
        subnet = get_subnet(ip)
        subnet_key = f"bot_subnet:{subnet}"
        subnet_attempts = await redis_client.get(subnet_key) or "0"
        subnet_attempts = int(subnet_attempts)
        new_subnet_attempts = subnet_attempts + multiplier
        
        # Escalate if subnet has many violations
        if new_subnet_attempts >= 15 and severity != 'high':
            severity = 'high'
            logger.warning(
                f"{CYAN}[SUBNET PATTERN]{RESET} {MAGENTA}{subnet}.x{RESET} has "
                f"{YELLOW}{new_subnet_attempts}{RESET} violations across multiple IPs"
            )
        
        # Determine ban duration
        is_high_severity = severity == 'high'
        ban_duration = get_ban_duration(new_attempts, is_high_severity)
        
        # Counter TTL = ban duration + 7 day buffer (min 7 days)
        counter_ttl = max(604800, ban_duration + 604800)
        
        # Store attempt counts
        await redis_client.setex(key, counter_ttl, new_attempts)
        await redis_client.setex(subnet_key, 604800, new_subnet_attempts)
        
        # Log activity
        attempt_display = (
            f"1st offense (weighted as {new_attempts})" 
            if is_high_severity and is_first_offense 
            else f"{new_attempts} attempts"
        )
        
        severity_color = RED if severity == 'high' else YELLOW
        logger.warning(
            f"{YELLOW}[SUSPICIOUS]{RESET} {MAGENTA}{ip}{RESET} "
            f"({CYAN}{subnet}.x{RESET}) → {path} "
            f"({attempt_display}, Subnet: {new_subnet_attempts}, "
            f"Severity: {severity_color}{severity}{RESET})"
        )
        
        # Ban if threshold reached
        if ban_duration > 0:
            await redis_client.setex(f"badbot:{ip}", ban_duration, "true")
            
            ban_days = round(ban_duration / 86400)
            ban_hours = round(ban_duration / 3600)
            ban_display = f"{ban_days} days" if ban_days >= 1 else f"{ban_hours} hours"
            
            ban_reason = (
                f"immediate {severity}-severity ban"
                if is_high_severity and is_first_offense
                else f"{new_attempts} violations"
            )
            
            logger.error(
                f"{RED}[IP BANNED]{RESET} {MAGENTA}{ip}{RESET} banned for "
                f"{YELLOW}{ban_display}{RESET} ({ban_reason})"
            )
            
    except Exception as e:
        logger.error(f"{RED}Error tracking suspicious activity: {e}{RESET}")

async def check_banned_ip_middleware(request: Request, call_next):
    """Middleware to block banned IPs"""
    client_ip = get_client_ip(request)
    
    # Skip localhost in dev
    if client_ip in ["127.0.0.1", "::1", "::ffff:127.0.0.1"]:
        return await call_next(request)
    
    banned = await is_banned(client_ip)
    
    if banned:
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
    
    # Skip localhost in dev
    if client_ip in ["127.0.0.1", "::1", "::ffff:127.0.0.1"]:
        return await call_next(request)
    
    # Check for obvious bot paths
    is_obvious_bot = any(path.startswith(bot_path.lower()) for bot_path in OBVIOUS_BOT_PATHS)
    
    # Check for suspicious extensions
    has_suspicious_ext = any(path.endswith(ext) for ext in SUSPICIOUS_EXTENSIONS)
    
    if is_obvious_bot or has_suspicious_ext:
        await track_suspicious_activity(client_ip, path, 'high')
        return JSONResponse(status_code=404, content={"error": "Not Found"})
    
    return await call_next(request)

def add_banned_ip_middleware(app):
    """Add IP ban checking middleware"""
    app.middleware("http")(check_banned_ip_middleware)

def add_honeypot_middleware(app):
    """Add bot honeypot middleware"""
    app.middleware("http")(bot_honeypot_middleware)
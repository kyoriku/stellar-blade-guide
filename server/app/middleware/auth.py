"""
Authentication middleware.
"""
from fastapi import Request, HTTPException
from jose import jwt, JWTError
from app.config import settings


async def verify_token_middleware(request: Request, call_next):
    """
    Verify JWT token for protected routes.
    
    Skips public routes like /health, /docs.
    """
    # Skip auth for public routes
    public_routes = ["/", "/health", "/docs", "/openapi.json"]
    if request.url.path in public_routes:
        return await call_next(request)
    
    # Get token from header
    auth_header = request.headers.get("Authorization")
    if not auth_header or not auth_header.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Missing or invalid token")
    
    token = auth_header.replace("Bearer ", "")
    
    try:
        # Verify token
        payload = jwt.decode(
            token, 
            settings.SECRET_KEY, 
            algorithms=["HS256"]
        )
        # Attach user info to request state
        request.state.user_id = payload.get("sub")
    except JWTError:
        raise HTTPException(status_code=401, detail="Invalid token")
    
    return await call_next(request)


def add_auth_middleware(app):
    """Add authentication middleware to the FastAPI app."""
    app.middleware("http")(verify_token_middleware)
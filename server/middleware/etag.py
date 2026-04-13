import hashlib
from fastapi import Request, Response
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.responses import Response as StarletteResponse

class ETagMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next):
        response = await call_next(request)

        # Skip if FileResponse already set an ETag
        if 'etag' in response.headers:
            return response
        
        # Skip mutable per-user endpoints
        if request.url.path.startswith("/api/progress"):
            return response

        # Only bother for successful GET responses
        if request.method != "GET" or response.status_code != 200:
            return response

        # Buffer the response body
        body = b""
        async for chunk in response.body_iterator:
            body += chunk

        # Generate ETag from body content
        etag = f'"{hashlib.md5(body).hexdigest()}"'

        # Check if client already has this version
        if request.headers.get("if-none-match") == etag:
            return StarletteResponse(status_code=304, headers={"ETag": etag})

        # Otherwise return full response with ETag header
        return Response(
            content=body,
            status_code=response.status_code,
            headers=dict(response.headers) | {"ETag": etag},
            media_type=response.media_type,
        )
"""The 404 a layer gives a request it turns away before any route runs."""
from fastapi import Request
from fastapi.responses import JSONResponse, Response


def under_api(path: str) -> bool:
    return path == "/api" or path.startswith("/api/")


async def refusal(request: Request, content: dict) -> Response:
    """The client's 404 page for a page request, a GET or HEAD outside the API; a JSON 404
    holding content for anything else, or when no client is built (register_spa leaves the
    page in app.state). Either spelling of the path puts it under the API: the path as routed,
    or request.url.path, which decides the access line and X-Robots-Tag."""
    page = getattr(request.app.state, "not_found_page", None)
    path = request.scope["path"]
    if page and request.method in ("GET", "HEAD") and not (under_api(path) or under_api(request.url.path)):
        return await page(request)
    return JSONResponse(status_code=404, content=content)

import pytest_asyncio
import app.middleware.origin_check as origin_check_module
from fastapi import FastAPI
from fastapi.responses import JSONResponse
from httpx import AsyncClient, ASGITransport

from app.config.settings import settings
from app.middleware.origin_check import add_origin_check_middleware


def make_origin_check_app() -> FastAPI:
    app = FastAPI()
    add_origin_check_middleware(app)

    @app.get("/api/test")
    async def stub():
        return JSONResponse({"ok": True})

    return app


@pytest_asyncio.fixture
async def origin_client(monkeypatch):
    monkeypatch.setattr(settings, "DEBUG", False)
    monkeypatch.setattr(origin_check_module, "ORIGIN_SECRET", "test-secret")
    app = make_origin_check_app()
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as c:
        yield c


async def test_no_header_returns_404(origin_client):
    r = await origin_client.get("/api/test")
    assert r.status_code == 404


async def test_wrong_secret_returns_404(origin_client):
    r = await origin_client.get("/api/test", headers={"x-origin-secret": "wrong"})
    assert r.status_code == 404


async def test_correct_secret_passes_through(origin_client):
    r = await origin_client.get("/api/test", headers={"x-origin-secret": "test-secret"})
    assert r.status_code == 200


async def test_railway_host_bypasses_check(origin_client):
    r = await origin_client.get("/api/test", headers={"host": "healthcheck.railway.app"})
    assert r.status_code == 200

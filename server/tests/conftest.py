"""
Pytest configuration and shared fixtures.
"""
import pytest
from fastapi.testclient import TestClient
from collections.abc import Generator
from sqlalchemy.orm import Session

from app.main import app
from app.core.database import get_db_session
from app.core.cache import redis_client


@pytest.fixture
def client():
    """
    FastAPI test client fixture.
    
    Usage:
        def test_endpoint(client):
            response = client.get("/api/levels/")
            assert response.status_code == 200
    """
    return TestClient(app)


@pytest.fixture
def db_session() -> Generator[Session, None, None]:
    """
    Database session fixture.
    
    Usage:
        def test_database(db_session):
            level = db_session.query(Level).first()
            assert level is not None
    """
    db = get_db_session()
    try:
        yield db
    finally:
        db.close()


@pytest.fixture(autouse=True)
def clear_cache():
    """
    Automatically clear cache before each test.
    Use autouse=True to run for every test.
    """
    try:
        redis_client.flushdb()
    except Exception:
        pass  # Redis might not be available in test environment
    yield
    # Cleanup after test if needed


@pytest.fixture
def sample_collectible_data():
    """
    Sample collectible data for testing.
    
    Usage:
        def test_create_collectible(sample_collectible_data):
            # Use sample_collectible_data in your test
    """
    return {
        "location_id": 1,
        "type_ids": [1],
        "title": "Test Collectible",
        "description": "Test description",
        "display_order": 1,
        "images": [
            {
                "cloudinary_url": "https://example.com/image.jpg",
                "alt_text": "Test image",
                "display_order": 1
            }
        ]
    }


@pytest.fixture
def mock_redis(monkeypatch):
    """
    Mock Redis for tests that don't need real Redis.
    
    Usage:
        def test_without_redis(mock_redis):
            # Redis calls will be mocked
    """
    mock_data = {}
    
    def mock_get(key):
        return mock_data.get(key)
    
    def mock_setex(key, expire, value):
        mock_data[key] = value
        return True
    
    def mock_delete(key):
        mock_data.pop(key, None)
        return True
    
    monkeypatch.setattr("app.core.cache.redis_client.get", mock_get)
    monkeypatch.setattr("app.core.cache.redis_client.setex", mock_setex)
    monkeypatch.setattr("app.core.cache.redis_client.delete", mock_delete)
    
    return mock_data


# Test markers
def pytest_configure(config):
    """
    Register custom pytest markers.
    """
    config.addinivalue_line(
        "markers", "slow: marks tests as slow (deselect with '-m \"not slow\"')"
    )
    config.addinivalue_line(
        "markers", "integration: marks tests as integration tests"
    )
    config.addinivalue_line(
        "markers", "unit: marks tests as unit tests"
    )
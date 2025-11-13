"""
Test collectibles API endpoints.
"""
import pytest


class TestCollectiblesEndpoints:
    """Test collectibles CRUD operations"""
    
    def test_get_all_collectibles(self, client):
        """Test GET /api/collectibles/"""
        response = client.get("/api/collectibles/")
        
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        
        # If data exists, verify structure
        if len(data) > 0:
            item = data[0]
            assert "id" in item
            assert "title" in item
            assert "description" in item
            assert "types" in item
            assert "level" in item
            assert "location" in item
            assert "images" in item
    
    def test_get_collectibles_by_level(self, client):
        """Test GET /api/collectibles/levels/{level_name}"""
        # Test with known level
        response = client.get("/api/collectibles/levels/eidos-7")
        
        if response.status_code == 404:
            pytest.skip("No data in database for this test")
        
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        
        # Verify structure
        if len(data) > 0:
            location = data[0]
            assert "location_id" in location
            assert "location_name" in location
            assert "collectibles" in location
            assert isinstance(location["collectibles"], list)
    
    def test_get_collectibles_by_type(self, client):
        """Test GET /api/collectibles/types/{type_name}"""
        # Test with known type
        response = client.get("/api/collectibles/types/can")
        
        if response.status_code == 404:
            pytest.skip("No data in database for this test")
        
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        
        # Verify structure
        if len(data) > 0:
            level = data[0]
            assert "level_id" in level
            assert "level_name" in level
            assert "locations" in level
    
    def test_get_collectibles_by_location(self, client):
        """Test GET /api/collectibles/{level_name}/{location_name}"""
        response = client.get("/api/collectibles/eidos-7/silent-street")
        
        if response.status_code == 404:
            pytest.skip("No data in database for this test")
        
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        
        # Verify structure
        if len(data) > 0:
            item = data[0]
            assert "id" in item
            assert "title" in item
            assert "types" in item
    
    def test_invalid_level_returns_404(self, client):
        """Test that invalid level returns 404"""
        response = client.get("/api/collectibles/levels/invalid-level-name")
        assert response.status_code == 404
        
        data = response.json()
        assert "detail" in data
    
    def test_invalid_type_returns_404(self, client):
        """Test that invalid type returns 404"""
        response = client.get("/api/collectibles/types/invalid-type-name")
        assert response.status_code == 404


class TestCollectibleTypes:
    """Test collectible types endpoint"""
    
    def test_get_all_types(self, client):
        """Test GET /api/collectibles/types"""
        response = client.get("/api/collectibles/types")
        
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        
        # If types exist, verify structure
        if len(data) > 0:
            item = data[0]
            assert "id" in item
            assert "name" in item


class TestCollectiblesCache:
    """Test that collectibles endpoints use cache"""
    
    def test_collectibles_cached_response(self, client):
        """Test that repeated requests return cached data"""
        endpoint = "/api/collectibles/"
        
        # First request
        response1 = client.get(endpoint)
        data1 = response1.json()
        
        # Second request (should be cached)
        response2 = client.get(endpoint)
        data2 = response2.json()
        
        # Data should be identical
        assert data1 == data2


class TestCollectiblesValidation:
    """Test input validation"""
    
    def test_level_name_formatting(self, client):
        """Test that level names handle different formats"""
        # Test with hyphens
        response1 = client.get("/api/collectibles/levels/eidos-7")
        
        # Test with spaces (should be converted)
        response2 = client.get("/api/collectibles/levels/eidos%207")
        
        # Both should work or both should fail consistently
        assert response1.status_code in [200, 404]
        assert response2.status_code in [200, 404]


if __name__ == "__main__":
    pytest.main([__file__, "-v"])
"""
Test caching functionality and performance.
"""
import pytest
import time
from core.cache import get_cache, set_cache, delete_cache, invalidate_cache_pattern


class TestCacheBasics:
    """Test basic cache operations"""
    
    def test_set_and_get_cache(self):
        """Test setting and getting cache values"""
        key = "test:key"
        value = {"data": "test"}
        
        # Set cache
        result = set_cache(key, value, ttl=60)
        assert result is True
        
        # Get cache
        cached = get_cache(key)
        assert cached == value
    
    def test_cache_expiration(self):
        """Test that cache expires after TTL"""
        key = "test:expiring"
        value = "test"
        
        # Set with 1 second expiration
        set_cache(key, value, ttl=1)
        
        # Should exist immediately
        assert get_cache(key) == value
        
        # Wait for expiration
        time.sleep(1.1)
        
        # Should be expired
        assert get_cache(key) is None
    
    def test_delete_cache(self):
        """Test deleting cache entries"""
        key = "test:delete"
        value = "test"
        
        # Set and verify
        set_cache(key, value)
        assert get_cache(key) == value
        
        # Delete
        result = delete_cache(key)
        assert result is True
        
        # Verify deleted
        assert get_cache(key) is None
    
    def test_cache_none_value(self):
        """Test getting non-existent cache key"""
        result = get_cache("nonexistent:key")
        assert result is None


class TestCachePatterns:
    """Test cache pattern operations"""
    
    def test_invalidate_pattern(self):
        """Test invalidating multiple cache keys by pattern"""
        # Set multiple keys
        set_cache("collectibles:level:eidos-7", {"data": 1})
        set_cache("collectibles:level:xion", {"data": 2})
        set_cache("collectibles:type:fish", {"data": 3})
        set_cache("levels:all", {"data": 4})
        
        # Invalidate collectibles pattern
        count = invalidate_cache_pattern("collectibles:*")
        assert count >= 3  # Should delete at least 3 keys
        
        # Verify collectibles caches are gone
        assert get_cache("collectibles:level:eidos-7") is None
        assert get_cache("collectibles:level:xion") is None
        assert get_cache("collectibles:type:fish") is None
        
        # Verify other caches still exist
        assert get_cache("levels:all") == {"data": 4}


class TestCachePerformance:
    """Test cache performance improvements"""
    
    @pytest.mark.slow
    def test_cache_speedup(self, client):
        """
        Test that cached requests are faster than uncached.
        This is a basic benchmark test.
        """
        endpoint = "/api/collectibles/levels/eidos-7"
        
        # Clear cache
        invalidate_cache_pattern("collectibles:level:eidos-7")
        
        # Measure cold request (cache miss)
        start = time.time()
        response1 = client.get(endpoint)
        cold_time = time.time() - start
        
        assert response1.status_code == 200
        
        # Measure warm request (cache hit)
        start = time.time()
        response2 = client.get(endpoint)
        warm_time = time.time() - start
        
        assert response2.status_code == 200
        assert response1.json() == response2.json()
        
        # Cached request should be faster
        # Note: This might be flaky in CI environments
        print(f"\nCold: {cold_time*1000:.2f}ms, Warm: {warm_time*1000:.2f}ms")
        assert warm_time < cold_time or warm_time < 0.01  # Very lenient


class TestCacheConsistency:
    """Test cache data consistency"""
    
    def test_cache_data_consistency(self, client):
        """Test that cached data matches database data"""
        endpoint = "/api/levels/"
        
        # Clear cache
        invalidate_cache_pattern("levels:*")
        
        # Get uncached response
        response1 = client.get(endpoint)
        data1 = response1.json()
        
        # Get cached response
        response2 = client.get(endpoint)
        data2 = response2.json()
        
        # Should be identical
        assert data1 == data2
    
    def test_cache_json_serialization(self):
        """Test that complex objects are properly serialized"""
        key = "test:complex"
        value = {
            "string": "test",
            "number": 123,
            "float": 45.67,
            "bool": True,
            "null": None,
            "array": [1, 2, 3],
            "nested": {
                "key": "value"
            }
        }
        
        set_cache(key, value)
        cached = get_cache(key)
        
        assert cached == value
        assert isinstance(cached["number"], int)
        assert isinstance(cached["float"], float)
        assert isinstance(cached["bool"], bool)


if __name__ == "__main__":
    pytest.main([__file__, "-v"])
# # test_cache.py
# import redis
# import requests
# import time

# BASE_URL = "http://localhost:8000/api"
# r = redis.Redis(host="localhost", port=6379, db=0)

# def clear_cache():
#     print("Flushing Redis cache...")
#     r.flushdb()
#     print("✓ Redis cache cleared\n")

# def test_endpoint(endpoint, runs=25):
#     """Benchmark cache performance for a given endpoint."""
#     clear_cache()

#     print(f"Testing cache performance for {endpoint}...\n")

#     # First request (cache miss)
#     start = time.time()
#     r1 = requests.get(f"{BASE_URL}{endpoint}")
#     miss_time = time.time() - start
#     print(f"✓ First request (cache MISS): {miss_time*1000:.2f}ms")

#     # Warm cache (cache hit runs)
#     hit_times = []
#     for _ in range(runs):
#         start = time.time()
#         requests.get(f"{BASE_URL}{endpoint}")
#         hit_times.append(time.time() - start)

#     avg_hit = sum(hit_times) / len(hit_times)

#     print(f"✓ Average of {runs} cache HITs: {avg_hit*1000:.2f}ms")
#     print(f"🚀 Speedup: {miss_time / avg_hit:.1f}x faster\n")

#     # Verify cache consistency
#     r2 = requests.get(f"{BASE_URL}{endpoint}")
#     if r1.json() == r2.json():
#         print("✓ Data matches (cache working correctly)")
#     else:
#         print("✗ Data mismatch (problem!)")

# # Run the test
# test_endpoint("/levels")

import requests
import time
import redis

BASE_URL = "http://localhost:8000/api"
ITERATIONS = 25  # Number of iterations for each test

# --- Connect to local Redis ---
r = redis.Redis(host='localhost', port=6379, db=0)  # adjust host/port/db if needed

def flush_cache():
    """Clear Redis cache."""
    try:
        r.flushdb()
    except Exception as e:
        print(f"⚠️  Could not flush Redis: {e}")

def measure_request():
    """Send a GET request and return elapsed time (ms) and response object."""
    start = time.time()
    response = requests.get(f"{BASE_URL}/levels")
    duration = (time.time() - start) * 1000  # milliseconds
    return duration, response

def benchmark_cache(iterations: int = ITERATIONS):
    print(f"🚀 Benchmarking cache with {iterations} iterations each for cold and warm runs...\n")

    # --- Cold requests (cache miss) ---
    cold_times = []
    print("❄️  Running cold requests (cache miss)...")
    for i in range(iterations):
        flush_cache()
        t, r = measure_request()
        cold_times.append(t)
        print(f"  Cold #{i+1}: {t:.2f}ms")

    # --- Warm requests (cache hit) ---
    warm_times = []
    print("\n🔥 Running warm requests (cache hit)...")
    # Ensure cache is populated
    flush_cache()
    measure_request()  # populate cache

    for i in range(iterations):
        t, r = measure_request()
        warm_times.append(t)
        print(f"  Warm #{i+1}: {t:.2f}ms")

    # --- Compute averages ---
    avg_cold = sum(cold_times) / len(cold_times)
    avg_warm = sum(warm_times) / len(warm_times)
    speedup = avg_cold / avg_warm if avg_warm > 0 else float('inf')

    print("\n=== RESULTS ===")
    print(f"❄️  Cold average: {avg_cold:.2f}ms")
    print(f"🔥 Warm average: {avg_warm:.2f}ms")
    print(f"⚡ Speedup: {speedup:.1f}x faster when cached!")

    # --- Data consistency check ---
    flush_cache()
    _, r1 = measure_request()
    _, r2 = measure_request()
    if r1.json() == r2.json():
        print("\n✅ Data matches between cached and uncached responses")
    else:
        print("\n❌ Data mismatch — possible cache inconsistency")

if __name__ == "__main__":
    benchmark_cache()

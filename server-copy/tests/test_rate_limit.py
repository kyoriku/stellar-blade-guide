import requests
import time

BASE_URL = "http://localhost:8000"
ENDPOINT = "/api/collectibles/levels/eidos-7"

def test_rate_limit():
    print("Testing rate limit...")
    successful = 0
    rate_limited = 0
    
    for i in range(1, 101):
        response = requests.get(f"{BASE_URL}{ENDPOINT}")
        
        if response.status_code == 200:
            successful += 1
            print(f"✓ Request {i}: Success")
        elif response.status_code == 429:
            rate_limited += 1
            print(f"✗ Request {i}: Rate Limited!")
            print(f"  Headers: {dict(response.headers)}")
            print(f"  Response: {response.json()}")
        else:
            print(f"? Request {i}: Unexpected status {response.status_code}")
        
        # Small delay to avoid network issues
        time.sleep(0.01)
    
    print(f"\n{'='*50}")
    print(f"Successful requests: {successful}")
    print(f"Rate limited requests: {rate_limited}")
    print(f"Total requests: {successful + rate_limited}")

if __name__ == "__main__":
    test_rate_limit()
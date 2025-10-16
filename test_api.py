#!/usr/bin/env python3
"""Simple test script to verify API endpoints are working."""

import requests
import json

BASE_URL = "http://localhost:8000"

def test_health():
    """Test health endpoint."""
    print("🔍 Testing health endpoint...")
    try:
        response = requests.get(f"{BASE_URL}/health")
        print(f"Status: {response.status_code}")
        print(f"Response: {response.json()}")
        return response.status_code == 200
    except Exception as e:
        print(f"❌ Health check failed: {e}")
        return False

def test_debug_info():
    """Test debug info endpoint."""
    print("\n🔍 Testing debug info endpoint...")
    try:
        response = requests.get(f"{BASE_URL}/debug/info")
        print(f"Status: {response.status_code}")
        print(f"Response: {json.dumps(response.json(), indent=2)}")
        return response.status_code == 200
    except Exception as e:
        print(f"❌ Debug info check failed: {e}")
        return False

def test_chat_endpoint():
    """Test chat endpoint with proper message format."""
    print("\n🔍 Testing chat endpoint...")
    try:
        payload = {
            "messages": [
                {"role": "user", "content": "Hello, this is a test message"}
            ]
        }
        
        response = requests.post(
            f"{BASE_URL}/api/chat",
            json=payload,
            headers={"Content-Type": "application/json"}
        )
        print(f"Status: {response.status_code}")
        
        if response.status_code == 200:
            print("✅ Chat endpoint working (streaming response)")
            return True
        else:
            print(f"❌ Chat endpoint failed: {response.text}")
            return False
            
    except Exception as e:
        print(f"❌ Chat endpoint test failed: {e}")
        return False

def main():
    """Run all tests."""
    print("🧪 Testing API endpoints...\n")
    
    tests = [
        test_health,
        test_debug_info,
        test_chat_endpoint
    ]
    
    results = []
    for test in tests:
        results.append(test())
    
    print(f"\n📊 Test Results: {sum(results)}/{len(results)} passed")
    
    if all(results):
        print("🎉 All tests passed!")
    else:
        print("❌ Some tests failed. Check the output above.")

if __name__ == "__main__":
    main()

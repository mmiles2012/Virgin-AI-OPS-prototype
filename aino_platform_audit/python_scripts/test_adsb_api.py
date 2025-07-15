#!/usr/bin/env python3
"""
Test script to check ADS-B Exchange API response format
"""
import os
import requests
import json

# Get environment variables
HOST = os.getenv("RAPIDAPI_HOST", "adsbexchange-com1.p.rapidapi.com")
KEY = os.getenv("RAPIDAPI_KEY")

if not KEY:
    print("ERROR: RAPIDAPI_KEY environment variable not set")
    exit(1)

HEADERS = {
    "X-RapidAPI-Host": HOST,
    "X-RapidAPI-Key": KEY
}

# Focus area: Heathrow region (from your Python code)
LAT, LON, DIST_NM = 51.4700, -0.4543, 500

def test_api():
    url = f"https://{HOST}/v2/lat/{LAT}/lon/{LON}/dist/{DIST_NM}/"
    print(f"Testing API endpoint: {url}")
    print(f"Headers: {HEADERS}")
    
    try:
        resp = requests.get(url, headers=HEADERS, timeout=10)
        print(f"Status code: {resp.status_code}")
        print(f"Response headers: {dict(resp.headers)}")
        
        # Try to parse JSON
        try:
            data = resp.json()
            print(f"JSON parsed successfully!")
            print(f"Response keys: {list(data.keys()) if isinstance(data, dict) else 'Not a dict'}")
            
            if 'ac' in data:
                print(f"Aircraft count: {len(data['ac'])}")
                if data['ac']:
                    print(f"Sample aircraft: {data['ac'][0]}")
            
            if 'message' in data:
                print(f"API message: {data['message']}")
            
            print(f"Full response: {data}")
            
        except json.JSONDecodeError as e:
            print(f"JSON decode error: {e}")
            print(f"Raw response (first 200 chars): {resp.text[:200]}")
            
    except requests.exceptions.RequestException as e:
        print(f"Request error: {e}")

if __name__ == "__main__":
    test_api()
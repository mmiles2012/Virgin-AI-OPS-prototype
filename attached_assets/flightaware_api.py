
# flightaware_api.py
import requests

def fetch_flightaware_info(airport_code, api_key):
    url = f"https://aeroapi.flightaware.com/aeroapi/airports/{airport_code}/delays"
    headers = {
        "x-apikey": api_key
    }
    try:
        response = requests.get(url, headers=headers, timeout=5)
        if response.status_code == 200:
            return response.json()
        else:
            return {"error": f"Status code {response.status_code}"}
    except Exception as e:
        return {"error": str(e)}

# Example (insert your API key before running):
if __name__ == "__main__":
    print(fetch_flightaware_info("JFK", "YOUR_API_KEY"))

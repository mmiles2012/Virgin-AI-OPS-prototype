
import requests

def fetch_virgin_atlantic_flights(api_key):
    headers = {
        'api-auth': api_key
    }
    url = "https://adsbexchange-com1.p.rapidapi.com/v2/lat/51.4700/lon/-0.4543/dist/250/"  # Around Heathrow
    response = requests.get(url, headers=headers)
    if response.status_code == 200:
        flights = response.json().get("ac", [])
        va_flights = [f for f in flights if f.get("flight", "").startswith("VS")]
        return va_flights
    else:
        print("Failed to fetch ADS-B data.")
        return []

if __name__ == "__main__":
    api_key = "YOUR_ADSB_RAPIDAPI_KEY"
    virgin_flights = fetch_virgin_atlantic_flights(api_key)
    print(f"Found {len(virgin_flights)} Virgin Atlantic aircraft nearby.")

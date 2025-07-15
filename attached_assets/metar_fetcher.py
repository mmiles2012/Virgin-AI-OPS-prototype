
# metar_fetcher.py
import requests

def fetch_metar(icao_code):
    url = f"https://aviationweather.gov/api/data/metar?ids={icao_code}&format=raw"
    headers = {
        "User-Agent": "Mozilla/5.0"
    }
    try:
        response = requests.get(url, headers=headers, timeout=5)
        if response.status_code == 200:
            return response.text.strip()
        else:
            return None
    except Exception as e:
        return str(e)

# Example
if __name__ == "__main__":
    print(fetch_metar("KLAX"))


import requests
import json

def fetch_sigmet_geojson():
    url = "https://www.aviationweather.gov/api/data/metproducts?format=geojson&product=sigmet"
    response = requests.get(url)
    if response.status_code == 200:
        with open("sigmets.geojson", "w") as f:
            json.dump(response.json(), f)
        return response.json()
    else:
        print("Failed to fetch SIGMET data.")
        return None

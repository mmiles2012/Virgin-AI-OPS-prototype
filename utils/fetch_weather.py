import pandas as pd
import requests
import time
from datetime import datetime
import os

AVWX_API_KEY = "apVijXnTpTLwaK_Z8c5qQSsZfLRb6x6WLv6aZQK_gtA"
ICAO_CODES = [
    'EGLL', 'EGKK', 'EGCC', 'EGGD', 'EGPH', 'EGTE'  # Major UK airports for faster demo
]


def get_metar_taf_data(station, api_key):
    headers = {"Authorization": f"Bearer {api_key}", "Accept": "application/json"}
    url = f"https://avwx.rest/api/metar/{station}?options=info,translate"
    try:
        res = requests.get(url, headers=headers).json()
        return {
            "station": station,
            "retrieved_at": datetime.utcnow().isoformat(),
            "visibility": float(res.get("visibility", {}).get("value", 10000)),
            "wind_speed": float(res.get("wind_speed", {}).get("value", 0)),
            "temperature": float(res.get("temperature", {}).get("value", 15)),
            "dewpoint": float(res.get("dewpoint", {}).get("value", 10)),
            "flight_rules": res.get("flight_rules", "VFR")
        }
    except Exception as e:
        print(f"Error fetching data for {station}: {e}")
        return {"station": station, "error": True}


def fetch_and_save_weather_data():
    os.makedirs("data", exist_ok=True)
    records = []
    print(f"Fetching weather data for {len(ICAO_CODES)} UK airports...")
    
    for code in ICAO_CODES:
        print(f"  Fetching {code}...")
        records.append(get_metar_taf_data(code, AVWX_API_KEY))
        time.sleep(0.5)  # Reduced delay for faster demo
    
    df = pd.DataFrame(records)
    
    # Handle errors and missing data
    error_count = df['error'].sum() if 'error' in df.columns else 0
    df = df[df.get('error', False) != True]  # Remove error records
    
    if len(df) == 0:
        print("No valid weather data retrieved. Check API key and connectivity.")
        return
    
    # Add weather-based flags for delay prediction
    df["low_visibility_flag"] = df["visibility"] < 3000
    df["strong_wind_flag"] = df["wind_speed"] > 25
    df["ifr_flag"] = df["flight_rules"].isin(["IFR", "LIFR"])
    df["temp_dewpoint_delta"] = df["temperature"] - df["dewpoint"]
    df["fog_risk_flag"] = (df["temp_dewpoint_delta"] < 2) & (df["visibility"] < 2000)
    
    # Save weather data
    df.to_csv("data/weather_data.csv", index=False)
    print(f"✓ Weather data saved for {len(df)} airports ({error_count} errors)")
    
    return df
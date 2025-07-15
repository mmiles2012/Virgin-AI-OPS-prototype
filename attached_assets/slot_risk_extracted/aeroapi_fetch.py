
import requests
import pandas as pd
import os

BASE_URL = "https://aeroapi.flightaware.com/aeroapi"

def get_flightaware_data(flight_id):
    headers = {
        "x-apikey": os.getenv("FLIGHTAWARE_API_KEY")
    }
    url = f"{BASE_URL}/flights/{flight_id}"

    response = requests.get(url, headers=headers)
    if response.status_code != 200:
        return None

    data = response.json().get("flights", [])
    if not data:
        return None

    flight = data[0]
    return {
        "Flight Number": flight.get("ident"),
        "Origin": flight.get("origin", {}).get("code_iata"),
        "Destination": flight.get("destination", {}).get("code_iata"),
        "Scheduled Departure (UTC)": flight.get("scheduled_off"),
        "Estimated Departure (UTC)": flight.get("estimated_off"),
        "Status": flight.get("status"),
        "Gate Departure Delay (min)": flight.get("departure_delay", 0)
    }

def build_slot_feed(flight_ids):
    records = []
    for fid in flight_ids:
        result = get_flightaware_data(fid)
        if result:
            records.append(result)
    return pd.DataFrame(records)

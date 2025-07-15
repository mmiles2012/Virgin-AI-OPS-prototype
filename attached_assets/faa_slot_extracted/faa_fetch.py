
import requests
import xml.etree.ElementTree as ET
import pandas as pd

def fetch_faa_nas_data():
    url = "https://nasstatus.faa.gov/api/airport-status-information"
    response = requests.get(url)
    root = ET.fromstring(response.content)

    events = []
    for airport in root.findall(".//Airport"):
        name = airport.findtext("Name")
        iata = airport.findtext("IATA")
        delay_status = airport.findtext("Delay_Status")
        reason = airport.findtext("Delay_Reason")
        avg_delay = airport.findtext("Avg_Delay")
        delay_type = airport.findtext("Delay_Type")
        timestamp = airport.findtext("Time_Updated")

        if delay_status and delay_status.lower() != "normal":
            events.append({
                "Airport": name,
                "IATA": iata,
                "Delay_Status": delay_status,
                "Reason": reason,
                "Avg_Delay": avg_delay,
                "Delay_Type": delay_type,
                "Timestamp": timestamp
            })

    df = pd.DataFrame(events)
    df["Avg_Delay_Minutes"] = df["Avg_Delay"].str.extract(r'(\d+)').astype(float)
    df["Timestamp"] = pd.to_datetime(df["Timestamp"], errors='coerce')
    df["Hour_Reported"] = df["Timestamp"].dt.hour
    return df

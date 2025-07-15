# faa_scraper.py
import requests
import pandas as pd
from io import BytesIO
from datetime import datetime
from bs4 import BeautifulSoup

# Target airports
TARGET_AIRPORTS = ["JFK", "BOS", "ATL", "LAX", "SFO", "MCO", "MIA", "TPA", "LAS"]

# URL to the FAA delay cause download page
BASE_URL = "https://www.transtats.bts.gov/OT_Delay/OT_DelayCause1.asp?pn=1"

# In-memory storage
faa_delay_data = {}

def fetch_latest_faa_file():
    r = requests.get(BASE_URL)
    soup = BeautifulSoup(r.content, "html.parser")
    links = soup.find_all("a", href=True)
    xlsx_links = [
        "https://www.transtats.bts.gov/" + a["href"]
        for a in links
        if "DownloadTable" in a["href"] and ".xlsx" in a["href"]
    ]
    return xlsx_links[0] if xlsx_links else None

def parse_faa_delay_file(url):
    response = requests.get(url)
    df = pd.read_excel(BytesIO(response.content), skiprows=6)
    df = df[df["Airport"].isin(TARGET_AIRPORTS)]

    parsed = []
    for _, row in df.iterrows():
        entry = {
            "airport": row["Airport"],
            "month": row["Month"],
            "year": int(row["Year"]),
            "total_ops": int(row["Total Flights"]),
            "carrier_delay": float(row["Carrier Delay"]),
            "weather_delay": float(row["Weather Delay"]),
            "nas_delay": float(row["NAS Delay"]),
            "security_delay": float(row["Security Delay"]),
            "late_aircraft_delay": float(row["Late Aircraft Delay"]),
            "total_delay": float(row["Carrier Delay"] + row["Weather Delay"] +
                                 row["NAS Delay"] + row["Security Delay"] +
                                 row["Late Aircraft Delay"])
        }
        parsed.append(entry)

    return parsed

def run_faa_scraper():
    download_url = fetch_latest_faa_file()
    if not download_url:
        return {"status": "error", "message": "No FAA file found"}
    
    parsed_data = parse_faa_delay_file(download_url)

    # Update in-memory store
    for row in parsed_data:
        key = f"{row['airport']}_{row['year']}_{row['month']}"
        faa_delay_data[key] = row

    return {"status": "success", "records": len(parsed_data), "last_updated": datetime.utcnow().isoformat()}
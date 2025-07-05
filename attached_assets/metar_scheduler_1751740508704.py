from datetime import datetime
import os
from download_metar_ogimet import download_noaa_metar

STATE_FILE = "data/metar/last_run.txt"

def should_run_this_month():
    now = datetime.utcnow()
    current = f"{now.year}-{now.month:02d}"
    if not os.path.exists(STATE_FILE):
        return True
    with open(STATE_FILE, "r") as f:
        last = f.read().strip()
    return current != last

def update_last_run():
    now = datetime.utcnow()
    with open(STATE_FILE, "w") as f:
        f.write(f"{now.year}-{now.month:02d}")

def run_metar_update():
    if not should_run_this_month():
        print("METAR update already performed this month.")
        return

    print("Running monthly METAR update...")
    airports = ["JFK", "BOS", "ATL", "LAX", "SFO", "MCO", "MIA", "TPA", "LAS"]
    now = datetime.utcnow()
    for icao in airports:
        download_noaa_metar(icao, now.year, now.month)

    update_last_run()
    print("METAR update complete.")
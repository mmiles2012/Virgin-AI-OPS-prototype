
import time
from fetch_sigmet import fetch_sigmet_geojson

def refresh_sigmets(interval_minutes=10):
    while True:
        data = fetch_sigmet_geojson()
        if data:
            print("✔ SIGMET data updated.")
        else:
            print("✖ Update failed.")
        time.sleep(interval_minutes * 60)

if __name__ == "__main__":
    refresh_sigmets()

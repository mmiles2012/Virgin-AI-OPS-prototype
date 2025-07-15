
# faa_nas_scraper.py
import requests
from bs4 import BeautifulSoup
import pandas as pd
from datetime import datetime

def scrape_faa_nas_status():
    url = "https://nasstatus.faa.gov/list"
    headers = {
        "User-Agent": "Mozilla/5.0"
    }

    response = requests.get(url, headers=headers)
    soup = BeautifulSoup(response.content, "html.parser")
    table = soup.find("table")

    data = []
    if table:
        rows = table.find_all("tr")[1:]  # Skip header
        for row in rows:
            cols = row.find_all("td")
            if len(cols) >= 5:
                airport = cols[0].text.strip()
                status = cols[1].text.strip()
                start_time = cols[2].text.strip()
                update_time = cols[3].text.strip()
                reason = cols[4].text.strip()

                data.append({
                    "airport": airport,
                    "status": status,
                    "start_time": start_time,
                    "last_update": update_time,
                    "reason": reason
                })

    df = pd.DataFrame(data)
    df["timestamp_scraped"] = datetime.utcnow()
    return df

if __name__ == "__main__":
    df = scrape_faa_nas_status()
    print(df.head())
    df.to_csv("faa_nas_events.csv", index=False)

# weather_batch_scraper.py
import pandas as pd
from datetime import datetime, timedelta
from time import sleep
import requests
from bs4 import BeautifulSoup

FAA_TO_ICAO = {
    "JFK": "KJFK", "BOS": "KBOS", "ATL": "KATL", "LAX": "KLAX",
    "SFO": "KSFO", "MCO": "KMCO", "MIA": "KMIA", "TPA": "KTPA", "LAS": "KLAS"
}

def scrape_ogimet_weather(icao_code, year, month):
    url = f"https://www.ogimet.com/cgi-bin/gsynres?ind={icao_code}&ano={year}&mes={month:02d}&day=01&hora=00&ndays=30&lang=en"
    try:
        res = requests.get(url, timeout=10)
        soup = BeautifulSoup(res.content, "html.parser")
        tables = soup.find_all("table")
        df = pd.read_html(str(tables[1]))[0]
        df.columns = [col.strip() for col in df.columns]
    except Exception as e:
        print(f"Failed for {icao_code} {year}-{month}: {e}")
        return None

    return {
        "airport": icao_code,
        "year": year,
        "month": month,
        "avg_temp_c": pd.to_numeric(df["Tmed"], errors="coerce").mean() if "Tmed" in df else None,
        "total_precip_mm": pd.to_numeric(df["Prec."], errors="coerce").sum() if "Prec." in df else None,
        "snow_days": df["Phenomena"].fillna("").str.contains("SN").sum() if "Phenomena" in df else 0,
        "thunderstorm_days": df["Phenomena"].fillna("").str.contains("TS").sum() if "Phenomena" in df else 0,
    }

def fetch_weather_past_year():
    summaries = []
    today = datetime.today()
    for months_ago in range(1, 13):
        date = today - timedelta(days=30 * months_ago)
        year, month = date.year, date.month
        for faa, icao in FAA_TO_ICAO.items():
            result = scrape_ogimet_weather(icao, year, month)
            if result:
                result["faa"] = faa
                summaries.append(result)
                print(f"✔ {faa} {month}/{year}")
            sleep(1)  # be kind to OGIMET

    return pd.DataFrame(summaries)
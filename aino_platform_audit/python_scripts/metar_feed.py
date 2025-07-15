import requests
from datetime import datetime
import xml.etree.ElementTree as ET

NOAA_URL = "https://aviationweather.gov/adds/dataserver_current/httpparam"

def get_metar(icao):
    params = {
        "dataSource": "metars",
        "requestType": "retrieve",
        "format": "xml",
        "stationString": icao,
        "hoursBeforeNow": 1
    }

    try:
        response = requests.get(NOAA_URL, params=params, timeout=10)
        response.raise_for_status()
        root = ET.fromstring(response.content)
        metar = root.find(".//METAR")
        if metar is None:
            return {"icao": icao, "error": "No METAR available"}

        return {
            "icao": icao,
            "raw_text": metar.findtext("raw_text", default=""),
            "flight_category": metar.findtext("flight_category", default=""),
            "visibility": float(metar.findtext("visibility_statute_mi", default=10)),
            "wind_speed_kt": int(metar.findtext("wind_speed_kt", default=0)),
            "wx_string": metar.findtext("wx_string", default=""),
            "ceiling_ft_agl": int(metar.findtext("cloud_base_ft_agl", default=10000)) if metar.find("sky_condition") is not None else 10000,
            "observation_time": metar.findtext("observation_time", default="")
        }

    except Exception as e:
        return {"icao": icao, "error": str(e)}

if __name__ == "__main__":
    print(get_metar("JFK"))
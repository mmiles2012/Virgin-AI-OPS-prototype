
import streamlit as st
import pydeck as pdk
import json
import requests
from shapely.geometry import shape, Point

# Load SIGMET data (pre-fetched or freshly fetched)
@st.cache_data
def load_sigmet_data():
    with open("sigmets.geojson", "r") as f:
        return json.load(f)

# Fetch Virgin Atlantic aircraft near Heathrow using ADS-B Exchange
@st.cache_data
def fetch_virgin_atlantic_adsb(api_key):
    headers = {
        'X-RapidAPI-Key': api_key,
        'X-RapidAPI-Host': "adsbexchange-com1.p.rapidapi.com"
    }
    url = "https://adsbexchange-com1.p.rapidapi.com/v2/lat/51.4700/lon/-0.4543/dist/250/"
    response = requests.get(url, headers=headers)
    if response.status_code == 200:
        flights = response.json().get("ac", [])
        return [f for f in flights if f.get("flight", "").startswith("VS")]
    else:
        return []

# Check if aircraft is inside any SIGMET polygon
def is_inside_sigmet(lat, lon, sigmet_polygons):
    point = Point(lon, lat)
    for poly in sigmet_polygons:
        if poly.contains(point):
            return True
    return False

# Load data
st.set_page_config(layout="wide")
st.title("Virgin Atlantic Ops Dashboard: SIGMET Monitor")

api_key = st.text_input("Enter your ADS-B Exchange API Key:", type="password")

if api_key:
    sigmet_data = load_sigmet_data()
    sigmet_polygons = [shape(feature["geometry"]) for feature in sigmet_data["features"]]
    aircraft = fetch_virgin_atlantic_adsb(api_key)

    ac_coords = []
    alerts = []

    for ac in aircraft:
        lat, lon = ac.get("lat"), ac.get("lon")
        if lat is not None and lon is not None:
            ac_coords.append({"lat": lat, "lon": lon, "flight": ac.get("flight", "VS")})
            if is_inside_sigmet(lat, lon, sigmet_polygons):
                alerts.append(ac.get("flight"))

    # Show alerts
    if alerts:
        st.warning(f"⚠ Virgin aircraft inside SIGMET zones: {', '.join(alerts)}")
    else:
        st.success("✅ No Virgin aircraft currently in SIGMET zones.")

    # Display map
    st.pydeck_chart(pdk.Deck(
        initial_view_state=pdk.ViewState(latitude=51.5, longitude=-0.45, zoom=5),
        layers=[
            pdk.Layer(
                "ScatterplotLayer",
                data=ac_coords,
                get_position='[lon, lat]',
                get_color='[255, 0, 0, 160]',  # RED for Virgin aircraft
                get_radius=15000,
                pickable=True,
            ),
            pdk.Layer(
                "PolygonLayer",
                data=[
                    {
                        "polygon": feature["geometry"]["coordinates"][0],
                        "name": feature["properties"].get("hazard", "SIGMET")
                    }
                    for feature in sigmet_data["features"]
                ],
                get_polygon="polygon",
                get_fill_color="[255, 0, 0, 60]",
                get_line_color="[200, 30, 0]",
                pickable=True,
                stroked=True,
                extruded=False,
            )
        ],
        tooltip={"text": "{name}"}
    ))

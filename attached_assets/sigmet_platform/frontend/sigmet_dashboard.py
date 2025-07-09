
import streamlit as st
import pydeck as pdk
import json

st.set_page_config(layout="wide")
st.title("SIGMET Dashboard")

with open("sigmets.geojson", "r") as f:
    sigmet_data = json.load(f)

coords = []
for feature in sigmet_data["features"]:
    geom = feature["geometry"]
    if geom["type"] == "Polygon":
        for ring in geom["coordinates"]:
            for point in ring:
                coords.append({"lat": point[1], "lon": point[0]})

st.pydeck_chart(pdk.Deck(
    initial_view_state=pdk.ViewState(latitude=40, longitude=-100, zoom=3),
    layers=[
        pdk.Layer(
            "ScatterplotLayer",
            data=coords,
            get_position='[lon, lat]',
            get_color='[255, 0, 0, 160]',
            get_radius=20000,
        )
    ]
))

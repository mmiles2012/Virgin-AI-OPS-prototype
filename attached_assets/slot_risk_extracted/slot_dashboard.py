
import streamlit as st
import pandas as pd
import numpy as np
import plotly.express as px
from datetime import datetime
from aeroapi_fetch import build_slot_feed
from whatif_recommender import suggest_swaps
from alerts import check_and_alert_high_risk
from dotenv import load_dotenv

load_dotenv()
st.set_page_config(layout="wide")
st.title("✈️ Virgin Atlantic Slot Risk Dashboard")

flight_ids = ["VIR5", "VIR401", "VIR3", "VIR25", "VIR45", "VIR19"]

@st.cache_data(ttl=900)
def load_flightaware_data():
    return build_slot_feed(flight_ids)

df = load_flightaware_data()
if df.empty:
    st.error("No real-time data returned from FlightAware. Check API key or flight IDs.")
    st.stop()

df["Slot Risk Score"] = df["Gate Departure Delay (min)"].apply(lambda x: min((x / 90) * 100, 100))
df["Slot At Risk"] = df["Slot Risk Score"] > 60

if st.button("🔄 Refresh Data Now"):
    st.cache_data.clear()
    st.experimental_rerun()

fig = px.scatter(
    df,
    x="Scheduled Departure (UTC)",
    y="Gate Departure Delay (min)",
    color="Slot At Risk",
    size="Slot Risk Score",
    hover_data=["Flight Number", "Destination", "Estimated Departure (UTC)", "Slot Risk Score"],
    title="Slot Performance vs Delay Risk",
    labels={"Scheduled Departure (UTC)": "Slot Time (UTC)", "Gate Departure Delay (min)": "ATFM Delay (min)"}
)
fig.update_layout(
    height=500,
    legend_title_text='Slot At Risk',
    xaxis=dict(showgrid=True),
    yaxis=dict(showgrid=True, range=[0, df["Gate Departure Delay (min)"].max() + 10])
)
st.plotly_chart(fig, use_container_width=True)

with st.expander("🔍 View Slot Data Table"):
    st.dataframe(df, use_container_width=True)

high_risk = df[df["Slot At Risk"]]
if not high_risk.empty:
    st.warning(f"⚠️ {len(high_risk)} flight(s) are at high risk of slot non-compliance.")
    st.dataframe(high_risk[["Flight Number", "Destination", "Scheduled Departure (UTC)", "Slot Risk Score"]])
else:
    st.success("✅ No high-risk slot exposures at this time.")

# What-If Recommender
with st.expander("💡 What-If Slot Swap Suggestions"):
    suggestions = suggest_swaps(df)
    if suggestions.empty:
        st.info("No beneficial slot swaps found.")
    else:
        st.dataframe(suggestions)

# Alerts
check_and_alert_high_risk(high_risk)

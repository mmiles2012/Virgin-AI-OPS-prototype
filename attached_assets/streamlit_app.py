
import streamlit as st
import pandas as pd
from components.holding_detector import detect_holding
from components.map_tile import render_map

st.set_page_config(page_title="Heathrow Holding Monitor", layout="wide")

st.title("✈ Heathrow Airborne Holding Dashboard")

# Load live or sample data
uploaded_file = st.file_uploader("Upload flight data CSV", type="csv")
if uploaded_file:
    df = pd.read_csv(uploaded_file)
else:
    df = pd.read_csv("data/sample_heathrow_feed.csv")

# Detect holdings
processed_df = detect_holding(df)

# Summary stats
holding_counts = processed_df[processed_df['holding']].groupby("stack").size().reset_index(name="holding_count")
st.subheader("Holding Stack Summary")
st.dataframe(holding_counts)

# Map
st.subheader("Live Holding Map")
fig = render_map(processed_df)
st.plotly_chart(fig, use_container_width=True)

# Optional: download processed data
st.download_button("Download Holding Data", data=processed_df.to_csv(index=False), file_name="holding_output.csv")

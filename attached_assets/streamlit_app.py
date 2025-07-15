
# streamlit_app.py
import streamlit as st
import pandas as pd
from faa_nas_scraper import scrape_faa_nas_status
from feature_engineering import create_features
import joblib

st.title("FAA NAS Status Monitor with ML")
df = scrape_faa_nas_status()
df = create_features(df)

model = joblib.load("nas_ground_stop_model.pkl")
df["event_duration_mins"] = df["event_duration"].dt.total_seconds() / 60
features = df[["hour_of_day", "day_of_week", "event_duration_mins"]].fillna(0)

df["Predicted Ground Stop"] = model.predict(features)

st.dataframe(df[["airport", "status", "reason", "Predicted Ground Stop"]])

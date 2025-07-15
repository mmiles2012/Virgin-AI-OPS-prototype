
import streamlit as st

def check_and_alert_high_risk(high_risk_df):
    if high_risk_df.empty:
        return
    for _, row in high_risk_df.iterrows():
        st.toast(f"⚠️ ALERT: {row['Flight Number']} at risk. Delay: {row['Gate Departure Delay (min)']} min, Risk Score: {row['Slot Risk Score']:.1f}")

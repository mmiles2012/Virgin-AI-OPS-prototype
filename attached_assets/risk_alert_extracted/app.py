
import streamlit as st
from entry_risk_checker import check_entry_risks
from entry_risk_tile import display_entry_risk
from alert_notifier import send_entry_risk_alert

# Example visa matrix
visa_matrix = {
    ("Pakistan", "Indian"): "⚠️",
    ("Saudi Arabia", "Indian"): "⚠️",
    ("Pakistan", "U.S."): "⚠️"
}

# Simulated passenger data
passengers = ["Indian", "British", "Indian"]
diversion_airport = st.selectbox("Select diversion airport", ["Pakistan", "Saudi Arabia", "Uzbekistan"])

if st.button("Check Entry Risk"):
    result = check_entry_risks(passengers, diversion_airport, visa_matrix)
    display_entry_risk(result["destination"], result["flagged_nationalities"], result["entry_risk_score"])
    if result["flagged_nationalities"]:
        send_entry_risk_alert("VAA123", diversion_airport, result["flagged_nationalities"])

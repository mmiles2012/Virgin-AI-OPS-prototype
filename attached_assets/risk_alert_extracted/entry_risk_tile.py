
import streamlit as st

def display_entry_risk(destination, flagged_nationalities, risk_score):
    if flagged_nationalities:
        st.error(f"⚠️ Entry Risk at {destination}")
        st.write(f"Restricted for: {', '.join(set(flagged_nationalities))}")
        st.write(f"Risk Score: {risk_score:.2f}")
    else:
        st.success(f"No entry risk detected for {destination}")


import streamlit as st
from faa_fetch import fetch_faa_nas_data
from ml_model import train_model
import pandas as pd
import time

st.set_page_config(page_title="FAA Slot Risk Dashboard", layout="wide")

# Auto-refresh interval in seconds
refresh_interval = 300  # 5 minutes

st.title("🛫 FAA Slot Risk Dashboard with ML")

# Load and display FAA data
df = fetch_faa_nas_data()

if df.empty:
    st.warning("No current delay events from FAA.")
    st.stop()

st.subheader("📡 Live Delay Events")
st.dataframe(df[["Airport", "IATA", "Delay_Status", "Reason", "Avg_Delay_Minutes", "Timestamp"]])

# Train and display ML feature insights
model, feature_names, importances = train_model(df)
importance_df = pd.DataFrame({
    "Feature": feature_names,
    "Importance": importances
}).sort_values(by="Importance", ascending=False)

st.subheader("🤖 ML Feature Importance")
st.bar_chart(importance_df.set_index("Feature"))

# Predict risk score for each airport (0 to 1)
from sklearn.preprocessing import LabelEncoder

df["Reason_Encoded"] = LabelEncoder().fit_transform(df["Reason"].astype(str))
X_live = df[["Avg_Delay_Minutes", "Hour_Reported", "Reason_Encoded"]]
df["Delay_Risk_Score"] = model.predict_proba(X_live)[:, 1].round(2)

# Display slot risk summary
st.subheader("⚠️ Slot Risk Scores by Airport")
risk_table = df[["IATA", "Airport", "Delay_Status", "Reason", "Avg_Delay_Minutes", "Delay_Risk_Score"]].sort_values(
    by="Delay_Risk_Score", ascending=False)
st.dataframe(risk_table)

# Countdown for next auto-refresh
st.markdown(f"⏳ Auto-refreshing every {refresh_interval} seconds...")
countdown_placeholder = st.empty()

for remaining in range(refresh_interval, 0, -1):
    countdown_placeholder.markdown(f"Next refresh in: **{remaining}** seconds")
    time.sleep(1)
    if remaining == 1:
        st.rerun()

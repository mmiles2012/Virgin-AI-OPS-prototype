
import pandas as pd

def suggest_swaps(df):
    suggestions = []
    for i in range(len(df)):
        for j in range(i + 1, len(df)):
            flight_a = df.iloc[i]
            flight_b = df.iloc[j]

            if flight_a["Slot Risk Score"] > 60 and flight_b["Slot Risk Score"] < 40:
                gain = flight_a["Slot Risk Score"] - flight_b["Slot Risk Score"]
                suggestions.append({
                    "Swap": f"{flight_a['Flight Number']} ⬌ {flight_b['Flight Number']}",
                    "Gain in Risk Reduction": round(gain, 1),
                    "Suggested Action": "Consider swapping slot times"
                })
    return pd.DataFrame(suggestions)

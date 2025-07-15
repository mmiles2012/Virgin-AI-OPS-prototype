
# delay_diversion_risk.py
def compute_delay_risk(event_row):
    score = 0
    if event_row["Predicted Ground Stop"] == 1:
        score += 2
    if "Weather" in event_row["reason"]:
        score += 1
    if event_row.get("event_duration_mins", 0) > 30:
        score += 1
    return "High" if score >= 3 else "Medium" if score == 2 else "Low"

def apply_delay_risk(df):
    df["Delay Risk"] = df.apply(compute_delay_risk, axis=1)
    return df

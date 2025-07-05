import pandas as pd
import os

def classify_metar_conditions(metar_text):
    conditions = {
        "TS": "thunderstorm_days",
        "SN": "snow_days",
        "FG": "fog_days",
        "FZ": "freezing_days"
    }
    flags = {v: 0 for v in conditions.values()}
    for code, label in conditions.items():
        if code in metar_text:
            flags[label] = 1
    return flags

def parse_metar_file(filepath):
    rows = []
    with open(filepath, 'r') as f:
        for line in f:
            parts = line.strip().split()
            if len(parts) < 2:
                continue
            station = parts[0]
            date = parts[1]
            metar = " ".join(parts[2:])
            flags = classify_metar_conditions(metar)
            rows.append({
                "station": station,
                "date": date[:6],  # Format: YYYYMM
                **flags
            })
    df = pd.DataFrame(rows)
    if df.empty:
        return df
    df_agg = df.groupby(["station", "date"]).sum().reset_index()
    df_agg.rename(columns={"station": "airport", "date": "yearmonth"}, inplace=True)
    return df_agg

def enrich_with_metar(delay_df, metar_df):
    delay_df["yearmonth"] = delay_df["year"].astype(str) + delay_df["month"].apply(lambda x: f"{x:02d}")
    df = pd.merge(delay_df, metar_df, on=["airport", "yearmonth"], how="left")
    df.drop(columns=["yearmonth"], inplace=True)
    df.fillna(0, inplace=True)
    return df
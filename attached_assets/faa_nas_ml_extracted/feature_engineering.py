
# feature_engineering.py
import pandas as pd

def create_features(df):
    df["event_duration"] = pd.to_datetime(df["last_update"], errors='coerce') - pd.to_datetime(df["start_time"], errors='coerce')
    df["is_ground_stop"] = df["status"].str.contains("Ground Stop", case=False, na=False).astype(int)
    df["hour_of_day"] = pd.to_datetime(df["start_time"], errors='coerce').dt.hour
    df["day_of_week"] = pd.to_datetime(df["start_time"], errors='coerce').dt.dayofweek
    df["airport_code"] = df["airport"].str.extract(r'\((\w{3})\)')
    return df

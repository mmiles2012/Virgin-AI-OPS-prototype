import pandas as pd
from server.faa_scraper import faa_delay_data

def generate_training_dataset():
    records = list(faa_delay_data.values())
    df = pd.DataFrame(records)

    # Feature engineering
    df["delay_rate"] = df["total_delay"] / df["total_ops"]
    df["otp_percent"] = 100 * (1 - df["delay_rate"])

    # Risk categorisation (custom thresholds, tweak as needed)
    def risk_category(row):
        if row["delay_rate"] < 0.15:
            return "Green"
        elif row["delay_rate"] < 0.25:
            return "Amber"
        else:
            return "Red"

    df["delay_risk_category"] = df.apply(risk_category, axis=1)

    # Final ML dataset
    ml_df = df[[
        "airport", "year", "month", "total_ops",
        "carrier_delay", "weather_delay", "nas_delay",
        "security_delay", "late_aircraft_delay",
        "total_delay", "otp_percent", "delay_risk_category"
    ]]

    return ml_df
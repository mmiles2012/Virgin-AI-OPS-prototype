import pandas as pd
import joblib
import os
from sklearn.ensemble import RandomForestRegressor
from sklearn.model_selection import train_test_split

MODEL_FILE = "delay_model.pkl"
MODEL_COLUMNS_FILE = "model_columns.pkl"

# Base cost configuration (adjustable)
COST_PARAMS = {
    "delay_per_min": 100,             # General delay cost per minute (USD)
    "diversion_flat_fee": 5000,
    "crew_reassignment": 3000,
    "passenger_disruption": 15000,
    "usd_fx_rate": 1.0
}

# Aircraft-specific operating cost (USD/hour)
AIRCRAFT_COSTS = {
    "A350-1000": {
        "leasing_per_hour": 4200,
        "engine_per_hour": 1400,
    },
    "B787-9": {
        "leasing_per_hour": 3900,
        "engine_per_hour": 1300,
    },
    "A330-900": {
        "leasing_per_hour": 3700,
        "engine_per_hour": 1100,
    },
    "A330-300": {
        "leasing_per_hour": 3500,
        "engine_per_hour": 1000,
    }
}

def load_data(log_csv):
    df = pd.read_csv(log_csv)
    df = df.dropna()
    df = df[df["estimated_delay_min"] > 0]
    df = pd.get_dummies(df, columns=["aircraft", "failure_type", "origin", "destination"])
    joblib.dump(df.columns.tolist(), MODEL_COLUMNS_FILE)
    return df

def train_model(csv_file="logs/ops_simulation_log.csv"):
    df = load_data(csv_file)
    X = df.drop(columns=["estimated_delay_min"])
    y = df["estimated_delay_min"]
    model = RandomForestRegressor(n_estimators=100, random_state=42)
    model.fit(X, y)
    joblib.dump(model, MODEL_FILE)
    print("Model trained and saved.")

def predict_delay(input_features):
    # Use ML model if available, otherwise use rule-based estimation
    if os.path.exists(MODEL_FILE) and os.path.exists(MODEL_COLUMNS_FILE):
        try:
            model = joblib.load(MODEL_FILE)
            model_columns = joblib.load(MODEL_COLUMNS_FILE)
            df = pd.DataFrame([input_features])
            df = pd.get_dummies(df)
            df = df.reindex(columns=model_columns, fill_value=0)
            return model.predict(df)[0]
        except Exception as e:
            print(f"ML model prediction failed: {e}, using fallback estimation")
    
    # Fallback rule-based delay estimation
    base_delay = 45  # Base diversion delay in minutes
    
    # Adjust for failure type
    failure_multiplier = {
        'engine_failure': 1.5,
        'decompression': 2.0,
        'hydraulic_failure': 1.2,
        'electrical_failure': 1.3,
        'medical_emergency': 0.8,
        'fuel_emergency': 1.8
    }.get(input_features.get('failure_type', ''), 1.0)
    
    # Adjust for weather severity
    weather_penalty = input_features.get('weather_severity', 0.3) * 30
    
    # Adjust for aircraft type complexity
    aircraft_penalty = {
        'A350-1000': 10,
        'B787-9': 8,
        'A330-900': 5,
        'A330-300': 5
    }.get(input_features.get('aircraft_type', ''), 0)
    
    total_delay = base_delay * failure_multiplier + weather_penalty + aircraft_penalty
    return round(total_delay, 1)

def estimate_cost(delay_min, aircraft_type):
    p = COST_PARAMS
    ops = AIRCRAFT_COSTS.get(aircraft_type, {"leasing_per_hour": 0, "engine_per_hour": 0})
    aircraft_hourly_cost = ops["leasing_per_hour"] + ops["engine_per_hour"]
    aircraft_delay_cost = (aircraft_hourly_cost / 60) * delay_min

    total = (
        delay_min * p["delay_per_min"] +
        aircraft_delay_cost +
        p["diversion_flat_fee"] +
        p["crew_reassignment"] +
        p["passenger_disruption"]
    )
    return round(total * p["usd_fx_rate"], 2)

if __name__ == "__main__":
    train_model()
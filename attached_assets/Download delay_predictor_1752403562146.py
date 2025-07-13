
import pandas as pd
import joblib
import os
from sklearn.ensemble import RandomForestRegressor
from sklearn.model_selection import train_test_split

MODEL_FILE = "delay_model.pkl"

# Cost configuration (modifiable)
COST_PARAMS = {
    "delay_per_min": 100,         # USD per minute of delay (conservative IATA estimate)
    "diversion_flat_fee": 5000,   # Base cost to handle a diversion
    "crew_reassignment": 3000,    # Avg crew disruption cost
    "passenger_disruption": 15000,# Meals, hotels, rebooking
    "usd_fx_rate": 1.0            # Adjustable exchange rate for cost calculations
}

def load_data(log_csv):
    df = pd.read_csv(log_csv)
    df = df.dropna()
    df = df[df["estimated_delay_min"] > 0]  # Ensure target is valid
    df = pd.get_dummies(df, columns=["aircraft", "failure_type", "origin", "destination"])
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
    if not os.path.exists(MODEL_FILE):
        raise RuntimeError("Model file not found. Train the model first.")
    model = joblib.load(MODEL_FILE)
    df = pd.DataFrame([input_features])
    df = pd.get_dummies(df)
    # align columns
    model_columns = joblib.load("model_columns.pkl")
    df = df.reindex(columns=model_columns, fill_value=0)
    return model.predict(df)[0]

def estimate_cost(delay_min):
    p = COST_PARAMS
    total = (
        delay_min * p["delay_per_min"] +
        p["diversion_flat_fee"] +
        p["crew_reassignment"] +
        p["passenger_disruption"]
    )
    return round(total * p["usd_fx_rate"], 2)

if __name__ == "__main__":
    # Optional: train and test
    train_model()
    model = joblib.load(MODEL_FILE)
    print("Model ready.")

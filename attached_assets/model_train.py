
# model_train.py
from sklearn.ensemble import RandomForestClassifier
from sklearn.model_selection import train_test_split
from sklearn.metrics import classification_report
import joblib
import pandas as pd
from feature_engineering import create_features

def train_model():
    df = pd.read_csv("faa_nas_events.csv")
    df = create_features(df)
    df = df.dropna(subset=["event_duration", "is_ground_stop"])
    df["event_duration_mins"] = df["event_duration"].dt.total_seconds() / 60

    features = ["hour_of_day", "day_of_week", "event_duration_mins"]
    target = "is_ground_stop"

    X = df[features]
    y = df[target]

    X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2)
    model = RandomForestClassifier(n_estimators=100, random_state=42)
    model.fit(X_train, y_train)

    preds = model.predict(X_test)
    print(classification_report(y_test, preds))
    joblib.dump(model, "nas_ground_stop_model.pkl")

if __name__ == "__main__":
    train_model()

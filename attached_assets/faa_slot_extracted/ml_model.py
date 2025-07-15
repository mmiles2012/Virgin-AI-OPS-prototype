
from sklearn.ensemble import RandomForestClassifier
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import LabelEncoder
import pandas as pd

def train_model(df):
    df["Target"] = df["Delay_Status"].apply(lambda x: 0 if x == "Normal" else 1)
    df["Reason_Encoded"] = LabelEncoder().fit_transform(df["Reason"].astype(str))
    features = df[["Avg_Delay_Minutes", "Hour_Reported", "Reason_Encoded"]]
    labels = df["Target"]

    X_train, X_test, y_train, y_test = train_test_split(features, labels, test_size=0.3, random_state=42)
    model = RandomForestClassifier(n_estimators=100, random_state=42)
    model.fit(X_train, y_train)
    return model, features.columns, model.feature_importances_

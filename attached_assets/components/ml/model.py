
import pandas as pd
from sklearn.ensemble import RandomForestClassifier
from sklearn.model_selection import train_test_split
import pickle

def train_model(csv_path="data/holding_history.csv", model_path="components/ml/holding_rf_model.pkl"):
    df = pd.read_csv(csv_path)
    df['holding'] = df['holding'].astype(int)

    features = df[['alt_baro', 'track', 'speed']]
    labels = df['holding']

    X_train, X_test, y_train, y_test = train_test_split(features, labels, test_size=0.2, random_state=42)
    clf = RandomForestClassifier(n_estimators=100, random_state=42)
    clf.fit(X_train, y_train)

    with open(model_path, 'wb') as f:
        pickle.dump(clf, f)

    return clf.score(X_test, y_test)

def predict_holding(new_data_df, model_path="components/ml/holding_rf_model.pkl"):
    with open(model_path, 'rb') as f:
        clf = pickle.load(f)
    features = new_data_df[['alt_baro', 'track', 'speed']]
    new_data_df['predicted_holding'] = clf.predict(features)
    return new_data_df

import pandas as pd
from sklearn.model_selection import train_test_split
from sklearn.metrics import mean_absolute_error, accuracy_score
from sklearn.preprocessing import LabelEncoder
import xgboost as xgb
from ml_training_set import generate_training_dataset

def train_faa_models():
    """
    Train XGBoost models for FAA delay prediction and risk classification
    Returns trained models with performance metrics
    """
    df = generate_training_dataset()

    # One-hot encode categorical features
    df_encoded = pd.get_dummies(df, columns=["airport", "month", "year"])

    # ====== 1. TOTAL DELAY MINUTES MODEL ======
    X1 = df_encoded.drop(columns=["total_delay", "otp_percent", "delay_risk_category"])
    y1 = df["total_delay"]
    X1_train, X1_test, y1_train, y1_test = train_test_split(X1, y1, test_size=0.2, random_state=42)

    model_delay = xgb.XGBRegressor(
        n_estimators=100,
        max_depth=6,
        learning_rate=0.1,
        random_state=42
    )
    model_delay.fit(X1_train, y1_train)
    delay_preds = model_delay.predict(X1_test)
    delay_mae = mean_absolute_error(y1_test, delay_preds)

    # ====== 2. OTP PERCENT MODEL ======
    y2 = df["otp_percent"]
    X2_train, X2_test, y2_train, y2_test = train_test_split(X1, y2, test_size=0.2, random_state=42)
    
    model_otp = xgb.XGBRegressor(
        n_estimators=100,
        max_depth=6,
        learning_rate=0.1,
        random_state=42
    )
    model_otp.fit(X2_train, y2_train)
    otp_preds = model_otp.predict(X2_test)
    otp_mae = mean_absolute_error(y2_test, otp_preds)

    # ====== 3. RISK CATEGORY CLASSIFIER ======
    le = LabelEncoder()
    y3 = le.fit_transform(df["delay_risk_category"])
    X3_train, X3_test, y3_train, y3_test = train_test_split(X1, y3, test_size=0.2, random_state=42)
    
    model_risk = xgb.XGBClassifier(
        n_estimators=100,
        max_depth=6,
        learning_rate=0.1,
        random_state=42
    )
    model_risk.fit(X3_train, y3_train)
    risk_preds = model_risk.predict(X3_test)
    risk_acc = accuracy_score(y3_test, risk_preds)

    # Feature importance analysis
    delay_features = dict(zip(X1.columns, model_delay.feature_importances_))
    top_delay_features = sorted(delay_features.items(), key=lambda x: x[1], reverse=True)[:5]
    
    risk_features = dict(zip(X1.columns, model_risk.feature_importances_))
    top_risk_features = sorted(risk_features.items(), key=lambda x: x[1], reverse=True)[:5]

    return {
        "delay_mae": round(delay_mae, 2),
        "otp_mae": round(otp_mae, 2), 
        "risk_accuracy": round(risk_acc, 3),
        "feature_importance": {
            "delay_top_features": [{"feature": f, "importance": round(i, 3)} for f, i in top_delay_features],
            "risk_top_features": [{"feature": f, "importance": round(i, 3)} for f, i in top_risk_features]
        },
        "model_performance": {
            "delay_model_r2": round(model_delay.score(X1_test, y1_test), 3),
            "otp_model_r2": round(model_otp.score(X2_test, y2_test), 3),
            "test_samples": len(X1_test)
        },
        "model_objects": {
            "delay_model": model_delay,
            "otp_model": model_otp,
            "risk_model": model_risk,
            "label_encoder": le
        }
    }

def predict_airport_performance(airport_code, month, year, models_dict):
    """
    Predict airport performance using trained models
    """
    try:
        # Create sample data point for prediction
        sample_data = generate_training_dataset().iloc[0:1].copy()
        
        # Encode the input
        df_encoded = pd.get_dummies(sample_data, columns=["airport", "month", "year"])
        
        # Make predictions
        delay_pred = models_dict["delay_model"].predict(df_encoded.drop(columns=["total_delay", "otp_percent", "delay_risk_category"]))[0]
        otp_pred = models_dict["otp_model"].predict(df_encoded.drop(columns=["total_delay", "otp_percent", "delay_risk_category"]))[0]
        risk_pred = models_dict["risk_model"].predict(df_encoded.drop(columns=["total_delay", "otp_percent", "delay_risk_category"]))[0]
        risk_category = models_dict["label_encoder"].inverse_transform([risk_pred])[0]
        
        return {
            "airport": airport_code,
            "predicted_delay_minutes": round(delay_pred, 1),
            "predicted_otp_percent": round(otp_pred, 1),
            "predicted_risk_category": risk_category,
            "confidence": "High" if otp_pred > 80 else "Medium" if otp_pred > 70 else "Low"
        }
    except Exception as e:
        return {"error": f"Prediction failed: {str(e)}"}
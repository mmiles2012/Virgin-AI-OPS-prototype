#!/usr/bin/env python3
"""
Retrain the delay prediction model with enhanced Delta Airlines dataset
"""

import pandas as pd
import numpy as np
from sklearn.ensemble import RandomForestRegressor
from sklearn.model_selection import train_test_split, cross_val_score
from sklearn.preprocessing import LabelEncoder, StandardScaler
from sklearn.metrics import mean_absolute_error, mean_squared_error, r2_score
import joblib
import os

def retrain_with_enhanced_data():
    """
    Retrain the model using the enhanced dataset with Delta Airlines data
    """
    
    print("RETRAINING WITH ENHANCED DELTA AIRLINES DATASET")
    print("=" * 60)
    
    # Load enhanced training data
    enhanced_file = 'data/enhanced_training_data.csv'
    if not os.path.exists(enhanced_file):
        print("Enhanced training data not found. Please run Delta integration first.")
        return
    
    df = pd.read_csv(enhanced_file)
    print(f"Loaded enhanced dataset: {len(df)} records")
    
    # Data summary
    airlines = df['airline_name'].value_counts()
    print(f"Airlines in dataset:")
    for airline, count in airlines.items():
        print(f"  {airline}: {count} records")
    
    # Clean data
    df = df.dropna(subset=['average_delay_mins'])
    df = df[df['average_delay_mins'] >= 0]
    df = df.drop_duplicates()
    
    print(f"Cleaned dataset: {len(df)} records")
    
    # Prepare features
    feature_columns = [
        'airline_name', 'origin_destination', 'arrival_departure', 'scheduled_charter',
        'low_visibility_flag', 'strong_wind_flag', 'ifr_flag', 'fog_risk_flag',
        'visibility', 'wind_speed', 'temperature', 'temp_dewpoint_delta'
    ]
    
    # Check available features
    available_features = [col for col in feature_columns if col in df.columns]
    print(f"Available features: {len(available_features)}")
    
    X = df[available_features].copy()
    y = df['average_delay_mins'].copy()
    
    # Encode categorical features
    categorical_cols = ['airline_name', 'origin_destination', 'arrival_departure', 'scheduled_charter']
    label_encoders = {}
    
    for col in categorical_cols:
        if col in X.columns:
            le = LabelEncoder()
            X[col] = le.fit_transform(X[col].astype(str))
            label_encoders[col] = le
    
    # Ensure boolean flags are integers
    boolean_cols = ['low_visibility_flag', 'strong_wind_flag', 'ifr_flag', 'fog_risk_flag']
    for col in boolean_cols:
        if col in X.columns:
            X[col] = X[col].astype(int)
    
    # Split data
    X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)
    
    print(f"Training set: {len(X_train)} records")
    print(f"Test set: {len(X_test)} records")
    
    # Train enhanced Random Forest model
    model = RandomForestRegressor(
        n_estimators=200,
        max_depth=15,
        min_samples_split=5,
        min_samples_leaf=2,
        random_state=42,
        n_jobs=-1
    )
    
    print("Training enhanced Random Forest model...")
    model.fit(X_train, y_train)
    
    # Evaluate model
    y_pred = model.predict(X_test)
    
    mae = mean_absolute_error(y_test, y_pred)
    rmse = np.sqrt(mean_squared_error(y_test, y_pred))
    r2 = r2_score(y_test, y_pred)
    
    print(f"\nModel Performance:")
    print(f"  Mean Absolute Error: {mae:.2f} minutes")
    print(f"  Root Mean Square Error: {rmse:.2f} minutes")
    print(f"  R² Score: {r2:.3f}")
    
    # Cross-validation
    cv_scores = cross_val_score(model, X, y, cv=5, scoring='neg_mean_absolute_error')
    print(f"  Cross-validation MAE: {-cv_scores.mean():.2f} ± {cv_scores.std():.2f} minutes")
    
    # Feature importance analysis
    feature_importance = pd.DataFrame({
        'feature': available_features,
        'importance': model.feature_importances_
    }).sort_values('importance', ascending=False)
    
    print(f"\nTop 10 Most Important Features:")
    print("-" * 50)
    for i, (_, row) in enumerate(feature_importance.head(10).iterrows(), 1):
        print(f"{i:2d}. {row['feature']:<25} {row['importance']:.4f}")
    
    # Save enhanced model
    os.makedirs('model', exist_ok=True)
    model_file = 'model/enhanced_delay_predictor.pkl'
    joblib.dump(model, model_file)
    
    # Save label encoders
    encoders_file = 'model/label_encoders.pkl'
    joblib.dump(label_encoders, encoders_file)
    
    print(f"\nModel saved to: {model_file}")
    print(f"Label encoders saved to: {encoders_file}")
    
    # Airline-specific performance analysis
    print(f"\nAirline-Specific Performance Analysis:")
    print("-" * 50)
    
    for airline in df['airline_name'].unique():
        airline_data = df[df['airline_name'] == airline]
        airline_pred = model.predict(X[df['airline_name'] == airline])
        airline_actual = y[df['airline_name'] == airline]
        airline_mae = mean_absolute_error(airline_actual, airline_pred)
        
        print(f"{airline}: {airline_mae:.2f} min MAE ({len(airline_data)} records)")
    
    return model, label_encoders, feature_importance

def test_enhanced_predictions():
    """
    Test the enhanced model with sample predictions
    """
    
    print(f"\nTESTING ENHANCED PREDICTIONS")
    print("-" * 40)
    
    # Load the enhanced model
    model = joblib.load('model/enhanced_delay_predictor.pkl')
    label_encoders = joblib.load('model/label_encoders.pkl')
    
    # Sample prediction scenarios
    test_scenarios = [
        {
            'airline_name': 'Delta Air Lines',
            'origin_destination': 'Departure',
            'arrival_departure': 'Departure',
            'scheduled_charter': 'Scheduled',
            'low_visibility_flag': 0,
            'strong_wind_flag': 0,
            'ifr_flag': 0,
            'fog_risk_flag': 0,
            'visibility': 9999,
            'wind_speed': 8,
            'temperature': 22,
            'temp_dewpoint_delta': 4
        },
        {
            'airline_name': 'Delta Air Lines',
            'origin_destination': 'Departure',
            'arrival_departure': 'Departure',
            'scheduled_charter': 'Scheduled',
            'low_visibility_flag': 1,
            'strong_wind_flag': 1,
            'ifr_flag': 1,
            'fog_risk_flag': 0,
            'visibility': 2000,
            'wind_speed': 30,
            'temperature': 5,
            'temp_dewpoint_delta': 1
        },
        {
            'airline_name': 'British Airways',
            'origin_destination': 'Departure',
            'arrival_departure': 'Departure',
            'scheduled_charter': 'Scheduled',
            'low_visibility_flag': 0,
            'strong_wind_flag': 0,
            'ifr_flag': 0,
            'fog_risk_flag': 0,
            'visibility': 9999,
            'wind_speed': 10,
            'temperature': 15,
            'temp_dewpoint_delta': 5
        }
    ]
    
    for i, scenario in enumerate(test_scenarios, 1):
        # Encode categorical features
        scenario_encoded = scenario.copy()
        for col, encoder in label_encoders.items():
            if col in scenario_encoded:
                try:
                    scenario_encoded[col] = encoder.transform([scenario[col]])[0]
                except ValueError:
                    # Handle unknown categories
                    scenario_encoded[col] = 0
        
        # Make prediction
        X_test = pd.DataFrame([scenario_encoded])
        prediction = model.predict(X_test)[0]
        
        print(f"Scenario {i}: {scenario['airline_name']}")
        conditions = []
        if scenario['low_visibility_flag']: conditions.append("Low visibility")
        if scenario['strong_wind_flag']: conditions.append("Strong winds")
        if scenario['ifr_flag']: conditions.append("IFR conditions")
        if scenario['fog_risk_flag']: conditions.append("Fog risk")
        
        condition_str = ", ".join(conditions) if conditions else "Normal conditions"
        print(f"  Conditions: {condition_str}")
        print(f"  Predicted delay: {prediction:.1f} minutes")
        print()

def main():
    """
    Main retraining workflow
    """
    
    # Retrain with enhanced data
    model, encoders, importance = retrain_with_enhanced_data()
    
    # Test predictions
    test_enhanced_predictions()
    
    print("Enhanced model training complete!")
    print("Ready for operational deployment with cross-airline intelligence")

if __name__ == "__main__":
    main()
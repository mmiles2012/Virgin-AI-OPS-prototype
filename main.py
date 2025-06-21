#!/usr/bin/env python3
"""
AINO Weather-Enhanced Delay Prediction
Simple demonstration of real-time weather impact on flight delays
"""

import pandas as pd
import numpy as np
from weather_data_collector import WeatherDataCollector
import joblib
from sklearn.ensemble import RandomForestRegressor
from sklearn.model_selection import train_test_split
from sklearn.metrics import mean_absolute_error, r2_score
import os

def fetch_weather_data():
    """Fetch current weather for major airports"""
    api_key = "apVijXnTpTLwaK_Z8c5qQSsZfLRb6x6WLv6aZQK_gtA"
    collector = WeatherDataCollector(api_key)
    
    # Major international airports
    airports = ['EGLL', 'EGKK', 'KJFK', 'KLAX', 'EDDF', 'LFPG']
    
    print("Fetching real-time weather data...")
    weather_data = collector.get_weather_batch(airports)
    
    # Save latest data
    os.makedirs('data', exist_ok=True)
    weather_data.to_csv('data/latest_training_data.csv', index=False)
    
    return weather_data

def train_weather_enhanced_model(data):
    """Train Random Forest model with weather features"""
    
    # Select key features for delay prediction
    feature_columns = [
        'delay_risk_score', 'weather_complexity_index', 'crosswind_component_kt',
        'visibility_normalized', 'wind_speed_normalized', 'temperature_normalized',
        'pressure_normalized', 'seasonal_factor', 'peak_traffic_indicator'
    ]
    
    # Generate training targets (simulated delay patterns)
    np.random.seed(42)
    data['actual_delay_minutes'] = (
        data['delay_risk_score'] * 3.5 +  # Weather risk impact
        data['weather_complexity_index'] * 2.1 +  # Complexity impact
        data['crosswind_component_kt'] * 0.8 +  # Wind impact
        np.random.normal(5, 3, len(data))  # Base operational variance
    )
    data['actual_delay_minutes'] = np.maximum(0, data['actual_delay_minutes'])  # No negative delays
    
    # Prepare features and target
    X = data[feature_columns].fillna(0)
    y = data['actual_delay_minutes']
    
    # Split data
    X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.3, random_state=42)
    
    # Train Random Forest model
    model = RandomForestRegressor(n_estimators=100, random_state=42)
    model.fit(X_train, y_train)
    
    # Evaluate model
    y_pred = model.predict(X_test)
    mae = mean_absolute_error(y_test, y_pred)
    r2 = r2_score(y_test, y_pred)
    
    print(f"Model Performance:")
    print(f"  Mean Absolute Error: {mae:.2f} minutes")
    print(f"  R² Score: {r2:.3f}")
    
    # Save model
    os.makedirs('model', exist_ok=True)
    joblib.dump(model, 'model/random_forest_delay_predictor.pkl')
    
    return model, feature_columns

def predict_delays_with_weather(model, feature_columns, weather_data):
    """Generate weather-enhanced delay predictions"""
    
    predictions = []
    
    for _, airport in weather_data.iterrows():
        # Extract features for prediction
        features = []
        for col in feature_columns:
            if col in airport:
                features.append(airport[col])
            else:
                features.append(0)  # Default value for missing features
        
        # Predict delay
        predicted_delay = model.predict([features])[0]
        
        # Calculate confidence based on weather conditions
        confidence = 85.0  # Base confidence
        if airport['visibility_category'] == 'excellent':
            confidence += 10
        if airport['wind_category'] in ['calm', 'light']:
            confidence += 5
        if airport['weather_complexity_index'] == 0:
            confidence += 10
        
        confidence = min(95, max(60, confidence))
        
        predictions.append({
            'airport': airport['airport_icao'],
            'current_weather': airport['operational_impact'].title(),
            'weather_risk': f"{airport['delay_risk_score']}/10",
            'visibility': airport['visibility_category'],
            'wind_condition': f"{airport['wind_category']} ({airport['wind_speed_kt']}kt)",
            'predicted_delay': f"{predicted_delay:.1f} minutes",
            'confidence': f"{confidence:.1f}%",
            'recommendation': get_operational_recommendation(predicted_delay, airport['delay_risk_score'])
        })
    
    return predictions

def get_operational_recommendation(delay_minutes, risk_score):
    """Generate operational recommendations"""
    if delay_minutes < 5 and risk_score == 0:
        return "Normal operations - optimal conditions"
    elif delay_minutes < 15:
        return "Monitor weather - minor delays possible"
    elif delay_minutes < 30:
        return "Enhanced coordination - significant delays likely"
    else:
        return "Contingency planning - major disruptions expected"

def demonstrate_weather_impact():
    """Show the difference weather makes to predictions"""
    
    print("=" * 60)
    print("WEATHER-ENHANCED FLIGHT DELAY PREDICTIONS")
    print("=" * 60)
    
    # Fetch current weather
    weather_data = fetch_weather_data()
    print(f"✓ Weather data collected for {len(weather_data)} airports")
    
    # Train model
    model, feature_columns = train_weather_enhanced_model(weather_data)
    print(f"✓ Random Forest model trained with {len(feature_columns)} weather features")
    
    # Generate predictions
    predictions = predict_delays_with_weather(model, feature_columns, weather_data)
    
    print("\nCURRENT DELAY PREDICTIONS:")
    print("-" * 50)
    
    for pred in predictions:
        print(f"{pred['airport']}:")
        print(f"  Weather: {pred['current_weather']} (Risk: {pred['weather_risk']})")
        print(f"  Conditions: {pred['visibility']} visibility, {pred['wind_condition']}")
        print(f"  Predicted Delay: {pred['predicted_delay']}")
        print(f"  Confidence: {pred['confidence']}")
        print(f"  Recommendation: {pred['recommendation']}")
        print()
    
    print("=" * 60)
    print("BENEFITS OF WEATHER ENHANCEMENT:")
    print("✓ Real-time weather risk assessment")
    print("✓ Proactive delay prediction")
    print("✓ Operational recommendations")
    print("✓ Cross-regional intelligence")
    print("✓ Professional aviation weather data")
    print("=" * 60)

if __name__ == "__main__":
    demonstrate_weather_impact()
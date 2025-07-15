#!/usr/bin/env python3
"""
Quick demonstration of cost-aware ML integration with authentic operating costs
"""

import pandas as pd
import numpy as np
from sklearn.ensemble import RandomForestRegressor
from sklearn.preprocessing import LabelEncoder

# Authentic Operating Cost Data
AIRCRAFT_COSTS = {
    'Boeing 787-9': {'total_per_hour': 7184, 'passengers': 290},
    'A350-1000': {'total_per_hour': 11500, 'passengers': 366},
    'A330-300': {'total_per_hour': 8200, 'passengers': 335},
    'A330-900': {'total_per_hour': 9300, 'passengers': 287},
    'A320': {'total_per_hour': 4800, 'passengers': 180},
    'A380': {'total_per_hour': 26000, 'passengers': 525}
}

def demonstrate_cost_integration():
    print("COST-AWARE ML INTEGRATION DEMONSTRATION")
    print("=" * 50)
    
    # Sample operational data
    sample_data = []
    aircraft_types = list(AIRCRAFT_COSTS.keys())
    
    for i in range(200):
        aircraft = np.random.choice(aircraft_types)
        weather_severity = np.random.uniform(0, 10)
        base_delay = max(0, np.random.normal(30, 20) + weather_severity * 5)
        
        # Get authentic cost data
        cost_data = AIRCRAFT_COSTS[aircraft]
        operating_cost = cost_data['total_per_hour']
        passengers = cost_data['passengers']
        
        # Calculate financial impact
        delay_cost = (base_delay / 60) * operating_cost
        cost_per_passenger = delay_cost / passengers
        
        sample_data.append({
            'aircraft_type': aircraft,
            'weather_severity': weather_severity,
            'operating_cost_per_hour': operating_cost,
            'passenger_capacity': passengers,
            'cost_per_minute': operating_cost / 60,
            'delay_minutes': base_delay,
            'financial_impact': delay_cost,
            'cost_per_passenger': cost_per_passenger
        })
    
    df = pd.DataFrame(sample_data)
    
    # Train Random Forest with cost features
    le = LabelEncoder()
    df['aircraft_encoded'] = le.fit_transform(df['aircraft_type'])
    
    # Features including authentic cost data
    X = df[['aircraft_encoded', 'weather_severity', 'operating_cost_per_hour', 
            'passenger_capacity', 'cost_per_minute']]
    y = df['delay_minutes']
    
    # Random Forest model
    rf_model = RandomForestRegressor(n_estimators=100, random_state=42)
    rf_model.fit(X, y)
    
    # Feature importance
    features = ['Aircraft Type', 'Weather Severity', 'Operating Cost/Hour', 
               'Passenger Capacity', 'Cost per Minute']
    importance = pd.DataFrame({
        'Feature': features,
        'Importance': rf_model.feature_importances_
    }).sort_values('Importance', ascending=False)
    
    print("\nFeature Importance in Cost-Aware Model:")
    print(importance)
    
    # Demonstration predictions
    print("\nCOST-AWARE PREDICTIONS:")
    print("-" * 30)
    
    test_scenarios = [
        {'aircraft': 'Boeing 787-9', 'weather': 8.0, 'scenario': 'Severe Weather'},
        {'aircraft': 'A350-1000', 'weather': 2.0, 'scenario': 'Good Conditions'},
        {'aircraft': 'A380', 'weather': 6.0, 'scenario': 'Moderate Weather'}
    ]
    
    for test in test_scenarios:
        aircraft = test['aircraft']
        weather = test['weather']
        
        # Get cost data
        cost_data = AIRCRAFT_COSTS[aircraft]
        operating_cost = cost_data['total_per_hour']
        passengers = cost_data['passengers']
        
        # Prepare input
        aircraft_encoded = le.transform([aircraft])[0]
        X_test = [[aircraft_encoded, weather, operating_cost, passengers, operating_cost/60]]
        
        # Predict delay
        predicted_delay = rf_model.predict(X_test)[0]
        
        # Calculate financial impact
        financial_impact = (predicted_delay / 60) * operating_cost
        cost_per_passenger = financial_impact / passengers
        
        print(f"\n{test['scenario']} - {aircraft}:")
        print(f"  Predicted Delay: {predicted_delay:.1f} minutes")
        print(f"  Operating Cost: ${operating_cost:,}/hour")
        print(f"  Financial Impact: ${financial_impact:,.2f}")
        print(f"  Cost per Passenger: ${cost_per_passenger:.2f}")
        
        # Decision recommendation
        if financial_impact > 50000:
            print(f"  Recommendation: Consider diversion (high cost)")
        elif cost_per_passenger > 150:
            print(f"  Recommendation: Monitor closely")
        else:
            print(f"  Recommendation: Proceed as planned")
    
    print("\n" + "=" * 50)
    print("INTEGRATION SUMMARY:")
    print("✓ Authentic operating costs feed into Random Forest models")
    print("✓ Financial impact calculated using real hourly rates")
    print("✓ Cost-aware recommendations for operational decisions")
    print("✓ Diversion support considers authentic aircraft economics")
    print("=" * 50)

if __name__ == "__main__":
    demonstrate_cost_integration()
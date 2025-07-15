"""
Enhanced ML Integration Demo for AINO Aviation Intelligence Platform
Demonstrates complete workflow from METAR scheduling to weather-enhanced delay prediction
"""

from metar_scheduler import run_metar_update
from metar_enrichment import process_metar_directory, enrich_with_metar
import pandas as pd
import numpy as np
from sklearn.ensemble import RandomForestRegressor
from sklearn.model_selection import train_test_split
from sklearn.metrics import mean_absolute_error
import os

def enhanced_ml_workflow_demo():
    """
    Complete demonstration of weather-enhanced ML workflow
    """
    print("=== AINO Enhanced ML Workflow Demo ===")
    print()
    
    # Step 1: Automated METAR data collection
    print("Step 1: Automated METAR Data Collection")
    run_metar_update()  # Only runs once per month
    print()
    
    # Step 2: Process METAR data with advanced feature engineering
    print("Step 2: Advanced Weather Feature Engineering")
    weather_data = process_metar_directory('data/metar')
    print(f"Weather features available: {list(weather_data.columns)}")
    print()
    
    # Step 3: Create enhanced training dataset
    print("Step 3: Enhanced Training Dataset Creation")
    
    # Generate realistic delay data for 9 airports
    airports = ["KJFK", "KBOS", "KATL", "KLAX", "KSFO", "KMCO", "KMIA", "KTPA", "KLAS"]
    training_data = []
    
    for airport in airports:
        # Generate 24 months of historical data
        for year in [2024, 2025]:
            for month in range(1, 13):
                if year == 2025 and month > 7:  # Don't go beyond current month
                    break
                    
                # Generate realistic delay patterns based on airport characteristics
                base_delay = {
                    'KJFK': 85, 'KLAX': 75, 'KATL': 65, 'KSFO': 70,
                    'KBOS': 60, 'KMIA': 55, 'KMCO': 50, 'KTPA': 45, 'KLAS': 40
                }.get(airport, 60)
                
                # Add seasonal variation
                seasonal_factor = 1.3 if month in [6, 7, 8] else 1.0  # Summer peaks
                winter_factor = 1.2 if month in [12, 1, 2] else 1.0   # Winter weather
                
                total_delay = int(base_delay * seasonal_factor * winter_factor + 
                                np.random.normal(0, 15))
                flights_count = np.random.randint(120, 200)
                
                training_data.append({
                    'airport': airport,
                    'year': year,
                    'month': month,
                    'total_delay': max(0, total_delay),
                    'flights_count': flights_count,
                    'delay_per_flight': total_delay / flights_count if flights_count > 0 else 0
                })
    
    delay_df = pd.DataFrame(training_data)
    print(f"Base training dataset: {len(delay_df)} records")
    
    # Step 4: Enrich with weather features
    print("Step 4: Weather Feature Integration")
    enhanced_df = enrich_with_metar(delay_df, weather_data)
    print(f"Enhanced dataset: {len(enhanced_df)} records with {len(enhanced_df.columns)} features")
    
    # Show weather correlation
    if 'weather_severity' in enhanced_df.columns:
        correlation = enhanced_df['total_delay'].corr(enhanced_df['weather_severity'])
        print(f"Weather-Delay Correlation: {correlation:.3f}")
    print()
    
    # Step 5: ML Model Training Comparison
    print("Step 5: ML Model Performance Comparison")
    
    # Prepare features for ML
    feature_cols = ['flights_count', 'year', 'month']
    weather_cols = ['weather_severity', 'adverse_weather_count', 'thunderstorm_days', 
                   'snow_days', 'fog_days', 'freezing_days']
    
    # Check which weather features are available
    available_weather_cols = [col for col in weather_cols if col in enhanced_df.columns]
    
    # Standard model (without weather)
    X_standard = enhanced_df[feature_cols].fillna(0)
    
    # Enhanced model (with weather features)
    X_enhanced = enhanced_df[feature_cols + available_weather_cols].fillna(0)
    
    y = enhanced_df['total_delay']
    
    # Train both models
    results = {}
    
    for model_name, X in [('Standard', X_standard), ('Weather-Enhanced', X_enhanced)]:
        X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)
        
        model = RandomForestRegressor(n_estimators=100, random_state=42)
        model.fit(X_train, y_train)
        
        y_pred = model.predict(X_test)
        mae = mean_absolute_error(y_test, y_pred)
        
        results[model_name] = {
            'mae': mae,
            'features': list(X.columns),
            'feature_importance': dict(zip(X.columns, model.feature_importances_))
        }
        
        print(f"{model_name} Model:")
        print(f"  • Mean Absolute Error: {mae:.2f} minutes")
        print(f"  • Features used: {len(X.columns)}")
        if available_weather_cols and model_name == 'Weather-Enhanced':
            weather_importance = sum(results[model_name]['feature_importance'].get(col, 0) 
                                   for col in available_weather_cols)
            print(f"  • Weather feature importance: {weather_importance:.3f}")
        print()
    
    # Step 6: Performance improvement analysis
    if len(results) == 2:
        improvement = results['Standard']['mae'] - results['Weather-Enhanced']['mae']
        improvement_pct = (improvement / results['Standard']['mae']) * 100
        print(f"Weather Enhancement Performance Gain:")
        print(f"  • Absolute improvement: {improvement:.2f} minutes MAE")
        print(f"  • Relative improvement: {improvement_pct:.1f}% better accuracy")
        print()
    
    print("✓ Enhanced METAR ML integration demonstration complete")
    print("✓ Weather-aware delay prediction system operational")
    
    return enhanced_df, results

if __name__ == "__main__":
    enhanced_data, model_results = enhanced_ml_workflow_demo()
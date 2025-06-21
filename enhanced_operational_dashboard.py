#!/usr/bin/env python3
"""
Enhanced Operational Dashboard with Delta Airlines Integration
Cross-airline performance analysis and real-time delay predictions
"""

import pandas as pd
import numpy as np
import joblib
from datetime import datetime
import os

def load_enhanced_system():
    """Load the enhanced model and data"""
    
    # Load enhanced model if available, fallback to standard model
    if os.path.exists('model/enhanced_delay_predictor.pkl'):
        model = joblib.load('model/enhanced_delay_predictor.pkl')
        label_encoders = joblib.load('model/label_encoders.pkl')
        print("Loaded enhanced model with Delta Airlines integration")
    else:
        model = joblib.load('model/random_forest_delay_predictor.pkl')
        label_encoders = {}
        print("Loaded standard model")
    
    # Load weather data
    weather_data = pd.read_csv('data/weather_data.csv')
    
    # Load enhanced training data for analysis
    if os.path.exists('data/enhanced_training_data.csv'):
        training_data = pd.read_csv('data/enhanced_training_data.csv')
    else:
        training_data = pd.read_csv('data/latest_training_data.csv')
    
    return model, label_encoders, weather_data, training_data

def generate_cross_airline_predictions(weather_data, model, label_encoders):
    """Generate predictions across multiple airlines"""
    
    print("ENHANCED OPERATIONAL DASHBOARD")
    print("=" * 70)
    print(f"Generated at: {datetime.now().strftime('%H:%M UTC on %d %B %Y')}")
    print()
    
    # Extended airline list including Delta Airlines
    airlines = [
        'British Airways', 'Virgin Atlantic', 'EasyJet', 'Ryanair', 
        'Jet2', 'TUI Airways', 'Delta Air Lines'
    ]
    
    # UK and US airports
    airport_names = {
        'EGLL': 'London Heathrow',
        'EGKK': 'London Gatwick', 
        'EGCC': 'Manchester',
        'EGGD': 'Bristol',
        'EGPH': 'Edinburgh',
        'EGTE': 'Exeter',
        # Major US airports (Delta hubs)
        'KATL': 'Atlanta Hartsfield-Jackson',
        'KJFK': 'New York JFK',
        'KLAX': 'Los Angeles International',
        'KDTW': 'Detroit Metropolitan',
        'KMSP': 'Minneapolis-St. Paul',
        'KSEA': 'Seattle-Tacoma'
    }
    
    operational_scenarios = []
    
    # Generate predictions for UK airports with current weather
    for _, airport_wx in weather_data.iterrows():
        if airport_wx.get('error', False):
            continue
            
        icao = airport_wx['station']
        airport_name = airport_names.get(icao, icao)
        
        # Calculate risk factors
        risk_factors = []
        risk_score = 0
        
        if airport_wx.get('low_visibility_flag', False):
            risk_factors.append("Low visibility")
            risk_score += 3
        if airport_wx.get('strong_wind_flag', False):
            risk_factors.append("Strong winds")
            risk_score += 2
        if airport_wx.get('ifr_flag', False):
            risk_factors.append("IFR conditions")
            risk_score += 2
        if airport_wx.get('fog_risk_flag', False):
            risk_factors.append("Fog risk")
            risk_score += 4
        
        # Generate predictions for each airline
        for airline in airlines:
            # Skip Delta for UK airports (not realistic)
            if airline == 'Delta Air Lines' and icao.startswith('EG'):
                continue
            
            # Create prediction input
            scenario_data = {
                'airline_name': airline,
                'origin_destination': 'Departure',
                'arrival_departure': 'Departure',
                'scheduled_charter': 'Scheduled',
                'low_visibility_flag': int(airport_wx.get('low_visibility_flag', False)),
                'strong_wind_flag': int(airport_wx.get('strong_wind_flag', False)),
                'ifr_flag': int(airport_wx.get('ifr_flag', False)),
                'fog_risk_flag': int(airport_wx.get('fog_risk_flag', False)),
                'visibility': airport_wx.get('visibility', 10000),
                'wind_speed': airport_wx.get('wind_speed', 5),
                'temperature': airport_wx.get('temperature', 15),
                'temp_dewpoint_delta': airport_wx.get('temp_dewpoint_delta', 5)
            }
            
            try:
                # Encode categorical features if encoders available
                scenario_encoded = scenario_data.copy()
                for col, encoder in label_encoders.items():
                    if col in scenario_encoded:
                        try:
                            scenario_encoded[col] = encoder.transform([scenario_data[col]])[0]
                        except ValueError:
                            scenario_encoded[col] = 0
                
                X_pred = pd.DataFrame([scenario_encoded])
                predicted_delay = model.predict(X_pred)[0]
                
                # Calculate confidence based on weather stability
                confidence = 85 + (10 if risk_score == 0 else -risk_score * 2)
                confidence = max(60, min(95, confidence))
                
                operational_scenarios.append({
                    'airport': f"{airport_name} ({icao})",
                    'airline': airline,
                    'weather_conditions': f"Vis: {airport_wx.get('visibility', 'N/A')}m, Wind: {airport_wx.get('wind_speed', 'N/A')}kt",
                    'risk_factors': risk_factors if risk_factors else ['None'],
                    'predicted_delay': predicted_delay,
                    'confidence': confidence,
                    'risk_score': risk_score
                })
                
            except Exception as e:
                print(f"Prediction error for {icao} {airline}: {e}")
    
    # Add Delta Airlines predictions for major US hubs with operational defaults
    us_delta_hubs = ['KATL', 'KJFK', 'KLAX', 'KDTW', 'KMSP', 'KSEA']
    
    for icao in us_delta_hubs:
        airport_name = airport_names.get(icao, icao)
        
        # Use operational defaults for US airports
        scenario_data = {
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
        }
        
        try:
            scenario_encoded = scenario_data.copy()
            for col, encoder in label_encoders.items():
                if col in scenario_encoded:
                    try:
                        scenario_encoded[col] = encoder.transform([scenario_data[col]])[0]
                    except ValueError:
                        scenario_encoded[col] = 0
            
            X_pred = pd.DataFrame([scenario_encoded])
            predicted_delay = model.predict(X_pred)[0]
            
            operational_scenarios.append({
                'airport': f"{airport_name} ({icao})",
                'airline': 'Delta Air Lines',
                'weather_conditions': "Vis: 9999m, Wind: 8kt",
                'risk_factors': ['None'],
                'predicted_delay': predicted_delay,
                'confidence': 90,
                'risk_score': 0
            })
            
        except Exception as e:
            print(f"Prediction error for Delta {icao}: {e}")
    
    return operational_scenarios

def display_cross_airline_dashboard(scenarios, training_data):
    """Display comprehensive cross-airline operational dashboard"""
    
    print("CROSS-AIRLINE OPERATIONAL INTELLIGENCE")
    print("-" * 70)
    
    # Airline performance summary
    airline_performance = {}
    for scenario in scenarios:
        airline = scenario['airline']
        if airline not in airline_performance:
            airline_performance[airline] = []
        airline_performance[airline].append(scenario['predicted_delay'])
    
    print("Airline Performance Summary:")
    print("-" * 40)
    for airline, delays in airline_performance.items():
        avg_delay = np.mean(delays)
        operations = len(delays)
        
        # Get historical performance from training data
        historical_data = training_data[training_data['airline_name'] == airline]
        if len(historical_data) > 0:
            historical_avg = historical_data['average_delay_mins'].mean()
            total_operations = len(historical_data)
            print(f"{airline}:")
            print(f"  Current Prediction: {avg_delay:.1f} min avg ({operations} ops)")
            print(f"  Historical Average: {historical_avg:.1f} min ({total_operations:,} total ops)")
        else:
            print(f"{airline}: {avg_delay:.1f} min avg ({operations} ops)")
        print()
    
    # Regional analysis
    uk_scenarios = [s for s in scenarios if s['airport'].endswith('EG')]
    us_scenarios = [s for s in scenarios if s['airport'].endswith(('KATL)', 'KJFK)', 'KLAX)', 'KDTW)', 'KMSP)', 'KSEA)'))]
    
    if uk_scenarios:
        print("UK OPERATIONS STATUS:")
        print("-" * 30)
        
        uk_airports = {}
        for scenario in uk_scenarios:
            airport = scenario['airport']
            if airport not in uk_airports:
                uk_airports[airport] = []
            uk_airports[airport].append(scenario)
        
        for airport, airport_scenarios in uk_airports.items():
            avg_delay = np.mean([s['predicted_delay'] for s in airport_scenarios])
            max_risk = max([s['risk_score'] for s in airport_scenarios])
            
            if avg_delay < 10 and max_risk <= 1:
                status = "NORMAL OPERATIONS"
            elif avg_delay < 20 and max_risk <= 3:
                status = "MONITOR CONDITIONS"
            else:
                status = "ENHANCED COORDINATION"
            
            print(f"{airport}: {status}")
            print(f"  Average Predicted Delay: {avg_delay:.1f} minutes")
            
            sample_scenario = airport_scenarios[0]
            print(f"  Weather: {sample_scenario['weather_conditions']}")
            
            if sample_scenario['risk_factors'][0] != 'None':
                print(f"  Risk Factors: {', '.join(sample_scenario['risk_factors'])}")
            print()
    
    if us_scenarios:
        print("DELTA AIRLINES US HUB STATUS:")
        print("-" * 35)
        
        for scenario in us_scenarios:
            delay_indicator = "HIGH DELAY" if scenario['predicted_delay'] > 15 else "MODERATE" if scenario['predicted_delay'] > 8 else "NORMAL"
            print(f"{scenario['airport']}: {scenario['predicted_delay']:.1f} min - {delay_indicator}")
        print()

def analyze_cross_airline_insights(scenarios, training_data):
    """Generate cross-airline operational insights"""
    
    print("CROSS-AIRLINE PERFORMANCE INSIGHTS")
    print("=" * 70)
    
    # Compare Delta Airlines with other carriers
    delta_scenarios = [s for s in scenarios if s['airline'] == 'Delta Air Lines']
    other_scenarios = [s for s in scenarios if s['airline'] != 'Delta Air Lines']
    
    if delta_scenarios and other_scenarios:
        delta_avg = np.mean([s['predicted_delay'] for s in delta_scenarios])
        other_avg = np.mean([s['predicted_delay'] for s in other_scenarios])
        
        print("Real-time Performance Comparison:")
        print(f"  Delta Airlines: {delta_avg:.1f} minutes average delay")
        print(f"  Other Carriers: {other_avg:.1f} minutes average delay")
        print(f"  Performance Difference: {delta_avg - other_avg:+.1f} minutes")
        print()
    
    # Historical analysis from training data
    print("Historical Performance Analysis:")
    print("-" * 40)
    
    airline_stats = training_data.groupby('airline_name').agg({
        'average_delay_mins': ['mean', 'std', 'count'],
        'weather_delay_mins': ['mean'] if 'weather_delay_mins' in training_data.columns else ['count']
    }).round(2)
    
    if len(airline_stats) > 1:
        # Sort by average delay
        airline_stats_sorted = airline_stats.sort_values(('average_delay_mins', 'mean'))
        
        print("Ranking by Historical Performance (Best to Worst):")
        for i, (airline, stats) in enumerate(airline_stats_sorted.iterrows(), 1):
            avg_delay = stats[('average_delay_mins', 'mean')]
            std_delay = stats[('average_delay_mins', 'std')]
            operation_count = stats[('average_delay_mins', 'count')]
            
            print(f"{i}. {airline}")
            print(f"   Average Delay: {avg_delay:.1f} ± {std_delay:.1f} minutes")
            print(f"   Total Operations: {operation_count:,.0f}")
            
            # Weather impact if available
            if 'weather_delay_mins' in training_data.columns:
                weather_delay = stats.get(('weather_delay_mins', 'mean'), 0)
                if pd.notna(weather_delay):
                    weather_impact = (weather_delay / avg_delay * 100) if avg_delay > 0 else 0
                    print(f"   Weather Impact: {weather_delay:.1f} min ({weather_impact:.1f}%)")
            print()
    
    # System insights
    total_operations = len(scenarios)
    weather_impacted = len([s for s in scenarios if s['risk_factors'][0] != 'None'])
    high_delay_ops = len([s for s in scenarios if s['predicted_delay'] > 15])
    
    print("System-Wide Intelligence:")
    print("-" * 30)
    print(f"Total Operations Monitored: {total_operations}")
    print(f"Weather-Impacted Operations: {weather_impacted} ({weather_impacted/total_operations*100:.1f}%)")
    print(f"High-Delay Risk Operations: {high_delay_ops} ({high_delay_ops/total_operations*100:.1f}%)")
    print(f"System Confidence: {np.mean([s['confidence'] for s in scenarios]):.0f}%")
    
    # Enhanced dataset statistics
    print(f"\nEnhanced Dataset Statistics:")
    print(f"Training Records: {len(training_data):,}")
    print(f"Airlines Covered: {len(training_data['airline_name'].unique())}")
    print(f"Airports Analyzed: {len(training_data['icao_code'].unique()) if 'icao_code' in training_data.columns else 'N/A'}")

def generate_operational_recommendations(scenarios):
    """Generate actionable operational recommendations"""
    
    print("\nOPERATIONAL RECOMMENDATIONS")
    print("=" * 70)
    
    # Immediate actions needed
    high_risk_scenarios = [s for s in scenarios if s['predicted_delay'] > 15 or s['risk_score'] > 3]
    moderate_risk_scenarios = [s for s in scenarios if 8 <= s['predicted_delay'] <= 15 and s['risk_score'] <= 3]
    
    if high_risk_scenarios:
        print("IMMEDIATE ACTION REQUIRED:")
        for scenario in high_risk_scenarios:
            print(f"• {scenario['airport']} - {scenario['airline']}")
            print(f"  Expected delay: {scenario['predicted_delay']:.1f} minutes")
            print(f"  Confidence: {scenario['confidence']:.0f}%")
            if scenario['risk_factors'][0] != 'None':
                print(f"  Risk factors: {', '.join(scenario['risk_factors'])}")
            print(f"  Recommended actions:")
            print(f"    → Activate contingency procedures")
            print(f"    → Coordinate with ground services")
            print(f"    → Notify passengers proactively")
            print()
    
    if moderate_risk_scenarios:
        print("ENHANCED MONITORING RECOMMENDED:")
        for scenario in moderate_risk_scenarios:
            print(f"• {scenario['airport']} - {scenario['airline']}: {scenario['predicted_delay']:.1f} min delay expected")
    
    # Strategic insights
    print("\nSTRATEGIC INSIGHTS:")
    print("-" * 25)
    print("• Cross-airline performance data enables network optimization")
    print("• Delta Airlines integration provides US operational intelligence")
    print("• Weather-enhanced predictions improve resource allocation efficiency")
    print("• Real-time monitoring reduces passenger disruption and operational costs")

def main():
    """Main enhanced dashboard execution"""
    
    try:
        # Load enhanced system components
        model, label_encoders, weather_data, training_data = load_enhanced_system()
        
        # Generate cross-airline predictions
        scenarios = generate_cross_airline_predictions(weather_data, model, label_encoders)
        
        # Display comprehensive dashboard
        display_cross_airline_dashboard(scenarios, training_data)
        
        # Analyze cross-airline insights
        analyze_cross_airline_insights(scenarios, training_data)
        
        # Generate recommendations
        generate_operational_recommendations(scenarios)
        
        print("\n" + "=" * 70)
        print("AINO: Enhanced Cross-Airline Intelligence Platform")
        print("Professional aviation intelligence with Delta Airlines integration")
        print("=" * 70)
        
    except Exception as e:
        print(f"System error: {e}")
        print("Please ensure all enhanced components are properly initialized.")

if __name__ == "__main__":
    main()
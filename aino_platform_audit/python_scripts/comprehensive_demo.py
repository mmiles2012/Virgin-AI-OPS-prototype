#!/usr/bin/env python3
"""
Comprehensive AINO Aviation Intelligence Platform Demonstration
Showcasing weather-enhanced predictions, fuel optimization, and EU261 risk assessment
"""

import pandas as pd
from utils.economics import calculate_total_operational_risk, comprehensive_economic_analysis, generate_economic_optimization_recommendations
from fuel_optimization_engine import FuelOptimizationEngine
import numpy as np

def demonstrate_comprehensive_system():
    """Demonstrate the complete AINO system with real-world scenarios"""
    
    print("AINO COMPREHENSIVE AVIATION INTELLIGENCE DEMONSTRATION")
    print("=" * 70)
    print("Weather-Enhanced Predictions + Fuel Optimization + EU261 Risk Assessment")
    print()
    
    # Initialize fuel optimization engine
    fuel_engine = FuelOptimizationEngine()
    
    # Real-world flight scenarios
    flight_scenarios = [
        {
            'flight_number': 'VS123',
            'airline': 'Virgin Atlantic',
            'aircraft_type': 'Boeing 787-9',
            'route': 'LHR → JFK',
            'origin': 'EGLL',
            'destination': 'KJFK',
            'flight_time_hours': 8.5,
            'payload_kg': 18500,
            'cruise_altitude_ft': 42000,
            'heading': 285,
            'passenger_count': 275,
            'distance_km': 5585,
            'route_class': 'long-haul'
        },
        {
            'flight_number': 'BA456',
            'airline': 'British Airways',
            'aircraft_type': 'Airbus A320',
            'route': 'LGW → BCN',
            'origin': 'EGKK',
            'destination': 'LEBL',
            'flight_time_hours': 2.2,
            'payload_kg': 12000,
            'cruise_altitude_ft': 37000,
            'heading': 155,
            'passenger_count': 180,
            'distance_km': 1147,
            'route_class': 'short-haul'
        },
        {
            'flight_number': 'DL789',
            'airline': 'Delta Air Lines',
            'aircraft_type': 'Airbus A350-900',
            'route': 'ATL → LHR',
            'origin': 'KATL',
            'destination': 'EGLL',
            'flight_time_hours': 8.8,
            'payload_kg': 19200,
            'cruise_altitude_ft': 41000,
            'heading': 60,
            'passenger_count': 295,
            'distance_km': 6850,
            'route_class': 'long-haul'
        }
    ]
    
    # Weather scenarios (simulating different conditions)
    weather_scenarios = [
        {
            'conditions': 'Severe Atlantic Storm',
            'wind_speed': 45,
            'wind_direction': 315,
            'temperature': -35,
            'turbulence_level': 'severe',
            'icing_risk': True,
            'visibility': 2000
        },
        {
            'conditions': 'Clear European Weather',
            'wind_speed': 15,
            'wind_direction': 180,
            'temperature': 22,
            'turbulence_level': 'none',
            'icing_risk': False,
            'visibility': 9999
        },
        {
            'conditions': 'High Pressure System',
            'wind_speed': 8,
            'wind_direction': 90,
            'temperature': 18,
            'turbulence_level': 'light',
            'icing_risk': False,
            'visibility': 9999
        }
    ]
    
    # Delay scenarios (minutes)
    delay_scenarios = [195, 45, 25]
    
    comprehensive_results = []
    
    for i, (flight, weather, delay) in enumerate(zip(flight_scenarios, weather_scenarios, delay_scenarios)):
        print(f"\nSCENARIO {i+1}: {flight['flight_number']} - {flight['route']}")
        print("=" * 60)
        print(f"Aircraft: {flight['aircraft_type']}")
        print(f"Weather: {weather['conditions']}")
        print(f"Predicted Delay: {delay} minutes")
        print()
        
        # 1. Fuel Optimization Analysis
        print("1. FUEL OPTIMIZATION ANALYSIS")
        print("-" * 40)
        
        fuel_analysis = fuel_engine.generate_fuel_optimization_recommendations(
            flight, weather, delay
        )
        
        baseline_fuel_burn = fuel_analysis['baseline_fuel_kg']
        predicted_fuel_burn = fuel_analysis['predicted_fuel_kg']
        expected_fuel_savings = baseline_fuel_burn - predicted_fuel_burn
        
        print(f"Baseline Fuel: {baseline_fuel_burn:.0f} kg")
        print(f"Predicted Fuel: {predicted_fuel_burn:.0f} kg")
        print(f"Fuel Impact: {expected_fuel_savings:+.0f} kg")
        print(f"Cost Impact: ${fuel_analysis['potential_cost_savings']:+,.0f}")
        print()
        
        # 2. Economic Risk Assessment
        print("2. ECONOMIC RISK ASSESSMENT")
        print("-" * 35)
        
        economic_analysis = comprehensive_economic_analysis(flight, weather, delay)
        
        # Calculate EU261 risk score
        prob_delay_3h = min(1.0, max(0.0, (delay - 120) / 180))
        pax_count = flight['passenger_count']
        if flight['distance_km'] < 1500:
            avg_compensation = 250
        elif flight['distance_km'] < 3500:
            avg_compensation = 400
        else:
            avg_compensation = 600
        
        eu261_risk_score = prob_delay_3h * pax_count * avg_compensation
        
        print(f"EU261 Risk Score: ${eu261_risk_score:,.0f}")
        print(f"EU261 Exposure: ${economic_analysis['eu261_exposure']:,.0f}")
        print(f"Operational Costs: ${economic_analysis['operational_delay_cost']:,.0f}")
        print(f"Total Economic Impact: ${economic_analysis['net_economic_impact']:,.0f}")
        print(f"Cost per Passenger: ${economic_analysis['cost_per_passenger']:.0f}")
        print()
        
        # 3. Optimization Recommendations
        print("3. OPTIMIZATION RECOMMENDATIONS")
        print("-" * 40)
        
        optimization_recs = generate_economic_optimization_recommendations(economic_analysis, flight)
        
        if optimization_recs['recommendations']:
            for j, rec in enumerate(optimization_recs['recommendations'], 1):
                priority_icon = "🔴" if rec['priority'] == 'Critical' else "🟡" if rec['priority'] == 'High' else "🟢"
                print(f"{j}. {priority_icon} {rec['category']}")
                print(f"   {rec['recommendation']}")
                print(f"   Potential Saving: ${rec['potential_saving']:,.0f}")
                print()
        
        print(f"Total Optimization Potential: ${optimization_recs['total_potential_savings']:,.0f}")
        print(f"ROI Improvement: {optimization_recs['roi_improvement_percent']:.1f}%")
        print()
        
        # 4. Executive Summary
        print("4. EXECUTIVE SUMMARY")
        print("-" * 25)
        
        net_position = fuel_analysis['potential_cost_savings'] - economic_analysis['net_economic_impact']
        
        print(f"Flight Performance Score: {max(0, 100 - delay/2):.0f}/100")
        print(f"Weather Impact Severity: {weather_impact_severity(weather)}")
        print(f"Overall Risk Level: {overall_risk_level(delay, eu261_risk_score)}")
        print(f"Net Financial Position: ${net_position:+,.0f}")
        
        if delay > 180:
            print("⚠️  CRITICAL: High EU261 compensation risk")
        elif delay > 60:
            print("⚠️  WARNING: Moderate delay impact")
        else:
            print("✅ NORMAL: Operations within acceptable parameters")
        
        # Store results for portfolio analysis
        comprehensive_results.append({
            'flight': flight['flight_number'],
            'airline': flight['airline'],
            'route': flight['route'],
            'delay_mins': delay,
            'fuel_impact': expected_fuel_savings,
            'eu261_risk': eu261_risk_score,
            'total_cost': economic_analysis['net_economic_impact'],
            'optimization_potential': optimization_recs['total_potential_savings']
        })
        
        print("\n" + "─" * 60)
    
    # Portfolio Analysis
    print("\nPORTFOLIO ANALYSIS SUMMARY")
    print("=" * 60)
    
    df = pd.DataFrame(comprehensive_results)
    
    total_fuel_impact = df['fuel_impact'].sum()
    total_eu261_risk = df['eu261_risk'].sum()
    total_cost_impact = df['total_cost'].sum()
    total_optimization = df['optimization_potential'].sum()
    
    print(f"Fleet Analysis ({len(df)} flights):")
    print(f"  Total Fuel Impact: {total_fuel_impact:+,.0f} kg")
    print(f"  Total EU261 Risk: ${total_eu261_risk:,.0f}")
    print(f"  Total Cost Impact: ${total_cost_impact:+,.0f}")
    print(f"  Optimization Potential: ${total_optimization:,.0f}")
    print()
    
    # Performance ranking
    df['performance_score'] = 100 - (df['delay_mins'] / 2) - (df['total_cost'] / 1000)
    df_sorted = df.sort_values('performance_score', ascending=False)
    
    print("Flight Performance Ranking:")
    for i, (_, row) in enumerate(df_sorted.iterrows(), 1):
        print(f"{i}. {row['flight']} ({row['airline']}) - Score: {row['performance_score']:.0f}")
    
    print(f"\nBest Performing Route: {df_sorted.iloc[0]['route']}")
    print(f"Highest Risk Flight: {df.loc[df['eu261_risk'].idxmax()]['flight']}")
    
    return comprehensive_results

def weather_impact_severity(weather):
    """Calculate weather impact severity"""
    severity = 0
    if weather['wind_speed'] > 30: severity += 2
    if weather['turbulence_level'] == 'severe': severity += 3
    if weather['icing_risk']: severity += 2
    if weather['visibility'] < 3000: severity += 2
    
    if severity >= 6: return "SEVERE"
    elif severity >= 3: return "MODERATE" 
    else: return "LIGHT"

def overall_risk_level(delay, eu261_risk):
    """Calculate overall risk level"""
    risk_score = (delay / 10) + (eu261_risk / 10000)
    
    if risk_score >= 30: return "HIGH RISK"
    elif risk_score >= 15: return "MEDIUM RISK"
    else: return "LOW RISK"

if __name__ == "__main__":
    results = demonstrate_comprehensive_system()
    
    print("\n" + "=" * 70)
    print("AINO COMPREHENSIVE DEMONSTRATION COMPLETE")
    print("Advanced aviation intelligence with integrated optimization")
    print("=" * 70)
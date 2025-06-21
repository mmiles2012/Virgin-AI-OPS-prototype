#!/usr/bin/env python3
"""
Comprehensive Virgin Atlantic Analysis Integration Demo
ML-powered issue detection combined with NOTAM intelligence and fuel cost predictions
"""

import requests
import json
from datetime import datetime, timedelta
import time
from virgin_atlantic_flight_analyzer import VirginAtlanticFlightAnalyzer

def demonstrate_comprehensive_va_analysis():
    """
    Demonstrate complete Virgin Atlantic operational intelligence integration
    """
    print("=" * 90)
    print("AINO Aviation Intelligence - Virgin Atlantic Comprehensive Analysis")
    print("ML Issue Detection • NOTAM Security • Fuel Cost Predictions • Risk Assessment")
    print("=" * 90)
    print()

    # Initialize the ML flight analyzer
    print("🔧 Initializing Virgin Atlantic ML Analysis System...")
    analyzer = VirginAtlanticFlightAnalyzer()
    
    # Load pre-trained models
    if analyzer.load_models():
        print("✅ ML models loaded successfully - Ready for predictive analysis")
    else:
        print("⚠️  Training new ML models...")
        training_data = analyzer.generate_synthetic_flight_data(days=90)
        analyzer.train_models(training_data)
        analyzer.save_models()
        print("✅ ML models trained and saved")
    
    print()

    # Define current Virgin Atlantic operations for analysis
    current_va_operations = [
        {
            'flight_id': 'VS3',
            'date': datetime.now().strftime('%Y-%m-%d'),
            'route': 'LHR-JFK',
            'aircraft_type': 'A350-1000',
            'departure_hour': 14,
            'distance_nm': 3459,
            'aircraft_capacity': 335,
            'aircraft_age_years': 6.2,
            'cycles_since_maintenance': 380,
            'origin_weather_score': 0.7,
            'dest_weather_score': 0.6,
            'enroute_weather_score': 0.8,
            'passenger_load_factor': 0.89,
            'cargo_weight_kg': 11500,
            'fuel_uplift_kg': 118000,
            'crew_experience_hours': 9500,
            'ground_handling_delay_min': 12,
            'atc_delay_min': 8,
            'origin_congestion_level': 0.7,
            'dest_congestion_level': 0.8,
            'maintenance_due_days': 25,
            'recent_technical_issues': 0,
            'notam_count': 3,
            'security_level': 'elevated',
            'is_peak_season': True,
            'is_weekend': False,
            'is_holiday_period': False
        },
        {
            'flight_id': 'VS9',
            'date': datetime.now().strftime('%Y-%m-%d'),
            'route': 'LHR-LAX',
            'aircraft_type': 'B787-9',
            'departure_hour': 11,
            'distance_nm': 5440,
            'aircraft_capacity': 258,
            'aircraft_age_years': 4.1,
            'cycles_since_maintenance': 210,
            'origin_weather_score': 0.8,
            'dest_weather_score': 0.9,
            'enroute_weather_score': 0.85,
            'passenger_load_factor': 0.82,
            'cargo_weight_kg': 9200,
            'fuel_uplift_kg': 132000,
            'crew_experience_hours': 11200,
            'ground_handling_delay_min': 6,
            'atc_delay_min': 4,
            'origin_congestion_level': 0.5,
            'dest_congestion_level': 0.4,
            'maintenance_due_days': 42,
            'recent_technical_issues': 0,
            'notam_count': 1,
            'security_level': 'normal',
            'is_peak_season': True,
            'is_weekend': True,
            'is_holiday_period': False
        },
        {
            'flight_id': 'VS45',
            'date': datetime.now().strftime('%Y-%m-%d'),
            'route': 'LHR-BOS',
            'aircraft_type': 'A330-300',
            'departure_hour': 16,
            'distance_nm': 3260,
            'aircraft_capacity': 296,
            'aircraft_age_years': 9.8,
            'cycles_since_maintenance': 445,
            'origin_weather_score': 0.5,  # Poor weather
            'dest_weather_score': 0.7,
            'enroute_weather_score': 0.6,
            'passenger_load_factor': 0.94,
            'cargo_weight_kg': 13500,
            'fuel_uplift_kg': 95000,
            'crew_experience_hours': 7800,
            'ground_handling_delay_min': 18,
            'atc_delay_min': 22,
            'origin_congestion_level': 0.9,
            'dest_congestion_level': 0.6,
            'maintenance_due_days': 8,
            'recent_technical_issues': 1,
            'notam_count': 4,
            'security_level': 'elevated',
            'is_peak_season': True,
            'is_weekend': False,
            'is_holiday_period': False
        }
    ]

    # 1. Perform ML-powered flight analysis
    print("🤖 VIRGIN ATLANTIC ML FLIGHT ANALYSIS")
    print("-" * 60)
    
    ml_results = analyzer.batch_analyze_flights(current_va_operations)
    
    print(f"Fleet Analysis Summary:")
    print(f"📊 Total flights: {ml_results['total_flights']}")
    print(f"🚨 High risk flights: {ml_results['high_risk_flights']}")
    print(f"⚠️  Medium risk flights: {ml_results['medium_risk_flights']}")
    print(f"🔍 Anomaly detections: {ml_results['anomaly_flights']}")
    print()

    # Display detailed ML analysis for each flight
    operational_alerts = []
    
    for result in ml_results['detailed_results']:
        flight_id = result['flight_id']
        route = result['route']
        risk_level = result['risk_assessment'].get('risk_level', 'LOW')
        issue_prob = result['risk_assessment'].get('general_issue_probability', 0)
        
        risk_indicator = "🔴" if risk_level == 'HIGH' else "🟡" if risk_level == 'MEDIUM' else "🟢"
        
        print(f"{risk_indicator} Flight {flight_id} ({route}) - {risk_level} RISK")
        print(f"   Issue Probability: {issue_prob:.3f}")
        
        # Check for specific risks
        if result['risk_assessment'].get('cancelled_probability', 0) > 0.2:
            print(f"   Cancellation Risk: {result['risk_assessment']['cancelled_probability']:.3f}")
            operational_alerts.append(f"{flight_id}: High cancellation risk detected")
        
        if result['risk_assessment'].get('technical_issue_probability', 0) > 0.3:
            print(f"   Technical Risk: {result['risk_assessment']['technical_issue_probability']:.3f}")
            operational_alerts.append(f"{flight_id}: Technical issue risk elevated")
        
        if result['risk_assessment'].get('is_anomaly', False):
            print("   ⚠️  ANOMALY DETECTED - Manual review required")
            operational_alerts.append(f"{flight_id}: Operational anomaly requires investigation")
        
        print()

    # 2. Integrate with NOTAM security analysis
    print("🛡️  NOTAM SECURITY INTEGRATION")
    print("-" * 60)
    
    # Extract airports from routes
    airports_to_check = set()
    for flight in current_va_operations:
        origin, dest = flight['route'].split('-')
        airports_to_check.add(origin)
        airports_to_check.add(dest)
    
    security_summary = {}
    
    for airport in airports_to_check:
        try:
            # Get NOTAM risk analysis
            response = requests.get(f"http://localhost:5000/api/notams/{airport}/risk-analysis")
            if response.status_code == 200:
                risk_data = response.json()
                if risk_data['success']:
                    risk_level = risk_data['risk_analysis']['risk_level']
                    security_notams = risk_data['notam_summary']['security_notams']
                    
                    security_summary[airport] = {
                        'risk_level': risk_level,
                        'security_notams': security_notams,
                        'factors': risk_data['risk_analysis']['risk_factors']
                    }
                    
                    risk_emoji = "🔴" if risk_level == 'HIGH' else "🟡" if risk_level == 'MEDIUM' else "🟢"
                    print(f"{risk_emoji} {airport}: {risk_level} Security Risk")
                    print(f"   Active Security NOTAMs: {security_notams}")
                    
                    if risk_level in ['HIGH', 'CRITICAL']:
                        for factor in risk_data['risk_analysis']['risk_factors']:
                            print(f"   • {factor}")
                        operational_alerts.append(f"{airport}: HIGH security risk - Enhanced protocols required")
                    
                    print()
                    
        except Exception as e:
            print(f"⚠️  Could not retrieve NOTAM data for {airport}: {e}")

    # 3. Integrate with fuel cost predictions
    print("⛽ FUEL COST ANALYSIS INTEGRATION")
    print("-" * 60)
    
    try:
        # Get current fuel cost predictions
        fuel_response = requests.get("http://localhost:5000/api/ml-fuel-costs/current-forecast")
        if fuel_response.status_code == 200:
            fuel_data = fuel_response.json()
            
            if fuel_data['success']:
                current_price = fuel_data['forecast']['current_price_per_gallon']
                trend = fuel_data['forecast']['market_trend']
                confidence = fuel_data['forecast']['confidence_score']
                
                print(f"💰 Current Fuel Price: ${current_price:.2f}/gallon")
                print(f"📈 Market Trend: {trend}")
                print(f"🎯 Confidence: {confidence:.1%}")
                
                # Calculate fuel cost impact for each flight
                total_fuel_cost = 0
                
                for flight in current_va_operations:
                    fuel_kg = flight['fuel_uplift_kg']
                    fuel_gallons = fuel_kg * 0.000264172  # Convert kg to gallons (Jet A-1)
                    flight_fuel_cost = fuel_gallons * current_price
                    total_fuel_cost += flight_fuel_cost
                    
                    print(f"   {flight['flight_id']}: {fuel_gallons:.0f} gal = ${flight_fuel_cost:.0f}")
                
                print(f"📊 Total Fleet Fuel Cost: ${total_fuel_cost:.0f}")
                
                # Alert on high fuel costs
                if current_price > 3.50:
                    operational_alerts.append(f"High fuel costs detected: ${current_price:.2f}/gal - Consider fuel optimization")
                
                print()
                
    except Exception as e:
        print(f"⚠️  Could not retrieve fuel cost data: {e}")

    # 4. Generate comprehensive operational recommendations
    print("📋 COMPREHENSIVE OPERATIONAL RECOMMENDATIONS")
    print("-" * 60)
    
    # Combine ML, NOTAM, and fuel insights
    priority_actions = []
    
    # High-priority ML alerts
    for result in ml_results['detailed_results']:
        if result['risk_assessment'].get('risk_level') == 'HIGH':
            priority_actions.append(f"URGENT: {result['flight_id']} requires immediate attention - HIGH risk classification")
        elif result['risk_assessment'].get('is_anomaly', False):
            priority_actions.append(f"REVIEW: {result['flight_id']} showing anomalous patterns - Manual investigation required")
    
    # Security-based actions
    high_security_airports = [airport for airport, data in security_summary.items() if data['risk_level'] == 'HIGH']
    if high_security_airports:
        priority_actions.append(f"SECURITY: Enhanced protocols required at {', '.join(high_security_airports)}")
    
    # Fuel optimization actions
    try:
        if fuel_data['success'] and current_price > 3.50:
            priority_actions.append("FUEL: Implement fuel conservation measures - Prices above optimal threshold")
    except:
        pass
    
    # Standard operational recommendations
    standard_actions = [
        "Monitor weather conditions at all departure/arrival airports",
        "Ensure backup aircraft availability for high-risk flights",
        "Coordinate with ground operations on potential delays",
        "Update passenger communications for affected routes",
        "Brief flight crews on current security considerations"
    ]
    
    print("🚨 Priority Actions:")
    for i, action in enumerate(priority_actions, 1):
        print(f"{i}. {action}")
    
    if not priority_actions:
        print("   ✅ No urgent actions required - Fleet operating within normal parameters")
    
    print("\n📝 Standard Operational Actions:")
    for i, action in enumerate(standard_actions, 1):
        print(f"{i}. {action}")

    # 5. Generate executive summary
    print()
    print("=" * 90)
    print("EXECUTIVE SUMMARY - VIRGIN ATLANTIC OPERATIONS")
    print("=" * 90)
    
    # Calculate overall fleet risk score
    avg_risk = sum(r['risk_assessment'].get('general_issue_probability', 0) for r in ml_results['detailed_results']) / len(ml_results['detailed_results'])
    overall_risk = "HIGH" if avg_risk > 0.6 else "MEDIUM" if avg_risk > 0.3 else "LOW"
    
    print(f"🎯 Fleet Risk Level: {overall_risk}")
    print(f"📊 Average Risk Score: {avg_risk:.3f}")
    print(f"✈️  Flights Analyzed: {ml_results['total_flights']}")
    print(f"🚨 Active Alerts: {len(operational_alerts)}")
    print(f"🛡️  Security Risks: {len([a for a in security_summary.values() if a['risk_level'] == 'HIGH'])}")
    
    # Key insights
    print(f"\n📈 Key Insights:")
    print(f"   • ML models analyzed {ml_results['total_flights']} flights with {ml_results['anomaly_flights']} anomalies detected")
    print(f"   • NOTAM intelligence monitoring {len(airports_to_check)} airports with security risk assessment")
    print(f"   • Fuel cost analysis providing strategic pricing insights for operational planning")
    print(f"   • Integrated risk assessment combining operational, security, and economic factors")
    
    print()
    print(f"🕐 Analysis completed at {datetime.now().strftime('%Y-%m-%d %H:%M:%S UTC')}")
    print("Next comprehensive analysis: 4 hours")
    print("=" * 90)

if __name__ == "__main__":
    demonstrate_comprehensive_va_analysis()
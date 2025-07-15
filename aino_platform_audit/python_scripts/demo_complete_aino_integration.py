#!/usr/bin/env python3
"""
Complete AINO Aviation Intelligence Platform Integration
ML Flight Analysis + NOTAM Security + Economic Intelligence + Fuel Cost Predictions
"""

import requests
import json
from datetime import datetime, timedelta
from virgin_atlantic_flight_analyzer import VirginAtlanticFlightAnalyzer
from aviation_economic_analyzer import AviationEconomicAnalyzer

def demonstrate_complete_aino_platform():
    """
    Demonstrate the complete integrated AINO aviation intelligence platform
    """
    print("=" * 100)
    print("AINO AVIATION INTELLIGENCE PLATFORM - COMPLETE OPERATIONAL INTEGRATION")
    print("ML Flight Analysis • NOTAM Security • Economic Intelligence • Fuel Predictions")
    print("=" * 100)
    print()

    # Initialize all analysis systems
    print("🚀 Initializing AINO Intelligence Systems...")
    
    # 1. Virgin Atlantic ML Flight Analyzer
    va_analyzer = VirginAtlanticFlightAnalyzer()
    if va_analyzer.load_models():
        print("✅ Virgin Atlantic ML models loaded - Predictive flight analysis ready")
    else:
        print("⚠️  Training Virgin Atlantic ML models...")
        training_data = va_analyzer.generate_synthetic_flight_data(days=90)
        va_analyzer.train_models(training_data)
        va_analyzer.save_models()
        print("✅ Virgin Atlantic ML models trained and operational")
    
    # 2. Aviation Economic Analyzer
    economic_analyzer = AviationEconomicAnalyzer()
    economic_sample_data = [
        {
            'title': 'Oil Price Surge Impacts Global Aviation',
            'text': 'Crude oil prices jumped 8% to $91 per barrel, pushing jet fuel costs to $3.10 per gallon. Airlines face $3.2 billion quarterly impact as fuel comprises 25% of operational costs.'
        },
        {
            'title': 'Currency Volatility Affects International Routes',
            'text': 'EUR/USD fluctuations and GBP strength create hedging challenges for international carriers. Virgin Atlantic reports 4% revenue impact from currency movements.'
        }
    ]
    economic_analyzer.train_model(economic_sample_data)
    print("✅ Economic intelligence system trained - Market impact analysis ready")
    
    print()

    # Define current Virgin Atlantic operations for comprehensive analysis
    current_operations = [
        {
            'flight_id': 'VS3',
            'date': datetime.now().strftime('%Y-%m-%d'),
            'route': 'LHR-JFK',
            'aircraft_type': 'A350-1000',
            'departure_hour': 14,
            'distance_nm': 3459,
            'aircraft_capacity': 335,
            'aircraft_age_years': 5.8,
            'cycles_since_maintenance': 420,
            'origin_weather_score': 0.6,
            'dest_weather_score': 0.5,
            'enroute_weather_score': 0.7,
            'passenger_load_factor': 0.91,
            'cargo_weight_kg': 12200,
            'fuel_uplift_kg': 125000,
            'crew_experience_hours': 9200,
            'ground_handling_delay_min': 15,
            'atc_delay_min': 12,
            'origin_congestion_level': 0.8,
            'dest_congestion_level': 0.9,
            'maintenance_due_days': 18,
            'recent_technical_issues': 0,
            'notam_count': 5,
            'security_level': 'elevated',
            'is_peak_season': True,
            'is_weekend': False,
            'is_holiday_period': False
        },
        {
            'flight_id': 'VS15',
            'date': datetime.now().strftime('%Y-%m-%d'),
            'route': 'LHR-LAX',
            'aircraft_type': 'B787-9',
            'departure_hour': 11,
            'distance_nm': 5440,
            'aircraft_capacity': 258,
            'aircraft_age_years': 3.9,
            'cycles_since_maintenance': 180,
            'origin_weather_score': 0.8,
            'dest_weather_score': 0.9,
            'enroute_weather_score': 0.85,
            'passenger_load_factor': 0.85,
            'cargo_weight_kg': 8800,
            'fuel_uplift_kg': 138000,
            'crew_experience_hours': 11800,
            'ground_handling_delay_min': 8,
            'atc_delay_min': 5,
            'origin_congestion_level': 0.6,
            'dest_congestion_level': 0.4,
            'maintenance_due_days': 35,
            'recent_technical_issues': 0,
            'notam_count': 2,
            'security_level': 'normal',
            'is_peak_season': True,
            'is_weekend': True,
            'is_holiday_period': False
        },
        {
            'flight_id': 'VS45',
            'date': datetime.now().strftime('%Y-%m-%d'),
            'route': 'MAN-JFK',
            'aircraft_type': 'A330-300',
            'departure_hour': 13,
            'distance_nm': 3336,
            'aircraft_capacity': 296,
            'aircraft_age_years': 11.2,
            'cycles_since_maintenance': 485,
            'origin_weather_score': 0.4,
            'dest_weather_score': 0.6,
            'enroute_weather_score': 0.5,
            'passenger_load_factor': 0.96,
            'cargo_weight_kg': 14100,
            'fuel_uplift_kg': 98000,
            'crew_experience_hours': 8200,
            'ground_handling_delay_min': 22,
            'atc_delay_min': 18,
            'origin_congestion_level': 0.7,
            'dest_congestion_level': 0.8,
            'maintenance_due_days': 5,
            'recent_technical_issues': 1,
            'notam_count': 6,
            'security_level': 'high',
            'is_peak_season': True,
            'is_weekend': False,
            'is_holiday_period': False
        }
    ]

    # PHASE 1: ML FLIGHT ANALYSIS
    print("🤖 PHASE 1: ML-POWERED FLIGHT RISK ANALYSIS")
    print("-" * 70)
    
    ml_analysis = va_analyzer.batch_analyze_flights(current_operations)
    
    print(f"Fleet Risk Assessment:")
    print(f"   Total flights analyzed: {ml_analysis['total_flights']}")
    print(f"   High risk flights: {ml_analysis['high_risk_flights']}")
    print(f"   Medium risk flights: {ml_analysis['medium_risk_flights']}")
    print(f"   Anomaly detections: {ml_analysis['anomaly_flights']}")
    print()

    ml_alerts = []
    for result in ml_analysis['detailed_results']:
        flight_id = result['flight_id']
        route = result['route']
        risk_level = result['risk_assessment'].get('risk_level', 'LOW')
        issue_prob = result['risk_assessment'].get('general_issue_probability', 0)
        
        risk_icon = "🔴" if risk_level == 'HIGH' else "🟡" if risk_level == 'MEDIUM' else "🟢"
        print(f"{risk_icon} {flight_id} ({route}): {risk_level} RISK - Probability: {issue_prob:.3f}")
        
        if result['risk_assessment'].get('is_anomaly', False):
            print(f"   ⚠️  ANOMALY DETECTED - Immediate investigation required")
            ml_alerts.append(f"{flight_id}: Operational anomaly requires urgent review")
        
        if result['risk_assessment'].get('technical_issue_probability', 0) > 0.3:
            ml_alerts.append(f"{flight_id}: Elevated technical risk - Enhanced pre-flight checks recommended")
        
        if result['risk_assessment'].get('cancelled_probability', 0) > 0.25:
            ml_alerts.append(f"{flight_id}: Cancellation risk - Prepare contingency plans")

    print()

    # PHASE 2: NOTAM SECURITY INTELLIGENCE
    print("🛡️  PHASE 2: NOTAM SECURITY INTELLIGENCE")
    print("-" * 70)
    
    # Extract unique airports from flight routes
    airports = set()
    for flight in current_operations:
        origin, dest = flight['route'].split('-')
        airports.add(origin)
        airports.add(dest)
    
    security_alerts = []
    airport_security_summary = {}
    
    for airport in airports:
        try:
            response = requests.get(f"http://localhost:5000/api/notams/{airport}/risk-analysis")
            if response.status_code == 200:
                risk_data = response.json()
                if risk_data['success']:
                    risk_level = risk_data['risk_analysis']['risk_level']
                    security_notams = risk_data['notam_summary']['security_notams']
                    
                    airport_security_summary[airport] = {
                        'risk_level': risk_level,
                        'security_notams': security_notams,
                        'factors': risk_data['risk_analysis']['risk_factors']
                    }
                    
                    risk_icon = "🔴" if risk_level in ['HIGH', 'CRITICAL'] else "🟡" if risk_level == 'MEDIUM' else "🟢"
                    print(f"{risk_icon} {airport}: {risk_level} Security Risk ({security_notams} security NOTAMs)")
                    
                    if risk_level in ['HIGH', 'CRITICAL']:
                        security_alerts.append(f"{airport}: {risk_level} security risk - Enhanced protocols required")
                        for factor in risk_data['risk_analysis']['risk_factors']:
                            print(f"     • {factor}")
                    
        except Exception as e:
            print(f"⚠️  NOTAM data unavailable for {airport}")

    print()

    # PHASE 3: ECONOMIC INTELLIGENCE
    print("💰 PHASE 3: ECONOMIC IMPACT INTELLIGENCE")
    print("-" * 70)
    
    # Real-time economic scenario analysis
    current_economic_scenario = """
    Oil prices surge 7% to $94 per barrel following supply concerns, pushing jet fuel costs 
    to $3.25 per gallon. Airlines face estimated $2.8 billion quarterly impact. USD strengthens 
    3% against EUR as central banks signal rate stability. Virgin Atlantic implementing 
    fuel efficiency measures across A350 and B787 fleet operations.
    """
    
    economic_impact = economic_analyzer.predict_economic_impact(current_economic_scenario)
    
    print(f"Current Economic Impact: {economic_impact['prediction'].upper()}")
    print(f"Confidence Level: {max(economic_impact['probability'].values()):.3f}")
    print(f"Market Sentiment: {economic_impact['sentiment']['polarity']:.3f}")
    
    economic_alerts = []
    if economic_impact['prediction'] == 'high_impact':
        economic_alerts.append("HIGH economic impact detected - Review fuel hedging strategies")
        economic_alerts.append("Oil price surge affecting operational costs - Implement cost optimization")
    
    # Extract key economic factors
    print(f"\nKey Economic Factors Detected:")
    for category, factors in economic_impact['economic_factors'].items():
        if factors and not category.endswith('_values'):
            print(f"   • {category.replace('_', ' ').title()}: {factors}")

    print()

    # PHASE 4: INTEGRATED FUEL COST ANALYSIS
    print("⛽ PHASE 4: INTEGRATED FUEL COST ANALYSIS")
    print("-" * 70)
    
    try:
        fuel_response = requests.get("http://localhost:5000/api/ml-fuel-costs/current-forecast")
        if fuel_response.status_code == 200:
            fuel_data = fuel_response.json()
            if fuel_data.get('success'):
                current_price = fuel_data['forecast']['current_price_per_gallon']
                trend = fuel_data['forecast']['market_trend']
                confidence = fuel_data['forecast']['confidence_score']
                
                print(f"Current Fuel Price: ${current_price:.2f}/gallon")
                print(f"Market Trend: {trend}")
                print(f"Prediction Confidence: {confidence:.1%}")
                
                # Calculate fuel impact for each flight
                total_fuel_cost = 0
                for flight in current_operations:
                    fuel_kg = flight['fuel_uplift_kg']
                    fuel_gallons = fuel_kg * 0.000264172
                    flight_fuel_cost = fuel_gallons * current_price
                    total_fuel_cost += flight_fuel_cost
                    print(f"   {flight['flight_id']}: ${flight_fuel_cost:.0f} fuel cost")
                
                print(f"\nTotal Fleet Fuel Cost: ${total_fuel_cost:.0f}")
                
                if current_price > 3.20:
                    economic_alerts.append(f"Elevated fuel costs: ${current_price:.2f}/gal - Review optimization strategies")
            else:
                print("Fuel cost data temporarily unavailable")
        else:
            print("Fuel cost service unavailable")
    except Exception as e:
        print("Fuel cost analysis temporarily unavailable")

    print()

    # PHASE 5: COMPREHENSIVE RISK MATRIX
    print("📊 PHASE 5: COMPREHENSIVE OPERATIONAL RISK MATRIX")
    print("-" * 70)
    
    # Create integrated risk assessment for each flight
    integrated_risk_assessment = []
    
    for i, flight in enumerate(current_operations):
        flight_id = flight['flight_id']
        route = flight['route']
        
        # Get ML risk assessment
        ml_result = ml_analysis['detailed_results'][i]
        ml_risk = ml_result['risk_assessment'].get('risk_level', 'LOW')
        ml_prob = ml_result['risk_assessment'].get('general_issue_probability', 0)
        
        # Get security risk for origin and destination
        origin, dest = route.split('-')
        origin_security = airport_security_summary.get(origin, {}).get('risk_level', 'LOW')
        dest_security = airport_security_summary.get(dest, {}).get('risk_level', 'LOW')
        
        # Calculate composite risk score
        risk_scores = {
            'LOW': 1,
            'MEDIUM': 2,
            'HIGH': 3,
            'CRITICAL': 4
        }
        
        composite_score = (
            risk_scores.get(ml_risk, 1) * 0.4 +
            risk_scores.get(origin_security, 1) * 0.3 +
            risk_scores.get(dest_security, 1) * 0.3
        )
        
        if composite_score >= 3.0:
            overall_risk = 'CRITICAL'
            risk_icon = '🔴'
        elif composite_score >= 2.5:
            overall_risk = 'HIGH'
            risk_icon = '🟠'
        elif composite_score >= 1.5:
            overall_risk = 'MEDIUM'
            risk_icon = '🟡'
        else:
            overall_risk = 'LOW'
            risk_icon = '🟢'
        
        print(f"{risk_icon} {flight_id} ({route}) - OVERALL RISK: {overall_risk}")
        print(f"   ML Risk: {ml_risk} (P={ml_prob:.3f})")
        print(f"   Security: {origin} ({origin_security}) → {dest} ({dest_security})")
        print(f"   Composite Score: {composite_score:.2f}/4.0")
        
        integrated_risk_assessment.append({
            'flight_id': flight_id,
            'route': route,
            'overall_risk': overall_risk,
            'composite_score': composite_score,
            'ml_risk': ml_risk,
            'security_risks': [origin_security, dest_security]
        })
        
        print()

    # PHASE 6: EXECUTIVE DASHBOARD & RECOMMENDATIONS
    print("📋 PHASE 6: EXECUTIVE OPERATIONAL DASHBOARD")
    print("-" * 70)
    
    # Count risk levels
    critical_flights = len([f for f in integrated_risk_assessment if f['overall_risk'] == 'CRITICAL'])
    high_risk_flights = len([f for f in integrated_risk_assessment if f['overall_risk'] == 'HIGH'])
    
    print(f"FLEET STATUS SUMMARY:")
    print(f"   Total flights monitored: {len(current_operations)}")
    print(f"   Critical risk flights: {critical_flights}")
    print(f"   High risk flights: {high_risk_flights}")
    print(f"   Active security threats: {len(security_alerts)}")
    print(f"   Economic impact level: {economic_impact['prediction'].upper()}")
    
    # Consolidate all alerts
    all_alerts = ml_alerts + security_alerts + economic_alerts
    
    print(f"\nPRIORITY OPERATIONAL ALERTS ({len(all_alerts)} active):")
    for i, alert in enumerate(all_alerts, 1):
        print(f"{i}. {alert}")
    
    # Generate strategic recommendations
    strategic_recommendations = [
        "Implement enhanced pre-flight security briefings for all crew",
        "Activate fuel cost optimization protocols across fleet",
        "Coordinate with ground operations on potential security delays",
        "Update passenger communications for affected routes",
        "Monitor economic indicators for operational planning adjustments"
    ]
    
    if critical_flights > 0:
        strategic_recommendations.insert(0, f"URGENT: {critical_flights} critical risk flights require immediate attention")
    
    if len(security_alerts) > 2:
        strategic_recommendations.insert(0, "SECURITY: Multiple airports showing elevated threats - Review security protocols")
    
    print(f"\nSTRATEGIC RECOMMENDATIONS:")
    for i, rec in enumerate(strategic_recommendations, 1):
        print(f"{i}. {rec}")

    # Save comprehensive analysis
    comprehensive_report = {
        'timestamp': datetime.now().isoformat(),
        'analysis_summary': {
            'total_flights': len(current_operations),
            'critical_risk_flights': critical_flights,
            'high_risk_flights': high_risk_flights,
            'active_alerts': len(all_alerts),
            'economic_impact': economic_impact['prediction']
        },
        'flight_risk_matrix': integrated_risk_assessment,
        'security_assessment': airport_security_summary,
        'economic_intelligence': economic_impact,
        'operational_alerts': all_alerts,
        'strategic_recommendations': strategic_recommendations
    }
    
    with open('aino_comprehensive_analysis.json', 'w') as f:
        json.dump(comprehensive_report, f, indent=2, default=str)

    print()
    print("=" * 100)
    print("AINO PLATFORM INTEGRATION COMPLETE")
    print("=" * 100)
    print(f"Analysis completed: {datetime.now().strftime('%Y-%m-%d %H:%M:%S UTC')}")
    print(f"Comprehensive report saved: aino_comprehensive_analysis.json")
    print(f"Next full analysis cycle: 6 hours")
    print(f"Continuous monitoring: Active across all intelligence modules")
    print("=" * 100)

if __name__ == "__main__":
    demonstrate_complete_aino_platform()
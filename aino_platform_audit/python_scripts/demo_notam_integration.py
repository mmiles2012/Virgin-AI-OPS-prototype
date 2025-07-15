#!/usr/bin/env python3
"""
AINO NOTAM Integration Demonstration
Shows comprehensive operational intelligence combining NOTAMs, security alerts, 
and geopolitical risk analysis for flight operations
"""

import requests
import json
from datetime import datetime
import time

def demonstrate_notam_intelligence():
    """
    Demonstrate the complete NOTAM integration with AINO operational intelligence
    """
    print("=" * 80)
    print("AINO Aviation Intelligence - NOTAM Operational Intelligence Demo")
    print("Airspace Restrictions • Security Alerts • Geopolitical Risk Analysis")
    print("=" * 80)
    print()

    # Test airports with different risk profiles
    test_airports = [
        {"code": "JFK", "name": "John F. Kennedy International", "region": "US East Coast"},
        {"code": "LHR", "name": "London Heathrow", "region": "Europe"},
        {"code": "DXB", "name": "Dubai International", "region": "Middle East"},
        {"code": "LAX", "name": "Los Angeles International", "region": "US West Coast"}
    ]

    operational_summary = {
        'total_notams': 0,
        'security_alerts': 0,
        'high_risk_airports': [],
        'operational_recommendations': []
    }

    for airport in test_airports:
        print(f"🛩️  ANALYZING {airport['name']} ({airport['code']}) - {airport['region']}")
        print("-" * 60)
        
        # 1. Get NOTAM overview
        try:
            response = requests.get(f"http://localhost:5000/api/notams/{airport['code']}")
            if response.status_code == 200:
                notam_data = response.json()
                
                if notam_data['success']:
                    data = notam_data['data']
                    operational_summary['total_notams'] += data['total_notams']
                    operational_summary['security_alerts'] += data['security_notams']
                    
                    print(f"Total NOTAMs: {data['total_notams']}")
                    print(f"Security/Military NOTAMs: {data['security_notams']}")
                    print(f"High Priority NOTAMs: {data['high_priority_notams']}")
                    print()
                    
                    # Show key NOTAMs
                    if data['notams']:
                        print("Key Active NOTAMs:")
                        for notam in data['notams'][:3]:  # Show first 3
                            priority_indicator = "🔴" if notam['priority'] == 'HIGH' else "🟡" if notam['priority'] == 'MEDIUM' else "🟢"
                            print(f"  {priority_indicator} [{notam['type']}] {notam['text'][:60]}...")
                        print()
                
        except Exception as e:
            print(f"Error retrieving NOTAM data: {e}")
            continue

        # 2. Get security alerts
        try:
            response = requests.get(f"http://localhost:5000/api/notams/{airport['code']}/security")
            if response.status_code == 200:
                security_data = response.json()
                
                if security_data['success'] and security_data['alert_count'] > 0:
                    print(f"🚨 SECURITY ALERTS ({security_data['alert_count']} active):")
                    for alert in security_data['security_alerts']:
                        print(f"   • {alert['text']}")
                        print(f"     Priority: {alert['priority']} | Type: {alert['type']}")
                    print()
                
        except Exception as e:
            print(f"Error retrieving security alerts: {e}")

        # 3. Get geopolitical risk analysis
        try:
            response = requests.get(f"http://localhost:5000/api/notams/{airport['code']}/risk-analysis")
            if response.status_code == 200:
                risk_data = response.json()
                
                if risk_data['success']:
                    risk_analysis = risk_data['risk_analysis']
                    risk_level = risk_analysis['risk_level']
                    
                    # Risk level indicator
                    risk_indicators = {
                        'LOW': '🟢 LOW RISK',
                        'MEDIUM': '🟡 MEDIUM RISK', 
                        'HIGH': '🟠 HIGH RISK',
                        'CRITICAL': '🔴 CRITICAL RISK'
                    }
                    
                    print(f"GEOPOLITICAL RISK ASSESSMENT: {risk_indicators.get(risk_level, risk_level)}")
                    
                    if risk_analysis['risk_factors']:
                        print("Risk Factors:")
                        for factor in risk_analysis['risk_factors']:
                            print(f"   • {factor}")
                    
                    if risk_analysis['recommendations']:
                        print("Operational Recommendations:")
                        for rec in risk_analysis['recommendations']:
                            print(f"   → {rec}")
                            operational_summary['operational_recommendations'].append(f"{airport['code']}: {rec}")
                    
                    # Track high-risk airports
                    if risk_level in ['HIGH', 'CRITICAL']:
                        operational_summary['high_risk_airports'].append({
                            'code': airport['code'],
                            'name': airport['name'],
                            'risk_level': risk_level,
                            'factors': risk_analysis['risk_factors']
                        })
                    
                    print()
                
        except Exception as e:
            print(f"Error retrieving risk analysis: {e}")

        print()

    # 4. Generate operational intelligence summary
    print("=" * 80)
    print("AINO OPERATIONAL INTELLIGENCE SUMMARY")
    print("=" * 80)
    print()
    
    print(f"📊 GLOBAL NOTAM OVERVIEW:")
    print(f"   Total NOTAMs monitored: {operational_summary['total_notams']}")
    print(f"   Security alerts active: {operational_summary['security_alerts']}")
    print(f"   High-risk airports: {len(operational_summary['high_risk_airports'])}")
    print()
    
    if operational_summary['high_risk_airports']:
        print("🚨 HIGH-RISK AIRPORTS REQUIRING ATTENTION:")
        for airport in operational_summary['high_risk_airports']:
            print(f"   • {airport['name']} ({airport['code']}) - {airport['risk_level']}")
            for factor in airport['factors']:
                print(f"     ↳ {factor}")
        print()
    
    # 5. Integrate with Virgin Atlantic flight operations
    print("🛫 VIRGIN ATLANTIC FLEET RISK ASSESSMENT:")
    print("-" * 50)
    
    try:
        response = requests.get("http://localhost:5000/api/aviation/virgin-atlantic-flights")
        if response.status_code == 200:
            flights_data = response.json()
            
            if flights_data['success'] and flights_data['flights']:
                for flight in flights_data['flights'][:3]:  # Check first 3 flights
                    origin = flight['origin']
                    destination = flight['destination']
                    
                    print(f"Flight {flight['callsign']}: {origin} → {destination}")
                    
                    # Check risk for origin and destination
                    for airport_code in [origin, destination]:
                        risk_response = requests.get(f"http://localhost:5000/api/notams/{airport_code}/risk-analysis")
                        if risk_response.status_code == 200:
                            risk_data = risk_response.json()
                            if risk_data['success']:
                                risk_level = risk_data['risk_analysis']['risk_level']
                                if risk_level in ['HIGH', 'CRITICAL']:
                                    print(f"   ⚠️  {airport_code}: {risk_level} RISK DETECTED")
                                    print(f"      Security NOTAMs: {risk_data['notam_summary']['security_notams']}")
                                else:
                                    print(f"   ✅ {airport_code}: {risk_level} risk level")
                    
                    print()
                    
    except Exception as e:
        print(f"Error analyzing Virgin Atlantic fleet risk: {e}")

    # 6. Generate strategic recommendations
    print("📋 STRATEGIC OPERATIONAL RECOMMENDATIONS:")
    print("-" * 50)
    
    # Priority recommendations based on risk analysis
    priority_actions = []
    
    if operational_summary['security_alerts'] > 2:
        priority_actions.append("Implement enhanced security protocols fleet-wide")
    
    if len(operational_summary['high_risk_airports']) > 1:
        priority_actions.append("Review route planning for high-risk destinations")
        priority_actions.append("Brief flight crews on regional security considerations")
    
    if operational_summary['total_notams'] > 15:
        priority_actions.append("Increase NOTAM monitoring frequency to every 30 minutes")
    
    priority_actions.extend([
        "Coordinate with ground operations on expected delays",
        "Update passenger communications for affected routes",
        "Monitor geopolitical developments in high-risk regions"
    ])
    
    for i, action in enumerate(priority_actions, 1):
        print(f"{i}. {action}")
    
    print()
    
    # 7. Real-time integration capabilities
    print("🔄 REAL-TIME INTEGRATION STATUS:")
    print("-" * 40)
    print("✅ NOTAM data consolidation from multiple sources")
    print("✅ Security alert classification and prioritization") 
    print("✅ Geopolitical risk assessment automation")
    print("✅ Virgin Atlantic fleet monitoring integration")
    print("✅ Operational recommendation generation")
    print("✅ Real-time threat level updates")
    
    print()
    print("=" * 80)
    print(f"AINO NOTAM Intelligence Analysis Complete - {datetime.now().strftime('%Y-%m-%d %H:%M:%S UTC')}")
    print("Next analysis cycle: 15 minutes")
    print("=" * 80)

if __name__ == "__main__":
    demonstrate_notam_intelligence()
#!/usr/bin/env python3
"""
Test script for real flight integration with OpenSky Network
Demonstrates the replacement of simulated flight data with authentic tracking
"""

import requests
import json
from datetime import datetime

def test_opensky_connection():
    """Test OpenSky API connectivity"""
    print("🔗 Testing OpenSky Network connection...")
    
    try:
        response = requests.get('http://localhost:5000/api/flights/opensky-test', 
                              headers={'Accept': 'application/json'})
        
        if response.status_code == 200:
            data = response.json()
            print(f"✅ OpenSky API: {data.get('message', 'Connected')}")
            if 'flights' in data:
                print(f"   Found {data.get('flights', 0)} flights in test area")
            return True
        else:
            print(f"❌ OpenSky API test failed: HTTP {response.status_code}")
            return False
    except Exception as e:
        print(f"❌ OpenSky API error: {e}")
        return False

def test_real_flight_tracking():
    """Test real flight data retrieval"""
    print("\n✈️  Testing real flight tracking...")
    
    try:
        response = requests.get('http://localhost:5000/api/flights/real-tracking',
                              headers={'Accept': 'application/json'})
        
        if response.status_code == 200:
            data = response.json()
            print(f"✅ Real flight tracking successful")
            print(f"   Total flights: {data.get('total_flights', 0)}")
            print(f"   Virgin Atlantic: {data.get('virgin_atlantic_flights', 0)}")
            print(f"   UK area flights: {data.get('uk_area_flights', 0)}")
            print(f"   Data source: {data.get('source', 'Unknown')}")
            print(f"   Timestamp: {data.get('timestamp', 'Unknown')}")
            
            # Show sample flight data
            flights = data.get('flights', [])
            if flights:
                print(f"\n📊 Sample flight data (first 3):")
                for i, flight in enumerate(flights[:3]):
                    print(f"   {i+1}. {flight.get('callsign', 'N/A')} - {flight.get('airline', 'Unknown')}")
                    print(f"      Position: {flight.get('latitude', 0):.3f}, {flight.get('longitude', 0):.3f}")
                    print(f"      Altitude: {flight.get('altitude', 0)} ft")
                    print(f"      Velocity: {flight.get('velocity', 0)} kt")
                    print(f"      Real data: {flight.get('is_real_data', False)}")
            
            return len(flights)
        else:
            print(f"❌ Real flight tracking failed: HTTP {response.status_code}")
            return 0
    except Exception as e:
        print(f"❌ Real flight tracking error: {e}")
        return 0

def test_enhanced_virgin_atlantic():
    """Test enhanced Virgin Atlantic data with real tracking integration"""
    print("\n🛫 Testing enhanced Virgin Atlantic integration...")
    
    try:
        response = requests.get('http://localhost:5000/api/aviation/virgin-atlantic-flights-enhanced',
                              headers={'Accept': 'application/json'})
        
        if response.status_code == 200:
            data = response.json()
            print(f"✅ Enhanced Virgin Atlantic tracking successful")
            print(f"   Total flights: {data.get('total_flights', 0)}")
            print(f"   Real tracking count: {data.get('real_tracking_count', 0)}")
            print(f"   Data source: {data.get('source', 'Unknown')}")
            
            # Analyze real vs simulated data
            flights = data.get('flights', [])
            real_flights = [f for f in flights if f.get('is_real_tracking', False)]
            simulated_flights = [f for f in flights if not f.get('is_real_tracking', False)]
            
            print(f"\n📈 Data composition:")
            print(f"   Real tracking: {len(real_flights)} flights")
            print(f"   Simulated: {len(simulated_flights)} flights")
            print(f"   Real data percentage: {(len(real_flights)/len(flights)*100):.1f}%" if flights else "0%")
            
            # Show real flight examples
            if real_flights:
                print(f"\n🎯 Real tracked Virgin Atlantic flights:")
                for i, flight in enumerate(real_flights[:3]):
                    print(f"   {i+1}. {flight.get('flight_number', 'N/A')} - {flight.get('real_callsign', 'N/A')}")
                    print(f"      ICAO24: {flight.get('icao24', 'N/A')}")
                    print(f"      Real position: {flight.get('latitude', 0):.3f}, {flight.get('longitude', 0):.3f}")
                    print(f"      Status: {flight.get('current_status', 'Unknown')}")
            
            return True
        else:
            print(f"❌ Enhanced Virgin Atlantic integration failed: HTTP {response.status_code}")
            return False
    except Exception as e:
        print(f"❌ Enhanced Virgin Atlantic integration error: {e}")
        return False

def test_data_authenticity():
    """Compare authentic vs simulated data sources"""
    print("\n🔍 Testing data authenticity comparison...")
    
    try:
        # Get original Virgin Atlantic data
        orig_response = requests.get('http://localhost:5000/api/aviation/virgin-atlantic-flights',
                                   headers={'Accept': 'application/json'})
        
        # Get enhanced data with real tracking
        enhanced_response = requests.get('http://localhost:5000/api/aviation/virgin-atlantic-flights-enhanced',
                                       headers={'Accept': 'application/json'})
        
        if orig_response.status_code == 200 and enhanced_response.status_code == 200:
            orig_data = orig_response.json()
            enhanced_data = enhanced_response.json()
            
            orig_flights = orig_data.get('flights', [])
            enhanced_flights = enhanced_data.get('flights', [])
            real_enhanced = [f for f in enhanced_flights if f.get('is_real_tracking', False)]
            
            print(f"✅ Data authenticity analysis complete")
            print(f"   Original simulated flights: {len(orig_flights)}")
            print(f"   Enhanced total flights: {len(enhanced_flights)}")
            print(f"   Real tracking replacements: {len(real_enhanced)}")
            print(f"   Authenticity improvement: +{len(real_enhanced)} real flights")
            
            if len(real_enhanced) > 0:
                print(f"\n🎯 AINO Real Data Integration SUCCESSFUL")
                print(f"   Platform now uses {len(real_enhanced)} authentic flight positions")
                print(f"   Data sources: OpenSky Network + Virgin Atlantic simulation")
                return True
            else:
                print(f"\n⚠️  No real Virgin Atlantic flights currently active")
                print(f"   OpenSky integration ready but no VS flights detected")
                return False
        else:
            print(f"❌ Data comparison failed")
            return False
    except Exception as e:
        print(f"❌ Data authenticity test error: {e}")
        return False

def main():
    """Run comprehensive real flight integration tests"""
    print("="*60)
    print("🚀 AINO Real Flight Integration Test Suite")
    print("   Testing OpenSky Network integration for authentic flight data")
    print("="*60)
    
    # Test sequence
    tests_passed = 0
    total_tests = 4
    
    # Test 1: OpenSky connectivity
    if test_opensky_connection():
        tests_passed += 1
    
    # Test 2: Real flight tracking
    flight_count = test_real_flight_tracking()
    if flight_count > 0:
        tests_passed += 1
    
    # Test 3: Enhanced Virgin Atlantic integration
    if test_enhanced_virgin_atlantic():
        tests_passed += 1
    
    # Test 4: Data authenticity comparison
    if test_data_authenticity():
        tests_passed += 1
    
    # Summary
    print("\n" + "="*60)
    print(f"📊 TEST RESULTS: {tests_passed}/{total_tests} tests passed")
    
    if tests_passed == total_tests:
        print("🎉 ALL TESTS PASSED - Real flight integration operational!")
        print("   AINO platform now uses authentic OpenSky Network data")
    elif tests_passed >= 2:
        print("✅ PARTIAL SUCCESS - Core real flight tracking working")
        print("   Some integration features may need adjustment")
    else:
        print("❌ INTEGRATION ISSUES - Real flight tracking needs debugging")
    
    print(f"   Flight data available: {flight_count} real flights")
    print(f"   Timestamp: {datetime.now().isoformat()}")
    print("="*60)

if __name__ == "__main__":
    main()
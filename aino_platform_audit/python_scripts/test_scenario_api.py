#!/usr/bin/env python3
"""
Test script for the Enhanced Scenario Simulator
Validates functionality and creates sample scenarios for the AINO platform
"""

import json
from enhanced_scenario_simulator import EnhancedScenarioSimulator

def test_scenario_simulator():
    """Test the scenario simulator with different aircraft types and failure scenarios"""
    
    print("🔍 Testing Enhanced Scenario Simulator for AINO Platform")
    print("=" * 60)
    
    # Test scenarios for Virgin Atlantic fleet
    test_cases = [
        {
            "name": "A350-1000 Engine Failure (VS3 LHR-JFK)",
            "aircraft_type": "A350-1000",
            "origin": "LHR",
            "destination": "JFK",
            "position_nm": 1700,
            "altitude": 37000,
            "flight_number": "VS3",
            "registration": "G-VLUX",
            "failure_type": "engine_failure"
        },
        {
            "name": "B787-9 Decompression (VS103 LHR-ATL)",
            "aircraft_type": "B787-9",
            "origin": "LHR",
            "destination": "ATL",
            "position_nm": 2100,
            "altitude": 39000,
            "flight_number": "VS103",
            "registration": "G-VBOW",
            "failure_type": "decompression"
        },
        {
            "name": "A330-300 Hydraulic Failure (VS127 MAN-JFK)",
            "aircraft_type": "A330-300",
            "origin": "MAN",
            "destination": "JFK",
            "position_nm": 1500,
            "altitude": 35000,
            "flight_number": "VS127",
            "registration": "G-VSXY",
            "failure_type": "hydraulic_failure"
        }
    ]
    
    results = []
    
    for i, test_case in enumerate(test_cases, 1):
        print(f"\n🧪 Test {i}: {test_case['name']}")
        print("-" * 50)
        
        try:
            # Initialize simulator
            sim = EnhancedScenarioSimulator(
                aircraft_type=test_case["aircraft_type"],
                origin=test_case["origin"],
                destination=test_case["destination"],
                position_nm_from_origin=test_case["position_nm"],
                altitude_ft=test_case["altitude"],
                flight_number=test_case["flight_number"],
                registration=test_case["registration"]
            )
            
            # Run simulation
            result = sim.simulate_failure(test_case["failure_type"])
            
            # Display key results
            print(f"✅ Simulation successful")
            print(f"   📊 Scenario ID: {result['scenario_id']}")
            print(f"   🎯 Failure Type: {result['failure']['type']}")
            print(f"   🔥 Severity: {result['failure']['severity']}")
            print(f"   🛫 Flight Phase: {result['position']['phase_of_flight']}")
            print(f"   ⛽ Fuel Impact: {result['operational_impact']['fuel_penalty_factor']}x")
            print(f"   🚨 Diversion Required: {result['operational_impact']['diversion_required']}")
            print(f"   🎯 AINO Recommendations: {len(result['aino_recommendations'])} items")
            print(f"   📄 Crew Actions: {len(result['crew_actions'])} steps")
            
            # Export scenario
            filename = sim.export_scenario()
            if filename:
                print(f"   💾 Exported: {filename}")
            
            results.append({
                "test_case": test_case["name"],
                "success": True,
                "scenario_id": result['scenario_id'],
                "severity": result['failure']['severity'],
                "filename": filename
            })
            
        except Exception as e:
            print(f"❌ Simulation failed: {e}")
            results.append({
                "test_case": test_case["name"],
                "success": False,
                "error": str(e)
            })
    
    # Summary
    print(f"\n📈 Test Summary")
    print("=" * 60)
    successful = sum(1 for r in results if r['success'])
    print(f"✅ Successful simulations: {successful}/{len(results)}")
    print(f"❌ Failed simulations: {len(results) - successful}/{len(results)}")
    
    if successful > 0:
        print(f"\n🎯 Generated scenario files:")
        for result in results:
            if result['success'] and 'filename' in result:
                print(f"   • {result['filename']}")
    
    # API Test Format
    print(f"\n🔌 API Test Format")
    print("-" * 30)
    print("Sample POST request to /api/scenario/simulate:")
    api_example = {
        "aircraftType": "A350-1000",
        "origin": "LHR",
        "destination": "JFK",
        "positionNm": 1700,
        "altitudeFt": 37000,
        "flightNumber": "VS3",
        "registration": "G-VLUX",
        "failureType": "engine_failure"
    }
    print(json.dumps(api_example, indent=2))
    
    return results

if __name__ == "__main__":
    test_scenario_simulator()
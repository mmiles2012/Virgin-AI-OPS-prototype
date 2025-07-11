#!/usr/bin/env python3
"""
API Demonstration for failure_state structure
Shows how to generate the exact failure_state structure via API calls
"""

import json
import requests
from enhanced_scenario_simulator import EnhancedScenarioSimulator

def generate_failure_state_via_api():
    """Generate failure_state structure via API simulation"""
    
    print("🔌 AINO Platform API Demo: failure_state Generation")
    print("=" * 60)
    
    # API request payload (what would be sent to /api/scenario/simulate)
    api_request = {
        "aircraftType": "A330-300",
        "origin": "LHR",
        "destination": "JFK",
        "positionNm": 1800,
        "altitudeFt": 37000,
        "flightNumber": "VS127",
        "registration": "G-VSXY",
        "failureType": "engine_failure"
    }
    
    print("📤 API Request to /api/scenario/simulate:")
    print(json.dumps(api_request, indent=2))
    
    # Simulate API response using the enhanced scenario simulator
    print("\n⚙️ Processing scenario...")
    
    sim = EnhancedScenarioSimulator(
        aircraft_type=api_request["aircraftType"],
        origin=api_request["origin"],
        destination=api_request["destination"],
        position_nm_from_origin=api_request["positionNm"],
        altitude_ft=api_request["altitudeFt"],
        flight_number=api_request["flightNumber"],
        registration=api_request["registration"]
    )
    
    result = sim.simulate_failure(api_request["failureType"])
    
    # Extract failure_state structure from API response
    systems_mapping = {
        "HYD 2": "hydraulics_2",
        "GEN 2": "gen_2", 
        "BLEED 2": "bleed_2"
    }
    
    mapped_systems = [systems_mapping.get(sys, sys.lower().replace(" ", "_")) for sys in result['systems_affected']['primary_systems_lost']]
    
    # Generate the exact failure_state structure
    failure_state = {
        "type": result['failure']['type'],
        "aircraft_type": result['aircraft']['type'],
        "initial_altitude": result['position']['initial_altitude_ft'],
        "drift_down_altitude": result['position']['adjusted_altitude_ft'],
        "expected_fuel_burn_penalty_per_hour": result['fuel_analysis']['expected_fuel_burn_penalty_per_hour'],
        "systems_affected": mapped_systems,
        "diversion_required": result['operational_impact']['diversion_required']
    }
    
    print("\n📥 API Response - failure_state:")
    print(json.dumps(failure_state, indent=2))
    
    # Show additional operational intelligence from full response
    print("\n🧠 Additional Operational Intelligence:")
    print(f"   🔥 Severity: {result['failure']['severity']}")
    print(f"   🛫 Flight Phase: {result['position']['phase_of_flight']}")
    print(f"   🏃 Crew Actions: {len(result['crew_actions'])} steps")
    print(f"   🎯 AINO Recommendations: {len(result['aino_recommendations'])} items")
    print(f"   🛩️ Suitable Diversion Airports: {len(result['diversion_analysis']['suitable_airports'])} available")
    
    # Show sample crew actions
    print(f"\n📋 Sample Crew Actions:")
    for i, action in enumerate(result['crew_actions'][:3], 1):
        print(f"   {i}. {action}")
    
    # Show sample AINO recommendations
    print(f"\n🎯 Sample AINO Recommendations:")
    for i, rec in enumerate(result['aino_recommendations'][:3], 1):
        print(f"   {i}. {rec}")
    
    # API usage examples
    print(f"\n🌐 AINO Platform API Endpoints:")
    print(f"   POST /api/scenario/simulate - Generate custom failure scenarios")
    print(f"   GET /api/scenario/aircraft-types - List available aircraft")
    print(f"   GET /api/scenario/failure-types - List failure types")
    print(f"   GET /api/scenario/quick-demo/A330-300/engine_failure - Quick demo")
    
    return failure_state

def validate_failure_state_structure(failure_state):
    """Validate the generated failure_state structure"""
    
    print(f"\n✅ Validation Results:")
    
    required_fields = [
        "type", "aircraft_type", "initial_altitude", "drift_down_altitude",
        "expected_fuel_burn_penalty_per_hour", "systems_affected", "diversion_required"
    ]
    
    validation_results = []
    
    for field in required_fields:
        if field in failure_state:
            validation_results.append(f"✅ {field}: Present")
        else:
            validation_results.append(f"❌ {field}: Missing")
    
    # Type validations
    if isinstance(failure_state.get("initial_altitude"), int):
        validation_results.append("✅ initial_altitude: Integer type")
    else:
        validation_results.append("❌ initial_altitude: Not integer")
    
    if isinstance(failure_state.get("expected_fuel_burn_penalty_per_hour"), float):
        validation_results.append("✅ expected_fuel_burn_penalty_per_hour: Float type")
    else:
        validation_results.append("❌ expected_fuel_burn_penalty_per_hour: Not float")
    
    if isinstance(failure_state.get("systems_affected"), list):
        validation_results.append("✅ systems_affected: List type")
    else:
        validation_results.append("❌ systems_affected: Not list")
    
    if isinstance(failure_state.get("diversion_required"), bool):
        validation_results.append("✅ diversion_required: Boolean type")
    else:
        validation_results.append("❌ diversion_required: Not boolean")
    
    for result in validation_results:
        print(f"   {result}")
    
    return all("✅" in result for result in validation_results)

if __name__ == "__main__":
    try:
        failure_state = generate_failure_state_via_api()
        is_valid = validate_failure_state_structure(failure_state)
        
        if is_valid:
            print(f"\n🎉 SUCCESS: failure_state structure generated and validated!")
        else:
            print(f"\n⚠️ WARNING: Some validation issues detected")
            
    except Exception as e:
        print(f"\n❌ ERROR: {e}")
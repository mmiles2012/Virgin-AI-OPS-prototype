#!/usr/bin/env python3
"""
Test A330-300 Engine Failure Scenario to match user specifications
Validates failure_state structure with exact requirements
"""

import json
from enhanced_scenario_simulator import EnhancedScenarioSimulator

def test_a330_engine_failure():
    """Test A330-300 engine failure scenario to match user specifications"""
    
    print("🧪 Testing A330-300 Engine Failure Scenario")
    print("=" * 50)
    
    # Expected failure_state structure from user
    expected_failure_state = {
        "type": "engine_failure",
        "aircraft_type": "A330-300",
        "initial_altitude": 37000,
        "drift_down_altitude": 27000,
        "expected_fuel_burn_penalty_per_hour": 0.22,  # 22% higher than nominal
        "systems_affected": ["hydraulics_2", "gen_2", "bleed_2"],
        "diversion_required": True
    }
    
    print(f"Expected failure_state structure:")
    print(json.dumps(expected_failure_state, indent=2))
    
    # Test with A330-300 scenario
    try:
        sim = EnhancedScenarioSimulator(
            aircraft_type="A330-300",
            origin="LHR",
            destination="JFK",
            position_nm_from_origin=1800,
            altitude_ft=37000,
            flight_number="VS127",
            registration="G-VSXY"
        )
        
        result = sim.simulate_failure("engine_failure")
        
        print(f"\n✅ Generated scenario results:")
        print(f"   🎯 Failure Type: {result['failure']['type']}")
        print(f"   🛩️ Aircraft Type: {result['aircraft']['type']}")
        print(f"   🏔️ Initial Altitude: {result['position']['initial_altitude_ft']} ft")
        print(f"   ⬇️ Drift Down Altitude: {result['position']['adjusted_altitude_ft']} ft")
        print(f"   ⛽ Fuel Penalty Factor: {result['fuel_analysis']['fuel_penalty_factor']}")
        print(f"   ⛽ Expected Fuel Burn Penalty/Hour: {result['fuel_analysis']['expected_fuel_burn_penalty_per_hour']}")
        print(f"   🔧 Systems Affected: {result['systems_affected']['primary_systems_lost']}")
        print(f"   🛫 Diversion Required: {result['operational_impact']['diversion_required']}")
        
        # Validate against expected values
        validation_results = []
        
        # Check failure type
        if result['failure']['type'] == expected_failure_state['type']:
            validation_results.append("✅ Failure type matches")
        else:
            validation_results.append("❌ Failure type mismatch")
        
        # Check initial altitude
        if result['position']['initial_altitude_ft'] == expected_failure_state['initial_altitude']:
            validation_results.append("✅ Initial altitude matches")
        else:
            validation_results.append("❌ Initial altitude mismatch")
        
        # Check drift down altitude
        if result['position']['adjusted_altitude_ft'] == expected_failure_state['drift_down_altitude']:
            validation_results.append("✅ Drift down altitude matches")
        else:
            validation_results.append("❌ Drift down altitude mismatch")
        
        # Check fuel burn penalty
        if abs(result['fuel_analysis']['expected_fuel_burn_penalty_per_hour'] - expected_failure_state['expected_fuel_burn_penalty_per_hour']) < 0.01:
            validation_results.append("✅ Fuel burn penalty matches")
        else:
            validation_results.append("❌ Fuel burn penalty mismatch")
        
        # Check systems affected (map to user format)
        systems_mapping = {
            "HYD 2": "hydraulics_2",
            "GEN 2": "gen_2", 
            "BLEED 2": "bleed_2"
        }
        
        mapped_systems = [systems_mapping.get(sys, sys.lower()) for sys in result['systems_affected']['primary_systems_lost']]
        if set(mapped_systems) == set(expected_failure_state['systems_affected']):
            validation_results.append("✅ Systems affected match")
        else:
            validation_results.append("❌ Systems affected mismatch")
        
        # Check diversion required
        if result['operational_impact']['diversion_required'] == expected_failure_state['diversion_required']:
            validation_results.append("✅ Diversion requirement matches")
        else:
            validation_results.append("❌ Diversion requirement mismatch")
        
        print(f"\n📊 Validation Results:")
        for validation in validation_results:
            print(f"   {validation}")
        
        # Generate failure_state structure matching user format
        generated_failure_state = {
            "type": result['failure']['type'],
            "aircraft_type": result['aircraft']['type'],
            "initial_altitude": result['position']['initial_altitude_ft'],
            "drift_down_altitude": result['position']['adjusted_altitude_ft'],
            "expected_fuel_burn_penalty_per_hour": result['fuel_analysis']['expected_fuel_burn_penalty_per_hour'],
            "systems_affected": mapped_systems,
            "diversion_required": result['operational_impact']['diversion_required']
        }
        
        print(f"\n🎯 Generated failure_state structure:")
        print(json.dumps(generated_failure_state, indent=2))
        
        # Export full scenario
        filename = sim.export_scenario()
        print(f"\n💾 Full scenario exported to: {filename}")
        
        return True
        
    except Exception as e:
        print(f"❌ Test failed: {e}")
        return False

if __name__ == "__main__":
    test_a330_engine_failure()
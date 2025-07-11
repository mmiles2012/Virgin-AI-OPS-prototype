#!/usr/bin/env python3
"""
Test script for Aircraft Failure Modeling System
Validates all failure types and ML export functionality
"""

from failure_model import AircraftTwin
import json

def test_basic_functionality():
    """Test basic aircraft twin functionality"""
    print("🔧 Testing Basic Aircraft Twin Functionality")
    print("=" * 50)
    
    # Test B787-9 as requested
    twin = AircraftTwin("B787-9")
    twin.apply_failure("hydraulic_failure")
    ml_data = twin.export_for_ml()
    
    # Validate key data fields
    assert ml_data["aircraft_type"] == "B787-9"
    assert ml_data["hydraulic_pressure_a"] == 0.0  # System A failed
    assert ml_data["hydraulic_pressure_b"] == 3000.0  # System B normal
    assert ml_data["fuel_burn_multiplier"] == 1.15  # 15% increase
    assert ml_data["diversion_required"] == 1
    
    print("✅ Basic functionality test passed")
    return ml_data

def test_all_failure_types():
    """Test all failure types for comprehensive validation"""
    print("\n🔧 Testing All Failure Types")
    print("=" * 50)
    
    failure_types = [
        "hydraulic_failure",
        "engine_failure", 
        "electrical_failure",
        "pressurization_failure",
        "landing_gear_malfunction"
    ]
    
    twin = AircraftTwin("B787-9", "G-TEST1")
    results = {}
    
    for failure in failure_types:
        twin.reset_failures()
        twin.apply_failure(failure)
        ml_data = twin.export_for_ml()
        
        results[failure] = {
            "fuel_increase_pct": (ml_data["fuel_burn_multiplier"] - 1) * 100,
            "speed_reduction": ml_data["speed_reduction_knots"],
            "range_reduction": ml_data["range_reduction_percent"],
            "operational_score": ml_data["operational_capability_score"],
            "diversion_required": bool(ml_data["diversion_required"])
        }
        
        print(f"   {failure}: +{results[failure]['fuel_increase_pct']:.1f}% fuel, -{results[failure]['speed_reduction']}kt, Score: {results[failure]['operational_score']:.3f}")
    
    print("✅ All failure types test passed")
    return results

def test_fleet_compatibility():
    """Test compatibility across Virgin Atlantic fleet"""
    print("\n🔧 Testing Fleet Compatibility")
    print("=" * 50)
    
    fleet = [
        ("B787-9", "G-VBOB"),
        ("A350-1000", "G-VLUX"),
        ("A330-300", "G-VAHH")
    ]
    
    for aircraft_type, registration in fleet:
        twin = AircraftTwin(aircraft_type, registration)
        twin.apply_failure("hydraulic_failure")
        ml_data = twin.export_for_ml()
        
        # Validate aircraft-specific data
        assert ml_data["aircraft_id"] == registration
        assert ml_data["aircraft_type"] == aircraft_type
        assert ml_data["max_fuel_kg"] > 0
        assert ml_data["max_range_nm"] > 0
        
        print(f"   {aircraft_type} ({registration}): Fuel {ml_data['max_fuel_kg']:,}kg, Range {ml_data['max_range_nm']:,}nm")
    
    print("✅ Fleet compatibility test passed")

def test_ml_export_format():
    """Validate ML export data format and completeness"""
    print("\n🔧 Testing ML Export Format")
    print("=" * 50)
    
    twin = AircraftTwin("B787-9")
    twin.apply_failure("hydraulic_failure")
    ml_data = twin.export_for_ml()
    
    # Required ML fields
    required_fields = [
        "aircraft_id", "aircraft_type", "timestamp", "failure_timestamp",
        "active_failures", "num_failures", "max_fuel_kg", "max_range_nm",
        "hydraulic_pressure_a", "hydraulic_pressure_b", "hydraulic_pressure_c",
        "fuel_burn_multiplier", "speed_reduction_knots", "altitude_restriction_ft",
        "range_reduction_percent", "diversion_required", "operational_capability_score"
    ]
    
    missing_fields = [field for field in required_fields if field not in ml_data]
    assert not missing_fields, f"Missing fields: {missing_fields}"
    
    # Validate data types
    assert isinstance(ml_data["num_failures"], int)
    assert isinstance(ml_data["fuel_burn_multiplier"], float)
    assert isinstance(ml_data["operational_capability_score"], float)
    assert 0 <= ml_data["operational_capability_score"] <= 1
    
    print(f"   ✅ All {len(required_fields)} required fields present")
    print(f"   ✅ Data types validated")
    print(f"   ✅ Operational score within range: {ml_data['operational_capability_score']:.3f}")
    
    return ml_data

def test_multi_failure_scenario():
    """Test multiple simultaneous failures"""
    print("\n🔧 Testing Multi-Failure Scenarios")
    print("=" * 50)
    
    twin = AircraftTwin("B787-9", "G-MULTI")
    
    # Apply multiple failures
    twin.apply_failure("hydraulic_failure")
    twin.apply_failure("electrical_failure")
    
    ml_data = twin.export_for_ml()
    
    assert ml_data["num_failures"] == 2
    assert "hydraulic_failure" in ml_data["active_failures"]
    assert "electrical_failure" in ml_data["active_failures"]
    
    # Multi-failure should have compounded impact
    assert ml_data["fuel_burn_multiplier"] > 1.4  # Should be more than single failure
    assert ml_data["operational_capability_score"] < 0.7  # Should be significantly degraded
    
    print(f"   ✅ Multi-failure impact: Fuel +{(ml_data['fuel_burn_multiplier'] - 1) * 100:.1f}%")
    print(f"   ✅ Operational degradation: {ml_data['operational_capability_score']:.3f}")
    
    return ml_data

def main():
    """Run comprehensive test suite"""
    print("🚀 AINO Aircraft Failure Modeling - Test Suite")
    print("=" * 60)
    
    try:
        # Run all tests
        basic_data = test_basic_functionality()
        failure_results = test_all_failure_types()
        test_fleet_compatibility()
        ml_data = test_ml_export_format()
        multi_failure_data = test_multi_failure_scenario()
        
        print("\n" + "=" * 60)
        print("🎉 ALL TESTS PASSED SUCCESSFULLY!")
        print("=" * 60)
        
        print(f"\n📊 Test Summary:")
        print(f"   • Aircraft types tested: 3 (B787-9, A350-1000, A330-300)")
        print(f"   • Failure types validated: 5")
        print(f"   • ML export fields: {len(ml_data)} comprehensive features")
        print(f"   • Multi-failure capability: ✅ Validated")
        
        print(f"\n💡 Sample ML Data Structure:")
        sample_fields = ["aircraft_type", "fuel_burn_multiplier", "operational_capability_score", "diversion_required"]
        for field in sample_fields:
            print(f"   {field}: {ml_data[field]}")
            
        return True
        
    except Exception as e:
        print(f"\n❌ TEST FAILED: {e}")
        return False

if __name__ == "__main__":
    success = main()
    exit(0 if success else 1)
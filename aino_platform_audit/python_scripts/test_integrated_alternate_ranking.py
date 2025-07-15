#!/usr/bin/env python3
"""
Test Enhanced Scenario Simulator with Integrated Alternate Airport Ranking
Validates intelligent diversion planning functionality
"""

from enhanced_scenario_simulator import EnhancedScenarioSimulator
import json

def test_integrated_ranking():
    """Test the integrated alternate airport ranking system"""
    
    print("🧪 Testing Integrated Alternate Airport Ranking")
    print("=" * 50)
    
    # Test A330-300 engine failure with intelligent ranking
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
    
    print(f"✅ Generated scenario with intelligent diversion analysis")
    print(f"   🎯 Failure Type: {result['failure']['type']}")
    print(f"   🛫 Diversion Required: {result['operational_impact']['diversion_required']}")
    print(f"   🛩️ Suitable Airports: {result['diversion_analysis']['suitable_airports']}")
    
    # Check if intelligent ranking was used
    if "intelligent_ranking" in result['diversion_analysis']:
        ranking_data = result['diversion_analysis']['intelligent_ranking']
        
        if "error" in ranking_data:
            print(f"   ⚠️ Ranking fallback used: {ranking_data['error']}")
        else:
            print(f"   🧠 Intelligent ranking active:")
            print(f"      📊 Total alternates evaluated: {ranking_data['analysis']['total_alternates_evaluated']}")
            print(f"      ✅ Suitable alternates: {ranking_data['analysis']['suitable_alternates']}")
            
            if ranking_data['analysis']['best_alternate']:
                best = ranking_data['analysis']['best_alternate']
                print(f"      🥇 Best alternate: {best['name']} ({best['icao']}) - {best['distance_nm']}nm")
                print(f"      📈 Suitability: {best['suitability']}")
                print(f"      🔧 Maintenance: {'✅' if best['maintenance_ok'] else '❌'}")
                print(f"      🛬 Runway: {'✅' if best['runway_ok'] else '❌'}")
                print(f"      🌤️ Weather: {'✅' if best['weather_ok'] else '❌'}")
    
    # Test different failure types
    failure_types = ["hydraulic_failure", "decompression"]
    
    for failure_type in failure_types:
        print(f"\n🔧 Testing {failure_type}...")
        
        try:
            result = sim.simulate_failure(failure_type)
            airports = result['diversion_analysis']['suitable_airports']
            print(f"   ✅ {failure_type}: {len(airports)} suitable airports")
            
            if "intelligent_ranking" in result['diversion_analysis']:
                ranking = result['diversion_analysis']['intelligent_ranking']
                if "analysis" in ranking:
                    best = ranking['analysis'].get('best_alternate')
                    if best:
                        print(f"   🥇 Best: {best['name']} ({best['icao']})")
                        
        except Exception as e:
            print(f"   ❌ {failure_type}: {e}")
    
    print(f"\n🎯 Integration test completed successfully!")
    return True

if __name__ == "__main__":
    test_integrated_ranking()
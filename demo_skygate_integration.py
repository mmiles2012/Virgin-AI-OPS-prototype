"""
SkyGate Airport Service Integration Demonstration
Showcases enhanced diversion support capabilities with comprehensive airport intelligence
"""

import requests
import json
from datetime import datetime
from typing import Dict, List, Any

class SkyGateIntegrationDemo:
    """Demonstration of SkyGate airport service integration with AINO decision engine"""
    
    def __init__(self, base_url: str = "http://localhost:5000"):
        self.base_url = base_url
        self.demo_scenarios = self._initialize_scenarios()
    
    def _initialize_scenarios(self) -> List[Dict[str, Any]]:
        """Initialize realistic demonstration scenarios"""
        return [
            {
                "name": "Medical Emergency Over North Atlantic",
                "aircraft": "Boeing 787-9",
                "position": {"lat": 53.3498, "lon": -6.2603},  # Dublin area
                "emergency_type": "medical",
                "description": "Passenger experiencing cardiac emergency requiring immediate medical attention",
                "priority": "critical"
            },
            {
                "name": "Technical Issue Approaching London",
                "aircraft": "Airbus A350-1000",
                "position": {"lat": 51.4700, "lon": -0.4543},  # Heathrow area
                "emergency_type": "technical",
                "description": "Engine warning requiring precautionary landing",
                "priority": "high"
            },
            {
                "name": "Weather Diversion from Manchester",
                "aircraft": "Airbus A330-900",
                "position": {"lat": 53.3539, "lon": -2.2750},  # Manchester area
                "emergency_type": "weather",
                "description": "Severe thunderstorms preventing planned approach",
                "priority": "medium"
            },
            {
                "name": "Fuel Emergency Over Atlantic",
                "aircraft": "Boeing 787-9",
                "position": {"lat": 55.8642, "lon": -4.2518},  # Glasgow area
                "emergency_type": "fuel",
                "description": "Lower than expected fuel levels requiring nearest suitable airport",
                "priority": "high"
            }
        ]
    
    def demonstrate_comprehensive_integration(self):
        """Execute comprehensive demonstration of SkyGate integration"""
        print("=" * 80)
        print("SKYGATE AIRPORT SERVICE INTEGRATION DEMONSTRATION")
        print("=" * 80)
        print(f"Timestamp: {datetime.now().isoformat()}")
        print(f"Base URL: {self.base_url}")
        print()
        
        # Test basic service availability
        print("1. TESTING SERVICE AVAILABILITY")
        print("-" * 40)
        self._test_service_availability()
        print()
        
        # Demonstrate diversion scenarios
        print("2. DIVERSION SCENARIO ANALYSIS")
        print("-" * 40)
        for scenario in self.demo_scenarios:
            self._demonstrate_diversion_scenario(scenario)
            print()
        
        # Test route alternatives
        print("3. ROUTE ALTERNATIVES ANALYSIS")
        print("-" * 40)
        self._demonstrate_route_alternatives()
        print()
        
        # Show integration benefits
        print("4. INTEGRATION BENEFITS SUMMARY")
        print("-" * 40)
        self._show_integration_benefits()
    
    def _test_service_availability(self):
        """Test SkyGate service endpoint availability"""
        try:
            # Test diversion airports endpoint
            response = requests.get(
                f"{self.base_url}/api/skygate/diversion-airports",
                params={"lat": 51.4700, "lon": -0.4543, "maxDistance": 500},
                timeout=10
            )
            
            if response.status_code == 200:
                data = response.json()
                print(f"✓ SkyGate service responding: {data.get('success', False)}")
                print(f"  Data source: {data.get('data_source', 'Unknown')}")
                print(f"  Timestamp: {data.get('timestamp', 'N/A')}")
                
                airports = data.get('diversion_airports', [])
                print(f"  Airport database accessible: {len(airports)} airports found")
            else:
                print(f"⚠ SkyGate service status: {response.status_code}")
                
        except Exception as e:
            print(f"⚠ SkyGate service connection error: {str(e)}")
            print("  Note: External SkyGate service may not be running")
    
    def _demonstrate_diversion_scenario(self, scenario: Dict[str, Any]):
        """Demonstrate diversion analysis for a specific scenario"""
        print(f"Scenario: {scenario['name']}")
        print(f"Aircraft: {scenario['aircraft']}")
        print(f"Emergency: {scenario['emergency_type'].upper()}")
        print(f"Priority: {scenario['priority'].upper()}")
        print(f"Description: {scenario['description']}")
        print()
        
        try:
            # Call enhanced decision engine with SkyGate integration
            response = requests.get(
                f"{self.base_url}/api/decision-engine/diversion-analysis",
                params={
                    "latitude": scenario["position"]["lat"],
                    "longitude": scenario["position"]["lon"],
                    "aircraft_type": scenario["aircraft"],
                    "emergency_type": scenario["emergency_type"]
                },
                timeout=15
            )
            
            if response.status_code == 200:
                analysis = response.json()
                
                if analysis.get('success'):
                    diversion_data = analysis.get('diversion_analysis', {})
                    
                    print("DECISION ENGINE ANALYSIS:")
                    print(f"  Risk Assessment: {diversion_data.get('risk_assessment', 'Unknown').upper()}")
                    print(f"  Decision Confidence: {diversion_data.get('decision_confidence', 0):.1%}")
                    
                    # Operational impact
                    impact = diversion_data.get('operational_impact', {})
                    print(f"  Estimated Delay: {impact.get('delay_estimate', 0)} minutes")
                    print(f"  Cost Impact: ${impact.get('cost_impact', 0):,}")
                    print(f"  Passenger Welfare: {impact.get('passenger_welfare', 'Standard').title()}")
                    
                    # Recommended diversion (if available)
                    recommended = diversion_data.get('recommended_diversion')
                    if recommended:
                        airport = recommended.get('airport', {})
                        print(f"  Recommended Airport: {airport.get('name', 'Unknown')}")
                        print(f"  Location: {airport.get('closest_big_city', 'Unknown')}")
                        print(f"  Suitability: {recommended.get('suitability_score', 'Unknown').title()}")
                        print(f"  ETA: {recommended.get('estimated_time', 0)} minutes")
                        print(f"  Fuel Required: {recommended.get('fuel_required', 0)} kg")
                    
                    # Alternative options
                    alternatives = diversion_data.get('alternative_options', [])
                    if alternatives:
                        print(f"  Alternative Options: {len(alternatives)} available")
                    
                    print(f"  Data Sources: {', '.join(analysis.get('data_sources', []))}")
                else:
                    print("⚠ Analysis failed - no decision data available")
            else:
                print(f"⚠ Decision engine error: {response.status_code}")
                
        except Exception as e:
            print(f"⚠ Decision analysis error: {str(e)}")
    
    def _demonstrate_route_alternatives(self):
        """Demonstrate route alternatives analysis"""
        print("Route Alternatives Analysis")
        print("Analyzing potential route modifications...")
        print()
        
        try:
            # Test route alternatives endpoint
            response = requests.get(
                f"{self.base_url}/api/decision-engine/route-alternatives/1",
                params={"reason": "weather", "priority": "high"},
                timeout=10
            )
            
            if response.status_code == 200:
                data = response.json()
                
                if data.get('success'):
                    route_analysis = data.get('route_alternatives', {})
                    original = route_analysis.get('original_route')
                    alternatives = route_analysis.get('alternatives', [])
                    
                    if original:
                        print(f"Original Route: {original.get('source', {}).get('name', 'Unknown')} → {original.get('destination', {}).get('name', 'Unknown')}")
                        print(f"Distance: {original.get('distance', 0)} km")
                    
                    if alternatives:
                        print(f"Alternative Routes Found: {len(alternatives)}")
                        for i, alt in enumerate(alternatives[:3]):
                            print(f"  Option {i+1}:")
                            print(f"    Distance Difference: {alt.get('distance_difference', 0)} km")
                            print(f"    Time Difference: {alt.get('estimated_time_difference', 0)} minutes")
                            print(f"    Decision Score: {alt.get('decision_score', 0)}/100")
                    
                    criteria = data.get('decision_criteria', {})
                    print(f"Analysis Method: {criteria.get('evaluation_method', 'Unknown')}")
                else:
                    print("⚠ Route analysis unavailable")
            else:
                print(f"⚠ Route alternatives service: {response.status_code}")
                
        except Exception as e:
            print(f"⚠ Route analysis error: {str(e)}")
    
    def _show_integration_benefits(self):
        """Display integration benefits and capabilities"""
        benefits = [
            "Real-time airport capability assessment",
            "Aircraft-specific runway compatibility analysis", 
            "Emergency readiness evaluation",
            "Multi-criteria diversion scoring",
            "Operational cost impact calculations",
            "Authenticated airport data sources",
            "Professional aviation decision support",
            "Virgin Atlantic fleet optimization",
            "Comprehensive risk assessment",
            "Integration with existing AINO systems"
        ]
        
        print("SkyGate Integration Benefits:")
        for i, benefit in enumerate(benefits, 1):
            print(f"  {i:2d}. {benefit}")
        
        print()
        print("Technical Capabilities:")
        print("  • Django REST Framework backend integration")
        print("  • JWT authentication for secure access")
        print("  • Real-time data synchronization")
        print("  • React frontend with professional UI")
        print("  • TypeScript implementation for type safety")
        print("  • Comprehensive error handling and fallbacks")
        
        print()
        print("Decision Engine Enhancements:")
        print("  • Suitability scoring: excellent/good/acceptable/limited")
        print("  • Emergency readiness: full_capability/medical_available/basic")
        print("  • Aircraft compatibility: Boeing 787-9, A350-1000, A330 series")
        print("  • Cost-aware optimization with authentic operating costs")
        print("  • Risk-based prioritization for safety protocols")

def main():
    """Execute SkyGate integration demonstration"""
    try:
        demo = SkyGateIntegrationDemo()
        demo.demonstrate_comprehensive_integration()
        
        print()
        print("=" * 80)
        print("DEMONSTRATION COMPLETE")
        print("=" * 80)
        print("SkyGate airport service integration provides enhanced diversion")
        print("support capabilities for professional aviation operations.")
        print()
        print("Access the SkyGate Airport Dashboard in the AINO interface")
        print("to experience the full integration capabilities.")
        
    except KeyboardInterrupt:
        print("\nDemo interrupted by user")
    except Exception as e:
        print(f"\nDemo error: {str(e)}")

if __name__ == "__main__":
    main()
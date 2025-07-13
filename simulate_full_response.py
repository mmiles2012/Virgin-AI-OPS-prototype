"""
AINO Full Response Simulation System
Integrates scenario simulation, diversion planning, and operational actions
for comprehensive emergency response learning and decision support
"""

import json
import asyncio
from datetime import datetime
from typing import Dict, List, Any, Optional
import logging

# Import existing AINO components
from enhanced_scenario_simulator import EnhancedScenarioSimulator
from alternate_airport_ranking import AlternateAirportRanker
from failure_model import FailureModel

class AINOFullResponseSimulator:
    """
    Comprehensive response simulator integrating all AINO subsystems
    for unified emergency response and learning capabilities
    """
    
    def __init__(self):
        self.scenario_simulator = EnhancedScenarioSimulator()
        self.diversion_ranker = AlternateAirportRanker()
        self.failure_model = FailureModel()
        self.logger = logging.getLogger(__name__)
        
        # Initialize learning database
        self.response_history = []
        self.performance_metrics = {
            "total_simulations": 0,
            "successful_diversions": 0,
            "average_response_time": 0.0,
            "common_failure_patterns": {}
        }
    
    async def simulate_full_response(
        self, 
        aircraft_type: str, 
        origin: str, 
        destination: str, 
        position_nm_from_origin: float,
        altitude_ft: int, 
        failure_type: str,
        weather_conditions: Optional[Dict] = None,
        real_time_data: Optional[Dict] = None
    ) -> Dict[str, Any]:
        """
        Execute comprehensive emergency response simulation
        """
        start_time = datetime.utcnow()
        
        try:
            # Step 1: Generate comprehensive failure profile using digital twin
            failure_profile = await self._generate_failure_profile(
                aircraft_type, failure_type, altitude_ft, position_nm_from_origin
            )
            
            # Step 2: Simulate degraded aircraft performance
            performance_impact = await self._simulate_performance_degradation(
                aircraft_type, failure_profile, weather_conditions
            )
            
            # Step 3: Analyze diversion requirements and rank alternates
            diversion_analysis = await self._analyze_diversion_options(
                failure_profile, aircraft_type, origin, destination, 
                position_nm_from_origin, weather_conditions
            )
            
            # Step 4: Generate comprehensive operational action plan
            ops_action_plan = await self._generate_ops_action_plan(
                failure_profile, diversion_analysis, aircraft_type
            )
            
            # Step 5: Calculate fuel and time implications
            fuel_time_analysis = await self._calculate_fuel_time_impact(
                performance_impact, diversion_analysis, weather_conditions
            )
            
            # Step 6: Generate passenger impact assessment
            passenger_impact = await self._assess_passenger_impact(
                failure_profile, diversion_analysis, ops_action_plan
            )
            
            # Step 7: Create unified response package
            unified_response = {
                "simulation_id": f"AINO-{start_time.strftime('%Y%m%d-%H%M%S')}",
                "scenario": {
                    "aircraft": aircraft_type,
                    "route": f"{origin} to {destination}",
                    "position": f"{position_nm_from_origin}nm from {origin}",
                    "altitude": f"{altitude_ft}ft",
                    "failure": failure_type,
                    "weather": weather_conditions or "Standard conditions"
                },
                "failure_analysis": failure_profile,
                "performance_impact": performance_impact,
                "diversion_recommendations": diversion_analysis,
                "operational_actions": ops_action_plan,
                "fuel_time_analysis": fuel_time_analysis,
                "passenger_impact": passenger_impact,
                "confidence_score": self._calculate_confidence_score(
                    failure_profile, diversion_analysis, real_time_data
                ),
                "learning_insights": await self._generate_learning_insights(
                    failure_type, aircraft_type, diversion_analysis
                ),
                "timestamp_utc": start_time.isoformat() + "Z",
                "response_time_seconds": (datetime.utcnow() - start_time).total_seconds()
            }
            
            # Step 8: Store for learning system
            await self._store_simulation_result(unified_response)
            
            return unified_response
            
        except Exception as e:
            self.logger.error(f"Simulation failed: {str(e)}")
            return {
                "error": "Simulation failed",
                "message": str(e),
                "timestamp_utc": datetime.utcnow().isoformat() + "Z"
            }
    
    async def _generate_failure_profile(
        self, aircraft_type: str, failure_type: str, altitude: int, position: float
    ) -> Dict[str, Any]:
        """Generate detailed failure profile using digital twin data"""
        
        # Load aircraft-specific failure characteristics
        aircraft_profile = self.failure_model.get_aircraft_profile(aircraft_type)
        failure_characteristics = self.failure_model.get_failure_characteristics(failure_type)
        
        return {
            "type": failure_type,
            "aircraft_type": aircraft_type,
            "severity": failure_characteristics.get("severity", "MEDIUM"),
            "systems_affected": failure_characteristics.get("systems_affected", []),
            "initial_altitude": altitude,
            "drift_down_altitude": self._calculate_drift_down(aircraft_type, failure_type, altitude),
            "diversion_required": failure_characteristics.get("diversion_required", True),
            "expected_fuel_burn_penalty_per_hour": failure_characteristics.get("fuel_penalty", 15),
            "regulatory_considerations": failure_characteristics.get("regulatory", []),
            "passenger_impact_level": failure_characteristics.get("passenger_impact", "Medium"),
            "flight_phase": self._determine_flight_phase(position),
            "emergency_classification": self._classify_emergency(failure_type, altitude)
        }
    
    async def _simulate_performance_degradation(
        self, aircraft_type: str, failure_profile: Dict, weather: Optional[Dict]
    ) -> Dict[str, Any]:
        """Simulate aircraft performance impact"""
        
        base_performance = {
            "cruise_speed_reduction": 0,
            "fuel_burn_increase": 0,
            "altitude_restriction": None,
            "range_reduction": 0
        }
        
        # Apply failure-specific performance impacts
        failure_type = failure_profile["type"]
        
        if failure_type == "engine_failure":
            base_performance.update({
                "cruise_speed_reduction": 15,  # percent
                "fuel_burn_increase": 25,
                "altitude_restriction": 25000,  # single engine ceiling
                "range_reduction": 30
            })
        elif failure_type == "hydraulic_failure":
            base_performance.update({
                "cruise_speed_reduction": 5,
                "fuel_burn_increase": 10,
                "landing_distance_increase": 25
            })
        elif failure_type == "electrical_fault":
            base_performance.update({
                "navigation_capability": "reduced",
                "fuel_burn_increase": 8,
                "communication_impact": "degraded"
            })
        
        # Apply weather impacts
        if weather:
            weather_factor = weather.get("severity_multiplier", 1.0)
            base_performance["fuel_burn_increase"] *= weather_factor
            base_performance["cruise_speed_reduction"] *= weather_factor
        
        return base_performance
    
    async def _analyze_diversion_options(
        self, failure_profile: Dict, aircraft_type: str, origin: str, 
        destination: str, position: float, weather: Optional[Dict]
    ) -> Dict[str, Any]:
        """Analyze and rank diversion airports"""
        
        # Get ranked alternates from existing system
        alternates = self.diversion_ranker.rank_alternates(failure_profile, aircraft_type)
        
        # Enhanced analysis with weather and position factors
        enhanced_alternates = []
        for alternate in alternates[:5]:  # Top 5 options
            enhanced_alternate = {
                **alternate,
                "distance_from_current_position": self._calculate_distance_to_alternate(
                    origin, position, alternate["icao"]
                ),
                "weather_suitability": self._assess_weather_suitability(
                    alternate["icao"], weather, failure_profile
                ),
                "virgin_atlantic_support": alternate.get("virgin_atlantic_support", False),
                "estimated_diversion_time": self._calculate_diversion_time(
                    position, alternate, failure_profile
                ),
                "confidence_level": alternate.get("confidence", "HIGH")
            }
            enhanced_alternates.append(enhanced_alternate)
        
        return {
            "recommended_primary": enhanced_alternates[0] if enhanced_alternates else None,
            "all_options": enhanced_alternates,
            "diversion_required": failure_profile.get("diversion_required", True),
            "urgency_level": self._assess_diversion_urgency(failure_profile),
            "special_considerations": self._get_special_considerations(failure_profile)
        }
    
    async def _generate_ops_action_plan(
        self, failure_profile: Dict, diversion_analysis: Dict, aircraft_type: str
    ) -> Dict[str, Any]:
        """Generate comprehensive operational action plan"""
        
        actions = {
            "immediate_actions": [],
            "short_term_actions": [],
            "medium_term_actions": [],
            "coordination_actions": []
        }
        
        failure_type = failure_profile["type"]
        
        # Immediate actions (0-5 minutes)
        if failure_type == "engine_failure":
            actions["immediate_actions"].extend([
                "Execute engine failure checklist",
                "Configure for single-engine operations",
                "Declare emergency with ATC",
                "Begin drift-down procedure"
            ])
        elif failure_type == "medical_emergency":
            actions["immediate_actions"].extend([
                "Assess passenger condition",
                "Contact medical advisory service",
                "Prepare cabin for emergency",
                "Request priority handling"
            ])
        elif failure_type == "electrical_fault":
            actions["immediate_actions"].extend([
                "Execute electrical emergency checklist",
                "Switch to backup power systems",
                "Reduce electrical load",
                "Verify essential systems"
            ])
        
        # Coordination actions
        if diversion_analysis.get("diversion_required"):
            recommended_airport = diversion_analysis.get("recommended_primary", {})
            actions["coordination_actions"].extend([
                f"Coordinate with {recommended_airport.get('name', 'alternate airport')} operations",
                "Arrange ground services and medical support",
                "Notify Virgin Atlantic operations center",
                "Prepare passenger communications"
            ])
        
        return actions
    
    async def _calculate_fuel_time_impact(
        self, performance: Dict, diversion: Dict, weather: Optional[Dict]
    ) -> Dict[str, Any]:
        """Calculate fuel consumption and time implications"""
        
        base_fuel_flow = 2500  # kg/hour typical cruise
        base_time_remaining = 4.5  # hours typical Atlantic crossing
        
        # Apply performance degradation
        fuel_increase = performance.get("fuel_burn_increase", 0) / 100
        speed_reduction = performance.get("cruise_speed_reduction", 0) / 100
        
        modified_fuel_flow = base_fuel_flow * (1 + fuel_increase)
        modified_time = base_time_remaining * (1 + speed_reduction)
        
        # Diversion impact
        if diversion.get("diversion_required"):
            diversion_time = diversion.get("estimated_diversion_time", 1.5)
            modified_time = diversion_time
            modified_fuel_flow *= 1.2  # Additional fuel for approach/landing
        
        # Calculate estimated delay using ML if available
        estimated_delay_minutes = 90  # Default fallback
        total_cost_usd = 23000  # Conservative fallback
        
        try:
            from delay_predictor import predict_delay, estimate_cost
            
            # Prepare features for ML prediction
            input_features = {
                "aircraft": performance.get("aircraft_type", "A350-1000"),
                "failure_type": performance.get("failure_type", "engine_failure"),
                "origin": diversion.get("origin", "LHR"),
                "destination": diversion.get("destination", "JFK"),
                "position_nm": performance.get("position_nm", 1300),
                "altitude_ft": performance.get("altitude_ft", 37000),
                "diversion_icao": diversion.get("recommended_primary", {}).get("icao", "EINN"),
                "diversion_score": diversion.get("recommended_primary", {}).get("confidence_level", 0.8),
                "actions_issued": 6  # Typical number of operational actions
            }
            
            # Predict delay using trained ML model
            estimated_delay_minutes = predict_delay(input_features)
            total_cost_usd = estimate_cost(estimated_delay_minutes)
            
        except Exception as e:
            print(f"ML prediction unavailable, using fallback: {e}")
        
        return {
            "original_fuel_requirement": base_fuel_flow * base_time_remaining,
            "modified_fuel_requirement": modified_fuel_flow * modified_time,
            "additional_fuel_needed": (modified_fuel_flow * modified_time) - (base_fuel_flow * base_time_remaining),
            "original_flight_time": base_time_remaining,
            "modified_flight_time": modified_time,
            "estimated_delay_minutes": int(estimated_delay_minutes),
            "total_cost_estimate_usd": int(total_cost_usd),
            "cost_breakdown": {
                "delay_cost": int(estimated_delay_minutes * 100),
                "diversion_handling": 5000,
                "crew_disruption": 3000,
                "passenger_services": 15000
            },
            "fuel_remaining_margin": self._calculate_fuel_margin(modified_fuel_flow, modified_time)
        }
    
    async def _assess_passenger_impact(
        self, failure_profile: Dict, diversion: Dict, ops_plan: Dict
    ) -> Dict[str, Any]:
        """Assess impact on passengers and generate recommendations"""
        
        impact_level = failure_profile.get("passenger_impact_level", "Medium")
        passenger_count = 331  # A350-1000 typical capacity
        
        impact_assessment = {
            "severity": impact_level,
            "affected_passengers": passenger_count,
            "estimated_delay_hours": 0,
            "rebooking_required": False,
            "compensation_exposure": 0,
            "support_requirements": []
        }
        
        if diversion.get("diversion_required"):
            impact_assessment.update({
                "estimated_delay_hours": 12,  # Typical diversion delay
                "rebooking_required": True,
                "compensation_exposure": passenger_count * 600,  # EU261 estimates
                "support_requirements": [
                    "Hotel accommodation",
                    "Meal vouchers",
                    "Ground transportation",
                    "Rebooking assistance"
                ]
            })
        
        return impact_assessment
    
    def _calculate_confidence_score(
        self, failure_profile: Dict, diversion: Dict, real_time_data: Optional[Dict]
    ) -> float:
        """Calculate confidence score for recommendations"""
        
        base_confidence = 0.8
        
        # Adjust based on data quality
        if real_time_data:
            base_confidence += 0.1
        
        # Adjust based on failure type knowledge
        if failure_profile.get("type") in ["engine_failure", "hydraulic_failure"]:
            base_confidence += 0.05  # Well-understood scenarios
        
        # Adjust based on diversion airport quality
        if diversion.get("recommended_primary", {}).get("virgin_atlantic_support"):
            base_confidence += 0.05
        
        return min(base_confidence, 1.0)
    
    async def _generate_learning_insights(
        self, failure_type: str, aircraft_type: str, diversion: Dict
    ) -> Dict[str, Any]:
        """Generate insights for system learning"""
        
        return {
            "pattern_recognition": f"Similar {failure_type} scenarios in {aircraft_type}",
            "decision_factors": [
                "Failure severity and systems impact",
                "Distance to suitable alternates",
                "Weather conditions",
                "Virgin Atlantic support availability"
            ],
            "optimization_opportunities": [
                "Fuel planning for failure scenarios",
                "Crew training for specific failure types",
                "Ground support coordination"
            ],
            "success_metrics": {
                "response_time": "< 5 minutes for critical decisions",
                "diversion_accuracy": "> 95% suitable airport selection",
                "passenger_impact": "Minimize delay and compensation exposure"
            }
        }
    
    async def _store_simulation_result(self, result: Dict[str, Any]):
        """Store simulation result for learning system"""
        
        # Store in response history
        self.response_history.append({
            "timestamp": result["timestamp_utc"],
            "scenario": result["scenario"],
            "confidence": result.get("confidence_score", 0.8),
            "response_time": result.get("response_time_seconds", 0)
        })
        
        # Update performance metrics
        self.performance_metrics["total_simulations"] += 1
        if result.get("diversion_recommendations", {}).get("recommended_primary"):
            self.performance_metrics["successful_diversions"] += 1
        
        # Update average response time
        total_time = sum(r.get("response_time", 0) for r in self.response_history)
        self.performance_metrics["average_response_time"] = total_time / len(self.response_history)
        
        # Store simulation result for comprehensive logging and learning
        try:
            from logger import log_scenario_result
            log_scenario_result(result)
            print(f"✓ Simulation result logged: {result['simulation_id']}")
        except Exception as e:
            print(f"Warning: Failed to store simulation result: {e}")
    
    # Helper methods
    def _calculate_drift_down(self, aircraft_type: str, failure_type: str, current_altitude: int) -> int:
        """Calculate drift-down altitude for single engine"""
        if failure_type == "engine_failure":
            return min(current_altitude, 25000)  # Single engine ceiling
        return current_altitude
    
    def _determine_flight_phase(self, position_nm: float) -> str:
        """Determine current flight phase"""
        if position_nm < 200:
            return "DEPARTURE"
        elif position_nm > 2800:
            return "ARRIVAL"
        else:
            return "CRUISE"
    
    def _classify_emergency(self, failure_type: str, altitude: int) -> str:
        """Classify emergency severity"""
        if failure_type in ["decompression", "medical_emergency"]:
            return "MAYDAY"
        elif failure_type in ["engine_failure", "electrical_fault"]:
            return "PAN PAN"
        else:
            return "URGENT"
    
    def _calculate_distance_to_alternate(self, origin: str, position_nm: float, alternate_icao: str) -> float:
        """Calculate distance from current position to alternate"""
        # Simplified calculation - would use great circle in production
        return position_nm * 0.3  # Approximate for demo
    
    def _assess_weather_suitability(self, icao: str, weather: Optional[Dict], failure: Dict) -> str:
        """Assess weather suitability for alternate airport"""
        if not weather:
            return "SUITABLE"
        
        severity = weather.get("severity", "MODERATE")
        if severity in ["SEVERE", "EXTREME"]:
            return "MARGINAL"
        else:
            return "SUITABLE"
    
    def _calculate_diversion_time(self, position: float, alternate: Dict, failure: Dict) -> float:
        """Calculate estimated time to diversion airport"""
        distance = alternate.get("distance", 300)  # nm
        reduced_speed = 0.85  # Mach number with failure
        return distance / (reduced_speed * 450)  # Approximate time in hours
    
    def _assess_diversion_urgency(self, failure: Dict) -> str:
        """Assess urgency of diversion requirement"""
        severity = failure.get("severity", "MEDIUM")
        if severity == "CRITICAL":
            return "IMMEDIATE"
        elif severity == "HIGH":
            return "URGENT"
        else:
            return "PLANNED"
    
    def _get_special_considerations(self, failure: Dict) -> List[str]:
        """Get special considerations for failure type"""
        considerations = []
        failure_type = failure.get("type", "")
        
        if failure_type == "medical_emergency":
            considerations.append("Medical facilities required at destination")
        elif failure_type == "engine_failure":
            considerations.append("Single-engine approach procedures")
        elif failure_type == "electrical_fault":
            considerations.append("Visual approach capability may be required")
        
        return considerations
    
    def _calculate_fuel_margin(self, fuel_flow: float, flight_time: float) -> Dict[str, Any]:
        """Calculate fuel margins for safety"""
        total_fuel_required = fuel_flow * flight_time
        reserve_fuel = total_fuel_required * 0.1  # 10% reserve
        
        return {
            "total_required": total_fuel_required,
            "reserve_fuel": reserve_fuel,
            "safety_margin": "ADEQUATE" if reserve_fuel > 1000 else "TIGHT"
        }


# API Integration Function
async def simulate_full_response_api(
    aircraft_type: str, 
    origin: str, 
    destination: str, 
    position_nm_from_origin: float,
    altitude_ft: int, 
    failure_type: str,
    weather_conditions: Optional[Dict] = None
) -> Dict[str, Any]:
    """
    API-compatible function for full response simulation
    """
    simulator = AINOFullResponseSimulator()
    return await simulator.simulate_full_response(
        aircraft_type, origin, destination, position_nm_from_origin,
        altitude_ft, failure_type, weather_conditions
    )


# Example execution and testing
async def main():
    """Example execution of the full response simulator"""
    
    simulator = AINOFullResponseSimulator()
    
    # Test scenarios
    test_scenarios = [
        {
            "aircraft_type": "A350-1000",
            "origin": "LHR",
            "destination": "JFK", 
            "position_nm_from_origin": 1300,
            "altitude_ft": 37000,
            "failure_type": "engine_failure",
            "weather_conditions": {"severity": "MODERATE", "wind_speed": 25}
        },
        {
            "aircraft_type": "B787-9",
            "origin": "LHR", 
            "destination": "BOS",
            "position_nm_from_origin": 800,
            "altitude_ft": 41000,
            "failure_type": "medical_emergency"
        },
        {
            "aircraft_type": "A330-300",
            "origin": "LHR",
            "destination": "MCO",
            "position_nm_from_origin": 2100,
            "altitude_ft": 35000,
            "failure_type": "electrical_fault",
            "weather_conditions": {"severity": "SEVERE", "visibility": 0.5}
        }
    ]
    
    print("AINO Full Response Simulation System - Test Results")
    print("=" * 60)
    
    for i, scenario in enumerate(test_scenarios, 1):
        print(f"\nTest Scenario {i}:")
        print(f"Aircraft: {scenario['aircraft_type']}")
        print(f"Route: {scenario['origin']} → {scenario['destination']}")
        print(f"Failure: {scenario['failure_type']}")
        
        result = await simulator.simulate_full_response(**scenario)
        
        if "error" not in result:
            print(f"✅ Simulation completed successfully")
            print(f"   Confidence Score: {result.get('confidence_score', 0):.2f}")
            print(f"   Response Time: {result.get('response_time_seconds', 0):.1f}s")
            
            if result.get('diversion_recommendations', {}).get('recommended_primary'):
                airport = result['diversion_recommendations']['recommended_primary']
                print(f"   Recommended Diversion: {airport.get('name', 'Unknown')}")
            
        else:
            print(f"❌ Simulation failed: {result.get('message', 'Unknown error')}")
    
    print(f"\nSystem Performance Metrics:")
    print(f"Total Simulations: {simulator.performance_metrics['total_simulations']}")
    print(f"Successful Diversions: {simulator.performance_metrics['successful_diversions']}")
    print(f"Average Response Time: {simulator.performance_metrics['average_response_time']:.1f}s")


if __name__ == "__main__":
    import argparse
    import sys
    
    # Command line interface for API integration
    parser = argparse.ArgumentParser(description='AINO Full Response Simulation')
    parser.add_argument('--aircraft-type', required=True, help='Aircraft type (e.g., A350-1000)')
    parser.add_argument('--origin', required=True, help='Origin airport (e.g., LHR)')
    parser.add_argument('--destination', required=True, help='Destination airport (e.g., JFK)')
    parser.add_argument('--position', type=float, required=True, help='Position from origin in nautical miles')
    parser.add_argument('--altitude', type=int, required=True, help='Current altitude in feet')
    parser.add_argument('--failure-type', required=True, help='Type of failure scenario')
    parser.add_argument('--weather', default='{}', help='Weather conditions as JSON string')
    parser.add_argument('--real-time-data', default='{}', help='Real-time data as JSON string')
    
    args = parser.parse_args()
    
    try:
        import json
        weather_conditions = json.loads(args.weather) if args.weather != '{}' else None
        real_time_data = json.loads(args.real_time_data) if args.real_time_data != '{}' else None
        
        # Run simulation
        loop = asyncio.new_event_loop()
        asyncio.set_event_loop(loop)
        
        simulator = AINOFullResponseSimulator()
        result = loop.run_until_complete(
            simulator.simulate_full_response(
                aircraft_type=args.aircraft_type,
                origin=args.origin,
                destination=args.destination,
                position_nm_from_origin=args.position,
                altitude_ft=args.altitude,
                failure_type=args.failure_type,
                weather_conditions=weather_conditions,
                real_time_data=real_time_data
            )
        )
        
        # Output JSON result for API consumption
        print(json.dumps(result, indent=2))
        
    except Exception as e:
        error_result = {
            "error": "Simulation failed",
            "message": str(e),
            "timestamp_utc": datetime.utcnow().isoformat() + "Z"
        }
        print(json.dumps(error_result, indent=2))
        sys.exit(1)
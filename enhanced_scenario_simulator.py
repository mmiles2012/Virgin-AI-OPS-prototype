#!/usr/bin/env python3
"""
Enhanced Scenario Simulator for AINO Aviation Intelligence Platform
Integrates with digital twin profiles and failure modeling system
Provides comprehensive failure scenario simulation with operational intelligence
"""

import json
import os
import sys
from datetime import datetime, timedelta
from typing import Dict, List, Optional, Any
import logging

# Configure logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

class EnhancedScenarioSimulator:
    """
    Enhanced scenario simulator for AINO aviation intelligence platform
    Integrates with authentic digital twin profiles and operational data
    """
    
    def __init__(self, aircraft_type: str, origin: str, destination: str, 
                 position_nm_from_origin: float, altitude_ft: int, 
                 registration: str = None, flight_number: str = None):
        """
        Initialize scenario simulator with comprehensive flight parameters
        
        Args:
            aircraft_type: Aircraft type (A330-300, A350-1000, B787-9, A330-900)
            origin: Departure airport ICAO code
            destination: Arrival airport ICAO code
            position_nm_from_origin: Current position in nautical miles from origin
            altitude_ft: Current altitude in feet
            registration: Aircraft registration (optional)
            flight_number: Flight number (optional)
        """
        self.aircraft_type = aircraft_type
        self.origin = origin.upper()
        self.destination = destination.upper()
        self.position_nm_from_origin = position_nm_from_origin
        self.altitude_ft = altitude_ft
        self.registration = registration or "UNKNOWN"
        self.flight_number = flight_number or "UNKNOWN"
        
        # Load digital twin profile
        self.twin_profile = self.load_twin_profile(aircraft_type)
        
        # Initialize result container
        self.result = {}
        
        # Virgin Atlantic route database
        self.virgin_atlantic_routes = {
            'LHR-JFK': {'distance_nm': 3440, 'duration_hr': 8.5, 'freq_daily': 3},
            'LHR-ATL': {'distance_nm': 4200, 'duration_hr': 9.0, 'freq_daily': 2},
            'LHR-BOS': {'distance_nm': 3260, 'duration_hr': 8.0, 'freq_daily': 2},
            'LHR-LAX': {'distance_nm': 5440, 'duration_hr': 11.5, 'freq_daily': 1},
            'LHR-MIA': {'distance_nm': 4420, 'duration_hr': 9.5, 'freq_daily': 1},
            'LHR-MCO': {'distance_nm': 4150, 'duration_hr': 9.0, 'freq_daily': 2},
            'LHR-LAS': {'distance_nm': 5210, 'duration_hr': 11.0, 'freq_daily': 1},
            'LHR-SFO': {'distance_nm': 5350, 'duration_hr': 11.0, 'freq_daily': 1},
            'LHR-IAD': {'distance_nm': 3670, 'duration_hr': 8.5, 'freq_daily': 1},
            'MAN-ATL': {'distance_nm': 4180, 'duration_hr': 9.0, 'freq_daily': 1},
            'MAN-JFK': {'distance_nm': 3330, 'duration_hr': 8.0, 'freq_daily': 1},
            'LHR-DEL': {'distance_nm': 4180, 'duration_hr': 8.5, 'freq_daily': 1},
            'LHR-BOM': {'distance_nm': 4480, 'duration_hr': 9.0, 'freq_daily': 1}
        }
        
        logger.info(f"Enhanced Scenario Simulator initialized for {aircraft_type} on {origin}-{destination}")

    def load_twin_profile(self, aircraft_type: str) -> Dict:
        """
        Load digital twin profile from the profiles directory
        
        Args:
            aircraft_type: Aircraft type identifier
            
        Returns:
            Digital twin profile dictionary
        """
        # Normalize aircraft type for file naming
        normalized_type = aircraft_type.replace('-', '_')
        filename = f"{normalized_type}_digital_twin.json"
        
        # Check multiple possible locations
        possible_paths = [
            os.path.join("digital_twin_profiles", filename),
            os.path.join("attached_assets", "digital_twin_extracted", filename),
            filename  # Current directory
        ]
        
        for filepath in possible_paths:
            if os.path.exists(filepath):
                try:
                    with open(filepath, "r") as f:
                        profile = json.load(f)
                        logger.info(f"Loaded digital twin profile from {filepath}")
                        return profile
                except Exception as e:
                    logger.error(f"Error loading profile from {filepath}: {e}")
                    continue
        
        # If no profile found, create a basic fallback
        logger.warning(f"No digital twin profile found for {aircraft_type}, using fallback")
        return self.create_fallback_profile()

    def create_fallback_profile(self) -> Dict:
        """Create a basic fallback profile when specific aircraft profile isn't available"""
        return {
            "engine_failure": {
                "drift_down_altitude_ft": 25000,
                "fuel_penalty_factor": 1.2,
                "speed_knots": 300,
                "diversion_required": True,
                "systems_lost": ["GEN", "HYD", "BLEED"],
                "max_continuous_thrust": True
            },
            "decompression": {
                "descent_altitude_ft": 10000,
                "emergency_descent_rate_fpm": 3500,
                "fuel_penalty_factor": 1.25,
                "oxygen_duration_min_crew": 20,
                "oxygen_duration_min_cabin": 12
            },
            "hydraulic_failure": {
                "lost_systems": {"main": ["brakes", "gear", "flight_controls"]},
                "alternate_gear_extension_required": True,
                "landing_distance_factor": 1.25
            },
            "single_engine_landing": {
                "allowed": True,
                "autoland_restriction": True,
                "landing_distance_factor": 1.2,
                "fuel_penalty_factor": 1.15
            }
        }

    def simulate_failure(self, failure_type: str) -> Dict:
        """
        Simulate a specific failure scenario with comprehensive analysis
        
        Args:
            failure_type: Type of failure to simulate (engine_failure, decompression, 
                         hydraulic_failure, single_engine_landing)
                         
        Returns:
            Comprehensive failure scenario analysis
        """
        if failure_type not in self.twin_profile:
            raise ValueError(f"{failure_type} not found in digital twin profile for {self.aircraft_type}")
        
        failure = self.twin_profile[failure_type]
        route_key = f"{self.origin}-{self.destination}"
        route_info = self.virgin_atlantic_routes.get(route_key, {})
        
        # Calculate progress and remaining distance
        total_distance = route_info.get('distance_nm', 3500)  # Default if route not found
        progress_percent = (self.position_nm_from_origin / total_distance) * 100
        remaining_distance = total_distance - self.position_nm_from_origin
        
        # Base scenario result
        self.result = {
            "scenario_id": f"{self.flight_number}_{failure_type}_{datetime.now().strftime('%Y%m%d_%H%M%S')}",
            "timestamp": datetime.now().isoformat(),
            "aircraft": {
                "type": self.aircraft_type,
                "registration": self.registration,
                "flight_number": self.flight_number
            },
            "route": {
                "origin": self.origin,
                "destination": self.destination,
                "total_distance_nm": total_distance,
                "completed_distance_nm": self.position_nm_from_origin,
                "remaining_distance_nm": remaining_distance,
                "progress_percent": round(progress_percent, 1)
            },
            "failure": {
                "type": failure_type,
                "description": self.get_failure_description(failure_type),
                "severity": self.calculate_failure_severity(failure_type, progress_percent)
            },
            "position": {
                "distance_from_origin_nm": self.position_nm_from_origin,
                "initial_altitude_ft": self.altitude_ft,
                "adjusted_altitude_ft": self.calculate_adjusted_altitude(failure, failure_type),
                "phase_of_flight": self.determine_flight_phase(progress_percent)
            },
            "operational_impact": {
                "fuel_penalty_factor": failure.get("fuel_penalty_factor", 1.0),
                "landing_distance_factor": failure.get("landing_distance_factor", 1.0),
                "speed_restriction_knots": failure.get("speed_knots", None),
                "diversion_required": failure.get("diversion_required", False),
                "emergency_descent_required": failure_type == "decompression"
            },
            "systems_affected": self.analyze_systems_impact(failure, failure_type),
            "crew_actions": self.generate_crew_actions(failure_type, failure),
            "operational_actions": self.generate_operational_actions(failure_type, progress_percent),
            "operational_notes": self.generate_operational_notes(failure_type, failure, progress_percent),
            "diversion_analysis": self.analyze_diversion_options(failure_type, progress_percent),
            "fuel_analysis": self.calculate_fuel_impact(failure, remaining_distance),
            "passenger_impact": self.assess_passenger_impact(failure_type),
            "regulatory_considerations": self.get_regulatory_considerations(failure_type),
            "aino_recommendations": self.generate_aino_recommendations(failure_type, progress_percent)
        }

        logger.info(f"Failure scenario simulation complete: {failure_type} for {self.aircraft_type}")
        return self.result

    def calculate_adjusted_altitude(self, failure: Dict, failure_type: str) -> int:
        """Calculate adjusted altitude after failure"""
        if failure_type == "decompression":
            return failure.get("descent_altitude_ft", 10000)
        elif failure_type == "engine_failure":
            return failure.get("drift_down_altitude_ft", self.altitude_ft)
        else:
            return self.altitude_ft

    def determine_flight_phase(self, progress_percent: float) -> str:
        """Determine current flight phase based on progress"""
        if progress_percent < 10:
            return "DEPARTURE"
        elif progress_percent < 30:
            return "CLIMB"
        elif progress_percent < 70:
            return "CRUISE"
        elif progress_percent < 90:
            return "DESCENT"
        else:
            return "APPROACH"

    def calculate_failure_severity(self, failure_type: str, progress_percent: float) -> str:
        """Calculate failure severity based on type and flight phase"""
        severity_matrix = {
            "engine_failure": {"DEPARTURE": "CRITICAL", "CLIMB": "HIGH", "CRUISE": "MEDIUM", "DESCENT": "HIGH", "APPROACH": "CRITICAL"},
            "decompression": {"DEPARTURE": "CRITICAL", "CLIMB": "CRITICAL", "CRUISE": "HIGH", "DESCENT": "HIGH", "APPROACH": "CRITICAL"},
            "hydraulic_failure": {"DEPARTURE": "MEDIUM", "CLIMB": "MEDIUM", "CRUISE": "LOW", "DESCENT": "MEDIUM", "APPROACH": "HIGH"},
            "single_engine_landing": {"DEPARTURE": "CRITICAL", "CLIMB": "CRITICAL", "CRUISE": "HIGH", "DESCENT": "HIGH", "APPROACH": "HIGH"}
        }
        
        phase = self.determine_flight_phase(progress_percent)
        return severity_matrix.get(failure_type, {}).get(phase, "MEDIUM")

    def get_failure_description(self, failure_type: str) -> str:
        """Get human-readable failure description"""
        descriptions = {
            "engine_failure": "Engine failure requiring single-engine operations",
            "decompression": "Cabin pressurization failure requiring emergency descent",
            "hydraulic_failure": "Hydraulic system failure affecting flight controls and landing gear",
            "single_engine_landing": "Single-engine approach and landing procedures"
        }
        return descriptions.get(failure_type, "Unknown failure type")

    def analyze_systems_impact(self, failure: Dict, failure_type: str) -> Dict:
        """Analyze impact on aircraft systems"""
        systems_impact = {
            "primary_systems_lost": failure.get("systems_lost", []),
            "backup_systems_available": True,
            "flight_controls_affected": failure_type in ["hydraulic_failure", "engine_failure"],
            "landing_gear_affected": failure_type == "hydraulic_failure",
            "pressurization_affected": failure_type == "decompression"
        }
        
        # Engine failure specific systems mapping
        if failure_type == "engine_failure":
            systems_affected = failure.get("systems_lost", [])
            systems_impact["engine_failure_systems"] = {
                "hydraulics_2": "HYD 2" in systems_affected,
                "gen_2": "GEN 2" in systems_affected,
                "bleed_2": "BLEED 2" in systems_affected
            }
        
        if failure_type == "hydraulic_failure":
            systems_impact["lost_hydraulic_systems"] = failure.get("lost_systems", {})
            systems_impact["alternate_gear_extension"] = failure.get("alternate_gear_extension_required", False)
        
        return systems_impact

    def generate_crew_actions(self, failure_type: str, failure: Dict) -> List[str]:
        """Generate required crew actions for the failure"""
        actions = []
        
        if failure_type == "engine_failure":
            actions.extend([
                "Execute engine failure checklist",
                "Configure for single-engine operations",
                "Enable maximum continuous thrust",
                "Consider nearest suitable airport for diversion",
                "Coordinate with ATC for priority handling"
            ])
        elif failure_type == "decompression":
            actions.extend([
                "Don oxygen masks immediately",
                "Execute emergency descent to 10,000 ft",
                "Declare emergency with ATC",
                "Secure cabin and check passenger oxygen",
                "Consider nearest suitable airport"
            ])
        elif failure_type == "hydraulic_failure":
            actions.extend([
                "Execute hydraulic failure checklist",
                "Configure for alternate gear extension",
                "Review landing distance requirements",
                "Coordinate with maintenance for system status",
                "Brief cabin crew on emergency procedures"
            ])
        elif failure_type == "single_engine_landing":
            actions.extend([
                "Configure for single-engine approach",
                "Verify landing distance calculations",
                "Coordinate with ATC for straight-in approach",
                "Brief passengers on emergency procedures",
                "Position emergency services"
            ])
        
        return actions

    def generate_operational_notes(self, failure_type: str, failure: Dict, progress_percent: float) -> List[str]:
        """Generate operational notes and considerations"""
        notes = []
        
        # Common notes
        notes.append(f"Failure occurred during {self.determine_flight_phase(progress_percent)} phase")
        
        if failure_type == "hydraulic_failure":
            notes.append("Check for alternate gear extension and brake mode impact")
            if "flap_restriction" in failure:
                notes.append(f"Flap limitation: {failure['flap_restriction']}")
        
        elif failure_type == "decompression":
            notes.append("Emergency descent required - oxygen limits may apply")
            if "oxygen_duration_min_crew" in failure:
                notes.append(f"Crew oxygen duration: {failure['oxygen_duration_min_crew']} minutes")
        
        elif failure_type == "engine_failure":
            notes.append("Single-engine operations - max continuous thrust enabled")
            if failure.get("autothrust_limited"):
                notes.append("Autothrust functionality may be limited")
        
        elif failure_type == "single_engine_landing":
            notes.append("Evaluate landing distance, flap limits, and reverser availability")
            if "reverser_available" in failure:
                notes.append(f"Reverser status: {failure['reverser_available']}")
        
        return notes

    def analyze_diversion_options(self, failure_type: str, progress_percent: float) -> Dict:
        """Analyze diversion requirements and options using intelligent ranking"""
        diversion_required = self.twin_profile[failure_type].get("diversion_required", False)
        
        # Initialize alternate airport ranker
        try:
            from alternate_airport_ranking import AlternateAirportRanker
            ranker = AlternateAirportRanker()
            
            # Get failure profile for ranking
            failure_profile = self.twin_profile[failure_type].copy()
            failure_profile["type"] = failure_type
            
            # Get ranked alternates
            recommended = ranker.get_recommended_alternates(failure_profile, self.aircraft_type, max_results=5)
            suitable_airports = [alt["icao"] for alt in recommended]
            
            # Generate diversion report
            diversion_report = ranker.generate_diversion_report(failure_profile, self.aircraft_type, self.flight_number)
            
        except Exception as e:
            # Fallback to static list if ranking fails
            suitable_airports = ["CYQX", "BGBW", "BIKF", "EGPF", "EINN"]
            diversion_report = {"error": str(e)}
        
        return {
            "diversion_required": diversion_required,
            "severity": self.calculate_failure_severity(failure_type, progress_percent),
            "recommended_action": "CONTINUE" if not diversion_required else "DIVERT",
            "suitable_airports": suitable_airports,
            "minimum_runway_length_ft": self.calculate_minimum_runway_length(failure_type),
            "special_requirements": self.get_diversion_requirements(failure_type),
            "intelligent_ranking": diversion_report
        }

    def calculate_minimum_runway_length(self, failure_type: str) -> int:
        """Calculate minimum runway length requirement"""
        base_length = 8000  # Base requirement in feet
        landing_factor = self.twin_profile[failure_type].get("landing_distance_factor", 1.0)
        return int(base_length * landing_factor)

    def get_diversion_requirements(self, failure_type: str) -> List[str]:
        """Get special requirements for diversion"""
        requirements = []
        
        if failure_type == "hydraulic_failure":
            requirements.extend(["Long runway", "Arresting gear available", "Emergency services"])
        elif failure_type == "engine_failure":
            requirements.extend(["Maintenance capability", "Long runway", "Emergency services"])
        elif failure_type == "decompression":
            requirements.extend(["Medical facilities", "Low altitude approach", "Emergency services"])
        
        return requirements

    def calculate_fuel_impact(self, failure: Dict, remaining_distance: float) -> Dict:
        """Calculate fuel consumption impact"""
        fuel_penalty_factor = failure.get("fuel_penalty_factor", 1.0)
        expected_fuel_burn_penalty_per_hour = fuel_penalty_factor - 1.0
        base_consumption = remaining_distance * 0.8  # Rough estimate: 0.8 gallons per nm
        
        return {
            "fuel_penalty_factor": fuel_penalty_factor,
            "expected_fuel_burn_penalty_per_hour": expected_fuel_burn_penalty_per_hour,
            "estimated_extra_fuel_gallons": int(expected_fuel_burn_penalty_per_hour * base_consumption),
            "range_impact_percent": round(expected_fuel_burn_penalty_per_hour * 100, 1),
            "fuel_status": "ADEQUATE" if fuel_penalty_factor < 1.2 else "MONITOR" if fuel_penalty_factor < 1.3 else "CRITICAL"
        }

    def assess_passenger_impact(self, failure_type: str) -> Dict:
        """Assess impact on passengers"""
        impact_levels = {
            "engine_failure": {"comfort": "MODERATE", "safety": "LOW", "schedule": "HIGH"},
            "decompression": {"comfort": "HIGH", "safety": "MEDIUM", "schedule": "HIGH"},
            "hydraulic_failure": {"comfort": "LOW", "safety": "LOW", "schedule": "MEDIUM"},
            "single_engine_landing": {"comfort": "MODERATE", "safety": "MEDIUM", "schedule": "LOW"}
        }
        
        return impact_levels.get(failure_type, {"comfort": "LOW", "safety": "LOW", "schedule": "LOW"})

    def get_regulatory_considerations(self, failure_type: str) -> List[str]:
        """Get relevant regulatory considerations"""
        considerations = []
        
        if failure_type == "engine_failure":
            considerations.extend([
                "ETOPS regulations may apply",
                "Report to manufacturer and authority",
                "Enhanced inspection requirements"
            ])
        elif failure_type == "decompression":
            considerations.extend([
                "Mandatory occurrence report",
                "Cabin altitude exceeded certification limits",
                "Medical assessment required"
            ])
        elif failure_type == "hydraulic_failure":
            considerations.extend([
                "System redundancy analysis required",
                "Maintenance inspection mandatory",
                "Component replacement needed"
            ])
        
        return considerations

    def generate_aino_recommendations(self, failure_type: str, progress_percent: float) -> List[str]:
        """Generate AINO platform-specific recommendations"""
        recommendations = []
        
        # Common AINO recommendations
        recommendations.append("Activate enhanced monitoring in AINO Operations Center")
        recommendations.append("Initiate passenger communication protocols")
        
        if self.twin_profile[failure_type].get("diversion_required"):
            recommendations.append("Execute AINO automated diversion support workflow")
            recommendations.append("Coordinate ground services at diversion airport")
        
        if failure_type == "decompression":
            recommendations.append("Alert medical coordination team")
            recommendations.append("Prepare passenger assistance protocols")
        
        recommendations.append("Update Virgin Atlantic operations center")
        recommendations.append("Monitor fuel consumption via AINO fuel optimization engine")
        
        return recommendations

    def export_scenario(self, filename: str = None) -> str:
        """Export scenario to JSON file"""
        if not filename:
            timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
            filename = f"scenario_{self.aircraft_type}_{self.result.get('failure', {}).get('type', 'unknown')}_{timestamp}.json"
        
        try:
            with open(filename, 'w') as f:
                json.dump(self.result, f, indent=2)
            logger.info(f"Scenario exported to {filename}")
            return filename
        except Exception as e:
            logger.error(f"Error exporting scenario: {e}")
            return None
    
    def generate_operational_actions(self, failure_type: str, progress_percent: float) -> Dict:
        """Generate comprehensive operational actions using post-failure knowledge base"""
        try:
            from post_failure_actions import PostFailureActionsManager
            
            actions_manager = PostFailureActionsManager()
            
            # Get diversion information if available
            diversion_analysis = self.analyze_diversion_options(failure_type, progress_percent)
            diversion_info = None
            
            if diversion_analysis.get("diversion_required") and "intelligent_ranking" in diversion_analysis:
                ranking = diversion_analysis["intelligent_ranking"]
                if "analysis" in ranking and ranking["analysis"].get("best_alternate"):
                    best_alt = ranking["analysis"]["best_alternate"]
                    diversion_info = {
                        "icao": best_alt["icao"],
                        "name": best_alt["name"],
                        "distance_nm": best_alt["distance_nm"],
                        "fuel_required_tonnes": best_alt["fuel_required_tonnes"]
                    }
            
            # Generate comprehensive action timeline
            timeline = actions_manager.generate_action_timeline(failure_type, diversion_info)
            
            # Get specific action types
            critical_actions = actions_manager.get_critical_actions(failure_type)
            crew_specific = actions_manager.get_crew_specific_actions(failure_type, "Flight Crew")
            
            return {
                "timeline": timeline,
                "critical_actions": critical_actions,
                "crew_specific_actions": crew_specific,
                "total_actions": timeline["total_actions"],
                "priority_summary": timeline["priority_breakdown"],
                "diversion_context": diversion_info
            }
            
        except Exception as e:
            # Fallback if post-failure actions module fails
            return {
                "timeline": {"error": str(e)},
                "critical_actions": [],
                "crew_specific_actions": [],
                "total_actions": 0,
                "fallback_active": True
            }

def main():
    """Main function for standalone operation and testing"""
    print("Enhanced Scenario Simulator for AINO Aviation Intelligence Platform")
    print("=" * 70)
    
    # Example scenarios for Virgin Atlantic fleet
    scenarios = [
        {
            "aircraft_type": "A350-1000",
            "origin": "LHR",
            "destination": "JFK", 
            "position_nm": 1700,
            "altitude": 37000,
            "flight_number": "VS3",
            "registration": "G-VLUX"
        },
        {
            "aircraft_type": "B787-9",
            "origin": "LHR",
            "destination": "ATL",
            "position_nm": 2100,
            "altitude": 39000,
            "flight_number": "VS103",
            "registration": "G-VBOW"
        },
        {
            "aircraft_type": "A330-300",
            "origin": "MAN",
            "destination": "JFK",
            "position_nm": 1500,
            "altitude": 35000,
            "flight_number": "VS127",
            "registration": "G-VSXY"
        }
    ]
    
    failure_types = ["engine_failure", "decompression", "hydraulic_failure", "single_engine_landing"]
    
    for i, scenario in enumerate(scenarios[:1]):  # Run first scenario only for demo
        print(f"\nScenario {i+1}: {scenario['flight_number']} - {scenario['aircraft_type']}")
        print(f"Route: {scenario['origin']} to {scenario['destination']}")
        
        sim = EnhancedScenarioSimulator(
            aircraft_type=scenario["aircraft_type"],
            origin=scenario["origin"],
            destination=scenario["destination"],
            position_nm_from_origin=scenario["position_nm"],
            altitude_ft=scenario["altitude"],
            flight_number=scenario["flight_number"],
            registration=scenario["registration"]
        )
        
        for failure_type in failure_types[:2]:  # Test first two failure types
            print(f"\n  Testing {failure_type}:")
            try:
                result = sim.simulate_failure(failure_type)
                print(f"    ✓ Severity: {result['failure']['severity']}")
                print(f"    ✓ Diversion required: {result['operational_impact']['diversion_required']}")
                print(f"    ✓ Fuel impact: {result['fuel_analysis']['fuel_penalty_factor']}x")
                print(f"    ✓ AINO recommendations: {len(result['aino_recommendations'])} items")
                
                # Export scenario
                filename = sim.export_scenario()
                if filename:
                    print(f"    ✓ Exported to: {filename}")
                    
            except Exception as e:
                print(f"    ✗ Error: {e}")

if __name__ == "__main__":
    main()
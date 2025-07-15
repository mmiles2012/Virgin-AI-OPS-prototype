"""
Aircraft Digital Twin Failure Modeling System for AINO Aviation Platform
Advanced failure simulation for Boeing 787-9 and other Virgin Atlantic fleet aircraft
"""

import json
import numpy as np
from datetime import datetime, timedelta
from typing import Dict, List, Optional, Any
from dataclasses import dataclass, asdict


@dataclass
class FailureImpact:
    """Represents the impact of a specific failure on aircraft performance"""
    fuel_burn_multiplier: float
    speed_reduction: float  # knots
    altitude_restriction: Optional[int]  # feet
    range_reduction: float  # percentage
    passenger_impact: str
    crew_workload: str
    diversion_required: bool
    time_to_stabilize: int  # minutes
    operational_procedures: List[str]


@dataclass
class SystemState:
    """Current state of aircraft systems"""
    hydraulic_pressure_a: float  # PSI
    hydraulic_pressure_b: float  # PSI
    hydraulic_pressure_c: float  # PSI
    engine_1_status: str
    engine_2_status: str
    apu_status: str
    electrical_bus_status: Dict[str, bool]
    flight_controls_status: str
    landing_gear_status: str
    brake_system_status: str


class AircraftTwin:
    """Advanced Aircraft Digital Twin with failure modeling capabilities"""
    
    def __init__(self, aircraft_type: str, registration: str = None):
        self.aircraft_type = aircraft_type
        self.registration = registration or f"G-V{aircraft_type.replace('-', '')}"
        self.active_failures: List[str] = []
        self.failure_timestamp = None
        
        # Initialize aircraft-specific parameters
        self._initialize_aircraft_specs()
        self._initialize_system_states()
        self._initialize_failure_models()
        
    def _initialize_aircraft_specs(self):
        """Initialize aircraft-specific specifications"""
        aircraft_specs = {
            "B787-9": {
                "max_fuel": 126372,  # kg
                "max_range": 7635,   # nautical miles
                "cruise_speed": 490,  # knots
                "max_altitude": 43000,  # feet
                "engines": "Rolls-Royce Trent 1000",
                "hydraulic_systems": 3,
                "electrical_systems": 4
            },
            "A350-1000": {
                "max_fuel": 156000,  # kg
                "max_range": 8700,   # nautical miles
                "cruise_speed": 488,  # knots
                "max_altitude": 43100,  # feet
                "engines": "Trent XWB-97",
                "hydraulic_systems": 3,
                "electrical_systems": 4
            },
            "A330-300": {
                "max_fuel": 97530,   # kg
                "max_range": 6350,   # nautical miles
                "cruise_speed": 478,  # knots
                "max_altitude": 42000,  # feet
                "engines": "Trent 700",
                "hydraulic_systems": 3,
                "electrical_systems": 3
            },
            "A330-900": {
                "max_fuel": 139090,  # kg
                "max_range": 7200,   # nautical miles
                "cruise_speed": 478,  # knots
                "max_altitude": 42000,  # feet
                "engines": "Trent 7000",
                "hydraulic_systems": 3,
                "electrical_systems": 3
            }
        }
        
        self.specs = aircraft_specs.get(self.aircraft_type, aircraft_specs["B787-9"])
        
    def _initialize_system_states(self):
        """Initialize normal system states"""
        if self.aircraft_type == "B787-9":
            self.system_state = SystemState(
                hydraulic_pressure_a=3000.0,
                hydraulic_pressure_b=3000.0,
                hydraulic_pressure_c=3000.0,
                engine_1_status="NORMAL",
                engine_2_status="NORMAL",
                apu_status="AVAILABLE",
                electrical_bus_status={
                    "AC_BUS_1": True,
                    "AC_BUS_2": True,
                    "DC_BUS_1": True,
                    "DC_BUS_2": True
                },
                flight_controls_status="NORMAL",
                landing_gear_status="UP_LOCKED",
                brake_system_status="NORMAL"
            )
        else:
            # Default state for other aircraft types
            self.system_state = SystemState(
                hydraulic_pressure_a=3000.0,
                hydraulic_pressure_b=3000.0,
                hydraulic_pressure_c=3000.0,
                engine_1_status="NORMAL",
                engine_2_status="NORMAL",
                apu_status="AVAILABLE",
                electrical_bus_status={"MAIN": True, "BACKUP": True},
                flight_controls_status="NORMAL",
                landing_gear_status="UP_LOCKED",
                brake_system_status="NORMAL"
            )
            
    def _initialize_failure_models(self):
        """Initialize comprehensive failure models for different aircraft systems"""
        # Load aircraft-specific failure characteristics from digital twin profiles
        aircraft_profiles = {
            "B787-9": {
                "engine_failure": {
                    "fuel_penalty_factor": 1.2,
                    "drift_down_altitude_ft": 29000,
                    "speed_knots": 310,
                    "systems_lost": ["ELEC GEN 2", "HYD PRI R", "ENG BLEED R"]
                },
                "decompression": {
                    "fuel_penalty_factor": 1.3,
                    "descent_altitude_ft": 10000,
                    "emergency_descent_rate_fpm": 4000,
                    "oxygen_duration_min": 12
                },
                "hydraulic_failure": {
                    "landing_distance_factor": 1.25,
                    "flap_restriction": "Flaps 20",
                    "alternate_gear_extension_required": True
                }
            },
            "A350-1000": {
                "engine_failure": {
                    "fuel_penalty_factor": 1.18,
                    "drift_down_altitude_ft": 28000,
                    "speed_knots": 300,
                    "systems_lost": ["GEN 2", "HYD 2", "BLEED 2"]
                },
                "decompression": {
                    "fuel_penalty_factor": 1.28,
                    "descent_altitude_ft": 10000,
                    "emergency_descent_rate_fpm": 3500,
                    "oxygen_duration_min": 15
                },
                "hydraulic_failure": {
                    "landing_distance_factor": 1.3,
                    "flap_restriction": "Flaps 3",
                    "alternate_gear_extension_required": True
                }
            },
            "A330-300": {
                "engine_failure": {
                    "fuel_penalty_factor": 1.22,
                    "drift_down_altitude_ft": 27000,
                    "speed_knots": 290,
                    "systems_lost": ["GEN 2", "HYD 2", "BLEED 2"]
                },
                "decompression": {
                    "fuel_penalty_factor": 1.25,
                    "descent_altitude_ft": 10000,
                    "emergency_descent_rate_fpm": 3500,
                    "oxygen_duration_min": 14
                },
                "hydraulic_failure": {
                    "landing_distance_factor": 1.2,
                    "flap_restriction": "Flaps 3",
                    "alternate_gear_extension_required": True
                }
            },
            "A330-900": {
                "engine_failure": {
                    "fuel_penalty_factor": 1.22,
                    "drift_down_altitude_ft": 27000,
                    "speed_knots": 290,
                    "systems_lost": ["GEN 2", "HYD 2", "BLEED 2"]
                },
                "decompression": {
                    "fuel_penalty_factor": 1.25,
                    "descent_altitude_ft": 10000,
                    "emergency_descent_rate_fpm": 3500,
                    "oxygen_duration_min": 14
                },
                "hydraulic_failure": {
                    "landing_distance_factor": 1.2,
                    "flap_restriction": "Flaps 3",
                    "alternate_gear_extension_required": True
                }
            }
        }
        
        # Get aircraft-specific profile, default to B787-9 if not found
        profile = aircraft_profiles.get(self.aircraft_type, aircraft_profiles["B787-9"])
        
        self.failure_models = {
            "hydraulic_failure": FailureImpact(
                fuel_burn_multiplier=1.15,
                speed_reduction=25,
                altitude_restriction=35000,
                range_reduction=12.0,
                passenger_impact="Minor discomfort during approach/landing",
                crew_workload="ELEVATED - Manual reversion procedures",
                diversion_required=True,
                time_to_stabilize=20,
                operational_procedures=[
                    f"Execute hydraulic failure checklist",
                    f"Configure flight controls to manual reversion",
                    f"Flap restriction: {profile['hydraulic_failure']['flap_restriction']}",
                    f"Landing distance factor: {profile['hydraulic_failure']['landing_distance_factor']}x",
                    f"Alternate gear extension: {'Required' if profile['hydraulic_failure']['alternate_gear_extension_required'] else 'Not required'}",
                    "Coordinate with maintenance for ground inspection"
                ]
            ),
            "engine_failure": FailureImpact(
                fuel_burn_multiplier=profile["engine_failure"]["fuel_penalty_factor"],
                speed_reduction=self.specs["cruise_speed"] - profile["engine_failure"]["speed_knots"],
                altitude_restriction=profile["engine_failure"]["drift_down_altitude_ft"],
                range_reduction=25.0,
                passenger_impact="Moderate - Extended flight time and turbulence",
                crew_workload="HIGH - Single engine procedures",
                diversion_required=True,
                time_to_stabilize=15,
                operational_procedures=[
                    "Execute engine failure checklist",
                    f"Drift down to {profile['engine_failure']['drift_down_altitude_ft']:,}ft",
                    f"Maintain single engine speed: {profile['engine_failure']['speed_knots']} knots",
                    f"Systems lost: {', '.join(profile['engine_failure']['systems_lost'])}",
                    "Consider weight reduction if necessary",
                    "Plan single engine approach procedures",
                    "Alert ATC for priority handling"
                ]
            ),
            "electrical_failure": FailureImpact(
                fuel_burn_multiplier=1.28,
                speed_reduction=20,
                altitude_restriction=39000,
                range_reduction=8.0,
                passenger_impact="Minimal - Some cabin systems unavailable",
                crew_workload="ELEVATED - Load shedding procedures",
                diversion_required=True,
                time_to_stabilize=10,
                operational_procedures=[
                    "Execute electrical emergency checklist",
                    "Shed non-essential electrical loads",
                    "Monitor battery and generator status",
                    "Plan for manual backup systems",
                    "Consider APU start for backup power"
                ]
            ),
            "pressurization_failure": FailureImpact(
                fuel_burn_multiplier=profile["decompression"]["fuel_penalty_factor"],
                speed_reduction=35,
                altitude_restriction=profile["decompression"]["descent_altitude_ft"],
                range_reduction=35.0,
                passenger_impact="HIGH - Emergency descent and oxygen masks",
                crew_workload="CRITICAL - Emergency descent procedures",
                diversion_required=True,
                time_to_stabilize=8,
                operational_procedures=[
                    f"Execute rapid descent to {profile['decompression']['descent_altitude_ft']:,}ft",
                    f"Emergency descent rate: {profile['decompression']['emergency_descent_rate_fpm']:,} fpm",
                    "Deploy passenger oxygen masks",
                    f"Cabin oxygen duration: {profile['decompression']['oxygen_duration_min']} minutes",
                    "Declare emergency with ATC",
                    "Plan immediate diversion to nearest suitable airport",
                    "Monitor cabin altitude and passenger condition"
                ]
            ),
            "landing_gear_malfunction": FailureImpact(
                fuel_burn_multiplier=1.25,
                speed_reduction=15,
                altitude_restriction=None,
                range_reduction=5.0,
                passenger_impact="Moderate - Extended flight time for troubleshooting",
                crew_workload="ELEVATED - Landing gear extension procedures",
                diversion_required=True,
                time_to_stabilize=25,
                operational_procedures=[
                    "Execute landing gear malfunction checklist",
                    "Attempt manual gear extension",
                    "Burn fuel to achieve maximum landing weight",
                    "Coordinate with ground for emergency services",
                    "Plan for possible gear-up landing"
                ]
            )
        }
        
    def apply_failure(self, failure_type: str, severity: str = "standard"):
        """Apply a specific failure to the aircraft twin"""
        if failure_type not in self.failure_models:
            raise ValueError(f"Unknown failure type: {failure_type}")
            
        self.active_failures.append(failure_type)
        self.failure_timestamp = datetime.now()
        
        # Modify system states based on failure type
        if failure_type == "hydraulic_failure":
            if self.aircraft_type == "B787-9":
                # Simulate loss of System A hydraulics
                self.system_state.hydraulic_pressure_a = 0.0
                self.system_state.flight_controls_status = "MANUAL_REVERSION"
                self.system_state.brake_system_status = "DEGRADED"
            
        elif failure_type == "engine_failure":
            self.system_state.engine_1_status = "FAILED"
            self.system_state.electrical_bus_status["AC_BUS_1"] = False
            
        elif failure_type == "electrical_failure":
            self.system_state.electrical_bus_status["AC_BUS_1"] = False
            self.system_state.electrical_bus_status["DC_BUS_1"] = False
            
        print(f"✈️ Applied {failure_type} to {self.aircraft_type} {self.registration}")
        print(f"⚠️  System impact: {self.failure_models[failure_type].passenger_impact}")
        
    def get_performance_impact(self) -> Dict[str, Any]:
        """Calculate combined performance impact of all active failures"""
        if not self.active_failures:
            return {
                "fuel_burn_multiplier": 1.0,
                "speed_reduction": 0,
                "altitude_restriction": self.specs["max_altitude"],
                "range_reduction": 0.0,
                "diversion_required": False
            }
            
        # Calculate combined impacts
        combined_fuel_multiplier = 1.0
        combined_speed_reduction = 0
        min_altitude = self.specs["max_altitude"]
        combined_range_reduction = 0.0
        diversion_required = False
        
        for failure in self.active_failures:
            impact = self.failure_models[failure]
            combined_fuel_multiplier *= impact.fuel_burn_multiplier
            combined_speed_reduction += impact.speed_reduction
            if impact.altitude_restriction:
                min_altitude = min(min_altitude, impact.altitude_restriction)
            combined_range_reduction += impact.range_reduction
            diversion_required = diversion_required or impact.diversion_required
            
        return {
            "fuel_burn_multiplier": combined_fuel_multiplier,
            "speed_reduction": combined_speed_reduction,
            "altitude_restriction": min_altitude,
            "range_reduction": min(combined_range_reduction, 50.0),  # Cap at 50%
            "diversion_required": diversion_required
        }
        
    def export_for_ml(self) -> Dict[str, Any]:
        """Export aircraft twin data in format suitable for ML training"""
        performance_impact = self.get_performance_impact()
        
        ml_data = {
            "aircraft_id": self.registration,
            "aircraft_type": self.aircraft_type,
            "timestamp": datetime.now().isoformat(),
            "failure_timestamp": self.failure_timestamp.isoformat() if self.failure_timestamp else None,
            "active_failures": self.active_failures,
            "num_failures": len(self.active_failures),
            
            # Aircraft specifications
            "max_fuel_kg": self.specs["max_fuel"],
            "max_range_nm": self.specs["max_range"],
            "cruise_speed_knots": self.specs["cruise_speed"],
            "max_altitude_ft": self.specs["max_altitude"],
            
            # System states (numerical for ML)
            "hydraulic_pressure_a": self.system_state.hydraulic_pressure_a,
            "hydraulic_pressure_b": self.system_state.hydraulic_pressure_b,
            "hydraulic_pressure_c": self.system_state.hydraulic_pressure_c,
            "engine_1_operational": 1 if self.system_state.engine_1_status == "NORMAL" else 0,
            "engine_2_operational": 1 if self.system_state.engine_2_status == "NORMAL" else 0,
            "apu_available": 1 if self.system_state.apu_status == "AVAILABLE" else 0,
            "electrical_systems_count": sum(self.system_state.electrical_bus_status.values()),
            
            # Performance impacts
            "fuel_burn_multiplier": performance_impact["fuel_burn_multiplier"],
            "speed_reduction_knots": performance_impact["speed_reduction"],
            "altitude_restriction_ft": performance_impact["altitude_restriction"],
            "range_reduction_percent": performance_impact["range_reduction"],
            "diversion_required": 1 if performance_impact["diversion_required"] else 0,
            
            # Calculated metrics for ML
            "effective_cruise_speed": self.specs["cruise_speed"] - performance_impact["speed_reduction"],
            "effective_range": self.specs["max_range"] * (1 - performance_impact["range_reduction"] / 100),
            "fuel_efficiency_ratio": 1 / performance_impact["fuel_burn_multiplier"],
            "operational_capability_score": self._calculate_operational_score(),
            
            # Time-based features
            "time_since_failure_minutes": (
                (datetime.now() - self.failure_timestamp).total_seconds() / 60
                if self.failure_timestamp else 0
            ),
            "stabilization_complete": (
                1 if self.failure_timestamp and 
                (datetime.now() - self.failure_timestamp).total_seconds() > 1200  # 20 minutes
                else 0
            )
        }
        
        return ml_data
        
    def _calculate_operational_score(self) -> float:
        """Calculate overall operational capability score (0-1)"""
        if not self.active_failures:
            return 1.0
            
        # Base score starts at 1.0 and is reduced by failures
        score = 1.0
        
        for failure in self.active_failures:
            impact = self.failure_models[failure]
            
            # Reduce score based on various impact factors
            score -= (impact.fuel_burn_multiplier - 1.0) * 0.2
            score -= (impact.speed_reduction / 100) * 0.3
            score -= (impact.range_reduction / 100) * 0.2
            
            if impact.diversion_required:
                score -= 0.15
                
        return max(score, 0.1)  # Minimum score of 0.1
        
    def get_operational_procedures(self) -> List[str]:
        """Get all operational procedures for active failures"""
        procedures = []
        for failure in self.active_failures:
            procedures.extend(self.failure_models[failure].operational_procedures)
        return procedures
        
    def reset_failures(self):
        """Reset aircraft to normal operational state"""
        self.active_failures = []
        self.failure_timestamp = None
        self._initialize_system_states()
        print(f"✅ {self.aircraft_type} {self.registration} reset to normal operational state")
        
    def get_detailed_status(self) -> Dict[str, Any]:
        """Get comprehensive status report of aircraft twin"""
        return {
            "aircraft_info": {
                "type": self.aircraft_type,
                "registration": self.registration,
                "specifications": self.specs
            },
            "system_status": asdict(self.system_state),
            "active_failures": self.active_failures,
            "failure_timestamp": self.failure_timestamp.isoformat() if self.failure_timestamp else None,
            "performance_impact": self.get_performance_impact(),
            "operational_procedures": self.get_operational_procedures(),
            "operational_score": self._calculate_operational_score(),
            "ml_export": self.export_for_ml()
        }


def demo_failure_modeling():
    """Demonstrate aircraft failure modeling capabilities"""
    print("🔧 AINO Aircraft Failure Modeling System Demo")
    print("=" * 50)
    
    # Create B787-9 twin
    twin = AircraftTwin("B787-9", "G-VBOB")
    print(f"Created digital twin for {twin.aircraft_type} {twin.registration}")
    
    # Apply hydraulic failure
    twin.apply_failure("hydraulic_failure")
    
    # Export for ML
    ml_data = twin.export_for_ml()
    
    print("\n📊 ML Export Data:")
    print(json.dumps(ml_data, indent=2))
    
    print(f"\n⚠️  Operational Impact:")
    print(f"   • Fuel burn increase: {((ml_data['fuel_burn_multiplier'] - 1) * 100):.1f}%")
    print(f"   • Speed reduction: {ml_data['speed_reduction_knots']} knots")
    print(f"   • Altitude restriction: {ml_data['altitude_restriction_ft']:,} ft")
    print(f"   • Range reduction: {ml_data['range_reduction_percent']:.1f}%")
    print(f"   • Operational capability: {ml_data['operational_capability_score']:.2f}")
    
    return twin


if __name__ == "__main__":
    demo_failure_modeling()
#!/usr/bin/env python3
"""
Intelligent Operations Agent for AINO Aviation Intelligence Platform
Integrates post-failure actions, diversion planning, and scenario generation
"""

import json
import logging
from datetime import datetime
from typing import Dict, List, Optional, Union
from dataclasses import dataclass

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

@dataclass
class OperationalAction:
    """Structured operational action for crew response"""
    id: str
    trigger: str
    action: str
    target_team: str
    method: str
    deadline_mins: int
    priority: str
    issued_at: str
    status: str = "pending"
    diversion_airport: Optional[str] = None
    notes: Optional[str] = None

class IntelligentOpsAgent:
    """
    Intelligent Operations Agent coordinating post-failure actions,
    diversion planning, and scenario management for AINO platform
    """
    
    def __init__(self):
        self.initialization_time = datetime.utcnow().isoformat() + "Z"
        self.active_scenarios = {}
        self.completed_actions = []
        
        # Initialize integrated systems
        self.post_failure_system = self._initialize_post_failure_system()
        self.diversion_engine = self._initialize_diversion_engine()
        self.scenario_engine = self._initialize_scenario_engine()
        
        logger.info("Intelligent Operations Agent initialized")
    
    def _initialize_post_failure_system(self):
        """Initialize post-failure actions system"""
        try:
            from post_failure_actions import PostFailureActionsManager
            return PostFailureActionsManager()
        except ImportError:
            logger.warning("Post-failure actions system not available, using fallback")
            return None
    
    def _initialize_diversion_engine(self):
        """Initialize diversion planning engine"""
        try:
            from alternate_airport_ranking import AlternateAirportRanker
            return AlternateAirportRanker()
        except ImportError:
            logger.warning("Diversion engine not available, using fallback")
            return None
    
    def _initialize_scenario_engine(self):
        """Initialize scenario simulation engine"""
        try:
            from enhanced_scenario_simulator import EnhancedScenarioSimulator
            return EnhancedScenarioSimulator
        except ImportError:
            logger.warning("Scenario engine not available, using fallback")
            return None
    
    def generate_comprehensive_response(self, 
                                      failure_type: str, 
                                      aircraft_type: str = "A330-300",
                                      flight_number: str = "VS127",
                                      diversion_required: bool = True) -> Dict:
        """
        Generate comprehensive operational response to failure scenario
        
        Args:
            failure_type: Type of failure (engine_failure, hydraulic_failure, etc.)
            aircraft_type: Aircraft type for scenario simulation
            flight_number: Flight number for tracking
            diversion_required: Whether diversion is required
            
        Returns:
            Comprehensive operational response package
        """
        
        response_id = f"OPS_{failure_type}_{flight_number}_{datetime.now().strftime('%Y%m%d_%H%M%S')}"
        
        logger.info(f"Generating comprehensive response for {failure_type} on {flight_number}")
        
        # 1. Generate post-failure actions
        operational_actions = self._generate_operational_actions(failure_type, flight_number)
        
        # 2. Perform diversion analysis if required
        diversion_analysis = None
        if diversion_required:
            diversion_analysis = self._perform_diversion_analysis(failure_type, aircraft_type)
        
        # 3. Generate scenario simulation
        scenario_simulation = self._generate_scenario_simulation(
            failure_type, aircraft_type, flight_number
        )
        
        # 4. Create integrated response package
        response = {
            "response_id": response_id,
            "timestamp": datetime.utcnow().isoformat() + "Z",
            "failure_type": failure_type,
            "aircraft_type": aircraft_type,
            "flight_number": flight_number,
            "operational_actions": operational_actions,
            "diversion_analysis": diversion_analysis,
            "scenario_simulation": scenario_simulation,
            "response_summary": self._create_response_summary(
                operational_actions, diversion_analysis, scenario_simulation
            ),
            "next_steps": self._generate_next_steps(failure_type, operational_actions)
        }
        
        # Store active scenario
        self.active_scenarios[response_id] = response
        
        logger.info(f"Comprehensive response generated: {response_id}")
        return response
    
    def _generate_operational_actions(self, failure_type: str, flight_number: str) -> Dict:
        """Generate operational actions using post-failure system"""
        
        if self.post_failure_system:
            # Use comprehensive post-failure actions system
            timeline = self.post_failure_system.generate_action_timeline(failure_type)
            critical_actions = self.post_failure_system.get_critical_actions(failure_type)
            crew_actions = self.post_failure_system.get_crew_specific_actions(failure_type)
            
            return {
                "system": "comprehensive",
                "timeline": timeline,
                "critical_actions": critical_actions,
                "crew_specific_actions": crew_actions,
                "total_actions": timeline["total_actions"],
                "priority_breakdown": timeline["priority_breakdown"]
            }
        else:
            # Fallback to basic action generation
            return self._generate_basic_actions(failure_type, flight_number)
    
    def _generate_basic_actions(self, failure_type: str, flight_number: str) -> Dict:
        """Basic action generation fallback"""
        
        basic_matrix = {
            "engine_failure": [
                {"action": "Confirm ETOPS compliance", "target": "Dispatch", "method": "UI", "deadline_mins": 5, "priority": "HIGH"},
                {"action": "Evaluate nearest suitable diversion", "target": "Ops Centre", "method": "Internal", "deadline_mins": 5, "priority": "HIGH"},
                {"action": "Notify arrival station of potential delay", "target": "Station Ops", "method": "API", "deadline_mins": 10, "priority": "MEDIUM"}
            ],
            "hydraulic_failure": [
                {"action": "Check alternate gear/brake configuration", "target": "Flight Crew", "method": "ACARS", "deadline_mins": 5, "priority": "HIGH"},
                {"action": "Confirm runway suitability at alternate", "target": "Ops Centre", "method": "UI", "deadline_mins": 7, "priority": "HIGH"},
                {"action": "Request rescue/fire service confirmation", "target": "Diversion Airport", "method": "API", "deadline_mins": 10, "priority": "HIGH"}
            ],
            "decompression": [
                {"action": "Trigger emergency descent advisory", "target": "Flight Crew", "method": "ACARS", "deadline_mins": 2, "priority": "CRITICAL"},
                {"action": "Alert medical and customs at arrival", "target": "Arrival Station", "method": "Email", "deadline_mins": 15, "priority": "MEDIUM"},
                {"action": "Initiate oxygen duration monitoring", "target": "Ops Centre", "method": "UI", "deadline_mins": 1, "priority": "CRITICAL"}
            ]
        }
        
        base_actions = basic_matrix.get(failure_type, [])
        now = datetime.utcnow().isoformat() + "Z"
        
        action_list = []
        for idx, base in enumerate(base_actions):
            action = OperationalAction(
                id=f"{failure_type}_{idx}_{flight_number}",
                trigger=failure_type,
                action=base["action"],
                target_team=base["target"],
                method=base["method"],
                deadline_mins=base["deadline_mins"],
                priority=base["priority"],
                issued_at=now
            )
            action_list.append(action.__dict__)
        
        return {
            "system": "basic",
            "actions": action_list,
            "total_actions": len(action_list)
        }
    
    def _perform_diversion_analysis(self, failure_type: str, aircraft_type: str) -> Dict:
        """Perform intelligent diversion analysis"""
        
        if self.diversion_engine:
            # Use intelligent alternate airport ranking
            failure_profile = {"type": failure_type, "severity": "HIGH"}
            alternates = self.diversion_engine.get_recommended_alternates(
                failure_profile, aircraft_type, max_results=5
            )
            
            return {
                "system": "intelligent_ranking",
                "recommended_alternates": alternates,
                "analysis": {
                    "best_alternate": alternates[0] if alternates else None,
                    "total_evaluated": len(alternates),
                    "ranking_criteria": ["runway_length", "fire_category", "weather_minimums", "maintenance_capability", "distance"]
                }
            }
        else:
            # Basic diversion analysis fallback
            return {
                "system": "basic",
                "recommended_alternates": [
                    {"icao": "EINN", "name": "Shannon", "distance_nm": 180, "suitability": "GOOD"},
                    {"icao": "EGPK", "name": "Glasgow Prestwick", "distance_nm": 220, "suitability": "FAIR"}
                ],
                "analysis": {"fallback_mode": True}
            }
    
    def _generate_scenario_simulation(self, failure_type: str, aircraft_type: str, flight_number: str) -> Dict:
        """Generate detailed scenario simulation"""
        
        if self.scenario_engine:
            try:
                # Use enhanced scenario simulator
                sim = self.scenario_engine(
                    aircraft_type=aircraft_type,
                    origin="LHR",
                    destination="JFK",
                    position_nm_from_origin=1800,
                    altitude_ft=37000,
                    flight_number=flight_number,
                    registration="G-VSXY"
                )
                
                result = sim.simulate_failure(failure_type)
                
                return {
                    "system": "enhanced_simulator",
                    "scenario_data": {
                        "failure_state": {
                            "type": result['failure']['type'],
                            "aircraft_type": result['aircraft']['type'],
                            "initial_altitude": result['position']['initial_altitude_ft'],
                            "drift_down_altitude": result['position']['adjusted_altitude_ft'],
                            "expected_fuel_burn_penalty_per_hour": result['fuel_analysis']['expected_fuel_burn_penalty_per_hour'],
                            "systems_affected": result['systems_affected']['primary_systems_lost'],
                            "diversion_required": result['operational_impact']['diversion_required']
                        },
                        "severity": result['failure']['severity'],
                        "phase_of_flight": result['position']['phase_of_flight']
                    }
                }
            except Exception as e:
                logger.error(f"Scenario simulation failed: {e}")
                return {"system": "error", "error": str(e)}
        else:
            # Basic scenario simulation
            return {
                "system": "basic",
                "scenario_data": {
                    "failure_state": {
                        "type": failure_type,
                        "aircraft_type": aircraft_type,
                        "severity": "MEDIUM",
                        "basic_simulation": True
                    }
                }
            }
    
    def _create_response_summary(self, actions: Dict, diversion: Optional[Dict], scenario: Dict) -> Dict:
        """Create executive summary of operational response"""
        
        summary = {
            "total_actions": actions.get("total_actions", 0),
            "critical_actions": 0,
            "diversion_recommended": False,
            "best_alternate": None,
            "scenario_severity": "UNKNOWN"
        }
        
        # Count critical actions
        if "timeline" in actions and "priority_breakdown" in actions["timeline"]:
            summary["critical_actions"] = actions["timeline"]["priority_breakdown"].get("critical", 0)
        
        # Diversion information
        if diversion and "analysis" in diversion:
            analysis = diversion["analysis"]
            if "best_alternate" in analysis and analysis["best_alternate"]:
                summary["diversion_recommended"] = True
                summary["best_alternate"] = analysis["best_alternate"]["name"]
        
        # Scenario severity
        if "scenario_data" in scenario:
            summary["scenario_severity"] = scenario["scenario_data"].get("severity", "UNKNOWN")
        
        return summary
    
    def _generate_next_steps(self, failure_type: str, actions: Dict) -> List[str]:
        """Generate recommended next steps"""
        
        next_steps = []
        
        # Add failure-specific next steps
        if failure_type == "engine_failure":
            next_steps.extend([
                "Monitor single-engine performance parameters",
                "Confirm ETOPS compliance for current route",
                "Coordinate with maintenance for arrival station"
            ])
        elif failure_type == "decompression":
            next_steps.extend([
                "Execute emergency descent immediately",
                "Monitor oxygen supply levels",
                "Prepare for medical assistance at arrival"
            ])
        elif failure_type == "hydraulic_failure":
            next_steps.extend([
                "Review alternate landing procedures",
                "Coordinate emergency services at destination",
                "Calculate extended landing distances"
            ])
        
        # Add action-based next steps
        if "critical_actions" in actions and len(actions.get("critical_actions", [])) > 0:
            next_steps.append("Execute critical actions immediately")
        
        next_steps.append("Continue monitoring aircraft systems")
        next_steps.append("Update operations center with status")
        
        return next_steps
    
    def get_active_scenarios(self) -> Dict:
        """Get all active operational scenarios"""
        return {
            "total_active": len(self.active_scenarios),
            "scenarios": list(self.active_scenarios.keys()),
            "last_updated": datetime.utcnow().isoformat() + "Z"
        }
    
    def get_scenario_status(self, response_id: str) -> Optional[Dict]:
        """Get status of specific operational scenario"""
        return self.active_scenarios.get(response_id)
    
    def mark_action_completed(self, response_id: str, action_id: str) -> bool:
        """Mark specific action as completed"""
        if response_id in self.active_scenarios:
            scenario = self.active_scenarios[response_id]
            
            # Update action status in scenario
            actions = scenario.get("operational_actions", {})
            if "timeline" in actions and "timeline" in actions["timeline"]:
                timeline = actions["timeline"]["timeline"]
                for phase_name, phase_data in timeline.items():
                    if "actions" in phase_data:
                        for action in phase_data["actions"]:
                            if action.get("id") == action_id:
                                action["status"] = "completed"
                                action["completed_at"] = datetime.utcnow().isoformat() + "Z"
                                
                                # Track completed action
                                self.completed_actions.append({
                                    "action_id": action_id,
                                    "response_id": response_id,
                                    "completed_at": action["completed_at"]
                                })
                                
                                logger.info(f"Action {action_id} marked completed for scenario {response_id}")
                                return True
        
        return False

def main():
    """Demonstration of Intelligent Operations Agent"""
    
    print("🤖 Intelligent Operations Agent for AINO Platform")
    print("=" * 50)
    
    agent = IntelligentOpsAgent()
    
    # Test comprehensive response generation
    test_scenarios = [
        {"failure": "engine_failure", "aircraft": "A330-300", "flight": "VS127"},
        {"failure": "decompression", "aircraft": "A350-1000", "flight": "VS3"},
        {"failure": "hydraulic_failure", "aircraft": "B787-9", "flight": "VS103"}
    ]
    
    for scenario in test_scenarios:
        print(f"\n🚨 Testing {scenario['failure']} on {scenario['flight']} ({scenario['aircraft']})")
        print("-" * 40)
        
        try:
            response = agent.generate_comprehensive_response(
                failure_type=scenario["failure"],
                aircraft_type=scenario["aircraft"],
                flight_number=scenario["flight"]
            )
            
            # Display summary
            summary = response["response_summary"]
            print(f"📊 Response ID: {response['response_id']}")
            print(f"🚨 Total actions: {summary['total_actions']}")
            print(f"⚡ Critical actions: {summary['critical_actions']}")
            print(f"🛬 Diversion recommended: {summary['diversion_recommended']}")
            
            if summary["best_alternate"]:
                print(f"🎯 Best alternate: {summary['best_alternate']}")
            
            print(f"📈 Scenario severity: {summary['scenario_severity']}")
            
            # Show next steps
            next_steps = response["next_steps"]
            if next_steps:
                print(f"📋 Next steps:")
                for step in next_steps[:3]:  # Show first 3
                    print(f"   • {step}")
        
        except Exception as e:
            print(f"❌ Error: {e}")
    
    # Show active scenarios
    active = agent.get_active_scenarios()
    print(f"\n📊 Active Scenarios: {active['total_active']}")
    
    print(f"\n✅ Intelligent Operations Agent demonstration complete")

if __name__ == "__main__":
    main()
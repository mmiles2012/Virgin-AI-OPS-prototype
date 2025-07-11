#!/usr/bin/env python3
"""
Post-Failure Actions Knowledge Base for AINO Enhanced Scenario Simulator
Operational procedures and crew action matrix for failure scenarios
"""

import json
from datetime import datetime
from typing import Dict, List, Optional

class PostFailureActionsManager:
    """Manages post-failure operational actions and crew procedures"""
    
    def __init__(self):
        self.failure_action_matrix = self._load_failure_action_matrix()
        
    def _load_failure_action_matrix(self) -> Dict:
        """Load comprehensive failure action matrix with operational procedures"""
        return {
            "engine_failure": [
                {"action": "Confirm ETOPS compliance", "target": "Dispatch", "method": "UI", "deadline_mins": 5, "priority": "HIGH"},
                {"action": "Evaluate nearest suitable diversion", "target": "Ops Centre", "method": "Internal", "deadline_mins": 5, "priority": "HIGH"},
                {"action": "Notify arrival station of potential delay", "target": "Station Ops", "method": "API", "deadline_mins": 10, "priority": "MEDIUM"},
                {"action": "Check single-engine performance data", "target": "Flight Crew", "method": "ACARS", "deadline_mins": 3, "priority": "HIGH"},
                {"action": "Review fuel requirements for diversion", "target": "Ops Centre", "method": "UI", "deadline_mins": 7, "priority": "HIGH"},
                {"action": "Alert maintenance at diversion airport", "target": "Maintenance", "method": "API", "deadline_mins": 15, "priority": "MEDIUM"}
            ],
            "hydraulic_failure": [
                {"action": "Check alternate gear/brake configuration", "target": "Flight Crew", "method": "ACARS", "deadline_mins": 5, "priority": "HIGH"},
                {"action": "Confirm runway suitability at alternate", "target": "Ops Centre", "method": "UI", "deadline_mins": 7, "priority": "HIGH"},
                {"action": "Request rescue/fire service confirmation", "target": "Diversion Airport", "method": "API", "deadline_mins": 10, "priority": "HIGH"},
                {"action": "Calculate extended landing distance", "target": "Dispatch", "method": "UI", "deadline_mins": 8, "priority": "HIGH"},
                {"action": "Brief cabin crew on emergency procedures", "target": "Flight Crew", "method": "Internal", "deadline_mins": 12, "priority": "MEDIUM"},
                {"action": "Coordinate emergency vehicles positioning", "target": "Airport Fire Service", "method": "Radio", "deadline_mins": 15, "priority": "MEDIUM"}
            ],
            "decompression": [
                {"action": "Trigger emergency descent advisory", "target": "Flight Crew", "method": "ACARS", "deadline_mins": 2, "priority": "CRITICAL"},
                {"action": "Alert medical and customs at arrival", "target": "Arrival Station", "method": "Email", "deadline_mins": 15, "priority": "MEDIUM"},
                {"action": "Initiate oxygen duration monitoring", "target": "Ops Centre", "method": "UI", "deadline_mins": 1, "priority": "CRITICAL"},
                {"action": "Coordinate immediate descent clearance", "target": "ATC", "method": "Radio", "deadline_mins": 1, "priority": "CRITICAL"},
                {"action": "Calculate oxygen supply remaining", "target": "Flight Crew", "method": "ACARS", "deadline_mins": 3, "priority": "HIGH"},
                {"action": "Prepare passenger oxygen briefing", "target": "Cabin Crew", "method": "PA", "deadline_mins": 5, "priority": "HIGH"}
            ],
            "electrical_failure": [
                {"action": "Switch to emergency power configuration", "target": "Flight Crew", "method": "Checklist", "deadline_mins": 3, "priority": "HIGH"},
                {"action": "Assess navigation capability", "target": "Flight Crew", "method": "Internal", "deadline_mins": 5, "priority": "HIGH"},
                {"action": "Request radar vectors to nearest airport", "target": "ATC", "method": "Radio", "deadline_mins": 7, "priority": "HIGH"},
                {"action": "Prepare for manual flight controls", "target": "Flight Crew", "method": "Checklist", "deadline_mins": 10, "priority": "MEDIUM"}
            ],
            "communication_failure": [
                {"action": "Switch to backup radio frequencies", "target": "Flight Crew", "method": "Checklist", "deadline_mins": 2, "priority": "HIGH"},
                {"action": "Squawk emergency transponder code", "target": "Flight Crew", "method": "Internal", "deadline_mins": 1, "priority": "CRITICAL"},
                {"action": "Attempt ACARS communication", "target": "Flight Crew", "method": "ACARS", "deadline_mins": 5, "priority": "HIGH"},
                {"action": "Monitor guard frequency", "target": "Flight Crew", "method": "Radio", "deadline_mins": 3, "priority": "HIGH"}
            ]
        }
    
    def generate_ops_actions(self, failure_type: str, diversion_info: Optional[Dict] = None, flight_number: str = "Unknown") -> List[Dict]:
        """Generate operational actions for specific failure type"""
        
        now = datetime.utcnow().isoformat() + "Z"
        base_actions = self.failure_action_matrix.get(failure_type, [])
        
        if not base_actions:
            # Fallback for unknown failure types
            base_actions = [
                {"action": "Assess aircraft status", "target": "Flight Crew", "method": "Checklist", "deadline_mins": 5, "priority": "HIGH"},
                {"action": "Evaluate diversion options", "target": "Ops Centre", "method": "UI", "deadline_mins": 10, "priority": "HIGH"}
            ]
        
        action_list = []
        for idx, base in enumerate(base_actions):
            action_entry = {
                "id": f"{failure_type}_{idx}_{flight_number}",
                "trigger": failure_type,
                "action": base["action"],
                "target_team": base["target"],
                "method": base["method"],
                "deadline_mins": base["deadline_mins"],
                "priority": base["priority"],
                "issued_at": now,
                "status": "pending",
                "flight_number": flight_number,
                "estimated_completion": self._calculate_completion_time(now, base["deadline_mins"])
            }
            
            # Add diversion-specific information
            if diversion_info:
                action_entry["diversion_airport"] = diversion_info.get("icao", "N/A")
                action_entry["diversion_name"] = diversion_info.get("name", "Unknown")
                action_entry["notes"] = f"Related to diversion to {diversion_info.get('name', 'alternate airport')}"
                
                # Add distance and fuel requirements if available
                if "distance_nm" in diversion_info:
                    action_entry["diversion_distance_nm"] = diversion_info["distance_nm"]
                if "fuel_required_tonnes" in diversion_info:
                    action_entry["diversion_fuel_tonnes"] = diversion_info["fuel_required_tonnes"]
            
            action_list.append(action_entry)
        
        # Sort by priority (CRITICAL > HIGH > MEDIUM > LOW)
        priority_order = {"CRITICAL": 0, "HIGH": 1, "MEDIUM": 2, "LOW": 3}
        action_list.sort(key=lambda x: (priority_order.get(x["priority"], 3), x["deadline_mins"]))
        
        return action_list
    
    def _calculate_completion_time(self, issued_time: str, deadline_mins: int) -> str:
        """Calculate estimated completion time"""
        try:
            issued = datetime.fromisoformat(issued_time.replace('Z', '+00:00'))
            completion = issued.replace(minute=issued.minute + deadline_mins)
            return completion.isoformat() + "Z"
        except:
            return issued_time
    
    def get_critical_actions(self, failure_type: str) -> List[Dict]:
        """Get only critical priority actions for immediate response"""
        all_actions = self.generate_ops_actions(failure_type)
        return [action for action in all_actions if action.get("priority") == "CRITICAL"]
    
    def get_crew_specific_actions(self, failure_type: str, crew_type: str = "Flight Crew") -> List[Dict]:
        """Get actions specific to flight crew, cabin crew, or dispatch"""
        all_actions = self.generate_ops_actions(failure_type)
        return [action for action in all_actions if crew_type in action.get("target_team", "")]
    
    def generate_action_timeline(self, failure_type: str, diversion_info: Optional[Dict] = None) -> Dict:
        """Generate comprehensive action timeline with phases"""
        actions = self.generate_ops_actions(failure_type, diversion_info)
        
        # Group actions by time phases
        immediate = [a for a in actions if a["deadline_mins"] <= 5]
        short_term = [a for a in actions if 5 < a["deadline_mins"] <= 15]
        medium_term = [a for a in actions if a["deadline_mins"] > 15]
        
        return {
            "failure_type": failure_type,
            "total_actions": len(actions),
            "timeline": {
                "immediate_response": {
                    "timeframe": "0-5 minutes",
                    "actions": immediate,
                    "count": len(immediate)
                },
                "short_term_response": {
                    "timeframe": "5-15 minutes", 
                    "actions": short_term,
                    "count": len(short_term)
                },
                "medium_term_response": {
                    "timeframe": "15+ minutes",
                    "actions": medium_term,
                    "count": len(medium_term)
                }
            },
            "priority_breakdown": {
                "critical": len([a for a in actions if a["priority"] == "CRITICAL"]),
                "high": len([a for a in actions if a["priority"] == "HIGH"]),
                "medium": len([a for a in actions if a["priority"] == "MEDIUM"]),
                "low": len([a for a in actions if a["priority"] == "LOW"])
            }
        }

def main():
    """Demonstration of post-failure actions system"""
    
    print("🚨 AINO Post-Failure Actions Knowledge Base")
    print("=" * 50)
    
    manager = PostFailureActionsManager()
    
    # Test different failure scenarios
    diversion_example = {"icao": "EINN", "name": "Shannon", "distance_nm": 180, "fuel_required_tonnes": 2.5}
    
    failure_types = ["engine_failure", "hydraulic_failure", "decompression"]
    
    for failure_type in failure_types:
        print(f"\n🔧 {failure_type.upper()} Actions Timeline:")
        print("-" * 30)
        
        timeline = manager.generate_action_timeline(failure_type, diversion_example)
        
        print(f"📊 Total Actions: {timeline['total_actions']}")
        print(f"🚨 Critical: {timeline['priority_breakdown']['critical']}")
        print(f"⚡ High: {timeline['priority_breakdown']['high']}")
        print(f"📋 Medium: {timeline['priority_breakdown']['medium']}")
        
        # Show immediate response actions
        immediate = timeline['timeline']['immediate_response']['actions']
        if immediate:
            print(f"\n⏰ Immediate Response (0-5 min):")
            for action in immediate[:3]:  # Show top 3
                print(f"   • {action['action']} ({action['target_team']}) - {action['priority']}")
    
    print(f"\n✅ Post-failure actions system operational")

if __name__ == "__main__":
    main()
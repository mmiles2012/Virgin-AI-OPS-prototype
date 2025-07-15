"""
Enhanced Alternate Airport Ranking System with Airport Intelligence Integration
Combines airport intelligence data with AINO platform's diversion planning capabilities
"""

import json
from datetime import datetime
from typing import Dict, List, Optional
from airport_intel import get_airport_info, score_airport, AIRPORT_DB

class EnhancedAlternateRanker:
    """Enhanced alternate airport ranking with intelligence integration"""
    
    def __init__(self):
        self.airport_intel = AIRPORT_DB
        self.transatlantic_alternates = [
            "EINN",  # Shannon - Primary Virgin Atlantic diversion
            "BIKF",  # Keflavik - Iceland
            "CYQX",  # Gander - Newfoundland
            "LPAZ",  # Azores - Portuguese
            "BGTL"   # Thule - Greenland (emergency only)
        ]
        
    def evaluate_diversion_scenario(self, failure_type: str, aircraft_type: str, 
                                  current_position: Dict, flight_phase: str) -> Dict:
        """
        Evaluate complete diversion scenario with airport intelligence
        """
        # Get airport intelligence scores for all alternates
        airport_scores = {}
        for icao in self.transatlantic_alternates:
            intel_score = score_airport(icao, aircraft_type)
            airport_info = get_airport_info(icao)
            
            airport_scores[icao] = {
                "intelligence_score": intel_score["score"],
                "airport_info": airport_info,
                "suitability": self._get_suitability_category(intel_score["score"])
            }
        
        # Calculate operational factors
        operational_assessment = self._assess_operational_factors(
            failure_type, aircraft_type, current_position, flight_phase
        )
        
        # Generate comprehensive recommendations
        recommendations = self._generate_enhanced_recommendations(
            airport_scores, operational_assessment, failure_type
        )
        
        return {
            "scenario_assessment": {
                "failure_type": failure_type,
                "aircraft_type": aircraft_type,
                "flight_phase": flight_phase,
                "assessed_at": datetime.now().isoformat()
            },
            "airport_intelligence": airport_scores,
            "operational_assessment": operational_assessment,
            "recommendations": recommendations,
            "decision_matrix": self._create_decision_matrix(airport_scores, failure_type)
        }
    
    def _get_suitability_category(self, score: int) -> str:
        """Convert intelligence score to suitability category"""
        if score >= 90:
            return "EXCELLENT"
        elif score >= 75:
            return "GOOD"
        elif score >= 60:
            return "ADEQUATE"
        elif score >= 40:
            return "MARGINAL"
        else:
            return "UNSUITABLE"
    
    def _assess_operational_factors(self, failure_type: str, aircraft_type: str, 
                                   position: Dict, flight_phase: str) -> Dict:
        """Assess operational factors for diversion decision"""
        
        # Failure severity assessment
        failure_severity = {
            "engine_failure": {"severity": "HIGH", "urgency": "IMMEDIATE"},
            "decompression": {"severity": "CRITICAL", "urgency": "EMERGENCY"},
            "hydraulic_failure": {"severity": "MEDIUM", "urgency": "MODERATE"},
            "electrical_failure": {"severity": "HIGH", "urgency": "IMMEDIATE"},
            "fuel_leak": {"severity": "CRITICAL", "urgency": "EMERGENCY"}
        }
        
        current_severity = failure_severity.get(failure_type, 
                                              {"severity": "MEDIUM", "urgency": "MODERATE"})
        
        # Aircraft-specific considerations
        aircraft_capabilities = {
            "A350-1000": {"etops": 330, "range_nm": 8700, "fuel_capacity": 156000},
            "B787-9": {"etops": 330, "range_nm": 7635, "fuel_capacity": 126372},
            "A330-900": {"etops": 240, "range_nm": 6550, "fuel_capacity": 139090},
            "A330-300": {"etops": 240, "range_nm": 6350, "fuel_capacity": 97530}
        }
        
        aircraft_caps = aircraft_capabilities.get(aircraft_type, {})
        
        return {
            "failure_severity": current_severity,
            "aircraft_capabilities": aircraft_caps,
            "flight_phase": flight_phase,
            "weather_considerations": "Standard conditions assumed",
            "fuel_assessment": "Adequate for diversion based on aircraft type",
            "regulatory_compliance": "ETOPS compliant alternates prioritized"
        }
    
    def _generate_enhanced_recommendations(self, airport_scores: Dict, 
                                         operational: Dict, failure_type: str) -> List[Dict]:
        """Generate prioritized recommendations with rationale"""
        
        recommendations = []
        
        # Sort airports by intelligence score
        sorted_airports = sorted(airport_scores.items(), 
                               key=lambda x: x[1]["intelligence_score"], 
                               reverse=True)
        
        for rank, (icao, data) in enumerate(sorted_airports, 1):
            airport_info = data["airport_info"]
            
            # Skip if airport has critical issues
            if data["suitability"] == "UNSUITABLE":
                continue
                
            recommendation = {
                "rank": rank,
                "icao": icao,
                "airport_name": airport_info.get("name", "Unknown"),
                "intelligence_score": data["intelligence_score"],
                "suitability": data["suitability"],
                "rationale": self._generate_rationale(airport_info, failure_type),
                "operational_notes": self._generate_operational_notes(airport_info),
                "virgin_atlantic_support": self._assess_va_support(icao)
            }
            
            recommendations.append(recommendation)
        
        return recommendations[:3]  # Top 3 recommendations
    
    def _generate_rationale(self, airport_info: Dict, failure_type: str) -> str:
        """Generate rationale for airport selection"""
        rationale_parts = []
        
        if airport_info.get("fire_category", 0) >= 9:
            rationale_parts.append("Excellent fire/rescue capability")
        
        if airport_info.get("runway_length_ft", 0) >= 10000:
            rationale_parts.append("Long runway suitable for heavy aircraft")
        
        if airport_info.get("political_risk") == "low":
            rationale_parts.append("Low political risk")
        
        if airport_info.get("handling_available"):
            rationale_parts.append("Ground handling available")
        
        # Failure-specific rationale
        if failure_type == "engine_failure":
            rationale_parts.append("Single-engine approach capability")
        elif failure_type == "decompression":
            rationale_parts.append("Suitable for emergency descent")
        
        return "; ".join(rationale_parts) if rationale_parts else "Standard alternate"
    
    def _generate_operational_notes(self, airport_info: Dict) -> List[str]:
        """Generate operational notes for the airport"""
        notes = []
        
        if airport_info.get("fire_category", 0) < 9:
            notes.append(f"Fire category {airport_info.get('fire_category')} - may require coordination")
        
        if airport_info.get("runway_length_ft", 0) < 9500:
            notes.append("Runway length requires performance calculations")
        
        if airport_info.get("political_risk") in ["medium", "high"]:
            notes.append(f"Political risk: {airport_info.get('political_risk')} - diplomatic coordination may be needed")
        
        if not airport_info.get("handling_available"):
            notes.append("Limited ground handling - coordinate with local services")
        
        return notes
    
    def _assess_va_support(self, icao: str) -> Dict:
        """Assess Virgin Atlantic support level at airport"""
        
        # Virgin Atlantic has established support at these locations
        va_support_levels = {
            "EINN": {"level": "FULL", "notes": "Primary diversion hub with full Virgin Atlantic support"},
            "BIKF": {"level": "PARTNER", "notes": "Partner airline support available"},
            "CYQX": {"level": "BASIC", "notes": "Basic ground services through third party"},
            "LPAZ": {"level": "LIMITED", "notes": "Limited services, coordination required"},
            "BGTL": {"level": "EMERGENCY", "notes": "Emergency services only"}
        }
        
        return va_support_levels.get(icao, {"level": "UNKNOWN", "notes": "Support level unknown"})
    
    def _create_decision_matrix(self, airport_scores: Dict, failure_type: str) -> Dict:
        """Create decision matrix for operational use"""
        
        matrix = {
            "primary_choice": None,
            "backup_choice": None,
            "emergency_choice": None,
            "decision_factors": []
        }
        
        # Sort by intelligence score
        sorted_airports = sorted(airport_scores.items(), 
                               key=lambda x: x[1]["intelligence_score"], 
                               reverse=True)
        
        suitable_airports = [
            (icao, data) for icao, data in sorted_airports 
            if data["suitability"] in ["EXCELLENT", "GOOD", "ADEQUATE"]
        ]
        
        if suitable_airports:
            matrix["primary_choice"] = suitable_airports[0][0]
            
            if len(suitable_airports) > 1:
                matrix["backup_choice"] = suitable_airports[1][0]
            
            if len(suitable_airports) > 2:
                matrix["emergency_choice"] = suitable_airports[2][0]
        
        # Add decision factors
        matrix["decision_factors"] = [
            "Airport intelligence score",
            "Aircraft type compatibility",
            "Fire/rescue capability",
            "Runway length adequacy",
            "Political risk assessment",
            "Virgin Atlantic support level"
        ]
        
        return matrix

def main():
    """Demonstrate enhanced alternate airport ranking"""
    
    ranker = EnhancedAlternateRanker()
    
    # Example scenario: A350-1000 with engine failure over North Atlantic
    scenario = ranker.evaluate_diversion_scenario(
        failure_type="engine_failure",
        aircraft_type="A350-1000",
        current_position={"lat": 55.0, "lon": -30.0},
        flight_phase="cruise"
    )
    
    print("Enhanced Alternate Airport Ranking Report")
    print("="*50)
    print(f"Scenario: {scenario['scenario_assessment']['failure_type']} - {scenario['scenario_assessment']['aircraft_type']}")
    print(f"Assessment time: {scenario['scenario_assessment']['assessed_at']}")
    print()
    
    print("Recommendations:")
    for rec in scenario["recommendations"]:
        print(f"{rec['rank']}. {rec['airport_name']} ({rec['icao']})")
        print(f"   Intelligence Score: {rec['intelligence_score']}")
        print(f"   Suitability: {rec['suitability']}")
        print(f"   Rationale: {rec['rationale']}")
        print(f"   Virgin Atlantic Support: {rec['virgin_atlantic_support']['level']}")
        print()
    
    print("Decision Matrix:")
    matrix = scenario["decision_matrix"]
    print(f"Primary Choice: {matrix['primary_choice']}")
    print(f"Backup Choice: {matrix['backup_choice']}")
    print(f"Emergency Choice: {matrix['emergency_choice']}")

if __name__ == "__main__":
    main()
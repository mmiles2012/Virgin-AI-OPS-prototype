"""
Enhanced Entry Risk Alert System for AINO Aviation Intelligence Platform
Integrates passenger nationality analysis with diversion planning for visa compliance
"""

import json
from datetime import datetime
from typing import List, Dict, Any
import os

class EntryRiskAlertSystem:
    """Comprehensive entry risk analysis for passenger diversions"""
    
    def __init__(self):
        self.visa_matrix = self._load_visa_matrix()
        self.alert_thresholds = {
            'low': 0.1,      # 10% of passengers affected
            'medium': 0.25,  # 25% of passengers affected
            'high': 0.5,     # 50% of passengers affected
            'critical': 0.75 # 75% of passengers affected
        }
    
    def _load_visa_matrix(self) -> Dict[tuple, str]:
        """Load comprehensive visa requirements matrix"""
        # Enhanced visa matrix based on Virgin Atlantic passenger demographics
        return {
            # High-risk combinations for common diversion airports
            ("EINN", "Indian"): "⚠️",       # Ireland - Indian nationals
            ("BIKF", "Indian"): "⚠️",       # Iceland - Indian nationals
            ("CYQX", "Chinese"): "⚠️",      # Canada - Chinese nationals (transit visa)
            ("LPAZ", "Pakistani"): "⚠️",    # Azores - Pakistani nationals
            ("BGTL", "All"): "🚫",          # Thule - Military restricted
            ("EINN", "Pakistani"): "⚠️",    # Ireland - Pakistani nationals
            ("BIKF", "Nigerian"): "⚠️",     # Iceland - Nigerian nationals
            ("CYQX", "Iranian"): "⚠️",      # Canada - Iranian nationals
            ("LPAZ", "Bangladeshi"): "⚠️",  # Azores - Bangladeshi nationals
            ("EINN", "Somali"): "⚠️",       # Ireland - Somali nationals
            ("BIKF", "Afghan"): "⚠️",       # Iceland - Afghan nationals
            # US diversion airports
            ("KBOS", "Iranian"): "🚫",      # Boston - Iranian nationals
            ("KJFK", "Syrian"): "⚠️",       # JFK - Syrian nationals
            ("KORD", "Sudanese"): "⚠️",     # Chicago - Sudanese nationals
        }
    
    def analyze_passenger_manifest(self, flight_data: Dict[str, Any]) -> Dict[str, Any]:
        """Analyze passenger manifest for entry risk assessment"""
        # Extract passenger nationality data (simulated based on Virgin Atlantic demographics)
        passenger_nationalities = self._generate_realistic_manifest(
            flight_data.get('route', ''),
            flight_data.get('passengers', 331)
        )
        
        return {
            'total_passengers': len(passenger_nationalities),
            'nationality_breakdown': self._count_nationalities(passenger_nationalities),
            'passenger_nationalities': passenger_nationalities,
            'manifest_generated': datetime.now().isoformat()
        }
    
    def _generate_realistic_manifest(self, route: str, passenger_count: int) -> List[str]:
        """Generate realistic passenger nationality distribution based on Virgin Atlantic routes"""
        nationalities = []
        
        # Route-specific nationality patterns
        if 'JFK' in route or 'BOS' in route or 'LAX' in route or 'SFO' in route:
            # US routes - high British/US mix
            brit_ratio = 0.4
            us_ratio = 0.3
            other_ratio = 0.3
        elif 'DEL' in route or 'BOM' in route:
            # India routes - high Indian/British mix
            brit_ratio = 0.3
            indian_ratio = 0.5
            other_ratio = 0.2
        elif 'JNB' in route or 'CPT' in route:
            # South Africa routes
            brit_ratio = 0.45
            sa_ratio = 0.35
            other_ratio = 0.2
        else:
            # Default transatlantic
            brit_ratio = 0.5
            us_ratio = 0.2
            other_ratio = 0.3
        
        # Generate nationality distribution
        brit_count = int(passenger_count * brit_ratio)
        
        for _ in range(brit_count):
            nationalities.append("British")
        
        if 'indian_ratio' in locals():
            indian_count = int(passenger_count * indian_ratio)
            for _ in range(indian_count):
                nationalities.append("Indian")
        elif 'us_ratio' in locals():
            us_count = int(passenger_count * us_ratio)
            for _ in range(us_count):
                nationalities.append("American")
        elif 'sa_ratio' in locals():
            sa_count = int(passenger_count * sa_ratio)
            for _ in range(sa_count):
                nationalities.append("South African")
        
        # Fill remaining with diverse nationalities common on Virgin Atlantic
        remaining = passenger_count - len(nationalities)
        other_nats = ["Canadian", "Australian", "Irish", "German", "French", 
                     "Pakistani", "Nigerian", "Chinese", "Japanese", "Brazilian"]
        
        for i in range(remaining):
            nationalities.append(other_nats[i % len(other_nats)])
        
        return nationalities
    
    def _count_nationalities(self, nationalities: List[str]) -> Dict[str, int]:
        """Count nationality distribution"""
        counts = {}
        for nat in nationalities:
            counts[nat] = counts.get(nat, 0) + 1
        return counts
    
    def check_entry_risks(self, passenger_nationalities: List[str], 
                         diversion_airport: str) -> Dict[str, Any]:
        """Enhanced entry risk checking with detailed analysis"""
        flagged_passengers = []
        visa_issues = set()  # Use set to avoid duplicates
        
        unique_nationalities = set(passenger_nationalities)
        
        for nationality in unique_nationalities:
            # Check specific nationality restrictions
            key = (diversion_airport, nationality)
            if key in self.visa_matrix:
                if self.visa_matrix[key] == "⚠️":
                    flagged_passengers.extend([n for n in passenger_nationalities if n == nationality])
                    visa_issues.add(f"{nationality} nationals require visa for {diversion_airport}")
                elif self.visa_matrix[key] == "🚫":
                    flagged_passengers.extend([n for n in passenger_nationalities if n == nationality])
                    visa_issues.add(f"{nationality} nationals PROHIBITED entry to {diversion_airport}")
            
            # Check if airport prohibits all foreign nationals
            universal_key = (diversion_airport, "All")
            if universal_key in self.visa_matrix and self.visa_matrix[universal_key] == "🚫":
                if nationality != "American" and diversion_airport.startswith("K"):  # US airports
                    flagged_passengers.extend([n for n in passenger_nationalities if n == nationality])
                    visa_issues.add(f"Military/restricted facility - foreign nationals prohibited")
        
        total_passengers = len(passenger_nationalities)
        unique_flagged = len(set(flagged_passengers))
        risk_score = unique_flagged / max(1, total_passengers) if total_passengers > 0 else 0
        
        # Determine risk level
        risk_level = "low"
        for level, threshold in self.alert_thresholds.items():
            if risk_score >= threshold:
                risk_level = level
        
        return {
            "destination": diversion_airport,
            "total_passengers": total_passengers,
            "flagged_passengers": unique_flagged,
            "flagged_nationalities": list(set(flagged_passengers)),
            "visa_issues": list(visa_issues),
            "entry_risk_score": round(risk_score, 3),
            "risk_level": risk_level,
            "analysis_timestamp": datetime.now().isoformat(),
            "recommendations": self._generate_recommendations(risk_level, diversion_airport, visa_issues)
        }
    
    def _generate_recommendations(self, risk_level: str, airport: str, visa_issues: List[str]) -> List[str]:
        """Generate operational recommendations based on risk level"""
        recommendations = []
        
        if risk_level == "critical":
            recommendations.append("IMMEDIATE ACTION: Consider alternative diversion airport")
            recommendations.append("Notify diplomatic services for passenger assistance")
            recommendations.append("Prepare for extended ground time and passenger accommodation")
        elif risk_level == "high":
            recommendations.append("Contact airport immigration authorities before landing")
            recommendations.append("Prepare transit area accommodation for affected passengers")
            recommendations.append("Coordinate with Virgin Atlantic customer services")
        elif risk_level == "medium":
            recommendations.append("Monitor passenger processing times")
            recommendations.append("Prepare documentation for affected passengers")
        else:
            recommendations.append("Standard immigration procedures expected")
        
        # Airport-specific recommendations
        if airport == "BGTL":
            recommendations.append("Military facility - coordinate with US Air Force authorities")
        elif airport in ["EINN", "BIKF"]:
            recommendations.append("EU immigration rules apply - prepare for Schengen requirements")
        
        return recommendations
    
    def generate_alert_notification(self, flight_number: str, risk_analysis: Dict[str, Any]) -> Dict[str, Any]:
        """Generate comprehensive alert notification for operations center"""
        alert_priority = {
            "low": "INFO",
            "medium": "WARNING", 
            "high": "ALERT",
            "critical": "CRITICAL"
        }.get(risk_analysis["risk_level"], "INFO")
        
        return {
            "alert_id": f"ENTRY_RISK_{flight_number}_{datetime.now().strftime('%Y%m%d_%H%M%S')}",
            "flight_number": flight_number,
            "alert_type": "ENTRY_RISK_ASSESSMENT",
            "priority": alert_priority,
            "risk_level": risk_analysis["risk_level"],
            "risk_score": risk_analysis["entry_risk_score"],
            "destination": risk_analysis["destination"],
            "affected_passengers": risk_analysis["flagged_passengers"],
            "total_passengers": risk_analysis["total_passengers"],
            "visa_issues": risk_analysis["visa_issues"],
            "recommendations": risk_analysis["recommendations"],
            "timestamp": datetime.now().isoformat(),
            "requires_action": risk_analysis["risk_level"] in ["high", "critical"],
            "notification_channels": ["operations_center", "customer_services", "ground_handling"]
        }

def main():
    """Demonstration of Enhanced Entry Risk Alert System"""
    print("Enhanced Entry Risk Alert System for AINO Platform")
    print("="*60)
    
    risk_system = EntryRiskAlertSystem()
    
    # Test scenario: VIR103 (LHR-ATL) diverting to EINN (Shannon)
    test_flight = {
        'flight_number': 'VIR103',
        'route': 'LHR-ATL',
        'passengers': 331,
        'aircraft_type': 'A350-1000'
    }
    
    diversion_airport = 'EINN'  # Shannon Airport
    
    print(f"\nScenario: {test_flight['flight_number']} diverting to {diversion_airport}")
    print(f"Route: {test_flight['route']}")
    print(f"Passengers: {test_flight['passengers']}")
    
    # Analyze passenger manifest
    manifest_analysis = risk_system.analyze_passenger_manifest(test_flight)
    print(f"\nPassenger Manifest Analysis:")
    print(f"Total Passengers: {manifest_analysis['total_passengers']}")
    print("Nationality Breakdown:")
    for nat, count in manifest_analysis['nationality_breakdown'].items():
        print(f"  {nat}: {count}")
    
    # Check entry risks
    risk_analysis = risk_system.check_entry_risks(
        manifest_analysis['passenger_nationalities'], 
        diversion_airport
    )
    
    print(f"\nEntry Risk Analysis:")
    print(f"Risk Level: {risk_analysis['risk_level'].upper()}")
    print(f"Risk Score: {risk_analysis['entry_risk_score']:.1%}")
    print(f"Flagged Passengers: {risk_analysis['flagged_passengers']}/{risk_analysis['total_passengers']}")
    
    if risk_analysis['flagged_nationalities']:
        print(f"Affected Nationalities: {', '.join(risk_analysis['flagged_nationalities'])}")
        print("Visa Issues:")
        for issue in risk_analysis['visa_issues']:
            print(f"  • {issue}")
    
    print("\nRecommendations:")
    for rec in risk_analysis['recommendations']:
        print(f"  • {rec}")
    
    # Generate alert notification
    alert = risk_system.generate_alert_notification(test_flight['flight_number'], risk_analysis)
    print(f"\nAlert Generated:")
    print(f"Alert ID: {alert['alert_id']}")
    print(f"Priority: {alert['priority']}")
    print(f"Action Required: {alert['requires_action']}")
    
    print("\n✅ Enhanced Entry Risk Alert System Operational")

if __name__ == "__main__":
    main()
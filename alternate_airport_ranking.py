#!/usr/bin/env python3
"""
Alternate Airport Ranking System for AINO Enhanced Scenario Simulator
Integrates with digital twin profiles for intelligent diversion planning
"""

import json
import logging
from typing import Dict, List
from pathlib import Path

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class AlternateAirportRanker:
    """Intelligent alternate airport ranking system integrated with AINO digital twins"""
    
    def __init__(self):
        self.alternate_database = self._load_alternate_database()
        logger.info(f"Initialized alternate airport ranker with {len(self.alternate_database)} airports")
    
    def _load_alternate_database(self) -> List[Dict]:
        """Load comprehensive alternate airport database with authentic data"""
        return [
            {
                "icao": "BIKF",
                "name": "Keflavik (Iceland)",
                "distance_nm": 400,
                "runway_length_ft": 10000,
                "rescue_fire_category": 9,
                "weather": {"visibility_m": 8000, "ceiling_ft": 1200},
                "fuel_required_tonnes": 3.2,
                "maintenance_capability": True,
                "customs_24h": True,
                "region": "NORTH_ATLANTIC"
            },
            {
                "icao": "CYYT",
                "name": "St John's (Newfoundland)",
                "distance_nm": 620,
                "runway_length_ft": 8500,
                "rescue_fire_category": 8,
                "weather": {"visibility_m": 3000, "ceiling_ft": 700},
                "fuel_required_tonnes": 4.0,
                "maintenance_capability": True,
                "customs_24h": True,
                "region": "NORTH_ATLANTIC"
            },
            {
                "icao": "BGSF",
                "name": "Kangerlussuaq (Greenland)",
                "distance_nm": 530,
                "runway_length_ft": 9200,
                "rescue_fire_category": 7,
                "weather": {"visibility_m": 10000, "ceiling_ft": 3000},
                "fuel_required_tonnes": 3.5,
                "maintenance_capability": False,
                "customs_24h": False,
                "region": "NORTH_ATLANTIC"
            },
            {
                "icao": "EGPF",
                "name": "Glasgow (Scotland)",
                "distance_nm": 200,
                "runway_length_ft": 8400,
                "rescue_fire_category": 9,
                "weather": {"visibility_m": 6000, "ceiling_ft": 1500},
                "fuel_required_tonnes": 2.8,
                "maintenance_capability": True,
                "customs_24h": True,
                "region": "EUROPE"
            },
            {
                "icao": "EINN",
                "name": "Shannon (Ireland)",
                "distance_nm": 180,
                "runway_length_ft": 10500,
                "rescue_fire_category": 9,
                "weather": {"visibility_m": 5000, "ceiling_ft": 1000},
                "fuel_required_tonnes": 2.5,
                "maintenance_capability": True,
                "customs_24h": True,
                "region": "EUROPE"
            },
            {
                "icao": "CYQX",
                "name": "Gander (Newfoundland)",
                "distance_nm": 580,
                "runway_length_ft": 10500,
                "rescue_fire_category": 8,
                "weather": {"visibility_m": 4000, "ceiling_ft": 800},
                "fuel_required_tonnes": 3.8,
                "maintenance_capability": True,
                "customs_24h": True,
                "region": "NORTH_ATLANTIC"
            },
            {
                "icao": "BGBW",
                "name": "Narsarsuaq (Greenland)",
                "distance_nm": 450,
                "runway_length_ft": 6000,
                "rescue_fire_category": 6,
                "weather": {"visibility_m": 8000, "ceiling_ft": 2000},
                "fuel_required_tonnes": 3.0,
                "maintenance_capability": False,
                "customs_24h": False,
                "region": "NORTH_ATLANTIC"
            }
        ]
    
    def evaluate_alternate(self, airport: Dict, failure_profile: Dict, aircraft_type: str) -> Dict:
        """Evaluate alternate airport suitability for specific failure and aircraft"""
        
        # Check runway length requirement
        landing_distance_factor = failure_profile.get("landing_distance_factor", 1.0)
        required_runway = self._get_aircraft_runway_requirement(aircraft_type) * landing_distance_factor
        runway_ok = airport["runway_length_ft"] >= required_runway
        
        # Check fire category requirement
        required_firecat = self._get_aircraft_firecat_requirement(aircraft_type)
        firecat_ok = airport["rescue_fire_category"] >= required_firecat
        
        # Check weather minimums
        vis_ok = airport["weather"]["visibility_m"] >= 3000
        ceiling_ok = airport["weather"]["ceiling_ft"] >= 1000
        weather_ok = vis_ok and ceiling_ok
        
        # Check maintenance capability for engine failures
        maintenance_ok = True
        if failure_profile.get("diversion_required", False):
            maintenance_ok = airport.get("maintenance_capability", False)
        
        # Calculate composite score
        score = 0
        if runway_ok: score += 3  # High weight for runway
        if firecat_ok: score += 2  # Medium weight for fire category
        if weather_ok: score += 2  # Medium weight for weather
        if maintenance_ok: score += 1  # Lower weight for maintenance
        
        # Distance penalty (closer is better)
        distance_penalty = airport["distance_nm"] / 100
        final_score = score - distance_penalty
        
        # Generate comments
        comments = []
        if not runway_ok:
            comments.append(f"Runway too short: {airport['runway_length_ft']}ft < {required_runway}ft required")
        if not firecat_ok:
            comments.append(f"Fire category insufficient: {airport['rescue_fire_category']} < {required_firecat} required")
        if not weather_ok:
            comments.append("Weather below minimums")
        if not maintenance_ok:
            comments.append("No maintenance capability available")
        
        return {
            "icao": airport["icao"],
            "name": airport["name"],
            "distance_nm": airport["distance_nm"],
            "runway_ok": runway_ok,
            "firecat_ok": firecat_ok,
            "weather_ok": weather_ok,
            "maintenance_ok": maintenance_ok,
            "fuel_required_tonnes": airport["fuel_required_tonnes"],
            "score": round(final_score, 2),
            "suitability": self._get_suitability_rating(final_score),
            "comments": comments,
            "region": airport.get("region", "UNKNOWN")
        }
    
    def _get_aircraft_runway_requirement(self, aircraft_type: str) -> int:
        """Get minimum runway length requirement for aircraft type"""
        requirements = {
            "A350-1000": 8000,
            "B787-9": 7500,
            "A330-300": 7500,
            "A330-900": 7500
        }
        return requirements.get(aircraft_type, 8000)
    
    def _get_aircraft_firecat_requirement(self, aircraft_type: str) -> int:
        """Get minimum fire category requirement for aircraft type"""
        requirements = {
            "A350-1000": 9,
            "B787-9": 8,
            "A330-300": 8,
            "A330-900": 8
        }
        return requirements.get(aircraft_type, 8)
    
    def _get_suitability_rating(self, score: float) -> str:
        """Convert numeric score to suitability rating"""
        if score >= 7.0:
            return "EXCELLENT"
        elif score >= 5.0:
            return "GOOD"
        elif score >= 3.0:
            return "ADEQUATE"
        elif score >= 1.0:
            return "MARGINAL"
        else:
            return "UNSUITABLE"
    
    def rank_alternates(self, failure_profile: Dict, aircraft_type: str) -> List[Dict]:
        """Rank alternate airports for specific failure scenario"""
        
        # Evaluate all alternates
        evaluated = [
            self.evaluate_alternate(airport, failure_profile, aircraft_type)
            for airport in self.alternate_database
        ]
        
        # Sort by score (highest first), then by distance (closest first)
        ranked = sorted(evaluated, key=lambda x: (-x["score"], x["distance_nm"]))
        
        logger.info(f"Ranked {len(ranked)} alternates for {aircraft_type} failure scenario")
        return ranked
    
    def get_recommended_alternates(self, failure_profile: Dict, aircraft_type: str, max_results: int = 5) -> List[Dict]:
        """Get top recommended alternates for failure scenario"""
        
        ranked = self.rank_alternates(failure_profile, aircraft_type)
        
        # Filter to suitable alternates only
        suitable = [alt for alt in ranked if alt["suitability"] in ["EXCELLENT", "GOOD", "ADEQUATE"]]
        
        return suitable[:max_results]
    
    def generate_diversion_report(self, failure_profile: Dict, aircraft_type: str, flight_number: str) -> Dict:
        """Generate comprehensive diversion analysis report"""
        
        recommended = self.get_recommended_alternates(failure_profile, aircraft_type)
        all_ranked = self.rank_alternates(failure_profile, aircraft_type)
        
        report = {
            "flight_number": flight_number,
            "aircraft_type": aircraft_type,
            "failure_type": failure_profile.get("type", "unknown"),
            "analysis": {
                "total_alternates_evaluated": len(all_ranked),
                "suitable_alternates": len([a for a in all_ranked if a["suitability"] in ["EXCELLENT", "GOOD", "ADEQUATE"]]),
                "recommended_alternates": len(recommended),
                "best_alternate": recommended[0] if recommended else None
            },
            "recommended_alternates": recommended,
            "all_alternates": all_ranked
        }
        
        return report

def main():
    """Demonstration of alternate airport ranking system"""
    
    print("🛫 AINO Alternate Airport Ranking System")
    print("=" * 50)
    
    # Initialize ranker
    ranker = AlternateAirportRanker()
    
    # Load A350-1000 digital twin profile
    try:
        with open("digital_twin_profiles/A350_1000_digital_twin.json") as f:
            twin_profile = json.load(f)
        
        # Test different failure scenarios
        failure_scenarios = [
            ("engine_failure", "A350-1000"),
            ("hydraulic_failure", "A350-1000"),
            ("decompression", "A350-1000")
        ]
        
        for failure_type, aircraft_type in failure_scenarios:
            print(f"\n🔧 Testing: {failure_type} on {aircraft_type}")
            print("-" * 30)
            
            failure_profile = twin_profile.get(failure_type, {})
            failure_profile["type"] = failure_type
            
            # Generate diversion report
            report = ranker.generate_diversion_report(failure_profile, aircraft_type, "VS3")
            
            print(f"📊 Analysis Summary:")
            print(f"   Total alternates evaluated: {report['analysis']['total_alternates_evaluated']}")
            print(f"   Suitable alternates: {report['analysis']['suitable_alternates']}")
            print(f"   Recommended alternates: {report['analysis']['recommended_alternates']}")
            
            if report['analysis']['best_alternate']:
                best = report['analysis']['best_alternate']
                print(f"   Best alternate: {best['name']} ({best['icao']}) - {best['suitability']}")
            
            # Show top 3 recommendations
            print(f"\n🎯 Top Recommendations:")
            for i, alt in enumerate(report['recommended_alternates'][:3], 1):
                print(f"   {i}. {alt['name']} ({alt['icao']}) - {alt['distance_nm']}nm - {alt['suitability']}")
        
        print(f"\n✅ Alternate ranking system operational")
        
    except FileNotFoundError:
        print("❌ Digital twin profile not found")
    except Exception as e:
        print(f"❌ Error: {e}")

if __name__ == "__main__":
    main()
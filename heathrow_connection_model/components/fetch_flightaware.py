#!/usr/bin/env python3
"""
FlightAware AeroAPI Integration for Heathrow Connection Model
Replaces fetch_heathrow.py with authentic FlightAware arrival data
"""

import requests
import json
import os
from datetime import datetime, timedelta
from typing import Dict, List, Optional
import pandas as pd

class FlightAwareHeathrowFetcher:
    """Fetches Heathrow arrival data from FlightAware AeroAPI for connection modeling"""
    
    def __init__(self):
        self.api_key = os.getenv('FLIGHTAWARE_API_KEY')
        self.base_url = "https://aeroapi.flightaware.com/aeroapi"
        self.airport = "EGLL"  # Heathrow ICAO code
        
        if not self.api_key:
            print("Warning: FLIGHTAWARE_API_KEY not configured - using fallback data")
    
    def get_arrivals(self, max_results: int = 50) -> Dict:
        """
        Fetch current and recent arrivals at Heathrow
        Returns data suitable for connection modeling
        """
        if not self.api_key:
            return self._get_fallback_arrivals()
        
        try:
            headers = {
                "Authorization": f"Bearer {self.api_key}",
                "Content-Type": "application/json"
            }
            
            url = f"{self.base_url}/airports/{self.airport}/flights/arrivals"
            params = {
                "howMany": max_results,
                "start": (datetime.now() - timedelta(hours=2)).isoformat(),
                "end": (datetime.now() + timedelta(hours=4)).isoformat()
            }
            
            print(f"[FlightAware] Fetching Heathrow arrivals: {url}")
            response = requests.get(url, headers=headers, params=params, timeout=30)
            
            if response.status_code == 200:
                data = response.json()
                processed_data = self._process_arrival_data(data)
                print(f"[FlightAware] Successfully fetched {len(processed_data.get('arrivals', []))} arrivals")
                return processed_data
            else:
                print(f"[FlightAware] API error {response.status_code}: {response.text}")
                return self._get_fallback_arrivals()
                
        except Exception as e:
            print(f"[FlightAware] Error fetching arrivals: {e}")
            return self._get_fallback_arrivals()
    
    def get_departures(self, max_results: int = 50) -> Dict:
        """
        Fetch current and upcoming departures from Heathrow
        Important for connection modeling - passengers connecting to these flights
        """
        if not self.api_key:
            return self._get_fallback_departures()
        
        try:
            headers = {
                "Authorization": f"Bearer {self.api_key}",
                "Content-Type": "application/json"
            }
            
            url = f"{self.base_url}/airports/{self.airport}/flights/departures"
            params = {
                "howMany": max_results,
                "start": datetime.now().isoformat(),
                "end": (datetime.now() + timedelta(hours=6)).isoformat()
            }
            
            print(f"[FlightAware] Fetching Heathrow departures: {url}")
            response = requests.get(url, headers=headers, params=params, timeout=30)
            
            if response.status_code == 200:
                data = response.json()
                processed_data = self._process_departure_data(data)
                print(f"[FlightAware] Successfully fetched {len(processed_data.get('departures', []))} departures")
                return processed_data
            else:
                print(f"[FlightAware] API error {response.status_code}: {response.text}")
                return self._get_fallback_departures()
                
        except Exception as e:
            print(f"[FlightAware] Error fetching departures: {e}")
            return self._get_fallback_departures()
    
    def get_connection_data(self) -> Dict:
        """
        Get comprehensive connection data combining arrivals and departures
        This is the main method for connection modeling
        """
        print("[FlightAware] Fetching comprehensive Heathrow connection data...")
        
        arrivals_data = self.get_arrivals()
        departures_data = self.get_departures()
        
        # Combine and analyze for connections
        connection_analysis = self._analyze_connections(arrivals_data, departures_data)
        
        return {
            "arrivals": arrivals_data.get("arrivals", []),
            "departures": departures_data.get("departures", []),
            "connection_opportunities": connection_analysis,
            "data_timestamp": datetime.now().isoformat(),
            "data_source": "FlightAware_AeroAPI" if self.api_key else "Fallback_Simulation"
        }
    
    def _process_arrival_data(self, raw_data: Dict) -> Dict:
        """Process raw FlightAware arrival data for connection modeling"""
        arrivals = []
        
        for flight in raw_data.get("arrivals", []):
            processed_flight = {
                "flight_number": flight.get("ident", "Unknown"),
                "airline": flight.get("operator", "Unknown"),
                "aircraft_type": flight.get("aircraft_type", "Unknown"),
                "origin": flight.get("origin", {}).get("code", "Unknown"),
                "scheduled_arrival": flight.get("scheduled_arrival", None),
                "estimated_arrival": flight.get("estimated_arrival", None),
                "actual_arrival": flight.get("actual_arrival", None),
                "gate": flight.get("gate_destination", "Unknown"),
                "terminal": self._get_terminal_from_gate(flight.get("gate_destination", "")),
                "status": flight.get("status", "Unknown"),
                "delay_minutes": self._calculate_delay(flight),
                "is_international": self._is_international_flight(flight),
                "passenger_count": self._estimate_passenger_count(flight),
                "connection_window": self._calculate_connection_window(flight)
            }
            arrivals.append(processed_flight)
        
        return {
            "arrivals": arrivals,
            "total_arrivals": len(arrivals),
            "data_quality": "authentic_flightaware"
        }
    
    def _process_departure_data(self, raw_data: Dict) -> Dict:
        """Process raw FlightAware departure data for connection modeling"""
        departures = []
        
        for flight in raw_data.get("departures", []):
            processed_flight = {
                "flight_number": flight.get("ident", "Unknown"),
                "airline": flight.get("operator", "Unknown"),
                "aircraft_type": flight.get("aircraft_type", "Unknown"),
                "destination": flight.get("destination", {}).get("code", "Unknown"),
                "scheduled_departure": flight.get("scheduled_departure", None),
                "estimated_departure": flight.get("estimated_departure", None),
                "gate": flight.get("gate_origin", "Unknown"),
                "terminal": self._get_terminal_from_gate(flight.get("gate_origin", "")),
                "status": flight.get("status", "Unknown"),
                "check_in_closes": self._calculate_check_in_deadline(flight),
                "minimum_connection_time": self._get_mct(flight),
                "is_virgin_atlantic": "VIR" in flight.get("ident", "") or "VS" in flight.get("ident", "")
            }
            departures.append(processed_flight)
        
        return {
            "departures": departures,
            "total_departures": len(departures),
            "data_quality": "authentic_flightaware"
        }
    
    def _analyze_connections(self, arrivals_data: Dict, departures_data: Dict) -> List[Dict]:
        """Analyze potential connections between arrivals and departures"""
        connections = []
        
        arrivals = arrivals_data.get("arrivals", [])
        departures = departures_data.get("departures", [])
        
        for arrival in arrivals:
            for departure in departures:
                connection = self._evaluate_connection(arrival, departure)
                if connection["is_viable"]:
                    connections.append(connection)
        
        # Sort by connection probability
        connections.sort(key=lambda x: x["success_probability"], reverse=True)
        
        return connections[:50]  # Return top 50 viable connections
    
    def _evaluate_connection(self, arrival: Dict, departure: Dict) -> Dict:
        """Evaluate if a connection between an arrival and departure is viable"""
        try:
            # Parse arrival and departure times
            arr_time = self._parse_time(arrival.get("actual_arrival") or arrival.get("estimated_arrival") or arrival.get("scheduled_arrival"))
            dep_time = self._parse_time(departure.get("scheduled_departure"))
            
            if not arr_time or not dep_time:
                return {"is_viable": False, "reason": "Missing time data"}
            
            # Calculate connection time in minutes
            connection_time = (dep_time - arr_time).total_seconds() / 60
            
            # Determine minimum connection time based on terminals
            mct = self._get_connection_mct(arrival, departure)
            
            # Calculate success probability
            success_prob = self._calculate_connection_probability(connection_time, mct, arrival, departure)
            
            return {
                "is_viable": connection_time >= mct and connection_time <= 360,  # Max 6 hours
                "arrival_flight": arrival["flight_number"],
                "departure_flight": departure["flight_number"],
                "connection_time_minutes": int(connection_time),
                "minimum_connection_time": mct,
                "success_probability": success_prob,
                "risk_factors": self._identify_risk_factors(arrival, departure, connection_time),
                "terminal_transfer_required": arrival.get("terminal") != departure.get("terminal"),
                "is_virgin_atlantic_connection": departure.get("is_virgin_atlantic", False)
            }
            
        except Exception as e:
            return {"is_viable": False, "reason": f"Processing error: {e}"}
    
    def _calculate_connection_probability(self, connection_time: float, mct: int, arrival: Dict, departure: Dict) -> float:
        """Calculate probability of successful connection based on multiple factors"""
        if connection_time < mct:
            return 0.0
        
        # Base probability increases with connection time
        base_prob = min(0.95, 0.3 + (connection_time - mct) / 180)
        
        # Adjust for various factors
        if arrival.get("delay_minutes", 0) > 15:
            base_prob *= 0.8  # Reduce for delayed arrivals
        
        if arrival.get("terminal") != departure.get("terminal"):
            base_prob *= 0.9  # Reduce for terminal transfers
        
        if arrival.get("is_international") and not departure.get("is_international"):
            base_prob *= 0.85  # Reduce for international to domestic
        
        return round(base_prob, 3)
    
    def _get_connection_mct(self, arrival: Dict, departure: Dict) -> int:
        """Get minimum connection time based on flight types and terminals"""
        # International to International: 90 minutes
        # International to Domestic: 75 minutes  
        # Domestic to International: 60 minutes
        # Domestic to Domestic: 45 minutes
        # Add 15 minutes for terminal transfers
        
        arr_intl = arrival.get("is_international", True)
        dep_intl = departure.get("destination", "").startswith(("E", "L"))  # Europe codes
        terminal_transfer = arrival.get("terminal") != departure.get("terminal")
        
        if arr_intl and dep_intl:
            mct = 90
        elif arr_intl and not dep_intl:
            mct = 75
        elif not arr_intl and dep_intl:
            mct = 60
        else:
            mct = 45
        
        if terminal_transfer:
            mct += 15
        
        return mct
    
    def _identify_risk_factors(self, arrival: Dict, departure: Dict, connection_time: float) -> List[str]:
        """Identify risk factors for the connection"""
        risks = []
        
        if connection_time < 90:
            risks.append("TIGHT_CONNECTION")
        
        if arrival.get("delay_minutes", 0) > 10:
            risks.append("ARRIVAL_DELAY")
        
        if arrival.get("terminal") != departure.get("terminal"):
            risks.append("TERMINAL_TRANSFER")
        
        if arrival.get("is_international") and departure.get("is_international"):
            risks.append("INTERNATIONAL_CONNECTION")
        
        if "weather" in arrival.get("status", "").lower():
            risks.append("WEATHER_IMPACT")
        
        return risks
    
    def _get_fallback_arrivals(self) -> Dict:
        """Provide realistic fallback arrival data for connection modeling"""
        current_time = datetime.now()
        arrivals = []
        
        # Virgin Atlantic flights
        va_flights = [
            {"flight": "VS11", "origin": "BOS", "delay": 5, "gate": "A10", "terminal": "T3"},
            {"flight": "VS25", "origin": "JFK", "delay": -3, "gate": "A12", "terminal": "T3"},
            {"flight": "VS103", "origin": "ATL", "delay": 12, "gate": "A8", "terminal": "T3"},
            {"flight": "VS355", "origin": "BOM", "delay": 8, "gate": "A15", "terminal": "T3"},
        ]
        
        # Other airlines for connection opportunities
        other_flights = [
            {"flight": "AF1081", "origin": "CDG", "delay": 2, "gate": "B32", "terminal": "T4"},
            {"flight": "KL1008", "origin": "AMS", "delay": -5, "gate": "B28", "terminal": "T4"},
            {"flight": "DL31", "origin": "JFK", "delay": 15, "gate": "B45", "terminal": "T4"},
            {"flight": "KQ100", "origin": "NBO", "delay": 22, "gate": "B38", "terminal": "T4"},
        ]
        
        for i, flight_data in enumerate(va_flights + other_flights):
            arrival_time = current_time - timedelta(minutes=30-i*10) + timedelta(minutes=flight_data["delay"])
            
            arrivals.append({
                "flight_number": flight_data["flight"],
                "airline": "Virgin Atlantic" if flight_data["flight"].startswith("VS") else "Partner Airline",
                "aircraft_type": "A350" if flight_data["flight"].startswith("VS") else "B777",
                "origin": flight_data["origin"],
                "scheduled_arrival": (arrival_time - timedelta(minutes=flight_data["delay"])).isoformat(),
                "actual_arrival": arrival_time.isoformat(),
                "gate": flight_data["gate"],
                "terminal": flight_data["terminal"],
                "status": "ARRIVED" if flight_data["delay"] > 0 else "ON_TIME",
                "delay_minutes": flight_data["delay"],
                "is_international": True,
                "passenger_count": 280 if flight_data["flight"].startswith("VS") else 350,
                "connection_window": 120
            })
        
        return {
            "arrivals": arrivals,
            "total_arrivals": len(arrivals),
            "data_quality": "fallback_simulation"
        }
    
    def _get_fallback_departures(self) -> Dict:
        """Provide realistic fallback departure data for connection modeling"""
        current_time = datetime.now()
        departures = []
        
        # Virgin Atlantic departures
        va_departures = [
            {"flight": "VS12", "dest": "BOS", "gate": "A11", "terminal": "T3", "offset": 90},
            {"flight": "VS26", "dest": "JFK", "gate": "A13", "terminal": "T3", "offset": 120},
            {"flight": "VS104", "dest": "ATL", "gate": "A9", "terminal": "T3", "offset": 150},
            {"flight": "VS356", "dest": "BOM", "gate": "A16", "terminal": "T3", "offset": 180},
        ]
        
        # SkyTeam partner departures  
        skyteam_departures = [
            {"flight": "AF1380", "dest": "CDG", "gate": "B33", "terminal": "T4", "offset": 75},
            {"flight": "KL1007", "dest": "AMS", "gate": "B29", "terminal": "T4", "offset": 105},
            {"flight": "DL32", "dest": "JFK", "gate": "B46", "terminal": "T4", "offset": 135},
            {"flight": "KQ101", "dest": "NBO", "gate": "B39", "terminal": "T4", "offset": 165},
        ]
        
        for flight_data in va_departures + skyteam_departures:
            departure_time = current_time + timedelta(minutes=flight_data["offset"])
            
            departures.append({
                "flight_number": flight_data["flight"],
                "airline": "Virgin Atlantic" if flight_data["flight"].startswith("VS") else "SkyTeam Partner",
                "aircraft_type": "A350" if flight_data["flight"].startswith("VS") else "B777",
                "destination": flight_data["dest"],
                "scheduled_departure": departure_time.isoformat(),
                "gate": flight_data["gate"],
                "terminal": flight_data["terminal"],
                "status": "SCHEDULED",
                "check_in_closes": (departure_time - timedelta(minutes=60)).isoformat(),
                "minimum_connection_time": 75 if flight_data["terminal"] == "T4" else 60,
                "is_virgin_atlantic": flight_data["flight"].startswith("VS")
            })
        
        return {
            "departures": departures,
            "total_departures": len(departures),
            "data_quality": "fallback_simulation"
        }
    
    # Utility methods
    def _parse_time(self, time_str: Optional[str]) -> Optional[datetime]:
        """Parse ISO time string to datetime object"""
        if not time_str:
            return None
        try:
            return datetime.fromisoformat(time_str.replace('Z', '+00:00'))
        except:
            return None
    
    def _calculate_delay(self, flight: Dict) -> int:
        """Calculate delay in minutes"""
        scheduled = self._parse_time(flight.get("scheduled_arrival"))
        actual = self._parse_time(flight.get("actual_arrival") or flight.get("estimated_arrival"))
        
        if scheduled and actual:
            return int((actual - scheduled).total_seconds() / 60)
        return 0
    
    def _get_terminal_from_gate(self, gate: str) -> str:
        """Determine terminal from gate number"""
        if not gate or gate == "Unknown":
            return "Unknown"
        
        gate_num = gate.upper()
        if gate_num.startswith(('A', 'B')):
            return "T3" if gate_num.startswith('A') else "T4"
        elif gate_num.startswith(('C', 'D')):
            return "T5"
        else:
            return "T2"
    
    def _is_international_flight(self, flight: Dict) -> bool:
        """Determine if flight is international based on origin"""
        origin = flight.get("origin", {})
        if isinstance(origin, dict):
            origin_code = origin.get("code", "")
        else:
            origin_code = str(origin)
        
        # UK domestic codes start with EG
        return not origin_code.startswith("EG")
    
    def _estimate_passenger_count(self, flight: Dict) -> int:
        """Estimate passenger count based on aircraft type"""
        aircraft = flight.get("aircraft_type", "").upper()
        
        if "A350" in aircraft or "A359" in aircraft:
            return 280
        elif "A330" in aircraft:
            return 250
        elif "B787" in aircraft or "B789" in aircraft:
            return 280
        elif "B777" in aircraft:
            return 350
        elif "A320" in aircraft or "B737" in aircraft:
            return 180
        else:
            return 200
    
    def _calculate_connection_window(self, flight: Dict) -> int:
        """Calculate ideal connection window for this arrival"""
        if flight.get("is_international", True):
            return 90  # International arrivals need more time
        else:
            return 60   # Domestic arrivals
    
    def _calculate_check_in_deadline(self, flight: Dict) -> str:
        """Calculate when check-in closes for departure"""
        dep_time = self._parse_time(flight.get("scheduled_departure"))
        if dep_time:
            # International: 60 minutes, Domestic: 45 minutes
            minutes_before = 60 if self._is_international_departure(flight) else 45
            deadline = dep_time - timedelta(minutes=minutes_before)
            return deadline.isoformat()
        return "Unknown"
    
    def _is_international_departure(self, flight: Dict) -> bool:
        """Determine if departure is international"""
        dest = flight.get("destination", {})
        if isinstance(dest, dict):
            dest_code = dest.get("code", "")
        else:
            dest_code = str(dest)
        
        # UK domestic codes start with EG
        return not dest_code.startswith("EG")
    
    def _get_mct(self, flight: Dict) -> int:
        """Get minimum connection time for this departure"""
        if self._is_international_departure(flight):
            return 75  # International departures
        else:
            return 60   # Domestic departures

def main():
    """Test the FlightAware fetcher"""
    print("Testing FlightAware Heathrow Connection Data Fetcher")
    print("=" * 50)
    
    fetcher = FlightAwareHeathrowFetcher()
    
    # Test connection data fetch
    connection_data = fetcher.get_connection_data()
    
    print(f"\nFetched {len(connection_data['arrivals'])} arrivals")
    print(f"Fetched {len(connection_data['departures'])} departures")
    print(f"Found {len(connection_data['connection_opportunities'])} viable connections")
    print(f"Data source: {connection_data['data_source']}")
    
    # Show sample connections
    if connection_data['connection_opportunities']:
        print("\nTop Connection Opportunities:")
        for i, conn in enumerate(connection_data['connection_opportunities'][:5]):
            print(f"{i+1}. {conn['arrival_flight']} → {conn['departure_flight']}")
            print(f"   Connection time: {conn['connection_time_minutes']} min")
            print(f"   Success probability: {conn['success_probability']:.1%}")
            print(f"   Risk factors: {', '.join(conn['risk_factors']) if conn['risk_factors'] else 'None'}")
            print()
    
    # Save data for ML training
    output_file = "heathrow_connection_data.json"
    with open(output_file, 'w') as f:
        json.dump(connection_data, f, indent=2, default=str)
    
    print(f"Data saved to {output_file}")

if __name__ == "__main__":
    main()
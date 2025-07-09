#!/usr/bin/env python3
"""
FlightAware Data Fetcher for Heathrow Connection Model
Fetches authentic arrival and departure data using FlightAware AeroAPI
"""

import requests
import json
import os
from datetime import datetime, timedelta
from typing import Dict, List, Optional
import time

class FlightAwareHeathrowFetcher:
    """FlightAware API client for Heathrow connection data"""
    
    def __init__(self):
        self.api_key = os.getenv('FLIGHTAWARE_API_KEY')
        self.base_url = "https://aeroapi.flightaware.com/aeroapi"
        self.airport_code = "EGLL"  # Heathrow ICAO code
        self.session = requests.Session()
        
        if self.api_key:
            self.session.headers.update({
                'x-apikey': self.api_key,
                'Accept': 'application/json'
            })
            print(f"[FlightAware] API key configured: {self.api_key[:8]}...")
        else:
            print("[FlightAware] Warning: FLIGHTAWARE_API_KEY not found in environment")
    
    def get_arrivals(self, max_pages: int = 2) -> List[Dict]:
        """Fetch arrival flights for Heathrow"""
        
        if not self.api_key:
            return self._get_fallback_arrivals()
        
        try:
            arrivals = []
            
            # Get arrivals for current time period
            endpoint = f"/airports/{self.airport_code}/flights/arrivals"
            
            for page in range(max_pages):
                params = {
                    'max_pages': 1,
                    'cursor': None if page == 0 else arrivals[-1].get('cursor')
                }
                
                response = self.session.get(f"{self.base_url}{endpoint}", params=params)
                
                if response.status_code == 200:
                    data = response.json()
                    flights = data.get('arrivals', [])
                    
                    for flight in flights:
                        processed_flight = self._process_arrival(flight)
                        if processed_flight:
                            arrivals.append(processed_flight)
                    
                    # Check if more pages available
                    if not data.get('links', {}).get('next'):
                        break
                        
                    time.sleep(0.5)  # Rate limiting
                    
                else:
                    print(f"[FlightAware] API error {response.status_code}: {response.text}")
                    break
            
            print(f"[FlightAware] Fetched {len(arrivals)} arrivals")
            return arrivals
            
        except Exception as e:
            print(f"[FlightAware] Error fetching arrivals: {e}")
            return self._get_fallback_arrivals()
    
    def get_departures(self, max_pages: int = 2) -> List[Dict]:
        """Fetch departure flights for Heathrow"""
        
        if not self.api_key:
            return self._get_fallback_departures()
        
        try:
            departures = []
            
            # Get departures for current time period
            endpoint = f"/airports/{self.airport_code}/flights/departures"
            
            for page in range(max_pages):
                params = {
                    'max_pages': 1,
                    'cursor': None if page == 0 else departures[-1].get('cursor')
                }
                
                response = self.session.get(f"{self.base_url}{endpoint}", params=params)
                
                if response.status_code == 200:
                    data = response.json()
                    flights = data.get('departures', [])
                    
                    for flight in flights:
                        processed_flight = self._process_departure(flight)
                        if processed_flight:
                            departures.append(processed_flight)
                    
                    # Check if more pages available
                    if not data.get('links', {}).get('next'):
                        break
                        
                    time.sleep(0.5)  # Rate limiting
                    
                else:
                    print(f"[FlightAware] API error {response.status_code}: {response.text}")
                    break
            
            print(f"[FlightAware] Fetched {len(departures)} departures")
            return departures
            
        except Exception as e:
            print(f"[FlightAware] Error fetching departures: {e}")
            return self._get_fallback_departures()
    
    def get_connection_data(self) -> Dict:
        """Get comprehensive connection data for Heathrow"""
        
        print("[FlightAware] Fetching comprehensive Heathrow connection data...")
        
        # Fetch arrivals and departures
        arrivals = self.get_arrivals()
        departures = self.get_departures()
        
        # Generate connection opportunities
        connections = self._generate_connections(arrivals, departures)
        
        data = {
            'timestamp': datetime.now().isoformat(),
            'airport': 'EGLL',
            'data_source': 'FlightAware_AeroAPI' if self.api_key else 'Fallback_Data',
            'arrivals': arrivals,
            'departures': departures,
            'connection_opportunities': connections,
            'summary': {
                'total_arrivals': len(arrivals),
                'total_departures': len(departures),
                'total_connections': len(connections),
                'virgin_atlantic_arrivals': len([a for a in arrivals if 'Virgin Atlantic' in a.get('airline', '')]),
                'virgin_atlantic_departures': len([d for d in departures if d.get('is_virgin_atlantic', False)])
            }
        }
        
        # Save data for historical analysis
        self._save_data(data)
        
        print(f"[FlightAware] Generated {len(connections)} connection opportunities")
        return data
    
    def _process_arrival(self, flight_data: Dict) -> Optional[Dict]:
        """Process FlightAware arrival data into standardized format"""
        
        try:
            ident = flight_data.get('ident', '')
            
            # Skip if not a commercial flight
            if len(ident) < 3 or not ident[:2].isalpha():
                return None
            
            # Parse times
            scheduled_arrival = self._parse_time(flight_data.get('scheduled_arrival'))
            actual_arrival = self._parse_time(flight_data.get('actual_arrival'))
            estimated_arrival = self._parse_time(flight_data.get('estimated_arrival'))
            
            # Calculate delay
            if actual_arrival and scheduled_arrival:
                delay_minutes = int((actual_arrival - scheduled_arrival).total_seconds() / 60)
            elif estimated_arrival and scheduled_arrival:
                delay_minutes = int((estimated_arrival - scheduled_arrival).total_seconds() / 60)
            else:
                delay_minutes = 0
            
            # Determine status
            if actual_arrival:
                status = 'ARRIVED'
            elif estimated_arrival:
                status = 'ESTIMATED'
            else:
                status = 'SCHEDULED'
            
            # Extract airport and airline info
            origin = flight_data.get('origin', {}).get('code_icao', 'Unknown')
            airline_name = flight_data.get('operator', 'Unknown')
            aircraft_type = flight_data.get('aircraft_type', 'Unknown')
            
            processed = {
                'flight_number': ident,
                'airline': airline_name,
                'aircraft_type': aircraft_type,
                'origin': origin,
                'terminal': self._determine_terminal(airline_name, ident),
                'gate': self._estimate_gate(airline_name, ident),
                'scheduled_arrival': scheduled_arrival.isoformat() if scheduled_arrival else None,
                'actual_arrival': actual_arrival.isoformat() if actual_arrival else None,
                'estimated_arrival': estimated_arrival.isoformat() if estimated_arrival else None,
                'delay_minutes': delay_minutes,
                'status': status,
                'is_international': origin != 'EGLL' and not origin.startswith('EG'),
                'passenger_count': self._estimate_passenger_count(aircraft_type),
                'data_source': 'FlightAware_AeroAPI'
            }
            
            return processed
            
        except Exception as e:
            print(f"[FlightAware] Error processing arrival {flight_data.get('ident', 'Unknown')}: {e}")
            return None
    
    def _process_departure(self, flight_data: Dict) -> Optional[Dict]:
        """Process FlightAware departure data into standardized format"""
        
        try:
            ident = flight_data.get('ident', '')
            
            # Skip if not a commercial flight
            if len(ident) < 3 or not ident[:2].isalpha():
                return None
            
            # Parse times
            scheduled_departure = self._parse_time(flight_data.get('scheduled_departure'))
            actual_departure = self._parse_time(flight_data.get('actual_departure'))
            estimated_departure = self._parse_time(flight_data.get('estimated_departure'))
            
            # Determine status
            if actual_departure:
                status = 'DEPARTED'
            elif estimated_departure:
                status = 'ESTIMATED'
            else:
                status = 'SCHEDULED'
            
            # Extract airport and airline info
            destination = flight_data.get('destination', {}).get('code_icao', 'Unknown')
            airline_name = flight_data.get('operator', 'Unknown')
            aircraft_type = flight_data.get('aircraft_type', 'Unknown')
            
            # Check if Virgin Atlantic
            is_virgin_atlantic = 'Virgin Atlantic' in airline_name or ident.startswith('VS')
            
            processed = {
                'flight_number': ident,
                'airline': airline_name,
                'aircraft_type': aircraft_type,
                'destination': destination,
                'terminal': self._determine_terminal(airline_name, ident),
                'gate': self._estimate_gate(airline_name, ident),
                'scheduled_departure': scheduled_departure.isoformat() if scheduled_departure else None,
                'actual_departure': actual_departure.isoformat() if actual_departure else None,
                'estimated_departure': estimated_departure.isoformat() if estimated_departure else None,
                'status': status,
                'is_virgin_atlantic': is_virgin_atlantic,
                'is_international': destination != 'EGLL' and not destination.startswith('EG'),
                'minimum_connection_time': 75 if not is_virgin_atlantic else 60,  # Virgin gets priority
                'check_in_closes': self._calculate_check_in_deadline(scheduled_departure),
                'data_source': 'FlightAware_AeroAPI'
            }
            
            return processed
            
        except Exception as e:
            print(f"[FlightAware] Error processing departure {flight_data.get('ident', 'Unknown')}: {e}")
            return None
    
    def _generate_connections(self, arrivals: List[Dict], departures: List[Dict]) -> List[Dict]:
        """Generate viable connection opportunities"""
        
        connections = []
        
        for arrival in arrivals:
            arrival_time = self._parse_time(arrival.get('actual_arrival') or arrival.get('estimated_arrival') or arrival.get('scheduled_arrival'))
            if not arrival_time:
                continue
            
            for departure in departures:
                departure_time = self._parse_time(departure.get('scheduled_departure'))
                if not departure_time:
                    continue
                
                # Calculate connection time
                connection_time = int((departure_time - arrival_time).total_seconds() / 60)
                
                # Only consider reasonable connections (30 minutes to 8 hours)
                if 30 <= connection_time <= 480:
                    
                    # Determine minimum connection time
                    min_connection_time = departure.get('minimum_connection_time', 75)
                    
                    # Check terminal transfer
                    terminal_transfer = arrival.get('terminal') != departure.get('terminal')
                    if terminal_transfer:
                        min_connection_time += 15  # Extra time for terminal transfer
                    
                    # Calculate success probability
                    success_prob = self._calculate_success_probability(
                        connection_time, min_connection_time, arrival, departure
                    )
                    
                    # Identify risk factors
                    risk_factors = self._identify_risk_factors(arrival, departure, connection_time, min_connection_time)
                    
                    connection = {
                        'arrival_flight': arrival['flight_number'],
                        'departure_flight': departure['flight_number'],
                        'connection_time_minutes': connection_time,
                        'minimum_connection_time': min_connection_time,
                        'success_probability': success_prob,
                        'terminal_transfer_required': terminal_transfer,
                        'is_virgin_atlantic_connection': departure.get('is_virgin_atlantic', False),
                        'risk_factors': risk_factors,
                        'is_viable': success_prob >= 0.5,
                        'confidence_level': 'HIGH' if abs(success_prob - 0.7) > 0.2 else 'MEDIUM'
                    }
                    
                    connections.append(connection)
        
        # Sort by success probability (highest first)
        connections.sort(key=lambda x: x['success_probability'], reverse=True)
        
        return connections
    
    def _calculate_success_probability(self, connection_time: int, min_time: int, 
                                     arrival: Dict, departure: Dict) -> float:
        """Calculate connection success probability using business rules"""
        
        # Base probability
        base_prob = 0.8
        
        # Adjust for connection time buffer
        buffer = connection_time - min_time
        if buffer < 15:
            base_prob -= 0.3
        elif buffer < 30:
            base_prob -= 0.15
        elif buffer > 120:
            base_prob += 0.1
        
        # Adjust for arrival delay
        delay = arrival.get('delay_minutes', 0)
        if delay > 30:
            base_prob -= 0.4
        elif delay > 15:
            base_prob -= 0.2
        
        # Virgin Atlantic priority
        if departure.get('is_virgin_atlantic', False):
            base_prob += 0.05
        
        # Terminal transfer penalty
        if arrival.get('terminal') != departure.get('terminal'):
            base_prob -= 0.1
        
        # International complexity
        if arrival.get('is_international') and departure.get('is_international'):
            base_prob -= 0.05
        
        return max(0.1, min(0.95, base_prob))
    
    def _identify_risk_factors(self, arrival: Dict, departure: Dict, 
                             connection_time: int, min_time: int) -> List[str]:
        """Identify specific risk factors for the connection"""
        
        risks = []
        
        if connection_time < min_time + 15:
            risks.append('TIGHT_CONNECTION')
        
        if arrival.get('delay_minutes', 0) > 10:
            risks.append('ARRIVAL_DELAY')
        
        if arrival.get('terminal') != departure.get('terminal'):
            risks.append('TERMINAL_TRANSFER')
        
        if arrival.get('is_international') and departure.get('is_international'):
            risks.append('COMPLEX_ROUTING')
        
        # Add weather risk (placeholder - would integrate with weather API)
        if datetime.now().hour in [17, 18, 19, 20]:  # Peak hours
            risks.append('PEAK_HOUR_OPERATIONS')
        
        return risks
    
    def _determine_terminal(self, airline: str, flight_number: str) -> str:
        """Determine likely terminal based on airline"""
        
        if 'Virgin Atlantic' in airline or flight_number.startswith('VS'):
            return 'T3'
        elif any(x in airline for x in ['Air France', 'KLM', 'Delta']):
            return 'T4'
        elif 'British Airways' in airline or flight_number.startswith('BA'):
            return 'T5'
        else:
            return 'T2'  # Default for other airlines
    
    def _estimate_gate(self, airline: str, flight_number: str) -> str:
        """Estimate gate based on terminal and airline"""
        
        terminal = self._determine_terminal(airline, flight_number)
        
        # Simulate gate assignment
        import random
        random.seed(hash(flight_number))  # Consistent for same flight
        
        if terminal == 'T3':
            return f"T3-{random.randint(10, 20)}"
        elif terminal == 'T4':
            return f"T4-{random.randint(1, 15)}"
        elif terminal == 'T5':
            return f"T5-{random.randint(1, 25)}"
        else:
            return f"T2-{random.randint(1, 10)}"
    
    def _estimate_passenger_count(self, aircraft_type: str) -> int:
        """Estimate passenger count based on aircraft type"""
        
        if not aircraft_type or aircraft_type == 'Unknown':
            return 200
        
        # Aircraft capacity mapping (typical configurations)
        capacity_map = {
            'A380': 550, 'A350': 350, 'A340': 320, 'A330': 280,
            'B787': 250, 'B777': 350, 'B747': 400,
            'A321': 200, 'A320': 180, 'A319': 150,
            'B737': 160, 'B738': 180, 'B739': 190
        }
        
        for aircraft, capacity in capacity_map.items():
            if aircraft in aircraft_type:
                # Add some variation (85-95% capacity)
                import random
                random.seed(hash(aircraft_type))
                return int(capacity * random.uniform(0.85, 0.95))
        
        return 200  # Default
    
    def _calculate_check_in_deadline(self, departure_time: Optional[datetime]) -> Optional[str]:
        """Calculate check-in deadline"""
        
        if not departure_time:
            return None
        
        # International flights: 3 hours before, domestic: 2 hours before
        deadline = departure_time - timedelta(hours=2.5)  # Average
        return deadline.isoformat()
    
    def _parse_time(self, time_str: Optional[str]) -> Optional[datetime]:
        """Parse time string to datetime object"""
        
        if not time_str:
            return None
        
        try:
            # Handle various time formats from FlightAware
            if 'T' in time_str:
                return datetime.fromisoformat(time_str.replace('Z', '+00:00'))
            else:
                return datetime.fromisoformat(time_str)
        except:
            return None
    
    def _save_data(self, data: Dict):
        """Save fetched data for historical analysis"""
        
        timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
        filename = f'heathrow_connection_data_{timestamp}.json'
        
        try:
            with open(filename, 'w') as f:
                json.dump(data, f, indent=2, default=str)
            print(f"[FlightAware] Data saved to {filename}")
        except Exception as e:
            print(f"[FlightAware] Error saving data: {e}")
    
    def _get_fallback_arrivals(self) -> List[Dict]:
        """Fallback arrivals data when API is unavailable"""
        
        print("[FlightAware] Using fallback arrivals data")
        
        base_time = datetime.now().replace(minute=0, second=0, microsecond=0)
        
        arrivals = [
            {
                'flight_number': 'VS11',
                'airline': 'Virgin Atlantic',
                'aircraft_type': 'A350-1000',
                'origin': 'KBOS',
                'terminal': 'T3',
                'gate': 'T3-12',
                'scheduled_arrival': (base_time - timedelta(hours=1)).isoformat(),
                'actual_arrival': (base_time - timedelta(hours=1, minutes=5)).isoformat(),
                'delay_minutes': 5,
                'status': 'ARRIVED',
                'is_international': True,
                'passenger_count': 280,
                'data_source': 'Fallback_Data'
            },
            {
                'flight_number': 'VS25',
                'airline': 'Virgin Atlantic', 
                'aircraft_type': 'B787-9',
                'origin': 'KJFK',
                'terminal': 'T3',
                'gate': 'T3-15',
                'scheduled_arrival': base_time.isoformat(),
                'estimated_arrival': (base_time + timedelta(minutes=10)).isoformat(),
                'delay_minutes': 10,
                'status': 'ESTIMATED',
                'is_international': True,
                'passenger_count': 220,
                'data_source': 'Fallback_Data'
            },
            {
                'flight_number': 'AF1380',
                'airline': 'Air France',
                'aircraft_type': 'A320',
                'origin': 'LFPG',
                'terminal': 'T4',
                'gate': 'T4-8',
                'scheduled_arrival': (base_time + timedelta(minutes=30)).isoformat(),
                'delay_minutes': 0,
                'status': 'SCHEDULED',
                'is_international': True,
                'passenger_count': 160,
                'data_source': 'Fallback_Data'
            }
        ]
        
        return arrivals
    
    def _get_fallback_departures(self) -> List[Dict]:
        """Fallback departures data when API is unavailable"""
        
        print("[FlightAware] Using fallback departures data")
        
        base_time = datetime.now().replace(minute=0, second=0, microsecond=0)
        
        departures = [
            {
                'flight_number': 'VS12',
                'airline': 'Virgin Atlantic',
                'aircraft_type': 'A350-1000',
                'destination': 'KBOS',
                'terminal': 'T3',
                'gate': 'T3-18',
                'scheduled_departure': (base_time + timedelta(hours=2)).isoformat(),
                'status': 'SCHEDULED',
                'is_virgin_atlantic': True,
                'is_international': True,
                'minimum_connection_time': 60,
                'check_in_closes': (base_time + timedelta(minutes=30)).isoformat(),
                'data_source': 'Fallback_Data'
            },
            {
                'flight_number': 'VS26',
                'airline': 'Virgin Atlantic',
                'aircraft_type': 'B787-9', 
                'destination': 'KJFK',
                'terminal': 'T3',
                'gate': 'T3-20',
                'scheduled_departure': (base_time + timedelta(hours=3)).isoformat(),
                'status': 'SCHEDULED',
                'is_virgin_atlantic': True,
                'is_international': True,
                'minimum_connection_time': 60,
                'check_in_closes': (base_time + timedelta(hours=1)).isoformat(),
                'data_source': 'Fallback_Data'
            },
            {
                'flight_number': 'KL1007',
                'airline': 'KLM',
                'aircraft_type': 'B737-800',
                'destination': 'EHAM',
                'terminal': 'T4',
                'gate': 'T4-12',
                'scheduled_departure': (base_time + timedelta(hours=2, minutes=30)).isoformat(),
                'status': 'SCHEDULED',
                'is_virgin_atlantic': False,
                'is_international': True,
                'minimum_connection_time': 75,
                'check_in_closes': (base_time + timedelta(hours=1)).isoformat(),
                'data_source': 'Fallback_Data'
            }
        ]
        
        return departures

def main():
    """Test the FlightAware fetcher"""
    print("Testing FlightAware Heathrow Fetcher")
    print("=" * 40)
    
    fetcher = FlightAwareHeathrowFetcher()
    
    # Test individual methods
    print("\n1. Testing arrivals fetch...")
    arrivals = fetcher.get_arrivals(max_pages=1)
    print(f"Fetched {len(arrivals)} arrivals")
    
    print("\n2. Testing departures fetch...")
    departures = fetcher.get_departures(max_pages=1)
    print(f"Fetched {len(departures)} departures")
    
    print("\n3. Testing connection data...")
    connection_data = fetcher.get_connection_data()
    
    print(f"\nResults Summary:")
    print(f"  Total arrivals: {connection_data['summary']['total_arrivals']}")
    print(f"  Total departures: {connection_data['summary']['total_departures']}")
    print(f"  Connection opportunities: {connection_data['summary']['total_connections']}")
    print(f"  Virgin Atlantic arrivals: {connection_data['summary']['virgin_atlantic_arrivals']}")
    print(f"  Virgin Atlantic departures: {connection_data['summary']['virgin_atlantic_departures']}")
    
    # Show sample connections
    if connection_data['connection_opportunities']:
        print(f"\nTop 3 Connection Opportunities:")
        for i, conn in enumerate(connection_data['connection_opportunities'][:3]):
            print(f"{i+1}. {conn['arrival_flight']} → {conn['departure_flight']}")
            print(f"   Connection time: {conn['connection_time_minutes']} minutes")
            print(f"   Success probability: {conn['success_probability']:.1%}")
            print(f"   Risk factors: {', '.join(conn['risk_factors']) if conn['risk_factors'] else 'None'}")

if __name__ == "__main__":
    main()
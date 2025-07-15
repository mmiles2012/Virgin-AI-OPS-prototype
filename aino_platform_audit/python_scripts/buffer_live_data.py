#!/usr/bin/env python3
"""
Live Data Buffer System for AINO Aviation Intelligence Platform
Captures real-time flight data and buffers it for ML model training
Uses authentic ADS-B Exchange data from AINO platform
"""

import pandas as pd
import numpy as np
import requests
import json
import time
from datetime import datetime, timedelta
from typing import Dict, List, Optional
import os
import logging
from geopy.distance import geodesic
from metar_weather import get_airport_weather, get_weather_service

# Configure logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

class AINOLiveDataBuffer:
    """Captures and buffers live aviation data for ML training"""
    
    def __init__(self, buffer_file: str = 'live_buffer.csv'):
        self.buffer_file = buffer_file
        self.base_url = 'http://localhost:5000'
        self.weather_api_key = os.getenv('AVWX_API_KEY', 'demo')
        
        # Initialize buffer if it doesn't exist
        if not os.path.exists(buffer_file):
            self._initialize_buffer()
    
    def _initialize_buffer(self):
        """Initialize the CSV buffer with column headers"""
        columns = [
            'timestamp', 'flight_number', 'airline', 'aircraft_type',
            'departure_airport', 'arrival_airport', 'scheduled_departure',
            'scheduled_arrival', 'actual_departure', 'actual_arrival',
            'delay_minutes', 'delay_class', 'status', 'latitude', 'longitude',
            'altitude', 'velocity', 'heading', 'registration',
            'weather_visibility', 'weather_wind_speed', 'weather_temperature',
            'weather_pressure', 'weather_humidity', 'weather_conditions',
            'weather_impact_score', 'season', 'hour_of_day', 'day_of_week',
            'is_weekend', 'month', 'quarter', 'year'
        ]
        
        df = pd.DataFrame(columns=columns)
        df.to_csv(self.buffer_file, index=False)
        logger.info(f"Initialized buffer file: {self.buffer_file}")
    
    def get_realtime_virgin_flights(self) -> List[Dict]:
        """Fetch authentic Virgin Atlantic flights from AINO ADS-B Exchange integration"""
        try:
            response = requests.get(f"{self.base_url}/api/aviation/virgin-atlantic-flights", timeout=10)
            if response.status_code == 200:
                data = response.json()
                flights = data.get('flights', [])
                
                # Convert to required format for ML pipeline
                formatted_flights = []
                for flight in flights:
                    formatted = {
                        'flight_id': flight.get('flight_number', 'UNKNOWN'),
                        'origin': flight.get('departure_airport', 'UNKNOWN'),
                        'dest': flight.get('arrival_airport', 'UNKNOWN'),
                        'departure_time': self._parse_timestamp(flight.get('scheduled_departure', 'UNKNOWN')),
                        'scheduled_arrival': self._parse_timestamp(flight.get('scheduled_arrival', 'UNKNOWN')),
                        'estimated_arrival': self._estimate_arrival(flight),
                        'lat': flight.get('latitude', 0.0),
                        'lon': flight.get('longitude', 0.0),
                        'alt': flight.get('altitude', 0),
                        'gs': flight.get('velocity', 0.0),
                        'dep_delay': flight.get('delay_minutes', 0),
                        'aircraft_type': flight.get('aircraft_type', 'UNKNOWN'),
                        'registration': flight.get('registration', 'UNKNOWN'),
                        'route': flight.get('route', 'UNKNOWN'),
                        'authentic_tracking': flight.get('authentic_tracking', False)
                    }
                    formatted_flights.append(formatted)
                
                logger.info(f"Fetched {len(formatted_flights)} authentic Virgin Atlantic flights")
                return formatted_flights
            else:
                logger.error(f"Failed to fetch flights: {response.status_code}")
                return []
        except Exception as e:
            logger.error(f"Error fetching flights: {e}")
            return []
    
    def _parse_timestamp(self, timestamp_str: str) -> datetime:
        """Parse timestamp string to datetime object"""
        if timestamp_str == 'UNKNOWN' or not timestamp_str:
            return datetime.now()
        try:
            # Try ISO format first
            return datetime.fromisoformat(timestamp_str.replace('Z', '+00:00'))
        except:
            # Fallback to current time
            return datetime.now()
    
    def _estimate_arrival(self, flight: Dict) -> datetime:
        """Estimate arrival time based on current position and destination"""
        try:
            current_pos = (flight.get('latitude', 0), flight.get('longitude', 0))
            
            # Airport coordinates (simplified)
            airport_coords = {
                'LHR': (51.4706, -0.4619),
                'JFK': (40.6413, -73.7781),
                'BOS': (42.3656, -71.0096),
                'ATL': (33.6407, -84.4277),
                'LAX': (34.0522, -118.2437),
                'IAD': (38.9531, -77.4565),
                'LOS': (6.5774, 3.3212),
                'JNB': (-26.1392, 28.2460),
                'RUH': (24.9578, 46.6983),
                'MCO': (28.4294, -81.3089)
            }
            
            dest_code = flight.get('arrival_airport', 'UNKNOWN')
            if dest_code in airport_coords:
                dest_pos = airport_coords[dest_code]
                distance_km = geodesic(current_pos, dest_pos).kilometers
                
                # Estimate time based on ground speed
                ground_speed_kmh = flight.get('velocity', 800) * 1.852  # Convert knots to km/h
                if ground_speed_kmh > 0:
                    hours_remaining = distance_km / ground_speed_kmh
                    return datetime.now() + timedelta(hours=hours_remaining)
            
            # Fallback to scheduled arrival + some delay
            scheduled = self._parse_timestamp(flight.get('scheduled_arrival', 'UNKNOWN'))
            delay = flight.get('delay_minutes', 0)
            return scheduled + timedelta(minutes=delay)
            
        except Exception as e:
            logger.error(f"Error estimating arrival: {e}")
            return datetime.now() + timedelta(hours=8)  # Default 8-hour flight
    
    def fetch_weather_data(self, airport_code: str) -> Dict:
        """Fetch weather data for airport"""
        try:
            # Use AINO weather service
            response = requests.get(f"{self.base_url}/api/weather/current/{airport_code}", timeout=5)
            if response.status_code == 200:
                return response.json()
            else:
                # Fallback to default weather
                return self._get_default_weather()
        except Exception as e:
            logger.error(f"Error fetching weather for {airport_code}: {e}")
            return self._get_default_weather()
    
    def enrich_live_flight(self, flight: Dict) -> Dict:
        """Enhanced flight enrichment using authentic METAR weather data"""
        from datetime import datetime
        
        now = datetime.utcnow()
        
        # Get authentic weather data
        dest_airport = flight.get('dest', flight.get('arrival_airport', 'UNKNOWN'))
        weather_data = self.get_authentic_weather(dest_airport)
        
        # Calculate delay information
        delay_minutes = 0
        if flight.get('estimated_arrival') and flight.get('scheduled_arrival'):
            try:
                delay_minutes = (flight['estimated_arrival'] - flight['scheduled_arrival']).total_seconds() / 60.0
            except:
                delay_minutes = 0
        
        delay_label = 2 if delay_minutes > 60 else 1 if delay_minutes > 15 else 0
        
        # Calculate enroute time
        enroute_time_min = 0
        if flight.get('departure_time'):
            try:
                enroute_time_min = (now - flight['departure_time']).total_seconds() / 60.0
            except:
                enroute_time_min = 0
        
        enriched = {
            'flight_id': flight.get('flight_id', flight.get('flight_number', 'UNKNOWN')),
            'origin': flight.get('origin', flight.get('departure_airport', 'UNKNOWN')),
            'dest': dest_airport,
            'departure_time': flight.get('departure_time', now),
            'scheduled_arrival': flight.get('scheduled_arrival', now),
            'estimated_arrival': flight.get('estimated_arrival', now),
            'departure_delay_mins': flight.get('dep_delay', 0),
            'enroute_time_min': max(0, enroute_time_min),
            'altitude': flight.get('alt', flight.get('altitude', 35000)),
            'ground_speed': flight.get('gs', flight.get('velocity', 450)),
            'lat': flight.get('lat', flight.get('latitude', 51.5)),
            'lon': flight.get('lon', flight.get('longitude', -1.0)),
            'day_of_week': now.weekday(),
            'hour_of_day': now.hour,
            'weather_score': weather_data.get('impact_score', 0.2),
            'delay_minutes': delay_minutes,
            'delay_label': delay_label
        }
        
        return enriched
    
    def _get_default_weather(self) -> Dict:
        """Default weather data when API fails"""
        return {
            'visibility': 10.0,
            'wind_speed': 5.0,
            'temperature': 15.0,
            'pressure': 1013.25,
            'humidity': 60.0,
            'conditions': 'clear',
            'impact_score': 0.1
        }
    
    def calculate_delay_class(self, delay_minutes: float) -> str:
        """Classify delay into categories"""
        if delay_minutes <= 0:
            return 'ON_TIME'
        elif delay_minutes <= 15:
            return 'MINOR_DELAY'
        elif delay_minutes <= 60:
            return 'MODERATE_DELAY'
        elif delay_minutes <= 180:
            return 'MAJOR_DELAY'
        else:
            return 'SEVERE_DELAY'
    
    def calculate_weather_impact_score(self, weather: Dict) -> float:
        """Calculate weather impact score for ML features"""
        score = 0.0
        
        # Visibility impact
        visibility = weather.get('visibility', 10.0)
        if visibility < 1.0:
            score += 0.8
        elif visibility < 3.0:
            score += 0.5
        elif visibility < 5.0:
            score += 0.3
        
        # Wind speed impact
        wind_speed = weather.get('wind_speed', 0.0)
        if wind_speed > 25:
            score += 0.7
        elif wind_speed > 15:
            score += 0.4
        elif wind_speed > 10:
            score += 0.2
        
        # Conditions impact
        conditions = weather.get('conditions', 'clear').lower()
        if any(cond in conditions for cond in ['storm', 'thunder', 'severe']):
            score += 0.9
        elif any(cond in conditions for cond in ['rain', 'snow', 'fog']):
            score += 0.5
        elif any(cond in conditions for cond in ['cloud', 'overcast']):
            score += 0.2
        
        return min(score, 1.0)
    
    def extract_temporal_features(self, timestamp: datetime) -> Dict:
        """Extract temporal features for ML model"""
        return {
            'season': self._get_season(timestamp.month),
            'hour_of_day': timestamp.hour,
            'day_of_week': timestamp.weekday(),
            'is_weekend': 1 if timestamp.weekday() >= 5 else 0,
            'month': timestamp.month,
            'quarter': (timestamp.month - 1) // 3 + 1,
            'year': timestamp.year
        }
    
    def _get_season(self, month: int) -> str:
        """Map month to season"""
        if month in [12, 1, 2]:
            return 'winter'
        elif month in [3, 4, 5]:
            return 'spring'
        elif month in [6, 7, 8]:
            return 'summer'
        else:
            return 'autumn'
    
    def simulate_realistic_delays(self, flight: Dict) -> Dict:
        """Simulate realistic delay scenarios for training data"""
        # Base probability of delay
        delay_prob = 0.25
        
        # Adjust based on time of day (more delays during peak hours)
        current_hour = datetime.now().hour
        if 6 <= current_hour <= 9 or 17 <= current_hour <= 20:
            delay_prob += 0.15
        
        # Adjust based on aircraft type (larger aircraft more susceptible)
        aircraft_type = flight.get('aircraft_type', 'UNKNOWN')
        if aircraft_type in ['A35K', 'B789']:  # Larger aircraft
            delay_prob += 0.1
        
        # Generate delay if probability threshold met
        if np.random.random() < delay_prob:
            # Generate realistic delay duration
            if np.random.random() < 0.6:  # 60% minor delays
                delay = np.random.exponential(12)  # Mean 12 minutes
            elif np.random.random() < 0.8:  # 20% moderate delays
                delay = 15 + np.random.exponential(25)  # 15-60 minutes
            else:  # 20% major delays
                delay = 60 + np.random.exponential(60)  # 60+ minutes
        else:
            delay = max(0, np.random.normal(-5, 3))  # Slight early arrival possibility
        
        return {
            'delay_minutes': round(delay, 1),
            'delay_class': self.calculate_delay_class(delay)
        }
    
    def process_flight_data(self, flight: Dict) -> Optional[Dict]:
        """Process a single flight into ML training format"""
        try:
            current_time = datetime.now()
            
            # Extract basic flight info
            processed = {
                'timestamp': current_time.isoformat(),
                'flight_number': flight.get('flight_number', 'UNKNOWN'),
                'airline': flight.get('airline', 'Virgin Atlantic'),
                'aircraft_type': flight.get('aircraft_type', 'UNKNOWN'),
                'departure_airport': flight.get('departure_airport', 'UNKNOWN'),
                'arrival_airport': flight.get('arrival_airport', 'UNKNOWN'),
                'scheduled_departure': flight.get('scheduled_departure', 'UNKNOWN'),
                'scheduled_arrival': flight.get('scheduled_arrival', 'UNKNOWN'),
                'status': flight.get('status', 'UNKNOWN'),
                'latitude': flight.get('latitude', 0.0),
                'longitude': flight.get('longitude', 0.0),
                'altitude': flight.get('altitude', 0),
                'velocity': flight.get('velocity', 0.0),
                'heading': flight.get('heading', 0.0),
                'registration': flight.get('registration', 'UNKNOWN')
            }
            
            # Get authentic weather data for departure airport
            dep_airport = processed['departure_airport']
            weather = self.get_authentic_weather(dep_airport)
            
            # Add authentic weather features
            processed.update({
                'weather_visibility': weather['visibility'],
                'weather_wind_speed': weather['wind_speed'],
                'weather_temperature': weather['temperature'],
                'weather_pressure': weather['pressure'],
                'weather_humidity': weather['humidity'],
                'weather_conditions': weather['conditions'],
                'weather_impact_score': weather.get('impact_score', self.calculate_weather_impact_score(weather))
            })
            
            # Add temporal features
            processed.update(self.extract_temporal_features(current_time))
            
            # Simulate realistic delays for training
            delay_info = self.simulate_realistic_delays(flight)
            processed.update(delay_info)
            
            # Set actual times based on delays
            processed['actual_departure'] = 'SIMULATED'
            processed['actual_arrival'] = 'SIMULATED'
            
            return processed
            
        except Exception as e:
            logger.error(f"Error processing flight {flight.get('flight_number', 'UNKNOWN')}: {e}")
            return None
    
    def buffer_current_data(self) -> int:
        """Buffer current live data to CSV"""
        flights = self.get_realtime_virgin_flights()
        if not flights:
            logger.warning("No flights fetched")
            return 0
        
        processed_flights = []
        for flight in flights:
            processed = self.process_flight_data(flight)
            if processed:
                processed_flights.append(processed)
        
        if processed_flights:
            # Append to buffer
            df = pd.DataFrame(processed_flights)
            df.to_csv(self.buffer_file, mode='a', header=False, index=False)
            logger.info(f"Buffered {len(processed_flights)} flights to {self.buffer_file}")
            return len(processed_flights)
        
        return 0
    
    def continuous_buffering(self, interval_minutes: int = 5, max_iterations: int = None):
        """Run continuous data buffering"""
        logger.info(f"Starting continuous buffering every {interval_minutes} minutes")
        iteration = 0
        
        while max_iterations is None or iteration < max_iterations:
            try:
                count = self.buffer_current_data()
                logger.info(f"Iteration {iteration + 1}: Buffered {count} flights")
                
                if max_iterations is None or iteration < max_iterations - 1:
                    time.sleep(interval_minutes * 60)
                
                iteration += 1
                
            except KeyboardInterrupt:
                logger.info("Buffering stopped by user")
                break
            except Exception as e:
                logger.error(f"Error in buffering iteration {iteration}: {e}")
                time.sleep(30)  # Wait 30 seconds before retry
    
    def get_buffer_stats(self) -> Dict:
        """Get statistics about current buffer"""
        try:
            if not os.path.exists(self.buffer_file):
                return {'error': 'Buffer file not found'}
            
            df = pd.read_csv(self.buffer_file)
            
            if len(df) == 0:
                return {'total_records': 0}
            
            return {
                'total_records': len(df),
                'date_range': {
                    'start': df['timestamp'].min(),
                    'end': df['timestamp'].max()
                },
                'unique_flights': df['flight_number'].nunique(),
                'delay_class_distribution': df['delay_class'].value_counts().to_dict(),
                'aircraft_types': df['aircraft_type'].value_counts().to_dict(),
                'routes': f"{df['departure_airport'].nunique()} departure airports, {df['arrival_airport'].nunique()} arrival airports"
            }
            
        except Exception as e:
            return {'error': str(e)}

def main():
    """Main execution for live data buffering"""
    buffer = AINOLiveDataBuffer()
    
    print("AINO Live Data Buffer System")
    print("=" * 40)
    
    # Show current buffer stats
    stats = buffer.get_buffer_stats()
    print(f"Current buffer stats: {json.dumps(stats, indent=2)}")
    
    # Buffer current data once
    print("\nBuffering current data...")
    count = buffer.buffer_current_data()
    print(f"Buffered {count} flights")
    
    # Show updated stats
    stats = buffer.get_buffer_stats()
    print(f"Updated buffer stats: {json.dumps(stats, indent=2)}")

if __name__ == "__main__":
    main()
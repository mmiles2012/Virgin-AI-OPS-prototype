import requests
import json
import time
import sqlite3
from datetime import datetime, timedelta
from typing import Dict, List, Optional, Tuple
import re
from dataclasses import dataclass, field
from enum import Enum
import threading
import schedule
import math
import random

# Configuration
class Config:
    # API Keys (replace with your actual keys)
    WEATHER_API_KEY = "your_weather_api_key_here"
    AVIATION_API_KEY = "your_aviation_api_key_here"
    
    # Database
    DB_NAME = "airline_operations.db"
    
    # Monitoring intervals
    WEATHER_CHECK_INTERVAL = 5  # minutes
    FLIGHT_CHECK_INTERVAL = 2   # minutes
    CREW_CHECK_INTERVAL = 10    # minutes
    
    # Airline specific
    AIRLINE_CODE = "VS"  # Virgin Atlantic
    HUB_AIRPORTS = ["LHR", "LGW", "MAN", "JFK", "LAX", "MCO", "BOS"]
    
    # Thresholds
    WEATHER_SEVERITY_THRESHOLD = 3
    DELAY_THRESHOLD_MINUTES = 30
    CREW_DUTY_LIMIT_HOURS = 14

# Data Models
class DisruptionType(Enum):
    WEATHER = "weather"
    MECHANICAL = "mechanical"
    CREW = "crew"
    AIR_TRAFFIC_CONTROL = "atc"
    SECURITY = "security"
    FUEL = "fuel"
    PASSENGER = "passenger"
    AIRPORT_CLOSURE = "airport_closure"

class Priority(Enum):
    LOW = 1
    MEDIUM = 2
    HIGH = 3
    CRITICAL = 4

class FlightStatus(Enum):
    SCHEDULED = "scheduled"
    BOARDING = "boarding"
    DEPARTED = "departed"
    EN_ROUTE = "en_route"
    ARRIVED = "arrived"
    DELAYED = "delayed"
    CANCELLED = "cancelled"
    DIVERTED = "diverted"

class ActionType(Enum):
    DELAY_FLIGHT = "delay_flight"
    CANCEL_FLIGHT = "cancel_flight"
    REROUTE_FLIGHT = "reroute_flight"
    SWAP_AIRCRAFT = "swap_aircraft"
    REASSIGN_CREW = "reassign_crew"
    REACCOMMODATE_PASSENGERS = "reaccommodate_passengers"
    INCREASE_FUEL = "increase_fuel"
    GROUND_STOP = "ground_stop"
    NO_ACTION = "no_action"

@dataclass
class WeatherData:
    airport_code: str
    visibility_km: float
    wind_speed_kmh: float
    wind_direction: int
    temperature_c: float
    precipitation_mm: float
    conditions: str
    timestamp: datetime
    severity_score: int  # 1-10

@dataclass
class Flight:
    flight_id: str
    flight_number: str
    aircraft_id: str
    origin: str
    destination: str
    scheduled_departure: datetime
    scheduled_arrival: datetime
    actual_departure: Optional[datetime]
    actual_arrival: Optional[datetime]
    status: FlightStatus
    passenger_count: int
    crew_ids: List[str]
    gate: Optional[str] = None
    delay_minutes: int = 0
    delay_reason: Optional[str] = None

@dataclass
class CrewMember:
    crew_id: str
    name: str
    role: str  # Captain, First Officer, Flight Attendant
    base_airport: str
    current_location: str
    duty_start: Optional[datetime]
    duty_hours_today: float
    next_assignment: Optional[str]
    certification_expiry: datetime
    available: bool = True

@dataclass
class Aircraft:
    aircraft_id: str
    aircraft_type: str
    registration: str
    current_location: str
    maintenance_status: str
    next_maintenance: datetime
    passenger_capacity: int
    fuel_capacity: float
    current_fuel: float
    available: bool = True

@dataclass
class OperationalDisruption:
    disruption_id: str
    disruption_type: DisruptionType
    title: str
    description: str
    priority: Priority
    affected_flights: List[str]
    affected_airports: List[str]
    start_time: datetime
    estimated_end_time: Optional[datetime]
    confidence: float
    source: str

@dataclass
class OperationalRecommendation:
    recommendation_id: str
    disruption_id: str
    action_type: ActionType
    target_flight: str
    description: str
    estimated_cost: float
    passenger_impact: int
    confidence: float
    urgency: Priority
    alternatives: List[str]
    timestamp: datetime

class DatabaseManager:
    def __init__(self, db_name: str):
        self.db_name = db_name
        self.init_database()
    
    def init_database(self):
        conn = sqlite3.connect(self.db_name)
        cursor = conn.cursor()
        
        # Weather table
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS weather (
                airport_code TEXT,
                visibility_km REAL,
                wind_speed_kmh REAL,
                wind_direction INTEGER,
                temperature_c REAL,
                precipitation_mm REAL,
                conditions TEXT,
                timestamp TEXT,
                severity_score INTEGER,
                PRIMARY KEY (airport_code, timestamp)
            )
        ''')
        
        # Flights table
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS flights (
                flight_id TEXT PRIMARY KEY,
                flight_number TEXT,
                aircraft_id TEXT,
                origin TEXT,
                destination TEXT,
                scheduled_departure TEXT,
                scheduled_arrival TEXT,
                actual_departure TEXT,
                actual_arrival TEXT,
                status TEXT,
                passenger_count INTEGER,
                crew_ids TEXT,
                gate TEXT,
                delay_minutes INTEGER,
                delay_reason TEXT
            )
        ''')
        
        # Disruptions table
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS disruptions (
                disruption_id TEXT PRIMARY KEY,
                disruption_type TEXT,
                title TEXT,
                description TEXT,
                priority INTEGER,
                affected_flights TEXT,
                affected_airports TEXT,
                start_time TEXT,
                estimated_end_time TEXT,
                confidence REAL,
                source TEXT
            )
        ''')
        
        # Recommendations table
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS recommendations (
                recommendation_id TEXT PRIMARY KEY,
                disruption_id TEXT,
                action_type TEXT,
                target_flight TEXT,
                description TEXT,
                estimated_cost REAL,
                passenger_impact INTEGER,
                confidence REAL,
                urgency INTEGER,
                alternatives TEXT,
                timestamp TEXT,
                executed BOOLEAN DEFAULT FALSE
            )
        ''')
        
        conn.commit()
        conn.close()
    
    def save_weather(self, weather: WeatherData):
        conn = sqlite3.connect(self.db_name)
        cursor = conn.cursor()
        
        cursor.execute('''
            INSERT OR REPLACE INTO weather 
            (airport_code, visibility_km, wind_speed_kmh, wind_direction, 
             temperature_c, precipitation_mm, conditions, timestamp, severity_score)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        ''', (
            weather.airport_code, weather.visibility_km, weather.wind_speed_kmh,
            weather.wind_direction, weather.temperature_c, weather.precipitation_mm,
            weather.conditions, weather.timestamp.isoformat(), weather.severity_score
        ))
        
        conn.commit()
        conn.close()
    
    def save_disruption(self, disruption: OperationalDisruption):
        conn = sqlite3.connect(self.db_name)
        cursor = conn.cursor()
        
        cursor.execute('''
            INSERT OR REPLACE INTO disruptions 
            (disruption_id, disruption_type, title, description, priority, 
             affected_flights, affected_airports, start_time, estimated_end_time, 
             confidence, source)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        ''', (
            disruption.disruption_id, disruption.disruption_type.value, disruption.title,
            disruption.description, disruption.priority.value, json.dumps(disruption.affected_flights),
            json.dumps(disruption.affected_airports), disruption.start_time.isoformat(),
            disruption.estimated_end_time.isoformat() if disruption.estimated_end_time else None,
            disruption.confidence, disruption.source
        ))
        
        conn.commit()
        conn.close()
    
    def save_recommendation(self, recommendation: OperationalRecommendation):
        conn = sqlite3.connect(self.db_name)
        cursor = conn.cursor()
        
        cursor.execute('''
            INSERT OR REPLACE INTO recommendations 
            (recommendation_id, disruption_id, action_type, target_flight, 
             description, estimated_cost, passenger_impact, confidence, 
             urgency, alternatives, timestamp)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        ''', (
            recommendation.recommendation_id, recommendation.disruption_id,
            recommendation.action_type.value, recommendation.target_flight,
            recommendation.description, recommendation.estimated_cost,
            recommendation.passenger_impact, recommendation.confidence,
            recommendation.urgency.value, json.dumps(recommendation.alternatives),
            recommendation.timestamp.isoformat()
        ))
        
        conn.commit()
        conn.close()

class WeatherMonitor:
    def __init__(self, api_key: str):
        self.api_key = api_key
        self.base_url = "http://api.openweathermap.org/data/2.5/weather"
    
    def fetch_weather_data(self, airport_code: str) -> Optional[WeatherData]:
        # In reality, you'd use airport coordinates or ICAO codes
        params = {
            'q': f"{airport_code}",  # Simplified - would use lat/lon for airports
            'appid': self.api_key,
            'units': 'metric'
        }
        
        try:
            response = requests.get(self.base_url, params=params, timeout=10)
            response.raise_for_status()
            data = response.json()
            
            return WeatherData(
                airport_code=airport_code,
                visibility_km=data.get('visibility', 10000) / 1000,
                wind_speed_kmh=data['wind']['speed'] * 3.6 if 'wind' in data else 0,
                wind_direction=data['wind']['deg'] if 'wind' in data else 0,
                temperature_c=data['main']['temp'],
                precipitation_mm=data.get('rain', {}).get('1h', 0) + data.get('snow', {}).get('1h', 0),
                conditions=data['weather'][0]['description'],
                timestamp=datetime.now(),
                severity_score=self._calculate_severity(data)
            )
        except Exception as e:
            print(f"Error fetching weather for {airport_code}: {e}")
            return None
    
    def _calculate_severity(self, weather_data: dict) -> int:
        """Calculate weather severity score based on conditions"""
        severity = 1
        
        # Visibility
        visibility = weather_data.get('visibility', 10000) / 1000
        if visibility < 1.0:
            severity += 3
        elif visibility < 3.0:
            severity += 2
        
        # Wind
        wind_speed = weather_data.get('wind', {}).get('speed', 0) * 3.6
        if wind_speed > 40:
            severity += 3
        elif wind_speed > 25:
            severity += 2
        
        # Precipitation
        rain = weather_data.get('rain', {}).get('1h', 0)
        snow = weather_data.get('snow', {}).get('1h', 0)
        precipitation = rain + snow
        
        if precipitation > 15:
            severity += 2
        elif precipitation > 5:
            severity += 1
        
        # Weather conditions
        conditions = weather_data['weather'][0]['main'].lower()
        if 'thunderstorm' in conditions:
            severity += 3
        elif 'snow' in conditions or 'rain' in conditions:
            severity += 2
        
        return min(10, severity)

class OperationsMonitor:
    def __init__(self):
        self.db_manager = DatabaseManager(Config.DB_NAME)
        self.weather_monitor = WeatherMonitor(Config.WEATHER_API_KEY)
        self.running = False
        self.monitor_thread = None
    
    def start_monitoring(self):
        """Start the operations monitoring system"""
        self.running = True
        self.monitor_thread = threading.Thread(target=self._monitoring_loop)
        self.monitor_thread.daemon = True
        self.monitor_thread.start()
        print("Operations monitoring started")
    
    def stop_monitoring(self):
        """Stop the operations monitoring system"""
        self.running = False
        if self.monitor_thread:
            self.monitor_thread.join()
        print("Operations monitoring stopped")
    
    def _monitoring_loop(self):
        """Main monitoring loop"""
        while self.running:
            try:
                # Monitor weather for all hub airports
                for airport in Config.HUB_AIRPORTS:
                    weather = self.weather_monitor.fetch_weather_data(airport)
                    if weather:
                        self.db_manager.save_weather(weather)
                        
                        # Check for weather disruptions
                        if weather.severity_score >= Config.WEATHER_SEVERITY_THRESHOLD:
                            self._create_weather_disruption(weather)
                
                time.sleep(60)  # Wait 1 minute before next check
                
            except Exception as e:
                print(f"Error in monitoring loop: {e}")
                time.sleep(30)  # Wait 30 seconds on error
    
    def _create_weather_disruption(self, weather: WeatherData):
        """Create a weather disruption event"""
        disruption = OperationalDisruption(
            disruption_id=f"WEATHER_{weather.airport_code}_{int(weather.timestamp.timestamp())}",
            disruption_type=DisruptionType.WEATHER,
            title=f"Severe Weather at {weather.airport_code}",
            description=f"Weather conditions: {weather.conditions}, "
                       f"Visibility: {weather.visibility_km}km, "
                       f"Wind: {weather.wind_speed_kmh}km/h, "
                       f"Severity: {weather.severity_score}/10",
            priority=Priority.HIGH if weather.severity_score >= 7 else Priority.MEDIUM,
            affected_flights=[],  # Would be populated with actual flight lookup
            affected_airports=[weather.airport_code],
            start_time=weather.timestamp,
            estimated_end_time=weather.timestamp + timedelta(hours=2),
            confidence=0.8,
            source="Weather API"
        )
        
        self.db_manager.save_disruption(disruption)
        print(f"Created weather disruption: {disruption.title}")
    
    def get_current_disruptions(self) -> List[Dict]:
        """Get all current disruptions"""
        conn = sqlite3.connect(self.db_manager.db_name)
        cursor = conn.cursor()
        
        cursor.execute('''
            SELECT * FROM disruptions 
            WHERE estimated_end_time > ? OR estimated_end_time IS NULL
            ORDER BY priority DESC, start_time DESC
        ''', (datetime.now().isoformat(),))
        
        rows = cursor.fetchall()
        conn.close()
        
        disruptions = []
        for row in rows:
            disruptions.append({
                'disruption_id': row[0],
                'disruption_type': row[1],
                'title': row[2],
                'description': row[3],
                'priority': row[4],
                'affected_flights': json.loads(row[5]) if row[5] else [],
                'affected_airports': json.loads(row[6]) if row[6] else [],
                'start_time': row[7],
                'estimated_end_time': row[8],
                'confidence': row[9],
                'source': row[10]
            })
        
        return disruptions
    
    def get_weather_summary(self) -> Dict[str, Dict]:
        """Get current weather summary for all hub airports"""
        conn = sqlite3.connect(self.db_manager.db_name)
        cursor = conn.cursor()
        
        weather_summary = {}
        for airport in Config.HUB_AIRPORTS:
            cursor.execute('''
                SELECT * FROM weather 
                WHERE airport_code = ? 
                ORDER BY timestamp DESC 
                LIMIT 1
            ''', (airport,))
            
            row = cursor.fetchone()
            if row:
                weather_summary[airport] = {
                    'visibility_km': row[1],
                    'wind_speed_kmh': row[2],
                    'wind_direction': row[3],
                    'temperature_c': row[4],
                    'precipitation_mm': row[5],
                    'conditions': row[6],
                    'timestamp': row[7],
                    'severity_score': row[8]
                }
        
        conn.close()
        return weather_summary

# Main execution
if __name__ == "__main__":
    monitor = OperationsMonitor()
    monitor.start_monitoring()
    
    try:
        while True:
            # Print current status every 30 seconds
            disruptions = monitor.get_current_disruptions()
            weather = monitor.get_weather_summary()
            
            print(f"\n--- Operations Status at {datetime.now().strftime('%H:%M:%S')} ---")
            print(f"Active Disruptions: {len(disruptions)}")
            for disruption in disruptions[:3]:  # Show top 3
                print(f"  - {disruption['title']} (Priority: {disruption['priority']})")
            
            print(f"Weather Summary:")
            for airport, data in weather.items():
                print(f"  {airport}: {data['conditions']}, Severity: {data['severity_score']}/10")
            
            time.sleep(30)
            
    except KeyboardInterrupt:
        print("\nShutting down operations monitor...")
        monitor.stop_monitoring()
import json
import requests
import asyncio
import aiohttp
from datetime import datetime, timedelta
from typing import Dict, List, Optional, Set, Tuple
from dataclasses import dataclass, field
from enum import Enum
import time
import threading
from concurrent.futures import ThreadPoolExecutor
import numpy as np
import pandas as pd
from sklearn.ensemble import RandomForestClassifier, GradientBoostingRegressor
from sklearn.linear_model import LogisticRegression
from sklearn.preprocessing import StandardScaler, LabelEncoder
from sklearn.model_selection import train_test_split
from sklearn.metrics import classification_report, mean_absolute_error
import joblib
import warnings
warnings.filterwarnings('ignore')

class FlightStatus(Enum):
    SCHEDULED = "Scheduled"
    DEPARTED = "Departed"
    AIRBORNE = "Airborne"
    ARRIVED = "Arrived"
    DELAYED = "Delayed"
    CANCELLED = "Cancelled"
    DIVERTED = "Diverted"
    BOARDING = "Boarding"
    GATE_CLOSED = "Gate Closed"

class Terminal(Enum):
    T1 = "Terminal 1"  # Closed but keeping for historical data
    T2 = "Terminal 2"  # Star Alliance hub
    T3 = "Terminal 3"  # SkyTeam, Virgin Atlantic, other alliances
    T4 = "Terminal 4"  # SkyTeam members
    T5 = "Terminal 5"  # British Airways, OneWorld

class Alliance(Enum):
    SKYTEAM = "SkyTeam"
    VIRGIN_ATLANTIC = "Virgin Atlantic"
    STAR_ALLIANCE = "Star Alliance"
    ONEWORLD = "OneWorld"
    INDEPENDENT = "Independent"

class ConnectionRisk(Enum):
    LOW = "Low"
    MEDIUM = "Medium"
    HIGH = "High"
    CRITICAL = "Critical"

@dataclass
class Airport:
    code: str
    name: str
    country: str
    region: str
    
@dataclass
class Airline:
    code: str
    name: str
    alliance: Alliance
    terminal: Terminal

@dataclass
class RealTimeFlightData:
    flight_id: str
    current_status: FlightStatus
    actual_departure: Optional[datetime] = None
    actual_arrival: Optional[datetime] = None
    estimated_departure: Optional[datetime] = None
    estimated_arrival: Optional[datetime] = None
    delay_minutes: int = 0
    gate: Optional[str] = None
    current_altitude: Optional[int] = None
    current_speed: Optional[int] = None
    current_location: Optional[Tuple[float, float]] = None  # (lat, lon)
    last_updated: datetime = field(default_factory=datetime.now)
    
@dataclass
class Flight:
    flight_number: str
    airline: Airline
    origin: Airport
    destination: Airport
    departure_time: datetime
    arrival_time: datetime
    terminal: Terminal
    aircraft_type: str = ""
    real_time_data: Optional[RealTimeFlightData] = None
    
@dataclass
class Passenger:
    passenger_id: str
    name: str
    origin: Airport
    final_destination: Airport
    alliance_status: str = "None"
    connection_flights: List[Flight] = field(default_factory=list)
    
@dataclass
class MLPrediction:
    prediction_type: str
    probability: float
    confidence: float
    risk_level: ConnectionRisk
    factors: Dict[str, float]
    timestamp: datetime = field(default_factory=datetime.now)

class DelayPredictor:
    """Machine Learning model to predict flight delays"""
    
    def __init__(self):
        self.model = GradientBoostingRegressor(n_estimators=100, random_state=42)
        self.scaler = StandardScaler()
        self.label_encoders = {}
        self.is_trained = False
        
    def generate_training_data(self, flights: List[Flight], num_samples: int = 1000) -> pd.DataFrame:
        """Generate synthetic training data based on real flight patterns"""
        np.random.seed(42)
        
        data = []
        for _ in range(num_samples):
            # Simulate historical flight data
            hour = np.random.randint(0, 24)
            day_of_week = np.random.randint(0, 7)
            month = np.random.randint(1, 13)
            
            # Weather impact (simplified)
            weather_score = np.random.uniform(0, 10)
            
            # Aircraft type impact
            aircraft_types = ['Boeing 737', 'Boeing 777', 'Boeing 787', 'Airbus A320', 'Airbus A330', 'Airbus A350']
            aircraft_type = np.random.choice(aircraft_types)
            
            # Airline reliability (simplified)
            airline_codes = ['AF', 'KL', 'VS', 'BA', 'DL', 'KQ', 'EK', 'QR']
            airline = np.random.choice(airline_codes)
            
            # Route complexity
            route_distance = np.random.uniform(500, 8000)  # km
            
            # Terminal congestion
            terminal_congestion = np.random.uniform(0, 1)
            
            # Historical delay patterns
            base_delay = max(0, np.random.normal(15, 30))  # Base delay tendency
            
            # Weather impact on delay
            weather_delay = max(0, np.random.normal(0, 20) * (weather_score / 10))
            
            # Time-based delay patterns
            time_delay = 0
            if 6 <= hour <= 9 or 17 <= hour <= 20:  # Rush hours
                time_delay = np.random.normal(10, 15)
            
            # Total delay
            total_delay = max(0, base_delay + weather_delay + time_delay + 
                            np.random.normal(0, 10))
            
            data.append({
                'hour': hour,
                'day_of_week': day_of_week,
                'month': month,
                'weather_score': weather_score,
                'aircraft_type': aircraft_type,
                'airline': airline,
                'route_distance': route_distance,
                'terminal_congestion': terminal_congestion,
                'delay_minutes': total_delay
            })
        
        return pd.DataFrame(data)
    
    def train(self, training_data: pd.DataFrame):
        """Train the delay prediction model"""
        # Prepare features
        X = training_data.drop('delay_minutes', axis=1)
        y = training_data['delay_minutes']
        
        # Encode categorical variables
        categorical_columns = ['aircraft_type', 'airline']
        for col in categorical_columns:
            le = LabelEncoder()
            X[col] = le.fit_transform(X[col])
            self.label_encoders[col] = le
        
        # Scale features
        X_scaled = self.scaler.fit_transform(X)
        
        # Train model
        self.model.fit(X_scaled, y)
        self.is_trained = True
        
        # Print training results
        X_train, X_test, y_train, y_test = train_test_split(X_scaled, y, test_size=0.2, random_state=42)
        y_pred = self.model.predict(X_test)
        mae = mean_absolute_error(y_test, y_pred)
        print(f"Delay Predictor trained. MAE: {mae:.2f} minutes")
        
    def predict_delay(self, flight: Flight, weather_score: float = 5.0, 
                     terminal_congestion: float = 0.5) -> float:
        """Predict delay for a specific flight"""
        if not self.is_trained:
            return 0.0
            
        # Extract features
        features = {
            'hour': flight.departure_time.hour,
            'day_of_week': flight.departure_time.weekday(),
            'month': flight.departure_time.month,
            'weather_score': weather_score,
            'aircraft_type': flight.aircraft_type or 'Boeing 737',
            'airline': flight.airline.code,
            'route_distance': 2000,  # Simplified
            'terminal_congestion': terminal_congestion
        }
        
        # Create DataFrame
        df = pd.DataFrame([features])
        
        # Encode categorical variables
        for col in ['aircraft_type', 'airline']:
            if col in self.label_encoders:
                try:
                    df[col] = self.label_encoders[col].transform(df[col])
                except ValueError:
                    # Handle unseen categories
                    df[col] = 0
        
        # Scale features
        X_scaled = self.scaler.transform(df)
        
        # Predict
        predicted_delay = self.model.predict(X_scaled)[0]
        return max(0, predicted_delay)

class ConnectionPredictor:
    """Machine Learning model to predict connection success probability"""
    
    def __init__(self):
        self.model = RandomForestClassifier(n_estimators=100, random_state=42)
        self.scaler = StandardScaler()
        self.label_encoders = {}
        self.is_trained = False
        
    def generate_training_data(self, num_samples: int = 1000) -> pd.DataFrame:
        """Generate synthetic training data for connection success"""
        np.random.seed(42)
        
        data = []
        for _ in range(num_samples):
            # Connection parameters
            connection_time = np.random.uniform(30, 300)  # 30 minutes to 5 hours
            inbound_delay = max(0, np.random.normal(15, 30))
            outbound_delay = max(0, np.random.normal(10, 20))
            
            # Terminal factors
            same_terminal = np.random.choice([0, 1])
            terminal_distance = np.random.uniform(5, 30) if not same_terminal else 0
            
            # Passenger factors
            alliance_match = np.random.choice([0, 1])
            passenger_status = np.random.choice(['None', 'Silver', 'Gold', 'Elite'])
            
            # Operational factors
            weather_conditions = np.random.uniform(0, 10)
            airport_congestion = np.random.uniform(0, 1)
            
            # Time factors
            hour = np.random.randint(0, 24)
            day_of_week = np.random.randint(0, 7)
            
            # Calculate success probability
            effective_connection_time = connection_time - inbound_delay
            
            # Base success probability
            if effective_connection_time >= 90:
                base_prob = 0.95
            elif effective_connection_time >= 60:
                base_prob = 0.80
            elif effective_connection_time >= 45:
                base_prob = 0.60
            else:
                base_prob = 0.30
            
            # Adjust for factors
            if same_terminal:
                base_prob += 0.10
            if alliance_match:
                base_prob += 0.05
            if passenger_status in ['Gold', 'Elite']:
                base_prob += 0.10
            
            # Weather and congestion penalties
            base_prob -= (weather_conditions / 10) * 0.2
            base_prob -= airport_congestion * 0.15
            
            # Time-based adjustments
            if 6 <= hour <= 9 or 17 <= hour <= 20:  # Rush hours
                base_prob -= 0.10
            
            success = 1 if np.random.random() < max(0, min(1, base_prob)) else 0
            
            data.append({
                'connection_time': connection_time,
                'inbound_delay': inbound_delay,
                'outbound_delay': outbound_delay,
                'same_terminal': same_terminal,
                'terminal_distance': terminal_distance,
                'alliance_match': alliance_match,
                'passenger_status': passenger_status,
                'weather_conditions': weather_conditions,
                'airport_congestion': airport_congestion,
                'hour': hour,
                'day_of_week': day_of_week,
                'success': success
            })
        
        return pd.DataFrame(data)
    
    def train(self, training_data: pd.DataFrame):
        """Train the connection success prediction model"""
        # Prepare features
        X = training_data.drop('success', axis=1)
        y = training_data['success']
        
        # Encode categorical variables
        categorical_columns = ['passenger_status']
        for col in categorical_columns:
            le = LabelEncoder()
            X[col] = le.fit_transform(X[col])
            self.label_encoders[col] = le
        
        # Scale features
        X_scaled = self.scaler.fit_transform(X)
        
        # Train model
        self.model.fit(X_scaled, y)
        self.is_trained = True
        
        # Print training results
        X_train, X_test, y_train, y_test = train_test_split(X_scaled, y, test_size=0.2, random_state=42)
        y_pred = self.model.predict(X_test)
        print("Connection Predictor trained.")
        print(classification_report(y_test, y_pred))
        
    def predict_connection_success(self, arriving_flight: Flight, departing_flight: Flight,
                                 passenger: Passenger, weather_conditions: float = 5.0,
                                 airport_congestion: float = 0.5) -> MLPrediction:
        """Predict connection success probability"""
        if not self.is_trained:
            return MLPrediction(
                prediction_type="connection_success",
                probability=0.5,
                confidence=0.0,
                risk_level=ConnectionRisk.MEDIUM,
                factors={}
            )
        
        # Calculate connection time
        connection_time = (departing_flight.departure_time - arriving_flight.arrival_time).total_seconds() / 60
        
        # Get predicted delays
        arriving_delay = arriving_flight.real_time_data.delay_minutes if arriving_flight.real_time_data else 0
        departing_delay = departing_flight.real_time_data.delay_minutes if departing_flight.real_time_data else 0
        
        # Terminal factors
        same_terminal = 1 if arriving_flight.terminal == departing_flight.terminal else 0
        terminal_distance = 0 if same_terminal else 15  # Simplified
        
        # Alliance factors
        alliance_match = 1 if arriving_flight.airline.alliance == departing_flight.airline.alliance else 0
        
        # Passenger status encoding
        passenger_status = passenger.alliance_status
        
        # Prepare features
        features = {
            'connection_time': connection_time,
            'inbound_delay': arriving_delay,
            'outbound_delay': departing_delay,
            'same_terminal': same_terminal,
            'terminal_distance': terminal_distance,
            'alliance_match': alliance_match,
            'passenger_status': passenger_status,
            'weather_conditions': weather_conditions,
            'airport_congestion': airport_congestion,
            'hour': departing_flight.departure_time.hour,
            'day_of_week': departing_flight.departure_time.weekday()
        }
        
        # Create DataFrame
        df = pd.DataFrame([features])
        
        # Encode categorical variables
        for col in ['passenger_status']:
            if col in self.label_encoders:
                try:
                    df[col] = self.label_encoders[col].transform(df[col])
                except ValueError:
                    # Handle unseen categories
                    df[col] = 0
        
        # Scale features
        X_scaled = self.scaler.transform(df)
        
        # Predict
        probability = self.model.predict_proba(X_scaled)[0][1]  # Probability of success
        confidence = max(self.model.predict_proba(X_scaled)[0])  # Confidence
        
        # Determine risk level
        if probability >= 0.8:
            risk_level = ConnectionRisk.LOW
        elif probability >= 0.6:
            risk_level = ConnectionRisk.MEDIUM
        elif probability >= 0.4:
            risk_level = ConnectionRisk.HIGH
        else:
            risk_level = ConnectionRisk.CRITICAL
        
        return MLPrediction(
            prediction_type="connection_success",
            probability=probability,
            confidence=confidence,
            risk_level=risk_level,
            factors=features
        )

class HeathrowConnectionManager:
    """Advanced ML-powered connection management for Heathrow Airport"""
    
    def __init__(self):
        self.delay_predictor = DelayPredictor()
        self.connection_predictor = ConnectionPredictor()
        self.passengers: Dict[str, Passenger] = {}
        self.flights: Dict[str, Flight] = {}
        self.predictions: Dict[str, MLPrediction] = {}
        self.alerts: List[Dict] = []
        
        # Initialize ML models
        self._initialize_models()
    
    def _initialize_models(self):
        """Initialize and train ML models"""
        print("Initializing ML models for Heathrow Connection Management...")
        
        # Train delay predictor
        delay_training_data = self.delay_predictor.generate_training_data([], 1000)
        self.delay_predictor.train(delay_training_data)
        
        # Train connection predictor
        connection_training_data = self.connection_predictor.generate_training_data(1000)
        self.connection_predictor.train(connection_training_data)
        
        print("ML models initialized and trained.")
    
    def add_passenger(self, passenger: Passenger):
        """Add a passenger to the system"""
        self.passengers[passenger.passenger_id] = passenger
        
        # Generate predictions for all connections
        for i in range(len(passenger.connection_flights) - 1):
            arriving_flight = passenger.connection_flights[i]
            departing_flight = passenger.connection_flights[i + 1]
            
            prediction = self.connection_predictor.predict_connection_success(
                arriving_flight, departing_flight, passenger
            )
            
            prediction_key = f"{passenger.passenger_id}_{arriving_flight.flight_number}_{departing_flight.flight_number}"
            self.predictions[prediction_key] = prediction
            
            # Generate alert if needed
            if prediction.risk_level in [ConnectionRisk.HIGH, ConnectionRisk.CRITICAL]:
                self._generate_connection_alert(passenger, arriving_flight, departing_flight, prediction)
    
    def _generate_connection_alert(self, passenger: Passenger, arriving_flight: Flight, 
                                 departing_flight: Flight, prediction: MLPrediction):
        """Generate connection alert"""
        alert = {
            'type': 'CONNECTION_RISK',
            'passenger_id': passenger.passenger_id,
            'passenger_name': passenger.name,
            'arriving_flight': arriving_flight.flight_number,
            'departing_flight': departing_flight.flight_number,
            'risk_level': prediction.risk_level.value,
            'probability': prediction.probability,
            'confidence': prediction.confidence,
            'factors': prediction.factors,
            'timestamp': datetime.now().isoformat()
        }
        
        self.alerts.append(alert)
        print(f"[ML Connection Alert] {alert['type']} - {passenger.name} - {prediction.risk_level.value}")
    
    def get_passenger_predictions(self, passenger_id: str) -> List[MLPrediction]:
        """Get all predictions for a passenger"""
        return [pred for key, pred in self.predictions.items() if key.startswith(passenger_id)]
    
    def get_system_status(self) -> Dict:
        """Get overall system status"""
        return {
            'passengers_monitored': len(self.passengers),
            'active_predictions': len(self.predictions),
            'active_alerts': len(self.alerts),
            'ml_models_trained': self.delay_predictor.is_trained and self.connection_predictor.is_trained,
            'last_updated': datetime.now().isoformat()
        }

# Global instance
heathrow_ml_manager = HeathrowConnectionManager()

def initialize_demo_data():
    """Initialize demo passengers and flights"""
    
    # Create airports
    lhr = Airport("LHR", "London Heathrow", "UK", "Europe")
    cdg = Airport("CDG", "Paris Charles de Gaulle", "France", "Europe")
    jfk = Airport("JFK", "New York JFK", "USA", "North America")
    fra = Airport("FRA", "Frankfurt", "Germany", "Europe")
    ord = Airport("ORD", "Chicago O'Hare", "USA", "North America")
    dub = Airport("DUB", "Dublin", "Ireland", "Europe")
    
    # Create airlines
    af = Airline("AF", "Air France", Alliance.SKYTEAM, Terminal.T4)
    kl = Airline("KL", "KLM", Alliance.SKYTEAM, Terminal.T4)
    vs = Airline("VS", "Virgin Atlantic", Alliance.VIRGIN_ATLANTIC, Terminal.T3)
    lh = Airline("LH", "Lufthansa", Alliance.STAR_ALLIANCE, Terminal.T2)
    ua = Airline("UA", "United Airlines", Alliance.STAR_ALLIANCE, Terminal.T2)
    
    # Create flights with realistic times
    now = datetime.now()
    
    # Sophie Laurent - CDG to JFK via LHR (tight connection)
    af_flight = Flight(
        flight_number="AF1381",
        airline=af,
        origin=cdg,
        destination=lhr,
        departure_time=now + timedelta(hours=1),
        arrival_time=now + timedelta(hours=2, minutes=30),
        terminal=Terminal.T4,
        aircraft_type="Airbus A320",
        real_time_data=RealTimeFlightData(
            flight_id="AF1381",
            current_status=FlightStatus.AIRBORNE,
            delay_minutes=0
        )
    )
    
    vs_flight = Flight(
        flight_number="VS003",
        airline=vs,
        origin=lhr,
        destination=jfk,
        departure_time=now + timedelta(hours=3),
        arrival_time=now + timedelta(hours=11),
        terminal=Terminal.T3,
        aircraft_type="Boeing 787",
        real_time_data=RealTimeFlightData(
            flight_id="VS003",
            current_status=FlightStatus.SCHEDULED,
            delay_minutes=0
        )
    )
    
    sophie = Passenger(
        passenger_id="PAX003",
        name="Sophie Laurent",
        origin=cdg,
        final_destination=jfk,
        alliance_status="SkyTeam Elite",
        connection_flights=[af_flight, vs_flight]
    )
    
    # Hans Mueller - FRA to ORD via LHR (delayed inbound)
    lh_flight = Flight(
        flight_number="LH925",
        airline=lh,
        origin=fra,
        destination=lhr,
        departure_time=now + timedelta(hours=0, minutes=30),
        arrival_time=now + timedelta(hours=2),
        terminal=Terminal.T2,
        aircraft_type="Airbus A350",
        real_time_data=RealTimeFlightData(
            flight_id="LH925",
            current_status=FlightStatus.DELAYED,
            delay_minutes=45
        )
    )
    
    ua_flight = Flight(
        flight_number="UA901",
        airline=ua,
        origin=lhr,
        destination=ord,
        departure_time=now + timedelta(hours=3, minutes=30),
        arrival_time=now + timedelta(hours=12),
        terminal=Terminal.T2,
        aircraft_type="Boeing 787",
        real_time_data=RealTimeFlightData(
            flight_id="UA901",
            current_status=FlightStatus.SCHEDULED,
            delay_minutes=0
        )
    )
    
    hans = Passenger(
        passenger_id="PAX004",
        name="Hans Mueller",
        origin=fra,
        final_destination=ord,
        alliance_status="Star Alliance Gold",
        connection_flights=[lh_flight, ua_flight]
    )
    
    # Add passengers to the system
    heathrow_ml_manager.add_passenger(sophie)
    heathrow_ml_manager.add_passenger(hans)
    
    print("Demo data initialized with ML predictions.")

if __name__ == "__main__":
    initialize_demo_data()
    
    # Display system status
    status = heathrow_ml_manager.get_system_status()
    print("\n=== ML Connection Management System Status ===")
    print(f"Passengers monitored: {status['passengers_monitored']}")
    print(f"Active predictions: {status['active_predictions']}")
    print(f"Active alerts: {status['active_alerts']}")
    print(f"ML models trained: {status['ml_models_trained']}")
    
    # Display recent alerts
    print("\n=== Recent ML Alerts ===")
    for alert in heathrow_ml_manager.alerts[-5:]:
        print(f"[{alert['risk_level']}] {alert['passenger_name']}: {alert['type']}")
        print(f"  Connection: {alert['arriving_flight']} → {alert['departing_flight']}")
        print(f"  Success Probability: {alert['probability']:.2%}")
        print(f"  Confidence: {alert['confidence']:.2%}")
        print()
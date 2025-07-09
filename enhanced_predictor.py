#!/usr/bin/env python3
"""
Enhanced Predictor for AINO Aviation Intelligence Platform
Makes predictions using enhanced model with METAR weather data
"""

import pandas as pd
import numpy as np
import joblib
import json
import requests
from datetime import datetime
from typing import Dict, List
import logging
from metar_weather import get_airport_weather

# Configure logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

class EnhancedPredictor:
    """Enhanced predictor with METAR weather integration"""
    
    def __init__(self, model_file='enhanced_delay_model.pkl', metadata_file='enhanced_model_metadata.json'):
        self.model_file = model_file
        self.metadata_file = metadata_file
        self.model = None
        self.metadata = None
        self.feature_columns = [
            'departure_delay_mins', 'enroute_time_min', 'altitude',
            'ground_speed', 'lat', 'lon', 'day_of_week',
            'hour_of_day', 'weather_score'
        ]
        self.base_url = 'http://localhost:5000'
        
        self._load_model()
    
    def _load_model(self):
        """Load enhanced model and metadata"""
        try:
            self.model = joblib.load(self.model_file)
            
            with open(self.metadata_file, 'r') as f:
                self.metadata = json.load(f)
            
            logger.info(f"Enhanced model loaded - Accuracy: {self.metadata.get('model_accuracy', 'Unknown')}")
            
        except Exception as e:
            logger.error(f"Error loading enhanced model: {e}")
            raise
    
    def get_authentic_weather_score(self, airport_code: str) -> float:
        """Get authentic weather score for airport"""
        try:
            weather_data = get_airport_weather(airport_code)
            if weather_data and 'weather_impact_score' in weather_data:
                return weather_data['weather_impact_score']
            else:
                return 0.2  # Default low impact
        except Exception as e:
            logger.warning(f"Weather fetch error for {airport_code}: {e}")
            return 0.2
    
    def get_live_flights(self) -> List[Dict]:
        """Fetch live Virgin Atlantic flights"""
        try:
            response = requests.get(f"{self.base_url}/api/aviation/virgin-atlantic-flights", timeout=10)
            if response.status_code == 200:
                data = response.json()
                return data.get('flights', [])
        except Exception as e:
            logger.error(f"Error fetching flights: {e}")
        return []
    
    def predict_flight_delay(self, flight: Dict) -> Dict:
        """Predict delay for a single flight with enhanced features"""
        try:
            now = datetime.utcnow()
            
            # Get authentic weather score
            dest = flight.get('arrival_airport', flight.get('destination', 'UNKNOWN'))
            weather_score = self.get_authentic_weather_score(dest)
            
            # Calculate enroute time (simulated if no departure time)
            enroute_time_min = 180  # Default trans-Atlantic flight time
            
            # Clean flight data
            altitude = flight.get('altitude', 35000)
            if altitude == 'ground' or altitude is None:
                altitude = 0
            else:
                try:
                    altitude = float(altitude)
                except (ValueError, TypeError):
                    altitude = 35000
            
            ground_speed = flight.get('velocity', flight.get('ground_speed', 450))
            if ground_speed is None or ground_speed == '':
                ground_speed = 450
            else:
                try:
                    ground_speed = float(ground_speed)
                except (ValueError, TypeError):
                    ground_speed = 450
            
            # Create feature vector
            features = {
                'departure_delay_mins': flight.get('delay_minutes', 0),
                'enroute_time_min': enroute_time_min,
                'altitude': altitude,
                'ground_speed': ground_speed,
                'lat': flight.get('latitude', 51.5),
                'lon': flight.get('longitude', -1.0),
                'day_of_week': now.weekday(),
                'hour_of_day': now.hour,
                'weather_score': weather_score
            }
            
            # Create DataFrame for prediction
            feature_df = pd.DataFrame([features])
            
            # Make prediction
            prediction = self.model.predict(feature_df)[0]
            probability = self.model.predict_proba(feature_df)[0]
            
            # Map prediction to labels
            delay_labels = {0: 'On Time', 1: 'Minor Delay', 2: 'Major Delay'}
            predicted_label = delay_labels.get(prediction, 'Unknown')
            
            confidence = max(probability)
            
            return {
                'flight_number': flight.get('flight_number', 'UNKNOWN'),
                'destination': dest,
                'prediction': predicted_label,
                'confidence': confidence,
                'weather_score': weather_score,
                'features_used': features
            }
            
        except Exception as e:
            logger.error(f"Prediction error for flight {flight.get('flight_number', 'UNKNOWN')}: {e}")
            return {
                'flight_number': flight.get('flight_number', 'UNKNOWN'),
                'prediction': 'Error',
                'error': str(e)
            }
    
    def predict_all_flights(self) -> List[Dict]:
        """Generate predictions for all live flights"""
        flights = self.get_live_flights()
        
        if not flights:
            logger.warning("No flights available for prediction")
            return []
        
        predictions = []
        for flight in flights:
            pred = self.predict_flight_delay(flight)
            predictions.append(pred)
        
        logger.info(f"Generated predictions for {len(predictions)} flights")
        return predictions

def main():
    """Main prediction function"""
    print("🔮 Enhanced Prediction with METAR Weather Data")
    print("=" * 50)
    
    try:
        predictor = EnhancedPredictor()
        predictions = predictor.predict_all_flights()
        
        if predictions:
            print(f"✅ Generated {len(predictions)} predictions")
            
            # Create DataFrame for display as requested
            df_data = []
            for pred in predictions:
                if 'error' not in pred:
                    df_data.append({
                        'flight_id': pred['flight_number'],
                        'dest': pred['destination'],
                        'gs': pred.get('features_used', {}).get('ground_speed', 450),
                        'alt': pred.get('features_used', {}).get('altitude', 35000),
                        'weather_score': pred['weather_score'],
                        'Prediction': pred['prediction']
                    })
            
            if df_data:
                df = pd.DataFrame(df_data)
                print("\n📊 Flight Predictions with METAR Weather Data:")
                print("=" * 60)
                print(df[['flight_id', 'dest', 'gs', 'alt', 'weather_score', 'Prediction']].to_string(index=False))
        else:
            print("❌ No predictions generated")
            
    except Exception as e:
        print(f"❌ Prediction failed: {e}")

if __name__ == "__main__":
    main()
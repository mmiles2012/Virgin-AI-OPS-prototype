#!/usr/bin/env python3
"""
Real-time Delay Prediction for AINO Aviation Intelligence Platform
Uses trained ML model to predict Virgin Atlantic flight delays
"""

import pandas as pd
import numpy as np
import joblib
import json
import requests
from datetime import datetime, timedelta
from typing import Dict, List, Optional
import os
import logging

# Configure logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

class AINODelayPredictor:
    """Real-time delay prediction using trained ML model"""
    
    def __init__(self, model_file='delay_model.pkl'):
        self.model_file = model_file
        self.feature_columns_file = 'feature_columns.txt'
        self.model_metadata_file = 'model_metadata.json'
        self.base_url = 'http://localhost:5000'
        
        # Load model artifacts
        self._load_model_artifacts()
    
    def _load_model_artifacts(self):
        """Load trained model and metadata"""
        try:
            # Load model
            if not os.path.exists(self.model_file):
                raise FileNotFoundError(f"Model file {self.model_file} not found. Run train_model.py first.")
            
            self.model = joblib.load(self.model_file)
            logger.info(f"Model loaded from {self.model_file}")
            
            # Load feature columns
            if not os.path.exists(self.feature_columns_file):
                raise FileNotFoundError(f"Feature columns file {self.feature_columns_file} not found.")
            
            with open(self.feature_columns_file, "r") as f:
                self.feature_columns = f.read().strip().split(",")
            logger.info(f"Loaded {len(self.feature_columns)} feature columns")
            
            # Load metadata
            if os.path.exists(self.model_metadata_file):
                with open(self.model_metadata_file, 'r') as f:
                    self.metadata = json.load(f)
                logger.info(f"Model metadata loaded - accuracy: {self.metadata.get('test_accuracy', 'unknown')}")
            else:
                self.metadata = {}
                
        except Exception as e:
            logger.error(f"Failed to load model artifacts: {e}")
            raise
    
    def get_realtime_virgin_flights(self) -> List[Dict]:
        """Fetch live Virgin Atlantic flights from AINO platform"""
        try:
            response = requests.get(f"{self.base_url}/api/aviation/virgin-atlantic-flights", timeout=10)
            if response.status_code == 200:
                data = response.json()
                return data.get('flights', [])
            else:
                logger.error(f"Failed to fetch flights: {response.status_code}")
                return []
        except Exception as e:
            logger.error(f"Error fetching flights: {e}")
            return []
    
    def generate_features_from_live(self, flight: Dict) -> Dict:
        """Generate ML features from live flight data"""
        now = datetime.utcnow()
        
        # Parse departure time
        try:
            dep_time_str = flight.get('scheduled_departure', 'UNKNOWN')
            if dep_time_str != 'UNKNOWN':
                departure_time = datetime.fromisoformat(dep_time_str.replace('Z', '+00:00'))
            else:
                departure_time = now - timedelta(hours=2)  # Assume 2 hours ago
        except:
            departure_time = now - timedelta(hours=2)
        
        # Calculate enroute time
        enroute_minutes = (now - departure_time).total_seconds() / 60.0
        
        # Features that match exactly what the model was trained on
        features = {
            'delay_minutes': flight.get('delay_minutes', 0),
            'altitude': flight.get('altitude', 35000),
            'latitude': flight.get('latitude', 51.5),
            'longitude': flight.get('longitude', -1.0),
            'velocity': flight.get('velocity', 450),
            'day_of_week': now.weekday(),
            'hour_of_day': now.hour,
            'weather_visibility': 10.0,  # Default good visibility
            'weather_wind_speed': 8.0,   # Default moderate wind
            'weather_temperature': 15.0, # Default temperature
            'weather_impact_score': 0.2,  # Default low impact
            'is_weekend': 1 if now.weekday() >= 5 else 0,
            'month': now.month,
            'quarter': (now.month - 1) // 3 + 1
        }
        
        # Add aircraft type encoding
        aircraft_type = flight.get('aircraft_type', 'UNKNOWN')
        aircraft_map = {'A35K': 4, 'B789': 3, 'A339': 2, 'A333': 1, 'UNKNOWN': 0}
        features['aircraft_type_encoded'] = aircraft_map.get(aircraft_type, 0)
        
        # Add route complexity
        route = flight.get('route', 'UNKNOWN')
        if 'UNKNOWN' in str(route):
            complexity = 0.5
        elif any(code in str(route) for code in ['JNB', 'LOS', 'RUH']):  # Long-haul
            complexity = 1.0
        elif any(code in str(route) for code in ['ATL', 'BOS', 'IAD']):  # Trans-Atlantic
            complexity = 0.8
        else:
            complexity = 0.3
        features['route_complexity'] = complexity
        
        return features
    
    def predict_delay_class(self, flight: Dict) -> Dict:
        """Predict delay class for a single flight"""
        try:
            # Generate features
            features = self.generate_features_from_live(flight)
            
            # Create DataFrame with only the features the model expects
            feature_df = pd.DataFrame([features])
            
            # Ensure we only use columns that the model was trained on
            available_features = [col for col in self.feature_columns if col in feature_df.columns]
            missing_features = [col for col in self.feature_columns if col not in feature_df.columns]
            
            if missing_features:
                logger.warning(f"Missing features: {missing_features}")
                # Fill missing features with defaults
                for col in missing_features:
                    feature_df[col] = 0.0
            
            # Select and order features correctly
            X = feature_df[self.feature_columns]
            
            # Make prediction
            delay_class = self.model.predict(X)[0]
            prediction_proba = self.model.predict_proba(X)[0]
            
            # Map delay classes
            delay_label_map = {
                0: "On Time",
                1: "Minor Delay",
                2: "Major Delay"
            }
            
            # Get confidence score
            confidence = float(max(prediction_proba))
            
            result = {
                'flight_number': flight.get('flight_number', 'UNKNOWN'),
                'prediction': delay_label_map.get(delay_class, f"Class {delay_class}"),
                'delay_class': int(delay_class),
                'confidence': confidence,
                'probabilities': {
                    'on_time': float(prediction_proba[0]),
                    'minor_delay': float(prediction_proba[1]) if len(prediction_proba) > 1 else 0.0,
                    'major_delay': float(prediction_proba[2]) if len(prediction_proba) > 2 else 0.0
                },
                'current_status': flight.get('status', 'UNKNOWN'),
                'route': flight.get('route', 'UNKNOWN'),
                'aircraft_type': flight.get('aircraft_type', 'UNKNOWN'),
                'features_used': len(available_features),
                'model_accuracy': self.metadata.get('test_accuracy', 'unknown')
            }
            
            return result
            
        except Exception as e:
            logger.error(f"Prediction failed for flight {flight.get('flight_number', 'UNKNOWN')}: {e}")
            return {
                'flight_number': flight.get('flight_number', 'UNKNOWN'),
                'prediction': "Error",
                'error': str(e)
            }
    
    def predict_all_live_flights(self) -> List[Dict]:
        """Predict delays for all live Virgin Atlantic flights"""
        flights = self.get_realtime_virgin_flights()
        if not flights:
            logger.warning("No live flights available for prediction")
            return []
        
        predictions = []
        for flight in flights:
            prediction = self.predict_delay_class(flight)
            predictions.append(prediction)
        
        logger.info(f"Generated predictions for {len(predictions)} flights")
        return predictions
    
    def get_model_status(self) -> Dict:
        """Get current model status and performance"""
        return {
            'model_loaded': hasattr(self, 'model'),
            'feature_count': len(self.feature_columns) if hasattr(self, 'feature_columns') else 0,
            'model_accuracy': self.metadata.get('test_accuracy', 'unknown'),
            'training_date': self.metadata.get('training_date', 'unknown'),
            'training_records': self.metadata.get('training_records', 'unknown'),
            'delay_classes': self.metadata.get('delay_classes', {})
        }

# Global predictor instance
_predictor = None

def get_predictor():
    """Get global predictor instance"""
    global _predictor
    if _predictor is None:
        _predictor = AINODelayPredictor()
    return _predictor

def predict_delay_class(flight: Dict) -> str:
    """Simple interface for delay prediction - returns just the class"""
    predictor = get_predictor()
    result = predictor.predict_delay_class(flight)
    return result.get('prediction', 'Error')

def main():
    """Main execution for delay prediction"""
    print("AINO Aviation Delay Prediction System")
    print("=" * 40)
    
    try:
        predictor = AINODelayPredictor()
        
        # Show model status
        status = predictor.get_model_status()
        print(f"\n📊 Model Status:")
        print(f"Accuracy: {status['model_accuracy']}")
        print(f"Features: {status['feature_count']}")
        print(f"Training date: {status['training_date']}")
        print(f"Training records: {status['training_records']}")
        
        # Get predictions for all live flights
        print(f"\n🛫 Live Flight Predictions:")
        predictions = predictor.predict_all_live_flights()
        
        if predictions:
            for pred in predictions:
                if 'error' not in pred:
                    print(f"  {pred['flight_number']}: {pred['prediction']} "
                          f"(confidence: {pred['confidence']:.2f})")
                else:
                    print(f"  {pred['flight_number']}: Error - {pred['error']}")
        else:
            print("  No live flights available")
            
    except Exception as e:
        print(f"❌ Prediction failed: {e}")
        logger.error(f"Prediction error: {e}")

if __name__ == "__main__":
    main()
#!/usr/bin/env python3
"""
Real-time Connection Prediction for Heathrow
Uses trained ML models to predict connection success in real-time
"""

import pandas as pd
import numpy as np
import json
import joblib
from datetime import datetime, timedelta
from typing import Dict, List, Optional
import os

from fetch_flightaware import FlightAwareHeathrowFetcher
from connection_features import ConnectionFeatureEngineer

class HeathrowConnectionPredictor:
    """Real-time connection success prediction using trained ML models"""
    
    def __init__(self):
        self.models = {}
        self.feature_names = []
        self.feature_engineer = ConnectionFeatureEngineer()
        self.last_update = None
        self.predictions_cache = {}
        
    def load_models(self) -> bool:
        """Load trained ML models"""
        
        try:
            print("[Predictor] Loading trained models...")
            
            # Load models
            model_files = {
                'rf_probability': 'heathrow_connection_rf_probability.pkl',
                'gb_probability': 'heathrow_connection_gb_probability.pkl',
                'rf_classification': 'heathrow_connection_rf_classification.pkl'
            }
            
            for model_name, filename in model_files.items():
                if os.path.exists(filename):
                    self.models[model_name] = joblib.load(filename)
                    print(f"[Predictor] Loaded {model_name}")
            
            # Load feature names
            if os.path.exists('heathrow_connection_features.json'):
                with open('heathrow_connection_features.json', 'r') as f:
                    self.feature_names = json.load(f)
                print(f"[Predictor] Loaded {len(self.feature_names)} feature names")
            
            return len(self.models) > 0
            
        except Exception as e:
            print(f"[Predictor] Error loading models: {e}")
            return False
    
    def predict_live_connections(self) -> Dict:
        """Predict success for all current live connections"""
        
        if not self.models:
            if not self.load_models():
                return {"error": "No trained models available"}
        
        print("[Predictor] Predicting live connections...")
        
        # Get current flight data
        fetcher = FlightAwareHeathrowFetcher()
        connection_data = fetcher.get_connection_data()
        
        if not connection_data.get('connection_opportunities'):
            return {
                "timestamp": datetime.now().isoformat(),
                "predictions": [],
                "summary": {"total_connections": 0, "avg_success_probability": 0}
            }
        
        # Process each connection
        predictions = []
        
        for connection in connection_data['connection_opportunities']:
            try:
                # Find arrival and departure details
                arrival = self._find_flight(connection_data['arrivals'], connection['arrival_flight'])
                departure = self._find_flight(connection_data['departures'], connection['departure_flight'])
                
                if arrival and departure:
                    # Create connection record
                    connection_record = self._create_connection_record(arrival, departure, connection)
                    
                    # Predict success
                    prediction = self._predict_single_connection(connection_record)
                    
                    # Add flight details
                    prediction.update({
                        'arrival_flight': connection['arrival_flight'],
                        'departure_flight': connection['departure_flight'],
                        'connection_time_minutes': connection['connection_time_minutes'],
                        'arrival_origin': arrival.get('origin', 'Unknown'),
                        'departure_destination': departure.get('destination', 'Unknown'),
                        'arrival_terminal': arrival.get('terminal', 'Unknown'),
                        'departure_terminal': departure.get('terminal', 'Unknown')
                    })
                    
                    predictions.append(prediction)
                    
            except Exception as e:
                print(f"[Predictor] Error predicting connection {connection.get('arrival_flight', 'Unknown')}: {e}")
                continue
        
        # Generate summary
        summary = self._generate_prediction_summary(predictions)
        
        result = {
            "timestamp": datetime.now().isoformat(),
            "predictions": predictions,
            "summary": summary,
            "data_source": connection_data.get('data_source', 'FlightAware_AeroAPI')
        }
        
        # Cache results
        self.predictions_cache = result
        self.last_update = datetime.now()
        
        print(f"[Predictor] Generated {len(predictions)} connection predictions")
        return result
    
    def predict_connection_by_flights(self, arrival_flight: str, departure_flight: str) -> Dict:
        """Predict specific connection between two flights"""
        
        # Get current data
        fetcher = FlightAwareHeathrowFetcher()
        connection_data = fetcher.get_connection_data()
        
        # Find the specific connection
        target_connection = None
        for conn in connection_data.get('connection_opportunities', []):
            if (conn['arrival_flight'] == arrival_flight and 
                conn['departure_flight'] == departure_flight):
                target_connection = conn
                break
        
        if not target_connection:
            return {"error": f"Connection {arrival_flight} → {departure_flight} not found"}
        
        # Find flight details
        arrival = self._find_flight(connection_data['arrivals'], arrival_flight)
        departure = self._find_flight(connection_data['departures'], departure_flight)
        
        if not arrival or not departure:
            return {"error": "Flight details not found"}
        
        # Create connection record and predict
        connection_record = self._create_connection_record(arrival, departure, target_connection)
        prediction = self._predict_single_connection(connection_record)
        
        # Add detailed information
        prediction.update({
            'arrival_details': arrival,
            'departure_details': departure,
            'connection_analysis': target_connection,
            'prediction_timestamp': datetime.now().isoformat()
        })
        
        return prediction
    
    def _predict_single_connection(self, connection_record: Dict) -> Dict:
        """Predict success for a single connection"""
        
        try:
            # Convert to DataFrame
            df = pd.DataFrame([connection_record])
            
            # Engineer features
            featured_df = self.feature_engineer.create_features(df)
            featured_df = self.feature_engineer.encode_categorical_features(featured_df)
            
            # Extract ML features
            available_features = [f for f in self.feature_names if f in featured_df.columns]
            X = featured_df[available_features].fillna(0)
            
            # Fill missing features with zeros
            for feature in self.feature_names:
                if feature not in X.columns:
                    X[feature] = 0
            
            # Reorder to match training
            X = X[self.feature_names]
            
            predictions = {}
            
            # Probability prediction
            if 'rf_probability' in self.models:
                prob_rf = self.models['rf_probability'].predict(X)[0]
                predictions['rf_probability'] = float(np.clip(prob_rf, 0, 1))
            
            if 'gb_probability' in self.models:
                prob_gb = self.models['gb_probability'].predict(X)[0]
                predictions['gb_probability'] = float(np.clip(prob_gb, 0, 1))
            
            # Classification prediction
            if 'rf_classification' in self.models:
                class_pred = self.models['rf_classification'].predict(X)[0]
                class_proba = self.models['rf_classification'].predict_proba(X)[0]
                predictions['classification_result'] = bool(class_pred)
                predictions['classification_confidence'] = float(max(class_proba))
            
            # Ensemble prediction
            prob_predictions = [v for k, v in predictions.items() if 'probability' in k]
            if prob_predictions:
                predictions['ensemble_probability'] = float(np.mean(prob_predictions))
            else:
                predictions['ensemble_probability'] = 0.5
            
            # Risk assessment
            risk_level = self._assess_risk_level(predictions['ensemble_probability'], connection_record)
            predictions['risk_level'] = risk_level
            
            # Recommendations
            recommendations = self._generate_recommendations(predictions, connection_record)
            predictions['recommendations'] = recommendations
            
            # Confidence intervals
            predictions['confidence_interval'] = self._calculate_confidence_interval(predictions)
            
            return predictions
            
        except Exception as e:
            print(f"[Predictor] Error in single connection prediction: {e}")
            return {
                'error': str(e),
                'ensemble_probability': 0.5,
                'risk_level': 'UNKNOWN',
                'recommendations': ['Unable to generate prediction - manual review required']
            }
    
    def _create_connection_record(self, arrival: Dict, departure: Dict, connection: Dict) -> Dict:
        """Create connection record from flight data"""
        
        # Parse times
        arr_time = self._parse_time(arrival.get('actual_arrival') or arrival.get('scheduled_arrival'))
        dep_time = self._parse_time(departure.get('scheduled_departure'))
        
        record = {
            # Basic identifiers
            'arrival_flight': arrival['flight_number'],
            'departure_flight': departure['flight_number'],
            
            # Time features
            'arrival_hour': arr_time.hour if arr_time else 12,
            'departure_hour': dep_time.hour if dep_time else 12,
            'arrival_day_of_week': arr_time.weekday() if arr_time else 3,
            
            # Connection metrics
            'connection_time_minutes': connection.get('connection_time_minutes', 90),
            'minimum_connection_time': connection.get('minimum_connection_time', 75),
            'connection_buffer': connection.get('connection_time_minutes', 90) - connection.get('minimum_connection_time', 75),
            
            # Flight details
            'arrival_delay_minutes': arrival.get('delay_minutes', 0),
            'terminal_transfer': arrival.get('terminal') != departure.get('terminal'),
            'estimated_passengers': arrival.get('passenger_count', 200),
            
            # Airport and route info
            'is_international_arrival': arrival.get('is_international', True),
            'is_international_departure': not departure.get('destination', '').startswith('EG'),
            
            # Virgin Atlantic specific
            'is_virgin_atlantic_arrival': 'Virgin Atlantic' in arrival.get('airline', ''),
            'is_virgin_atlantic_departure': departure.get('is_virgin_atlantic', False),
            'is_virgin_skyteam_connection': self._is_virgin_skyteam_connection(arrival, departure),
            
            # Risk factors
            'risk_factor_count': len(connection.get('risk_factors', [])),
            'has_tight_connection': 'TIGHT_CONNECTION' in connection.get('risk_factors', []),
            'has_arrival_delay': 'ARRIVAL_DELAY' in connection.get('risk_factors', []),
            'has_weather_risk': 'WEATHER_IMPACT' in connection.get('risk_factors', []),
            
            # Additional features
            'same_airline': arrival.get('airline') == departure.get('airline'),
            'alliance_connection': self._is_virgin_skyteam_connection(arrival, departure),
            'success_probability': connection.get('success_probability', 0.5),
            'connection_success': connection.get('success_probability', 0.5) > 0.7
        }
        
        return record
    
    def _assess_risk_level(self, probability: float, connection_record: Dict) -> str:
        """Assess overall risk level for the connection"""
        
        if probability >= 0.85:
            return 'LOW'
        elif probability >= 0.7:
            return 'MEDIUM'
        elif probability >= 0.5:
            return 'HIGH'
        else:
            return 'CRITICAL'
    
    def _generate_recommendations(self, predictions: Dict, connection_record: Dict) -> List[str]:
        """Generate actionable recommendations"""
        
        recommendations = []
        prob = predictions.get('ensemble_probability', 0.5)
        risk = predictions.get('risk_level', 'MEDIUM')
        
        # Risk-based recommendations
        if risk == 'CRITICAL':
            recommendations.append("⚠️ CRITICAL: Consider rebooking on later flight")
            recommendations.append("📞 Contact Virgin Atlantic customer service immediately")
            recommendations.append("🎯 Arrange priority transfer assistance")
        elif risk == 'HIGH':
            recommendations.append("⚡ HIGH RISK: Monitor arrival delays closely")
            recommendations.append("🚀 Arrange expedited transfer if possible")
            recommendations.append("📱 Enable flight notifications")
        elif risk == 'MEDIUM':
            recommendations.append("👁️ Monitor connection - standard precautions")
            recommendations.append("🚶‍♂️ Allow extra time for terminal transfer")
        else:
            recommendations.append("✅ Connection likely successful")
            recommendations.append("🛫 Standard connection procedures apply")
        
        # Specific operational recommendations
        if connection_record.get('terminal_transfer', False):
            recommendations.append("🔄 Terminal transfer required - allow 15+ extra minutes")
        
        if connection_record.get('arrival_delay_minutes', 0) > 15:
            recommendations.append(f"⏰ Arrival delay: {connection_record['arrival_delay_minutes']} minutes")
        
        if connection_record.get('is_virgin_atlantic_departure', False):
            recommendations.append("🛩️ Virgin Atlantic departure - connection assistance available")
        
        if connection_record.get('is_virgin_skyteam_connection', False):
            recommendations.append("🤝 Virgin-SkyTeam connection - coordinated assistance")
        
        return recommendations
    
    def _calculate_confidence_interval(self, predictions: Dict) -> Dict:
        """Calculate confidence interval for prediction"""
        
        prob = predictions.get('ensemble_probability', 0.5)
        
        # Simple confidence interval based on model agreement
        prob_values = [v for k, v in predictions.items() if 'probability' in k]
        
        if len(prob_values) > 1:
            std = np.std(prob_values)
            margin = 1.96 * std  # 95% confidence interval
        else:
            margin = 0.1  # Default margin
        
        return {
            'lower_bound': max(0, prob - margin),
            'upper_bound': min(1, prob + margin),
            'margin_of_error': margin
        }
    
    def _generate_prediction_summary(self, predictions: List[Dict]) -> Dict:
        """Generate summary statistics for all predictions"""
        
        if not predictions:
            return {"total_connections": 0}
        
        probabilities = [p.get('ensemble_probability', 0.5) for p in predictions]
        risk_levels = [p.get('risk_level', 'UNKNOWN') for p in predictions]
        
        summary = {
            'total_connections': len(predictions),
            'avg_success_probability': float(np.mean(probabilities)),
            'min_success_probability': float(np.min(probabilities)),
            'max_success_probability': float(np.max(probabilities)),
            'risk_distribution': {
                'LOW': risk_levels.count('LOW'),
                'MEDIUM': risk_levels.count('MEDIUM'),
                'HIGH': risk_levels.count('HIGH'),
                'CRITICAL': risk_levels.count('CRITICAL')
            },
            'virgin_atlantic_connections': sum(1 for p in predictions if 'Virgin' in p.get('arrival_flight', '') or 'Virgin' in p.get('departure_flight', '')),
            'terminal_transfers': sum(1 for p in predictions if p.get('arrival_terminal') != p.get('departure_terminal')),
            'tight_connections': sum(1 for p in predictions if p.get('connection_time_minutes', 999) < 90)
        }
        
        return summary
    
    def get_cached_predictions(self) -> Optional[Dict]:
        """Get cached predictions if recent"""
        
        if (self.last_update and 
            datetime.now() - self.last_update < timedelta(minutes=5) and
            self.predictions_cache):
            return self.predictions_cache
        
        return None
    
    # Utility methods
    def _find_flight(self, flights: List[Dict], flight_number: str) -> Optional[Dict]:
        """Find flight by flight number"""
        for flight in flights:
            if flight.get('flight_number') == flight_number:
                return flight
        return None
    
    def _parse_time(self, time_str: Optional[str]) -> Optional[datetime]:
        """Parse time string to datetime"""
        if not time_str:
            return None
        try:
            return datetime.fromisoformat(time_str.replace('Z', '+00:00'))
        except:
            return None
    
    def _is_virgin_skyteam_connection(self, arrival: Dict, departure: Dict) -> bool:
        """Check if this is a Virgin-SkyTeam connection"""
        va_arrival = 'Virgin Atlantic' in arrival.get('airline', '')
        skyteam_dep = any(airline in departure.get('airline', '') for airline in ['Air France', 'KLM', 'Delta'])
        return va_arrival and skyteam_dep

def main():
    """Test connection prediction"""
    print("Heathrow Connection Predictor Test")
    print("=" * 40)
    
    predictor = HeathrowConnectionPredictor()
    
    # Load models
    if not predictor.load_models():
        print("No trained models found. Please run train_model.py first.")
        return
    
    # Test live predictions
    print("\nGenerating live connection predictions...")
    predictions = predictor.predict_live_connections()
    
    if 'error' in predictions:
        print(f"Error: {predictions['error']}")
        return
    
    print(f"\nPrediction Summary:")
    summary = predictions['summary']
    print(f"Total connections: {summary['total_connections']}")
    print(f"Average success probability: {summary['avg_success_probability']:.2%}")
    print(f"Risk distribution: {summary['risk_distribution']}")
    
    # Show top risky connections
    risky_connections = [p for p in predictions['predictions'] if p.get('risk_level') in ['HIGH', 'CRITICAL']]
    
    if risky_connections:
        print(f"\nHigh-Risk Connections ({len(risky_connections)}):")
        for conn in risky_connections[:5]:  # Show top 5
            print(f"  {conn['arrival_flight']} → {conn['departure_flight']}")
            print(f"    Success probability: {conn.get('ensemble_probability', 0.5):.1%}")
            print(f"    Risk level: {conn.get('risk_level', 'UNKNOWN')}")
            print(f"    Connection time: {conn.get('connection_time_minutes', 'Unknown')} minutes")
            print()
    
    # Test specific connection prediction
    if predictions['predictions']:
        sample = predictions['predictions'][0]
        print(f"\nTesting specific connection prediction...")
        specific = predictor.predict_connection_by_flights(
            sample['arrival_flight'], 
            sample['departure_flight']
        )
        
        print(f"Connection: {sample['arrival_flight']} → {sample['departure_flight']}")
        print(f"Success probability: {specific.get('ensemble_probability', 0.5):.1%}")
        print(f"Recommendations:")
        for rec in specific.get('recommendations', []):
            print(f"  • {rec}")

if __name__ == "__main__":
    main()
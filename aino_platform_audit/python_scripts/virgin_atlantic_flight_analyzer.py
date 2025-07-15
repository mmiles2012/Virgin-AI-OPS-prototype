#!/usr/bin/env python3
"""
Virgin Atlantic Flight Analysis System with ML-powered Issue Detection
Advanced predictive analytics for AINO Aviation Intelligence Platform
"""

import pandas as pd
import numpy as np
from datetime import datetime, timedelta
import requests
import json
import warnings
from typing import Dict, List, Tuple, Optional
import logging

# ML imports
from sklearn.ensemble import RandomForestClassifier, IsolationForest
from sklearn.preprocessing import StandardScaler, LabelEncoder
from sklearn.model_selection import train_test_split
from sklearn.metrics import classification_report, confusion_matrix
from sklearn.cluster import DBSCAN
import joblib

warnings.filterwarnings('ignore')
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class VirginAtlanticFlightAnalyzer:
    """
    ML-powered flight issue detection system for Virgin Atlantic operations
    """
    
    def __init__(self):
        self.models = {}
        self.scalers = {}
        self.encoders = {}
        self.feature_columns = []
        self.risk_threshold = 0.7
        
        # Virgin Atlantic fleet and route data
        self.va_fleet = {
            'A330-200': {'capacity': 262, 'range_nm': 7250, 'maintenance_interval': 500},
            'A330-300': {'capacity': 296, 'range_nm': 6350, 'maintenance_interval': 500},
            'A350-1000': {'capacity': 335, 'range_nm': 8700, 'maintenance_interval': 600},
            'B747-400': {'capacity': 455, 'range_nm': 7260, 'maintenance_interval': 400},
            'B787-9': {'capacity': 258, 'range_nm': 7635, 'maintenance_interval': 650}
        }
        
        # Major Virgin Atlantic routes
        self.va_routes = {
            'LHR-JFK': {'distance_nm': 3459, 'frequency': 'daily', 'peak_season': ['Jun', 'Jul', 'Aug', 'Dec']},
            'LHR-LAX': {'distance_nm': 5440, 'frequency': 'daily', 'peak_season': ['Jun', 'Jul', 'Aug']},
            'LHR-BOS': {'distance_nm': 3260, 'frequency': 'daily', 'peak_season': ['Jun', 'Jul', 'Aug', 'Sep']},
            'MAN-JFK': {'distance_nm': 3336, 'frequency': '6x_weekly', 'peak_season': ['Jun', 'Jul', 'Aug']},
            'LHR-MIA': {'distance_nm': 4420, 'frequency': 'daily', 'peak_season': ['Dec', 'Jan', 'Feb', 'Mar']},
            'LHR-SFO': {'distance_nm': 5350, 'frequency': 'daily', 'peak_season': ['Jun', 'Jul', 'Aug']},
            'LHR-SEA': {'distance_nm': 4800, 'frequency': '6x_weekly', 'peak_season': ['Jun', 'Jul', 'Aug']},
            'LHR-LAS': {'distance_nm': 5210, 'frequency': '6x_weekly', 'peak_season': ['Dec', 'Jan', 'Feb']},
            'LHR-MCO': {'distance_nm': 4340, 'frequency': 'daily', 'peak_season': ['Dec', 'Jan', 'Feb', 'Jun', 'Jul']},
            'LHR-ATL': {'distance_nm': 4200, 'frequency': 'daily', 'peak_season': ['Jun', 'Jul', 'Aug']},
            'LHR-DEL': {'distance_nm': 4180, 'frequency': 'daily', 'peak_season': ['Oct', 'Nov', 'Dec', 'Jan']},
            'LHR-BOM': {'distance_nm': 4480, 'frequency': '6x_weekly', 'peak_season': ['Oct', 'Nov', 'Dec', 'Jan']}
        }

    def generate_synthetic_flight_data(self, days: int = 30) -> pd.DataFrame:
        """
        Generate synthetic Virgin Atlantic flight data for training
        """
        np.random.seed(42)
        
        data = []
        start_date = datetime.now() - timedelta(days=days)
        
        for day in range(days):
            current_date = start_date + timedelta(days=day)
            
            # Generate flights for each route
            for route, route_info in self.va_routes.items():
                # Determine number of flights based on frequency
                if route_info['frequency'] == 'daily':
                    num_flights = np.random.choice([1, 2], p=[0.7, 0.3])
                else:  # 6x_weekly
                    num_flights = 1 if np.random.random() > 0.14 else 0
                
                for _ in range(num_flights):
                    # Random aircraft assignment
                    aircraft_type = np.random.choice(list(self.va_fleet.keys()))
                    aircraft_data = self.va_fleet[aircraft_type]
                    
                    # Flight timing
                    departure_hour = np.random.normal(14, 4)  # Peak departure times
                    departure_hour = max(6, min(23, departure_hour))
                    
                    flight_data = {
                        'date': current_date.strftime('%Y-%m-%d'),
                        'route': route,
                        'aircraft_type': aircraft_type,
                        'departure_hour': int(departure_hour),
                        'distance_nm': route_info['distance_nm'],
                        'aircraft_capacity': aircraft_data['capacity'],
                        'aircraft_age_years': np.random.uniform(2, 15),
                        'cycles_since_maintenance': np.random.randint(0, aircraft_data['maintenance_interval']),
                        
                        # Weather factors
                        'origin_weather_score': np.random.uniform(0.2, 1.0),  # 1.0 = perfect weather
                        'dest_weather_score': np.random.uniform(0.2, 1.0),
                        'enroute_weather_score': np.random.uniform(0.3, 1.0),
                        
                        # Operational factors
                        'passenger_load_factor': np.random.uniform(0.4, 0.95),
                        'cargo_weight_kg': np.random.uniform(5000, 15000),
                        'fuel_uplift_kg': np.random.uniform(80000, 150000),
                        'crew_experience_hours': np.random.uniform(2000, 15000),
                        'ground_handling_delay_min': np.random.exponential(5),
                        'atc_delay_min': np.random.exponential(8),
                        
                        # Airport congestion
                        'origin_congestion_level': np.random.uniform(0.1, 0.9),
                        'dest_congestion_level': np.random.uniform(0.1, 0.9),
                        
                        # Seasonal factors
                        'is_peak_season': current_date.strftime('%b') in route_info['peak_season'],
                        'is_weekend': current_date.weekday() >= 5,
                        'is_holiday_period': current_date.month in [12, 1, 7, 8],
                        
                        # Technical factors
                        'maintenance_due_days': np.random.randint(-30, 60),
                        'recent_technical_issues': np.random.choice([0, 1, 2, 3], p=[0.7, 0.2, 0.08, 0.02]),
                        
                        # External factors
                        'notam_count': np.random.poisson(2),
                        'security_level': np.random.choice(['normal', 'elevated', 'high'], p=[0.8, 0.15, 0.05])
                    }
                    
                    # Calculate risk factors and outcomes
                    risk_score = self._calculate_risk_score(flight_data)
                    flight_data['calculated_risk_score'] = risk_score
                    
                    # Generate outcomes based on risk
                    delay_prob = min(0.8, risk_score * 1.2)
                    cancellation_prob = max(0.01, (risk_score - 0.5) * 0.3)
                    
                    flight_data['delay_minutes'] = 0
                    flight_data['cancelled'] = False
                    flight_data['diverted'] = False
                    flight_data['technical_issue'] = False
                    
                    if np.random.random() < delay_prob:
                        flight_data['delay_minutes'] = np.random.exponential(30)
                    
                    if np.random.random() < cancellation_prob:
                        flight_data['cancelled'] = True
                        flight_data['delay_minutes'] = 0
                    
                    if np.random.random() < (risk_score * 0.1):
                        flight_data['diverted'] = True
                    
                    if np.random.random() < (risk_score * 0.15):
                        flight_data['technical_issue'] = True
                    
                    # Overall issue flag
                    flight_data['has_issue'] = (
                        flight_data['delay_minutes'] > 15 or 
                        flight_data['cancelled'] or 
                        flight_data['diverted'] or 
                        flight_data['technical_issue']
                    )
                    
                    data.append(flight_data)
        
        return pd.DataFrame(data)

    def _calculate_risk_score(self, flight_data: Dict) -> float:
        """Calculate risk score based on various factors"""
        risk = 0.0
        
        # Weather risk
        weather_risk = 1 - min(flight_data['origin_weather_score'], 
                              flight_data['dest_weather_score'],
                              flight_data['enroute_weather_score'])
        risk += weather_risk * 0.3
        
        # Aircraft age and maintenance
        age_risk = min(1.0, flight_data['aircraft_age_years'] / 20)
        maintenance_risk = flight_data['cycles_since_maintenance'] / 600
        risk += (age_risk + maintenance_risk) * 0.2
        
        # Congestion and delays
        congestion_risk = (flight_data['origin_congestion_level'] + 
                          flight_data['dest_congestion_level']) / 2
        delay_risk = (flight_data['ground_handling_delay_min'] + 
                     flight_data['atc_delay_min']) / 60
        risk += (congestion_risk + min(1.0, delay_risk)) * 0.2
        
        # Seasonal and operational factors
        if flight_data['is_peak_season']:
            risk += 0.1
        if flight_data['passenger_load_factor'] > 0.9:
            risk += 0.1
        
        # Technical factors
        if flight_data['recent_technical_issues'] > 0:
            risk += flight_data['recent_technical_issues'] * 0.05
        
        # External factors
        if flight_data['security_level'] == 'high':
            risk += 0.15
        elif flight_data['security_level'] == 'elevated':
            risk += 0.08
            
        risk += min(0.1, flight_data['notam_count'] * 0.02)
        
        return min(1.0, risk)

    def prepare_features(self, df: pd.DataFrame, include_targets: bool = True) -> pd.DataFrame:
        """Prepare features for ML models"""
        # Create feature matrix
        features = df.copy()
        
        # Encode categorical variables
        if 'security_level' not in self.encoders:
            self.encoders['security_level'] = LabelEncoder()
            features['security_level_encoded'] = self.encoders['security_level'].fit_transform(features['security_level'])
        else:
            features['security_level_encoded'] = self.encoders['security_level'].transform(features['security_level'])
        
        if 'aircraft_type' not in self.encoders:
            self.encoders['aircraft_type'] = LabelEncoder()
            features['aircraft_type_encoded'] = self.encoders['aircraft_type'].fit_transform(features['aircraft_type'])
        else:
            features['aircraft_type_encoded'] = self.encoders['aircraft_type'].transform(features['aircraft_type'])
        
        if 'route' not in self.encoders:
            self.encoders['route'] = LabelEncoder()
            features['route_encoded'] = self.encoders['route'].fit_transform(features['route'])
        else:
            features['route_encoded'] = self.encoders['route'].transform(features['route'])
        
        # Create time-based features
        features['date'] = pd.to_datetime(features['date'])
        features['day_of_week'] = features['date'].dt.dayofweek
        features['month'] = features['date'].dt.month
        features['day_of_year'] = features['date'].dt.dayofyear
        
        # Boolean to int
        bool_cols = ['is_peak_season', 'is_weekend', 'is_holiday_period']
        for col in bool_cols:
            features[col] = features[col].astype(int)
        
        # Select numerical features for ML
        self.feature_columns = [
            'departure_hour', 'distance_nm', 'aircraft_capacity', 'aircraft_age_years',
            'cycles_since_maintenance', 'origin_weather_score', 'dest_weather_score',
            'enroute_weather_score', 'passenger_load_factor', 'cargo_weight_kg',
            'fuel_uplift_kg', 'crew_experience_hours', 'ground_handling_delay_min',
            'atc_delay_min', 'origin_congestion_level', 'dest_congestion_level',
            'maintenance_due_days', 'recent_technical_issues', 'notam_count',
            'security_level_encoded', 'aircraft_type_encoded', 'route_encoded',
            'day_of_week', 'month', 'day_of_year', 'is_peak_season',
            'is_weekend', 'is_holiday_period'
        ]
        
        # Return features with or without target columns based on use case
        if include_targets and all(col in features.columns for col in ['has_issue', 'delay_minutes', 'cancelled', 'diverted', 'technical_issue']):
            return features[self.feature_columns + ['has_issue', 'delay_minutes', 'cancelled', 'diverted', 'technical_issue']]
        else:
            return features[self.feature_columns]

    def train_models(self, df: pd.DataFrame):
        """Train ML models for different types of issues"""
        logger.info("Training ML models...")
        
        # Prepare features
        features_df = self.prepare_features(df)
        X = features_df[self.feature_columns]
        
        # Scale features
        self.scalers['main'] = StandardScaler()
        X_scaled = self.scalers['main'].fit_transform(X)
        
        # Train binary classification model for general issues
        y_issue = features_df['has_issue']
        X_train, X_test, y_train, y_test = train_test_split(X_scaled, y_issue, test_size=0.2, random_state=42)
        
        self.models['issue_classifier'] = RandomForestClassifier(n_estimators=100, random_state=42)
        self.models['issue_classifier'].fit(X_train, y_train)
        
        # Evaluate
        y_pred = self.models['issue_classifier'].predict(X_test)
        logger.info("Issue Classification Report:")
        logger.info(classification_report(y_test, y_pred))
        
        # Train specific issue models
        for issue_type in ['cancelled', 'diverted', 'technical_issue']:
            y_specific = features_df[issue_type]
            if y_specific.sum() > 10:  # Only train if we have enough positive examples
                self.models[f'{issue_type}_classifier'] = RandomForestClassifier(n_estimators=100, random_state=42)
                self.models[f'{issue_type}_classifier'].fit(X_scaled, y_specific)
        
        # Train anomaly detection model
        self.models['anomaly_detector'] = IsolationForest(contamination=0.1, random_state=42)
        self.models['anomaly_detector'].fit(X_scaled)
        
        # Train delay prediction model (regression)
        delay_data = features_df[features_df['delay_minutes'] > 0]
        if len(delay_data) > 20:
            X_delay = self.scalers['main'].transform(delay_data[self.feature_columns])
            y_delay = delay_data['delay_minutes']
            
            self.models['delay_predictor'] = RandomForestClassifier(n_estimators=100, random_state=42)
            # Convert to classification bins
            delay_bins = pd.cut(y_delay, bins=[0, 15, 60, 180, float('inf')], 
                              labels=['minor', 'moderate', 'major', 'severe'])
            self.models['delay_predictor'].fit(X_delay, delay_bins)
        
        logger.info("Model training completed!")

    def predict_flight_issues(self, flight_data: Dict) -> Dict:
        """Predict potential issues for a single flight"""
        # Convert to DataFrame
        df = pd.DataFrame([flight_data])
        features_df = self.prepare_features(df, include_targets=False)
        X = features_df.values
        X_scaled = self.scalers['main'].transform(X)
        
        predictions = {
            'flight_id': flight_data.get('flight_id', 'unknown'),
            'route': flight_data.get('route', 'unknown'),
            'date': flight_data.get('date', 'unknown'),
            'risk_assessment': {}
        }
        
        # General issue prediction
        if 'issue_classifier' in self.models:
            issue_prob = self.models['issue_classifier'].predict_proba(X_scaled)[0][1]
            predictions['risk_assessment']['general_issue_probability'] = float(issue_prob)
            predictions['risk_assessment']['risk_level'] = self._get_risk_level(issue_prob)
        
        # Specific issue predictions
        for issue_type in ['cancelled', 'diverted', 'technical_issue']:
            if f'{issue_type}_classifier' in self.models:
                prob = self.models[f'{issue_type}_classifier'].predict_proba(X_scaled)[0][1]
                predictions['risk_assessment'][f'{issue_type}_probability'] = float(prob)
        
        # Anomaly detection
        if 'anomaly_detector' in self.models:
            anomaly_score = self.models['anomaly_detector'].decision_function(X_scaled)[0]
            is_anomaly = self.models['anomaly_detector'].predict(X_scaled)[0] == -1
            predictions['risk_assessment']['anomaly_score'] = float(anomaly_score)
            predictions['risk_assessment']['is_anomaly'] = bool(is_anomaly)
        
        # Delay prediction
        if 'delay_predictor' in self.models:
            delay_category = self.models['delay_predictor'].predict(X_scaled)[0]
            predictions['risk_assessment']['predicted_delay_category'] = str(delay_category)
        
        # Generate recommendations
        predictions['recommendations'] = self._generate_recommendations(predictions['risk_assessment'], flight_data)
        
        return predictions

    def _get_risk_level(self, probability: float) -> str:
        """Convert probability to risk level"""
        if probability >= 0.7:
            return 'HIGH'
        elif probability >= 0.4:
            return 'MEDIUM'
        else:
            return 'LOW'

    def _generate_recommendations(self, risk_assessment: Dict, flight_data: Dict) -> List[str]:
        """Generate actionable recommendations based on risk assessment"""
        recommendations = []
        
        general_prob = risk_assessment.get('general_issue_probability', 0)
        
        if general_prob > 0.7:
            recommendations.append("HIGH RISK: Consider pre-positioning backup aircraft")
            recommendations.append("Alert ground operations teams for potential delays")
            recommendations.append("Review passenger rebooking options")
        
        if risk_assessment.get('technical_issue_probability', 0) > 0.5:
            recommendations.append("Conduct additional pre-flight technical checks")
            recommendations.append("Ensure maintenance crew availability at destination")
        
        if risk_assessment.get('cancelled_probability', 0) > 0.3:
            recommendations.append("Prepare passenger communication for potential cancellation")
            recommendations.append("Review crew duty time limitations")
        
        if risk_assessment.get('diverted_probability', 0) > 0.2:
            recommendations.append("Brief crew on alternate airports and procedures")
            recommendations.append("Ensure fuel uplift accounts for potential diversions")
        
        if risk_assessment.get('is_anomaly', False):
            recommendations.append("ANOMALY DETECTED: Manual review recommended")
            recommendations.append("Check for unusual operational parameters")
        
        # Weather-specific recommendations
        if flight_data.get('origin_weather_score', 1) < 0.5:
            recommendations.append("Monitor origin weather conditions closely")
        
        if flight_data.get('dest_weather_score', 1) < 0.5:
            recommendations.append("Monitor destination weather and alternate airports")
        
        return recommendations

    def batch_analyze_flights(self, flights_data: List[Dict]) -> Dict:
        """Analyze multiple flights and provide summary insights"""
        results = []
        
        for flight in flights_data:
            result = self.predict_flight_issues(flight)
            results.append(result)
        
        # Summary statistics
        high_risk_count = sum(1 for r in results if r['risk_assessment'].get('risk_level') == 'HIGH')
        medium_risk_count = sum(1 for r in results if r['risk_assessment'].get('risk_level') == 'MEDIUM')
        anomaly_count = sum(1 for r in results if r['risk_assessment'].get('is_anomaly', False))
        
        summary = {
            'total_flights': len(results),
            'high_risk_flights': high_risk_count,
            'medium_risk_flights': medium_risk_count,
            'anomaly_flights': anomaly_count,
            'risk_distribution': {
                'HIGH': high_risk_count,
                'MEDIUM': medium_risk_count,
                'LOW': len(results) - high_risk_count - medium_risk_count
            },
            'detailed_results': results
        }
        
        return summary

    def save_models(self, filepath: str = 'va_flight_models.pkl'):
        """Save trained models"""
        model_data = {
            'models': self.models,
            'scalers': self.scalers,
            'encoders': self.encoders,
            'feature_columns': self.feature_columns
        }
        joblib.dump(model_data, filepath)
        logger.info(f"Models saved to {filepath}")

    def load_models(self, filepath: str = 'va_flight_models.pkl'):
        """Load trained models"""
        try:
            model_data = joblib.load(filepath)
            self.models = model_data['models']
            self.scalers = model_data['scalers']
            self.encoders = model_data['encoders']
            self.feature_columns = model_data['feature_columns']
            logger.info(f"Models loaded from {filepath}")
            return True
        except Exception as e:
            logger.warning(f"Could not load models: {e}")
            return False

def main():
    """Demonstrate the Virgin Atlantic flight analysis system"""
    analyzer = VirginAtlanticFlightAnalyzer()
    
    print("=== Virgin Atlantic Flight Issue Detection System ===\n")
    
    # Try to load existing models first
    if not analyzer.load_models():
        # Generate training data and train models
        print("1. Generating synthetic training data...")
        training_data = analyzer.generate_synthetic_flight_data(days=90)
        print(f"Generated {len(training_data)} flight records")
        
        # Train models
        print("\n2. Training ML models...")
        analyzer.train_models(training_data)
        
        # Save models
        analyzer.save_models()
    else:
        print("Models loaded successfully from saved file.")
    
    # Example flight analysis
    print("\n3. Analyzing example Virgin Atlantic flights...")
    
    example_flights = [
        {
            'flight_id': 'VS1',
            'date': '2025-06-22',
            'route': 'LHR-JFK',
            'aircraft_type': 'A350-1000',
            'departure_hour': 14,
            'distance_nm': 3459,
            'aircraft_capacity': 335,
            'aircraft_age_years': 8.5,
            'cycles_since_maintenance': 450,
            'origin_weather_score': 0.3,  # Poor weather
            'dest_weather_score': 0.8,
            'enroute_weather_score': 0.6,
            'passenger_load_factor': 0.92,
            'cargo_weight_kg': 12000,
            'fuel_uplift_kg': 120000,
            'crew_experience_hours': 8500,
            'ground_handling_delay_min': 25,  # High delay
            'atc_delay_min': 15,
            'origin_congestion_level': 0.8,
            'dest_congestion_level': 0.6,
            'maintenance_due_days': 15,
            'recent_technical_issues': 1,
            'notam_count': 4,
            'security_level': 'elevated',
            'is_peak_season': True,
            'is_weekend': False,
            'is_holiday_period': False
        },
        {
            'flight_id': 'VS15',
            'date': '2025-06-22',
            'route': 'LHR-LAX',
            'aircraft_type': 'B787-9',
            'departure_hour': 11,
            'distance_nm': 5440,
            'aircraft_capacity': 258,
            'aircraft_age_years': 3.2,
            'cycles_since_maintenance': 150,
            'origin_weather_score': 0.9,  # Good weather
            'dest_weather_score': 0.95,
            'enroute_weather_score': 0.85,
            'passenger_load_factor': 0.78,
            'cargo_weight_kg': 8500,
            'fuel_uplift_kg': 135000,
            'crew_experience_hours': 12000,
            'ground_handling_delay_min': 5,
            'atc_delay_min': 8,
            'origin_congestion_level': 0.4,
            'dest_congestion_level': 0.3,
            'maintenance_due_days': 45,
            'recent_technical_issues': 0,
            'notam_count': 1,
            'security_level': 'normal',
            'is_peak_season': True,
            'is_weekend': True,
            'is_holiday_period': False
        }
    ]
    
    # Analyze flights
    results = analyzer.batch_analyze_flights(example_flights)
    
    print(f"\nAnalysis Results:")
    print(f"Total flights analyzed: {results['total_flights']}")
    print(f"High risk flights: {results['high_risk_flights']}")
    print(f"Medium risk flights: {results['medium_risk_flights']}")
    print(f"Anomaly flights: {results['anomaly_flights']}")
    
    # Detailed results
    print("\n4. Detailed Flight Analysis:")
    print("-" * 60)
    
    for result in results['detailed_results']:
        print(f"\nFlight: {result['flight_id']} ({result['route']})")
        print(f"Risk Level: {result['risk_assessment'].get('risk_level', 'N/A')}")
        print(f"Issue Probability: {result['risk_assessment'].get('general_issue_probability', 0):.3f}")
        
        if result['risk_assessment'].get('is_anomaly'):
            print("⚠️  ANOMALY DETECTED")
        
        print("Specific Risk Factors:")
        for key, value in result['risk_assessment'].items():
            if key.endswith('_probability') and key != 'general_issue_probability':
                print(f"  - {key.replace('_probability', '').title()}: {value:.3f}")
        
        print("Recommendations:")
        for rec in result['recommendations']:
            print(f"  • {rec}")
    
    # Generate operational dashboard data
    dashboard_data = {
        'timestamp': datetime.now().isoformat(),
        'fleet_status': analyzer.va_fleet,
        'route_analysis': results,
        'risk_summary': results['risk_distribution'],
        'operational_alerts': [
            rec for result in results['detailed_results'] 
            for rec in result['recommendations'] 
            if 'HIGH RISK' in rec or 'ANOMALY' in rec
        ]
    }
    
    # Save dashboard data
    with open('va_ops_dashboard.json', 'w') as f:
        json.dump(dashboard_data, f, indent=2)
    
    print("\nOperational dashboard data saved to 'va_ops_dashboard.json'")
    print("\n=== Analysis Complete ===")

if __name__ == "__main__":
    main()
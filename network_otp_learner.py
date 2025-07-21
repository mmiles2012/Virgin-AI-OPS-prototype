#!/usr/bin/env python3
"""
Network OTP Learning System for AINO Aviation Intelligence Platform
Machine learning system that analyzes hub performance patterns and learns
operational insights from Virgin Atlantic network data
"""

import os
import json
import pandas as pd
import numpy as np
from datetime import datetime, timedelta
from sklearn.ensemble import RandomForestRegressor, GradientBoostingClassifier
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import StandardScaler
from sklearn.metrics import mean_absolute_error, accuracy_score, classification_report
import joblib
import logging

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class NetworkOTPLearner:
    """
    Machine learning system that learns from Virgin Atlantic network performance
    to predict hub delays, identify patterns, and optimize operations
    """
    
    def __init__(self):
        self.models = {}
        self.scalers = {}
        self.hub_performance_history = []
        self.route_patterns = {}
        self.seasonal_patterns = {}
        
        # Initialize directories
        self.log_dir = "logs/network_otp"
        self.models_dir = "models/network_otp"
        self.hub_log_csv = f"{self.log_dir}/hub_performance_log.csv"
        self.route_log_csv = f"{self.log_dir}/route_performance_log.csv"
        
        # Create directories
        os.makedirs(self.log_dir, exist_ok=True)
        os.makedirs(self.models_dir, exist_ok=True)
        
        # Virgin Atlantic hub configurations
        self.hub_configs = {
            'LHR': {'timezone': 'Europe/London', 'capacity': 480, 'peak_hours': [7, 8, 18, 19]},
            'MAN': {'timezone': 'Europe/London', 'capacity': 180, 'peak_hours': [7, 8, 17, 18]},
            'JFK': {'timezone': 'America/New_York', 'capacity': 240, 'peak_hours': [6, 7, 17, 18]},
            'LAX': {'timezone': 'America/Los_Angeles', 'capacity': 120, 'peak_hours': [6, 7, 18, 19]},
            'ATL': {'timezone': 'America/New_York', 'capacity': 80, 'peak_hours': [7, 8, 17, 18]},
            'BOS': {'timezone': 'America/New_York', 'capacity': 60, 'peak_hours': [7, 8, 17, 18]},
            'MCO': {'timezone': 'America/New_York', 'capacity': 60, 'peak_hours': [8, 9, 17, 18]},
            'DEL': {'timezone': 'Asia/Kolkata', 'capacity': 80, 'peak_hours': [9, 10, 21, 22]},
            'BOM': {'timezone': 'Asia/Kolkata', 'capacity': 60, 'peak_hours': [9, 10, 21, 22]},
            'RUH': {'timezone': 'Asia/Riyadh', 'capacity': 40, 'peak_hours': [10, 11, 22, 23]}
        }
        
        # Load existing models and history
        self.load_models()
        self.load_performance_history()
    
    def log_hub_performance(self, hub_data):
        """Log real-time hub performance data for learning"""
        timestamp = datetime.now()
        
        for hub in hub_data:
            performance_record = {
                'timestamp': timestamp,
                'hub': hub['icao'],
                'total_flights': hub['totalFlights'],
                'on_time_flights': hub['onTimeFlights'],
                'delayed_flights': hub['delayedFlights'],
                'cancelled_flights': hub.get('cancelledFlights', 0),
                'on_time_rate': hub['onTimeRate'],
                'avg_delay_minutes': hub.get('avgDelayMinutes', 0),
                'weather_impact': hub.get('weatherImpact', 0),
                'hour_of_day': timestamp.hour,
                'day_of_week': timestamp.weekday(),
                'month': timestamp.month,
                'season': self.get_season(timestamp.month)
            }
            
            self.hub_performance_history.append(performance_record)
            
            # Save to CSV for persistence
            self.save_to_csv(performance_record, self.hub_log_csv)
    
    def log_route_performance(self, route_data):
        """Log route-specific performance patterns"""
        timestamp = datetime.now()
        
        for route in route_data:
            route_record = {
                'timestamp': timestamp,
                'origin': route['origin'],
                'destination': route['destination'],
                'flight_count': route['flightCount'],
                'on_time_rate': route['onTimeRate'],
                'avg_delay': route['avgDelay'],
                'distance_nm': route.get('distanceNm', 0),
                'route_type': self.classify_route_type(route['origin'], route['destination']),
                'hour_of_day': timestamp.hour,
                'day_of_week': timestamp.weekday(),
                'season': self.get_season(timestamp.month)
            }
            
            # Save to CSV
            self.save_to_csv(route_record, self.route_log_csv)
    
    def learn_hub_patterns(self):
        """Train models to learn hub performance patterns"""
        if len(self.hub_performance_history) < 50:
            logger.info("Insufficient hub data for pattern learning (need 50+ records)")
            return
        
        df = pd.DataFrame(self.hub_performance_history)
        
        # Prepare features for hub delay prediction
        features = [
            'total_flights', 'hour_of_day', 'day_of_week', 'month', 
            'weather_impact', 'season'
        ]
        
        # Encode categorical variables
        df['hub_encoded'] = df['hub'].astype('category').cat.codes
        df['season_encoded'] = df['season'].astype('category').cat.codes
        features.extend(['hub_encoded', 'season_encoded'])
        
        X = df[features].fillna(0)
        y_delay = df['avg_delay_minutes']
        y_ontime = (df['on_time_rate'] >= 85).astype(int)  # Binary: good performance
        
        # Train delay prediction model
        X_train, X_test, y_train, y_test = train_test_split(X, y_delay, test_size=0.2, random_state=42)
        
        delay_model = RandomForestRegressor(n_estimators=100, random_state=42)
        delay_model.fit(X_train, y_train)
        
        delay_predictions = delay_model.predict(X_test)
        delay_mae = mean_absolute_error(y_test, delay_predictions)
        
        # Train performance classification model
        X_train_cls, X_test_cls, y_train_cls, y_test_cls = train_test_split(X, y_ontime, test_size=0.2, random_state=42)
        
        performance_model = GradientBoostingClassifier(n_estimators=100, random_state=42)
        performance_model.fit(X_train_cls, y_train_cls)
        
        performance_predictions = performance_model.predict(X_test_cls)
        performance_accuracy = accuracy_score(y_test_cls, performance_predictions)
        
        # Save models
        self.models['hub_delay_predictor'] = delay_model
        self.models['hub_performance_classifier'] = performance_model
        
        joblib.dump(delay_model, f"{self.models_dir}/hub_delay_model.pkl")
        joblib.dump(performance_model, f"{self.models_dir}/hub_performance_model.pkl")
        
        logger.info(f"Hub patterns learned - Delay MAE: {delay_mae:.2f}min, Performance Accuracy: {performance_accuracy:.3f}")
        
        return {
            'delay_mae': delay_mae,
            'performance_accuracy': performance_accuracy,
            'feature_importance': dict(zip(features, delay_model.feature_importances_))
        }
    
    def predict_hub_performance(self, hub, hour_of_day, day_of_week, weather_impact=0):
        """Predict hub performance for given conditions"""
        if 'hub_delay_predictor' not in self.models:
            return {'predicted_delay': 15, 'performance_risk': 'MEDIUM', 'confidence': 0.5}
        
        # Prepare features
        current_month = datetime.now().month
        season = self.get_season(current_month)
        
        hub_config = self.hub_configs.get(hub, {'capacity': 100, 'peak_hours': [8, 18]})
        typical_flights = min(hub_config['capacity'] // 10, 20)  # Estimate based on capacity
        
        features = np.array([[
            typical_flights,  # total_flights
            hour_of_day,     # hour_of_day
            day_of_week,     # day_of_week
            current_month,   # month
            weather_impact,  # weather_impact
            ['winter', 'spring', 'summer', 'autumn'].index(season),  # season_encoded
            list(self.hub_configs.keys()).index(hub) if hub in self.hub_configs else 0  # hub_encoded
        ]])
        
        # Predict delay
        predicted_delay = self.models['hub_delay_predictor'].predict(features)[0]
        
        # Predict performance risk
        performance_prob = self.models['hub_performance_classifier'].predict_proba(features)[0][1]
        
        risk_level = 'LOW' if performance_prob > 0.8 else 'MEDIUM' if performance_prob > 0.6 else 'HIGH'
        
        return {
            'predicted_delay': max(0, predicted_delay),
            'performance_risk': risk_level,
            'confidence': performance_prob,
            'is_peak_hour': hour_of_day in hub_config['peak_hours']
        }
    
    def analyze_seasonal_patterns(self):
        """Analyze seasonal performance patterns"""
        if len(self.hub_performance_history) < 100:
            return {}
        
        df = pd.DataFrame(self.hub_performance_history)
        
        seasonal_analysis = {}
        for season in ['winter', 'spring', 'summer', 'autumn']:
            season_data = df[df['season'] == season]
            if len(season_data) > 0:
                seasonal_analysis[season] = {
                    'avg_on_time_rate': season_data['on_time_rate'].mean(),
                    'avg_delay': season_data['avg_delay_minutes'].mean(),
                    'best_performing_hubs': season_data.groupby('hub')['on_time_rate'].mean().nlargest(3).to_dict(),
                    'worst_performing_hubs': season_data.groupby('hub')['on_time_rate'].mean().nsmallest(3).to_dict()
                }
        
        self.seasonal_patterns = seasonal_analysis
        return seasonal_analysis
    
    def get_hub_insights(self, hub):
        """Get AI-generated insights for specific hub"""
        hub_history = [record for record in self.hub_performance_history if record['hub'] == hub]
        
        if len(hub_history) < 20:
            return {'insights': f'Insufficient data for {hub} analysis', 'recommendations': []}
        
        df = pd.DataFrame(hub_history)
        
        insights = {
            'performance_trend': 'improving' if df['on_time_rate'].tail(10).mean() > df['on_time_rate'].head(10).mean() else 'declining',
            'peak_delay_hours': df.groupby('hour_of_day')['avg_delay_minutes'].mean().nlargest(3).index.tolist(),
            'best_day_of_week': df.groupby('day_of_week')['on_time_rate'].mean().idxmax(),
            'weather_sensitivity': df['weather_impact'].corr(df['avg_delay_minutes']),
            'seasonal_best': df.groupby('season')['on_time_rate'].mean().idxmax()
        }
        
        recommendations = self.generate_recommendations(hub, insights)
        
        return {'insights': insights, 'recommendations': recommendations}
    
    def generate_recommendations(self, hub, insights):
        """Generate operational recommendations based on learned patterns"""
        recommendations = []
        
        if insights['performance_trend'] == 'declining':
            recommendations.append(f"⚠️ {hub} showing declining performance trend - investigate operational changes")
        
        if len(insights['peak_delay_hours']) > 0:
            hours_str = ', '.join([f"{h}:00" for h in insights['peak_delay_hours']])
            recommendations.append(f"🕐 Consider additional resources during peak delay hours: {hours_str}")
        
        if insights['weather_sensitivity'] > 0.5:
            recommendations.append(f"🌦️ {hub} highly weather-sensitive - enhance weather mitigation procedures")
        
        return recommendations
    
    def classify_route_type(self, origin, destination):
        """Classify route type for analysis"""
        transatlantic = ({'LHR', 'MAN'} & {origin, destination}) and ({'JFK', 'LAX', 'ATL', 'BOS', 'MCO'} & {origin, destination})
        if transatlantic:
            return 'transatlantic'
        
        transpacific = ({'LHR'} & {origin, destination}) and ({'DEL', 'BOM'} & {origin, destination})
        if transpacific:
            return 'india'
        
        middle_east = ({'LHR'} & {origin, destination}) and ({'RUH'} & {origin, destination})
        if middle_east:
            return 'middle_east'
        
        return 'domestic'
    
    def get_season(self, month):
        """Get season from month"""
        if month in [12, 1, 2]:
            return 'winter'
        elif month in [3, 4, 5]:
            return 'spring'
        elif month in [6, 7, 8]:
            return 'summer'
        else:
            return 'autumn'
    
    def save_to_csv(self, record, filepath):
        """Save record to CSV file"""
        df = pd.DataFrame([record])
        
        if os.path.exists(filepath):
            df.to_csv(filepath, mode='a', header=False, index=False)
        else:
            df.to_csv(filepath, index=False)
    
    def load_models(self):
        """Load existing trained models"""
        try:
            if os.path.exists(f"{self.models_dir}/hub_delay_model.pkl"):
                self.models['hub_delay_predictor'] = joblib.load(f"{self.models_dir}/hub_delay_model.pkl")
            if os.path.exists(f"{self.models_dir}/hub_performance_model.pkl"):
                self.models['hub_performance_classifier'] = joblib.load(f"{self.models_dir}/hub_performance_model.pkl")
            logger.info("Loaded existing Network OTP models")
        except Exception as e:
            logger.warning(f"Could not load existing models: {e}")
    
    def load_performance_history(self):
        """Load historical performance data"""
        try:
            if os.path.exists(self.hub_log_csv):
                df = pd.read_csv(self.hub_log_csv)
                self.hub_performance_history = df.to_dict('records')
                logger.info(f"Loaded {len(self.hub_performance_history)} hub performance records")
        except Exception as e:
            logger.warning(f"Could not load performance history: {e}")

def main():
    """Command line interface for Network OTP Learning"""
    import sys
    
    learner = NetworkOTPLearner()
    
    if len(sys.argv) < 2:
        print("Usage: python network_otp_learner.py [train|predict|analyze|insights]")
        return
    
    command = sys.argv[1]
    
    if command == 'train':
        print("Training Network OTP models...")
        results = learner.learn_hub_patterns()
        if results:
            print(f"Training complete - Delay MAE: {results['delay_mae']:.2f}min")
            print(f"Performance Accuracy: {results['performance_accuracy']:.3f}")
    
    elif command == 'predict':
        if len(sys.argv) < 5:
            print("Usage: python network_otp_learner.py predict HUB HOUR DAY_OF_WEEK [WEATHER_IMPACT]")
            return
        
        hub = sys.argv[2]
        hour = int(sys.argv[3])
        day_of_week = int(sys.argv[4])
        weather_impact = float(sys.argv[5]) if len(sys.argv) > 5 else 0
        
        prediction = learner.predict_hub_performance(hub, hour, day_of_week, weather_impact)
        print(f"Prediction for {hub}:")
        print(f"  Expected Delay: {prediction['predicted_delay']:.1f} minutes")
        print(f"  Performance Risk: {prediction['performance_risk']}")
        print(f"  Confidence: {prediction['confidence']:.2f}")
        print(f"  Peak Hour: {prediction['is_peak_hour']}")
    
    elif command == 'analyze':
        print("Analyzing seasonal patterns...")
        patterns = learner.analyze_seasonal_patterns()
        for season, data in patterns.items():
            print(f"\n{season.title()} Performance:")
            print(f"  Average OTP: {data['avg_on_time_rate']:.1f}%")
            print(f"  Average Delay: {data['avg_delay']:.1f}min")
    
    elif command == 'insights':
        if len(sys.argv) < 3:
            print("Usage: python network_otp_learner.py insights HUB")
            return
        
        hub = sys.argv[2]
        insights = learner.get_hub_insights(hub)
        
        print(f"Insights for {hub}:")
        for key, value in insights['insights'].items():
            print(f"  {key}: {value}")
        
        print("\nRecommendations:")
        for rec in insights['recommendations']:
            print(f"  {rec}")

if __name__ == "__main__":
    main()
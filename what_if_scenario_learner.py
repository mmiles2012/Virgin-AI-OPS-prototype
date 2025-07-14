"""
What-If Scenario Learning System for AINO Aviation Intelligence Platform
Machine learning system that learns from scenario outcomes to improve predictions
"""

import os
import json
import pandas as pd
import numpy as np
from datetime import datetime, timedelta
from sklearn.ensemble import RandomForestRegressor, GradientBoostingRegressor
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import StandardScaler
from sklearn.metrics import mean_absolute_error, r2_score
import joblib
import logging
import sys

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class WhatIfScenarioLearner:
    """
    Machine learning system that learns from What-If scenario outcomes
    to improve future predictions and recommendations
    """
    
    def __init__(self):
        self.models = {}
        self.scalers = {}
        self.feature_columns = []
        self.scenario_history = []
        self.learning_enabled = True
        
        # Initialize directories
        self.log_dir = "logs"
        self.archive_dir = "logs/archive"
        self.log_csv = "logs/scenario_learning_log.csv"
        
        # Create directories if they don't exist
        os.makedirs(self.log_dir, exist_ok=True)
        os.makedirs(self.archive_dir, exist_ok=True)
        
        # Initialize feature engineering parameters
        self.feature_columns = [
            'aircraft_type_encoded', 'failure_severity_encoded', 'weather_severity_encoded',
            'altitude_ft', 'position_nm', 'fuel_remaining_kg', 'passengers_count',
            'weather_wind_speed', 'weather_visibility', 'weather_temperature',
            'time_of_day', 'season', 'route_complexity', 'crew_experience',
            'maintenance_history', 'previous_issues', 'airport_capability'
        ]
        
        # Load existing models and history
        self.load_models()
        self.load_scenario_history()
    
    def encode_categorical_features(self, df):
        """Encode categorical features for ML processing"""
        # Aircraft type encoding
        aircraft_mapping = {
            'A350-1000': 4, 'A351': 4, 'A35K': 4,
            'B787-9': 3, 'B789': 3, 'B787': 3,
            'A330-900': 2, 'A339': 2,
            'A330-300': 1, 'A333': 1, 'A330': 1
        }
        df['aircraft_type_encoded'] = df['aircraft_type'].map(aircraft_mapping).fillna(2)
        
        # Failure severity encoding
        severity_mapping = {'LOW': 1, 'MEDIUM': 2, 'HIGH': 3, 'CRITICAL': 4}
        df['failure_severity_encoded'] = df['failure_severity'].map(severity_mapping).fillna(2)
        
        # Weather severity encoding
        weather_mapping = {'MODERATE': 1, 'SEVERE': 2, 'EXTREME': 3}
        df['weather_severity_encoded'] = df['weather_severity'].map(weather_mapping).fillna(1)
        
        return df
    
    def engineer_features(self, scenario_data):
        """Extract and engineer features from scenario data"""
        features = {}
        
        # Basic aircraft and scenario features
        features['aircraft_type'] = scenario_data.get('aircraft_type', 'A330-300')
        features['failure_severity'] = scenario_data.get('failure_severity', 'MEDIUM')
        features['weather_severity'] = scenario_data.get('weather_severity', 'MODERATE')
        
        # Flight parameters
        features['altitude_ft'] = scenario_data.get('altitude', 35000)
        features['position_nm'] = scenario_data.get('position_nm', 1200)
        features['fuel_remaining_kg'] = scenario_data.get('fuel_remaining', 50000)
        features['passengers_count'] = scenario_data.get('passengers', 300)
        
        # Weather parameters
        weather = scenario_data.get('weather', {})
        features['weather_wind_speed'] = weather.get('wind_speed', 15)
        features['weather_visibility'] = weather.get('visibility', 8)
        features['weather_temperature'] = weather.get('temperature', 10)
        
        # Time and operational factors
        now = datetime.now()
        features['time_of_day'] = now.hour
        features['season'] = (now.month % 12) // 3 + 1  # 1-4 for seasons
        features['route_complexity'] = scenario_data.get('route_complexity', 2)
        features['crew_experience'] = scenario_data.get('crew_experience', 8)
        
        # Historical factors
        features['maintenance_history'] = scenario_data.get('maintenance_score', 0.8)
        features['previous_issues'] = scenario_data.get('previous_issues', 0)
        features['airport_capability'] = scenario_data.get('airport_capability', 0.9)
        
        return features
    
    def learn_from_scenario(self, scenario_data, actual_outcome):
        """Learn from a completed scenario with actual outcomes"""
        try:
            # Extract features from scenario
            features = self.engineer_features(scenario_data)
            
            # Create learning record
            learning_record = {
                'timestamp': datetime.now().isoformat(),
                'scenario_id': scenario_data.get('id', 'unknown'),
                'features': features,
                'predicted_outcome': scenario_data.get('predicted_outcome', {}),
                'actual_outcome': actual_outcome,
                'accuracy_metrics': self.calculate_accuracy_metrics(
                    scenario_data.get('predicted_outcome', {}), 
                    actual_outcome
                )
            }
            
            # Add to history
            self.scenario_history.append(learning_record)
            
            # Save to CSV log for continuous learning
            self.save_to_csv_log(learning_record)
            
            # Retrain models if we have enough data
            if len(self.scenario_history) >= 10:
                self.retrain_models()
            
            # Save updated history
            self.save_scenario_history()
            
            logger.info(f"Learned from scenario {learning_record['scenario_id']}")
            return True
            
        except Exception as e:
            logger.error(f"Error learning from scenario: {e}")
            return False
    
    def calculate_accuracy_metrics(self, predicted, actual):
        """Calculate accuracy metrics between predicted and actual outcomes"""
        metrics = {}
        
        # Fuel burn accuracy
        if 'fuel_burn' in predicted and 'fuel_burn' in actual:
            pred_fuel = predicted['fuel_burn'].get('modified', 0)
            actual_fuel = actual.get('fuel_burn', 0)
            metrics['fuel_accuracy'] = 1 - abs(pred_fuel - actual_fuel) / max(pred_fuel, actual_fuel, 1)
        
        # Time accuracy
        if 'flight_time' in predicted and 'flight_time' in actual:
            pred_time = predicted['flight_time'].get('modified', 0)
            actual_time = actual.get('flight_time', 0)
            metrics['time_accuracy'] = 1 - abs(pred_time - actual_time) / max(pred_time, actual_time, 1)
        
        # Cost accuracy
        if 'cost' in predicted and 'cost' in actual:
            pred_cost = predicted['cost'].get('modified', 0)
            actual_cost = actual.get('cost', 0)
            metrics['cost_accuracy'] = 1 - abs(pred_cost - actual_cost) / max(pred_cost, actual_cost, 1)
        
        # Overall accuracy
        accuracies = [v for v in metrics.values() if v > 0]
        metrics['overall_accuracy'] = np.mean(accuracies) if accuracies else 0.5
        
        return metrics
    
    def retrain_models(self):
        """Retrain ML models with accumulated scenario history"""
        try:
            logger.info("Retraining What-If Scenario models...")
            
            # Prepare training data
            training_data = []
            for record in self.scenario_history:
                features = record['features']
                actual = record['actual_outcome']
                
                # Create training sample
                sample = features.copy()
                sample['actual_fuel_burn'] = actual.get('fuel_burn', 0)
                sample['actual_flight_time'] = actual.get('flight_time', 0)
                sample['actual_cost'] = actual.get('cost', 0)
                
                training_data.append(sample)
            
            if len(training_data) < 5:
                logger.warning("Insufficient data for retraining")
                return
            
            # Create DataFrame
            df = pd.DataFrame(training_data)
            df = self.encode_categorical_features(df)
            
            # Prepare features and targets
            X = df[self.feature_columns].fillna(0)
            
            # Train separate models for each prediction target
            targets = ['actual_fuel_burn', 'actual_flight_time', 'actual_cost']
            
            for target in targets:
                if target in df.columns:
                    y = df[target].fillna(0)
                    
                    # Skip if no variance in target
                    if y.std() == 0:
                        continue
                    
                    # Split data
                    X_train, X_test, y_train, y_test = train_test_split(
                        X, y, test_size=0.2, random_state=42
                    )
                    
                    # Scale features
                    scaler = StandardScaler()
                    X_train_scaled = scaler.fit_transform(X_train)
                    X_test_scaled = scaler.transform(X_test)
                    
                    # Train model
                    model = RandomForestRegressor(
                        n_estimators=100,
                        max_depth=10,
                        random_state=42,
                        n_jobs=-1
                    )
                    model.fit(X_train_scaled, y_train)
                    
                    # Evaluate model
                    y_pred = model.predict(X_test_scaled)
                    mae = mean_absolute_error(y_test, y_pred)
                    r2 = r2_score(y_test, y_pred)
                    
                    # Store model and scaler
                    self.models[target] = model
                    self.scalers[target] = scaler
                    
                    logger.info(f"Retrained {target} model - MAE: {mae:.2f}, R²: {r2:.3f}")
            
            # Save models
            self.save_models()
            
        except Exception as e:
            logger.error(f"Error retraining models: {e}")
    
    def enhance_scenario_prediction(self, scenario_data):
        """Enhance scenario prediction using learned models"""
        try:
            # Extract features
            features = self.engineer_features(scenario_data)
            
            # Create feature DataFrame
            feature_df = pd.DataFrame([features])
            feature_df = self.encode_categorical_features(feature_df)
            
            # Prepare features for prediction
            X = feature_df[self.feature_columns].fillna(0)
            
            # Enhanced predictions
            enhanced_predictions = {}
            
            # Make predictions with each trained model
            for target, model in self.models.items():
                if target in self.scalers:
                    scaler = self.scalers[target]
                    X_scaled = scaler.transform(X)
                    prediction = model.predict(X_scaled)[0]
                    
                    # Add to enhanced predictions
                    if target == 'actual_fuel_burn':
                        enhanced_predictions['fuel_burn_ml'] = prediction
                    elif target == 'actual_flight_time':
                        enhanced_predictions['flight_time_ml'] = prediction
                    elif target == 'actual_cost':
                        enhanced_predictions['cost_ml'] = prediction
            
            # Calculate confidence based on historical accuracy
            confidence = self.calculate_prediction_confidence()
            enhanced_predictions['confidence'] = confidence
            
            # Generate ML-enhanced recommendations
            enhanced_predictions['ml_recommendations'] = self.generate_ml_recommendations(
                scenario_data, enhanced_predictions
            )
            
            return enhanced_predictions
            
        except Exception as e:
            logger.error(f"Error enhancing scenario prediction: {e}")
            return {}
    
    def calculate_prediction_confidence(self):
        """Calculate confidence in predictions based on historical accuracy"""
        if not self.scenario_history:
            return 0.5  # Default confidence
        
        recent_history = self.scenario_history[-20:]  # Last 20 scenarios
        accuracies = [
            record['accuracy_metrics'].get('overall_accuracy', 0.5) 
            for record in recent_history
        ]
        
        return np.mean(accuracies) if accuracies else 0.5
    
    def generate_ml_recommendations(self, scenario_data, ml_predictions):
        """Generate ML-enhanced recommendations based on learned patterns"""
        recommendations = []
        
        # Fuel-based recommendations
        if 'fuel_burn_ml' in ml_predictions:
            predicted_fuel = ml_predictions['fuel_burn_ml']
            if predicted_fuel > 55000:  # High fuel consumption
                recommendations.append("ML model suggests higher fuel consumption - consider fuel stops")
            elif predicted_fuel < 45000:  # Lower fuel consumption
                recommendations.append("ML model indicates favorable fuel efficiency")
        
        # Time-based recommendations
        if 'flight_time_ml' in ml_predictions:
            predicted_time = ml_predictions['flight_time_ml']
            if predicted_time > 7.0:  # Long flight time
                recommendations.append("ML model predicts extended flight time - alert crew scheduling")
            elif predicted_time < 5.5:  # Short flight time
                recommendations.append("ML model suggests favorable timing conditions")
        
        # Cost-based recommendations
        if 'cost_ml' in ml_predictions:
            predicted_cost = ml_predictions['cost_ml']
            if predicted_cost > 60000:  # High cost
                recommendations.append("ML model indicates high operational cost - consider alternatives")
        
        # Confidence-based recommendations
        confidence = ml_predictions.get('confidence', 0.5)
        if confidence > 0.8:
            recommendations.append("High confidence in ML predictions - recommendations reliable")
        elif confidence < 0.5:
            recommendations.append("Lower confidence in ML predictions - use with caution")
        
        return recommendations
    
    def get_learning_statistics(self):
        """Get statistics about the learning system"""
        stats = {
            'total_scenarios_learned': len(self.scenario_history),
            'models_trained': len(self.models),
            'learning_enabled': self.learning_enabled,
            'last_learning_update': None,
            'average_accuracy': 0.0
        }
        
        if self.scenario_history:
            stats['last_learning_update'] = self.scenario_history[-1]['timestamp']
            
            # Calculate average accuracy
            accuracies = [
                record['accuracy_metrics'].get('overall_accuracy', 0.5)
                for record in self.scenario_history
            ]
            stats['average_accuracy'] = np.mean(accuracies) if accuracies else 0.0
        
        return stats
    
    def save_models(self):
        """Save trained models to disk"""
        try:
            os.makedirs('models', exist_ok=True)
            
            # Save each model
            for name, model in self.models.items():
                joblib.dump(model, f'models/whatif_{name}_model.pkl')
            
            # Save scalers
            for name, scaler in self.scalers.items():
                joblib.dump(scaler, f'models/whatif_{name}_scaler.pkl')
            
            logger.info("Saved What-If Scenario models")
            
        except Exception as e:
            logger.error(f"Error saving models: {e}")
    
    def load_models(self):
        """Load trained models from disk"""
        try:
            model_files = {
                'actual_fuel_burn': 'models/whatif_actual_fuel_burn_model.pkl',
                'actual_flight_time': 'models/whatif_actual_flight_time_model.pkl',
                'actual_cost': 'models/whatif_actual_cost_model.pkl'
            }
            
            for name, filepath in model_files.items():
                if os.path.exists(filepath):
                    self.models[name] = joblib.load(filepath)
                    
                    # Load corresponding scaler
                    scaler_path = f'models/whatif_{name}_scaler.pkl'
                    if os.path.exists(scaler_path):
                        self.scalers[name] = joblib.load(scaler_path)
            
            if self.models:
                logger.info(f"Loaded {len(self.models)} What-If Scenario models")
            
        except Exception as e:
            logger.error(f"Error loading models: {e}")
    
    def save_scenario_history(self):
        """Save scenario history to disk"""
        try:
            with open('scenario_learning_history.json', 'w') as f:
                json.dump(self.scenario_history, f, indent=2)
            
        except Exception as e:
            logger.error(f"Error saving scenario history: {e}")
    
    def load_scenario_history(self):
        """Load scenario history from disk"""
        try:
            if os.path.exists('scenario_learning_history.json'):
                with open('scenario_learning_history.json', 'r') as f:
                    self.scenario_history = json.load(f)
                
                logger.info(f"Loaded {len(self.scenario_history)} historical scenarios")
            
        except Exception as e:
            logger.error(f"Error loading scenario history: {e}")
    
    def save_to_csv_log(self, learning_record):
        """Save learning record to CSV log file for continuous learning"""
        try:
            # Convert learning record to CSV format
            csv_data = {
                'timestamp': learning_record['timestamp'],
                'scenario_id': learning_record['scenario_id'],
                'aircraft_type': learning_record['features'].get('aircraft_type', 'unknown'),
                'failure_severity': learning_record['features'].get('failure_severity', 'unknown'),
                'weather_severity': learning_record['features'].get('weather_severity', 'unknown'),
                'predicted_fuel_burn': learning_record['predicted_outcome'].get('fuel_burn', {}).get('modified', 0),
                'actual_fuel_burn': learning_record['actual_outcome'].get('fuel_burn', 0),
                'predicted_flight_time': learning_record['predicted_outcome'].get('flight_time', {}).get('modified', 0),
                'actual_flight_time': learning_record['actual_outcome'].get('flight_time', 0),
                'predicted_cost': learning_record['predicted_outcome'].get('cost', {}).get('modified', 0),
                'actual_cost': learning_record['actual_outcome'].get('cost', 0),
                'overall_accuracy': learning_record['accuracy_metrics'].get('overall_accuracy', 0)
            }
            
            # Create DataFrame
            df = pd.DataFrame([csv_data])
            
            # Append to CSV or create new file
            if os.path.exists(self.log_csv):
                df.to_csv(self.log_csv, mode='a', header=False, index=False)
            else:
                df.to_csv(self.log_csv, mode='w', header=True, index=False)
            
            logger.info(f"Saved learning record to CSV: {self.log_csv}")
            
        except Exception as e:
            logger.error(f"Error saving to CSV log: {e}")
    
    def archive_logs(self):
        """Archive existing learning logs"""
        try:
            if not os.path.exists(self.log_csv):
                logger.info("No log file found to archive.")
                return
            
            df = pd.read_csv(self.log_csv)
            if df.empty:
                logger.info("Log file is empty, nothing to archive.")
                return
            
            # Create archive filename with timestamp
            timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
            archive_file = os.path.join(self.archive_dir, f"scenario_learning_archive_{timestamp}.csv")
            
            # Save to archive
            df.to_csv(archive_file, index=False)
            logger.info(f"Archived {len(df)} learning records to {archive_file}")
            
            # Clear the main log file
            open(self.log_csv, 'w').close()
            
        except Exception as e:
            logger.error(f"Error archiving logs: {e}")
    
    def retrain_from_logs(self):
        """Retrain models from CSV logs"""
        try:
            if not os.path.exists(self.log_csv):
                logger.warning("No log file found for retraining.")
                return False
            
            df = pd.read_csv(self.log_csv)
            if df.empty:
                logger.warning("Log file is empty, cannot retrain.")
                return False
            
            logger.info(f"Retraining models from {len(df)} log entries...")
            
            # Convert CSV data back to scenario format for retraining
            for _, row in df.iterrows():
                features = {
                    'aircraft_type': row['aircraft_type'],
                    'failure_severity': row['failure_severity'],
                    'weather_severity': row['weather_severity'],
                    'altitude': 35000,  # Default values
                    'position_nm': 1200,
                    'fuel_remaining': 50000,
                    'passengers': 300,
                    'weather': {'wind_speed': 20, 'visibility': 5, 'temperature': 0},
                    'time_of_day': 12,
                    'season': 2,
                    'route_complexity': 2,
                    'crew_experience': 8,
                    'maintenance_history': 0.8,
                    'previous_issues': 0,
                    'airport_capability': 0.9
                }
                
                # Add to scenario history
                learning_record = {
                    'timestamp': row['timestamp'],
                    'scenario_id': row['scenario_id'],
                    'features': features,
                    'predicted_outcome': {
                        'fuel_burn': {'modified': row['predicted_fuel_burn']},
                        'flight_time': {'modified': row['predicted_flight_time']},
                        'cost': {'modified': row['predicted_cost']}
                    },
                    'actual_outcome': {
                        'fuel_burn': row['actual_fuel_burn'],
                        'flight_time': row['actual_flight_time'],
                        'cost': row['actual_cost']
                    },
                    'accuracy_metrics': {
                        'overall_accuracy': row['overall_accuracy']
                    }
                }
                
                self.scenario_history.append(learning_record)
            
            # Retrain models
            self.retrain_models()
            
            logger.info("Model retraining from logs completed successfully")
            return True
            
        except Exception as e:
            logger.error(f"Error retraining from logs: {e}")
            return False
    
    def self_learning_cycle(self):
        """Execute complete self-learning cycle"""
        try:
            logger.info("Starting self-learning cycle...")
            
            # Archive existing logs
            self.archive_logs()
            
            # Retrain models from logs
            success = self.retrain_from_logs()
            
            if success:
                # Save updated models
                self.save_models()
                
                # Save updated scenario history
                self.save_scenario_history()
                
                logger.info("Self-learning cycle completed successfully")
                return {
                    'success': True,
                    'message': 'Self-learning cycle completed',
                    'models_updated': len(self.models),
                    'scenarios_processed': len(self.scenario_history),
                    'timestamp': datetime.now().isoformat()
                }
            else:
                logger.warning("Self-learning cycle completed with warnings")
                return {
                    'success': False,
                    'message': 'Self-learning cycle completed with warnings',
                    'warning': 'No data available for retraining',
                    'timestamp': datetime.now().isoformat()
                }
                
        except Exception as e:
            logger.error(f"Error in self-learning cycle: {e}")
            return {
                'success': False,
                'message': 'Self-learning cycle failed',
                'error': str(e),
                'timestamp': datetime.now().isoformat()
            }

# Global instance
scenario_learner = WhatIfScenarioLearner()

def main():
    """Main function supporting command-line operations"""
    print("=== What-If Scenario Learning System ===")
    
    # Check for command-line arguments
    if len(sys.argv) > 1:
        command = sys.argv[1]
        
        if command == 'learn':
            # Learn from scenario data provided via stdin
            try:
                input_data = sys.stdin.read()
                if input_data:
                    data = json.loads(input_data)
                    scenario_data = data.get('scenario', {})
                    actual_outcome = data.get('outcome', {})
                    
                    success = scenario_learner.learn_from_scenario(scenario_data, actual_outcome)
                    print(json.dumps({'success': success, 'message': 'Learning completed'}))
                else:
                    print(json.dumps({'success': False, 'error': 'No input data provided'}))
            except Exception as e:
                print(json.dumps({'success': False, 'error': str(e)}))
        
        elif command == 'enhance':
            # Enhance scenario prediction
            try:
                input_data = sys.stdin.read()
                if input_data:
                    scenario_data = json.loads(input_data)
                    enhanced = scenario_learner.enhance_scenario_prediction(scenario_data)
                    print(json.dumps(enhanced))
                else:
                    print(json.dumps({}))
            except Exception as e:
                print(json.dumps({'error': str(e)}))
        
        elif command == 'stats':
            # Get learning statistics
            try:
                stats = scenario_learner.get_learning_statistics()
                print(json.dumps(stats))
            except Exception as e:
                print(json.dumps({'error': str(e)}))
        
        elif command == 'self-learn':
            # Execute self-learning cycle
            try:
                result = scenario_learner.self_learning_cycle()
                print(json.dumps(result))
            except Exception as e:
                print(json.dumps({'success': False, 'error': str(e)}))
        
        else:
            print(json.dumps({'error': f'Unknown command: {command}'}))
    
    else:
        # Default demonstration mode
        # Example scenario data
        test_scenario = {
            'id': 'test_scenario_001',
            'aircraft_type': 'A350-1000',
            'failure_severity': 'HIGH',
            'weather_severity': 'SEVERE',
            'altitude': 35000,
            'position_nm': 1200,
            'fuel_remaining': 45000,
            'passengers': 331,
            'weather': {
                'wind_speed': 35,
                'visibility': 2,
                'temperature': -5
            },
            'predicted_outcome': {
                'fuel_burn': {'modified': 52000},
                'flight_time': {'modified': 6.8},
                'cost': {'modified': 58000}
            }
        }
        
        # Example actual outcome
        actual_outcome = {
            'fuel_burn': 53500,
            'flight_time': 7.1,
            'cost': 61000
        }
        
        # Learn from scenario
        scenario_learner.learn_from_scenario(test_scenario, actual_outcome)
        
        # Get enhanced predictions
        enhanced = scenario_learner.enhance_scenario_prediction(test_scenario)
        print("Enhanced predictions:", enhanced)
        
        # Get learning statistics
        stats = scenario_learner.get_learning_statistics()
        print("Learning statistics:", stats)
        
        # Execute self-learning cycle
        cycle_result = scenario_learner.self_learning_cycle()
        print("Self-learning cycle result:", cycle_result)

if __name__ == "__main__":
    main()
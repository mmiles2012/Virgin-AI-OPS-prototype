#!/usr/bin/env python3
"""
ML Model Training for Heathrow Connection Prediction
Trains Random Forest and Gradient Boosting models using FlightAware data
"""

import pandas as pd
import numpy as np
import pickle
import json
from datetime import datetime
from typing import Dict, List, Tuple, Optional
from sklearn.ensemble import RandomForestRegressor, GradientBoostingRegressor
from sklearn.model_selection import train_test_split, cross_val_score
from sklearn.metrics import mean_absolute_error, mean_squared_error, r2_score
from sklearn.preprocessing import StandardScaler
import joblib

from fetch_flightaware import FlightAwareHeathrowFetcher
from process_flight_data import FlightDataProcessor
from connection_features import ConnectionFeatureEngineer

class HeathrowConnectionModelTrainer:
    """Train ML models for Heathrow connection prediction"""
    
    def __init__(self):
        self.models = {}
        self.scalers = {}
        self.feature_names = []
        self.model_metadata = {}
        
    def train_connection_models(self, use_fresh_data: bool = True) -> Dict:
        """
        Complete training pipeline for connection prediction models
        """
        print("[Training] Starting Heathrow Connection Model Training Pipeline")
        print("=" * 60)
        
        # Step 1: Collect data
        if use_fresh_data:
            training_data = self._collect_training_data()
        else:
            training_data = self._load_existing_data()
        
        if training_data.empty:
            print("[Training] No training data available")
            return {"status": "failed", "reason": "no_data"}
        
        # Step 2: Process and engineer features
        processed_data = self._process_training_data(training_data)
        
        # Step 3: Train models
        training_results = self._train_models(processed_data)
        
        # Step 4: Evaluate models
        evaluation_results = self._evaluate_models(processed_data, training_results)
        
        # Step 5: Save models
        self._save_models()
        
        # Step 6: Generate report
        report = self._generate_training_report(training_results, evaluation_results)
        
        print(f"[Training] Training complete - {len(self.models)} models trained")
        return report
    
    def _collect_training_data(self) -> pd.DataFrame:
        """Collect training data from FlightAware and historical simulations"""
        
        print("[Training] Collecting training data...")
        
        # Initialize data fetcher
        fetcher = FlightAwareHeathrowFetcher()
        
        # Get current connection data
        current_data = fetcher.get_connection_data()
        
        # Process current data
        processor = FlightDataProcessor()
        current_df = processor.process_connection_data(current_data)
        
        # Generate historical data for training
        historical_df = processor.generate_historical_simulation(days=60)
        
        # Combine datasets
        if not current_df.empty and not historical_df.empty:
            combined_df = pd.concat([current_df, historical_df], ignore_index=True)
        elif not historical_df.empty:
            combined_df = historical_df
        elif not current_df.empty:
            combined_df = current_df
        else:
            return pd.DataFrame()
        
        # Add data source labels
        combined_df['data_source'] = 'mixed'
        if not current_df.empty:
            combined_df.loc[:len(current_df)-1, 'data_source'] = 'flightaware'
        if not historical_df.empty:
            combined_df.loc[len(current_df):, 'data_source'] = 'historical_simulation'
        
        print(f"[Training] Collected {len(combined_df)} training samples")
        print(f"[Training] Data sources: {combined_df['data_source'].value_counts().to_dict()}")
        
        return combined_df
    
    def _load_existing_data(self) -> pd.DataFrame:
        """Load existing training data from file"""
        try:
            df = pd.read_csv('heathrow_connection_historical_data.csv')
            print(f"[Training] Loaded {len(df)} existing training samples")
            return df
        except FileNotFoundError:
            print("[Training] No existing data found, generating new data...")
            return self._collect_training_data()
    
    def _process_training_data(self, df: pd.DataFrame) -> pd.DataFrame:
        """Process and engineer features for training"""
        
        print("[Training] Processing and engineering features...")
        
        # Initialize feature engineer
        engineer = ConnectionFeatureEngineer()
        
        # Create features
        processed_df = engineer.create_features(df)
        
        # Encode categorical features
        processed_df = engineer.encode_categorical_features(processed_df)
        
        # Scale numerical features
        processed_df = engineer.scale_numerical_features(processed_df)
        
        # Get final feature list
        self.feature_names = engineer.get_ml_features(processed_df)
        
        print(f"[Training] Processed {len(processed_df)} samples with {len(self.feature_names)} features")
        
        return processed_df
    
    def _train_models(self, df: pd.DataFrame) -> Dict:
        """Train multiple ML models for connection prediction"""
        
        print("[Training] Training ML models...")
        
        # Prepare features and targets
        X = df[self.feature_names].fillna(0)
        
        # Train for both regression (probability) and classification (success/failure)
        y_prob = df['success_probability'].fillna(0.5)
        y_class = df['connection_success'].fillna(False).astype(int)
        
        # Split data
        X_train, X_test, y_prob_train, y_prob_test = train_test_split(
            X, y_prob, test_size=0.2, random_state=42
        )
        _, _, y_class_train, y_class_test = train_test_split(
            X, y_class, test_size=0.2, random_state=42
        )
        
        # Store test data for evaluation
        self.test_data = {
            'X_test': X_test,
            'y_prob_test': y_prob_test,
            'y_class_test': y_class_test
        }
        
        training_results = {}
        
        # Model 1: Random Forest for Success Probability
        print("[Training] Training Random Forest for success probability...")
        rf_prob = RandomForestRegressor(
            n_estimators=100,
            max_depth=15,
            min_samples_split=5,
            min_samples_leaf=2,
            random_state=42,
            n_jobs=-1
        )
        rf_prob.fit(X_train, y_prob_train)
        self.models['rf_probability'] = rf_prob
        
        # Model 2: Gradient Boosting for Success Probability
        print("[Training] Training Gradient Boosting for success probability...")
        gb_prob = GradientBoostingRegressor(
            n_estimators=100,
            max_depth=6,
            learning_rate=0.1,
            min_samples_split=5,
            min_samples_leaf=2,
            random_state=42
        )
        gb_prob.fit(X_train, y_prob_train)
        self.models['gb_probability'] = gb_prob
        
        # Model 3: Random Forest for Binary Classification
        print("[Training] Training Random Forest for connection success classification...")
        from sklearn.ensemble import RandomForestClassifier
        rf_class = RandomForestClassifier(
            n_estimators=100,
            max_depth=15,
            min_samples_split=5,
            min_samples_leaf=2,
            random_state=42,
            n_jobs=-1
        )
        rf_class.fit(X_train, y_class_train)
        self.models['rf_classification'] = rf_class
        
        # Cross-validation scores
        print("[Training] Performing cross-validation...")
        cv_scores = {}
        
        # CV for Random Forest Probability
        cv_scores['rf_prob'] = cross_val_score(
            RandomForestRegressor(n_estimators=50, random_state=42),
            X_train, y_prob_train, cv=5, scoring='neg_mean_absolute_error'
        )
        
        # CV for Gradient Boosting Probability
        cv_scores['gb_prob'] = cross_val_score(
            GradientBoostingRegressor(n_estimators=50, random_state=42),
            X_train, y_prob_train, cv=5, scoring='neg_mean_absolute_error'
        )
        
        # CV for Random Forest Classification
        cv_scores['rf_class'] = cross_val_score(
            RandomForestClassifier(n_estimators=50, random_state=42),
            X_train, y_class_train, cv=5, scoring='accuracy'
        )
        
        training_results = {
            'models_trained': list(self.models.keys()),
            'training_samples': len(X_train),
            'test_samples': len(X_test),
            'features_used': len(self.feature_names),
            'cv_scores': cv_scores,
            'feature_names': self.feature_names
        }
        
        return training_results
    
    def _evaluate_models(self, df: pd.DataFrame, training_results: Dict) -> Dict:
        """Evaluate trained models"""
        
        print("[Training] Evaluating model performance...")
        
        X_test = self.test_data['X_test']
        y_prob_test = self.test_data['y_prob_test']
        y_class_test = self.test_data['y_class_test']
        
        evaluation_results = {}
        
        # Evaluate Random Forest Probability
        rf_prob_pred = self.models['rf_probability'].predict(X_test)
        evaluation_results['rf_probability'] = {
            'mae': mean_absolute_error(y_prob_test, rf_prob_pred),
            'mse': mean_squared_error(y_prob_test, rf_prob_pred),
            'rmse': np.sqrt(mean_squared_error(y_prob_test, rf_prob_pred)),
            'r2': r2_score(y_prob_test, rf_prob_pred),
            'feature_importance': dict(zip(
                self.feature_names,
                self.models['rf_probability'].feature_importances_
            ))
        }
        
        # Evaluate Gradient Boosting Probability
        gb_prob_pred = self.models['gb_probability'].predict(X_test)
        evaluation_results['gb_probability'] = {
            'mae': mean_absolute_error(y_prob_test, gb_prob_pred),
            'mse': mean_squared_error(y_prob_test, gb_prob_pred),
            'rmse': np.sqrt(mean_squared_error(y_prob_test, gb_prob_pred)),
            'r2': r2_score(y_prob_test, gb_prob_pred),
            'feature_importance': dict(zip(
                self.feature_names,
                self.models['gb_probability'].feature_importances_
            ))
        }
        
        # Evaluate Random Forest Classification
        from sklearn.metrics import accuracy_score, precision_score, recall_score, f1_score
        rf_class_pred = self.models['rf_classification'].predict(X_test)
        rf_class_prob = self.models['rf_classification'].predict_proba(X_test)[:, 1]
        
        evaluation_results['rf_classification'] = {
            'accuracy': accuracy_score(y_class_test, rf_class_pred),
            'precision': precision_score(y_class_test, rf_class_pred, average='weighted'),
            'recall': recall_score(y_class_test, rf_class_pred, average='weighted'),
            'f1': f1_score(y_class_test, rf_class_pred, average='weighted'),
            'feature_importance': dict(zip(
                self.feature_names,
                self.models['rf_classification'].feature_importances_
            ))
        }
        
        # Model comparison and selection
        best_probability_model = 'rf_probability'
        if evaluation_results['gb_probability']['mae'] < evaluation_results['rf_probability']['mae']:
            best_probability_model = 'gb_probability'
        
        evaluation_results['model_selection'] = {
            'best_probability_model': best_probability_model,
            'best_classification_model': 'rf_classification',
            'probability_mae': evaluation_results[best_probability_model]['mae'],
            'classification_accuracy': evaluation_results['rf_classification']['accuracy']
        }
        
        return evaluation_results
    
    def _save_models(self) -> None:
        """Save trained models and metadata"""
        
        print("[Training] Saving trained models...")
        
        # Save models
        for model_name, model in self.models.items():
            model_filename = f'heathrow_connection_{model_name}.pkl'
            joblib.dump(model, model_filename)
            print(f"[Training] Saved {model_name} to {model_filename}")
        
        # Save feature names
        with open('heathrow_connection_features.json', 'w') as f:
            json.dump(self.feature_names, f, indent=2)
        
        # Save model metadata
        metadata = {
            'models': list(self.models.keys()),
            'feature_count': len(self.feature_names),
            'feature_names': self.feature_names,
            'training_timestamp': datetime.now().isoformat(),
            'model_versions': {
                'rf_probability': 'v1.0',
                'gb_probability': 'v1.0',
                'rf_classification': 'v1.0'
            }
        }
        
        with open('heathrow_connection_metadata.json', 'w') as f:
            json.dump(metadata, f, indent=2)
    
    def _generate_training_report(self, training_results: Dict, evaluation_results: Dict) -> Dict:
        """Generate comprehensive training report"""
        
        report = {
            'training_summary': {
                'status': 'completed',
                'timestamp': datetime.now().isoformat(),
                'models_trained': training_results['models_trained'],
                'training_samples': training_results['training_samples'],
                'test_samples': training_results['test_samples'],
                'features_used': training_results['features_used']
            },
            'model_performance': {
                'random_forest_probability': {
                    'mae': evaluation_results['rf_probability']['mae'],
                    'rmse': evaluation_results['rf_probability']['rmse'],
                    'r2_score': evaluation_results['rf_probability']['r2']
                },
                'gradient_boosting_probability': {
                    'mae': evaluation_results['gb_probability']['mae'],
                    'rmse': evaluation_results['gb_probability']['rmse'],
                    'r2_score': evaluation_results['gb_probability']['r2']
                },
                'random_forest_classification': {
                    'accuracy': evaluation_results['rf_classification']['accuracy'],
                    'precision': evaluation_results['rf_classification']['precision'],
                    'recall': evaluation_results['rf_classification']['recall'],
                    'f1_score': evaluation_results['rf_classification']['f1']
                }
            },
            'model_selection': evaluation_results['model_selection'],
            'feature_importance': self._get_top_features(evaluation_results),
            'cross_validation': {
                'rf_prob_cv_mean': np.mean(training_results['cv_scores']['rf_prob']),
                'gb_prob_cv_mean': np.mean(training_results['cv_scores']['gb_prob']),
                'rf_class_cv_mean': np.mean(training_results['cv_scores']['rf_class'])
            },
            'recommendations': self._generate_recommendations(evaluation_results)
        }
        
        # Save report
        with open('heathrow_connection_training_report.json', 'w') as f:
            json.dump(report, f, indent=2)
        
        print(f"[Training] Training report saved")
        return report
    
    def _get_top_features(self, evaluation_results: Dict) -> Dict:
        """Get top important features from all models"""
        
        top_features = {}
        
        for model_name in ['rf_probability', 'gb_probability', 'rf_classification']:
            if model_name in evaluation_results:
                importance = evaluation_results[model_name]['feature_importance']
                sorted_features = sorted(importance.items(), key=lambda x: x[1], reverse=True)
                top_features[model_name] = sorted_features[:10]  # Top 10 features
        
        return top_features
    
    def _generate_recommendations(self, evaluation_results: Dict) -> List[str]:
        """Generate actionable recommendations based on model performance"""
        
        recommendations = []
        
        # Performance-based recommendations
        best_mae = evaluation_results['model_selection']['probability_mae']
        best_accuracy = evaluation_results['model_selection']['classification_accuracy']
        
        if best_mae < 0.1:
            recommendations.append("Excellent probability prediction accuracy - model ready for production")
        elif best_mae < 0.15:
            recommendations.append("Good probability prediction - consider additional feature engineering")
        else:
            recommendations.append("Moderate prediction accuracy - collect more training data")
        
        if best_accuracy > 0.85:
            recommendations.append("High classification accuracy - reliable for automated decisions")
        elif best_accuracy > 0.75:
            recommendations.append("Good classification accuracy - suitable with human oversight")
        else:
            recommendations.append("Moderate classification accuracy - requires manual validation")
        
        # Feature-based recommendations
        rf_importance = evaluation_results.get('rf_probability', {}).get('feature_importance', {})
        top_feature = max(rf_importance.items(), key=lambda x: x[1])[0] if rf_importance else 'connection_time_minutes'
        recommendations.append(f"Most important feature: {top_feature} - optimize data collection for this feature")
        
        # Operational recommendations
        recommendations.append("Deploy probability model for real-time connection risk assessment")
        recommendations.append("Use classification model for automated connection alerts")
        recommendations.append("Retrain models monthly with fresh FlightAware data")
        
        return recommendations
    
    def load_trained_models(self) -> bool:
        """Load previously trained models"""
        
        try:
            # Load models
            for model_name in ['rf_probability', 'gb_probability', 'rf_classification']:
                model_filename = f'heathrow_connection_{model_name}.pkl'
                self.models[model_name] = joblib.load(model_filename)
            
            # Load feature names
            with open('heathrow_connection_features.json', 'r') as f:
                self.feature_names = json.load(f)
            
            print(f"[Training] Loaded {len(self.models)} trained models")
            return True
            
        except FileNotFoundError as e:
            print(f"[Training] Could not load models: {e}")
            return False
    
    def predict_connection_success(self, connection_data: Dict) -> Dict:
        """Predict connection success for new data"""
        
        if not self.models:
            if not self.load_trained_models():
                return {"error": "No trained models available"}
        
        # Convert to DataFrame
        df = pd.DataFrame([connection_data])
        
        # Process features (basic processing)
        engineer = ConnectionFeatureEngineer()
        processed_df = engineer.create_features(df)
        
        # Extract features
        X = processed_df[self.feature_names].fillna(0)
        
        # Make predictions
        predictions = {}
        
        if 'rf_probability' in self.models:
            prob_pred = self.models['rf_probability'].predict(X)[0]
            predictions['success_probability'] = float(np.clip(prob_pred, 0, 1))
        
        if 'rf_classification' in self.models:
            class_pred = self.models['rf_classification'].predict(X)[0]
            class_prob = self.models['rf_classification'].predict_proba(X)[0]
            predictions['will_succeed'] = bool(class_pred)
            predictions['success_confidence'] = float(max(class_prob))
        
        predictions['risk_level'] = 'HIGH' if predictions.get('success_probability', 0.5) < 0.6 else 'MEDIUM' if predictions.get('success_probability', 0.5) < 0.8 else 'LOW'
        
        return predictions

def main():
    """Train Heathrow connection models"""
    print("Heathrow Connection Model Training")
    print("=" * 40)
    
    trainer = HeathrowConnectionModelTrainer()
    
    # Train models with fresh data
    report = trainer.train_connection_models(use_fresh_data=True)
    
    print("\nTraining Summary:")
    print(f"Status: {report['training_summary']['status']}")
    print(f"Models trained: {len(report['training_summary']['models_trained'])}")
    print(f"Training samples: {report['training_summary']['training_samples']}")
    print(f"Features: {report['training_summary']['features_used']}")
    
    print("\nModel Performance:")
    for model, metrics in report['model_performance'].items():
        print(f"  {model}:")
        for metric, value in metrics.items():
            if isinstance(value, float):
                print(f"    {metric}: {value:.4f}")
            else:
                print(f"    {metric}: {value}")
    
    print(f"\nBest models:")
    print(f"  Probability: {report['model_selection']['best_probability_model']}")
    print(f"  Classification: {report['model_selection']['best_classification_model']}")
    
    print(f"\nRecommendations:")
    for rec in report['recommendations']:
        print(f"  • {rec}")
    
    # Test prediction
    print(f"\nTesting prediction...")
    test_connection = {
        'arrival_hour': 8,
        'departure_hour': 11,
        'arrival_day_of_week': 2,
        'connection_time_minutes': 120,
        'minimum_connection_time': 75,
        'connection_buffer': 45,
        'arrival_delay_minutes': 10,
        'terminal_transfer': False,
        'estimated_passengers': 280,
        'is_international_arrival': True,
        'is_international_departure': True,
        'is_virgin_atlantic_arrival': True,
        'is_virgin_atlantic_departure': False,
        'is_virgin_skyteam_connection': True,
        'risk_factor_count': 1,
        'has_tight_connection': False,
        'has_arrival_delay': False,
        'has_weather_risk': False,
        'same_airline': False,
        'alliance_connection': True
    }
    
    prediction = trainer.predict_connection_success(test_connection)
    print(f"Test prediction: {prediction}")

if __name__ == "__main__":
    main()
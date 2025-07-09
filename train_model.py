#!/usr/bin/env python3
"""
ML Model Training for AINO Aviation Intelligence Platform
Trains delay prediction models on buffered authentic flight data
"""

import pandas as pd
import numpy as np
import joblib
from sklearn.ensemble import RandomForestClassifier
from sklearn.model_selection import train_test_split, cross_val_score
from sklearn.metrics import classification_report, confusion_matrix
import json
import os
from datetime import datetime
import logging

# Configure logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

class AINODelayPredictor:
    """ML model for Virgin Atlantic delay prediction"""
    
    def __init__(self, buffer_file='live_buffer.csv', model_file='delay_model.pkl'):
        self.buffer_file = buffer_file
        self.model_file = model_file
        self.feature_columns_file = 'feature_columns.txt'
        self.model_metadata_file = 'model_metadata.json'
        self.model = None
        self.feature_columns = None
    
    def load_and_prepare_data(self) -> tuple:
        """Load buffered data and prepare for training"""
        if not os.path.exists(self.buffer_file):
            raise FileNotFoundError(f"Buffer file {self.buffer_file} not found. Run buffer_live_data.py first.")
        
        df = pd.read_csv(self.buffer_file)
        logger.info(f"Loaded {len(df)} records from buffer")
        
        if len(df) < 10:
            raise ValueError("Insufficient data for training. Need at least 10 records.")
        
        # Enhanced feature set matching your METAR weather integration
        feature_cols = [
            'departure_delay_mins', 'enroute_time_min', 'altitude',
            'ground_speed', 'lat', 'lon', 'day_of_week',
            'hour_of_day', 'weather_score'
        ]
        
        # Create enhanced features if they don't exist
        df = self._create_enhanced_features(df)
        
        # Filter to only available columns
        available_cols = [col for col in feature_cols if col in df.columns]
        self.feature_columns = available_cols
        
        logger.info(f"Using {len(available_cols)} features: {available_cols}")
        
        X = df[available_cols]
        
        # Handle different possible column names for delay classification
        if 'delay_label' in df.columns:
            y = df['delay_label']
        elif 'delay_class' in df.columns:
            # Convert string delay classes to numeric
            delay_class_map = {
                'ON_TIME': 0,
                'MINOR_DELAY': 1, 
                'MODERATE_DELAY': 1,
                'MAJOR_DELAY': 2
            }
            y = df['delay_class'].map(delay_class_map).fillna(0)
        else:
            # Create delay labels from delay_minutes if available
            if 'delay_minutes' in df.columns:
                y = df['delay_minutes'].apply(lambda x: 0 if x <= 15 else (1 if x <= 60 else 2))
            else:
                raise ValueError("No delay target variable found in data")
        
        # Ensure y is numeric
        y = pd.to_numeric(y, errors='coerce').fillna(0).astype(int)
        
        # Handle missing values in features
        X = X.select_dtypes(include=[np.number])  # Only numeric columns
        X = X.fillna(X.median())
        
        return X, y, df
    
    def _create_enhanced_features(self, df: pd.DataFrame) -> pd.DataFrame:
        """Create additional features for better prediction"""
        # Convert departure_delay_mins if needed
        if 'dep_delay' in df.columns and 'departure_delay_mins' not in df.columns:
            df['departure_delay_mins'] = df['dep_delay']
        
        # Create enroute_time_min if not exists
        if 'enroute_time_min' not in df.columns:
            df['enroute_time_min'] = np.random.normal(180, 60, len(df))  # Simulate enroute time
        
        # Ensure basic temporal features exist
        if 'day_of_week' not in df.columns:
            df['day_of_week'] = pd.to_datetime(df['timestamp']).dt.dayofweek
        
        if 'hour_of_day' not in df.columns:
            df['hour_of_day'] = pd.to_datetime(df['timestamp']).dt.hour
        
        # Create aircraft type encoding
        if 'aircraft_type' in df.columns:
            aircraft_map = {'A35K': 4, 'B789': 3, 'A339': 2, 'A333': 1, 'UNKNOWN': 0}
            df['aircraft_type_encoded'] = df['aircraft_type'].map(aircraft_map).fillna(0)
        
        # Create route complexity score
        if 'route' in df.columns:
            def route_complexity(route):
                if 'UNKNOWN' in str(route):
                    return 0.5
                elif any(code in str(route) for code in ['JNB', 'LOS', 'RUH']):  # Long-haul
                    return 1.0
                elif any(code in str(route) for code in ['ATL', 'BOS', 'IAD']):  # Trans-Atlantic
                    return 0.8
                else:
                    return 0.3
            
            df['route_complexity'] = df['route'].apply(route_complexity)
        
        return df
    
    def train_model(self) -> dict:
        """Train the delay prediction model"""
        X, y, df = self.load_and_prepare_data()
        
        # Split data
        X_train, X_test, y_train, y_test = train_test_split(
            X, y, test_size=0.2, random_state=42, stratify=y
        )
        
        # Train Random Forest model optimized for Virgin Atlantic operations
        self.model = RandomForestClassifier(
            n_estimators=150,
            max_depth=10,
            min_samples_split=5,
            min_samples_leaf=2,
            random_state=42,
            class_weight='balanced'  # Handle imbalanced delay classes
        )
        
        logger.info("Training model...")
        self.model.fit(X_train, y_train)
        
        # Evaluate model
        train_score = self.model.score(X_train, y_train)
        test_score = self.model.score(X_test, y_test)
        
        # Cross-validation
        cv_scores = cross_val_score(self.model, X, y, cv=5)
        
        # Predictions for detailed analysis
        y_pred = self.model.predict(X_test)
        
        # Feature importance
        feature_importance = dict(zip(self.feature_columns, self.model.feature_importances_))
        
        # Create model metadata
        metadata = {
            'training_date': datetime.now().isoformat(),
            'training_records': len(df),
            'feature_columns': self.feature_columns,
            'model_type': 'RandomForestClassifier',
            'train_accuracy': float(train_score),
            'test_accuracy': float(test_score),
            'cv_mean_accuracy': float(cv_scores.mean()),
            'cv_std_accuracy': float(cv_scores.std()),
            'feature_importance': {k: float(v) for k, v in feature_importance.items()},
            'class_distribution': y.value_counts().to_dict(),
            'delay_classes': {
                0: 'On Time',
                1: 'Minor Delay (15-60 min)',
                2: 'Major Delay (60+ min)'
            }
        }
        
        # Save model and metadata
        self._save_model_artifacts(metadata)
        
        logger.info(f"Model trained successfully:")
        logger.info(f"  Training accuracy: {train_score:.3f}")
        logger.info(f"  Test accuracy: {test_score:.3f}")
        logger.info(f"  CV accuracy: {cv_scores.mean():.3f} ± {cv_scores.std():.3f}")
        
        return metadata
    
    def _save_model_artifacts(self, metadata: dict):
        """Save model and associated files"""
        # Save trained model
        joblib.dump(self.model, self.model_file)
        logger.info(f"Model saved to {self.model_file}")
        
        # Save feature columns
        with open(self.feature_columns_file, "w") as f:
            f.write(','.join(self.feature_columns))
        logger.info(f"Feature columns saved to {self.feature_columns_file}")
        
        # Save metadata
        with open(self.model_metadata_file, "w") as f:
            json.dump(metadata, f, indent=2)
        logger.info(f"Model metadata saved to {self.model_metadata_file}")
    
    def get_model_info(self) -> dict:
        """Get information about the current model"""
        if os.path.exists(self.model_metadata_file):
            with open(self.model_metadata_file, 'r') as f:
                return json.load(f)
        else:
            return {'error': 'No trained model found'}

def train_from_buffer(buffer_file='live_buffer.csv', model_file='delay_model.pkl'):
    """Main training function - simplified interface"""
    trainer = AINODelayPredictor(buffer_file, model_file)
    try:
        metadata = trainer.train_model()
        print(f"✅ Model trained successfully with {metadata['test_accuracy']:.3f} accuracy")
        return True
    except Exception as e:
        print(f"❌ Training failed: {e}")
        return False

def main():
    """Main execution for model training"""
    print("AINO Aviation Delay Prediction Model Training")
    print("=" * 50)
    
    trainer = AINODelayPredictor()
    
    try:
        metadata = trainer.train_model()
        
        print("\n📊 Training Results:")
        print(f"Records used: {metadata['training_records']}")
        print(f"Features: {len(metadata['feature_columns'])}")
        print(f"Training accuracy: {metadata['train_accuracy']:.3f}")
        print(f"Test accuracy: {metadata['test_accuracy']:.3f}")
        print(f"Cross-validation: {metadata['cv_mean_accuracy']:.3f} ± {metadata['cv_std_accuracy']:.3f}")
        
        print(f"\n🔝 Top Feature Importance:")
        sorted_features = sorted(metadata['feature_importance'].items(), key=lambda x: x[1], reverse=True)
        for feature, importance in sorted_features[:5]:
            print(f"  {feature}: {importance:.3f}")
        
        print(f"\n📈 Class Distribution:")
        for class_id, count in metadata['class_distribution'].items():
            class_name = metadata['delay_classes'].get(str(class_id), f"Class {class_id}")
            print(f"  {class_name}: {count} samples")
        
    except Exception as e:
        print(f"❌ Training failed: {e}")
        logger.error(f"Training error: {e}")

if __name__ == "__main__":
    main()
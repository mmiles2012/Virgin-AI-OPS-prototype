#!/usr/bin/env python3
"""
Enhanced ML Trainer for AINO Aviation Intelligence Platform
Trains models using the enhanced feature set with METAR weather data
"""

import pandas as pd
import numpy as np
import joblib
import json
from datetime import datetime
from sklearn.ensemble import RandomForestClassifier
from sklearn.model_selection import train_test_split
from sklearn.metrics import classification_report, accuracy_score
import logging

# Configure logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

class EnhancedMLTrainer:
    """Enhanced ML trainer with METAR weather features"""
    
    def __init__(self, buffer_file='enhanced_buffer.csv', model_file='enhanced_delay_model.pkl'):
        self.buffer_file = buffer_file
        self.model_file = model_file
        self.feature_columns = [
            'departure_delay_mins', 'enroute_time_min', 'altitude',
            'ground_speed', 'lat', 'lon', 'day_of_week',
            'hour_of_day', 'weather_score'
        ]
        self.target_column = 'delay_label'
    
    def load_enhanced_data(self) -> tuple:
        """Load enhanced data with METAR weather features"""
        try:
            df = pd.read_csv(self.buffer_file)
            logger.info(f"Loaded {len(df)} records from enhanced buffer")
            
            if len(df) < 10:
                raise ValueError("Insufficient data for training. Need at least 10 records.")
            
            # Clean data - fix non-numeric values
            # Fix altitude column
            df['altitude'] = pd.to_numeric(df['altitude'], errors='coerce')
            df['altitude'] = df['altitude'].fillna(35000)  # Replace NaN with default
            
            # Fix ground_speed column
            df['ground_speed'] = pd.to_numeric(df['ground_speed'], errors='coerce') 
            df['ground_speed'] = df['ground_speed'].fillna(450)  # Replace NaN with default
            
            # Ensure all feature columns exist
            for col in self.feature_columns:
                if col not in df.columns:
                    logger.warning(f"Missing column {col}, adding default values")
                    if col == 'weather_score':
                        df[col] = 0.2
                    elif col in ['departure_delay_mins', 'enroute_time_min']:
                        df[col] = 0.0
                    elif col in ['altitude']:
                        df[col] = 35000
                    elif col in ['ground_speed']:
                        df[col] = 450
                    elif col in ['lat']:
                        df[col] = 51.5
                    elif col in ['lon']:
                        df[col] = -1.0
                    else:
                        df[col] = 0
            
            # Ensure target column exists
            if self.target_column not in df.columns:
                logger.warning("Missing delay_label, creating from data")
                df['delay_label'] = 0  # Default to on-time
            
            X = df[self.feature_columns]
            y = df[self.target_column]
            
            return X, y, df
            
        except Exception as e:
            logger.error(f"Error loading data: {e}")
            raise
    
    def train_enhanced_model(self) -> dict:
        """Train enhanced model with METAR weather features"""
        X, y, df = self.load_enhanced_data()
        
        # Split data
        X_train, X_test, y_train, y_test = train_test_split(
            X, y, test_size=0.2, random_state=42, stratify=y
        )
        
        # Train Random Forest model
        model = RandomForestClassifier(
            n_estimators=100,
            max_depth=10,
            random_state=42,
            class_weight='balanced'
        )
        
        model.fit(X_train, y_train)
        
        # Evaluate model
        y_pred = model.predict(X_test)
        accuracy = accuracy_score(y_test, y_pred)
        
        # Feature importance
        feature_importance = dict(zip(self.feature_columns, model.feature_importances_))
        
        # Save model and metadata
        joblib.dump(model, self.model_file)
        
        metadata = {
            'model_accuracy': accuracy,
            'feature_count': len(self.feature_columns),
            'feature_columns': self.feature_columns,
            'training_date': datetime.now().isoformat(),
            'training_records': len(df),
            'feature_importance': feature_importance,
            'weather_integration': True,
            'metar_enhanced': True
        }
        
        with open('enhanced_model_metadata.json', 'w') as f:
            json.dump(metadata, f, indent=2)
        
        logger.info(f"Enhanced model trained successfully - Accuracy: {accuracy:.3f}")
        
        return metadata

def main():
    """Main training function"""
    print("🧠 Enhanced ML Training with METAR Weather Data")
    print("=" * 50)
    
    trainer = EnhancedMLTrainer()
    
    try:
        metadata = trainer.train_enhanced_model()
        print(f"✅ Training completed successfully")
        print(f"📊 Model accuracy: {metadata['model_accuracy']:.3f}")
        print(f"🌤️  Weather integration: {metadata['weather_integration']}")
        print(f"📈 Feature importance (top 3):")
        
        # Sort features by importance
        importance = metadata['feature_importance']
        sorted_features = sorted(importance.items(), key=lambda x: x[1], reverse=True)
        
        for i, (feature, score) in enumerate(sorted_features[:3]):
            print(f"   {i+1}. {feature}: {score:.3f}")
            
    except Exception as e:
        print(f"❌ Training failed: {e}")

if __name__ == "__main__":
    main()
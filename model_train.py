#!/usr/bin/env python3
"""
Machine Learning Model Training for FAA NAS Ground Stop Prediction
Uses Random Forest to predict ground stop events
"""

from sklearn.ensemble import RandomForestClassifier
from sklearn.model_selection import train_test_split, cross_val_score
from sklearn.metrics import classification_report, confusion_matrix, roc_auc_score
from sklearn.preprocessing import LabelEncoder
import pandas as pd
import numpy as np
import joblib
import logging
from datetime import datetime

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

def prepare_data(df):
    """
    Prepare data for machine learning model
    
    Args:
        df: DataFrame with features and target variable
        
    Returns:
        Tuple of (X, y) for training
    """
    logger.info("Preparing data for ML training...")
    
    # Drop rows with missing target variable
    df = df.dropna(subset=["is_ground_stop"])
    
    # Handle categorical variables
    if 'season' in df.columns:
        le_season = LabelEncoder()
        df['season_encoded'] = le_season.fit_transform(df['season'].fillna('spring'))
    
    if 'duration_category' in df.columns:
        le_duration = LabelEncoder()
        df['duration_category_encoded'] = le_duration.fit_transform(df['duration_category'].fillna('medium'))
    
    # Select features for training
    feature_columns = [
        'hour_of_day',
        'day_of_week', 
        'month',
        'is_weekend',
        'is_peak_hour',
        'is_major_hub',
        'is_va_destination',
        'is_weather_related',
        'is_volume_related',
        'is_equipment_related',
        'event_duration_mins',
        'is_holiday_period'
    ]
    
    # Add encoded categorical features if available
    if 'season_encoded' in df.columns:
        feature_columns.append('season_encoded')
    if 'duration_category_encoded' in df.columns:
        feature_columns.append('duration_category_encoded')
    
    # Filter features that exist in the DataFrame
    available_features = [col for col in feature_columns if col in df.columns]
    logger.info(f"Using {len(available_features)} features: {available_features}")
    
    X = df[available_features]
    y = df['is_ground_stop']
    
    # Handle missing values
    X = X.fillna(X.mean())
    
    logger.info(f"Training data shape: X={X.shape}, y={y.shape}")
    logger.info(f"Target distribution: {y.value_counts().to_dict()}")
    
    return X, y, available_features

def train_model(df):
    """
    Train Random Forest model for ground stop prediction
    
    Args:
        df: DataFrame with features and target
        
    Returns:
        Trained model and metrics
    """
    logger.info("Starting model training...")
    
    X, y, feature_names = prepare_data(df)
    
    if len(X) == 0:
        logger.error("No data available for training")
        return None, None
    
    # Split data
    test_size = min(0.2, max(0.1, len(X) * 0.2 / len(X)))  # Adaptive test size
    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=test_size, random_state=42, stratify=y if len(y.unique()) > 1 else None
    )
    
    # Train Random Forest model
    model = RandomForestClassifier(
        n_estimators=100,
        max_depth=10,
        min_samples_split=5,
        min_samples_leaf=2,
        random_state=42,
        class_weight='balanced'  # Handle class imbalance
    )
    
    logger.info("Training Random Forest model...")
    model.fit(X_train, y_train)
    
    # Make predictions
    y_pred = model.predict(X_test)
    y_pred_proba = model.predict_proba(X_test)
    
    # Calculate metrics
    logger.info("Calculating model performance metrics...")
    print("\n=== Model Performance ===")
    print(classification_report(y_test, y_pred))
    print("\nConfusion Matrix:")
    print(confusion_matrix(y_test, y_pred))
    
    # ROC AUC if we have both classes
    if len(y.unique()) > 1:
        try:
            auc_score = roc_auc_score(y_test, y_pred_proba[:, 1])
            print(f"\nROC AUC Score: {auc_score:.4f}")
        except:
            logger.warning("Could not calculate ROC AUC score")
    
    # Feature importance
    if hasattr(model, 'feature_importances_'):
        feature_importance = pd.DataFrame({
            'feature': feature_names,
            'importance': model.feature_importances_
        }).sort_values('importance', ascending=False)
        
        print("\n=== Feature Importance ===")
        print(feature_importance.head(10))
    
    # Cross-validation
    if len(X) > 5:  # Only do CV if we have enough samples
        cv_scores = cross_val_score(model, X, y, cv=min(5, len(X)), scoring='accuracy')
        print(f"\n=== Cross-Validation ===")
        print(f"CV Accuracy: {cv_scores.mean():.4f} (+/- {cv_scores.std() * 2:.4f})")
    
    # Save model
    model_filename = "nas_ground_stop_model.pkl"
    joblib.dump(model, model_filename)
    logger.info(f"Model saved as {model_filename}")
    
    # Save feature names
    feature_info = {
        'feature_names': feature_names,
        'model_type': 'RandomForestClassifier',
        'training_date': datetime.now().isoformat(),
        'training_samples': len(X),
        'target_classes': y.unique().tolist()
    }
    
    joblib.dump(feature_info, "model_metadata.pkl")
    logger.info("Model metadata saved")
    
    return model, {
        'feature_importance': feature_importance if 'feature_importance' in locals() else None,
        'training_samples': len(X),
        'test_accuracy': (y_pred == y_test).mean() if len(y_test) > 0 else 0,
        'feature_count': len(feature_names)
    }

def load_model():
    """
    Load trained model from disk
    
    Returns:
        Loaded model and metadata
    """
    try:
        model = joblib.load("nas_ground_stop_model.pkl")
        metadata = joblib.load("model_metadata.pkl")
        logger.info("Model loaded successfully")
        return model, metadata
    except FileNotFoundError:
        logger.error("Model files not found. Please train model first.")
        return None, None
    except Exception as e:
        logger.error(f"Error loading model: {e}")
        return None, None

def predict_ground_stop(model, features_dict, metadata):
    """
    Predict ground stop probability for given features
    
    Args:
        model: Trained model
        features_dict: Dictionary of feature values
        metadata: Model metadata
        
    Returns:
        Prediction result
    """
    try:
        # Create DataFrame with features
        feature_names = metadata['feature_names']
        features_df = pd.DataFrame([features_dict])
        
        # Ensure all required features are present
        for feature in feature_names:
            if feature not in features_df.columns:
                # Set default values for missing features
                if feature.startswith('is_'):
                    features_df[feature] = 0
                elif feature in ['hour_of_day', 'day_of_week', 'month']:
                    features_df[feature] = datetime.now().hour if feature == 'hour_of_day' else 0
                else:
                    features_df[feature] = 0
        
        # Select and order features
        X = features_df[feature_names].fillna(0)
        
        # Make prediction
        prediction = model.predict(X)[0]
        probability = model.predict_proba(X)[0]
        
        return {
            'prediction': int(prediction),
            'probability': {
                'no_ground_stop': float(probability[0]),
                'ground_stop': float(probability[1]) if len(probability) > 1 else 0.0
            },
            'confidence': float(max(probability))
        }
        
    except Exception as e:
        logger.error(f"Prediction error: {e}")
        return {
            'prediction': 0,
            'probability': {'no_ground_stop': 0.5, 'ground_stop': 0.5},
            'confidence': 0.5
        }

def main():
    """Main function for testing model training"""
    try:
        # This would normally import data from scraper and feature engineering
        # For testing, create sample data
        from faa_nas_scraper import scrape_faa_nas_status
        from feature_engineering import create_features
        
        logger.info("Fetching FAA data...")
        df = scrape_faa_nas_status()
        
        logger.info("Creating features...")
        df = create_features(df)
        
        logger.info("Training model...")
        model, metrics = train_model(df)
        
        if model:
            logger.info("Model training completed successfully")
            print(f"\nTraining completed with {metrics['training_samples']} samples")
            print(f"Test accuracy: {metrics['test_accuracy']:.4f}")
            print(f"Feature count: {metrics['feature_count']}")
        else:
            logger.error("Model training failed")
            
    except Exception as e:
        logger.error(f"Training pipeline error: {e}")

if __name__ == "__main__":
    main()
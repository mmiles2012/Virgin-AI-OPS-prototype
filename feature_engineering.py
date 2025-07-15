#!/usr/bin/env python3
"""
Feature Engineering for FAA NAS Status ML Pipeline
Creates features for ground stop prediction model
"""

import pandas as pd
import numpy as np
from datetime import datetime, timedelta
import logging

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

def create_features(df):
    """
    Create ML features from FAA NAS status data
    
    Args:
        df: DataFrame with scraped FAA data
        
    Returns:
        DataFrame with engineered features
    """
    logger.info("Starting feature engineering...")
    
    # Ensure required columns exist
    required_columns = ['start_time', 'last_update', 'status', 'airport']
    for col in required_columns:
        if col not in df.columns:
            logger.error(f"Missing required column: {col}")
            return df
    
    # Convert datetime columns
    df['start_time'] = pd.to_datetime(df['start_time'], errors='coerce')
    df['last_update'] = pd.to_datetime(df['last_update'], errors='coerce')
    
    # Calculate event duration
    df["event_duration"] = df["last_update"] - df["start_time"]
    
    # Handle negative or null durations
    df.loc[df["event_duration"] < pd.Timedelta(0), "event_duration"] = pd.Timedelta(minutes=5)
    df["event_duration"] = df["event_duration"].fillna(pd.Timedelta(minutes=5))
    
    # Ground stop indicator (target variable)
    df["is_ground_stop"] = df["status"].str.contains(
        "Ground Stop|Ground Delay Program|Ground Stop", 
        case=False, 
        na=False
    ).astype(int)
    
    # Temporal features
    df["hour_of_day"] = df["start_time"].dt.hour
    df["day_of_week"] = df["start_time"].dt.dayofweek
    df["month"] = df["start_time"].dt.month
    df["is_weekend"] = (df["day_of_week"] >= 5).astype(int)
    
    # Peak hours indicator
    df["is_peak_hour"] = ((df["hour_of_day"] >= 6) & (df["hour_of_day"] <= 9) | 
                         (df["hour_of_day"] >= 17) & (df["hour_of_day"] <= 20)).astype(int)
    
    # Extract airport code from airport field
    df["airport_code"] = df["airport"].str.extract(r'([A-Z]{3})')
    df["airport_code"] = df["airport_code"].fillna(df["airport"].str.upper())
    
    # Airport category features
    major_hubs = ['JFK', 'LAX', 'ORD', 'ATL', 'DFW', 'DEN', 'LAS', 'PHX', 'MIA', 'SEA']
    df["is_major_hub"] = df["airport_code"].isin(major_hubs).astype(int)
    
    # Virgin Atlantic destinations
    va_destinations = ['JFK', 'LGA', 'EWR', 'BOS', 'LAX', 'SFO', 'MCO', 'MIA', 
                      'ATL', 'IAD', 'SEA', 'LAS', 'TPA', 'PHL']
    df["is_va_destination"] = df["airport_code"].isin(va_destinations).astype(int)
    
    # Weather-related indicators
    weather_keywords = ['Weather', 'Thunderstorm', 'Fog', 'Wind', 'Snow', 'Ice', 'Visibility']
    df["is_weather_related"] = df["reason"].str.contains(
        '|'.join(weather_keywords), 
        case=False, 
        na=False
    ).astype(int)
    
    # Volume-related indicators
    volume_keywords = ['Volume', 'Traffic', 'Congestion', 'Capacity']
    df["is_volume_related"] = df["reason"].str.contains(
        '|'.join(volume_keywords), 
        case=False, 
        na=False
    ).astype(int)
    
    # Equipment/facility indicators
    equipment_keywords = ['Equipment', 'Runway', 'Construction', 'Facility']
    df["is_equipment_related"] = df["reason"].str.contains(
        '|'.join(equipment_keywords), 
        case=False, 
        na=False
    ).astype(int)
    
    # Event duration in minutes for ML model
    df["event_duration_mins"] = df["event_duration"].dt.total_seconds() / 60
    df["event_duration_mins"] = df["event_duration_mins"].fillna(5.0)  # Default 5 minutes
    
    # Duration categories
    df["duration_category"] = pd.cut(
        df["event_duration_mins"], 
        bins=[0, 15, 60, 180, np.inf], 
        labels=['short', 'medium', 'long', 'extended']
    )
    
    # Seasonal indicators
    df["season"] = df["month"].map({
        12: 'winter', 1: 'winter', 2: 'winter',
        3: 'spring', 4: 'spring', 5: 'spring',
        6: 'summer', 7: 'summer', 8: 'summer',
        9: 'fall', 10: 'fall', 11: 'fall'
    })
    
    # Holiday period indicator (simplified)
    holiday_months = [11, 12, 6, 7]  # Thanksgiving/Christmas, Summer travel
    df["is_holiday_period"] = df["month"].isin(holiday_months).astype(int)
    
    logger.info(f"Feature engineering complete. Created {len(df.columns)} total features")
    logger.info(f"Ground stop events: {df['is_ground_stop'].sum()}/{len(df)}")
    
    return df

def get_feature_list():
    """
    Get list of features for ML model training
    
    Returns:
        List of feature column names
    """
    features = [
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
    return features

def validate_features(df):
    """
    Validate that all required features are present and valid
    
    Args:
        df: DataFrame with features
        
    Returns:
        bool: True if validation passes
    """
    required_features = get_feature_list() + ['is_ground_stop']
    
    for feature in required_features:
        if feature not in df.columns:
            logger.error(f"Missing required feature: {feature}")
            return False
        
        if df[feature].isnull().all():
            logger.error(f"Feature {feature} contains only null values")
            return False
    
    logger.info("Feature validation passed")
    return True

def main():
    """Main function for testing feature engineering"""
    # This would normally import the scraper
    # For testing, create sample data
    sample_data = pd.DataFrame({
        'airport': ['JFK', 'LAX', 'BOS'],
        'status': ['Ground Stop', 'Normal Operations', 'Arrival Delay'],
        'reason': ['Weather / Thunderstorms', '', 'Volume'],
        'start_time': [datetime.now() - timedelta(hours=2), 
                      datetime.now() - timedelta(hours=1),
                      datetime.now() - timedelta(minutes=30)],
        'last_update': [datetime.now(), datetime.now(), datetime.now()]
    })
    
    features_df = create_features(sample_data)
    print("Features created:")
    print(features_df.columns.tolist())
    print("\nSample data:")
    print(features_df.head())
    
    validation_result = validate_features(features_df)
    print(f"\nValidation result: {validation_result}")

if __name__ == "__main__":
    main()
import pandas as pd
import joblib
import numpy as np
from sklearn.ensemble import RandomForestRegressor
from sklearn.model_selection import train_test_split
from sklearn.metrics import mean_absolute_error
from sklearn.pipeline import Pipeline, make_pipeline
from sklearn.compose import ColumnTransformer
from sklearn.preprocessing import OneHotEncoder
from sklearn.impute import SimpleImputer
import os


DATA_PATH = "data/latest_training_data.csv"
WEATHER_PATH = "data/weather_data.csv"
MODEL_PATH = "model/random_forest_delay_predictor.pkl"


def create_training_data():
    """Create comprehensive training dataset with weather and operational data"""
    
    # Load weather data
    if os.path.exists(WEATHER_PATH):
        weather_df = pd.read_csv(WEATHER_PATH)
        print(f"Loaded weather data for {len(weather_df)} airports")
    else:
        print("No weather data found. Run fetch_weather first.")
        return None
    
    # Create operational data for each airport
    operational_data = []
    airlines = ['British Airways', 'Virgin Atlantic', 'EasyJet', 'Ryanair', 'Jet2', 'TUI Airways']
    
    for _, weather_row in weather_df.iterrows():
        if weather_row.get('error', False):
            continue
            
        icao = weather_row['station']
        
        # Generate realistic operational scenarios for each airline
        for airline in airlines:
            for scenario in range(5):  # 5 scenarios per airline per airport
                base_delay = np.random.normal(8, 4)  # Base delay in minutes
                
                # Weather impact on delays
                weather_impact = 0
                if weather_row.get('low_visibility_flag', False):
                    weather_impact += np.random.normal(15, 5)
                if weather_row.get('strong_wind_flag', False):
                    weather_impact += np.random.normal(12, 4)
                if weather_row.get('ifr_flag', False):
                    weather_impact += np.random.normal(8, 3)
                if weather_row.get('fog_risk_flag', False):
                    weather_impact += np.random.normal(20, 6)
                
                total_delay = max(0, base_delay + weather_impact)
                
                operational_data.append({
                    'icao_code': icao,
                    'airline_name': airline,
                    'origin_destination': np.random.choice(['Departure', 'Arrival']),
                    'arrival_departure': np.random.choice(['Arrival', 'Departure']),
                    'scheduled_charter': np.random.choice(['Scheduled', 'Charter'], p=[0.9, 0.1]),
                    'average_delay_mins': total_delay
                })
    
    # Create operational DataFrame
    operational_df = pd.DataFrame(operational_data)
    
    # Merge with weather data
    merged_df = operational_df.merge(weather_df, left_on='icao_code', right_on='station', how='left')
    
    # Save training data
    os.makedirs("data", exist_ok=True)
    merged_df.to_csv(DATA_PATH, index=False)
    print(f"Created training dataset with {len(merged_df)} records")
    
    return merged_df


def train_and_save_model():
    """Train Random Forest model with weather and operational features"""
    
    # Always create fresh training data from current weather
    print("Creating training data...")
    df = create_training_data()
    if df is None:
        return
    
    # Clean data
    if 'average_delay_mins' in df.columns:
        df = df.dropna(subset=["average_delay_mins"])
        df = df[df['average_delay_mins'] >= 0]  # No negative delays
    else:
        print("No delay data found - using weather data only for demonstration")
        return
    
    print(f"Training on {len(df)} records")
    
    # Select features
    feature_columns = [
        'airline_name', 'origin_destination', 'arrival_departure', 'scheduled_charter',
        'low_visibility_flag', 'strong_wind_flag', 'ifr_flag', 'fog_risk_flag',
        'visibility', 'wind_speed', 'temperature', 'temp_dewpoint_delta'
    ]
    
    # Handle missing columns
    available_features = [col for col in feature_columns if col in df.columns]
    X = df[available_features]
    y = df["average_delay_mins"]
    
    # Define preprocessing
    categorical_features = ['airline_name', 'origin_destination', 'arrival_departure', 'scheduled_charter']
    boolean_features = ['low_visibility_flag', 'strong_wind_flag', 'ifr_flag', 'fog_risk_flag']
    numeric_features = ['visibility', 'wind_speed', 'temperature', 'temp_dewpoint_delta']
    
    # Filter available features by type
    available_categorical = [f for f in categorical_features if f in available_features]
    available_boolean = [f for f in boolean_features if f in available_features]
    available_numeric = [f for f in numeric_features if f in available_features]
    
    # Convert boolean columns to integers for scikit-learn compatibility
    for col in available_boolean:
        if col in X.columns:
            X[col] = X[col].astype(int)
    
    # Create preprocessor
    transformers = []
    if available_categorical:
        transformers.append(('cat', OneHotEncoder(handle_unknown='ignore'), available_categorical))
    if available_boolean:
        transformers.append(('bool', SimpleImputer(strategy='most_frequent'), available_boolean))
    if available_numeric:
        transformers.append(('num', SimpleImputer(strategy='mean'), available_numeric))
    
    preprocessor = ColumnTransformer(transformers)
    
    # Create pipeline
    model = Pipeline([
        ('preprocessor', preprocessor),
        ('regressor', RandomForestRegressor(n_estimators=100, random_state=42))
    ])
    
    # Train model
    X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)
    model.fit(X_train, y_train)
    
    # Evaluate
    y_pred = model.predict(X_test)
    mae = mean_absolute_error(y_test, y_pred)
    print(f"✓ Model trained - Test MAE: {mae:.2f} minutes")
    
    # Save model
    os.makedirs("model", exist_ok=True)
    joblib.dump(model, MODEL_PATH)
    print(f"✓ Model saved to {MODEL_PATH}")
    
    return model
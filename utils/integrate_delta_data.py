import pandas as pd
import numpy as np
from datetime import datetime
import os

def process_delta_airlines_data(delta_data_file):
    """
    Process Delta Airlines operational data for weather-enhanced model training
    """
    
    print("Processing Delta Airlines operational data...")
    
    # Load Delta data
    if isinstance(delta_data_file, str):
        if delta_data_file.endswith('.csv'):
            delta_df = pd.read_csv(delta_data_file)
        elif delta_data_file.endswith('.xlsx'):
            delta_df = pd.read_excel(delta_data_file)
        else:
            print(f"Unsupported file format: {delta_data_file}")
            return None
    else:
        # Assume it's already a DataFrame
        delta_df = delta_data_file
    
    print(f"Loaded {len(delta_df)} Delta Airlines records")
    print(f"Columns: {list(delta_df.columns)}")
    
    return delta_df

def standardize_delta_data(delta_df):
    """
    Standardize Delta Airlines data to match AINO weather-enhanced format
    """
    
    standardized_data = []
    
    # Common Delta airline code mappings
    delta_airport_mapping = {
        'ATL': 'KATL',  # Atlanta
        'DTW': 'KDTW',  # Detroit
        'MSP': 'KMSP',  # Minneapolis
        'SEA': 'KSEA',  # Seattle
        'SLC': 'KSLC',  # Salt Lake City
        'JFK': 'KJFK',  # New York JFK
        'LAX': 'KLAX',  # Los Angeles
        'LGA': 'KLGA',  # New York LaGuardia
        'BOS': 'KBOS',  # Boston
        'DCA': 'KDCA',  # Washington DC
    }
    
    for _, row in delta_df.iterrows():
        
        # Extract airport code (handle various column names)
        airport_code = None
        for col in ['airport', 'airport_code', 'origin', 'destination', 'icao', 'iata']:
            if col in row and pd.notna(row[col]):
                airport_code = str(row[col]).upper()
                # Convert IATA to ICAO if needed
                if len(airport_code) == 3 and airport_code in delta_airport_mapping:
                    airport_code = delta_airport_mapping[airport_code]
                break
        
        if not airport_code:
            continue
        
        # Extract delay information
        delay_minutes = 0
        for col in ['delay', 'delay_minutes', 'arr_delay', 'dep_delay', 'total_delay']:
            if col in row and pd.notna(row[col]):
                delay_minutes = float(row[col])
                break
        
        # Extract flight information
        flight_type = 'Scheduled'
        for col in ['flight_type', 'scheduled_charter', 'type']:
            if col in row and pd.notna(row[col]):
                flight_type = str(row[col])
                break
        
        # Extract operation type
        operation_type = 'Departure'
        for col in ['operation', 'arr_dep', 'arrival_departure']:
            if col in row and pd.notna(row[col]):
                operation_type = str(row[col])
                break
        
        # Extract date information
        flight_date = datetime.now().strftime('%Y-%m-%d')
        for col in ['date', 'flight_date', 'scheduled_date']:
            if col in row and pd.notna(row[col]):
                flight_date = str(row[col])
                break
        
        standardized_record = {
            'icao_code': airport_code,
            'airline_name': 'Delta Air Lines',
            'origin_destination': operation_type,
            'arrival_departure': operation_type,
            'scheduled_charter': flight_type,
            'average_delay_mins': delay_minutes,
            'flight_date': flight_date,
            'data_source': 'Delta Airlines Operational Data'
        }
        
        standardized_data.append(standardized_record)
    
    standardized_df = pd.DataFrame(standardized_data)
    print(f"Standardized {len(standardized_df)} Delta records")
    
    return standardized_df

def merge_delta_with_weather(delta_df, weather_data_path='data/weather_data.csv'):
    """
    Merge Delta operational data with current weather conditions
    """
    
    # Load current weather data
    if os.path.exists(weather_data_path):
        weather_df = pd.read_csv(weather_data_path)
        print(f"Loaded weather data for {len(weather_df)} airports")
    else:
        print("No weather data found. Using Delta data without weather enhancement.")
        return delta_df
    
    # Merge Delta data with weather conditions
    enhanced_df = delta_df.merge(
        weather_df,
        left_on='icao_code',
        right_on='station',
        how='left'
    )
    
    print(f"Enhanced {len(enhanced_df)} Delta records with weather data")
    
    # Fill missing weather data with defaults for airports not in weather dataset
    weather_columns = ['visibility', 'wind_speed', 'temperature', 'dewpoint', 'flight_rules']
    for col in weather_columns:
        if col in enhanced_df.columns:
            enhanced_df[col] = enhanced_df[col].fillna({
                'visibility': 10000,
                'wind_speed': 5,
                'temperature': 15,
                'dewpoint': 10,
                'flight_rules': 'VFR'
            }.get(col, 0))
    
    # Add weather-based flags
    enhanced_df["low_visibility_flag"] = enhanced_df.get("visibility", 10000) < 3000
    enhanced_df["strong_wind_flag"] = enhanced_df.get("wind_speed", 0) > 25
    enhanced_df["ifr_flag"] = enhanced_df.get("flight_rules", "VFR").str.contains("IFR", na=False)
    enhanced_df["temp_dewpoint_delta"] = enhanced_df.get("temperature", 15) - enhanced_df.get("dewpoint", 10)
    enhanced_df["fog_risk_flag"] = (enhanced_df["temp_dewpoint_delta"] < 2) & (enhanced_df.get("visibility", 10000) < 2000)
    
    return enhanced_df

def integrate_delta_into_training_set(delta_df, existing_training_path='data/latest_training_data.csv'):
    """
    Integrate Delta data with existing training dataset
    """
    
    # Load existing training data
    if os.path.exists(existing_training_path):
        existing_df = pd.read_csv(existing_training_path)
        print(f"Loaded existing training data: {len(existing_df)} records")
        
        # Combine datasets
        combined_df = pd.concat([existing_df, delta_df], ignore_index=True)
        print(f"Combined dataset: {len(combined_df)} total records")
        
    else:
        print("No existing training data found. Using Delta data as base.")
        combined_df = delta_df
    
    # Remove duplicates and clean data
    combined_df = combined_df.drop_duplicates()
    combined_df = combined_df.dropna(subset=['average_delay_mins'])
    combined_df = combined_df[combined_df['average_delay_mins'] >= 0]
    
    # Save enhanced training dataset
    os.makedirs('data', exist_ok=True)
    combined_df.to_csv('data/enhanced_training_data.csv', index=False)
    
    print(f"Saved enhanced training dataset: {len(combined_df)} records")
    
    # Generate summary statistics
    print("\nDelta Airlines Integration Summary:")
    print("-" * 50)
    
    airline_counts = combined_df['airline_name'].value_counts()
    print("Records by airline:")
    for airline, count in airline_counts.items():
        print(f"  {airline}: {count} records")
    
    delta_records = combined_df[combined_df['airline_name'] == 'Delta Air Lines']
    if len(delta_records) > 0:
        avg_delta_delay = delta_records['average_delay_mins'].mean()
        print(f"\nDelta Airlines average delay: {avg_delta_delay:.1f} minutes")
        
        # Weather impact analysis for Delta
        if 'low_visibility_flag' in delta_records.columns:
            weather_impacted = delta_records[
                (delta_records['low_visibility_flag'] == True) |
                (delta_records['strong_wind_flag'] == True) |
                (delta_records['ifr_flag'] == True) |
                (delta_records['fog_risk_flag'] == True)
            ]
            print(f"Weather-impacted Delta operations: {len(weather_impacted)} ({len(weather_impacted)/len(delta_records)*100:.1f}%)")
    
    return combined_df

def analyze_delta_performance(enhanced_df):
    """
    Analyze Delta Airlines performance compared to other carriers
    """
    
    print("\n📊 DELTA AIRLINES PERFORMANCE ANALYSIS")
    print("=" * 60)
    
    if 'airline_name' not in enhanced_df.columns:
        print("No airline comparison data available")
        return
    
    # Performance by airline
    airline_performance = enhanced_df.groupby('airline_name').agg({
        'average_delay_mins': ['mean', 'median', 'std', 'count']
    }).round(2)
    
    print("Average Delay Performance by Airline:")
    print("-" * 40)
    for airline in airline_performance.index:
        stats = airline_performance.loc[airline, 'average_delay_mins']
        print(f"{airline}:")
        print(f"  Mean: {stats['mean']:.1f} min | Median: {stats['median']:.1f} min")
        print(f"  Records: {stats['count']} | Std Dev: {stats['std']:.1f}")
        print()
    
    # Weather impact comparison
    if 'low_visibility_flag' in enhanced_df.columns:
        print("Weather Impact Analysis:")
        print("-" * 30)
        
        for airline in enhanced_df['airline_name'].unique():
            airline_data = enhanced_df[enhanced_df['airline_name'] == airline]
            
            weather_impacted = airline_data[
                (airline_data['low_visibility_flag'] == True) |
                (airline_data['strong_wind_flag'] == True) |
                (airline_data['ifr_flag'] == True) |
                (airline_data['fog_risk_flag'] == True)
            ]
            
            normal_weather = airline_data[
                (airline_data['low_visibility_flag'] == False) &
                (airline_data['strong_wind_flag'] == False) &
                (airline_data['ifr_flag'] == False) &
                (airline_data['fog_risk_flag'] == False)
            ]
            
            if len(weather_impacted) > 0 and len(normal_weather) > 0:
                weather_delay = weather_impacted['average_delay_mins'].mean()
                normal_delay = normal_weather['average_delay_mins'].mean()
                weather_impact = weather_delay - normal_delay
                
                print(f"{airline}:")
                print(f"  Normal weather: {normal_delay:.1f} min avg delay")
                print(f"  Adverse weather: {weather_delay:.1f} min avg delay")
                print(f"  Weather impact: +{weather_impact:.1f} minutes")
                print()

def main():
    """
    Main integration workflow for Delta Airlines data
    """
    print("🛩️  DELTA AIRLINES DATA INTEGRATION")
    print("=" * 50)
    print("Ready to process Delta Airlines operational data")
    print("Supported formats: CSV, Excel")
    print("Required columns: airport/delay information")
    print()
    print("Call process_delta_airlines_data(file_path) with your Delta data file")

if __name__ == "__main__":
    main()
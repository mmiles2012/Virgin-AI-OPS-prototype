import pandas as pd
import os

def classify_metar_conditions(metar_text):
    """
    Classify METAR weather conditions for ML feature engineering
    """
    conditions = {
        "TS": "thunderstorm_days",
        "SN": "snow_days",
        "FG": "fog_days",
        "FZ": "freezing_days"
    }
    flags = {v: 0 for v in conditions.values()}
    for code, label in conditions.items():
        if code in metar_text:
            flags[label] = 1
    return flags

def parse_metar_file(filepath):
    """
    Parse METAR log files and extract weather condition features
    """
    rows = []
    with open(filepath, 'r') as f:
        for line in f:
            parts = line.strip().split()
            if len(parts) < 2:
                continue
            station = parts[0]
            date = parts[1]
            metar = " ".join(parts[2:])
            flags = classify_metar_conditions(metar)
            rows.append({
                "station": station,
                "date": date[:6],  # Format: YYYYMM
                **flags
            })
    df = pd.DataFrame(rows)
    if df.empty:
        return df
    df_agg = df.groupby(["station", "date"]).sum().reset_index()
    df_agg.rename(columns={"station": "airport", "date": "yearmonth"}, inplace=True)
    return df_agg

def enrich_with_metar(delay_df, metar_df):
    """
    Enrich delay dataset with METAR weather features
    """
    if delay_df.empty or metar_df.empty:
        print("Warning: Empty DataFrame provided to enrich_with_metar")
        return delay_df
    
    # Handle live flight data structure
    if 'ScrapeTimeUTC' in delay_df.columns:
        delay_df['scrape_time'] = pd.to_datetime(delay_df['ScrapeTimeUTC'])
        delay_df['year'] = delay_df['scrape_time'].dt.year
        delay_df['month'] = delay_df['scrape_time'].dt.month
        
        # Map Airport codes to ICAO for weather matching
        icao_mapping = {
            'JFK': 'KJFK', 'BOS': 'KBOS', 'ATL': 'KATL', 'LAX': 'KLAX',
            'SFO': 'KSFO', 'MCO': 'KMCO', 'MIA': 'KMIA', 'TPA': 'KTPA',
            'LAS': 'KLAS', 'LHR': 'EGLL'
        }
        delay_df['airport'] = delay_df['Airport'].map(icao_mapping).fillna(delay_df['Airport'])
    elif 'year' not in delay_df.columns:
        # Use current date for simulated data
        from datetime import datetime
        current_time = datetime.now()
        delay_df['year'] = current_time.year
        delay_df['month'] = current_time.month
        delay_df['airport'] = delay_df.get('Airport', 'UNKNOWN')
    
    delay_df["yearmonth"] = delay_df["year"].astype(str) + delay_df["month"].apply(lambda x: f"{x:02d}")
    
    # Merge with weather data
    df = pd.merge(delay_df, metar_df, on=["airport", "yearmonth"], how="left")
    df.drop(columns=["yearmonth"], inplace=True)
    df.fillna(0, inplace=True)
    return df

def process_metar_directory(metar_dir):
    """
    Process all METAR files in a directory and combine them
    """
    all_metar_data = []
    
    if not os.path.exists(metar_dir):
        print(f"METAR directory {metar_dir} not found")
        return pd.DataFrame()
    
    for filename in os.listdir(metar_dir):
        if filename.endswith('.txt') or filename.endswith('.log'):
            filepath = os.path.join(metar_dir, filename)
            try:
                metar_df = parse_metar_file(filepath)
                if not metar_df.empty:
                    all_metar_data.append(metar_df)
                    print(f"Processed {filename}: {len(metar_df)} weather records")
            except Exception as e:
                print(f"Error processing {filename}: {e}")
    
    if all_metar_data:
        combined_df = pd.concat(all_metar_data, ignore_index=True)
        # Group by airport and yearmonth to combine overlapping data
        combined_df = combined_df.groupby(["airport", "yearmonth"]).sum().reset_index()
        
        # Apply weather feature creation to the combined dataset
        combined_df = create_weather_features(combined_df)
        print(f"Combined METAR data: {len(combined_df)} total records with weather features")
        return combined_df
    else:
        print("No valid METAR files found")
        return pd.DataFrame()

def create_weather_features(df):
    """
    Create additional weather-derived features for ML models
    """
    # Weather severity score
    df['weather_severity'] = (
        df.get('thunderstorm_days', 0) * 3 +
        df.get('snow_days', 0) * 2 +
        df.get('fog_days', 0) * 1.5 +
        df.get('freezing_days', 0) * 2
    )
    
    # Seasonal weather patterns
    df['adverse_weather_count'] = (
        df.get('thunderstorm_days', 0) +
        df.get('snow_days', 0) +
        df.get('fog_days', 0) +
        df.get('freezing_days', 0)
    )
    
    # Weather impact categories
    df['weather_impact'] = 'Low'
    df.loc[df['weather_severity'] >= 5, 'weather_impact'] = 'Medium'
    df.loc[df['weather_severity'] >= 10, 'weather_impact'] = 'High'
    
    return df

if __name__ == "__main__":
    # Demo usage
    print("METAR Enrichment Module for AINO Aviation Intelligence Platform")
    print("=" * 60)
    
    # Example of processing METAR data
    metar_dir = "data/metar"
    if os.path.exists(metar_dir):
        metar_data = process_metar_directory(metar_dir)
        if not metar_data.empty:
            enhanced_data = create_weather_features(metar_data)
            print("\nSample weather features:")
            print(enhanced_data.head())
            
            # Save processed data
            enhanced_data.to_csv('weather_enhanced_metar_features.csv', index=False)
            print("\nProcessed METAR data saved to 'weather_enhanced_metar_features.csv'")
    else:
        print(f"METAR directory '{metar_dir}' not found")
        print("To use this module, place METAR log files in the 'data/metar' directory")
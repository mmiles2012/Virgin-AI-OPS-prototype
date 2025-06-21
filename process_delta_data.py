#!/usr/bin/env python3
"""
Process Delta Airlines operational data for AINO weather-enhanced delay prediction system
"""

import pandas as pd
import numpy as np
from datetime import datetime
import os

def process_delta_airlines_data():
    """
    Process authentic Delta Airlines operational data
    """
    
    print("🛩️  PROCESSING DELTA AIRLINES OPERATIONAL DATA")
    print("=" * 60)
    
    # Load Delta data
    delta_file = 'attached_assets/Airline_Delay_Cause_1750505746790.csv'
    print(f"Loading Delta data from: {delta_file}")
    
    delta_df = pd.read_csv(delta_file)
    print(f"Loaded {len(delta_df)} Delta operational records")
    print(f"Data covers: {delta_df['year'].min()}-{delta_df['month'].min()} to {delta_df['year'].max()}-{delta_df['month'].max()}")
    
    # Convert airport codes from IATA to ICAO format
    iata_to_icao = {
        'ATL': 'KATL', 'AUS': 'KAUS', 'BNA': 'KBNA', 'BOS': 'KBOS', 'BWI': 'KBWI',
        'CLT': 'KCLT', 'DCA': 'KDCA', 'DEN': 'KDEN', 'DFW': 'KDFW', 'DTW': 'KDTW',
        'EWR': 'KEWR', 'FLL': 'KFLL', 'IAD': 'KIAD', 'IAH': 'KIAH', 'JFK': 'KJFK',
        'LAS': 'KLAS', 'LAX': 'KLAX', 'LGA': 'KLGA', 'MCO': 'KMCO', 'MDW': 'KMDW',
        'MIA': 'KMIA', 'MSP': 'KMSP', 'ORD': 'KORD', 'PHL': 'KPHL', 'PHX': 'KPHX',
        'SAN': 'KSAN', 'SEA': 'KSEA', 'SFO': 'KSFO', 'SLC': 'KSLC', 'TPA': 'KTPA'
    }
    
    # Calculate average delay per flight
    delta_df['avg_delay_per_flight'] = delta_df['arr_delay'] / delta_df['arr_flights']
    delta_df['icao_code'] = delta_df['airport'].map(iata_to_icao)
    
    # Process into standardized format for weather enhancement
    processed_records = []
    
    for _, row in delta_df.iterrows():
        # Create operational record
        record = {
            'icao_code': row['icao_code'],
            'airline_name': 'Delta Air Lines',
            'origin_destination': 'Arrival',  # This is arrival data
            'arrival_departure': 'Arrival',
            'scheduled_charter': 'Scheduled',
            'average_delay_mins': row['avg_delay_per_flight'],
            'total_flights': row['arr_flights'],
            'delayed_flights': row['arr_del15'],
            'weather_delay_mins': row['weather_delay'] / row['arr_flights'] if row['arr_flights'] > 0 else 0,
            'carrier_delay_mins': row['carrier_delay'] / row['arr_flights'] if row['arr_flights'] > 0 else 0,
            'nas_delay_mins': row['nas_delay'] / row['arr_flights'] if row['arr_flights'] > 0 else 0,
            'security_delay_mins': row['security_delay'] / row['arr_flights'] if row['arr_flights'] > 0 else 0,
            'late_aircraft_delay_mins': row['late_aircraft_delay'] / row['arr_flights'] if row['arr_flights'] > 0 else 0,
            'year': row['year'],
            'month': row['month'],
            'data_source': 'Delta Airlines Operational Data'
        }
        processed_records.append(record)
    
    processed_df = pd.DataFrame(processed_records)
    
    # Remove records with missing ICAO codes
    processed_df = processed_df.dropna(subset=['icao_code'])
    
    print(f"Processed {len(processed_df)} Delta operational records")
    print(f"Airports covered: {len(processed_df['icao_code'].unique())} US airports")
    
    return processed_df

def merge_with_weather_data(delta_df):
    """
    Merge Delta data with existing weather conditions
    """
    
    print("\n🌦️  MERGING WITH WEATHER DATA")
    print("-" * 40)
    
    # Load existing weather data
    weather_file = 'data/weather_data.csv'
    if os.path.exists(weather_file):
        weather_df = pd.read_csv(weather_file)
        print(f"Loaded weather data for {len(weather_df)} airports")
        
        # For US airports, we'll use default weather values since our current weather data is UK-focused
        print("Note: Current weather data is UK-focused. Using operational defaults for US airports.")
        
        # Add default weather features for Delta data
        delta_df['visibility'] = 9999  # Clear visibility default
        delta_df['wind_speed'] = 8     # Light wind default
        delta_df['temperature'] = 22   # Moderate temperature
        delta_df['dewpoint'] = 18      # Moderate humidity
        delta_df['flight_rules'] = 'VFR'  # Visual flight rules default
        
        # Calculate weather-based flags
        delta_df['low_visibility_flag'] = False  # Default clear conditions
        delta_df['strong_wind_flag'] = False     # Default light winds
        delta_df['ifr_flag'] = False             # Default VFR conditions
        delta_df['temp_dewpoint_delta'] = delta_df['temperature'] - delta_df['dewpoint']
        delta_df['fog_risk_flag'] = False        # Default no fog risk
        
        # However, use actual weather delay data from Delta to infer conditions
        # If weather delay is significant, adjust flags
        weather_threshold = 5  # minutes average weather delay
        delta_df.loc[delta_df['weather_delay_mins'] > weather_threshold, 'low_visibility_flag'] = True
        delta_df.loc[delta_df['weather_delay_mins'] > weather_threshold, 'ifr_flag'] = True
        
        print(f"Applied weather flags based on Delta weather delay data")
        weather_impacted = len(delta_df[delta_df['weather_delay_mins'] > weather_threshold])
        print(f"Weather-impacted operations: {weather_impacted} ({weather_impacted/len(delta_df)*100:.1f}%)")
        
    else:
        print("No weather data file found. Using operational defaults.")
        # Add minimal weather features
        delta_df['visibility'] = 9999
        delta_df['wind_speed'] = 8
        delta_df['temperature'] = 22
        delta_df['dewpoint'] = 18
        delta_df['flight_rules'] = 'VFR'
        delta_df['low_visibility_flag'] = False
        delta_df['strong_wind_flag'] = False
        delta_df['ifr_flag'] = False
        delta_df['temp_dewpoint_delta'] = 4
        delta_df['fog_risk_flag'] = False
    
    return delta_df

def integrate_with_existing_data(delta_df):
    """
    Integrate Delta data with existing training dataset
    """
    
    print("\n📊 INTEGRATING WITH EXISTING TRAINING DATA")
    print("-" * 50)
    
    # Load existing training data
    existing_file = 'data/latest_training_data.csv'
    if os.path.exists(existing_file):
        existing_df = pd.read_csv(existing_file)
        print(f"Loaded existing training data: {len(existing_df)} records")
        
        # Combine datasets
        combined_df = pd.concat([existing_df, delta_df], ignore_index=True)
        print(f"Combined dataset: {len(combined_df)} total records")
        
    else:
        print("No existing training data found. Using Delta data as foundation.")
        combined_df = delta_df
    
    # Clean and validate data
    combined_df = combined_df.dropna(subset=['average_delay_mins'])
    combined_df = combined_df[combined_df['average_delay_mins'] >= 0]
    combined_df = combined_df.drop_duplicates()
    
    # Save enhanced dataset
    os.makedirs('data', exist_ok=True)
    combined_df.to_csv('data/enhanced_training_data.csv', index=False)
    
    print(f"Saved enhanced training dataset: {len(combined_df)} records")
    
    return combined_df

def analyze_delta_performance(combined_df):
    """
    Analyze Delta Airlines performance metrics
    """
    
    print("\n📈 DELTA AIRLINES PERFORMANCE ANALYSIS")
    print("=" * 60)
    
    # Overall Delta performance
    delta_data = combined_df[combined_df['airline_name'] == 'Delta Air Lines']
    
    if len(delta_data) > 0:
        avg_delay = delta_data['average_delay_mins'].mean()
        median_delay = delta_data['average_delay_mins'].median()
        std_delay = delta_data['average_delay_mins'].std()
        
        print(f"Delta Airlines Operational Summary:")
        print(f"  Total Operations Analyzed: {len(delta_data):,}")
        print(f"  Average Delay: {avg_delay:.1f} minutes")
        print(f"  Median Delay: {median_delay:.1f} minutes")
        print(f"  Standard Deviation: {std_delay:.1f} minutes")
        
        # Delay cause breakdown
        if 'weather_delay_mins' in delta_data.columns:
            weather_avg = delta_data['weather_delay_mins'].mean()
            carrier_avg = delta_data['carrier_delay_mins'].mean()
            nas_avg = delta_data['nas_delay_mins'].mean()
            
            print(f"\nDelay Cause Breakdown (per flight averages):")
            print(f"  Weather Delays: {weather_avg:.1f} minutes ({weather_avg/avg_delay*100:.1f}%)")
            print(f"  Carrier Delays: {carrier_avg:.1f} minutes ({carrier_avg/avg_delay*100:.1f}%)")
            print(f"  National Airspace Delays: {nas_avg:.1f} minutes ({nas_avg/avg_delay*100:.1f}%)")
        
        # Top airports by delay
        airport_performance = delta_data.groupby('icao_code').agg({
            'average_delay_mins': 'mean',
            'weather_delay_mins': 'mean',
            'total_flights': 'sum'
        }).round(1)
        
        airport_performance = airport_performance.sort_values('average_delay_mins', ascending=False).head(10)
        
        print(f"\nTop 10 Delta Airports by Average Delay:")
        print("-" * 50)
        for icao, data in airport_performance.iterrows():
            print(f"  {icao}: {data['average_delay_mins']:.1f} min avg, {data['weather_delay_mins']:.1f} min weather, {data['total_flights']:.0f} flights")
    
    # Cross-airline comparison if other airlines exist
    airline_comparison = combined_df.groupby('airline_name').agg({
        'average_delay_mins': ['mean', 'count']
    }).round(1)
    
    if len(airline_comparison) > 1:
        print(f"\nCross-Airline Performance Comparison:")
        print("-" * 40)
        for airline in airline_comparison.index:
            stats = airline_comparison.loc[airline]
            print(f"  {airline}: {stats[('average_delay_mins', 'mean')]:.1f} min avg ({stats[('average_delay_mins', 'count')]:,.0f} operations)")

def main():
    """
    Main integration workflow
    """
    
    # Process Delta Airlines data
    delta_df = process_delta_airlines_data()
    
    # Merge with weather data
    enhanced_df = merge_with_weather_data(delta_df)
    
    # Integrate with existing training data
    combined_df = integrate_with_existing_data(enhanced_df)
    
    # Analyze performance
    analyze_delta_performance(combined_df)
    
    print("\n✅ DELTA AIRLINES INTEGRATION COMPLETE")
    print("=" * 60)
    print("Enhanced training dataset ready for improved delay predictions")
    print("Cross-airline performance analysis available")
    print("Weather-enhanced model can now leverage Delta operational intelligence")

if __name__ == "__main__":
    main()
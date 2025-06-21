#!/usr/bin/env python3
"""
Test weather data collection with AVWX API
Demonstrates the exact interface: get_weather_batch(icao_codes, api_key)
"""

import os
import sys
import pandas as pd
from weather_data_collector import WeatherDataCollector

def test_weather_batch():
    """Test the exact weather batch interface you requested"""
    
    # Your AVWX API key
    api_key = "apVijXnTpTLwaK_Z8c5qQSsZfLRb6x6WLv6aZQK_gtA"
    
    # Major UK airports for testing
    icao_codes = ['EGLL', 'EGKK', 'EGCC', 'EGGW', 'EGSS', 'EGNX', 'EGPH', 'EGPF']
    
    print("Testing weather data collection...")
    print(f"ICAO codes: {icao_codes}")
    print(f"API key configured: {api_key[:8]}...")
    print("-" * 50)
    
    # Initialize collector
    collector = WeatherDataCollector(api_key)
    
    # Your exact interface call
    weather_df = collector.get_weather_batch(icao_codes, api_key)
    
    print(f"\nWeather data collection completed!")
    print(f"Shape: {weather_df.shape}")
    print(f"Columns: {len(weather_df.columns)}")
    
    # Display the head() as requested
    print("\nweather_df.head():")
    print("=" * 80)
    if not weather_df.empty:
        # Select key columns for display
        display_cols = [
            'airport_icao', 'delay_risk_score', 'operational_impact',
            'visibility_m', 'wind_speed_kt', 'temperature_c',
            'weather_complexity_index', 'visibility_category', 'wind_category'
        ]
        
        available_cols = [col for col in display_cols if col in weather_df.columns]
        print(weather_df[available_cols].head())
        
        # Full feature summary
        print(f"\nAll {len(weather_df.columns)} features:")
        for i, col in enumerate(weather_df.columns):
            if i % 4 == 0:
                print()
            print(f"{col:25}", end=" ")
        print("\n")
        
        # Delay risk analysis
        print("Delay Risk Analysis:")
        print(weather_df['operational_impact'].value_counts())
        print(f"Average delay risk score: {weather_df['delay_risk_score'].mean():.2f}")
        
        # Save results
        output_file = "weather_batch_results.csv"
        weather_df.to_csv(output_file, index=False)
        print(f"\nResults saved to: {output_file}")
        
    else:
        print("No weather data collected - check API connectivity")
    
    return weather_df

if __name__ == "__main__":
    # Run the exact test you requested
    weather_df = test_weather_batch()
    
    # Additional validation
    if not weather_df.empty:
        print(f"\n✓ Successfully collected weather data for {len(weather_df)} airports")
        print(f"✓ Generated {len(weather_df.columns)} ML-ready features")
        print(f"✓ Data ready for model training integration")
    else:
        print("✗ Weather data collection failed - check API configuration")
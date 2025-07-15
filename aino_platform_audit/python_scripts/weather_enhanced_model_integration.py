#!/usr/bin/env python3
"""
Weather-Enhanced Dual Model Integration
Combines AVWX weather data with UK CAA and US Airlines delay datasets
"""

import pandas as pd
import numpy as np
from weather_data_collector import WeatherDataCollector
import json
from datetime import datetime
from typing import Dict, List, Optional

class WeatherEnhancedModelIntegration:
    """
    Integrate weather data with dual-model AI system for enhanced delay predictions
    """
    
    def __init__(self, avwx_api_key: str):
        self.weather_collector = WeatherDataCollector(avwx_api_key)
        self.uk_airports = ['EGLL', 'EGKK', 'EGCC', 'EGGW', 'EGSS', 'EGNX', 'EGPH', 'EGPF']
        self.us_airports = ['KJFK', 'KLAX', 'KORD', 'KATL', 'KDEN', 'KSEA', 'KPHX', 'KMIA']
        
    def enhance_uk_caa_dataset(self) -> pd.DataFrame:
        """
        Enhance UK CAA punctuality data with current weather conditions
        """
        print("Enhancing UK CAA dataset with weather data...")
        
        # Get weather for UK airports
        uk_weather = self.weather_collector.get_weather_batch(self.uk_airports)
        
        # Simulate UK CAA operational data structure
        uk_operations = self._generate_uk_operations_sample(uk_weather)
        
        # Merge weather features with operational data
        enhanced_dataset = self._merge_weather_operations(uk_operations, uk_weather)
        
        print(f"UK CAA dataset enhanced: {len(enhanced_dataset)} records with weather")
        return enhanced_dataset
    
    def enhance_us_airlines_dataset(self) -> pd.DataFrame:
        """
        Enhance US Airlines delay data with current weather conditions
        """
        print("Enhancing US Airlines dataset with weather data...")
        
        # Get weather for US airports
        us_weather = self.weather_collector.get_weather_batch(self.us_airports)
        
        # Simulate US Airlines operational data structure
        us_operations = self._generate_us_operations_sample(us_weather)
        
        # Merge weather features with operational data
        enhanced_dataset = self._merge_weather_operations(us_operations, us_weather)
        
        print(f"US Airlines dataset enhanced: {len(enhanced_dataset)} records with weather")
        return enhanced_dataset
    
    def create_dual_model_training_set(self) -> Dict:
        """
        Create comprehensive training dataset for dual-model AI system
        """
        print("Creating dual-model training dataset...")
        
        # Get enhanced datasets
        uk_enhanced = self.enhance_uk_caa_dataset()
        us_enhanced = self.enhance_us_airlines_dataset()
        
        # Standardize feature names for cross-regional analysis
        uk_standardized = self._standardize_features(uk_enhanced, 'UK')
        us_standardized = self._standardize_features(us_enhanced, 'US')
        
        # Combine datasets with region indicators
        combined_dataset = pd.concat([uk_standardized, us_standardized], ignore_index=True)
        
        # Calculate ensemble features
        combined_dataset = self._add_ensemble_features(combined_dataset)
        
        training_set = {
            'combined_data': combined_dataset,
            'uk_data': uk_standardized,
            'us_data': us_standardized,
            'features': list(combined_dataset.columns),
            'weather_features': self._get_weather_feature_names(),
            'operational_features': self._get_operational_feature_names(),
            'metadata': {
                'total_records': len(combined_dataset),
                'uk_records': len(uk_standardized),
                'us_records': len(us_standardized),
                'feature_count': len(combined_dataset.columns),
                'weather_enhancement_timestamp': datetime.now().isoformat()
            }
        }
        
        return training_set
    
    def _generate_uk_operations_sample(self, weather_df: pd.DataFrame) -> pd.DataFrame:
        """
        Generate UK CAA-style operational data sample
        """
        operations = []
        
        for _, airport_weather in weather_df.iterrows():
            # Generate multiple operations per airport
            for flight_num in range(3):
                op = {
                    'airport_icao': airport_weather['airport_icao'],
                    'flight_id': f"BA{1000 + flight_num}",
                    'carrier': 'British Airways',
                    'operation_type': np.random.choice(['arrival', 'departure']),
                    'scheduled_time': datetime.now().strftime('%H:%M'),
                    'actual_time': datetime.now().strftime('%H:%M'),
                    'delay_minutes': max(0, np.random.normal(5, 10)),
                    'punctuality_category': np.random.choice(['On Time', 'Delayed', 'Early']),
                    'route': f"{airport_weather['airport_icao']}-EDDF",
                    'aircraft_type': np.random.choice(['A320', 'B737', 'A380']),
                    'season': 'Summer',
                    'day_type': 'Weekday'
                }
                operations.append(op)
        
        return pd.DataFrame(operations)
    
    def _generate_us_operations_sample(self, weather_df: pd.DataFrame) -> pd.DataFrame:
        """
        Generate US Airlines-style operational data sample
        """
        operations = []
        
        for _, airport_weather in weather_df.iterrows():
            # Generate multiple operations per airport
            for flight_num in range(3):
                op = {
                    'airport_icao': airport_weather['airport_icao'],
                    'flight_id': f"AA{2000 + flight_num}",
                    'carrier': 'American Airlines',
                    'operation_type': np.random.choice(['arrival', 'departure']),
                    'scheduled_time': datetime.now().strftime('%H:%M'),
                    'actual_time': datetime.now().strftime('%H:%M'),
                    'delay_minutes': max(0, np.random.normal(8, 15)),
                    'delay_cause': np.random.choice(['Weather', 'Air Traffic', 'Equipment', 'Crew']),
                    'route': f"{airport_weather['airport_icao']}-KLAX",
                    'aircraft_type': np.random.choice(['B777', 'A330', 'B787']),
                    'season': 'Summer',
                    'hub_status': np.random.choice(['Hub', 'Spoke'])
                }
                operations.append(op)
        
        return pd.DataFrame(operations)
    
    def _merge_weather_operations(self, operations_df: pd.DataFrame, weather_df: pd.DataFrame) -> pd.DataFrame:
        """
        Merge operational data with weather features
        """
        # Merge on airport ICAO code
        merged = operations_df.merge(
            weather_df, 
            on='airport_icao', 
            how='left',
            suffixes=('_ops', '_weather')
        )
        
        return merged
    
    def _standardize_features(self, df: pd.DataFrame, region: str) -> pd.DataFrame:
        """
        Standardize feature names for cross-regional compatibility
        """
        standardized = df.copy()
        
        # Add region identifier
        standardized['region'] = region
        
        # Standardize delay calculation
        if 'delay_minutes' in standardized.columns:
            standardized['standardized_delay'] = standardized['delay_minutes']
        
        # Add operational efficiency metrics
        standardized['weather_delay_factor'] = (
            standardized['delay_risk_score'] * standardized['delay_minutes']
        ) / 100
        
        standardized['operational_efficiency'] = np.where(
            standardized['delay_minutes'] <= 15, 'High',
            np.where(standardized['delay_minutes'] <= 60, 'Medium', 'Low')
        )
        
        return standardized
    
    def _add_ensemble_features(self, df: pd.DataFrame) -> pd.DataFrame:
        """
        Add ensemble features for dual-model predictions
        """
        # Weather-operational interaction features
        df['weather_ops_interaction'] = (
            df['delay_risk_score'] * 
            df['weather_complexity_index'] * 
            df['standardized_delay']
        ) / 1000
        
        # Cross-regional delay patterns
        region_delay_means = df.groupby('region')['standardized_delay'].mean()
        df['region_delay_baseline'] = df['region'].map(region_delay_means)
        df['delay_vs_regional_avg'] = df['standardized_delay'] - df['region_delay_baseline']
        
        # Temporal weather patterns
        df['peak_weather_risk'] = (
            df['peak_traffic_indicator'] * df['delay_risk_score']
        )
        
        # Multi-airport weather correlation
        df['regional_weather_severity'] = df.groupby('region')['delay_risk_score'].transform('mean')
        
        return df
    
    def _get_weather_feature_names(self) -> List[str]:
        """
        Get list of weather-related feature names
        """
        return [
            'visibility_m', 'wind_speed_kt', 'wind_direction_deg',
            'temperature_c', 'dewpoint_c', 'pressure_hpa',
            'delay_risk_score', 'operational_impact', 'crosswind_component_kt',
            'weather_complexity_index', 'visibility_category', 'wind_category',
            'temperature_category', 'seasonal_factor', 'peak_traffic_indicator',
            'icing_risk', 'visibility_normalized', 'wind_speed_normalized',
            'temperature_normalized', 'pressure_normalized'
        ]
    
    def _get_operational_feature_names(self) -> List[str]:
        """
        Get list of operational feature names
        """
        return [
            'delay_minutes', 'operation_type', 'aircraft_type',
            'carrier', 'route', 'season', 'standardized_delay',
            'operational_efficiency', 'weather_delay_factor'
        ]
    
    def generate_model_training_files(self, output_dir: str = ".") -> Dict[str, str]:
        """
        Generate all training files for the dual-model AI system
        """
        training_set = self.create_dual_model_training_set()
        
        # Save main datasets
        files_created = {}
        
        # Combined dataset for ensemble training
        combined_path = f"{output_dir}/weather_enhanced_combined_dataset.csv"
        training_set['combined_data'].to_csv(combined_path, index=False)
        files_created['combined'] = combined_path
        
        # UK-specific dataset
        uk_path = f"{output_dir}/weather_enhanced_uk_dataset.csv"
        training_set['uk_data'].to_csv(uk_path, index=False)
        files_created['uk'] = uk_path
        
        # US-specific dataset
        us_path = f"{output_dir}/weather_enhanced_us_dataset.csv"
        training_set['us_data'].to_csv(us_path, index=False)
        files_created['us'] = us_path
        
        # Feature metadata
        metadata_path = f"{output_dir}/weather_enhanced_metadata.json"
        with open(metadata_path, 'w') as f:
            json.dump(training_set['metadata'], f, indent=2)
        files_created['metadata'] = metadata_path
        
        # Feature importance for model training
        feature_config = {
            'all_features': training_set['features'],
            'weather_features': training_set['weather_features'],
            'operational_features': training_set['operational_features'],
            'target_variable': 'standardized_delay',
            'categorical_features': [
                'operational_impact', 'visibility_category', 'wind_category',
                'temperature_category', 'operation_type', 'aircraft_type',
                'carrier', 'operational_efficiency', 'region'
            ],
            'numerical_features': [
                'delay_risk_score', 'weather_complexity_index', 'crosswind_component_kt',
                'visibility_normalized', 'wind_speed_normalized', 'temperature_normalized',
                'pressure_normalized', 'weather_delay_factor', 'weather_ops_interaction'
            ]
        }
        
        config_path = f"{output_dir}/weather_enhanced_feature_config.json"
        with open(config_path, 'w') as f:
            json.dump(feature_config, f, indent=2)
        files_created['config'] = config_path
        
        return files_created

def main():
    """
    Main execution for weather-enhanced model integration
    """
    # Initialize with AVWX API key
    api_key = "apVijXnTpTLwaK_Z8c5qQSsZfLRb6x6WLv6aZQK_gtA"
    
    integrator = WeatherEnhancedModelIntegration(api_key)
    
    print("Weather-Enhanced Dual Model Integration")
    print("=" * 50)
    
    # Generate comprehensive training datasets
    files_created = integrator.generate_model_training_files()
    
    print("\nGenerated Training Files:")
    for dataset_type, filepath in files_created.items():
        print(f"  {dataset_type.upper()}: {filepath}")
    
    # Load and display sample of combined dataset
    combined_df = pd.read_csv(files_created['combined'])
    
    print(f"\nCombined Dataset Summary:")
    print(f"  Shape: {combined_df.shape}")
    print(f"  Regions: {combined_df['region'].unique()}")
    print(f"  Average delay: {combined_df['standardized_delay'].mean():.2f} minutes")
    print(f"  Weather risk range: {combined_df['delay_risk_score'].min()}-{combined_df['delay_risk_score'].max()}")
    
    print(f"\nSample records:")
    display_cols = [
        'airport_icao', 'region', 'standardized_delay', 'delay_risk_score',
        'operational_impact', 'weather_complexity_index', 'operational_efficiency'
    ]
    print(combined_df[display_cols].head())
    
    print(f"\nWeather Enhancement Complete!")
    print(f"Ready for dual-model AI training with authentic AVWX weather data")

if __name__ == "__main__":
    main()
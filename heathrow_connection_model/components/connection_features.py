#!/usr/bin/env python3
"""
Connection Feature Engineering for Heathrow Connection Model
Creates ML features from processed flight connection data
"""

import pandas as pd
import numpy as np
from datetime import datetime
from typing import Dict, List
from sklearn.preprocessing import StandardScaler, LabelEncoder

class ConnectionFeatureEngineer:
    """Feature engineering for connection prediction models"""
    
    def __init__(self):
        self.scalers = {}
        self.encoders = {}
        self.feature_importance = {}
        
    def create_features(self, df: pd.DataFrame) -> pd.DataFrame:
        """
        Create comprehensive features for connection prediction
        """
        print("[Features] Engineering connection prediction features...")
        
        if df.empty:
            return df
        
        # Create a copy to avoid modifying original
        features_df = df.copy()
        
        # Time-based features
        features_df = self._add_time_features(features_df)
        
        # Connection timing features
        features_df = self._add_connection_timing_features(features_df)
        
        # Risk assessment features
        features_df = self._add_risk_features(features_df)
        
        # Operational features
        features_df = self._add_operational_features(features_df)
        
        # Airline and alliance features
        features_df = self._add_airline_features(features_df)
        
        # Infrastructure features
        features_df = self._add_infrastructure_features(features_df)
        
        # Historical performance features
        features_df = self._add_performance_features(features_df)
        
        print(f"[Features] Created {features_df.shape[1]} features for {features_df.shape[0]} samples")
        
        return features_df
    
    def _add_time_features(self, df: pd.DataFrame) -> pd.DataFrame:
        """Add time-based features"""
        
        # Hour categories
        df['arrival_hour_category'] = df['arrival_hour'].apply(self._categorize_hour)
        df['departure_hour_category'] = df['departure_hour'].apply(self._categorize_hour)
        
        # Day patterns
        df['is_weekday'] = df['arrival_day_of_week'] < 5
        df['is_monday_friday'] = df['arrival_day_of_week'].isin([0, 4])  # Start/end of week
        
        # Time pressure indicators
        df['time_until_departure'] = df['connection_time_minutes']
        df['time_pressure_level'] = pd.cut(
            df['connection_time_minutes'],
            bins=[0, 60, 90, 120, 180, 999],
            labels=[4, 3, 2, 1, 0]  # Higher = more pressure
        ).astype(float)
        
        # Seasonal features (assuming date available)
        current_month = datetime.now().month
        df['is_summer_season'] = current_month in [6, 7, 8]
        df['is_winter_season'] = current_month in [12, 1, 2]
        df['is_peak_travel_season'] = current_month in [6, 7, 8, 12]
        
        return df
    
    def _add_connection_timing_features(self, df: pd.DataFrame) -> pd.DataFrame:
        """Add connection timing analysis features"""
        
        # Buffer analysis
        df['buffer_adequacy_score'] = np.clip(
            df['connection_buffer'] / df['minimum_connection_time'], 0, 2
        )
        
        df['buffer_category'] = pd.cut(
            df['connection_buffer'],
            bins=[-999, 0, 15, 30, 60, 999],
            labels=['NEGATIVE', 'TIGHT', 'MINIMAL', 'ADEQUATE', 'COMFORTABLE']
        )
        
        # Connection efficiency
        df['connection_efficiency'] = df['minimum_connection_time'] / df['connection_time_minutes']
        df['time_utilization'] = 1 - df['connection_efficiency']
        
        # Delay impact
        df['delay_to_connection_ratio'] = df['arrival_delay_minutes'] / df['connection_time_minutes']
        df['delay_severity'] = pd.cut(
            df['arrival_delay_minutes'],
            bins=[-999, 0, 15, 30, 60, 999],
            labels=[0, 1, 2, 3, 4]
        ).astype(float)
        
        # Critical timing indicators
        df['is_critical_connection'] = (
            (df['connection_buffer'] < 30) |
            (df['arrival_delay_minutes'] > 15) |
            (df['connection_time_minutes'] < 90)
        )
        
        return df
    
    def _add_risk_features(self, df: pd.DataFrame) -> pd.DataFrame:
        """Add risk assessment features"""
        
        # Composite risk score
        df['composite_risk_score'] = (
            df['risk_factor_count'] * 0.3 +
            df['has_tight_connection'].astype(int) * 0.25 +
            df['has_arrival_delay'].astype(int) * 0.25 +
            df['terminal_transfer'].astype(int) * 0.15 +
            df['has_weather_risk'].astype(int) * 0.05
        )
        
        # Risk categories
        df['risk_level'] = pd.cut(
            df['composite_risk_score'],
            bins=[0, 0.3, 0.6, 0.8, 1.0, 999],
            labels=['LOW', 'MEDIUM', 'HIGH', 'CRITICAL', 'EXTREME']
        )
        
        # Specific risk indicators
        df['has_multiple_risks'] = df['risk_factor_count'] >= 2
        df['has_operational_risk'] = df['has_arrival_delay'] | df['has_weather_risk']
        df['has_infrastructure_risk'] = df['terminal_transfer']
        
        # Success probability adjustment
        df['risk_adjusted_probability'] = df['success_probability'] * (1 - df['composite_risk_score'] * 0.2)
        
        return df
    
    def _add_operational_features(self, df: pd.DataFrame) -> pd.DataFrame:
        """Add operational complexity features"""
        
        # Passenger load impact
        df['passenger_load_category'] = pd.cut(
            df['estimated_passengers'],
            bins=[0, 150, 250, 350, 999],
            labels=['SMALL', 'MEDIUM', 'LARGE', 'EXTRA_LARGE']
        )
        
        df['passengers_per_minute'] = df['estimated_passengers'] / df['connection_time_minutes']
        
        # Aircraft complexity
        df['aircraft_complexity_score'] = self._calculate_aircraft_complexity(df)
        
        # International complexity
        df['international_complexity'] = (
            df['is_international_arrival'].astype(int) +
            df['is_international_departure'].astype(int)
        )
        
        # Service complexity
        df['service_complexity'] = (
            df['international_complexity'] +
            df['terminal_transfer'].astype(int) +
            (df['estimated_passengers'] > 300).astype(int)
        )
        
        return df
    
    def _add_airline_features(self, df: pd.DataFrame) -> pd.DataFrame:
        """Add airline and alliance-specific features"""
        
        # Virgin Atlantic priority
        df['virgin_atlantic_priority'] = (
            df['is_virgin_atlantic_arrival'].astype(int) * 0.4 +
            df['is_virgin_atlantic_departure'].astype(int) * 0.6
        )
        
        # Alliance coordination benefit
        df['alliance_coordination_score'] = 0.0
        df.loc[df['is_virgin_skyteam_connection'], 'alliance_coordination_score'] = 0.8
        df.loc[df['same_airline'], 'alliance_coordination_score'] = 1.0
        
        # Airline compatibility
        df['airline_synergy'] = (
            df['same_airline'].astype(int) * 0.5 +
            df['alliance_connection'].astype(int) * 0.3 +
            df['is_virgin_atlantic_departure'].astype(int) * 0.2
        )
        
        # Connection type classification
        df['connection_type'] = 'OTHER'
        df.loc[df['same_airline'], 'connection_type'] = 'SAME_AIRLINE'
        df.loc[df['is_virgin_skyteam_connection'], 'connection_type'] = 'VIRGIN_SKYTEAM'
        df.loc[df['is_virgin_atlantic_departure'] & df['is_virgin_atlantic_arrival'], 'connection_type'] = 'VIRGIN_INTERNAL'
        
        return df
    
    def _add_infrastructure_features(self, df: pd.DataFrame) -> pd.DataFrame:
        """Add airport infrastructure features"""
        
        # Terminal efficiency
        df['terminal_efficiency_score'] = 1.0
        df.loc[df['terminal_transfer'], 'terminal_efficiency_score'] = 0.7
        
        # Gate proximity (simulated based on terminal)
        df['gate_proximity_score'] = self._calculate_gate_proximity(df)
        
        # Heathrow specific features
        df['is_heathrow_t3_connection'] = (
            (df['arrival_terminal'] == 'T3') & (df['departure_terminal'] == 'T3')
        )
        
        df['is_cross_terminal_connection'] = df['terminal_transfer']
        
        # Infrastructure load
        df['terminal_congestion_indicator'] = self._calculate_terminal_congestion(df)
        
        return df
    
    def _add_performance_features(self, df: pd.DataFrame) -> pd.DataFrame:
        """Add historical performance-based features"""
        
        # Route performance (simulated)
        df['route_reliability_score'] = self._calculate_route_reliability(df)
        
        # Time slot performance
        df['time_slot_performance'] = self._calculate_time_slot_performance(df)
        
        # Connection success likelihood
        df['historical_success_rate'] = self._estimate_historical_success_rate(df)
        
        # Performance trend
        df['performance_trend_indicator'] = np.random.uniform(0.8, 1.2, len(df))  # Placeholder
        
        return df
    
    def encode_categorical_features(self, df: pd.DataFrame) -> pd.DataFrame:
        """Encode categorical features for ML"""
        
        categorical_features = [
            'arrival_hour_category', 'departure_hour_category', 'buffer_category',
            'risk_level', 'passenger_load_category', 'connection_type'
        ]
        
        for feature in categorical_features:
            if feature in df.columns:
                if feature not in self.encoders:
                    self.encoders[feature] = LabelEncoder()
                    df[f'{feature}_encoded'] = self.encoders[feature].fit_transform(df[feature].astype(str))
                else:
                    df[f'{feature}_encoded'] = self.encoders[feature].transform(df[feature].astype(str))
        
        return df
    
    def scale_numerical_features(self, df: pd.DataFrame, features: List[str] = None) -> pd.DataFrame:
        """Scale numerical features for ML"""
        
        if features is None:
            features = [
                'connection_time_minutes', 'minimum_connection_time', 'connection_buffer',
                'arrival_delay_minutes', 'estimated_passengers', 'composite_risk_score',
                'buffer_adequacy_score', 'connection_efficiency', 'service_complexity'
            ]
        
        available_features = [f for f in features if f in df.columns]
        
        for feature in available_features:
            if feature not in self.scalers:
                self.scalers[feature] = StandardScaler()
                df[f'{feature}_scaled'] = self.scalers[feature].fit_transform(df[[feature]])
            else:
                df[f'{feature}_scaled'] = self.scalers[feature].transform(df[[feature]])
        
        return df
    
    def get_ml_features(self, df: pd.DataFrame) -> List[str]:
        """Get the final list of features for ML training"""
        
        ml_features = [
            # Basic timing features
            'arrival_hour', 'departure_hour', 'arrival_day_of_week',
            'connection_time_minutes', 'minimum_connection_time', 'connection_buffer',
            
            # Delay and risk features
            'arrival_delay_minutes', 'risk_factor_count', 'composite_risk_score',
            
            # Boolean features
            'terminal_transfer', 'is_international_arrival', 'is_international_departure',
            'is_virgin_atlantic_arrival', 'is_virgin_atlantic_departure',
            'is_virgin_skyteam_connection', 'has_tight_connection', 'has_arrival_delay',
            'is_weekend', 'is_critical_connection', 'has_multiple_risks',
            
            # Derived features
            'buffer_adequacy_score', 'connection_efficiency', 'time_pressure_level',
            'international_complexity', 'service_complexity', 'virgin_atlantic_priority',
            'alliance_coordination_score', 'terminal_efficiency_score',
            
            # Performance features
            'route_reliability_score', 'time_slot_performance', 'historical_success_rate'
        ]
        
        # Return only features that exist in the dataframe
        return [f for f in ml_features if f in df.columns]
    
    # Helper methods
    def _categorize_hour(self, hour: int) -> str:
        """Categorize hour into operational periods"""
        if 6 <= hour <= 10:
            return 'MORNING_PEAK'
        elif 11 <= hour <= 14:
            return 'MIDDAY'
        elif 15 <= hour <= 19:
            return 'EVENING_PEAK'
        elif 20 <= hour <= 23:
            return 'EVENING'
        else:
            return 'NIGHT'
    
    def _calculate_aircraft_complexity(self, df: pd.DataFrame) -> pd.Series:
        """Calculate aircraft complexity score"""
        complexity = pd.Series(1.0, index=df.index)
        
        # Wide-body aircraft are more complex
        wide_body_mask = df['arrival_aircraft'].str.contains('A350|A330|B787|B777|A380', na=False)
        complexity.loc[wide_body_mask] = 1.2
        
        return complexity
    
    def _calculate_gate_proximity(self, df: pd.DataFrame) -> pd.Series:
        """Calculate gate proximity score"""
        proximity = pd.Series(1.0, index=df.index)
        
        # Same terminal gets higher score
        same_terminal_mask = ~df['terminal_transfer']
        proximity.loc[same_terminal_mask] = 1.0
        proximity.loc[~same_terminal_mask] = 0.6
        
        return proximity
    
    def _calculate_terminal_congestion(self, df: pd.DataFrame) -> pd.Series:
        """Calculate terminal congestion indicator"""
        # Simulate congestion based on peak hours and terminal
        congestion = pd.Series(0.5, index=df.index)
        
        peak_mask = df['is_peak_arrival'] | df['is_peak_departure']
        congestion.loc[peak_mask] = 0.8
        
        return congestion
    
    def _calculate_route_reliability(self, df: pd.DataFrame) -> pd.Series:
        """Calculate route reliability score"""
        # Simulate based on route characteristics
        reliability = pd.Series(0.85, index=df.index)
        
        # Virgin Atlantic routes are more reliable
        va_mask = df['is_virgin_atlantic_arrival'] | df['is_virgin_atlantic_departure']
        reliability.loc[va_mask] = 0.9
        
        # International routes may have more delays
        intl_mask = df['is_international_arrival'] & df['is_international_departure']
        reliability.loc[intl_mask] *= 0.95
        
        return reliability
    
    def _calculate_time_slot_performance(self, df: pd.DataFrame) -> pd.Series:
        """Calculate time slot performance score"""
        performance = pd.Series(0.8, index=df.index)
        
        # Peak hours have lower performance
        peak_mask = df['is_peak_arrival'] | df['is_peak_departure']
        performance.loc[peak_mask] = 0.7
        
        # Off-peak hours have better performance
        off_peak_mask = ~peak_mask
        performance.loc[off_peak_mask] = 0.85
        
        return performance
    
    def _estimate_historical_success_rate(self, df: pd.DataFrame) -> pd.Series:
        """Estimate historical success rate for similar connections"""
        base_rate = pd.Series(0.75, index=df.index)
        
        # Adjust based on connection characteristics
        good_buffer_mask = df['connection_buffer'] > 60
        base_rate.loc[good_buffer_mask] = 0.85
        
        tight_connection_mask = df['connection_buffer'] < 30
        base_rate.loc[tight_connection_mask] = 0.6
        
        va_connection_mask = df['is_virgin_atlantic_departure']
        base_rate.loc[va_connection_mask] *= 1.1
        
        return np.clip(base_rate, 0.3, 0.95)

def main():
    """Test the feature engineer"""
    print("Testing Connection Feature Engineer")
    print("=" * 40)
    
    # Create sample data
    sample_data = {
        'arrival_hour': [6, 8, 10, 14, 18],
        'departure_hour': [9, 11, 13, 17, 21],
        'arrival_day_of_week': [1, 2, 5, 6, 0],
        'connection_time_minutes': [120, 90, 150, 180, 75],
        'minimum_connection_time': [75, 75, 90, 90, 75],
        'connection_buffer': [45, 15, 60, 90, 0],
        'arrival_delay_minutes': [5, 20, 0, 10, 30],
        'terminal_transfer': [False, True, False, True, True],
        'estimated_passengers': [280, 320, 250, 180, 350],
        'is_international_arrival': [True, True, False, True, True],
        'is_international_departure': [True, False, True, True, False],
        'is_virgin_atlantic_arrival': [True, True, False, False, True],
        'is_virgin_atlantic_departure': [False, True, True, False, True],
        'is_virgin_skyteam_connection': [True, False, False, False, False],
        'risk_factor_count': [1, 3, 0, 2, 4],
        'has_tight_connection': [False, True, False, False, True],
        'has_arrival_delay': [False, True, False, False, True],
        'has_weather_risk': [False, False, False, True, False],
        'same_airline': [False, True, False, False, False],
        'success_probability': [0.8, 0.6, 0.9, 0.7, 0.5],
        'arrival_aircraft': ['A350', 'B787', 'A330', 'B737', 'A350'],
        'is_peak_arrival': [True, True, False, False, True],
        'is_peak_departure': [False, False, True, True, False],
        'is_weekend': [False, False, True, True, False],
        'alliance_connection': [True, False, False, False, False]
    }
    
    df = pd.DataFrame(sample_data)
    
    # Test feature engineering
    engineer = ConnectionFeatureEngineer()
    
    features_df = engineer.create_features(df)
    print(f"Original features: {len(df.columns)}")
    print(f"Engineered features: {len(features_df.columns)}")
    
    # Encode categorical features
    features_df = engineer.encode_categorical_features(features_df)
    
    # Scale numerical features
    features_df = engineer.scale_numerical_features(features_df)
    
    # Get ML features
    ml_features = engineer.get_ml_features(features_df)
    print(f"ML features: {len(ml_features)}")
    
    print("\nSample of engineered features:")
    for col in ml_features[:10]:
        print(f"  {col}: {features_df[col].iloc[0]}")
    
    # Save results
    features_df.to_csv('heathrow_engineered_features.csv', index=False)
    print(f"\nFeatures saved to heathrow_engineered_features.csv")

if __name__ == "__main__":
    main()
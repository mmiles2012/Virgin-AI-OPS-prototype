#!/usr/bin/env python3
"""
Flight Data Processing for Heathrow Connection Model
Processes raw FlightAware data into ML-ready format
"""

import pandas as pd
import numpy as np
from datetime import datetime, timedelta
from typing import Dict, List, Tuple
import json

class FlightDataProcessor:
    """Processes flight data for connection prediction modeling"""
    
    def __init__(self):
        self.processed_data = None
        self.connection_pairs = []
        
    def process_connection_data(self, raw_data: Dict) -> pd.DataFrame:
        """
        Process raw connection data into structured DataFrame for ML training
        """
        print("[Processing] Converting flight data to ML format...")
        
        arrivals = raw_data.get('arrivals', [])
        departures = raw_data.get('departures', [])
        connections = raw_data.get('connection_opportunities', [])
        
        # Create comprehensive dataset
        processed_records = []
        
        for connection in connections:
            # Find corresponding arrival and departure flights
            arrival = self._find_flight_by_number(arrivals, connection['arrival_flight'])
            departure = self._find_flight_by_number(departures, connection['departure_flight'])
            
            if arrival and departure:
                record = self._create_connection_record(arrival, departure, connection)
                processed_records.append(record)
        
        # Convert to DataFrame
        df = pd.DataFrame(processed_records)
        
        if not df.empty:
            # Add derived features
            df = self._add_derived_features(df)
            
            # Clean and validate data
            df = self._clean_data(df)
            
            print(f"[Processing] Created dataset with {len(df)} connection records")
            print(f"[Processing] Features: {list(df.columns)}")
        
        self.processed_data = df
        return df
    
    def _create_connection_record(self, arrival: Dict, departure: Dict, connection: Dict) -> Dict:
        """Create a single connection record with all relevant features"""
        
        # Parse times
        arr_time = self._parse_datetime(arrival.get('actual_arrival') or arrival.get('scheduled_arrival'))
        dep_time = self._parse_datetime(departure.get('scheduled_departure'))
        
        # Basic connection info
        record = {
            # Flight identifiers
            'arrival_flight': arrival['flight_number'],
            'departure_flight': departure['flight_number'],
            'arrival_airline': arrival.get('airline', 'Unknown'),
            'departure_airline': departure.get('airline', 'Unknown'),
            
            # Aircraft types
            'arrival_aircraft': arrival.get('aircraft_type', 'Unknown'),
            'departure_aircraft': departure.get('aircraft_type', 'Unknown'),
            
            # Route information
            'origin_airport': arrival.get('origin', 'Unknown'),
            'destination_airport': departure.get('destination', 'Unknown'),
            
            # Time features
            'arrival_hour': arr_time.hour if arr_time else 12,
            'departure_hour': dep_time.hour if dep_time else 12,
            'arrival_day_of_week': arr_time.weekday() if arr_time else 3,
            'departure_day_of_week': dep_time.weekday() if dep_time else 3,
            
            # Connection metrics
            'connection_time_minutes': connection.get('connection_time_minutes', 90),
            'minimum_connection_time': connection.get('minimum_connection_time', 75),
            'connection_buffer': connection.get('connection_time_minutes', 90) - connection.get('minimum_connection_time', 75),
            
            # Terminal and gate info
            'arrival_terminal': arrival.get('terminal', 'Unknown'),
            'departure_terminal': departure.get('terminal', 'Unknown'),
            'terminal_transfer': arrival.get('terminal') != departure.get('terminal'),
            'arrival_gate': arrival.get('gate', 'Unknown'),
            'departure_gate': departure.get('gate', 'Unknown'),
            
            # Delay and status
            'arrival_delay_minutes': arrival.get('delay_minutes', 0),
            'arrival_status': arrival.get('status', 'Unknown'),
            'departure_status': departure.get('status', 'Scheduled'),
            
            # Passenger and capacity
            'estimated_passengers': arrival.get('passenger_count', 200),
            'is_international_arrival': arrival.get('is_international', True),
            'is_international_departure': self._is_international_dest(departure.get('destination', '')),
            
            # Virgin Atlantic specific
            'is_virgin_atlantic_arrival': 'Virgin Atlantic' in arrival.get('airline', ''),
            'is_virgin_atlantic_departure': departure.get('is_virgin_atlantic', False),
            'is_virgin_skyteam_connection': self._is_virgin_skyteam_connection(arrival, departure),
            
            # Risk factors
            'risk_factor_count': len(connection.get('risk_factors', [])),
            'has_weather_risk': 'WEATHER_IMPACT' in connection.get('risk_factors', []),
            'has_tight_connection': 'TIGHT_CONNECTION' in connection.get('risk_factors', []),
            'has_arrival_delay': 'ARRIVAL_DELAY' in connection.get('risk_factors', []),
            
            # Target variable
            'success_probability': connection.get('success_probability', 0.5),
            'connection_success': connection.get('success_probability', 0.5) > 0.7  # Binary target
        }
        
        return record
    
    def _add_derived_features(self, df: pd.DataFrame) -> pd.DataFrame:
        """Add calculated features for better ML performance"""
        
        # Time-based features
        df['is_peak_arrival'] = ((df['arrival_hour'] >= 7) & (df['arrival_hour'] <= 10)) | \
                               ((df['arrival_hour'] >= 17) & (df['arrival_hour'] <= 20))
        
        df['is_peak_departure'] = ((df['departure_hour'] >= 7) & (df['departure_hour'] <= 10)) | \
                                 ((df['departure_hour'] >= 17) & (df['departure_hour'] <= 20))
        
        df['is_weekend'] = df['arrival_day_of_week'] >= 5
        
        # Connection complexity
        df['connection_complexity'] = (
            df['terminal_transfer'].astype(int) * 2 +
            df['is_international_arrival'].astype(int) +
            df['is_international_departure'].astype(int) +
            (df['arrival_delay_minutes'] > 15).astype(int)
        )
        
        # Buffer adequacy
        df['buffer_ratio'] = df['connection_buffer'] / df['minimum_connection_time']
        df['has_adequate_buffer'] = df['buffer_ratio'] > 0.5
        
        # Airline compatibility
        df['same_airline'] = df['arrival_airline'] == df['departure_airline']
        df['alliance_connection'] = df['is_virgin_skyteam_connection']
        
        # Priority scoring
        df['priority_score'] = (
            df['is_virgin_atlantic_departure'].astype(int) * 3 +
            df['alliance_connection'].astype(int) * 2 +
            df['estimated_passengers'] / 100
        )
        
        return df
    
    def _clean_data(self, df: pd.DataFrame) -> pd.DataFrame:
        """Clean and validate the dataset"""
        
        # Remove records with invalid connection times
        df = df[df['connection_time_minutes'] > 0]
        df = df[df['connection_time_minutes'] < 720]  # Less than 12 hours
        
        # Fill missing values
        numeric_columns = df.select_dtypes(include=[np.number]).columns
        df[numeric_columns] = df[numeric_columns].fillna(df[numeric_columns].median())
        
        categorical_columns = df.select_dtypes(include=['object']).columns
        df[categorical_columns] = df[categorical_columns].fillna('Unknown')
        
        # Cap extreme values
        df['arrival_delay_minutes'] = np.clip(df['arrival_delay_minutes'], -60, 300)
        df['connection_time_minutes'] = np.clip(df['connection_time_minutes'], 30, 600)
        
        return df
    
    def create_training_dataset(self, df: pd.DataFrame) -> Tuple[pd.DataFrame, pd.DataFrame]:
        """Split features and target for ML training"""
        
        # Feature columns for ML
        feature_columns = [
            'arrival_hour', 'departure_hour', 'arrival_day_of_week', 'departure_day_of_week',
            'connection_time_minutes', 'minimum_connection_time', 'connection_buffer',
            'terminal_transfer', 'arrival_delay_minutes', 'estimated_passengers',
            'is_international_arrival', 'is_international_departure',
            'is_virgin_atlantic_arrival', 'is_virgin_atlantic_departure',
            'is_virgin_skyteam_connection', 'risk_factor_count',
            'has_weather_risk', 'has_tight_connection', 'has_arrival_delay',
            'is_peak_arrival', 'is_peak_departure', 'is_weekend',
            'connection_complexity', 'buffer_ratio', 'has_adequate_buffer',
            'same_airline', 'alliance_connection', 'priority_score'
        ]
        
        # Ensure all feature columns exist
        available_features = [col for col in feature_columns if col in df.columns]
        
        X = df[available_features].copy()
        y = df['success_probability'].copy()  # Can also use 'connection_success' for binary classification
        
        # Convert boolean columns to int for ML compatibility
        bool_columns = X.select_dtypes(include=['bool']).columns
        X[bool_columns] = X[bool_columns].astype(int)
        
        print(f"[Processing] Training features: {len(available_features)}")
        print(f"[Processing] Training samples: {len(X)}")
        
        return X, y
    
    def generate_historical_simulation(self, days: int = 30) -> pd.DataFrame:
        """Generate historical connection data for training when real data is limited"""
        
        print(f"[Processing] Generating {days} days of historical connection data...")
        
        records = []
        base_date = datetime.now() - timedelta(days=days)
        
        # Virgin Atlantic flight schedule patterns
        va_arrivals = [
            {'flight': 'VS11', 'origin': 'BOS', 'hour': 6, 'terminal': 'T3'},
            {'flight': 'VS25', 'origin': 'JFK', 'hour': 7, 'terminal': 'T3'},
            {'flight': 'VS103', 'origin': 'ATL', 'hour': 8, 'terminal': 'T3'},
            {'flight': 'VS355', 'origin': 'BOM', 'hour': 9, 'terminal': 'T3'},
        ]
        
        va_departures = [
            {'flight': 'VS12', 'dest': 'BOS', 'hour': 11, 'terminal': 'T3'},
            {'flight': 'VS26', 'dest': 'JFK', 'hour': 13, 'terminal': 'T3'},
            {'flight': 'VS104', 'dest': 'ATL', 'hour': 15, 'terminal': 'T3'},
        ]
        
        # SkyTeam departures
        skyteam_deps = [
            {'flight': 'AF1380', 'dest': 'CDG', 'hour': 10, 'terminal': 'T4'},
            {'flight': 'KL1007', 'dest': 'AMS', 'hour': 12, 'terminal': 'T4'},
            {'flight': 'DL32', 'dest': 'JFK', 'hour': 14, 'terminal': 'T4'},
        ]
        
        for day in range(days):
            current_date = base_date + timedelta(days=day)
            
            # Generate connections for each day
            for arrival in va_arrivals:
                for departure in va_departures + skyteam_deps:
                    
                    # Calculate connection time
                    conn_time = (departure['hour'] - arrival['hour']) * 60
                    if conn_time > 60 and conn_time < 480:  # 1-8 hours
                        
                        # Add some randomness
                        delay = np.random.normal(0, 15)  # Average delay
                        conn_time += delay
                        
                        record = {
                            'arrival_flight': arrival['flight'],
                            'departure_flight': departure['flight'],
                            'arrival_airline': 'Virgin Atlantic',
                            'departure_airline': 'Virgin Atlantic' if departure['flight'].startswith('VS') else 'SkyTeam',
                            'arrival_aircraft': 'A350',
                            'departure_aircraft': 'A350' if departure['flight'].startswith('VS') else 'B777',
                            'origin_airport': arrival['origin'],
                            'destination_airport': departure['dest'],
                            'arrival_hour': arrival['hour'],
                            'departure_hour': departure['hour'],
                            'arrival_day_of_week': current_date.weekday(),
                            'departure_day_of_week': current_date.weekday(),
                            'connection_time_minutes': max(30, conn_time),
                            'minimum_connection_time': 90 if departure['terminal'] != arrival['terminal'] else 75,
                            'connection_buffer': max(0, conn_time - 75),
                            'arrival_terminal': arrival['terminal'],
                            'departure_terminal': departure['terminal'],
                            'terminal_transfer': arrival['terminal'] != departure['terminal'],
                            'arrival_gate': f"{arrival['terminal'][1]}{np.random.randint(10, 20)}",
                            'departure_gate': f"{departure['terminal'][1]}{np.random.randint(10, 20)}",
                            'arrival_delay_minutes': max(0, delay),
                            'arrival_status': 'ARRIVED',
                            'departure_status': 'SCHEDULED',
                            'estimated_passengers': np.random.randint(200, 350),
                            'is_international_arrival': True,
                            'is_international_departure': departure['dest'] not in ['MAN', 'EDI', 'GLA'],
                            'is_virgin_atlantic_arrival': True,
                            'is_virgin_atlantic_departure': departure['flight'].startswith('VS'),
                            'is_virgin_skyteam_connection': not departure['flight'].startswith('VS'),
                            'risk_factor_count': np.random.randint(0, 3),
                            'has_weather_risk': np.random.random() < 0.1,
                            'has_tight_connection': conn_time < 90,
                            'has_arrival_delay': delay > 15,
                            'success_probability': self._calculate_sim_success_prob(conn_time, delay, arrival, departure),
                        }
                        
                        record['connection_success'] = record['success_probability'] > 0.7
                        records.append(record)
        
        df = pd.DataFrame(records)
        df = self._add_derived_features(df)
        
        print(f"[Processing] Generated {len(df)} historical connection records")
        return df
    
    def _calculate_sim_success_prob(self, conn_time: float, delay: float, arrival: Dict, departure: Dict) -> float:
        """Calculate simulated success probability for historical data"""
        
        base_prob = min(0.95, 0.4 + (conn_time - 75) / 300)
        
        # Adjust for delays
        if delay > 15:
            base_prob *= 0.8
        
        # Adjust for terminal transfer
        if arrival['terminal'] != departure['terminal']:
            base_prob *= 0.9
        
        # Adjust for Virgin Atlantic connections
        if departure['flight'].startswith('VS'):
            base_prob *= 1.1
        
        return max(0.1, min(0.95, base_prob))
    
    # Utility methods
    def _find_flight_by_number(self, flights: List[Dict], flight_number: str) -> Dict:
        """Find flight by flight number"""
        for flight in flights:
            if flight.get('flight_number') == flight_number:
                return flight
        return None
    
    def _parse_datetime(self, time_str: str) -> datetime:
        """Parse datetime string"""
        if not time_str:
            return datetime.now()
        try:
            return datetime.fromisoformat(time_str.replace('Z', '+00:00'))
        except:
            return datetime.now()
    
    def _is_international_dest(self, dest_code: str) -> bool:
        """Check if destination is international"""
        if not dest_code:
            return True
        return not dest_code.startswith('EG')  # UK airports start with EG
    
    def _is_virgin_skyteam_connection(self, arrival: Dict, departure: Dict) -> bool:
        """Check if this is a Virgin Atlantic to SkyTeam connection"""
        va_arrival = 'Virgin Atlantic' in arrival.get('airline', '')
        skyteam_departure = departure.get('departure_airline', '') in ['Air France', 'KLM', 'Delta', 'SkyTeam']
        return va_arrival and skyteam_departure

def main():
    """Test the flight data processor"""
    print("Testing Flight Data Processor")
    print("=" * 40)
    
    processor = FlightDataProcessor()
    
    # Generate historical data for testing
    historical_df = processor.generate_historical_simulation(days=14)
    
    print(f"\nHistorical dataset shape: {historical_df.shape}")
    print(f"Success rate: {historical_df['connection_success'].mean():.1%}")
    print(f"Average connection time: {historical_df['connection_time_minutes'].mean():.1f} minutes")
    
    # Create training dataset
    X, y = processor.create_training_dataset(historical_df)
    
    print(f"\nTraining features: {X.shape[1]}")
    print(f"Training samples: {X.shape[0]}")
    
    # Show feature importance summary
    print("\nFeature Summary:")
    for col in X.columns[:10]:  # Show first 10 features
        print(f"  {col}: {X[col].dtype}")
    
    # Save processed data
    historical_df.to_csv('heathrow_connection_historical_data.csv', index=False)
    X.to_csv('heathrow_connection_features.csv', index=False)
    
    print(f"\nData saved to CSV files")

if __name__ == "__main__":
    main()
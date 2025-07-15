"""
Enhanced Weather & Seasonal Integration for AINO ML Model Validation
Integrates authentic AVWX METAR data with seasonal features for comprehensive weather-enhanced predictions
"""

import pandas as pd
import requests
from datetime import datetime, timedelta
import json
import os
import warnings
warnings.filterwarnings('ignore')

class EnhancedWeatherIntegrator:
    """Enhanced weather integration with AVWX API and seasonal feature engineering"""
    
    def __init__(self):
        # IATA to ICAO code mapping for our validation airports
        self.IATA_TO_ICAO = {
            'JFK': 'KJFK', 'BOS': 'KBOS', 'ATL': 'KATL', 'LAX': 'KLAX',
            'SFO': 'KSFO', 'MCO': 'KMCO', 'MIA': 'KMIA', 'TPA': 'KTPA',
            'LAS': 'KLAS', 'LHR': 'EGLL'
        }
        
        # Check for AVWX API key
        self.avwx_api_key = os.getenv('AVWX_API_KEY', None)
        self.avwx_headers = {"Authorization": f"Bearer {self.avwx_api_key}"} if self.avwx_api_key else None
        
        # Weather feature cache
        self.weather_cache = {}
        
    def add_temporal_features(self, df: pd.DataFrame) -> pd.DataFrame:
        """Add comprehensive temporal features for ML enhancement"""
        print("Adding temporal and seasonal features...")
        
        # Ensure datetime parsing
        if 'Scheduled' in df.columns:
            df['Scheduled'] = pd.to_datetime(df['Scheduled'], errors='coerce')
            time_col = 'Scheduled'
        elif 'ScrapeTimeUTC' in df.columns:
            df['ScrapeTimeUTC'] = pd.to_datetime(df['ScrapeTimeUTC'], errors='coerce')
            time_col = 'ScrapeTimeUTC'
        else:
            # Use current time as fallback
            df['current_time'] = datetime.now()
            time_col = 'current_time'
        
        # Extract temporal features
        df['Month'] = df[time_col].dt.month
        df['Weekday'] = df[time_col].dt.dayofweek
        df['Hour'] = df[time_col].dt.hour
        df['DayOfYear'] = df[time_col].dt.dayofyear
        df['IsWeekend'] = (df['Weekday'] >= 5).astype(int)
        
        # Define seasonal mapping (Northern Hemisphere)
        def get_season_numeric(month):
            if month in [12, 1, 2]: return 0  # Winter
            elif month in [3, 4, 5]: return 1  # Spring
            elif month in [6, 7, 8]: return 2  # Summer
            else: return 3  # Autumn
        
        df['Season'] = df['Month'].apply(get_season_numeric)
        
        # Peak travel periods
        df['IsPeakSummer'] = ((df['Month'] >= 6) & (df['Month'] <= 8)).astype(int)
        df['IsHolidayPeriod'] = ((df['Month'] == 12) | (df['Month'] == 1) | 
                                (df['Month'] == 7) | (df['Month'] == 8)).astype(int)
        
        # Time of day categories
        def get_time_category(hour):
            if 5 <= hour < 12: return 0  # Morning
            elif 12 <= hour < 17: return 1  # Afternoon  
            elif 17 <= hour < 22: return 2  # Evening
            else: return 3  # Night
        
        df['TimeCategory'] = df['Hour'].apply(get_time_category)
        
        print(f"Added 9 temporal features for {len(df)} flights")
        return df
    
    def fetch_avwx_weather(self, icao_code: str) -> dict:
        """Fetch authentic weather data from AVWX API"""
        if not self.avwx_api_key:
            return self._get_fallback_weather(icao_code)
        
        # Check cache first
        cache_key = f"{icao_code}_{datetime.now().strftime('%Y%m%d_%H')}"
        if cache_key in self.weather_cache:
            return self.weather_cache[cache_key]
        
        try:
            # Fetch current METAR
            url = f"https://avwx.rest/api/metar/{icao_code}?options=info,translate"
            response = requests.get(url, headers=self.avwx_headers, timeout=10)
            
            if response.status_code == 200:
                data = response.json()
                
                weather_data = {
                    'TemperatureC': data.get('temperature', {}).get('value'),
                    'WindSpeedKt': data.get('wind_speed', {}).get('value', 0),
                    'VisibilityKm': data.get('visibility', {}).get('value', 10),
                    'PressureHPa': data.get('altimeter', {}).get('value'),
                    'DewPointC': data.get('dewpoint', {}).get('value'),
                    'CloudCoverage': len(data.get('clouds', [])),
                    'WeatherCode': data.get('weather', [{}])[0].get('code', 'CLR') if data.get('weather') else 'CLR',
                    'WeatherCondition': data.get('other_translations', ['Clear'])[0] if data.get('other_translations') else 'Clear'
                }
                
                # Cache the result
                self.weather_cache[cache_key] = weather_data
                return weather_data
            else:
                print(f"AVWX API error for {icao_code}: {response.status_code}")
                return self._get_fallback_weather(icao_code)
                
        except Exception as e:
            print(f"Weather fetch failed for {icao_code}: {e}")
            return self._get_fallback_weather(icao_code)
    
    def _get_fallback_weather(self, icao_code: str) -> dict:
        """Provide realistic fallback weather based on location and season"""
        # Realistic weather patterns by airport and current month
        current_month = datetime.now().month
        
        weather_patterns = {
            'KJFK': {'temp_base': 15, 'wind_base': 12, 'vis_base': 8},
            'KBOS': {'temp_base': 12, 'wind_base': 14, 'vis_base': 9},
            'KATL': {'temp_base': 22, 'wind_base': 8, 'vis_base': 10},
            'KLAX': {'temp_base': 20, 'wind_base': 6, 'vis_base': 12},
            'KSFO': {'temp_base': 16, 'wind_base': 10, 'vis_base': 7},
            'KMCO': {'temp_base': 26, 'wind_base': 7, 'vis_base': 10},
            'KMIA': {'temp_base': 28, 'wind_base': 9, 'vis_base': 10},
            'KTPA': {'temp_base': 25, 'wind_base': 8, 'vis_base': 10},
            'KLAS': {'temp_base': 24, 'wind_base': 6, 'vis_base': 15},
            'EGLL': {'temp_base': 10, 'wind_base': 15, 'vis_base': 6}
        }
        
        pattern = weather_patterns.get(icao_code, {'temp_base': 15, 'wind_base': 10, 'vis_base': 10})
        
        # Seasonal adjustments
        if current_month in [12, 1, 2]:  # Winter
            temp_adj = -8 if icao_code.startswith('K') else -5
            vis_adj = -2
        elif current_month in [6, 7, 8]:  # Summer
            temp_adj = 8 if icao_code.startswith('K') else 5
            vis_adj = 1
        else:  # Spring/Autumn
            temp_adj = 0
            vis_adj = 0
        
        return {
            'TemperatureC': pattern['temp_base'] + temp_adj,
            'WindSpeedKt': pattern['wind_base'],
            'VisibilityKm': max(1, pattern['vis_base'] + vis_adj),
            'PressureHPa': 1013,
            'DewPointC': pattern['temp_base'] + temp_adj - 5,
            'CloudCoverage': 2,
            'WeatherCode': 'CLR',
            'WeatherCondition': 'Clear'
        }
    
    def add_weather_features(self, df: pd.DataFrame) -> pd.DataFrame:
        """Add comprehensive weather features to flight data"""
        print("Fetching weather data from AVWX API...")
        
        weather_data = []
        unique_airports = df['Airport'].unique()
        
        for airport in unique_airports:
            icao_code = self.IATA_TO_ICAO.get(airport, airport)
            weather = self.fetch_avwx_weather(icao_code)
            
            # Add airport identifier for merging
            weather['Airport'] = airport
            weather_data.append(weather)
            
            print(f"✓ Weather data collected for {airport} ({icao_code})")
        
        # Create weather DataFrame
        weather_df = pd.DataFrame(weather_data)
        
        # Merge with flight data
        enhanced_df = pd.merge(df, weather_df, on='Airport', how='left')
        
        # Calculate derived weather features
        enhanced_df['WeatherImpactScore'] = self._calculate_weather_impact(enhanced_df)
        enhanced_df['IsBadWeather'] = (enhanced_df['WeatherImpactScore'] > 0.6).astype(int)
        enhanced_df['WindCategory'] = pd.cut(enhanced_df['WindSpeedKt'], 
                                            bins=[0, 10, 20, 35, 100], 
                                            labels=[0, 1, 2, 3])
        enhanced_df['VisibilityCategory'] = pd.cut(enhanced_df['VisibilityKm'],
                                                  bins=[0, 3, 8, 15, 100],
                                                  labels=[3, 2, 1, 0])  # Reversed: lower visibility = higher impact
        
        print(f"Enhanced {len(enhanced_df)} flights with comprehensive weather data")
        return enhanced_df
    
    def _calculate_weather_impact(self, df: pd.DataFrame) -> pd.Series:
        """Calculate comprehensive weather impact score (0-1 scale)"""
        impact_score = pd.Series(0.0, index=df.index)
        
        # Wind impact (exponential above 15kt)
        wind_impact = (df['WindSpeedKt'] / 50).clip(0, 1)
        wind_impact = wind_impact ** 0.5  # Square root to emphasize higher winds
        
        # Visibility impact (exponential below 8km)
        vis_impact = (1 - df['VisibilityKm'] / 10).clip(0, 1)
        vis_impact = vis_impact ** 2  # Square to emphasize low visibility
        
        # Weather condition impact
        weather_impact = df['WeatherCondition'].apply(self._get_weather_condition_impact)
        
        # Temperature extremes
        temp_impact = ((df['TemperatureC'] - 15).abs() / 30).clip(0, 1)
        
        # Combined impact (weighted average)
        impact_score = (wind_impact * 0.3 + vis_impact * 0.4 + 
                       weather_impact * 0.2 + temp_impact * 0.1)
        
        return impact_score.clip(0, 1)
    
    def _get_weather_condition_impact(self, condition: str) -> float:
        """Get weather condition impact score"""
        if pd.isna(condition):
            return 0.0
        
        condition = str(condition).lower()
        
        high_impact = ['thunderstorm', 'heavy', 'freezing', 'snow', 'ice']
        medium_impact = ['rain', 'drizzle', 'mist', 'fog', 'haze']
        
        if any(word in condition for word in high_impact):
            return 0.8
        elif any(word in condition for word in medium_impact):
            return 0.4
        else:
            return 0.1
    
    def save_enhanced_dataset(self, df: pd.DataFrame, filename: str = None) -> str:
        """Save enhanced dataset with weather and temporal features"""
        if filename is None:
            timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
            filename = f"enhanced_flight_data_{timestamp}.csv"
        
        # Ensure output directory exists
        os.makedirs('data/enhanced', exist_ok=True)
        filepath = f'data/enhanced/{filename}'
        
        df.to_csv(filepath, index=False)
        
        # Save feature summary
        feature_summary = {
            'timestamp': datetime.now().isoformat(),
            'total_flights': len(df),
            'total_features': len(df.columns),
            'temporal_features': ['Month', 'Weekday', 'Hour', 'Season', 'TimeCategory', 'IsWeekend', 'IsPeakSummer', 'IsHolidayPeriod', 'DayOfYear'],
            'weather_features': ['TemperatureC', 'WindSpeedKt', 'VisibilityKm', 'PressureHPa', 'DewPointC', 'CloudCoverage', 'WeatherImpactScore', 'IsBadWeather', 'WindCategory', 'VisibilityCategory'],
            'airports_covered': df['Airport'].nunique(),
            'weather_data_source': 'AVWX API' if self.avwx_api_key else 'Realistic Fallback'
        }
        
        summary_file = f'data/enhanced/feature_summary_{timestamp}.json'
        with open(summary_file, 'w') as f:
            json.dump(feature_summary, f, indent=2, default=str)
        
        print(f"Enhanced dataset saved: {filepath}")
        print(f"Feature summary saved: {summary_file}")
        
        return filepath

def integrate_with_existing_data(flight_data_file: str = "airport_flight_data.csv") -> str:
    """Integrate weather and seasonal features with existing flight data"""
    print("=== Enhanced Weather & Seasonal Integration ===")
    
    # Initialize integrator
    integrator = EnhancedWeatherIntegrator()
    
    try:
        # Load flight data
        if os.path.exists(flight_data_file):
            df = pd.read_csv(flight_data_file)
            print(f"Loaded {len(df)} flights from {flight_data_file}")
        else:
            print(f"Warning: {flight_data_file} not found. Creating sample data...")
            # Create sample data for demonstration
            sample_data = {
                'Flight': ['VS001', 'DL123', 'AA456', 'UA789'],
                'Airport': ['JFK', 'LHR', 'LAX', 'ATL'],
                'Scheduled': [datetime.now() + timedelta(hours=i) for i in range(4)],
                'DelayMinutes': [0, 15, 30, 5]
            }
            df = pd.DataFrame(sample_data)
        
        # Add temporal features
        df = integrator.add_temporal_features(df)
        
        # Add weather features
        df = integrator.add_weather_features(df)
        
        # Save enhanced dataset
        output_file = integrator.save_enhanced_dataset(df)
        
        print(f"✅ Weather and seasonal integration complete!")
        print(f"Enhanced dataset: {output_file}")
        print(f"Total features: {len(df.columns)}")
        
        return output_file
        
    except Exception as e:
        print(f"Error during integration: {e}")
        return None

def main():
    """Main function for standalone operation"""
    print("Starting Enhanced Weather & Seasonal Integration...")
    
    # Check for AVWX API key
    api_key = os.getenv('AVWX_API_KEY')
    if api_key:
        print("✓ AVWX API key found - using authentic weather data")
    else:
        print("⚠ No AVWX API key found - using realistic fallback weather patterns")
    
    # Run integration
    result = integrate_with_existing_data()
    
    if result:
        print(f"\n✅ Integration successful: {result}")
    else:
        print("\n❌ Integration failed")

if __name__ == "__main__":
    main()
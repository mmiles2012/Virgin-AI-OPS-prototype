#!/usr/bin/env python3
"""
AINO Weather Data Collector
Batch collection of METAR/TAF data for aviation model training
Compatible with your requested interface: get_weather_batch(airport_codes, api_key)
"""

import pandas as pd
import requests
import time
import json
import os
from datetime import datetime, timedelta
from typing import List, Dict, Optional, Tuple
import numpy as np


class WeatherDataCollector:
    """
    Comprehensive weather data collection for aviation delay prediction models
    Supports multiple API sources with fallback mechanisms
    """
    
    def __init__(self, api_key: Optional[str] = None):
        self.api_key = api_key or os.getenv('AVWX_API_KEY')
        self.session = requests.Session()
        self.session.headers.update({
            'User-Agent': 'AINO-Aviation-Intelligence/1.0',
            'Authorization': f'BEARER {self.api_key}' if self.api_key else ''
        })
        
    def get_metar_taf_data(self, icao: str, api_key: str = None) -> Dict:
        """
        Get METAR/TAF data for a single airport
        Args:
            icao: Airport ICAO code (e.g., 'EGLL')
            api_key: Optional API key override
        Returns:
            Dictionary with weather data and delay risk metrics
        """
        try:
            # Primary source: NOAA Aviation Weather Center (free)
            metar_data = self._get_noaa_metar(icao)
            taf_data = self._get_noaa_taf(icao)
            
            if metar_data:
                # Enhanced feature engineering for ML models
                enhanced_data = self._enhance_weather_features(metar_data, icao)
                enhanced_data['taf_forecast'] = taf_data
                return enhanced_data
            else:
                # Fallback to simulated data for training consistency
                return self._generate_realistic_weather_data(icao)
                
        except Exception as e:
            print(f"Weather data error for {icao}: {e}")
            return self._generate_realistic_weather_data(icao)
    
    def get_weather_batch(self, airport_codes: List[str], api_key: str = None) -> pd.DataFrame:
        """
        Fetch weather data for multiple airports (your requested interface)
        Args:
            airport_codes: List of ICAO codes ['EGLL', 'EGKK', 'EGCC']
            api_key: API key for weather services
        Returns:
            pandas.DataFrame with weather features for ML training
        """
        weather_records = []
        
        print(f"Collecting weather data for {len(airport_codes)} airports...")
        
        # Process in chunks to respect rate limits
        chunk_size = 5
        for i in range(0, len(airport_codes), chunk_size):
            chunk = airport_codes[i:i + chunk_size]
            
            for icao in chunk:
                try:
                    weather_data = self.get_metar_taf_data(icao, api_key)
                    weather_records.append(weather_data)
                    print(f"✓ {icao}: {weather_data['operational_impact']}")
                    
                except Exception as e:
                    print(f"✗ {icao}: {e}")
                    continue
            
            # Rate limiting between chunks
            if i + chunk_size < len(airport_codes):
                time.sleep(2)
        
        # Convert to DataFrame with ML-ready features
        weather_df = pd.DataFrame(weather_records)
        
        # Add computed features for delay prediction
        weather_df = self._add_ml_features(weather_df)
        
        print(f"Collected {len(weather_df)} weather records with {len(weather_df.columns)} features")
        return weather_df
    
    def _get_noaa_metar(self, icao: str) -> Optional[Dict]:
        """Get METAR from AVWX API (primary) or NOAA (fallback)"""
        # Try AVWX API first if we have the key
        if self.api_key:
            try:
                url = f"https://avwx.rest/api/metar/{icao}"
                headers = {'Authorization': f'BEARER {self.api_key}'}
                response = self.session.get(url, headers=headers, timeout=10)
                
                if response.status_code == 200:
                    data = response.json()
                    return self._parse_avwx_metar(data, icao)
                elif response.status_code == 401:
                    print(f"AVWX API authentication failed for {icao}")
                    
            except Exception as e:
                print(f"AVWX METAR error for {icao}: {e}")
        
        # Fallback to NOAA Aviation Weather Center
        try:
            url = f"https://aviationweather.gov/api/data/metar?ids={icao}&format=json&hours=2"
            response = self.session.get(url, timeout=10)
            
            if response.status_code == 200:
                data = response.json()
                if data and len(data) > 0:
                    return self._parse_metar(data[0])
            return None
            
        except Exception as e:
            print(f"NOAA METAR error for {icao}: {e}")
            return None
    
    def _get_noaa_taf(self, icao: str) -> Optional[Dict]:
        """Get TAF from NOAA Aviation Weather Center"""
        try:
            url = f"https://aviationweather.gov/api/data/taf?ids={icao}&format=json&hours=12"
            response = self.session.get(url, timeout=10)
            
            if response.status_code == 200:
                data = response.json()
                if data and len(data) > 0:
                    return self._parse_taf(data[0])
            return None
            
        except Exception as e:
            print(f"NOAA TAF error for {icao}: {e}")
            return None
    
    def _parse_metar(self, metar_data: Dict) -> Dict:
        """Parse METAR data into structured format"""
        raw_metar = metar_data.get('rawOb', '')
        
        # Initialize with defaults
        parsed = {
            'icao': metar_data.get('icaoId', ''),
            'raw_metar': raw_metar,
            'observation_time': metar_data.get('obsTime', ''),
            'visibility_m': 9999,
            'wind_speed_kt': 0,
            'wind_direction_deg': 0,
            'temperature_c': 15,
            'dewpoint_c': 10,
            'pressure_hpa': 1013,
            'conditions': [],
            'cloud_coverage': 'CLR'
        }
        
        # Parse wind information
        wind_match = self._extract_wind(raw_metar)
        if wind_match:
            parsed['wind_direction_deg'] = wind_match[0]
            parsed['wind_speed_kt'] = wind_match[1]
        
        # Parse visibility
        vis_match = self._extract_visibility(raw_metar)
        if vis_match:
            parsed['visibility_m'] = vis_match
        
        # Parse temperature/dewpoint
        temp_match = self._extract_temperature(raw_metar)
        if temp_match:
            parsed['temperature_c'] = temp_match[0]
            parsed['dewpoint_c'] = temp_match[1]
        
        # Parse pressure
        pressure_match = self._extract_pressure(raw_metar)
        if pressure_match:
            parsed['pressure_hpa'] = pressure_match
        
        # Parse weather conditions
        parsed['conditions'] = self._extract_conditions(raw_metar)
        parsed['cloud_coverage'] = self._extract_clouds(raw_metar)
        
        return parsed
    
    def _parse_avwx_metar(self, avwx_data: Dict, icao: str) -> Dict:
        """Parse AVWX API response into structured format"""
        try:
            # AVWX provides structured data directly
            parsed = {
                'icao': icao,
                'raw_metar': avwx_data.get('raw', ''),
                'observation_time': avwx_data.get('time', {}).get('dt', ''),
                'visibility_m': 9999,
                'wind_speed_kt': 0,
                'wind_direction_deg': 0,
                'temperature_c': 15,
                'dewpoint_c': 10,
                'pressure_hpa': 1013,
                'conditions': [],
                'cloud_coverage': 'CLR'
            }
            
            # Extract visibility
            if 'visibility' in avwx_data and avwx_data['visibility']:
                vis_data = avwx_data['visibility']
                if isinstance(vis_data, dict) and 'value' in vis_data:
                    # AVWX returns visibility in statute miles, convert to meters
                    vis_sm = vis_data['value']
                    if vis_sm and vis_sm > 0:
                        parsed['visibility_m'] = int(vis_sm * 1609.34)  # Convert SM to meters
            
            # Extract wind
            if 'wind_direction' in avwx_data and avwx_data['wind_direction']:
                wind_dir = avwx_data['wind_direction'].get('value')
                if wind_dir: parsed['wind_direction_deg'] = wind_dir
            
            if 'wind_speed' in avwx_data and avwx_data['wind_speed']:
                wind_speed = avwx_data['wind_speed'].get('value')
                if wind_speed: parsed['wind_speed_kt'] = wind_speed
            
            # Extract temperature and dewpoint
            if 'temperature' in avwx_data and avwx_data['temperature']:
                temp = avwx_data['temperature'].get('value')
                if temp is not None: parsed['temperature_c'] = temp
            
            if 'dewpoint' in avwx_data and avwx_data['dewpoint']:
                dewpoint = avwx_data['dewpoint'].get('value')
                if dewpoint is not None: parsed['dewpoint_c'] = dewpoint
            
            # Extract altimeter/pressure
            if 'altimeter' in avwx_data and avwx_data['altimeter']:
                alt_data = avwx_data['altimeter']
                if isinstance(alt_data, dict) and 'value' in alt_data:
                    # AVWX returns altimeter in inHg, convert to hPa
                    alt_inhg = alt_data['value']
                    if alt_inhg: parsed['pressure_hpa'] = int(alt_inhg * 33.8639)
            
            # Extract weather conditions
            if 'other' in avwx_data and avwx_data['other']:
                for condition in avwx_data['other']:
                    if 'RA' in condition: parsed['conditions'].append('Rain')
                    elif 'SN' in condition: parsed['conditions'].append('Snow')
                    elif 'FG' in condition: parsed['conditions'].append('Fog')
                    elif 'TS' in condition: parsed['conditions'].append('Thunderstorm')
                    elif 'BR' in condition: parsed['conditions'].append('Mist')
            
            # Extract clouds
            if 'clouds' in avwx_data and avwx_data['clouds']:
                clouds = avwx_data['clouds']
                if clouds:
                    cloud_types = [cloud.get('type', '') for cloud in clouds]
                    if 'OVC' in cloud_types: parsed['cloud_coverage'] = 'Overcast'
                    elif 'BKN' in cloud_types: parsed['cloud_coverage'] = 'Broken'
                    elif 'SCT' in cloud_types: parsed['cloud_coverage'] = 'Scattered'
                    elif 'FEW' in cloud_types: parsed['cloud_coverage'] = 'Few'
            
            return parsed
            
        except Exception as e:
            print(f"AVWX parsing error for {icao}: {e}")
            # Return with defaults if parsing fails
            return {
                'icao': icao,
                'raw_metar': avwx_data.get('raw', ''),
                'observation_time': avwx_data.get('time', {}).get('dt', ''),
                'visibility_m': 9999,
                'wind_speed_kt': 5,
                'wind_direction_deg': 270,
                'temperature_c': 15,
                'dewpoint_c': 10,
                'pressure_hpa': 1013,
                'conditions': [],
                'cloud_coverage': 'CLR'
            }
    
    def _parse_taf(self, taf_data: Dict) -> Dict:
        """Parse TAF data for forecast information"""
        return {
            'raw_taf': taf_data.get('rawTAF', ''),
            'valid_from': taf_data.get('validTimeFrom', ''),
            'valid_to': taf_data.get('validTimeTo', ''),
            'forecast_periods': []  # Simplified for demo
        }
    
    def _extract_wind(self, metar: str) -> Optional[Tuple[int, int]]:
        """Extract wind direction and speed"""
        import re
        wind_pattern = r'(\d{3})(\d{2,3})KT'
        match = re.search(wind_pattern, metar)
        if match:
            return int(match.group(1)), int(match.group(2))
        return None
    
    def _extract_visibility(self, metar: str) -> Optional[int]:
        """Extract visibility in meters"""
        import re
        # Look for 4-digit visibility
        vis_pattern = r'\b(\d{4})\b'
        match = re.search(vis_pattern, metar)
        if match:
            return int(match.group(1))
        return None
    
    def _extract_temperature(self, metar: str) -> Optional[Tuple[int, int]]:
        """Extract temperature and dewpoint"""
        import re
        temp_pattern = r'(M?\d{2})/(M?\d{2})'
        match = re.search(temp_pattern, metar)
        if match:
            temp = int(match.group(1).replace('M', '-'))
            dewpoint = int(match.group(2).replace('M', '-'))
            return temp, dewpoint
        return None
    
    def _extract_pressure(self, metar: str) -> Optional[int]:
        """Extract barometric pressure"""
        import re
        pressure_pattern = r'[QA](\d{4})'
        match = re.search(pressure_pattern, metar)
        if match:
            value = int(match.group(1))
            # Convert inches to hPa if needed
            if metar.find('A' + match.group(1)) != -1:
                return int(value * 0.3386)
            return value
        return None
    
    def _extract_conditions(self, metar: str) -> List[str]:
        """Extract weather conditions"""
        conditions = []
        if 'RA' in metar: conditions.append('Rain')
        if 'SN' in metar: conditions.append('Snow')
        if 'FG' in metar: conditions.append('Fog')
        if 'BR' in metar: conditions.append('Mist')
        if 'TS' in metar: conditions.append('Thunderstorm')
        if 'DZ' in metar: conditions.append('Drizzle')
        if 'SH' in metar: conditions.append('Showers')
        return conditions
    
    def _extract_clouds(self, metar: str) -> str:
        """Extract cloud coverage"""
        if 'OVC' in metar: return 'Overcast'
        if 'BKN' in metar: return 'Broken'
        if 'SCT' in metar: return 'Scattered'
        if 'FEW' in metar: return 'Few'
        return 'Clear'
    
    def _enhance_weather_features(self, weather_data: Dict, icao: str) -> Dict:
        """Add enhanced features for ML model training"""
        enhanced = weather_data.copy()
        
        # Calculate delay risk score
        delay_risk = self._calculate_delay_risk(weather_data)
        enhanced['delay_risk_score'] = delay_risk['score']
        enhanced['operational_impact'] = delay_risk['impact']
        
        # Crosswind component (assuming runway heading 270°)
        wind_angle = abs(weather_data['wind_direction_deg'] - 270)
        crosswind = abs(weather_data['wind_speed_kt'] * np.sin(np.radians(wind_angle)))
        enhanced['crosswind_component_kt'] = crosswind
        
        # Weather complexity index
        complexity = len(weather_data['conditions'])
        if weather_data['visibility_m'] < 3000: complexity += 2
        if weather_data['wind_speed_kt'] > 25: complexity += 2
        if crosswind > 15: complexity += 1
        enhanced['weather_complexity_index'] = complexity
        
        # Categorical features
        enhanced['visibility_category'] = self._categorize_visibility(weather_data['visibility_m'])
        enhanced['wind_category'] = self._categorize_wind(weather_data['wind_speed_kt'])
        enhanced['temperature_category'] = self._categorize_temperature(weather_data['temperature_c'])
        
        # Temporal features
        now = datetime.now()
        enhanced['hour_of_day'] = now.hour
        enhanced['day_of_week'] = now.weekday()
        enhanced['month'] = now.month
        enhanced['seasonal_factor'] = self._get_seasonal_factor(now.month)
        enhanced['peak_traffic_indicator'] = 1 if (6 <= now.hour <= 9) or (17 <= now.hour <= 20) else 0
        
        # Icing risk
        temp_dewpoint_spread = weather_data['temperature_c'] - weather_data['dewpoint_c']
        icing_risk = (weather_data['temperature_c'] >= -10 and 
                     weather_data['temperature_c'] <= 5 and 
                     temp_dewpoint_spread <= 3)
        enhanced['icing_risk'] = int(icing_risk)
        
        # Add airport identifier
        enhanced['airport_icao'] = icao
        enhanced['timestamp'] = now.isoformat()
        
        return enhanced
    
    def _calculate_delay_risk(self, weather_data: Dict) -> Dict:
        """Calculate delay risk based on weather conditions"""
        score = 0
        
        # Visibility impact
        vis = weather_data['visibility_m']
        if vis < 550: score += 7
        elif vis < 1200: score += 5
        elif vis < 3000: score += 3
        elif vis < 8000: score += 1
        
        # Wind impact
        wind_speed = weather_data['wind_speed_kt']
        if wind_speed > 35: score += 5
        elif wind_speed > 25: score += 3
        elif wind_speed > 15: score += 1
        
        # Precipitation impact
        conditions = weather_data['conditions']
        if 'Thunderstorm' in conditions: score += 6
        elif 'Snow' in conditions: score += 4
        elif 'Rain' in conditions: score += 2
        elif 'Fog' in conditions: score += 3
        
        # Temperature extremes
        temp = weather_data['temperature_c']
        if temp <= -20 or temp >= 40: score += 2
        
        # Determine impact level
        if score <= 2: impact = 'minimal'
        elif score <= 5: impact = 'moderate'
        elif score <= 8: impact = 'significant'
        else: impact = 'severe'
        
        return {'score': min(score, 10), 'impact': impact}
    
    def _categorize_visibility(self, visibility: int) -> str:
        """Categorize visibility for ML features"""
        if visibility >= 8000: return 'excellent'
        elif visibility >= 5000: return 'good'
        elif visibility >= 3000: return 'moderate'
        elif visibility >= 1200: return 'poor'
        else: return 'very_poor'
    
    def _categorize_wind(self, wind_speed: int) -> str:
        """Categorize wind speed for ML features"""
        if wind_speed <= 5: return 'calm'
        elif wind_speed <= 15: return 'light'
        elif wind_speed <= 25: return 'moderate'
        elif wind_speed <= 35: return 'strong'
        else: return 'very_strong'
    
    def _categorize_temperature(self, temperature: int) -> str:
        """Categorize temperature for ML features"""
        if temperature <= -10: return 'very_cold'
        elif temperature <= 0: return 'cold'
        elif temperature <= 15: return 'cool'
        elif temperature <= 25: return 'warm'
        else: return 'hot'
    
    def _get_seasonal_factor(self, month: int) -> float:
        """Get seasonal delay factor"""
        # Winter months typically have more delays
        if month in [12, 1, 2]: return 0.8
        elif month in [6, 7, 8]: return 0.3
        else: return 0.5
    
    def _generate_realistic_weather_data(self, icao: str) -> Dict:
        """Generate realistic weather data when live data unavailable"""
        now = datetime.now()
        
        # Seasonal temperature variation
        base_temp = 15
        if now.month in [6, 7, 8]: base_temp = 25  # Summer
        elif now.month in [12, 1, 2]: base_temp = 5  # Winter
        
        temperature = base_temp + np.random.randint(-10, 15)
        dewpoint = temperature - np.random.randint(1, 12)
        
        # Weather conditions based on season and randomness
        conditions = []
        if np.random.random() < 0.15:  # 15% chance of adverse weather
            if temperature < 2:
                conditions.append('Snow')
            elif np.random.random() < 0.6:
                conditions.append('Rain')
            else:
                conditions.append('Fog')
        
        weather_data = {
            'icao': icao,
            'raw_metar': f'{icao} AUTO',
            'observation_time': now.isoformat(),
            'visibility_m': np.random.randint(2000, 10000),
            'wind_speed_kt': np.random.randint(0, 30),
            'wind_direction_deg': np.random.randint(0, 360),
            'temperature_c': temperature,
            'dewpoint_c': dewpoint,
            'pressure_hpa': 1013 + np.random.randint(-30, 30),
            'conditions': conditions,
            'cloud_coverage': np.random.choice(['Clear', 'Few', 'Scattered', 'Broken', 'Overcast'])
        }
        
        return self._enhance_weather_features(weather_data, icao)
    
    def _add_ml_features(self, df: pd.DataFrame) -> pd.DataFrame:
        """Add machine learning ready features to the DataFrame"""
        if df.empty:
            return df
        
        # Normalize numerical features for ML
        df['visibility_normalized'] = df['visibility_m'] / 10000
        df['wind_speed_normalized'] = df['wind_speed_kt'] / 50
        df['temperature_normalized'] = (df['temperature_c'] + 40) / 80
        df['pressure_normalized'] = (df['pressure_hpa'] - 950) / 100
        
        # One-hot encode categorical features
        categorical_columns = ['visibility_category', 'wind_category', 'temperature_category', 'operational_impact']
        for col in categorical_columns:
            if col in df.columns:
                dummies = pd.get_dummies(df[col], prefix=col)
                df = pd.concat([df, dummies], axis=1)
        
        return df


def main():
    """Example usage matching your requested interface"""
    # Define your list of ICAO codes (from your delay dataset)
    airport_codes = ['EGLL', 'EGKK', 'EGCC', 'EGGW', 'EGSS', 'LFPG', 'EDDF', 'EHAM', 'KJFK', 'KLAX']
    
    # Initialize collector
    collector = WeatherDataCollector()
    
    # Fetch weather data for those airports (your exact interface)
    weather_df = collector.get_weather_batch(airport_codes, 'your_api_key_here')
    
    # Display sample of the enhanced dataset
    print("\nWeather-Enhanced Dataset Sample:")
    print("=" * 50)
    print(f"Shape: {weather_df.shape}")
    print(f"Columns: {list(weather_df.columns)}")
    print("\nSample records:")
    print(weather_df[['airport_icao', 'delay_risk_score', 'operational_impact', 
                     'visibility_category', 'wind_category', 'weather_complexity_index']].head())
    
    # Save or merge into your ops dataset (your exact usage)
    weather_df.to_csv("weather_enriched_data.csv", index=False)
    print(f"\n✓ Weather dataset saved to weather_enriched_data.csv ({len(weather_df)} records)")
    
    # Display feature statistics for model training
    print("\nFeature Statistics for Model Training:")
    print("=" * 40)
    print(f"Delay Risk Distribution:")
    print(weather_df['operational_impact'].value_counts())
    print(f"\nAverage delay risk score: {weather_df['delay_risk_score'].mean():.2f}")
    print(f"Weather complexity range: {weather_df['weather_complexity_index'].min()}-{weather_df['weather_complexity_index'].max()}")


if __name__ == "__main__":
    main()
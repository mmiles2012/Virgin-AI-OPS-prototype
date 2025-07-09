import requests
import logging
from typing import Dict, Optional, Tuple

logger = logging.getLogger(__name__)

class MetarWeatherService:
    """Enhanced METAR weather service using AVWX API for authentic weather data"""
    
    def __init__(self, api_key: str = None):
        # Use environment variable or provided key
        import os
        self.api_key = api_key or os.getenv('AVWX_API_KEY')
        self.headers = {"Authorization": f"Bearer {self.api_key}"} if self.api_key else {}
        
    def get_metar(self, icao: str) -> Tuple[str, Optional[float]]:
        """Get METAR data for an airport ICAO code"""
        if not self.api_key:
            logger.warning("No AVWX API key provided, using default weather")
            return "", None
            
        try:
            url = f"https://avwx.rest/api/metar/{icao}?options=&format=json"
            response = requests.get(url, headers=self.headers, timeout=5)
            
            if response.status_code == 200:
                data = response.json()
                raw_metar = data.get("raw", "")
                altimeter = data.get("altimeter", {}).get("value", None)
                logger.info(f"Successfully fetched METAR for {icao}")
                return raw_metar, altimeter
            else:
                logger.warning(f"METAR API returned status {response.status_code} for {icao}")
                return "", None
                
        except Exception as e:
            logger.error(f"METAR fetch error for {icao}: {e}")
            return "", None

    def get_weather_score(self, metar_raw: str) -> float:
        """Calculate weather impact score from METAR string"""
        if not metar_raw:
            return 0.5

        score = 0
        
        # Precipitation and storms
        if any(code in metar_raw for code in ['TS', 'RA', 'SN', 'FG']):
            score += 0.4
            
        # Cloud coverage
        if 'BKN' in metar_raw or 'OVC' in metar_raw:
            score += 0.3
            
        # Low visibility
        if any(vis in metar_raw for vis in [' 800 ', ' 600 ', ' 400 ', ' 200 ']):
            score += 0.2
            
        # Strong winds
        if any(wind in metar_raw for wind in ['25KT', '30KT', '35KT', '40KT']):
            score += 0.2
            
        return min(score, 1.0)
    
    def extract_weather_features(self, metar_raw: str) -> Dict[str, float]:
        """Extract detailed weather features from METAR for ML model"""
        features = {
            'weather_visibility': 10.0,  # Default good visibility
            'weather_wind_speed': 5.0,   # Default light wind
            'weather_temperature': 15.0, # Default temperature
            'weather_pressure': 1013.25, # Default pressure
            'weather_humidity': 60.0,    # Default humidity
            'weather_conditions': 'clear',
            'weather_impact_score': 0.0
        }
        
        if not metar_raw:
            return features
        
        try:
            # Extract visibility (in statute miles or meters)
            import re
            
            # Visibility in statute miles (e.g., "10SM")
            vis_match = re.search(r'(\d+)SM', metar_raw)
            if vis_match:
                features['weather_visibility'] = float(vis_match.group(1))
            
            # Wind speed (e.g., "25012KT" = 250 degrees at 12 knots)
            wind_match = re.search(r'\d{5}(\d{2})KT', metar_raw)
            if wind_match:
                features['weather_wind_speed'] = float(wind_match.group(1))
            
            # Temperature (e.g., "M05/M10" = -5°C temp, -10°C dewpoint)
            temp_match = re.search(r'(M?\d{2})/(M?\d{2})', metar_raw)
            if temp_match:
                temp_str = temp_match.group(1)
                if temp_str.startswith('M'):
                    features['weather_temperature'] = -float(temp_str[1:])
                else:
                    features['weather_temperature'] = float(temp_str)
            
            # Conditions
            if any(code in metar_raw for code in ['RA', 'SN', 'TS']):
                features['weather_conditions'] = 'precipitation'
            elif 'FG' in metar_raw:
                features['weather_conditions'] = 'fog'
            elif any(code in metar_raw for code in ['BKN', 'OVC']):
                features['weather_conditions'] = 'cloudy'
            else:
                features['weather_conditions'] = 'clear'
            
            # Calculate impact score
            features['weather_impact_score'] = self.get_weather_score(metar_raw)
            
            logger.debug(f"Extracted weather features from METAR: {features}")
            
        except Exception as e:
            logger.error(f"Error extracting weather features: {e}")
        
        return features
    
    def get_enhanced_weather_data(self, icao: str) -> Dict[str, float]:
        """Get complete weather data for an airport"""
        metar_raw, altimeter = self.get_metar(icao)
        features = self.extract_weather_features(metar_raw)
        
        # Add altimeter reading if available
        if altimeter:
            features['weather_pressure'] = altimeter
        
        # Add raw METAR for reference
        features['metar_raw'] = metar_raw
        
        return features

# Global instance for easy access
weather_service = None

def get_weather_service() -> MetarWeatherService:
    """Get global weather service instance"""
    global weather_service
    if weather_service is None:
        weather_service = MetarWeatherService()
    return weather_service

def get_airport_weather(icao: str) -> Dict[str, float]:
    """Convenience function to get weather data for an airport"""
    service = get_weather_service()
    return service.get_enhanced_weather_data(icao)
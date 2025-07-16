
import requests
import math
import time

# Define known LHR holding stacks and their coordinates
HOLDING_POINTS = {
    'BIG': {'lat': 51.655, 'lon': -0.540},
    'BNN': {'lat': 51.833, 'lon': -0.750},
    'LAM': {'lat': 51.650, 'lon': 0.120},
    'OCK': {'lat': 51.317, 'lon': -0.717}
}

# Haversine distance calculator
def haversine(lat1, lon1, lat2, lon2):
    R = 6371.0  # km
    dlat = math.radians(lat2 - lat1)
    dlon = math.radians(lon2 - lon1)
    a = math.sin(dlat/2)**2 + math.cos(math.radians(lat1)) * math.cos(math.radians(lat2)) * math.sin(dlon/2)**2
    return R * 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))

# Detect holding aircraft
def detect_holding_aircraft(adsb_data, radius_km=10, altitude_range=(4000, 12000)):
    holding_summary = {}
    for point_name, coords in HOLDING_POINTS.items():
        count = 0
        altitudes = []
        for aircraft in adsb_data:
            if not all(k in aircraft for k in ['lat', 'lon', 'alt_baro']): continue
            if not (altitude_range[0] <= aircraft['alt_baro'] <= altitude_range[1]): continue
            dist = haversine(coords['lat'], coords['lon'], aircraft['lat'], aircraft['lon'])
            if dist <= radius_km:
                count += 1
                altitudes.append(aircraft['alt_baro'])
        holding_summary[point_name] = {
            'aircraft_holding': count,
            'avg_altitude': round(sum(altitudes)/count, 1) if count else 0
        }
    return holding_summary

# Example usage:
# real_adsb_data = requests.get('https://api.adsbexchange.com/your_feed').json()['ac']
# summary = detect_holding_aircraft(real_adsb_data)

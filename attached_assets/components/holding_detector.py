
import math
import pandas as pd

# Stack locations (approximate lat/lon of stack centers)
STACKS = {
    "BNN": (51.7969, -0.6467),
    "BIG": (51.3300, 0.0325),
    "LAM": (51.6500, 0.1550),
    "OCK": (51.2690, -0.4810)
}

def haversine(lat1, lon1, lat2, lon2):
    R = 6371  # Earth radius in km
    phi1, phi2 = math.radians(lat1), math.radians(lat2)
    dphi = math.radians(lat2 - lat1)
    dlambda = math.radians(lon2 - lon1)
    a = math.sin(dphi/2)**2 + math.cos(phi1)*math.cos(phi2)*math.sin(dlambda/2)**2
    return R * 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))

def assign_stack(lat, lon):
    for stack, (s_lat, s_lon) in STACKS.items():
        if haversine(lat, lon, s_lat, s_lon) < 20:  # within 20 km radius
            return stack
    return None

def detect_holding(df):
    df['holding'] = False
    df['stack'] = df.apply(lambda row: assign_stack(row['lat'], row['lon']), axis=1)

    for flight, group in df.groupby('flight'):
        if len(group) >= 3:
            alt_range = group['alt_baro'].max() - group['alt_baro'].min()
            track_range = group['track'].max() - group['track'].min()
            if alt_range < 300 and track_range > 90:
                df.loc[df['flight'] == flight, 'holding'] = True
    return df

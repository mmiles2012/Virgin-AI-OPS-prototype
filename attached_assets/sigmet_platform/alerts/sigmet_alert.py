
import json
from shapely.geometry import shape, Point

def load_sigmet_polygons():
    with open("sigmets.geojson", "r") as f:
        geojson = json.load(f)
    return [shape(feature["geometry"]) for feature in geojson["features"]]

def check_aircraft_in_sigmet(lat, lon):
    point = Point(lon, lat)
    polygons = load_sigmet_polygons()
    for poly in polygons:
        if poly.contains(point):
            return True
    return False

# Example aircraft
aircraft = {"lat": 39.8, "lon": -98.5}

if check_aircraft_in_sigmet(aircraft["lat"], aircraft["lon"]):
    print("⚠️ Aircraft is inside a SIGMET zone!")
else:
    print("✅ Aircraft is outside SIGMET zones.")

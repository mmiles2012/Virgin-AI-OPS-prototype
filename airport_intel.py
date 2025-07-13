# Mocked airport intelligence database (can be replaced with a CSV or live DB)
AIRPORT_DB = {
    "GANDER": {
        "icao": "CYQX",
        "runway_length_ft": 10200,
        "fire_category": 9,
        "can_handle": ["A350-1000", "B787-9", "A330-900", "A330-300"],
        "political_risk": "low",
        "handling_available": True
    },
    "KEFLAVIK": {
        "icao": "BIKF",
        "runway_length_ft": 10000,
        "fire_category": 9,
        "can_handle": ["A350-1000", "B787-9", "A330-900", "A330-300"],
        "political_risk": "low",
        "handling_available": True
    },
    "SHANNON": {
        "icao": "EINN",
        "runway_length_ft": 10495,
        "fire_category": 9,
        "can_handle": ["A330-900", "A330-300", "B787-9"],
        "political_risk": "low",
        "handling_available": True
    },
    "AZORES": {
        "icao": "LPAZ",
        "runway_length_ft": 9840,
        "fire_category": 8,
        "can_handle": ["A330-900", "A330-300"],
        "political_risk": "medium",
        "handling_available": True
    },
    "THULE": {
        "icao": "BGTL",
        "runway_length_ft": 10000,
        "fire_category": 7,
        "can_handle": ["B787-9"],
        "political_risk": "high",
        "handling_available": False
    }
}

def get_airport_info(icao):
    for name, data in AIRPORT_DB.items():
        if data["icao"] == icao:
            return {**data, "name": name}
    return {"icao": icao, "error": "Not found in database"}

def score_airport(icao, aircraft_type):
    info = get_airport_info(icao)
    if "error" in info:
        return {"icao": icao, "score": 0, "reason": "Unknown"}

    score = 100

    # Penalize for inadequate fire category
    if info["fire_category"] < 9:
        score -= 20

    # Penalize for insufficient runway
    if info["runway_length_ft"] < 9500:
        score -= 15

    # Penalize if aircraft not listed
    if aircraft_type not in info["can_handle"]:
        score -= 25

    # Penalize for political risk
    if info["political_risk"] == "medium":
        score -= 10
    elif info["political_risk"] == "high":
        score -= 30

    # Penalize if no handling
    if not info["handling_available"]:
        score -= 20

    return {"icao": icao, "score": max(score, 0), "reason": "Scored"}

if __name__ == "__main__":
    print(score_airport("BIKF", "A350-1000"))
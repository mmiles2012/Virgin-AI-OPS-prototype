from metar_feed import get_metar
from airport_intel import score_airport, get_airport_info
from delay_predictor import predict_delay, estimate_cost

def rank_diversion_candidates(aircraft_type, candidate_icaos, scenario_features):
    ranked = []

    for icao in candidate_icaos:
        # Step 1: Weather score
        weather = get_metar(icao)
        flight_cat_score = {
            "VFR": 0,
            "MVFR": -5,
            "IFR": -15,
            "LIFR": -25
        }.get(weather.get("flight_category", ""), -30)

        # Step 2: Airport suitability score
        airport_score = score_airport(icao, aircraft_type)
        base_score = airport_score["score"] + flight_cat_score

        # Step 3: Predict delay and cost
        enriched_features = scenario_features.copy()
        enriched_features["diversion_icao"] = icao
        delay_min = predict_delay(enriched_features)
        cost_usd = estimate_cost(delay_min, aircraft_type)

        ranked.append({
            "icao": icao,
            "airport_name": get_airport_info(icao).get("name", "Unknown"),
            "score": max(base_score, 0),
            "weather": weather,
            "delay_min": round(delay_min, 1),
            "cost_usd": round(cost_usd, 2),
            "reasons": {
                "airport": airport_score,
                "weather_score": flight_cat_score
            }
        })

    ranked.sort(key=lambda x: (-x["score"], x["cost_usd"]))
    return ranked

import json
from datetime import datetime
from scenario_engine import ScenarioSimulator
from diversion_engine import rank_alternates
from ops_agent import generate_ops_actions

def simulate_full_response(aircraft_type, origin, destination, position_nm_from_origin, altitude_ft, failure_type):
    # Step 1: Simulate degraded performance
    scenario = ScenarioSimulator(
        aircraft_type=aircraft_type,
        origin=origin,
        destination=destination,
        position_nm_from_origin=position_nm_from_origin,
        altitude_ft=altitude_ft
    )
    performance = scenario.simulate_failure(failure_type)

    # Step 2: Run diversion engine based on degraded profile
    diversion_rankings = rank_alternates(performance)
    best_diversion = diversion_rankings[0] if diversion_rankings else {"icao": "UNKNOWN", "name": "N/A"}

    # Step 3: Generate Ops action plan
    ops_plan = generate_ops_actions(failure_type, best_diversion)

    # Step 4: Return unified response
    return {
        "scenario": {
            "aircraft": aircraft_type,
            "route": f"{origin} to {destination}",
            "failure": failure_type,
            "performance_impact": performance
        },
        "diversion_recommendations": diversion_rankings,
        "ops_action_plan": ops_plan,
        "timestamp_utc": datetime.utcnow().isoformat() + "Z"
    }

# Example execution
if __name__ == "__main__":
    result = simulate_full_response("A350-1000", "LHR", "JFK", 1300, 37000, "hydraulic_failure")
    print(json.dumps(result, indent=2))

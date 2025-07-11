
import json
from datetime import datetime

# Define a sample knowledge base of post-failure actions
FAILURE_ACTION_MATRIX = {
    "engine_failure": [
        {"action": "Confirm ETOPS compliance", "target": "Dispatch", "method": "UI", "deadline_mins": 5},
        {"action": "Evaluate nearest suitable diversion", "target": "Ops Centre", "method": "Internal", "deadline_mins": 5},
        {"action": "Notify arrival station of potential delay", "target": "Station Ops", "method": "API", "deadline_mins": 10}
    ],
    "hydraulic_failure": [
        {"action": "Check alternate gear/brake configuration", "target": "Flight Crew", "method": "ACARS", "deadline_mins": 5},
        {"action": "Confirm runway suitability at alternate", "target": "Ops Centre", "method": "UI", "deadline_mins": 7},
        {"action": "Request rescue/fire service confirmation", "target": "Diversion Airport", "method": "API", "deadline_mins": 10}
    ],
    "decompression": [
        {"action": "Trigger emergency descent advisory", "target": "Flight Crew", "method": "ACARS", "deadline_mins": 2},
        {"action": "Alert medical and customs at arrival", "target": "Arrival Station", "method": "Email", "deadline_mins": 15},
        {"action": "Initiate oxygen duration monitoring", "target": "Ops Centre", "method": "UI", "deadline_mins": 1}
    ]
}

# Main function to return ops actions
def generate_ops_actions(failure_type, diversion_info=None):
    now = datetime.utcnow().isoformat() + "Z"
    base_actions = FAILURE_ACTION_MATRIX.get(failure_type, [])

    action_list = []
    for idx, base in enumerate(base_actions):
        action_entry = {
            "id": f"{failure_type}_{idx}",
            "trigger": failure_type,
            "action": base["action"],
            "target_team": base["target"],
            "method": base["method"],
            "deadline_mins": base["deadline_mins"],
            "issued_at": now,
            "status": "pending"
        }

        if diversion_info:
            action_entry["diversion_airport"] = diversion_info.get("icao", "N/A")
            action_entry["notes"] = f"Related to diversion to {diversion_info.get('name', '')}"

        action_list.append(action_entry)

    return action_list

# Example use
if __name__ == "__main__":
    diversion = {"icao": "KEF", "name": "Keflavik"}
    output = generate_ops_actions("hydraulic_failure", diversion)
    print(json.dumps(output, indent=2))

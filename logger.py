import os
import json
import csv
from datetime import datetime

LOG_FOLDER = "logs"
os.makedirs(LOG_FOLDER, exist_ok=True)

CSV_LOG_FILE = os.path.join(LOG_FOLDER, "ops_simulation_log.csv")
JSON_LOG_DIR = os.path.join(LOG_FOLDER, "json")
os.makedirs(JSON_LOG_DIR, exist_ok=True)

CSV_HEADERS = [
    "timestamp", "aircraft", "origin", "destination", "failure_type",
    "position_nm", "altitude_ft", "diversion_icao", "diversion_score",
    "estimated_delay_min", "actions_issued"
]

def log_scenario_result(result_dict):
    timestamp = result_dict.get("timestamp_utc", datetime.utcnow().isoformat() + "Z")
    scenario = result_dict.get("scenario", {})
    diversion = result_dict.get("diversion_recommendations", [{}])[0]
    actions = result_dict.get("ops_action_plan", [])

    row = {
        "timestamp": timestamp,
        "aircraft": scenario.get("aircraft", ""),
        "origin": scenario.get("route", "").split(" to ")[0],
        "destination": scenario.get("route", "").split(" to ")[1],
        "failure_type": scenario.get("failure", ""),
        "position_nm": scenario.get("performance_impact", {}).get("position_nm", ""),
        "altitude_ft": scenario.get("performance_impact", {}).get("altitude_ft", ""),
        "diversion_icao": diversion.get("icao", ""),
        "diversion_score": diversion.get("score", ""),
        "estimated_delay_min": scenario.get("performance_impact", {}).get("estimated_delay_min", 0),
        "actions_issued": len(actions)
    }

    # Append to CSV
    file_exists = os.path.isfile(CSV_LOG_FILE)
    with open(CSV_LOG_FILE, mode="a", newline="") as csvfile:
        writer = csv.DictWriter(csvfile, fieldnames=CSV_HEADERS)
        if not file_exists:
            writer.writeheader()
        writer.writerow(row)

    # Save full JSON
    json_path = os.path.join(JSON_LOG_DIR, f"{timestamp.replace(':', '-')}.json")
    with open(json_path, "w") as jf:
        json.dump(result_dict, jf, indent=2)
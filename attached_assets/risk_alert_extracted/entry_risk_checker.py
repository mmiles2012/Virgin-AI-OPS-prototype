
def check_entry_risks(passenger_nationalities, diversion_airport, visa_matrix):
    issues = []
    for nat in passenger_nationalities:
        key = (diversion_airport, nat)
        if visa_matrix.get(key) == "⚠️":
            issues.append(nat)
    return {
        "destination": diversion_airport,
        "flagged_nationalities": issues,
        "entry_risk_score": len(issues) / max(1, len(set(passenger_nationalities)))
    }

"""
Connection Risk Engine for AINO Aviation Intelligence Platform
Specialized passenger connection risk assessment and analysis
"""

from datetime import datetime, timedelta
import logging

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

def parse_iso_datetime(iso_string):
    """Parse ISO datetime string to datetime object"""
    try:
        # Handle both with and without timezone
        if iso_string.endswith('Z'):
            return datetime.fromisoformat(iso_string[:-1])
        else:
            return datetime.fromisoformat(iso_string)
    except Exception as e:
        logger.error(f"Error parsing datetime {iso_string}: {e}")
        return None

def assess_connection_risk(arrival_eta_str, connection_std_str, mct_minutes, pax_count):
    """Assess individual connection risk"""
    
    arrival_time = parse_iso_datetime(arrival_eta_str)
    connection_time = parse_iso_datetime(connection_std_str)
    
    if not arrival_time or not connection_time:
        return {
            "connection_flight": "ERROR",
            "risk_level": "Unknown",
            "buffer_minutes": 0,
            "passengers_affected": 0,
            "status": "Parse Error"
        }
    
    # Calculate connection buffer time
    buffer_minutes = int((connection_time - arrival_time).total_seconds() / 60)
    
    # Determine risk level based on buffer vs MCT
    if buffer_minutes < 0:
        risk_level = "Missed"
        status = "Connection impossible - already departed"
        passengers_affected = pax_count
    elif buffer_minutes < mct_minutes:
        risk_level = "Tight"
        status = f"Below MCT by {mct_minutes - buffer_minutes} minutes"
        passengers_affected = pax_count
    elif buffer_minutes < mct_minutes + 15:
        risk_level = "Caution"
        status = "Minimal buffer above MCT"
        passengers_affected = int(pax_count * 0.3)  # Assume 30% may miss
    else:
        risk_level = "Safe"
        status = "Adequate connection time"
        passengers_affected = 0
    
    logger.info(f"Connection risk: {risk_level} - {buffer_minutes}min buffer for {pax_count} pax")
    
    return {
        "buffer_minutes": buffer_minutes,
        "risk_level": risk_level,
        "passengers_affected": passengers_affected,
        "status": status
    }

def batch_connection_risk(arrival_eta_str, connection_list, mct_minutes):
    """Assess connection risk for multiple connecting flights"""
    
    risk_assessments = []
    
    for connection in connection_list:
        connection_flight = connection.get("connection_flight", "Unknown")
        connection_std = connection.get("connection_std", "")
        pax_count = connection.get("pax_count", 0)
        
        # Assess individual connection
        risk_data = assess_connection_risk(arrival_eta_str, connection_std, mct_minutes, pax_count)
        
        # Add flight identifier
        risk_data["connection_flight"] = connection_flight
        risk_data["scheduled_pax"] = pax_count
        
        risk_assessments.append(risk_data)
        
        logger.info(f"Processed connection {connection_flight}: {risk_data['risk_level']}")
    
    # Calculate summary statistics
    total_connections = len(risk_assessments)
    high_risk_connections = len([r for r in risk_assessments if r["risk_level"] in ["Missed", "Tight"]])
    total_pax_at_risk = sum([r["passengers_affected"] for r in risk_assessments])
    
    logger.info(f"Batch analysis: {high_risk_connections}/{total_connections} high-risk connections, {total_pax_at_risk} pax affected")
    
    return risk_assessments

def generate_connection_summary(arrival_eta_str, connection_list, mct_minutes):
    """Generate comprehensive connection risk summary"""
    
    risk_assessments = batch_connection_risk(arrival_eta_str, connection_list, mct_minutes)
    
    # Calculate summary metrics
    total_connections = len(risk_assessments)
    missed_connections = len([r for r in risk_assessments if r["risk_level"] == "Missed"])
    tight_connections = len([r for r in risk_assessments if r["risk_level"] == "Tight"])
    safe_connections = len([r for r in risk_assessments if r["risk_level"] == "Safe"])
    
    total_scheduled_pax = sum([r["scheduled_pax"] for r in risk_assessments])
    total_affected_pax = sum([r["passengers_affected"] for r in risk_assessments])
    
    # Generate overall risk level
    if missed_connections > 0:
        overall_risk = "HIGH"
        priority_action = "Immediate passenger reaccommodation required"
    elif tight_connections > 0:
        overall_risk = "MEDIUM"
        priority_action = "Monitor connections and prepare assistance"
    else:
        overall_risk = "LOW"
        priority_action = "Standard connection monitoring"
    
    summary = {
        "analysis_timestamp": datetime.now().isoformat(),
        "arrival_eta": arrival_eta_str,
        "mct_minutes": mct_minutes,
        "connection_summary": {
            "total_connections": total_connections,
            "missed_connections": missed_connections,
            "tight_connections": tight_connections,
            "safe_connections": safe_connections
        },
        "passenger_impact": {
            "total_scheduled": total_scheduled_pax,
            "total_affected": total_affected_pax,
            "impact_percentage": round((total_affected_pax / total_scheduled_pax) * 100, 1) if total_scheduled_pax > 0 else 0
        },
        "overall_risk_level": overall_risk,
        "priority_action": priority_action,
        "detailed_assessments": risk_assessments
    }
    
    logger.info(f"Connection summary: {overall_risk} risk, {total_affected_pax}/{total_scheduled_pax} pax affected")
    
    return summary

def main():
    """Demonstration of Connection Risk Engine"""
    logger.info("Connection Risk Engine demonstration starting...")
    
    # Example data
    arrival_eta = "2025-07-11T18:05:00Z"
    connections = [
        {"connection_flight": "DL215", "connection_std": "2025-07-11T18:25:00Z", "pax_count": 9},
        {"connection_flight": "DL411", "connection_std": "2025-07-11T18:10:00Z", "pax_count": 6},
        {"connection_flight": "KL602", "connection_std": "2025-07-11T18:50:00Z", "pax_count": 3}
    ]
    mct = 45
    
    # Generate analysis
    risk_analysis = batch_connection_risk(arrival_eta, connections, mct)
    summary = generate_connection_summary(arrival_eta, connections, mct)
    
    print("Connection Risk Analysis:")
    for assessment in risk_analysis:
        print(f"  {assessment['connection_flight']}: {assessment['risk_level']} - {assessment['passengers_affected']} pax affected")
    
    print(f"\nSummary: {summary['overall_risk_level']} risk - {summary['priority_action']}")
    
    return risk_analysis, summary

if __name__ == "__main__":
    main()
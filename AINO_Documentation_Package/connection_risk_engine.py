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
    """Assess individual connection risk with enhanced logic"""
    
    try:
        # Parse ISO timestamps using improved method
        eta = datetime.strptime(arrival_eta_str, "%Y-%m-%dT%H:%M:%SZ")
        std = datetime.strptime(connection_std_str, "%Y-%m-%dT%H:%M:%SZ")
        
        gap = (std - eta).total_seconds() / 60  # in minutes
        risk = "Low"
        action = "No action needed"
        passengers_affected = 0
        
        if gap < 0:
            risk = "Missed"
            action = "Rebook and notify OCC"
            passengers_affected = pax_count
        elif gap < mct_minutes:
            risk = "Missed"
            action = "Rebook and notify OCC"
            passengers_affected = pax_count
        elif gap < mct_minutes + 15:
            risk = "Tight"
            action = "Priority transfer or stand coordination"
            passengers_affected = pax_count
        else:
            risk = "Safe"
            action = "No action needed"
            passengers_affected = 0
            
        logger.info(f"Connection risk: {risk} - {round(gap)}min gap for {pax_count} pax")
        
        return {
            "arrival_eta": eta.strftime("%Y-%m-%d %H:%M"),
            "connection_std": std.strftime("%Y-%m-%d %H:%M"),
            "gap_minutes": round(gap),
            "buffer_minutes": round(gap),  # Legacy compatibility
            "risk_level": risk,
            "passengers_affected": passengers_affected,
            "recommended_action": action,
            "status": action  # Legacy compatibility
        }
        
    except Exception as e:
        logger.error(f"Error parsing connection times {arrival_eta_str} / {connection_std_str}: {e}")
        return {
            "connection_flight": "ERROR",
            "risk_level": "Unknown",
            "buffer_minutes": 0,
            "gap_minutes": 0,
            "passengers_affected": 0,
            "recommended_action": "Manual review required",
            "status": "Parse Error"
        }

def batch_connection_risk(arrival_eta_str, connection_list, mct_minutes):
    """Assess connection risk for multiple connecting flights with enhanced processing"""
    
    risk_assessments = []
    
    for connection in connection_list:
        connection_flight = connection.get("connection_flight", "Unknown")
        connection_std = connection.get("connection_std", "")
        pax_count = connection.get("pax_count", 0)
        
        # Assess individual connection using enhanced method
        risk_data = assess_connection_risk(arrival_eta_str, connection_std, mct_minutes, pax_count)
        
        # Add flight identifier and passenger info
        risk_data["connection_flight"] = connection_flight
        risk_data["scheduled_pax"] = pax_count
        
        risk_assessments.append(risk_data)
        
        logger.info(f"Processed connection {connection_flight}: {risk_data['risk_level']} ({risk_data['gap_minutes']}min gap)")
    
    # Calculate enhanced summary statistics
    total_connections = len(risk_assessments)
    missed_connections = len([r for r in risk_assessments if r["risk_level"] == "Missed"])
    tight_connections = len([r for r in risk_assessments if r["risk_level"] == "Tight"])
    safe_connections = len([r for r in risk_assessments if r["risk_level"] in ["Safe", "Low"]])
    total_pax_at_risk = sum([r["passengers_affected"] for r in risk_assessments])
    
    logger.info(f"Enhanced batch analysis: {missed_connections} missed, {tight_connections} tight, {safe_connections} safe - {total_pax_at_risk} pax affected")
    
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
"""
Total Risk Intelligence (TRI) Engine for AINO Aviation Intelligence Platform
Combines fuel optimization with comprehensive operational risk synthesis
"""

from datetime import datetime, timedelta
from geopy.distance import geodesic
import logging

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

def estimate_fuel_savings(discretionary_kg, reduction_possible_kg, fuel_price_per_kg=0.85):
    """Calculate potential fuel cost savings"""
    saved_kg = max(0, min(discretionary_kg, reduction_possible_kg))
    savings = round(saved_kg * fuel_price_per_kg, 2)
    logger.info(f"Fuel savings: {saved_kg}kg = ${savings}")
    return savings

def assess_passenger_connection_risk(pax_missed, avg_reaccommodation_cost=150):
    """Assess financial impact of missed passenger connections"""
    total_cost = round(pax_missed * avg_reaccommodation_cost, 2)
    logger.info(f"Connection risk: {pax_missed} passengers = ${total_cost}")
    return total_cost

def estimate_crew_breach_risk(time_to_duty_end_min, estimated_arrival_delay_min):
    """Assess crew duty time breach risk"""
    remaining_time = time_to_duty_end_min - estimated_arrival_delay_min
    
    if estimated_arrival_delay_min > time_to_duty_end_min:
        risk_level = "High"
        action = "Swap required or risk cancellation"
    elif remaining_time <= 30:
        risk_level = "Medium" 
        action = "Recommend controller review"
    else:
        risk_level = "Low"
        action = "No action required"
    
    logger.info(f"Crew risk: {risk_level} - {action}")
    return risk_level, action

def estimate_diversion_cost(risk_level, distance_from_dest_km, base_cost=10000):
    """Calculate potential diversion costs"""
    if risk_level == "High":
        total_cost = round(base_cost + (distance_from_dest_km * 2), 2)
    elif risk_level == "Medium":
        total_cost = round(base_cost * 0.75, 2)
    else:
        total_cost = 0
    
    logger.info(f"Diversion cost: {risk_level} = ${total_cost}")
    return total_cost

def generate_tri_summary(flight_id, discretionary_fuel, fuel_reduction_kg, pax_missed, 
                          time_to_duty_end_min, delay_min, diversion_risk_level, diversion_distance_km):
    """Generate comprehensive Total Risk Intelligence summary"""
    
    # Calculate individual risk components
    fuel_saving = estimate_fuel_savings(discretionary_fuel, fuel_reduction_kg)
    pax_impact_cost = assess_passenger_connection_risk(pax_missed)
    crew_risk, crew_action = estimate_crew_breach_risk(time_to_duty_end_min, delay_min)
    diversion_cost = estimate_diversion_cost(diversion_risk_level, diversion_distance_km)

    # Calculate total financial impact
    total_impact = fuel_saving - pax_impact_cost - diversion_cost
    
    # Generate risk-based recommendation
    if total_impact > 1000:
        recommendation = f"OPTIMIZE: Implement fuel reduction for {flight_id} - Net benefit ${total_impact}"
        priority = "HIGH"
    elif total_impact > 0:
        recommendation = f"CONSIDER: Moderate benefit for {flight_id} - Net benefit ${total_impact}"
        priority = "MEDIUM"
    else:
        recommendation = f"MAINTAIN: Current operation optimal for {flight_id} - Risk outweighs savings"
        priority = "LOW"

    tri_summary = {
        "flight_id": flight_id,
        "fuel_cost_saving": fuel_saving,
        "pax_connection_cost": pax_impact_cost,
        "crew_risk": crew_risk,
        "crew_action": crew_action,
        "diversion_cost": diversion_cost,
        "total_estimated_impact": round(total_impact, 2),
        "recommendation": recommendation,
        "priority": priority,
        "analysis_timestamp": datetime.now().isoformat()
    }
    
    logger.info(f"TRI Summary generated for {flight_id}: Net impact ${total_impact}")
    return tri_summary

# Compatibility functions for existing fuel optimization calculator
def generate_tri_summary_legacy(flight_id, discretionary_fuel, fuel_reduction_kg, pax_missed, 
                          time_to_duty_end_min, delay_min, diversion_risk_level, diversion_distance_km):
    """Legacy compatibility function"""
    return generate_tri_summary(flight_id, discretionary_fuel, fuel_reduction_kg, pax_missed, 
                               time_to_duty_end_min, delay_min, diversion_risk_level, diversion_distance_km)

def main():
    """Demonstration of TRI Engine"""
    logger.info("TRI Engine demonstration starting...")
    
    # Example analysis
    result = generate_tri_summary(
        flight_id="VS3",
        discretionary_fuel=600,
        fuel_reduction_kg=400,
        pax_missed=18,
        time_to_duty_end_min=90,
        delay_min=20,
        diversion_risk_level="Low",
        diversion_distance_km=0
    )
    
    print("TRI Summary Result:")
    for key, value in result.items():
        print(f"  {key}: {value}")
    
    return result

if __name__ == "__main__":
    main()
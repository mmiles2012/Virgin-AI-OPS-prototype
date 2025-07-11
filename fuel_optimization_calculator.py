"""
Enhanced Fuel Optimization Calculator for AINO Aviation Intelligence Platform
Integrates fuel savings analysis with operational risk assessment and cost modeling
"""

from datetime import datetime, timedelta
from geopy.distance import geodesic
import json
import logging

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class AINOFuelOptimizationEngine:
    """Advanced fuel optimization engine with comprehensive operational risk analysis"""
    
    def __init__(self):
        self.fuel_price_per_kg = 0.85  # USD per kg
        self.avg_reaccommodation_cost = 150  # USD per passenger
        self.base_diversion_cost = 10000  # USD base cost
        logger.info("AINO Fuel Optimization Engine initialized")
    
    def estimate_fuel_savings(self, discretionary_kg, reduction_possible_kg, fuel_price_per_kg=None):
        """Calculate potential fuel cost savings"""
        price = fuel_price_per_kg or self.fuel_price_per_kg
        saved_kg = max(0, min(discretionary_kg, reduction_possible_kg))
        savings = round(saved_kg * price, 2)
        
        logger.info(f"Fuel savings calculation: {saved_kg}kg saved = ${savings}")
        return {
            "fuel_saved_kg": saved_kg,
            "cost_savings_usd": savings,
            "fuel_price_per_kg": price
        }
    
    def assess_passenger_connection_risk(self, pax_missed, avg_reaccommodation_cost=None):
        """Assess financial impact of missed passenger connections"""
        cost_per_pax = avg_reaccommodation_cost or self.avg_reaccommodation_cost
        total_cost = round(pax_missed * cost_per_pax, 2)
        
        risk_level = "LOW" if pax_missed <= 5 else "MEDIUM" if pax_missed <= 15 else "HIGH"
        
        logger.info(f"Connection risk: {pax_missed} passengers missed = ${total_cost} ({risk_level})")
        return {
            "passengers_missed": pax_missed,
            "reaccommodation_cost_usd": total_cost,
            "cost_per_passenger": cost_per_pax,
            "risk_level": risk_level
        }
    
    def estimate_crew_breach_risk(self, time_to_duty_end_min, estimated_arrival_delay_min):
        """Assess crew duty time breach risk"""
        remaining_time = time_to_duty_end_min - estimated_arrival_delay_min
        
        if estimated_arrival_delay_min > time_to_duty_end_min:
            risk_level = "HIGH"
            action = "Swap required or risk cancellation"
            cost_impact = 25000  # Estimated cancellation cost
        elif remaining_time <= 30:
            risk_level = "MEDIUM"
            action = "Recommend controller review"
            cost_impact = 5000  # Potential delay costs
        else:
            risk_level = "LOW"
            action = "No action required"
            cost_impact = 0
        
        logger.info(f"Crew risk: {risk_level} - {action}")
        return {
            "risk_level": risk_level,
            "recommended_action": action,
            "remaining_duty_time_min": remaining_time,
            "estimated_cost_impact": cost_impact
        }
    
    def estimate_diversion_cost(self, risk_level, distance_from_dest_km, base_cost=None):
        """Calculate potential diversion costs"""
        base = base_cost or self.base_diversion_cost
        
        if risk_level == "HIGH":
            total_cost = round(base + (distance_from_dest_km * 2), 2)
        elif risk_level == "MEDIUM":
            total_cost = round(base * 0.75, 2)
        else:
            total_cost = 0
        
        logger.info(f"Diversion cost estimate: {risk_level} risk = ${total_cost}")
        return {
            "risk_level": risk_level,
            "distance_km": distance_from_dest_km,
            "estimated_cost_usd": total_cost,
            "base_cost": base if total_cost > 0 else 0
        }
    
    def generate_comprehensive_analysis(self, flight_id, discretionary_fuel, fuel_reduction_kg, 
                                      pax_missed, time_to_duty_end_min, delay_min, 
                                      diversion_risk_level, diversion_distance_km, aircraft_type=None):
        """Generate comprehensive fuel optimization analysis with all risk factors"""
        
        # Calculate individual components
        fuel_analysis = self.estimate_fuel_savings(discretionary_fuel, fuel_reduction_kg)
        connection_analysis = self.assess_passenger_connection_risk(pax_missed)
        crew_analysis = self.estimate_crew_breach_risk(time_to_duty_end_min, delay_min)
        diversion_analysis = self.estimate_diversion_cost(diversion_risk_level, diversion_distance_km)
        
        # Calculate total financial impact
        total_savings = fuel_analysis["cost_savings_usd"]
        total_costs = (connection_analysis["reaccommodation_cost_usd"] + 
                      crew_analysis["estimated_cost_impact"] + 
                      diversion_analysis["estimated_cost_usd"])
        
        net_impact = round(total_savings - total_costs, 2)
        
        # Generate optimization recommendation
        if net_impact > 1000:
            recommendation = f"OPTIMIZE: Implement fuel reduction for {flight_id} - Net benefit ${net_impact}"
            priority = "HIGH"
        elif net_impact > 0:
            recommendation = f"CONSIDER: Moderate benefit for {flight_id} - Net benefit ${net_impact}"
            priority = "MEDIUM"
        else:
            recommendation = f"MAINTAIN: Current fuel load optimal for {flight_id} - Risk outweighs savings"
            priority = "LOW"
        
        # Comprehensive analysis report
        analysis_report = {
            "flight_id": flight_id,
            "aircraft_type": aircraft_type,
            "analysis_timestamp": datetime.now().isoformat(),
            "fuel_optimization": fuel_analysis,
            "passenger_connections": connection_analysis,
            "crew_duty_analysis": crew_analysis,
            "diversion_risk": diversion_analysis,
            "financial_summary": {
                "total_potential_savings": total_savings,
                "total_risk_costs": total_costs,
                "net_financial_impact": net_impact,
                "optimization_priority": priority
            },
            "recommendation": recommendation,
            "next_actions": self._generate_action_items(fuel_analysis, connection_analysis, 
                                                       crew_analysis, diversion_analysis)
        }
        
        logger.info(f"Analysis complete for {flight_id}: Net impact ${net_impact}")
        return analysis_report
    
    def _generate_action_items(self, fuel_analysis, connection_analysis, crew_analysis, diversion_analysis):
        """Generate specific action items based on analysis results"""
        actions = []
        
        if fuel_analysis["fuel_saved_kg"] > 100:
            actions.append(f"Review fuel uplift - potential {fuel_analysis['fuel_saved_kg']}kg reduction")
        
        if connection_analysis["risk_level"] in ["MEDIUM", "HIGH"]:
            actions.append(f"Monitor {connection_analysis['passengers_missed']} at-risk connections")
        
        if crew_analysis["risk_level"] != "LOW":
            actions.append(crew_analysis["recommended_action"])
        
        if diversion_analysis["estimated_cost_usd"] > 0:
            actions.append(f"Evaluate diversion alternatives - ${diversion_analysis['estimated_cost_usd']} risk")
        
        return actions
    
    def batch_analysis(self, flights_data):
        """Perform batch analysis on multiple flights"""
        results = []
        
        for flight_data in flights_data:
            try:
                analysis = self.generate_comprehensive_analysis(**flight_data)
                results.append(analysis)
            except Exception as e:
                logger.error(f"Error analyzing flight {flight_data.get('flight_id', 'unknown')}: {e}")
                continue
        
        # Generate batch summary
        total_savings = sum(r["financial_summary"]["total_potential_savings"] for r in results)
        total_costs = sum(r["financial_summary"]["total_risk_costs"] for r in results)
        net_fleet_impact = round(total_savings - total_costs, 2)
        
        batch_summary = {
            "analysis_timestamp": datetime.now().isoformat(),
            "flights_analyzed": len(results),
            "fleet_summary": {
                "total_potential_savings": round(total_savings, 2),
                "total_risk_costs": round(total_costs, 2),
                "net_fleet_impact": net_fleet_impact
            },
            "high_priority_optimizations": len([r for r in results if r["financial_summary"]["optimization_priority"] == "HIGH"]),
            "individual_analyses": results
        }
        
        logger.info(f"Batch analysis complete: {len(results)} flights, net impact ${net_fleet_impact}")
        return batch_summary

def main():
    """Demonstration of AINO Fuel Optimization Engine"""
    engine = AINOFuelOptimizationEngine()
    
    # Example Virgin Atlantic flight analysis
    sample_analysis = engine.generate_comprehensive_analysis(
        flight_id="VS103",
        discretionary_fuel=2000,
        fuel_reduction_kg=800,
        pax_missed=12,
        time_to_duty_end_min=180,
        delay_min=45,
        diversion_risk_level="MEDIUM",
        diversion_distance_km=350,
        aircraft_type="A350-1000"
    )
    
    print("AINO Fuel Optimization Analysis:")
    print(json.dumps(sample_analysis, indent=2))
    
    return sample_analysis

if __name__ == "__main__":
    main()
import pandas as pd
import numpy as np

# Fuel burn savings model (simple placeholder, replace with real model or regression)
def estimate_fuel_savings(flight_duration_hrs, route_class, forecast_wind_speed):
    base_burn_per_hr = {
        'long-haul': 5500,
        'short-haul': 2400
    }
    reduction_factor = 1 - (forecast_wind_speed / 200)  # crude wind impact
    savings = base_burn_per_hr[route_class] * flight_duration_hrs * (1 - reduction_factor)
    return max(savings, 0)


# EU261 exposure model
def estimate_eu261_exposure(predicted_delay_mins, pax_count, flight_distance_km):
    if predicted_delay_mins < 180:
        return 0
    if flight_distance_km < 1500:
        comp = 250
    elif flight_distance_km < 3500:
        comp = 400
    else:
        comp = 600

    return pax_count * comp


# Combined cost function for a flight
def calculate_total_operational_risk(predicted_delay_mins, pax_count, distance_km,
                                      flight_duration_hrs, route_class, wind_speed):
    fuel_savings = estimate_fuel_savings(flight_duration_hrs, route_class, wind_speed)
    eu261_cost = estimate_eu261_exposure(predicted_delay_mins, pax_count, distance_km)
    return {
        'predicted_delay_mins': predicted_delay_mins,
        'fuel_savings_estimate': fuel_savings,
        'eu261_exposure': eu261_cost,
        'net_cost_risk': eu261_cost - fuel_savings
    }


# Enhanced economics functions for AINO platform
def calculate_eu261_risk_score(prob_delay_3h, pax_count, avg_compensation):
    """Calculate EU261 risk score using probability and compensation data"""
    eu261_risk_score = prob_delay_3h * pax_count * avg_compensation
    return eu261_risk_score


def calculate_fuel_efficiency_impact(baseline_fuel_burn, predicted_fuel_burn):
    """Calculate expected fuel savings from optimization"""
    expected_fuel_savings = baseline_fuel_burn - predicted_fuel_burn
    return expected_fuel_savings


def comprehensive_economic_analysis(flight_data, weather_data, delay_prediction):
    """
    Comprehensive economic analysis for flight operations
    Integrates fuel optimization, EU261 risk, and operational costs
    """
    
    # Extract flight parameters
    pax_count = flight_data.get('passenger_count', 200)
    distance_km = flight_data.get('distance_km', 5000)
    flight_duration_hrs = flight_data.get('flight_duration_hrs', 8.0)
    route_class = flight_data.get('route_class', 'long-haul')
    
    # Extract weather parameters
    wind_speed = weather_data.get('wind_speed', 25)
    
    # Calculate delay probability (3+ hours)
    prob_delay_3h = min(1.0, max(0.0, (delay_prediction - 120) / 180))  # Sigmoid approximation
    
    # EU261 compensation amounts by distance
    if distance_km < 1500:
        avg_compensation = 250
    elif distance_km < 3500:
        avg_compensation = 400
    else:
        avg_compensation = 600
    
    # Calculate core metrics
    fuel_savings = estimate_fuel_savings(flight_duration_hrs, route_class, wind_speed)
    eu261_exposure = estimate_eu261_exposure(delay_prediction, pax_count, distance_km)
    eu261_risk_score = calculate_eu261_risk_score(prob_delay_3h, pax_count, avg_compensation)
    
    # Operational cost factors
    crew_cost_per_hour = 800  # Average crew cost
    aircraft_cost_per_hour = 12000  # Operating cost
    gate_cost_per_hour = 150  # Gate fees
    
    delay_hours = delay_prediction / 60
    operational_delay_cost = delay_hours * (crew_cost_per_hour + aircraft_cost_per_hour + gate_cost_per_hour)
    
    # Passenger experience costs (soft costs)
    passenger_service_cost = 0
    if delay_prediction > 60:
        passenger_service_cost = pax_count * 15  # Meal vouchers, etc.
    if delay_prediction > 180:
        passenger_service_cost += pax_count * 100  # Hotel accommodation
    
    # Total economic impact
    total_delay_cost = eu261_exposure + operational_delay_cost + passenger_service_cost
    net_economic_impact = total_delay_cost - fuel_savings
    
    return {
        'predicted_delay_mins': delay_prediction,
        'fuel_savings_estimate': fuel_savings,
        'eu261_exposure': eu261_exposure,
        'eu261_risk_score': eu261_risk_score,
        'operational_delay_cost': operational_delay_cost,
        'passenger_service_cost': passenger_service_cost,
        'total_delay_cost': total_delay_cost,
        'net_economic_impact': net_economic_impact,
        'cost_per_passenger': net_economic_impact / pax_count if pax_count > 0 else 0,
        'prob_delay_3h': prob_delay_3h
    }


def generate_economic_optimization_recommendations(economic_analysis, flight_data):
    """Generate cost optimization recommendations based on economic analysis"""
    
    recommendations = []
    potential_savings = 0
    
    # High EU261 risk recommendations
    if economic_analysis['eu261_risk_score'] > 50000:
        recommendations.append({
            'category': 'Schedule Optimization',
            'recommendation': 'Consider departure time adjustment to reduce delay probability',
            'potential_saving': economic_analysis['eu261_exposure'] * 0.3,
            'priority': 'Critical'
        })
        potential_savings += economic_analysis['eu261_exposure'] * 0.3
    
    # Operational cost recommendations
    if economic_analysis['operational_delay_cost'] > 20000:
        recommendations.append({
            'category': 'Resource Management',
            'recommendation': 'Implement predictive crew scheduling to minimize overtime costs',
            'potential_saving': economic_analysis['operational_delay_cost'] * 0.25,
            'priority': 'High'
        })
        potential_savings += economic_analysis['operational_delay_cost'] * 0.25
    
    # Passenger service optimization
    if economic_analysis['passenger_service_cost'] > 5000:
        recommendations.append({
            'category': 'Passenger Services',
            'recommendation': 'Deploy proactive passenger communication to reduce service costs',
            'potential_saving': economic_analysis['passenger_service_cost'] * 0.4,
            'priority': 'Medium'
        })
        potential_savings += economic_analysis['passenger_service_cost'] * 0.4
    
    # Fuel efficiency recommendations
    if economic_analysis['fuel_savings_estimate'] < 1000:
        recommendations.append({
            'category': 'Fuel Optimization',
            'recommendation': 'Enhance route planning for better fuel efficiency',
            'potential_saving': 2000,  # Estimated additional fuel savings
            'priority': 'Medium'
        })
        potential_savings += 2000
    
    return {
        'recommendations': recommendations,
        'total_potential_savings': potential_savings,
        'roi_improvement_percent': (potential_savings / max(economic_analysis['total_delay_cost'], 1)) * 100
    }


def economic_dashboard_summary(economic_results_list):
    """Generate executive summary of economic performance across multiple flights"""
    
    if not economic_results_list:
        return {}
    
    df = pd.DataFrame(economic_results_list)
    
    summary = {
        'total_flights_analyzed': len(df),
        'total_economic_impact': df['net_economic_impact'].sum(),
        'average_cost_per_flight': df['net_economic_impact'].mean(),
        'total_eu261_exposure': df['eu261_exposure'].sum(),
        'high_risk_flights': len(df[df['eu261_risk_score'] > 25000]),
        'fuel_savings_potential': df['fuel_savings_estimate'].sum(),
        'worst_performing_flight': df.loc[df['net_economic_impact'].idxmax()]['flight'] if 'flight' in df.columns else 'N/A',
        'best_performing_flight': df.loc[df['net_economic_impact'].idxmin()]['flight'] if 'flight' in df.columns else 'N/A',
        'cost_distribution': {
            'low_cost': len(df[df['net_economic_impact'] < 10000]),
            'medium_cost': len(df[(df['net_economic_impact'] >= 10000) & (df['net_economic_impact'] < 50000)]),
            'high_cost': len(df[df['net_economic_impact'] >= 50000])
        }
    }
    
    return summary
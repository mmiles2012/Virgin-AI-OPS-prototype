#!/usr/bin/env python3
"""
Fuel Optimization Engine for AINO Aviation Intelligence Platform
Real-time fuel efficiency analysis and optimization recommendations
"""

import pandas as pd
import numpy as np
from datetime import datetime, timedelta
import joblib
from sklearn.ensemble import RandomForestRegressor
from sklearn.preprocessing import LabelEncoder
import json
import requests
import re
from textblob import TextBlob

class FuelOptimizationEngine:
    """Advanced fuel efficiency optimization with real-time recommendations"""
    
    def __init__(self):
        self.aircraft_fuel_models = self._initialize_aircraft_models()
        self.weather_impact_factors = self._initialize_weather_factors()
        self.route_efficiency_data = {}
        self.fuel_price_predictor = self._initialize_fuel_price_ml_model()
        self.news_sentiment_cache = {}
        
        # Initialize with the provided Financial Times article
        self.add_fuel_cost_news_source(
            "https://on.ft.com/4kSn8xO",
            "Financial Times fuel cost analysis"
        )
        
    def _initialize_aircraft_models(self):
        """Initialize fuel consumption models for different aircraft types"""
        return {
            'Boeing 737-800': {
                'cruise_fuel_flow': 2400,  # kg/hour
                'takeoff_fuel_penalty': 180,  # kg per minute delay
                'idle_fuel_burn': 300,  # kg/hour
                'weight_factor': 0.000045,  # additional fuel per kg payload
                'altitude_efficiency': {8000: 1.15, 10000: 1.05, 11000: 1.0, 12000: 0.95}
            },
            'Airbus A320': {
                'cruise_fuel_flow': 2200,
                'takeoff_fuel_penalty': 160,
                'idle_fuel_burn': 280,
                'weight_factor': 0.000043,
                'altitude_efficiency': {8000: 1.12, 10000: 1.03, 11000: 1.0, 12000: 0.96}
            },
            'Boeing 787-9': {
                'cruise_fuel_flow': 5800,
                'takeoff_fuel_penalty': 420,
                'idle_fuel_burn': 720,
                'weight_factor': 0.000038,
                'altitude_efficiency': {9000: 1.08, 11000: 1.02, 13000: 1.0, 14000: 0.94}
            },
            'Airbus A350-900': {
                'cruise_fuel_flow': 5600,
                'takeoff_fuel_penalty': 400,
                'idle_fuel_burn': 680,
                'weight_factor': 0.000036,
                'altitude_efficiency': {9000: 1.07, 11000: 1.01, 13000: 1.0, 14000: 0.95}
            }
        }
    
    def _initialize_weather_factors(self):
        """Initialize weather impact factors on fuel consumption"""
        return {
            'headwind_factor': 0.03,  # 3% fuel increase per 10kt headwind
            'tailwind_factor': -0.02,  # 2% fuel decrease per 10kt tailwind
            'turbulence_factor': 0.08,  # 8% fuel increase in severe turbulence
            'icing_factor': 0.12,  # 12% fuel increase with icing conditions
            'temperature_factor': 0.015  # 1.5% per 10°C above ISA
        }
    
    def calculate_baseline_fuel_consumption(self, flight_data):
        """Calculate baseline fuel consumption for a flight"""
        
        aircraft_type = flight_data.get('aircraft_type', 'Boeing 737-800')
        flight_time_hours = flight_data.get('flight_time_hours', 2.5)
        payload_kg = flight_data.get('payload_kg', 15000)
        cruise_altitude = flight_data.get('cruise_altitude_ft', 37000)
        
        if aircraft_type not in self.aircraft_fuel_models:
            aircraft_type = 'Boeing 737-800'  # Default fallback
        
        model = self.aircraft_fuel_models[aircraft_type]
        
        # Base cruise fuel consumption
        base_fuel = model['cruise_fuel_flow'] * flight_time_hours
        
        # Payload impact
        payload_fuel = payload_kg * model['weight_factor'] * flight_time_hours
        
        # Altitude efficiency
        altitude_factor = 1.0
        for alt, factor in model['altitude_efficiency'].items():
            if cruise_altitude >= alt * 100:  # Convert to feet
                altitude_factor = factor
            else:
                break
        
        baseline_fuel_burn = (base_fuel + payload_fuel) * altitude_factor
        
        return {
            'baseline_fuel_kg': baseline_fuel_burn,
            'cruise_component': base_fuel * altitude_factor,
            'payload_component': payload_fuel * altitude_factor,
            'altitude_factor': altitude_factor
        }
    
    def calculate_weather_impact(self, flight_data, weather_data):
        """Calculate weather impact on fuel consumption"""
        
        baseline = self.calculate_baseline_fuel_consumption(flight_data)
        baseline_fuel_burn = baseline['baseline_fuel_kg']
        
        # Wind impact
        wind_speed = weather_data.get('wind_speed', 0)
        wind_direction = weather_data.get('wind_direction', 0)
        flight_heading = flight_data.get('heading', 0)
        
        # Calculate headwind/tailwind component
        wind_angle = abs(wind_direction - flight_heading)
        if wind_angle > 180:
            wind_angle = 360 - wind_angle
        
        headwind_component = wind_speed * np.cos(np.radians(wind_angle))
        
        wind_fuel_impact = 0
        if headwind_component > 0:
            wind_fuel_impact = baseline_fuel_burn * self.weather_impact_factors['headwind_factor'] * (headwind_component / 10)
        else:
            wind_fuel_impact = baseline_fuel_burn * self.weather_impact_factors['tailwind_factor'] * (abs(headwind_component) / 10)
        
        # Temperature impact
        temperature = weather_data.get('temperature', 15)
        isa_temperature = 15 - (flight_data.get('cruise_altitude_ft', 37000) * 0.00198)  # ISA model
        temp_deviation = temperature - isa_temperature
        temp_fuel_impact = baseline_fuel_burn * self.weather_impact_factors['temperature_factor'] * (temp_deviation / 10)
        
        # Turbulence impact
        turbulence_level = weather_data.get('turbulence_level', 'none')
        turbulence_fuel_impact = 0
        if turbulence_level == 'severe':
            turbulence_fuel_impact = baseline_fuel_burn * self.weather_impact_factors['turbulence_factor']
        elif turbulence_level == 'moderate':
            turbulence_fuel_impact = baseline_fuel_burn * (self.weather_impact_factors['turbulence_factor'] * 0.5)
        
        # Icing conditions
        icing_conditions = weather_data.get('icing_risk', False)
        icing_fuel_impact = 0
        if icing_conditions:
            icing_fuel_impact = baseline_fuel_burn * self.weather_impact_factors['icing_factor']
        
        total_weather_impact = wind_fuel_impact + temp_fuel_impact + turbulence_fuel_impact + icing_fuel_impact
        weather_adjusted_fuel = baseline_fuel_burn + total_weather_impact
        
        return {
            'weather_adjusted_fuel_kg': weather_adjusted_fuel,
            'wind_impact_kg': wind_fuel_impact,
            'temperature_impact_kg': temp_fuel_impact,
            'turbulence_impact_kg': turbulence_fuel_impact,
            'icing_impact_kg': icing_fuel_impact,
            'total_weather_impact_kg': total_weather_impact,
            'weather_impact_percentage': (total_weather_impact / baseline_fuel_burn) * 100
        }
    
    def calculate_delay_fuel_impact(self, flight_data, predicted_delay_minutes):
        """Calculate fuel impact from operational delays"""
        
        aircraft_type = flight_data.get('aircraft_type', 'Boeing 737-800')
        model = self.aircraft_fuel_models[aircraft_type]
        
        # Ground delay fuel burn (idling)
        ground_delay_fuel = (predicted_delay_minutes / 60) * model['idle_fuel_burn']
        
        # Takeoff delay penalty (engine warm-up, taxi delays)
        takeoff_penalty = predicted_delay_minutes * model['takeoff_fuel_penalty']
        
        # Air traffic delay (holding patterns, longer routes)
        air_delay_factor = max(0, (predicted_delay_minutes - 15) / 60)  # Only for delays > 15 min
        air_delay_fuel = air_delay_factor * model['cruise_fuel_flow'] * 0.3  # 30% of cruise rate
        
        total_delay_fuel = ground_delay_fuel + takeoff_penalty + air_delay_fuel
        
        return {
            'delay_fuel_kg': total_delay_fuel,
            'ground_delay_component': ground_delay_fuel,
            'takeoff_penalty_component': takeoff_penalty,
            'air_delay_component': air_delay_fuel
        }
    
    def generate_fuel_optimization_recommendations(self, flight_data, weather_data, predicted_delay):
        """Generate comprehensive fuel optimization recommendations"""
        
        print("FUEL OPTIMIZATION ANALYSIS")
        print("=" * 50)
        
        # Calculate baseline fuel consumption
        baseline = self.calculate_baseline_fuel_consumption(flight_data)
        baseline_fuel_burn = baseline['baseline_fuel_kg']
        
        # Calculate weather impact
        weather_impact = self.calculate_weather_impact(flight_data, weather_data)
        weather_adjusted_fuel = weather_impact['weather_adjusted_fuel_kg']
        
        # Calculate delay impact
        delay_impact = self.calculate_delay_fuel_impact(flight_data, predicted_delay)
        delay_fuel = delay_impact['delay_fuel_kg']
        
        # Total predicted fuel consumption
        predicted_fuel_burn = weather_adjusted_fuel + delay_fuel
        
        # Calculate fuel savings opportunities
        expected_fuel_savings = baseline_fuel_burn - predicted_fuel_burn
        
        print(f"Flight: {flight_data.get('flight_number', 'N/A')} ({flight_data.get('aircraft_type', 'Unknown')})")
        print(f"Route: {flight_data.get('origin', 'N/A')} → {flight_data.get('destination', 'N/A')}")
        print()
        
        print("Fuel Consumption Analysis:")
        print(f"  Baseline Fuel Burn: {baseline_fuel_burn:.0f} kg")
        print(f"  Weather Impact: {weather_impact['total_weather_impact_kg']:+.0f} kg ({weather_impact['weather_impact_percentage']:+.1f}%)")
        print(f"  Delay Impact: {delay_fuel:+.0f} kg")
        print(f"  Predicted Total: {predicted_fuel_burn:.0f} kg")
        print()
        
        # Fuel cost analysis (approximate $1.20/kg jet fuel)
        fuel_cost_per_kg = 1.20
        baseline_cost = baseline_fuel_burn * fuel_cost_per_kg
        predicted_cost = predicted_fuel_burn * fuel_cost_per_kg
        cost_impact = predicted_cost - baseline_cost
        
        print("Cost Impact:")
        print(f"  Baseline Fuel Cost: ${baseline_cost:,.0f}")
        print(f"  Predicted Fuel Cost: ${predicted_cost:,.0f}")
        print(f"  Additional Cost: ${cost_impact:+,.0f}")
        print()
        
        # Optimization recommendations
        recommendations = []
        potential_savings = 0
        
        # Weather-based recommendations
        if weather_impact['wind_impact_kg'] > 50:
            if weather_impact['wind_impact_kg'] > 0:
                recommendations.append({
                    'category': 'Route Optimization',
                    'recommendation': 'Consider alternate route to minimize headwind impact',
                    'potential_saving_kg': abs(weather_impact['wind_impact_kg']) * 0.4,
                    'priority': 'High'
                })
            else:
                recommendations.append({
                    'category': 'Route Optimization',
                    'recommendation': 'Current route benefits from tailwind - maintain course',
                    'potential_saving_kg': 0,
                    'priority': 'Info'
                })
        
        if weather_impact['temperature_impact_kg'] > 30:
            recommendations.append({
                'category': 'Altitude Optimization',
                'recommendation': 'Request higher altitude for better temperature efficiency',
                'potential_saving_kg': weather_impact['temperature_impact_kg'] * 0.3,
                'priority': 'Medium'
            })
            potential_savings += weather_impact['temperature_impact_kg'] * 0.3
        
        if weather_impact['turbulence_impact_kg'] > 100:
            recommendations.append({
                'category': 'Route Planning',
                'recommendation': 'Request turbulence-free altitude or route deviation',
                'potential_saving_kg': weather_impact['turbulence_impact_kg'] * 0.6,
                'priority': 'High'
            })
            potential_savings += weather_impact['turbulence_impact_kg'] * 0.6
        
        # Delay-based recommendations
        if predicted_delay > 15:
            recommendations.append({
                'category': 'Ground Operations',
                'recommendation': 'Implement single-engine taxi procedures during delays',
                'potential_saving_kg': delay_impact['ground_delay_component'] * 0.25,
                'priority': 'Medium'
            })
            potential_savings += delay_impact['ground_delay_component'] * 0.25
            
            if predicted_delay > 30:
                recommendations.append({
                    'category': 'Departure Optimization',
                    'recommendation': 'Consider departure slot optimization to reduce air traffic delays',
                    'potential_saving_kg': delay_impact['air_delay_component'] * 0.5,
                    'priority': 'High'
                })
                potential_savings += delay_impact['air_delay_component'] * 0.5
        
        # Performance recommendations
        if flight_data.get('payload_kg', 0) > 0:
            max_payload = 20000  # Typical narrow-body limit
            payload_ratio = flight_data['payload_kg'] / max_payload
            if payload_ratio < 0.7:
                recommendations.append({
                    'category': 'Weight Optimization',
                    'recommendation': 'Optimize fuel load for actual payload (tankering analysis)',
                    'potential_saving_kg': (max_payload - flight_data['payload_kg']) * 0.00002 * baseline_fuel_burn,
                    'priority': 'Low'
                })
        
        # Display recommendations
        print("Optimization Recommendations:")
        print("-" * 40)
        
        if recommendations:
            for i, rec in enumerate(recommendations, 1):
                priority_indicator = "🔴" if rec['priority'] == 'High' else "🟡" if rec['priority'] == 'Medium' else "🟢"
                print(f"{i}. {priority_indicator} {rec['category']}")
                print(f"   {rec['recommendation']}")
                if rec['potential_saving_kg'] > 0:
                    saving_cost = rec['potential_saving_kg'] * fuel_cost_per_kg
                    print(f"   Potential Saving: {rec['potential_saving_kg']:.0f} kg (${saving_cost:.0f})")
                print()
        else:
            print("No significant optimization opportunities identified.")
            print("Current flight profile appears optimal for conditions.")
        
        # Summary
        total_potential_savings = sum(rec['potential_saving_kg'] for rec in recommendations)
        total_cost_savings = total_potential_savings * fuel_cost_per_kg
        
        print("Optimization Summary:")
        print(f"  Total Potential Fuel Savings: {total_potential_savings:.0f} kg")
        print(f"  Total Potential Cost Savings: ${total_cost_savings:.0f}")
        
        environmental_saving = total_potential_savings * 3.16  # CO2 conversion factor
        print(f"  Environmental Impact Reduction: {environmental_saving:.0f} kg CO2")
        
        return {
            'baseline_fuel_kg': baseline_fuel_burn,
            'predicted_fuel_kg': predicted_fuel_burn,
            'expected_fuel_savings': expected_fuel_savings,
            'weather_impact': weather_impact,
            'delay_impact': delay_impact,
            'recommendations': recommendations,
            'potential_savings_kg': total_potential_savings,
            'potential_cost_savings': total_cost_savings,
            'environmental_impact_reduction': environmental_saving
        }

def demo_fuel_optimization():
    """Demonstrate fuel optimization capabilities"""
    
    # Initialize fuel optimization engine
    fuel_engine = FuelOptimizationEngine()
    
    # Sample flight data
    sample_flights = [
        {
            'flight_number': 'BA123',
            'aircraft_type': 'Boeing 737-800',
            'origin': 'EGLL',
            'destination': 'EGKK',
            'flight_time_hours': 1.2,
            'payload_kg': 12000,
            'cruise_altitude_ft': 35000,
            'heading': 180
        },
        {
            'flight_number': 'DL456',
            'aircraft_type': 'Boeing 787-9',
            'origin': 'KJFK',
            'destination': 'EGLL',
            'flight_time_hours': 7.5,
            'payload_kg': 18000,
            'cruise_altitude_ft': 42000,
            'heading': 90
        }
    ]
    
    # Sample weather conditions
    weather_conditions = [
        {
            'wind_speed': 25,
            'wind_direction': 200,  # Headwind for flight heading 180
            'temperature': 5,
            'turbulence_level': 'moderate',
            'icing_risk': False
        },
        {
            'wind_speed': 35,
            'wind_direction': 270,  # Crosswind for flight heading 90
            'temperature': -40,
            'turbulence_level': 'none',
            'icing_risk': True
        }
    ]
    
    # Predicted delays
    predicted_delays = [25, 45]  # minutes
    
    # Generate optimization analysis for each flight
    for i, (flight, weather, delay) in enumerate(zip(sample_flights, weather_conditions, predicted_delays)):
        print(f"\n{'='*70}")
        print(f"FLIGHT OPTIMIZATION ANALYSIS #{i+1}")
        print(f"{'='*70}")
        
        optimization = fuel_engine.generate_fuel_optimization_recommendations(
            flight, weather, delay
        )
        
        print(f"\n{'-'*50}")

if __name__ == "__main__":
    demo_fuel_optimization()
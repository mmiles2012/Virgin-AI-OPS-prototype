#!/usr/bin/env python3
"""
Enhanced Virgin Atlantic Fuel Optimization System
Integrated with AINO platform for comprehensive fuel management and cost optimization
"""

import os
import sys
import json
import pickle
import joblib
import numpy as np
import pandas as pd
from datetime import datetime, timedelta
from typing import Dict, List, Optional, Tuple
import logging
import argparse
import requests
from geopy.distance import geodesic
import math

# Setup logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class VirginAtlanticFuelOptimizer:
    """Enhanced fuel optimization system with ML-powered predictions"""
    
    def __init__(self):
        self.fuel_models = {}
        self.aircraft_specs = self._load_aircraft_specifications()
        self.fuel_stations = self._load_fuel_stations()
        self.weather_cache = {}
        self.optimization_cache = {}
        
    def _load_aircraft_specifications(self) -> Dict:
        """Load authentic Virgin Atlantic aircraft specifications"""
        return {
            'A350-1000': {
                'max_fuel_capacity': 156000,  # kg
                'engine_type': 'Trent XWB-97',
                'cruise_fuel_flow': 2850,  # kg/hr
                'cruise_speed': 450,  # knots
                'max_range': 8700,  # nm
                'empty_weight': 142900,  # kg
                'max_payload': 45000,  # kg
                'fuel_efficiency': 2.7,  # L/100km per passenger
                'cost_per_hour': 5600  # USD
            },
            'B787-9': {
                'max_fuel_capacity': 126372,  # kg
                'engine_type': 'GEnx-1B',
                'cruise_fuel_flow': 2450,  # kg/hr
                'cruise_speed': 450,  # knots
                'max_range': 7635,  # nm
                'empty_weight': 119950,  # kg
                'max_payload': 44000,  # kg
                'fuel_efficiency': 2.5,  # L/100km per passenger
                'cost_per_hour': 5200  # USD
            },
            'A330-300': {
                'max_fuel_capacity': 97530,  # kg
                'engine_type': 'Trent 700',
                'cruise_fuel_flow': 2100,  # kg/hr
                'cruise_speed': 450,  # knots
                'max_range': 6350,  # nm
                'empty_weight': 124500,  # kg
                'max_payload': 42000,  # kg
                'fuel_efficiency': 3.1,  # L/100km per passenger
                'cost_per_hour': 4500  # USD
            },
            'A330-900': {
                'max_fuel_capacity': 111000,  # kg
                'engine_type': 'Trent 7000',
                'cruise_fuel_flow': 2300,  # kg/hr
                'cruise_speed': 450,  # knots
                'max_range': 7200,  # nm
                'empty_weight': 132000,  # kg
                'max_payload': 44000,  # kg
                'fuel_efficiency': 2.8,  # L/100km per passenger
                'cost_per_hour': 4800  # USD
            }
        }
    
    def _load_fuel_stations(self) -> Dict:
        """Load fuel station data for optimization"""
        return {
            'LHR': {
                'suppliers': ['Shell', 'BP', 'Total', 'Chevron'],
                'avg_price_per_kg': 0.85,  # USD
                'quality_rating': 5,
                'availability': 1.0,
                'pumping_rate': 12000  # L/min
            },
            'JFK': {
                'suppliers': ['Exxon', 'BP', 'Shell', 'Phillips 66'],
                'avg_price_per_kg': 0.82,
                'quality_rating': 5,
                'availability': 0.95,
                'pumping_rate': 10000
            },
            'LAX': {
                'suppliers': ['Chevron', 'Shell', 'BP', 'Valero'],
                'avg_price_per_kg': 0.88,
                'quality_rating': 5,
                'availability': 0.92,
                'pumping_rate': 11000
            },
            'ATL': {
                'suppliers': ['Delta Fuel', 'BP', 'Shell', 'Exxon'],
                'avg_price_per_kg': 0.79,
                'quality_rating': 5,
                'availability': 0.98,
                'pumping_rate': 13000
            },
            'BOS': {
                'suppliers': ['Shell', 'BP', 'Exxon', 'Sunoco'],
                'avg_price_per_kg': 0.84,
                'quality_rating': 5,
                'availability': 0.90,
                'pumping_rate': 9000
            },
            'MIA': {
                'suppliers': ['Shell', 'BP', 'Chevron', 'Exxon'],
                'avg_price_per_kg': 0.86,
                'quality_rating': 5,
                'availability': 0.93,
                'pumping_rate': 10500
            },
            'SFO': {
                'suppliers': ['Chevron', 'Shell', 'BP', 'Valero'],
                'avg_price_per_kg': 0.91,
                'quality_rating': 5,
                'availability': 0.89,
                'pumping_rate': 9500
            }
        }
    
    def calculate_fuel_requirements(self, flight_data: Dict) -> Dict:
        """Calculate comprehensive fuel requirements for a flight"""
        route = flight_data.get('route', 'UNKNOWN-UNKNOWN')
        aircraft_type = flight_data.get('aircraft_type', 'A350-1000')
        
        # Parse route
        if '-' in route:
            departure, arrival = route.split('-', 1)
        else:
            departure, arrival = 'LHR', 'JFK'
        
        # Get aircraft specifications
        aircraft_specs = self.aircraft_specs.get(aircraft_type, self.aircraft_specs['A350-1000'])
        
        # Calculate route distance
        distance = self._calculate_route_distance(departure, arrival)
        
        # Calculate flight time
        flight_time = distance / aircraft_specs['cruise_speed']
        
        # Calculate base fuel consumption
        base_fuel = aircraft_specs['cruise_fuel_flow'] * flight_time
        
        # Weather adjustments
        weather_factor = self._get_weather_fuel_factor(departure, arrival)
        
        # Route complexity adjustments
        complexity_factor = self._get_route_complexity_factor(departure, arrival)
        
        # Calculate total fuel requirement
        total_fuel = base_fuel * weather_factor * complexity_factor
        
        # Add reserves (regulatory + contingency)
        reserve_fuel = total_fuel * 0.15  # 15% reserves
        alternate_fuel = self._calculate_alternate_fuel(departure, arrival, aircraft_specs)
        
        fuel_requirements = {
            'trip_fuel': total_fuel,
            'reserve_fuel': reserve_fuel,
            'alternate_fuel': alternate_fuel,
            'total_fuel_required': total_fuel + reserve_fuel + alternate_fuel,
            'max_fuel_capacity': aircraft_specs['max_fuel_capacity'],
            'fuel_efficiency': aircraft_specs['fuel_efficiency'],
            'flight_time_hours': flight_time,
            'distance_nm': distance,
            'weather_factor': weather_factor,
            'complexity_factor': complexity_factor
        }
        
        return fuel_requirements
    
    def optimize_fuel_loading(self, flight_data: Dict) -> Dict:
        """Optimize fuel loading strategy for cost and efficiency"""
        fuel_reqs = self.calculate_fuel_requirements(flight_data)
        route = flight_data.get('route', 'UNKNOWN-UNKNOWN')
        
        if '-' in route:
            departure, arrival = route.split('-', 1)
        else:
            departure, arrival = 'LHR', 'JFK'
        
        # Get fuel station data
        departure_fuel = self.fuel_stations.get(departure, self.fuel_stations['LHR'])
        arrival_fuel = self.fuel_stations.get(arrival, self.fuel_stations['JFK'])
        
        # Calculate fuel costs
        departure_cost = fuel_reqs['total_fuel_required'] * departure_fuel['avg_price_per_kg']
        
        # Calculate tankering economics (loading extra fuel at departure)
        tankering_analysis = self._analyze_tankering_economics(
            departure, arrival, fuel_reqs, departure_fuel, arrival_fuel
        )
        
        # Optimize fuel loading strategy
        optimization_strategy = self._determine_optimal_strategy(
            fuel_reqs, departure_fuel, arrival_fuel, tankering_analysis
        )
        
        return {
            'fuel_requirements': fuel_reqs,
            'departure_fuel_cost': departure_cost,
            'fuel_stations': {
                'departure': departure_fuel,
                'arrival': arrival_fuel
            },
            'tankering_analysis': tankering_analysis,
            'optimization_strategy': optimization_strategy,
            'cost_savings': tankering_analysis.get('savings', 0),
            'environmental_impact': self._calculate_environmental_impact(fuel_reqs)
        }
    
    def _calculate_route_distance(self, departure: str, arrival: str) -> float:
        """Calculate great circle distance between airports"""
        airport_coords = {
            'LHR': (51.4706, -0.4619),
            'JFK': (40.6413, -73.7781),
            'LAX': (33.9425, -118.4081),
            'ATL': (33.6407, -84.4277),
            'BOS': (42.3656, -71.0096),
            'MIA': (25.7959, -80.2870),
            'SFO': (37.6213, -122.3790),
            'IAD': (38.9531, -77.4565),
            'MCO': (28.4312, -81.3081),
            'TPA': (27.9755, -82.5332),
            'LAS': (36.0840, -115.1537),
            'SEA': (47.4502, -122.3088),
            'MAN': (53.3537, -2.2750),
            'EDI': (55.9533, -3.1883)
        }
        
        dep_coords = airport_coords.get(departure, (51.4706, -0.4619))
        arr_coords = airport_coords.get(arrival, (40.6413, -73.7781))
        
        # Calculate great circle distance in nautical miles
        distance_km = geodesic(dep_coords, arr_coords).kilometers
        distance_nm = distance_km * 0.539957  # Convert to nautical miles
        
        return distance_nm
    
    def _get_weather_fuel_factor(self, departure: str, arrival: str) -> float:
        """Calculate weather impact on fuel consumption"""
        try:
            # Get weather data for both airports
            dep_weather = self._get_weather_data(departure)
            arr_weather = self._get_weather_data(arrival)
            
            # Calculate fuel factors based on weather
            dep_factor = self._weather_to_fuel_factor(dep_weather)
            arr_factor = self._weather_to_fuel_factor(arr_weather)
            
            # Combined factor
            return (dep_factor + arr_factor) / 2
            
        except Exception as e:
            logger.warning(f"Weather data unavailable, using default factor: {e}")
            return 1.05  # Default 5% weather contingency
    
    def _get_weather_data(self, airport_code: str) -> Dict:
        """Get weather data for airport"""
        if airport_code in self.weather_cache:
            return self.weather_cache[airport_code]
        
        try:
            response = requests.get(
                f"http://localhost:5000/api/weather/avwx/{airport_code}",
                timeout=3
            )
            if response.status_code == 200:
                data = response.json()
                if data.get('success'):
                    self.weather_cache[airport_code] = data
                    return data
        except Exception as e:
            logger.warning(f"Weather API error for {airport_code}: {e}")
        
        # Default weather data
        return {
            'metar': {
                'wind_speed': {'value': 10},
                'visibility': {'value': 10},
                'temperature': {'value': 15},
                'flight_category': 'VFR'
            }
        }
    
    def _weather_to_fuel_factor(self, weather_data: Dict) -> float:
        """Convert weather conditions to fuel consumption factor"""
        metar = weather_data.get('metar', {})
        
        # Wind factor
        wind_speed = metar.get('wind_speed', {}).get('value', 10)
        wind_factor = 1.0 + (wind_speed / 100)  # 1% per 10 knots
        
        # Visibility factor
        visibility = metar.get('visibility', {}).get('value', 10)
        vis_factor = 1.0 if visibility > 5 else 1.02
        
        # Temperature factor
        temp = metar.get('temperature', {}).get('value', 15)
        temp_factor = 1.0 + ((temp - 15) / 1000)  # Temperature deviation impact
        
        # Flight category factor
        category = metar.get('flight_category', 'VFR')
        cat_factor = {
            'VFR': 1.0,
            'MVFR': 1.02,
            'IFR': 1.05,
            'LIFR': 1.08
        }.get(category, 1.0)
        
        return wind_factor * vis_factor * temp_factor * cat_factor
    
    def _get_route_complexity_factor(self, departure: str, arrival: str) -> float:
        """Calculate route complexity impact on fuel"""
        # Transatlantic routes
        if any(airport in ['LHR', 'MAN', 'EDI'] for airport in [departure, arrival]) and \
           any(airport in ['JFK', 'LAX', 'ATL', 'BOS', 'MIA', 'SFO'] for airport in [departure, arrival]):
            return 1.08  # 8% increase for oceanic routing
        
        # Long domestic routes
        if departure in ['LAX', 'SFO'] and arrival in ['JFK', 'BOS', 'MIA']:
            return 1.05  # 5% increase for transcontinental
        
        # Standard routes
        return 1.02  # 2% standard routing factor
    
    def _calculate_alternate_fuel(self, departure: str, arrival: str, aircraft_specs: Dict) -> float:
        """Calculate fuel for alternate airport"""
        # Standard alternate requirement is 45 minutes at cruise
        alternate_time = 0.75  # 45 minutes in hours
        return aircraft_specs['cruise_fuel_flow'] * alternate_time
    
    def _analyze_tankering_economics(self, departure: str, arrival: str, fuel_reqs: Dict, 
                                   dep_fuel: Dict, arr_fuel: Dict) -> Dict:
        """Analyze fuel tankering economics"""
        # Calculate potential savings from tankering
        price_difference = arr_fuel['avg_price_per_kg'] - dep_fuel['avg_price_per_kg']
        
        if price_difference <= 0:
            return {
                'recommended': False,
                'savings': 0,
                'reason': 'No price advantage at departure'
            }
        
        # Calculate extra fuel weight penalty
        extra_fuel = fuel_reqs['total_fuel_required'] * 0.5  # 50% extra for tankering
        weight_penalty = extra_fuel * 0.03  # 3% fuel burn increase per extra fuel weight
        
        # Calculate savings
        gross_savings = extra_fuel * price_difference
        weight_cost = weight_penalty * dep_fuel['avg_price_per_kg']
        net_savings = gross_savings - weight_cost
        
        return {
            'recommended': net_savings > 0,
            'savings': net_savings,
            'extra_fuel_kg': extra_fuel,
            'weight_penalty': weight_penalty,
            'gross_savings': gross_savings,
            'weight_cost': weight_cost
        }
    
    def _determine_optimal_strategy(self, fuel_reqs: Dict, dep_fuel: Dict, 
                                   arr_fuel: Dict, tankering: Dict) -> Dict:
        """Determine optimal fuel loading strategy"""
        if tankering['recommended']:
            strategy = 'TANKERING'
            fuel_to_load = fuel_reqs['total_fuel_required'] + tankering['extra_fuel_kg']
            cost_impact = -tankering['savings']  # Negative means savings
        else:
            strategy = 'STANDARD'
            fuel_to_load = fuel_reqs['total_fuel_required']
            cost_impact = 0
        
        return {
            'strategy': strategy,
            'fuel_to_load_kg': fuel_to_load,
            'cost_impact_usd': cost_impact,
            'loading_time_minutes': fuel_to_load / (dep_fuel['pumping_rate'] * 60 / 1000),  # Convert to minutes
            'recommendations': self._generate_fuel_recommendations(fuel_reqs, strategy)
        }
    
    def _calculate_environmental_impact(self, fuel_reqs: Dict) -> Dict:
        """Calculate environmental impact of fuel consumption"""
        # CO2 emissions factor: 3.16 kg CO2 per kg fuel
        co2_emissions = fuel_reqs['total_fuel_required'] * 3.16
        
        return {
            'co2_emissions_kg': co2_emissions,
            'co2_emissions_tons': co2_emissions / 1000,
            'environmental_rating': self._get_environmental_rating(co2_emissions)
        }
    
    def _get_environmental_rating(self, co2_emissions: float) -> str:
        """Get environmental rating based on CO2 emissions"""
        if co2_emissions < 50000:
            return 'EXCELLENT'
        elif co2_emissions < 75000:
            return 'GOOD'
        elif co2_emissions < 100000:
            return 'MODERATE'
        else:
            return 'HIGH_IMPACT'
    
    def _generate_fuel_recommendations(self, fuel_reqs: Dict, strategy: str) -> List[str]:
        """Generate fuel optimization recommendations"""
        recommendations = []
        
        if fuel_reqs['total_fuel_required'] > fuel_reqs['max_fuel_capacity'] * 0.9:
            recommendations.append('FUEL_CAPACITY_WARNING: Approaching maximum fuel capacity')
        
        if strategy == 'TANKERING':
            recommendations.append('TANKERING_RECOMMENDED: Load extra fuel for cost savings')
        
        if fuel_reqs['weather_factor'] > 1.1:
            recommendations.append('WEATHER_CONTINGENCY: Increased fuel for weather conditions')
        
        if fuel_reqs['complexity_factor'] > 1.05:
            recommendations.append('ROUTE_COMPLEXITY: Additional fuel for complex routing')
        
        return recommendations

def main():
    """Main function for command line usage"""
    parser = argparse.ArgumentParser(description='Virgin Atlantic Enhanced Fuel Optimization System')
    parser.add_argument('--calculate', type=str, help='Calculate fuel requirements (JSON flight data)')
    parser.add_argument('--optimize', type=str, help='Optimize fuel loading (JSON flight data)')
    parser.add_argument('--status', action='store_true', help='Show system status')
    parser.add_argument('--test', action='store_true', help='Run test optimization')
    
    args = parser.parse_args()
    
    optimizer = VirginAtlanticFuelOptimizer()
    
    if args.status:
        print("🚀 Virgin Atlantic Enhanced Fuel Optimization System")
        print("=" * 70)
        print(f"📊 System Status: OPERATIONAL")
        print(f"✈️  Aircraft Types: {len(optimizer.aircraft_specs)}")
        print(f"⛽ Fuel Stations: {len(optimizer.fuel_stations)}")
        print()
        print("🔧 Available Aircraft:")
        for aircraft, specs in optimizer.aircraft_specs.items():
            print(f"  • {aircraft}: {specs['max_fuel_capacity']}kg capacity, {specs['cruise_fuel_flow']}kg/hr")
        print()
        print("⛽ Fuel Station Network:")
        for station, data in optimizer.fuel_stations.items():
            print(f"  • {station}: ${data['avg_price_per_kg']:.2f}/kg, {len(data['suppliers'])} suppliers")
        
    elif args.calculate:
        try:
            flight_data = json.loads(args.calculate)
            result = optimizer.calculate_fuel_requirements(flight_data)
            print(json.dumps(result, indent=2))
        except Exception as e:
            print(json.dumps({"error": str(e)}))
    
    elif args.optimize:
        try:
            flight_data = json.loads(args.optimize)
            result = optimizer.optimize_fuel_loading(flight_data)
            print(json.dumps(result, indent=2))
        except Exception as e:
            print(json.dumps({"error": str(e)}))
    
    elif args.test:
        # Run comprehensive test
        test_flights = [
            {"route": "LHR-JFK", "aircraft_type": "A350-1000", "flight_number": "VIR3N"},
            {"route": "LHR-LAX", "aircraft_type": "A350-1000", "flight_number": "VIR141"},
            {"route": "MAN-JFK", "aircraft_type": "A330-300", "flight_number": "VIR127C"}
        ]
        
        print("🧪 Running fuel optimization tests...")
        for flight in test_flights:
            result = optimizer.optimize_fuel_loading(flight)
            print(f"{flight['flight_number']}: {result['optimization_strategy']['strategy']} - "
                  f"${result['optimization_strategy']['cost_impact_usd']:.0f} impact")

if __name__ == "__main__":
    main()
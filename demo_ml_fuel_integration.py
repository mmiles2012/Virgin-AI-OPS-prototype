#!/usr/bin/env python3
"""
AINO ML Fuel Cost Integration Demonstration
Shows complete integration of Financial Times news analysis with operational flight monitoring
"""

import requests
import json
from datetime import datetime
import time

def demonstrate_ml_fuel_integration():
    """
    Demonstrate the complete ML fuel cost prediction system integrated with AINO operations
    """
    print("=" * 80)
    print("AINO Aviation Intelligence - ML Fuel Cost Integration Demo")
    print("Financial Times News Analysis + Operational Flight Monitoring")
    print("=" * 80)
    print()

    # 1. Get current market sentiment from Financial Times
    print("1. FINANCIAL TIMES MARKET ANALYSIS")
    print("-" * 40)
    
    try:
        response = requests.get("http://localhost:5000/api/fuel/market-sentiment")
        if response.status_code == 200:
            sentiment_data = response.json()
            
            print(f"Financial Times Sentiment: {sentiment_data['sentiment']['ft_sentiment']:.3f}")
            print(f"Market Impact Factor: {sentiment_data['sentiment']['market_impact']:.3f}")
            print(f"Price Bias: {sentiment_data['sentiment']['price_bias'].upper()}")
            print(f"Model Accuracy: {sentiment_data['performance']['accuracy']:.1%}")
            print(f"Source Credibility: {sentiment_data['performance']['source_credibility']}")
            print()
        else:
            print("Unable to retrieve market sentiment data")
            return
            
    except Exception as e:
        print(f"Error connecting to AINO API: {e}")
        return

    # 2. Generate Virgin Atlantic VS107 fuel predictions
    print("2. VIRGIN ATLANTIC VS107 FUEL COST ANALYSIS")
    print("-" * 40)
    
    vs107_flight_data = {
        "aircraft_type": "B789",
        "route": "LHR-MIA",
        "distance_nm": 3500,
        "passengers": 275,
        "flight_time_hours": 7.3
    }
    
    try:
        response = requests.post(
            "http://localhost:5000/api/fuel/ml-prediction",
            headers={"Content-Type": "application/json"},
            data=json.dumps(vs107_flight_data)
        )
        
        if response.status_code == 200:
            prediction_data = response.json()
            ml_prediction = prediction_data['mlPrediction']
            
            print(f"Aircraft: Boeing 787-9")
            print(f"Route: London Heathrow → Miami International")
            print(f"Distance: {vs107_flight_data['distance_nm']:,} nautical miles")
            print(f"Passengers: {vs107_flight_data['passengers']}")
            print()
            
            print("CURRENT FUEL COST PREDICTION:")
            print(f"  Price per gallon: ${ml_prediction['predicted_price_usd_per_gallon']:.3f}")
            print(f"  Price per litre: ${ml_prediction['predicted_price_usd_per_liter']:.3f}")
            print(f"  Total flight fuel cost: ${ml_prediction['total_fuel_cost_usd']:,.0f}")
            print(f"  Cost per passenger: ${ml_prediction['cost_per_passenger_usd']:.2f}")
            print()
            
            print("FINANCIAL TIMES INFLUENCE:")
            print(f"  Sentiment impact: {ml_prediction['financial_times_sentiment']:.3f}")
            print(f"  Market impact factor: {ml_prediction['market_impact_factor']:.3f}")
            print(f"  Model confidence: {ml_prediction['confidence_level']:.1%}")
            print()
            
            # Show 7-day forecast
            print("7-DAY FUEL COST FORECAST:")
            print(f"{'Day':<4} {'Date':<12} {'Price/Gal':<10} {'Total Cost':<12} {'Confidence Range'}")
            print("-" * 65)
            
            for day_forecast in ml_prediction['forecast_days']:
                confidence = day_forecast['confidence_interval']
                print(f"{day_forecast['day']:<4} {day_forecast['date']:<12} "
                      f"${day_forecast['price_per_gallon']:.3f}{'':<3} "
                      f"${day_forecast['total_cost_usd']:,.0f}{'':<4} "
                      f"${confidence['lower_bound']:.2f}-${confidence['upper_bound']:.2f}")
            print()
            
        else:
            print("Unable to retrieve fuel cost predictions")
            return
            
    except Exception as e:
        print(f"Error generating fuel predictions: {e}")
        return

    # 3. Get current Virgin Atlantic flight operations
    print("3. REAL-TIME VIRGIN ATLANTIC OPERATIONS")
    print("-" * 40)
    
    try:
        response = requests.get("http://localhost:5000/api/aviation/virgin-atlantic-flights")
        if response.status_code == 200:
            flights_data = response.json()
            
            if flights_data['success'] and flights_data['flights']:
                for flight in flights_data['flights'][:3]:  # Show first 3 flights
                    print(f"Flight {flight['callsign']}:")
                    print(f"  Route: {flight['origin']} → {flight['destination']}")
                    print(f"  Aircraft: {flight['aircraft']}")
                    print(f"  Fuel Remaining: {flight['fuelRemaining']:.1f}%")
                    print(f"  Passengers: {flight['passengers']}")
                    
                    # Calculate fuel cost for this flight
                    current_flight_data = {
                        "aircraft_type": "B789",  # Assume B787
                        "route": f"{flight['origin']}-{flight['destination']}",
                        "distance_nm": 3000,  # Estimate
                        "passengers": flight['passengers']
                    }
                    
                    fuel_response = requests.post(
                        "http://localhost:5000/api/fuel/ml-prediction",
                        headers={"Content-Type": "application/json"},
                        data=json.dumps(current_flight_data)
                    )
                    
                    if fuel_response.status_code == 200:
                        fuel_data = fuel_response.json()['mlPrediction']
                        print(f"  Estimated fuel cost: ${fuel_data['total_fuel_cost_usd']:,.0f}")
                        print(f"  Cost per passenger: ${fuel_data['cost_per_passenger_usd']:.2f}")
                    
                    print()
            else:
                print("No Virgin Atlantic flights currently in system")
                
    except Exception as e:
        print(f"Error retrieving flight operations: {e}")

    # 4. Show economic impact analysis
    print("4. ECONOMIC IMPACT ANALYSIS")
    print("-" * 40)
    
    # Calculate fleet-wide impact
    baseline_price = 3.50  # USD per gallon
    current_price = ml_prediction['predicted_price_usd_per_gallon']
    price_increase = current_price - baseline_price
    price_increase_percentage = (price_increase / baseline_price) * 100
    
    print(f"Baseline fuel price: ${baseline_price:.2f}/gallon")
    print(f"FT-adjusted price: ${current_price:.3f}/gallon")
    print(f"Price increase: ${price_increase:.3f}/gallon (+{price_increase_percentage:.1f}%)")
    print()
    
    # Fleet impact (estimated)
    daily_flights = 45  # Virgin Atlantic estimate
    avg_fuel_gallons = 16000  # Per long-haul flight
    daily_extra_cost = daily_flights * avg_fuel_gallons * price_increase
    monthly_extra_cost = daily_extra_cost * 30
    
    print(f"FLEET IMPACT (Virgin Atlantic estimates):")
    print(f"  Daily flights: {daily_flights}")
    print(f"  Average fuel per flight: {avg_fuel_gallons:,} gallons")
    print(f"  Additional daily cost: ${daily_extra_cost:,.0f}")
    print(f"  Additional monthly cost: ${monthly_extra_cost:,.0f}")
    print()

    # 5. Operational recommendations
    print("5. OPERATIONAL RECOMMENDATIONS")
    print("-" * 40)
    
    ft_sentiment = ml_prediction['financial_times_sentiment']
    
    if ft_sentiment > 0.5:
        print("⚠️  HIGH FUEL COST RISK DETECTED")
        print("Financial Times analysis indicates sustained upward pressure on fuel prices")
        print()
        print("IMMEDIATE ACTIONS:")
        print("• Consider accelerated fuel hedging for Q3/Q4 2025")
        print("• Review route optimization for fuel efficiency")
        print("• Evaluate sustainable aviation fuel procurement")
        print("• Monitor refinery capacity constraints")
        print("• Assess passenger fare adjustments for fuel surcharges")
        
    elif ft_sentiment > 0.2:
        print("⚡ MODERATE FUEL COST PRESSURE")
        print("Market showing upward bias with geopolitical factors")
        print()
        print("RECOMMENDED ACTIONS:")
        print("• Maintain current hedging strategies")
        print("• Monitor supply chain developments")
        print("• Optimize flight planning for fuel efficiency")
        
    else:
        print("✅ STABLE FUEL COST ENVIRONMENT")
        print("Market sentiment showing neutral to positive outlook")
        print()
        print("RECOMMENDED ACTIONS:")
        print("• Standard fuel procurement strategies")
        print("• Opportunistic hedging on price dips")

    print()
    print("=" * 80)
    print("AINO ML Fuel Cost Integration - Analysis Complete")
    print(f"Generated: {datetime.now().strftime('%Y-%m-%d %H:%M:%S UTC')}")
    print("=" * 80)

if __name__ == "__main__":
    demonstrate_ml_fuel_integration()
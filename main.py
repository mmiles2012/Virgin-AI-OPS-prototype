from utils.fetch_weather import fetch_and_save_weather_data
from utils.train_model import train_and_save_model
from utils.plot_features import plot_feature_importance
from utils.economics import calculate_total_operational_risk, comprehensive_economic_analysis, economic_dashboard_summary
import pandas as pd
import os

if __name__ == "__main__":
    print("1. Fetching weather data...")
    fetch_and_save_weather_data()

    print("2. Training model with updated data...")
    train_and_save_model()

    print("3. Plotting feature importances...")
    plot_feature_importance()

    print("4. Calculating operational risk scores...")
    
    # Load enhanced training data if available
    if os.path.exists("data/enhanced_training_data.csv"):
        df = pd.read_csv("data/enhanced_training_data.csv")
        print(f"Loaded enhanced dataset: {len(df)} records")
    else:
        df = pd.read_csv("data/latest_training_data.csv")
        print(f"Loaded standard dataset: {len(df)} records")
    
    # Ensure required columns exist
    if 'icao_code' not in df.columns and 'station' in df.columns:
        df['icao_code'] = df['station']
    elif 'icao_code' not in df.columns and 'reporting_airport' in df.columns:
        df["icao_code"] = df["reporting_airport"].astype(str).str.upper()

    # Sample economic evaluation on subset (limit to top 20 for analysis)
    examples = df.head(20)
    economic_results = []
    
    for _, row in examples.iterrows():
        # Prepare flight data
        flight_data = {
            'passenger_count': row.get('pax_count', 200),
            'distance_km': row.get('distance_km', 5000),
            'flight_duration_hrs': row.get('flight_duration_hrs', 8.0),
            'route_class': row.get('route_class', 'long-haul')
        }
        
        # Prepare weather data
        weather_data = {
            'wind_speed': row.get('wind_speed', 25),
            'temperature': row.get('temperature', 15),
            'visibility': row.get('visibility', 9999)
        }
        
        # Get delay prediction
        delay_mins = row.get("average_delay_mins", 0)
        
        # Calculate comprehensive economic analysis
        econ = comprehensive_economic_analysis(flight_data, weather_data, delay_mins)
        
        # Add flight identifier
        flight_id = row.get("flight_number", f"{row.get('icao_code', 'UNKN')}-{row.name}")
        econ["flight"] = flight_id
        econ["airline"] = row.get("airline_name", "Unknown")
        econ["icao_code"] = row.get("icao_code", "UNKN")
        
        economic_results.append(econ)

    # Create economic analysis DataFrame
    econ_df = pd.DataFrame(economic_results)
    
    # Generate executive summary
    summary = economic_dashboard_summary(economic_results)
    
    # Save results
    os.makedirs("data", exist_ok=True)
    econ_df.to_csv("data/economic_risk_summary.csv", index=False)
    
    # Display results
    print("\n💰 ECONOMIC ANALYSIS SUMMARY")
    print("=" * 50)
    print(f"Total Flights Analyzed: {summary['total_flights_analyzed']}")
    print(f"Total Economic Impact: ${summary['total_economic_impact']:,.0f}")
    print(f"Average Cost per Flight: ${summary['average_cost_per_flight']:,.0f}")
    print(f"Total EU261 Exposure: ${summary['total_eu261_exposure']:,.0f}")
    print(f"High Risk Flights: {summary['high_risk_flights']}")
    print(f"Fuel Savings Potential: {summary['fuel_savings_potential']:,.0f} kg")
    
    print(f"\nCost Distribution:")
    print(f"  Low Cost (<$10k): {summary['cost_distribution']['low_cost']} flights")
    print(f"  Medium Cost ($10k-$50k): {summary['cost_distribution']['medium_cost']} flights")
    print(f"  High Cost (>$50k): {summary['cost_distribution']['high_cost']} flights")
    
    print(f"\nWorst Performing Flight: {summary['worst_performing_flight']}")
    print(f"Best Performing Flight: {summary['best_performing_flight']}")
    
    print("✅ Economic risk summary saved to data/economic_risk_summary.csv")
    print("✅ Done!")
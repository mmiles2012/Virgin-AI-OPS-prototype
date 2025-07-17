#!/usr/bin/env python3
"""
Enhanced Holding Dashboard for AINO Aviation Intelligence Platform
Integrated with authentic ADS-B Exchange data and Virgin Atlantic fleet tracking
"""

import streamlit as st
import pandas as pd
import requests
import json
import time
from datetime import datetime
from typing import Dict, List, Optional
import logging

# Setup logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class AINOHoldingDashboard:
    """Enhanced holding dashboard with AINO platform integration"""
    
    def __init__(self):
        self.api_base = "http://localhost:5000"
        self.holding_areas = {
            'LHR': {
                'BIG': {'name': 'Biggin Hill', 'lat': 51.331, 'lon': 0.032},
                'BNN': {'name': 'Bovingdon', 'lat': 51.739, 'lon': -0.54},
                'LAM': {'name': 'Lambourne', 'lat': 51.646, 'lon': 0.151},
                'OCK': {'name': 'Ockham', 'lat': 51.287, 'lon': -0.434}
            },
            'JFK': {
                'CAMRN': {'name': 'Carmel', 'lat': 41.428, 'lon': -73.678},
                'LENDY': {'name': 'Lendy', 'lat': 40.955, 'lon': -72.804},
                'HAARP': {'name': 'Haarp', 'lat': 40.639, 'lon': -73.779},
                'SHIPP': {'name': 'Shipp', 'lat': 40.522, 'lon': -74.034}
            }
        }
    
    def get_virgin_atlantic_flights(self) -> List[Dict]:
        """Get authentic Virgin Atlantic flight data from AINO platform"""
        try:
            response = requests.get(f"{self.api_base}/api/aviation/virgin-atlantic-flights", timeout=10)
            if response.status_code == 200:
                data = response.json()
                if data.get('success'):
                    return data.get('flights', [])
            logger.warning("Failed to fetch Virgin Atlantic flights")
            return []
        except Exception as e:
            logger.error(f"Error fetching Virgin Atlantic flights: {e}")
            return []
    
    def get_heathrow_holding_data(self) -> Dict:
        """Get Heathrow holding analysis from AINO platform"""
        try:
            response = requests.get(f"{self.api_base}/api/aviation/heathrow-holding", timeout=10)
            if response.status_code == 200:
                data = response.json()
                if data.get('success'):
                    return data.get('holding_analysis', {})
            logger.warning("Failed to fetch Heathrow holding data")
            return {}
        except Exception as e:
            logger.error(f"Error fetching Heathrow holding data: {e}")
            return {}
    
    def analyze_holding_patterns(self, flights: List[Dict]) -> Dict:
        """Analyze holding patterns from flight data"""
        holding_analysis = {
            'total_holding': 0,
            'holding_by_airport': {},
            'holding_aircraft': []
        }
        
        for flight in flights:
            # Check if aircraft might be in holding pattern
            altitude = flight.get('altitude', 0)
            velocity = flight.get('velocity', 0)
            route = flight.get('route', '')
            
            # Holding pattern indicators
            is_holding = False
            holding_stack = None
            
            # Check altitude range for holding (typically 7000-15000ft for commercial)
            if 7000 <= altitude <= 15000:
                # Check velocity (holding patterns typically 200-250 knots)
                if 180 <= velocity <= 280:
                    # Check if inbound to major airport
                    if any(airport in route for airport in ['LHR', 'JFK', 'ATL', 'LAX']):
                        is_holding = True
                        
                        # Determine likely holding stack based on route
                        if 'LHR' in route:
                            holding_stack = self._assign_lhr_holding_stack(flight)
                        elif 'JFK' in route:
                            holding_stack = self._assign_jfk_holding_stack(flight)
            
            if is_holding:
                holding_analysis['total_holding'] += 1
                holding_analysis['holding_aircraft'].append({
                    'flight_number': flight.get('flight_number'),
                    'aircraft_type': flight.get('aircraft_type'),
                    'route': route,
                    'altitude': altitude,
                    'velocity': velocity,
                    'holding_stack': holding_stack,
                    'estimated_delay': self._estimate_holding_delay(altitude, velocity)
                })
                
                # Count by airport
                airport = holding_stack.split('-')[0] if holding_stack else 'UNKNOWN'
                if airport not in holding_analysis['holding_by_airport']:
                    holding_analysis['holding_by_airport'][airport] = 0
                holding_analysis['holding_by_airport'][airport] += 1
        
        return holding_analysis
    
    def _assign_lhr_holding_stack(self, flight: Dict) -> str:
        """Assign LHR holding stack based on flight characteristics"""
        lat = flight.get('latitude', 0)
        lon = flight.get('longitude', 0)
        
        # Simple assignment based on position relative to LHR
        if lat > 51.5 and lon > -0.5:
            return "LHR-LAM"  # Lambourne
        elif lat > 51.6 and lon < -0.4:
            return "LHR-BNN"  # Bovingdon
        elif lat < 51.4 and lon > 0:
            return "LHR-BIG"  # Biggin Hill
        else:
            return "LHR-OCK"  # Ockham
    
    def _assign_jfk_holding_stack(self, flight: Dict) -> str:
        """Assign JFK holding stack based on flight characteristics"""
        lat = flight.get('latitude', 0)
        lon = flight.get('longitude', 0)
        
        # Simple assignment based on position relative to JFK
        if lat > 41.0 and lon > -73.0:
            return "JFK-CAMRN"  # Carmel
        elif lat > 40.9 and lon < -72.8:
            return "JFK-LENDY"  # Lendy
        elif lat < 40.7:
            return "JFK-HAARP"  # Haarp
        else:
            return "JFK-SHIPP"  # Shipp
    
    def _estimate_holding_delay(self, altitude: int, velocity: int) -> int:
        """Estimate holding delay in minutes based on flight characteristics"""
        # Higher altitude usually means longer holding
        altitude_factor = (altitude - 7000) / 1000  # 0-8 range
        
        # Slower velocity might indicate longer holding
        velocity_factor = (280 - velocity) / 100  # 0-1 range
        
        # Estimate delay (5-25 minutes typical range)
        estimated_delay = 5 + (altitude_factor * 2) + (velocity_factor * 3)
        return int(min(max(estimated_delay, 5), 25))
    
    def render_dashboard(self):
        """Render the enhanced holding dashboard"""
        st.set_page_config(
            page_title="AINO Holding Dashboard",
            page_icon="✈️",
            layout="wide"
        )
        
        st.title("🛩️ AINO Aviation Holding Pattern Monitor")
        st.markdown("**Real-time Virgin Atlantic fleet holding analysis with authentic ADS-B data**")
        
        # Fetch data
        with st.spinner("Fetching real-time flight data..."):
            flights = self.get_virgin_atlantic_flights()
            heathrow_holding = self.get_heathrow_holding_data()
        
        if not flights:
            st.error("Unable to fetch Virgin Atlantic flight data from AINO platform")
            return
        
        # Analysis
        holding_analysis = self.analyze_holding_patterns(flights)
        
        # Key metrics
        col1, col2, col3, col4 = st.columns(4)
        
        with col1:
            st.metric(
                "Total Virgin Atlantic Flights",
                len(flights),
                help="Currently tracked via ADS-B Exchange"
            )
        
        with col2:
            st.metric(
                "Aircraft in Holding",
                holding_analysis['total_holding'],
                help="Estimated based on altitude and velocity patterns"
            )
        
        with col3:
            holding_rate = (holding_analysis['total_holding'] / len(flights) * 100) if flights else 0
            st.metric(
                "Holding Rate",
                f"{holding_rate:.1f}%",
                help="Percentage of fleet in holding patterns"
            )
        
        with col4:
            avg_delay = 0
            if holding_analysis['holding_aircraft']:
                avg_delay = sum(aircraft['estimated_delay'] for aircraft in holding_analysis['holding_aircraft']) / len(holding_analysis['holding_aircraft'])
            st.metric(
                "Avg Holding Delay",
                f"{avg_delay:.0f} min",
                help="Estimated average delay for aircraft in holding"
            )
        
        # Detailed analysis tabs
        tab1, tab2, tab3, tab4 = st.tabs(["🎯 Holding Aircraft", "🗺️ By Airport", "📊 Fleet Status", "⚙️ AINO Integration"])
        
        with tab1:
            st.subheader("Aircraft Currently in Holding Patterns")
            if holding_analysis['holding_aircraft']:
                df = pd.DataFrame(holding_analysis['holding_aircraft'])
                st.dataframe(
                    df,
                    use_container_width=True,
                    column_config={
                        "flight_number": "Flight",
                        "aircraft_type": "Aircraft",
                        "route": "Route",
                        "altitude": st.column_config.NumberColumn("Altitude (ft)", format="%d"),
                        "velocity": st.column_config.NumberColumn("Velocity (kt)", format="%d"),
                        "holding_stack": "Holding Stack",
                        "estimated_delay": st.column_config.NumberColumn("Est. Delay (min)", format="%d")
                    }
                )
            else:
                st.info("✅ No Virgin Atlantic aircraft currently detected in holding patterns")
        
        with tab2:
            st.subheader("Holding Analysis by Airport")
            if holding_analysis['holding_by_airport']:
                for airport, count in holding_analysis['holding_by_airport'].items():
                    with st.expander(f"{airport} - {count} aircraft"):
                        airport_aircraft = [a for a in holding_analysis['holding_aircraft'] 
                                          if a['holding_stack'].startswith(airport)]
                        if airport_aircraft:
                            df = pd.DataFrame(airport_aircraft)
                            st.dataframe(df, use_container_width=True)
            else:
                st.info("No holding patterns detected at major airports")
        
        with tab3:
            st.subheader("Complete Virgin Atlantic Fleet Status")
            df = pd.DataFrame(flights)
            if not df.empty:
                # Add holding status
                df['holding_status'] = df['flight_number'].apply(
                    lambda x: '🔄 HOLDING' if any(h['flight_number'] == x for h in holding_analysis['holding_aircraft']) else '✈️ EN ROUTE'
                )
                
                st.dataframe(
                    df[['flight_number', 'aircraft_type', 'route', 'altitude', 'velocity', 'holding_status']],
                    use_container_width=True,
                    column_config={
                        "flight_number": "Flight",
                        "aircraft_type": "Aircraft",
                        "route": "Route",
                        "altitude": st.column_config.NumberColumn("Altitude (ft)", format="%d"),
                        "velocity": st.column_config.NumberColumn("Velocity (kt)", format="%d"),
                        "holding_status": "Status"
                    }
                )
        
        with tab4:
            st.subheader("AINO Platform Integration Status")
            
            # Data sources
            st.markdown("**Data Sources:**")
            st.markdown("- ✅ ADS-B Exchange: Real-time aircraft positions")
            st.markdown("- ✅ Virgin Atlantic Fleet: Live flight tracking")
            st.markdown("- ✅ AINO API: Integrated platform services")
            
            # System status
            if heathrow_holding:
                st.markdown("**Heathrow Holding System:**")
                st.json(heathrow_holding)
            
            # Raw data preview
            with st.expander("Raw Flight Data Preview"):
                if flights:
                    st.json(flights[0])  # Show first flight as example
            
            # Refresh controls
            st.markdown("**Controls:**")
            if st.button("🔄 Refresh Data"):
                st.rerun()
            
            st.markdown(f"**Last Updated:** {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")

def main():
    """Main application entry point"""
    dashboard = AINOHoldingDashboard()
    dashboard.render_dashboard()

if __name__ == "__main__":
    main()
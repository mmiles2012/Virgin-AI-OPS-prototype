"""
Total Risk Intelligence Command Centre - Streamlit Dashboard
AINO Aviation Intelligence Platform
"""

import streamlit as st
import pandas as pd
from tri_risk_engine import generate_tri_summary
from connection_risk_engine import batch_connection_risk, generate_connection_summary
import json
from datetime import datetime, timedelta

# Set Streamlit page config
st.set_page_config(
    page_title="Total Risk Intelligence Command Centre", 
    layout="wide",
    page_icon="🧠"
)

# Custom CSS for professional styling
st.markdown("""
<style>
    .main-header {
        background: linear-gradient(90deg, #1e3a8a 0%, #3b82f6 100%);
        padding: 1rem;
        border-radius: 10px;
        margin-bottom: 2rem;
    }
    .risk-high { background-color: #fee2e2; border-left: 4px solid #dc2626; }
    .risk-medium { background-color: #fef3c7; border-left: 4px solid #d97706; }
    .risk-low { background-color: #d1fae5; border-left: 4px solid #059669; }
    .metric-card {
        background: white;
        padding: 1rem;
        border-radius: 8px;
        box-shadow: 0 2px 4px rgba(0,0,0,0.1);
        margin: 0.5rem 0;
    }
</style>
""", unsafe_allow_html=True)

# Main header
st.markdown("""
<div class="main-header">
    <h1 style="color: white; margin: 0;">🧠 Total Risk Intelligence Command Centre</h1>
    <p style="color: #e5e7eb; margin: 0;">Live risk synthesis for fuel, connections, crew and disruption decisions</p>
</div>
""", unsafe_allow_html=True)

# Sidebar for flight selection and parameters
st.sidebar.header("🛫 Flight Parameters")

# Flight selection
flight_options = ["VS3 (LHR-JFK)", "VS103 (LHR-ATL)", "VS11 (LHR-BOS)", "VS141 (LHR-LAX)", "Custom"]
selected_flight = st.sidebar.selectbox("Select Flight", flight_options)

if selected_flight == "Custom":
    flight_id = st.sidebar.text_input("Flight ID", "VS999")
    route = st.sidebar.text_input("Route", "LHR-XXX")
else:
    flight_id = selected_flight.split()[0]
    route = selected_flight.split()[1].strip("()")

# Date and time inputs
flight_date = st.sidebar.date_input("Flight Date", datetime.now().date())
arrival_time = st.sidebar.time_input("Estimated Arrival", datetime.now().time())

# Combine date and time
arrival_eta_str = f"{flight_date}T{arrival_time}:00Z"

# Fuel parameters
st.sidebar.subheader("⛽ Fuel Parameters")
discretionary_fuel = st.sidebar.slider("Discretionary Fuel (kg)", 100, 3000, 600, 50)
fuel_reduction_kg = st.sidebar.slider("Possible Reduction (kg)", 0, 1000, 400, 25)

# Crew parameters
st.sidebar.subheader("👨‍✈️ Crew Parameters")
time_to_duty_end_min = st.sidebar.slider("Time to Duty End (min)", 30, 300, 90, 15)
delay_min = st.sidebar.slider("Expected Delay (min)", 0, 120, 20, 5)

# Diversion parameters
st.sidebar.subheader("🛬 Diversion Risk")
diversion_risk_level = st.sidebar.selectbox("Risk Level", ["Low", "Medium", "High"])
diversion_distance_km = st.sidebar.slider("Distance from Dest (km)", 0, 500, 0, 25)

# Connection parameters
st.sidebar.subheader("🔗 Connection Settings")
mct_minutes = st.sidebar.slider("MCT (minutes)", 30, 90, 45, 5)

# Main dashboard layout
col1, col2 = st.columns([2, 1])

with col1:
    # Flight header
    st.header(f"✈️ Flight {flight_id} – {route}")
    
    # Connection risk section
    st.subheader("🔗 Connection Risk Assessment")
    
    # Sample connection data (in real implementation, this would come from APIs)
    if flight_id == "VS3":
        connection_list = [
            {"connection_flight": "DL215", "connection_std": f"{flight_date}T{(datetime.combine(flight_date, arrival_time) + timedelta(minutes=20)).time()}:00Z", "pax_count": 9},
            {"connection_flight": "DL411", "connection_std": f"{flight_date}T{(datetime.combine(flight_date, arrival_time) + timedelta(minutes=5)).time()}:00Z", "pax_count": 6},
            {"connection_flight": "KL602", "connection_std": f"{flight_date}T{(datetime.combine(flight_date, arrival_time) + timedelta(minutes=45)).time()}:00Z", "pax_count": 3}
        ]
    elif flight_id == "VS103":
        connection_list = [
            {"connection_flight": "DL288", "connection_std": f"{flight_date}T{(datetime.combine(flight_date, arrival_time) + timedelta(minutes=30)).time()}:00Z", "pax_count": 12},
            {"connection_flight": "AA1245", "connection_std": f"{flight_date}T{(datetime.combine(flight_date, arrival_time) + timedelta(minutes=15)).time()}:00Z", "pax_count": 8},
        ]
    else:
        connection_list = [
            {"connection_flight": "DL100", "connection_std": f"{flight_date}T{(datetime.combine(flight_date, arrival_time) + timedelta(minutes=25)).time()}:00Z", "pax_count": 5},
            {"connection_flight": "AA200", "connection_std": f"{flight_date}T{(datetime.combine(flight_date, arrival_time) + timedelta(minutes=10)).time()}:00Z", "pax_count": 7},
        ]
    
    # Generate connection risk analysis
    connection_risks = batch_connection_risk(arrival_eta_str, connection_list, mct_minutes)
    connection_summary = generate_connection_summary(arrival_eta_str, connection_list, mct_minutes)
    
    # Display connection results
    connection_df = pd.DataFrame(connection_risks)
    
    # Style the dataframe based on risk levels
    def style_risk_level(val):
        if val == "Missed":
            return "background-color: #fee2e2; color: #dc2626; font-weight: bold"
        elif val == "Tight":
            return "background-color: #fef3c7; color: #d97706; font-weight: bold"
        elif val == "Caution":
            return "background-color: #fef3c7; color: #d97706"
        elif val in ["Safe", "Low"]:
            return "background-color: #d1fae5; color: #059669"
        else:
            return "background-color: #f3f4f6; color: #374151"
    
    styled_df = connection_df.style.applymap(style_risk_level, subset=['risk_level'])
    st.dataframe(styled_df, use_container_width=True)
    
    # Calculate total at-risk passengers
    total_pax_at_risk = sum([
        row["passengers_affected"]
        for row in connection_risks if row["risk_level"] in ("Missed", "Tight")
    ])
    
    # TRI Summary section
    st.subheader("🧠 TRI Summary")
    
    # Generate TRI analysis
    tri_result = generate_tri_summary(
        flight_id=flight_id,
        discretionary_fuel=discretionary_fuel,
        fuel_reduction_kg=fuel_reduction_kg,
        pax_missed=total_pax_at_risk,
        time_to_duty_end_min=time_to_duty_end_min,
        delay_min=delay_min,
        diversion_risk_level=diversion_risk_level,
        diversion_distance_km=diversion_distance_km
    )
    
    # Display TRI results
    tri_df = pd.DataFrame([tri_result])
    
    # Select key columns for display
    display_columns = ['flight_id', 'fuel_cost_saving', 'pax_connection_cost', 'crew_risk', 
                      'diversion_cost', 'total_estimated_impact', 'priority']
    tri_display = tri_df[display_columns]
    
    st.dataframe(tri_display, use_container_width=True)
    
    # Recommendation highlight
    if tri_result['priority'] == 'HIGH':
        st.success(f"🧭 **{tri_result['recommendation']}**")
    elif tri_result['priority'] == 'MEDIUM':
        st.warning(f"🧭 **{tri_result['recommendation']}**")
    else:
        st.info(f"🧭 **{tri_result['recommendation']}**")

with col2:
    # Summary metrics
    st.subheader("📊 Risk Metrics")
    
    # Connection metrics
    st.metric("Total Connections", len(connection_list))
    st.metric("At-Risk Passengers", total_pax_at_risk)
    st.metric("Connection Risk", connection_summary['overall_risk_level'])
    
    st.divider()
    
    # Financial metrics
    st.metric("Potential Fuel Savings", f"${tri_result['fuel_cost_saving']}")
    st.metric("Connection Cost Risk", f"${tri_result['pax_connection_cost']}")
    st.metric("Net Financial Impact", f"${tri_result['total_estimated_impact']}")
    
    st.divider()
    
    # Operational metrics
    st.metric("Crew Risk Level", tri_result['crew_risk'])
    st.metric("Diversion Cost Risk", f"${tri_result['diversion_cost']}")
    st.metric("Optimization Priority", tri_result['priority'])
    
    # Action items
    st.subheader("⚡ Next Actions")
    
    action_items = []
    
    if total_pax_at_risk > 0:
        action_items.append(f"🔗 Monitor {total_pax_at_risk} at-risk connections")
    
    if tri_result['crew_risk'] != 'Low':
        action_items.append(f"👨‍✈️ {tri_result['crew_action']}")
    
    if tri_result['fuel_cost_saving'] > 100:
        action_items.append(f"⛽ Review fuel uplift - ${tri_result['fuel_cost_saving']} potential savings")
    
    if tri_result['diversion_cost'] > 0:
        action_items.append(f"🛬 Evaluate diversion alternatives")
    
    if not action_items:
        action_items.append("✅ No immediate actions required")
    
    for action in action_items:
        st.write(f"• {action}")

# Footer with timestamp
st.divider()
st.caption(f"Last updated: {datetime.now().strftime('%Y-%m-%d %H:%M:%S UTC')} | AINO Total Risk Intelligence Command Centre")

# Export functionality
if st.button("📥 Export Analysis"):
    export_data = {
        "flight_analysis": tri_result,
        "connection_summary": connection_summary,
        "analysis_timestamp": datetime.now().isoformat()
    }
    
    st.download_button(
        label="Download TRI Analysis (JSON)",
        data=json.dumps(export_data, indent=2),
        file_name=f"tri_analysis_{flight_id}_{datetime.now().strftime('%Y%m%d_%H%M%S')}.json",
        mime="application/json"
    )
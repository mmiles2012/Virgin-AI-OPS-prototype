#!/usr/bin/env python3
"""
Streamlit Dashboard for AINO Aviation Intelligence Platform
Live delay prediction dashboard for Virgin Atlantic flights
"""

import streamlit as st
import pandas as pd
import numpy as np
import plotly.express as px
import plotly.graph_objects as go
from datetime import datetime, timedelta
import requests
import json
import time
from predict_delay import AINODelayPredictor
import os

# Configure page
st.set_page_config(
    page_title="AINO Aviation Intelligence",
    page_icon="✈️",
    layout="wide"
)

# Custom CSS
st.markdown("""
<style>
.metric-card {
    background-color: #1e293b;
    padding: 1rem;
    border-radius: 8px;
    border-left: 4px solid #3b82f6;
}
.delay-high { border-left-color: #ef4444; }
.delay-medium { border-left-color: #f59e0b; }
.delay-low { border-left-color: #10b981; }
</style>
""", unsafe_allow_html=True)

@st.cache_data(ttl=30)  # Cache for 30 seconds
def get_live_flights():
    """Fetch live Virgin Atlantic flights"""
    try:
        response = requests.get("http://localhost:5000/api/aviation/virgin-atlantic-flights", timeout=10)
        if response.status_code == 200:
            data = response.json()
            return data.get('flights', [])
    except:
        pass
    return []

@st.cache_resource
def load_predictor():
    """Load the ML predictor (cached)"""
    try:
        return AINODelayPredictor()
    except Exception as e:
        st.error(f"Failed to load prediction model: {e}")
        return None

def format_flight_card(flight_data):
    """Format flight information as a card"""
    prediction = flight_data.get('prediction', 'Unknown')
    confidence = flight_data.get('confidence', 0.0)
    
    # Determine card style based on prediction
    if 'Major' in prediction:
        card_class = 'delay-high'
        emoji = '🔴'
    elif 'Minor' in prediction:
        card_class = 'delay-medium'
        emoji = '🟡'
    else:
        card_class = 'delay-low'
        emoji = '🟢'
    
    return f"""
    <div class="metric-card {card_class}">
        <h4>{emoji} {flight_data.get('flight_number', 'Unknown')}</h4>
        <p><strong>Route:</strong> {flight_data.get('route', 'Unknown')}</p>
        <p><strong>Aircraft:</strong> {flight_data.get('aircraft_type', 'Unknown')}</p>
        <p><strong>Prediction:</strong> {prediction}</p>
        <p><strong>Confidence:</strong> {confidence:.1%}</p>
    </div>
    """

def main():
    # Header
    st.title("✈️ AINO Aviation Intelligence Platform")
    st.markdown("**Real-time Virgin Atlantic Flight Delay Prediction**")
    
    # Load predictor
    predictor = load_predictor()
    
    if predictor is None:
        st.error("❌ Prediction model not available. Please train the model first using `python train_model.py`")
        st.stop()
    
    # Model status
    model_status = predictor.get_model_status()
    
    # Sidebar with model info
    with st.sidebar:
        st.header("📊 Model Information")
        st.metric("Model Accuracy", f"{model_status.get('model_accuracy', 'Unknown'):.1%}" 
                 if isinstance(model_status.get('model_accuracy'), (int, float)) else "Unknown")
        st.metric("Feature Count", model_status.get('feature_count', 0))
        st.write(f"**Training Date:** {model_status.get('training_date', 'Unknown')}")
        st.write(f"**Training Records:** {model_status.get('training_records', 'Unknown')}")
        
        # Refresh button
        if st.button("🔄 Refresh Data"):
            st.cache_data.clear()
            st.rerun()
    
    # Auto-refresh toggle
    auto_refresh = st.checkbox("🔄 Auto-refresh (30s)", value=True)
    
    # Get live flights
    flights = get_live_flights()
    
    if not flights:
        st.warning("⚠️ No live flights available. Please check the AINO platform connection.")
        st.stop()
    
    # Generate predictions
    with st.spinner("🔮 Generating delay predictions..."):
        predictions = []
        for flight in flights:
            pred = predictor.predict_delay_class(flight)
            predictions.append(pred)
    
    # Filter out error predictions
    valid_predictions = [p for p in predictions if 'error' not in p]
    
    if not valid_predictions:
        st.error("❌ Unable to generate predictions for current flights")
        st.stop()
    
    # Summary metrics
    st.header("📈 Flight Status Overview")
    
    col1, col2, col3, col4 = st.columns(4)
    
    # Count predictions by type
    on_time_count = sum(1 for p in valid_predictions if 'On Time' in p.get('prediction', ''))
    minor_delay_count = sum(1 for p in valid_predictions if 'Minor' in p.get('prediction', ''))
    major_delay_count = sum(1 for p in valid_predictions if 'Major' in p.get('prediction', ''))
    total_flights = len(valid_predictions)
    
    with col1:
        st.metric("🟢 On Time", on_time_count, f"{on_time_count/total_flights:.1%}" if total_flights > 0 else "0%")
    
    with col2:
        st.metric("🟡 Minor Delays", minor_delay_count, f"{minor_delay_count/total_flights:.1%}" if total_flights > 0 else "0%")
    
    with col3:
        st.metric("🔴 Major Delays", major_delay_count, f"{major_delay_count/total_flights:.1%}" if total_flights > 0 else "0%")
    
    with col4:
        st.metric("✈️ Total Flights", total_flights)
    
    # Flight predictions table
    st.header("🛫 Live Flight Predictions")
    
    # Create DataFrame for table
    df_predictions = pd.DataFrame(valid_predictions)
    
    if not df_predictions.empty:
        # Select and rename columns for display
        display_columns = {
            'flight_number': 'Flight',
            'route': 'Route',
            'aircraft_type': 'Aircraft',
            'prediction': 'Delay Prediction',
            'confidence': 'Confidence',
            'current_status': 'Status'
        }
        
        available_columns = {k: v for k, v in display_columns.items() if k in df_predictions.columns}
        df_display = df_predictions[list(available_columns.keys())].rename(columns=available_columns)
        
        # Format confidence as percentage
        if 'Confidence' in df_display.columns:
            df_display['Confidence'] = df_display['Confidence'].apply(lambda x: f"{x:.1%}")
        
        # Color code predictions
        def color_prediction(val):
            if 'Major' in str(val):
                return 'background-color: #fee2e2; color: #dc2626'
            elif 'Minor' in str(val):
                return 'background-color: #fef3c7; color: #d97706'
            elif 'On Time' in str(val):
                return 'background-color: #dcfce7; color: #16a34a'
            return ''
        
        styled_df = df_display.style.applymap(color_prediction, subset=['Delay Prediction'])
        st.dataframe(styled_df, use_container_width=True)
    
    # Detailed flight cards
    st.header("📋 Detailed Flight Information")
    
    # Create columns for flight cards
    cols_per_row = 3
    rows = (len(valid_predictions) + cols_per_row - 1) // cols_per_row
    
    for row in range(rows):
        cols = st.columns(cols_per_row)
        for col_idx in range(cols_per_row):
            flight_idx = row * cols_per_row + col_idx
            if flight_idx < len(valid_predictions):
                with cols[col_idx]:
                    st.markdown(format_flight_card(valid_predictions[flight_idx]), unsafe_allow_html=True)
    
    # Prediction confidence distribution
    st.header("📊 Prediction Confidence Analysis")
    
    if len(valid_predictions) >= 3:
        # Confidence histogram
        confidences = [p.get('confidence', 0) for p in valid_predictions]
        fig_conf = px.histogram(
            x=confidences,
            nbins=10,
            title="Prediction Confidence Distribution",
            labels={'x': 'Confidence Score', 'y': 'Number of Flights'}
        )
        fig_conf.update_layout(height=300)
        st.plotly_chart(fig_conf, use_container_width=True)
        
        # Prediction distribution pie chart
        prediction_counts = {
            'On Time': on_time_count,
            'Minor Delay': minor_delay_count,
            'Major Delay': major_delay_count
        }
        
        fig_pie = px.pie(
            values=list(prediction_counts.values()),
            names=list(prediction_counts.keys()),
            title="Delay Prediction Distribution",
            color_discrete_map={
                'On Time': '#10b981',
                'Minor Delay': '#f59e0b',
                'Major Delay': '#ef4444'
            }
        )
        fig_pie.update_layout(height=300)
        st.plotly_chart(fig_pie, use_container_width=True)
    
    # Raw data (expandable)
    with st.expander("🔍 Raw Prediction Data"):
        st.json(valid_predictions)
    
    # Auto-refresh
    if auto_refresh:
        time.sleep(30)
        st.rerun()
    
    # Footer
    st.markdown("---")
    st.markdown(f"*Last updated: {datetime.now().strftime('%Y-%m-%d %H:%M:%S UTC')} | AINO Aviation Intelligence Platform*")

if __name__ == "__main__":
    main()
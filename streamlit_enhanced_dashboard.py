#!/usr/bin/env python3
"""
Enhanced Streamlit Dashboard for AINO Aviation Intelligence Platform
Displays flight predictions with METAR weather data integration
"""

import streamlit as st
import pandas as pd
import requests
from enhanced_predictor import EnhancedPredictor
import logging

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Page configuration
st.set_page_config(
    page_title="AINO Enhanced Aviation Intelligence",
    page_icon="✈️",
    layout="wide"
)

# Custom CSS
st.markdown("""
<style>
.metric-card {
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    padding: 1rem;
    border-radius: 8px;
    color: white;
    margin: 0.5rem 0;
}
.weather-score {
    background: linear-gradient(135deg, #11998e 0%, #38ef7d 100%);
    padding: 0.5rem;
    border-radius: 4px;
    color: white;
    text-align: center;
}
</style>
""", unsafe_allow_html=True)

@st.cache_data(ttl=30)
def load_enhanced_predictions():
    """Load enhanced predictions with METAR weather data"""
    try:
        predictor = EnhancedPredictor()
        predictions = predictor.predict_all_flights()
        
        # Filter successful predictions
        valid_predictions = [p for p in predictions if 'error' not in p]
        
        if valid_predictions:
            # Create DataFrame as requested
            df_data = []
            for pred in valid_predictions:
                features = pred.get('features_used', {})
                df_data.append({
                    'flight_id': pred['flight_number'],
                    'dest': pred['destination'],
                    'gs': features.get('ground_speed', 450),
                    'alt': features.get('altitude', 35000),
                    'weather_score': pred['weather_score'],
                    'Prediction': pred['prediction']
                })
            
            return pd.DataFrame(df_data)
        
    except Exception as e:
        logger.error(f"Error loading predictions: {e}")
        st.error(f"Failed to load predictions: {e}")
    
    return pd.DataFrame()

def main():
    st.title("🛩️ AINO Enhanced Aviation Intelligence Platform")
    st.subheader("Live Virgin Atlantic Delay Prediction with METAR Weather Data")
    
    # Load predictions
    df = load_enhanced_predictions()
    
    if df.empty:
        st.warning("⚠️ No prediction data available. Please ensure the enhanced model is trained.")
        
        # Show training instructions
        st.info("""
        **To generate predictions:**
        1. Run: `python3 enhanced_buffer_system.py` (collect data)
        2. Run: `python3 enhanced_ml_trainer.py` (train model)
        3. Run: `python3 enhanced_predictor.py` (generate predictions)
        4. Refresh this dashboard
        """)
        return
    
    # Display metrics
    col1, col2, col3, col4 = st.columns(4)
    
    on_time = len(df[df['Prediction'] == 'On Time'])
    minor_delay = len(df[df['Prediction'] == 'Minor Delay'])
    major_delay = len(df[df['Prediction'] == 'Major Delay'])
    total = len(df)
    
    with col1:
        st.metric("🟢 On Time", on_time, f"{on_time/total*100:.1f}%" if total > 0 else "0%")
    
    with col2:
        st.metric("🟡 Minor Delays", minor_delay, f"{minor_delay/total*100:.1f}%" if total > 0 else "0%")
    
    with col3:
        st.metric("🔴 Major Delays", major_delay, f"{major_delay/total*100:.1f}%" if total > 0 else "0%")
    
    with col4:
        st.metric("✈️ Total Flights", total)
    
    # Weather analysis
    st.header("🌤️ Weather Impact Analysis")
    
    col1, col2 = st.columns(2)
    
    with col1:
        avg_weather_score = df['weather_score'].mean()
        st.metric("Average Weather Score", f"{avg_weather_score:.3f}")
    
    with col2:
        high_weather_impact = len(df[df['weather_score'] > 0.5])
        st.metric("High Weather Impact Flights", high_weather_impact)
    
    # Main data display as requested
    st.header("📊 Flight Predictions with METAR Weather Data")
    
    # Display the dataframe exactly as requested
    st.dataframe(df[['flight_id', 'dest', 'gs', 'alt', 'weather_score', 'Prediction']], use_container_width=True)
    
    # Enhanced visualization
    st.header("📈 Prediction Distribution")
    
    col1, col2 = st.columns(2)
    
    with col1:
        # Prediction distribution
        prediction_counts = df['Prediction'].value_counts()
        st.bar_chart(prediction_counts)
    
    with col2:
        # Weather score distribution
        st.line_chart(df.set_index('flight_id')['weather_score'])
    
    # Auto-refresh option
    if st.checkbox("🔄 Auto-refresh (30 seconds)"):
        st.rerun()

if __name__ == "__main__":
    main()
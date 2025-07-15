#!/usr/bin/env python3
"""
Streamlit Dashboard for FAA NAS Status Monitor with ML
Real-time monitoring with ground stop prediction capabilities
"""

import streamlit as st
import pandas as pd
import numpy as np
import plotly.express as px
import plotly.graph_objects as go
from datetime import datetime, timedelta
import joblib
import logging

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Page configuration
st.set_page_config(
    page_title="FAA NAS Status Monitor - AINO Platform",
    page_icon="✈️",
    layout="wide",
    initial_sidebar_state="expanded"
)

@st.cache_data(ttl=300)  # Cache for 5 minutes
def load_faa_data():
    """Load FAA NAS status data with caching"""
    try:
        from faa_nas_scraper import scrape_faa_nas_status
        from feature_engineering import create_features
        
        logger.info("Loading FAA NAS data...")
        df = scrape_faa_nas_status()
        df = create_features(df)
        return df
    except Exception as e:
        logger.error(f"Error loading FAA data: {e}")
        return create_sample_data()

def create_sample_data():
    """Create sample data for demonstration"""
    sample_data = pd.DataFrame({
        'airport': ['JFK', 'LAX', 'BOS', 'ATL', 'ORD'],
        'status': ['Ground Stop', 'Normal Operations', 'Arrival Delay', 'Departure Delay', 'Normal Operations'],
        'reason': ['Weather / Thunderstorms', '', 'Volume', 'Weather / Low Visibility', ''],
        'start_time': [
            datetime.now() - timedelta(hours=2),
            datetime.now() - timedelta(hours=1),
            datetime.now() - timedelta(minutes=30),
            datetime.now() - timedelta(hours=4),
            datetime.now() - timedelta(minutes=15)
        ],
        'last_update': [datetime.now() for _ in range(5)],
        'is_ground_stop': [1, 0, 0, 0, 0],
        'hour_of_day': [14, 15, 16, 10, 17],
        'day_of_week': [1, 1, 1, 1, 1],
        'month': [7, 7, 7, 7, 7],
        'is_weekend': [0, 0, 0, 0, 0],
        'is_peak_hour': [0, 0, 1, 0, 1],
        'is_major_hub': [1, 1, 1, 1, 1],
        'is_va_destination': [1, 1, 1, 1, 0],
        'is_weather_related': [1, 0, 0, 1, 0],
        'is_volume_related': [0, 0, 1, 0, 0],
        'is_equipment_related': [0, 0, 0, 0, 0],
        'event_duration_mins': [120, 60, 30, 240, 15],
        'is_holiday_period': [1, 1, 1, 1, 1]
    })
    
    from feature_engineering import create_features
    return create_features(sample_data)

@st.cache_resource
def load_model():
    """Load trained ML model with caching"""
    try:
        model = joblib.load("nas_ground_stop_model.pkl")
        metadata = joblib.load("model_metadata.pkl")
        return model, metadata
    except FileNotFoundError:
        logger.warning("Model not found, training new model...")
        return train_new_model()
    except Exception as e:
        logger.error(f"Error loading model: {e}")
        return None, None

def train_new_model():
    """Train a new model if none exists"""
    try:
        from model_train import train_model
        df = load_faa_data()
        model, metrics = train_model(df)
        
        if model:
            metadata = {
                'feature_names': ['hour_of_day', 'day_of_week', 'is_weather_related'],
                'model_type': 'RandomForestClassifier',
                'training_date': datetime.now().isoformat()
            }
            return model, metadata
        return None, None
    except Exception as e:
        logger.error(f"Error training model: {e}")
        return None, None

def predict_ground_stops(model, df, metadata):
    """Make ground stop predictions"""
    if model is None or metadata is None:
        return df
    
    try:
        feature_names = metadata.get('feature_names', ['hour_of_day', 'day_of_week', 'is_weather_related'])
        available_features = [col for col in feature_names if col in df.columns]
        
        if available_features:
            X = df[available_features].fillna(0)
            predictions = model.predict(X)
            probabilities = model.predict_proba(X)
            
            df['Predicted Ground Stop'] = predictions
            df['Ground Stop Probability'] = probabilities[:, 1] if probabilities.shape[1] > 1 else 0
        else:
            df['Predicted Ground Stop'] = 0
            df['Ground Stop Probability'] = 0.1
            
    except Exception as e:
        logger.error(f"Prediction error: {e}")
        df['Predicted Ground Stop'] = 0
        df['Ground Stop Probability'] = 0.1
    
    return df

def main():
    """Main Streamlit application"""
    st.title("🛩️ FAA NAS Status Monitor with ML")
    st.markdown("**Real-time National Airspace System monitoring with ground stop prediction**")
    
    # Sidebar
    st.sidebar.header("⚙️ Controls")
    auto_refresh = st.sidebar.checkbox("Auto-refresh data", value=True)
    
    if auto_refresh:
        refresh_interval = st.sidebar.selectbox(
            "Refresh interval (seconds)", 
            [30, 60, 120, 300], 
            index=2
        )
    
    # Load data and model
    with st.spinner("Loading FAA NAS data..."):
        df = load_faa_data()
        model, metadata = load_model()
    
    # Make predictions
    if model is not None:
        df = predict_ground_stops(model, df, metadata)
        st.sidebar.success("✅ ML Model Loaded")
    else:
        st.sidebar.warning("⚠️ ML Model Not Available")
    
    # Main dashboard
    col1, col2, col3, col4 = st.columns(4)
    
    with col1:
        st.metric(
            "Total Airports", 
            len(df),
            delta=None
        )
    
    with col2:
        ground_stops = df['is_ground_stop'].sum() if 'is_ground_stop' in df.columns else 0
        st.metric(
            "Active Ground Stops", 
            ground_stops,
            delta=None
        )
    
    with col3:
        if 'Predicted Ground Stop' in df.columns:
            predicted_stops = df['Predicted Ground Stop'].sum()
            st.metric(
                "Predicted Ground Stops", 
                predicted_stops,
                delta=None
            )
        else:
            st.metric("Predicted Ground Stops", "N/A")
    
    with col4:
        va_affected = 0
        if 'is_va_destination' in df.columns:
            va_affected = df[df['is_va_destination'] == 1]['is_ground_stop'].sum()
        st.metric(
            "Virgin Atlantic Affected", 
            va_affected,
            delta=None
        )
    
    # Tabs for different views
    tab1, tab2, tab3, tab4 = st.tabs(["📊 Current Status", "🤖 ML Predictions", "📈 Analytics", "🔧 Model Info"])
    
    with tab1:
        st.subheader("Current Airport Status")
        
        # Display main data table
        display_columns = ['airport', 'status', 'reason']
        if 'Predicted Ground Stop' in df.columns:
            display_columns.append('Predicted Ground Stop')
        
        st.dataframe(
            df[display_columns], 
            use_container_width=True,
            hide_index=True
        )
        
        # Status distribution
        col1, col2 = st.columns(2)
        
        with col1:
            status_counts = df['status'].value_counts()
            fig_status = px.pie(
                values=status_counts.values, 
                names=status_counts.index,
                title="Airport Status Distribution"
            )
            st.plotly_chart(fig_status, use_container_width=True)
        
        with col2:
            if 'reason' in df.columns:
                reason_counts = df[df['reason'] != '']['reason'].value_counts().head(5)
                if not reason_counts.empty:
                    fig_reasons = px.bar(
                        x=reason_counts.values,
                        y=reason_counts.index,
                        orientation='h',
                        title="Top Delay Reasons"
                    )
                    st.plotly_chart(fig_reasons, use_container_width=True)
    
    with tab2:
        st.subheader("ML Ground Stop Predictions")
        
        if model is not None and 'Ground Stop Probability' in df.columns:
            # Prediction summary
            high_risk = df[df['Ground Stop Probability'] > 0.7]
            medium_risk = df[(df['Ground Stop Probability'] > 0.3) & (df['Ground Stop Probability'] <= 0.7)]
            
            st.markdown(f"""
            **Risk Assessment:**
            - 🔴 High Risk (>70%): {len(high_risk)} airports
            - 🟡 Medium Risk (30-70%): {len(medium_risk)} airports
            - 🟢 Low Risk (<30%): {len(df) - len(high_risk) - len(medium_risk)} airports
            """)
            
            # Probability visualization
            fig_prob = px.bar(
                df, 
                x='airport', 
                y='Ground Stop Probability',
                title="Ground Stop Probability by Airport",
                color='Ground Stop Probability',
                color_continuous_scale='Reds'
            )
            st.plotly_chart(fig_prob, use_container_width=True)
            
            # High-risk airports table
            if not high_risk.empty:
                st.subheader("🚨 High-Risk Airports")
                st.dataframe(
                    high_risk[['airport', 'status', 'reason', 'Ground Stop Probability']],
                    use_container_width=True,
                    hide_index=True
                )
        else:
            st.warning("ML predictions not available. Please train the model first.")
    
    with tab3:
        st.subheader("Analytics Dashboard")
        
        # Time-based analysis
        if 'hour_of_day' in df.columns:
            col1, col2 = st.columns(2)
            
            with col1:
                hourly_issues = df.groupby('hour_of_day')['is_ground_stop'].mean()
                fig_hourly = px.line(
                    x=hourly_issues.index,
                    y=hourly_issues.values,
                    title="Ground Stop Rate by Hour of Day",
                    labels={'x': 'Hour', 'y': 'Ground Stop Rate'}
                )
                st.plotly_chart(fig_hourly, use_container_width=True)
            
            with col2:
                if 'is_weather_related' in df.columns:
                    weather_impact = df.groupby('is_weather_related')['is_ground_stop'].mean()
                    fig_weather = px.bar(
                        x=['Non-Weather', 'Weather-Related'],
                        y=weather_impact.values,
                        title="Ground Stop Rate by Cause Type"
                    )
                    st.plotly_chart(fig_weather, use_container_width=True)
        
        # Virgin Atlantic impact analysis
        if 'is_va_destination' in df.columns:
            st.subheader("Virgin Atlantic Impact Analysis")
            va_airports = df[df['is_va_destination'] == 1]
            
            if not va_airports.empty:
                col1, col2 = st.columns(2)
                
                with col1:
                    st.metric(
                        "VA Destinations Monitored", 
                        len(va_airports),
                        delta=None
                    )
                
                with col2:
                    va_issues = va_airports['is_ground_stop'].sum()
                    st.metric(
                        "VA Destinations with Issues", 
                        va_issues,
                        delta=None
                    )
                
                if va_issues > 0:
                    st.dataframe(
                        va_airports[va_airports['is_ground_stop'] == 1][['airport', 'status', 'reason']],
                        use_container_width=True,
                        hide_index=True
                    )
    
    with tab4:
        st.subheader("Model Information")
        
        if model is not None and metadata is not None:
            col1, col2 = st.columns(2)
            
            with col1:
                st.markdown(f"""
                **Model Details:**
                - Model Type: {metadata.get('model_type', 'N/A')}
                - Training Date: {metadata.get('training_date', 'N/A')}
                - Features: {len(metadata.get('feature_names', []))}
                """)
            
            with col2:
                if 'feature_names' in metadata:
                    st.markdown("**Features Used:**")
                    for feature in metadata['feature_names']:
                        st.write(f"• {feature}")
            
            # Model retraining
            if st.button("🔄 Retrain Model"):
                with st.spinner("Retraining model..."):
                    try:
                        from model_train import train_model
                        new_model, metrics = train_model(df)
                        if new_model:
                            st.success("✅ Model retrained successfully!")
                            st.experimental_rerun()
                        else:
                            st.error("❌ Model retraining failed")
                    except Exception as e:
                        st.error(f"❌ Error retraining model: {e}")
        else:
            st.warning("⚠️ No model loaded")
            
            if st.button("🏗️ Train New Model"):
                with st.spinner("Training new model..."):
                    try:
                        from model_train import train_model
                        new_model, metrics = train_model(df)
                        if new_model:
                            st.success("✅ New model trained successfully!")
                            st.experimental_rerun()
                        else:
                            st.error("❌ Model training failed")
                    except Exception as e:
                        st.error(f"❌ Error training model: {e}")
    
    # Auto-refresh
    if auto_refresh:
        time.sleep(refresh_interval)
        st.experimental_rerun()
    
    # Footer
    st.markdown("---")
    st.markdown(f"**AINO Aviation Intelligence Platform** | Last updated: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")

if __name__ == "__main__":
    main()
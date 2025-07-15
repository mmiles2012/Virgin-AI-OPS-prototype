#!/usr/bin/env python3
"""
FAA NAS Status Dashboard Launcher
Standalone Streamlit application for ML-powered ground stop prediction
Bypasses Express.js routing issues and provides direct access to FAA intelligence
"""

import subprocess
import sys
import os
import json
import time
from datetime import datetime
import streamlit as st
import pandas as pd
import plotly.express as px
import plotly.graph_objects as go
from faa_nas_scraper import scrape_faa_nas_status
from feature_engineering import create_features
from model_train import train_model, load_model, predict_ground_stop

# Configure Streamlit page
st.set_page_config(
    page_title="FAA NAS Status - AINO Platform",
    page_icon="🛫",
    layout="wide",
    initial_sidebar_state="expanded"
)

def load_faa_data():
    """Load and process FAA NAS status data with ML features"""
    try:
        # Load raw data
        df = scrape_faa_nas_status()
        
        # Add ML features
        df_features = create_features(df)
        
        return df_features, True
    except Exception as e:
        st.error(f"Error loading FAA data: {str(e)}")
        return None, False

def train_ml_model():
    """Train the ML model and return performance metrics"""
    try:
        df = scrape_faa_nas_status()
        df_features = create_features(df)
        
        model, metrics = train_model(df_features)
        
        return model, metrics, True
    except Exception as e:
        st.error(f"Error training ML model: {str(e)}")
        return None, None, False

def main():
    """Main Streamlit application"""
    
    # Header
    st.title("🛫 FAA NAS Status Dashboard")
    st.markdown("**ML-Powered Ground Stop Prediction for AINO Platform**")
    
    # Sidebar
    st.sidebar.title("FAA Intelligence")
    st.sidebar.markdown("Real-time US airspace monitoring with machine learning")
    
    # Load data
    if st.sidebar.button("Refresh Data", type="primary"):
        st.experimental_rerun()
    
    df, data_loaded = load_faa_data()
    
    if not data_loaded or df is None:
        st.error("Unable to load FAA data. Using fallback system.")
        return
    
    # Main dashboard tabs
    tab1, tab2, tab3, tab4 = st.tabs(["📊 Overview", "🚫 Ground Stops", "🤖 ML Predictions", "⚙️ Model Training"])
    
    with tab1:
        st.header("FAA NAS Status Overview")
        
        # Key metrics
        col1, col2, col3, col4 = st.columns(4)
        
        total_events = len(df)
        ground_stops = df['is_ground_stop'].sum() if 'is_ground_stop' in df.columns else 0
        va_affected = df[df.get('is_va_destination', False) == True]['is_ground_stop'].sum() if 'is_va_destination' in df.columns else 0
        avg_delay = df['event_duration_mins'].mean() if 'event_duration_mins' in df.columns else 0
        
        with col1:
            st.metric("Active Events", total_events)
        with col2:
            st.metric("Ground Stops", int(ground_stops))
        with col3:
            st.metric("Virgin Atlantic Affected", int(va_affected))
        with col4:
            st.metric("Avg Delay (min)", f"{avg_delay:.1f}")
        
        # Status map
        st.subheader("Airport Status")
        
        if not df.empty:
            # Create status visualization
            status_counts = df['status'].value_counts()
            
            fig = px.pie(
                values=status_counts.values,
                names=status_counts.index,
                title="Airport Event Distribution",
                color_discrete_sequence=px.colors.qualitative.Set3
            )
            st.plotly_chart(fig, use_container_width=True)
            
            # Airport events table
            st.subheader("Current Airport Events")
            display_df = df[['airport', 'status', 'reason', 'start_time', 'event_duration_mins']].copy()
            display_df = display_df.sort_values('event_duration_mins', ascending=False)
            st.dataframe(display_df, use_container_width=True)
    
    with tab2:
        st.header("Ground Stop Analysis")
        
        if 'is_ground_stop' in df.columns:
            ground_stop_df = df[df['is_ground_stop'] == 1]
            
            if not ground_stop_df.empty:
                st.subheader(f"Active Ground Stops: {len(ground_stop_df)}")
                
                # Ground stop timeline
                fig = px.timeline(
                    ground_stop_df,
                    x_start='start_time',
                    x_end='start_time',  # Point in time
                    y='airport',
                    color='reason',
                    title="Ground Stop Timeline"
                )
                st.plotly_chart(fig, use_container_width=True)
                
                # Virgin Atlantic impact
                va_ground_stops = ground_stop_df[ground_stop_df.get('is_va_destination', False) == True]
                if not va_ground_stops.empty:
                    st.subheader("Virgin Atlantic Impact")
                    st.dataframe(va_ground_stops[['airport', 'reason', 'event_duration_mins']], use_container_width=True)
                else:
                    st.success("No Virgin Atlantic destinations currently affected by ground stops")
            else:
                st.success("No active ground stops - normal operations")
        else:
            st.info("Ground stop analysis not available")
    
    with tab3:
        st.header("ML Predictions")
        
        # Load or train model
        try:
            model, metadata = load_model()
            st.success(f"Model loaded successfully. Accuracy: {metadata.get('accuracy', 'N/A'):.1%}")
        except:
            st.warning("No trained model found. Training new model...")
            model, metrics, trained = train_ml_model()
            if trained:
                st.success(f"Model trained successfully. Cross-validation accuracy: {metrics.get('cv_accuracy', 0):.1%}")
            else:
                st.error("Failed to train model")
                return
        
        # Make predictions for each airport
        st.subheader("Ground Stop Risk Predictions")
        
        predictions = []
        for _, row in df.iterrows():
            features_dict = {
                'hour_of_day': row.get('hour_of_day', 12),
                'day_of_week': row.get('day_of_week', 1),
                'is_peak_hour': row.get('is_peak_hour', 0),
                'is_weekend': row.get('is_weekend', 0),
                'event_duration_mins': row.get('event_duration_mins', 60),
                'is_va_destination': row.get('is_va_destination', 0),
                'delay_severity': row.get('delay_severity', 2),
                'weather_factor': row.get('weather_factor', 1),
                'is_major_hub': row.get('is_major_hub', 1),
                'traffic_density': row.get('traffic_density', 0.5)
            }
            
            try:
                prediction = predict_ground_stop(model, features_dict, metadata or {})
                predictions.append({
                    'airport': row['airport'],
                    'current_status': row['status'],
                    'ground_stop_risk': prediction.get('probability', 0),
                    'prediction': prediction.get('prediction', 'Normal'),
                    'confidence': prediction.get('confidence', 0)
                })
            except Exception as e:
                st.warning(f"Prediction failed for {row['airport']}: {str(e)}")
        
        if predictions:
            pred_df = pd.DataFrame(predictions)
            pred_df = pred_df.sort_values('ground_stop_risk', ascending=False)
            
            # Risk visualization
            fig = px.bar(
                pred_df,
                x='airport',
                y='ground_stop_risk',
                color='ground_stop_risk',
                title="Ground Stop Risk by Airport",
                color_continuous_scale='Reds'
            )
            fig.update_layout(xaxis_tickangle=-45)
            st.plotly_chart(fig, use_container_width=True)
            
            # Predictions table
            st.dataframe(pred_df, use_container_width=True)
    
    with tab4:
        st.header("Model Training & Performance")
        
        if st.button("Train New Model", type="primary"):
            with st.spinner("Training ML model..."):
                model, metrics, trained = train_ml_model()
                
                if trained and metrics:
                    st.success("Model training completed!")
                    
                    # Display metrics
                    col1, col2, col3 = st.columns(3)
                    with col1:
                        st.metric("Cross-Validation Accuracy", f"{metrics.get('cv_accuracy', 0):.1%}")
                    with col2:
                        st.metric("Features Used", metrics.get('n_features', 'N/A'))
                    with col3:
                        st.metric("Training Samples", metrics.get('n_samples', 'N/A'))
                    
                    # Feature importance
                    if 'feature_importance' in metrics:
                        importance_df = pd.DataFrame({
                            'feature': metrics['feature_names'],
                            'importance': metrics['feature_importance']
                        }).sort_values('importance', ascending=True)
                        
                        fig = px.bar(
                            importance_df.tail(10),
                            x='importance',
                            y='feature',
                            orientation='h',
                            title="Top 10 Feature Importance"
                        )
                        st.plotly_chart(fig, use_container_width=True)
                else:
                    st.error("Model training failed")
        
        # Model information
        try:
            _, metadata = load_model()
            if metadata:
                st.subheader("Current Model Information")
                st.json(metadata)
        except:
            st.info("No model metadata available")
    
    # Footer
    st.markdown("---")
    st.markdown(f"**Last Updated:** {datetime.now().strftime('%Y-%m-%d %H:%M:%S')} | **AINO Aviation Intelligence Platform**")

if __name__ == "__main__":
    main()
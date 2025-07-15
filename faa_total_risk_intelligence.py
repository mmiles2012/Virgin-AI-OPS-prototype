#!/usr/bin/env python3
"""
FAA Total Risk Intelligence ML Dashboard
Comprehensive ML-powered slot risk analysis with authentic FAA NAS Status integration
"""

import streamlit as st
import pandas as pd
import numpy as np
import requests
import json
import plotly.express as px
import plotly.graph_objects as go
from datetime import datetime, timedelta
import time
import asyncio
from sklearn.ensemble import RandomForestClassifier
from sklearn.preprocessing import LabelEncoder
from sklearn.model_selection import train_test_split
from sklearn.metrics import accuracy_score, classification_report
import warnings
warnings.filterwarnings('ignore')

# Set page config
st.set_page_config(
    page_title="FAA Total Risk Intelligence ML Dashboard",
    page_icon="🛫",
    layout="wide",
    initial_sidebar_state="expanded"
)

# Dashboard title
st.title("🛫 FAA Total Risk Intelligence ML Dashboard")
st.markdown("**Comprehensive ML-powered slot risk analysis with authentic FAA NAS Status integration**")

# Sidebar controls
st.sidebar.header("⚙️ Dashboard Controls")
auto_refresh = st.sidebar.checkbox("Auto-refresh", value=True)
refresh_interval = st.sidebar.slider("Refresh interval (seconds)", 30, 300, 60)

# Data source selection
data_source = st.sidebar.selectbox(
    "Data Source",
    ["FAA NAS Status API", "AINO Platform API", "Combined Sources"]
)

# Analysis type
analysis_type = st.sidebar.selectbox(
    "Analysis Type",
    ["Real-time Risk Analysis", "Historical Trends", "ML Predictions", "Comprehensive Dashboard"]
)

class FAASlotRiskAnalyzer:
    def __init__(self):
        self.base_url = "http://localhost:5000"
        self.faa_endpoints = {
            'dashboard': '/api/slot-risk/dashboard',
            'metrics': '/api/slot-risk/metrics',
            'faa_status': '/api/slot-risk/faa-status',
            'virgin_atlantic': '/api/aviation/virgin-atlantic-flights'
        }
        self.model = None
        self.feature_names = None
        
    def fetch_faa_data(self, endpoint):
        """Fetch data from FAA endpoints"""
        try:
            response = requests.get(f"{self.base_url}{endpoint}", timeout=10)
            if response.status_code == 200:
                return response.json()
            else:
                st.error(f"Failed to fetch data from {endpoint}: {response.status_code}")
                return None
        except Exception as e:
            st.error(f"Error fetching data from {endpoint}: {str(e)}")
            return None
    
    def fetch_all_data(self):
        """Fetch all required data"""
        data = {}
        for name, endpoint in self.faa_endpoints.items():
            data[name] = self.fetch_faa_data(endpoint)
        return data
    
    def process_slot_risk_data(self, dashboard_data):
        """Process slot risk data for ML analysis"""
        if not dashboard_data or not dashboard_data.get('success'):
            return pd.DataFrame()
        
        flights = dashboard_data.get('flights', [])
        
        # Convert to DataFrame
        df = pd.DataFrame(flights)
        
        if df.empty:
            return df
        
        # Add time-based features
        df['hour'] = datetime.now().hour
        df['day_of_week'] = datetime.now().weekday()
        df['is_weekend'] = df['day_of_week'].apply(lambda x: 1 if x >= 5 else 0)
        
        # Add weather risk categories
        df['weather_risk_category'] = df['slot_risk_score'].apply(
            lambda x: 'LOW' if x <= 30 else 'MEDIUM' if x <= 60 else 'HIGH'
        )
        
        # Add delay categories
        df['delay_category'] = df['atfm_delay_min'].apply(
            lambda x: 'NONE' if x <= 5 else 'MINOR' if x <= 15 else 'MAJOR' if x <= 30 else 'SEVERE'
        )
        
        return df
    
    def train_ml_model(self, df):
        """Train ML model for slot risk prediction"""
        if df.empty:
            return None, None, None
        
        # Prepare features
        features = ['atfm_delay_min', 'hour', 'day_of_week', 'is_weekend']
        
        # Add risk factor features if available
        if 'risk_factors' in df.columns:
            for idx, row in df.iterrows():
                if isinstance(row['risk_factors'], dict):
                    for factor, value in row['risk_factors'].items():
                        df.loc[idx, f'risk_{factor}'] = value
            
            risk_cols = [col for col in df.columns if col.startswith('risk_')]
            features.extend(risk_cols)
        
        # Prepare labels
        df['high_risk'] = (df['slot_risk_score'] > 60).astype(int)
        
        # Select features that exist in the dataframe
        available_features = [f for f in features if f in df.columns]
        
        if len(available_features) < 2:
            return None, None, None
        
        X = df[available_features].fillna(0)
        y = df['high_risk']
        
        # Train model
        X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.3, random_state=42)
        
        model = RandomForestClassifier(n_estimators=100, random_state=42)
        model.fit(X_train, y_train)
        
        # Calculate accuracy
        y_pred = model.predict(X_test)
        accuracy = accuracy_score(y_test, y_pred)
        
        return model, available_features, accuracy
    
    def generate_predictions(self, model, features, df):
        """Generate ML predictions"""
        if model is None or df.empty:
            return df
        
        X = df[features].fillna(0)
        df['ml_prediction'] = model.predict_proba(X)[:, 1]
        df['ml_risk_category'] = df['ml_prediction'].apply(
            lambda x: 'LOW' if x <= 0.3 else 'MEDIUM' if x <= 0.6 else 'HIGH'
        )
        
        return df

# Initialize analyzer
analyzer = FAASlotRiskAnalyzer()

# Main dashboard logic
if analysis_type == "Comprehensive Dashboard":
    # Fetch all data
    with st.spinner("Fetching FAA data..."):
        all_data = analyzer.fetch_all_data()
    
    # Create tabs
    tab1, tab2, tab3, tab4 = st.tabs(["📊 Overview", "🎯 ML Analysis", "📈 Metrics", "🔍 FAA Status"])
    
    with tab1:
        st.header("📊 Real-time Overview")
        
        dashboard_data = all_data.get('dashboard')
        if dashboard_data and dashboard_data.get('success'):
            col1, col2, col3, col4 = st.columns(4)
            
            slot_analysis = dashboard_data.get('slot_analysis', {})
            
            with col1:
                st.metric(
                    "Total Flights", 
                    slot_analysis.get('total_flights', 0)
                )
            
            with col2:
                st.metric(
                    "High Risk Flights", 
                    slot_analysis.get('high_risk_count', 0),
                    delta=f"{slot_analysis.get('high_risk_count', 0) - 2}"
                )
            
            with col3:
                st.metric(
                    "Avg Delay (min)", 
                    f"{slot_analysis.get('average_delay', 0):.1f}",
                    delta=f"{slot_analysis.get('average_delay', 0) - 20:.1f}"
                )
            
            with col4:
                st.metric(
                    "Avg Risk Score", 
                    f"{slot_analysis.get('average_risk_score', 0):.1f}",
                    delta=f"{slot_analysis.get('average_risk_score', 0) - 50:.1f}"
                )
            
            # Data source info
            st.info(f"📡 Data Source: {dashboard_data.get('data_source', 'Unknown')}")
            st.info(f"🚨 FAA Delays Detected: {dashboard_data.get('faa_delays_detected', 0)}")
            
            # Flight details
            st.subheader("✈️ Flight Risk Analysis")
            flights_df = pd.DataFrame(dashboard_data.get('flights', []))
            
            if not flights_df.empty:
                # Display flight table
                display_cols = ['flight_number', 'destination', 'slot_risk_score', 'atfm_delay_min', 'at_risk', 'faa_delay_status']
                st.dataframe(flights_df[display_cols], use_container_width=True)
                
                # Risk distribution chart
                risk_counts = flights_df['at_risk'].value_counts()
                fig = px.pie(
                    values=risk_counts.values,
                    names=['Low Risk', 'High Risk'],
                    title="Flight Risk Distribution"
                )
                st.plotly_chart(fig, use_container_width=True)
        
        else:
            st.error("Failed to fetch dashboard data")
    
    with tab2:
        st.header("🎯 ML Analysis")
        
        dashboard_data = all_data.get('dashboard')
        if dashboard_data and dashboard_data.get('success'):
            # Process data for ML
            df = analyzer.process_slot_risk_data(dashboard_data)
            
            if not df.empty:
                # Train ML model
                with st.spinner("Training ML model..."):
                    model, features, accuracy = analyzer.train_ml_model(df)
                
                if model is not None:
                    col1, col2 = st.columns(2)
                    
                    with col1:
                        st.metric("ML Model Accuracy", f"{accuracy:.2%}")
                        st.write("**Features Used:**")
                        st.write(features)
                    
                    with col2:
                        # Feature importance
                        importance_df = pd.DataFrame({
                            'Feature': features,
                            'Importance': model.feature_importances_
                        }).sort_values('Importance', ascending=False)
                        
                        fig = px.bar(
                            importance_df,
                            x='Importance',
                            y='Feature',
                            title="Feature Importance"
                        )
                        st.plotly_chart(fig, use_container_width=True)
                    
                    # Generate predictions
                    df_with_predictions = analyzer.generate_predictions(model, features, df)
                    
                    # ML vs Actual risk comparison
                    st.subheader("ML Predictions vs Actual Risk")
                    
                    comparison_df = df_with_predictions[['flight_number', 'slot_risk_score', 'ml_prediction', 'at_risk', 'ml_risk_category']]
                    st.dataframe(comparison_df, use_container_width=True)
                    
                    # Prediction accuracy visualization
                    fig = px.scatter(
                        df_with_predictions,
                        x='slot_risk_score',
                        y='ml_prediction',
                        color='at_risk',
                        title="ML Prediction vs Actual Risk Score"
                    )
                    st.plotly_chart(fig, use_container_width=True)
                
                else:
                    st.error("Failed to train ML model - insufficient data")
            
            else:
                st.error("No flight data available for ML analysis")
    
    with tab3:
        st.header("📈 Operational Metrics")
        
        metrics_data = all_data.get('metrics')
        if metrics_data and metrics_data.get('success'):
            # Operational metrics
            op_metrics = metrics_data.get('operational_metrics', {})
            
            col1, col2, col3 = st.columns(3)
            
            with col1:
                st.metric(
                    "Slot Compliance Rate",
                    f"{op_metrics.get('slot_compliance_rate', 0):.1f}%",
                    delta=f"{op_metrics.get('slot_compliance_rate', 0) - 95:.1f}%"
                )
            
            with col2:
                st.metric(
                    "Average ATFM Delay",
                    f"{op_metrics.get('average_atfm_delay', 0):.1f} min"
                )
            
            with col3:
                st.metric(
                    "Slots At Risk",
                    f"{op_metrics.get('slots_at_risk', 0)}"
                )
            
            # Risk distribution
            risk_dist = metrics_data.get('risk_distribution', {})
            if risk_dist:
                st.subheader("Risk Distribution")
                
                risk_df = pd.DataFrame([
                    {'Risk Level': 'Low', 'Count': risk_dist.get('low_risk', 0)},
                    {'Risk Level': 'Medium', 'Count': risk_dist.get('medium_risk', 0)},
                    {'Risk Level': 'High', 'Count': risk_dist.get('high_risk', 0)},
                    {'Risk Level': 'Critical', 'Count': risk_dist.get('critical_risk', 0)}
                ])
                
                fig = px.bar(
                    risk_df,
                    x='Risk Level',
                    y='Count',
                    title="Risk Level Distribution"
                )
                st.plotly_chart(fig, use_container_width=True)
            
            # Destination analysis
            dest_analysis = metrics_data.get('destination_analysis', {})
            if dest_analysis:
                st.subheader("Destination Risk Analysis")
                
                dest_df = pd.DataFrame([
                    {'Destination': dest, 'Avg Risk': data.get('avg_risk', 0), 'Avg Delay': data.get('avg_delay', 0)}
                    for dest, data in dest_analysis.items()
                ])
                
                fig = px.scatter(
                    dest_df,
                    x='Avg Delay',
                    y='Avg Risk',
                    text='Destination',
                    title="Destination Risk vs Delay Analysis"
                )
                st.plotly_chart(fig, use_container_width=True)
        
        else:
            st.error("Failed to fetch metrics data")
    
    with tab4:
        st.header("🔍 FAA Status Monitor")
        
        faa_status = all_data.get('faa_status')
        if faa_status and faa_status.get('success'):
            nas_status = faa_status.get('faa_nas_status', {})
            
            col1, col2 = st.columns(2)
            
            with col1:
                st.metric(
                    "API Status",
                    "✅ Online" if nas_status.get('api_accessible') else "❌ Offline"
                )
                
                st.metric(
                    "Delays Detected",
                    nas_status.get('delays_detected', 0)
                )
            
            with col2:
                st.metric(
                    "Airports Monitored",
                    nas_status.get('airports_monitored', 0)
                )
                
                st.write("**Data Source:**")
                st.write(nas_status.get('data_source', 'Unknown'))
            
            # Service health
            service_health = faa_status.get('service_health', {})
            st.subheader("Service Health")
            st.json(service_health)
        
        else:
            st.error("Failed to fetch FAA status data")

# Auto-refresh functionality
if auto_refresh:
    time.sleep(refresh_interval)
    st.rerun()

# Footer
st.markdown("---")
st.markdown("**FAA Total Risk Intelligence ML Dashboard** | AINO Aviation Intelligence Platform | Real-time data from FAA NAS Status API")
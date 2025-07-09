#!/usr/bin/env python3
"""
Streamlit Dashboard for Heathrow Connection Model
Interactive dashboard for connection prediction monitoring and analysis
"""

import streamlit as st
import pandas as pd
import numpy as np
import plotly.express as px
import plotly.graph_objects as go
from plotly.subplots import make_subplots
import json
from datetime import datetime, timedelta
import time

from predict_connections import HeathrowConnectionPredictor
from train_model import HeathrowConnectionModelTrainer
from fetch_flightaware import FlightAwareHeathrowFetcher

class HeathrowConnectionDashboard:
    """Streamlit dashboard for connection monitoring"""
    
    def __init__(self):
        self.predictor = HeathrowConnectionPredictor()
        self.trainer = HeathrowConnectionModelTrainer()
        
        # Initialize session state
        if 'last_refresh' not in st.session_state:
            st.session_state.last_refresh = datetime.now()
        if 'auto_refresh' not in st.session_state:
            st.session_state.auto_refresh = False
        if 'predictions_data' not in st.session_state:
            st.session_state.predictions_data = None
    
    def run_dashboard(self):
        """Main dashboard application"""
        
        st.set_page_config(
            page_title="Heathrow Connection Intelligence",
            page_icon="✈️",
            layout="wide",
            initial_sidebar_state="expanded"
        )
        
        # Header
        st.title("🛫 Heathrow Connection Intelligence Dashboard")
        st.markdown("**ML-Powered Connection Prediction for Virgin Atlantic & Partners**")
        
        # Sidebar
        self._render_sidebar()
        
        # Main content
        tab1, tab2, tab3, tab4, tab5 = st.tabs([
            "📊 Live Predictions", "📈 Analytics", "🎯 Model Performance", 
            "⚙️ Training", "📋 Flight Data"
        ])
        
        with tab1:
            self._render_live_predictions()
        
        with tab2:
            self._render_analytics()
        
        with tab3:
            self._render_model_performance()
        
        with tab4:
            self._render_training_interface()
        
        with tab5:
            self._render_flight_data()
    
    def _render_sidebar(self):
        """Render sidebar controls"""
        
        st.sidebar.header("🔧 Dashboard Controls")
        
        # Auto-refresh toggle
        st.session_state.auto_refresh = st.sidebar.checkbox(
            "Auto-refresh (30s)", 
            value=st.session_state.auto_refresh
        )
        
        # Manual refresh button
        if st.sidebar.button("🔄 Refresh Now"):
            self._refresh_data()
        
        # Data source status
        st.sidebar.subheader("📡 Data Sources")
        
        # Check FlightAware API status
        api_status = self._check_api_status()
        st.sidebar.write(f"FlightAware API: {'✅' if api_status else '❌'}")
        
        # Model status
        model_status = self.predictor.load_models()
        st.sidebar.write(f"ML Models: {'✅' if model_status else '❌'}")
        
        # Last update time
        st.sidebar.write(f"Last update: {st.session_state.last_refresh.strftime('%H:%M:%S')}")
        
        # Settings
        st.sidebar.subheader("⚙️ Settings")
        
        risk_threshold = st.sidebar.slider(
            "High Risk Threshold", 
            min_value=0.0, 
            max_value=1.0, 
            value=0.6, 
            step=0.05
        )
        
        show_all_connections = st.sidebar.checkbox("Show All Connections", value=True)
        
        return risk_threshold, show_all_connections
    
    def _render_live_predictions(self):
        """Render live predictions tab"""
        
        st.header("📊 Live Connection Predictions")
        
        # Get predictions
        predictions_data = self._get_predictions_data()
        
        if not predictions_data or 'error' in predictions_data:
            st.error("Unable to load prediction data. Please check data sources.")
            return
        
        predictions = predictions_data.get('predictions', [])
        summary = predictions_data.get('summary', {})
        
        # Summary metrics
        col1, col2, col3, col4 = st.columns(4)
        
        with col1:
            st.metric(
                "Total Connections", 
                summary.get('total_connections', 0)
            )
        
        with col2:
            avg_prob = summary.get('avg_success_probability', 0)
            st.metric(
                "Avg Success Rate", 
                f"{avg_prob:.1%}"
            )
        
        with col3:
            high_risk = summary.get('risk_distribution', {}).get('HIGH', 0) + \
                       summary.get('risk_distribution', {}).get('CRITICAL', 0)
            st.metric(
                "High Risk Connections", 
                high_risk
            )
        
        with col4:
            va_connections = summary.get('virgin_atlantic_connections', 0)
            st.metric(
                "Virgin Atlantic", 
                va_connections
            )
        
        # Risk distribution chart
        if summary.get('risk_distribution'):
            fig_risk = px.pie(
                values=list(summary['risk_distribution'].values()),
                names=list(summary['risk_distribution'].keys()),
                title="Risk Level Distribution",
                color_discrete_map={
                    'LOW': 'green',
                    'MEDIUM': 'yellow', 
                    'HIGH': 'orange',
                    'CRITICAL': 'red'
                }
            )
            st.plotly_chart(fig_risk, use_container_width=True)
        
        # Predictions table
        st.subheader("🔍 Connection Details")
        
        if predictions:
            df_predictions = pd.DataFrame(predictions)
            
            # Select relevant columns
            display_columns = [
                'arrival_flight', 'departure_flight', 'ensemble_probability',
                'risk_level', 'connection_time_minutes', 'arrival_origin',
                'departure_destination', 'arrival_terminal', 'departure_terminal'
            ]
            
            available_columns = [col for col in display_columns if col in df_predictions.columns]
            df_display = df_predictions[available_columns].copy()
            
            # Format probability as percentage
            if 'ensemble_probability' in df_display.columns:
                df_display['success_rate'] = df_display['ensemble_probability'].apply(lambda x: f"{x:.1%}")
                df_display = df_display.drop('ensemble_probability', axis=1)
            
            # Rename columns for display
            column_names = {
                'arrival_flight': 'Arrival Flight',
                'departure_flight': 'Departure Flight',
                'success_rate': 'Success Rate',
                'risk_level': 'Risk Level',
                'connection_time_minutes': 'Connection Time (min)',
                'arrival_origin': 'From',
                'departure_destination': 'To',
                'arrival_terminal': 'Arr Terminal',
                'departure_terminal': 'Dep Terminal'
            }
            df_display = df_display.rename(columns=column_names)
            
            # Sort by risk level and success rate
            risk_order = {'CRITICAL': 0, 'HIGH': 1, 'MEDIUM': 2, 'LOW': 3}
            if 'Risk Level' in df_display.columns:
                df_display['risk_sort'] = df_display['Risk Level'].map(risk_order)
                df_display = df_display.sort_values(['risk_sort', 'Success Rate'])
                df_display = df_display.drop('risk_sort', axis=1)
            
            # Color code risk levels
            def color_risk_level(val):
                if val == 'CRITICAL':
                    return 'background-color: #ffebee'
                elif val == 'HIGH':
                    return 'background-color: #fff3e0'
                elif val == 'MEDIUM':
                    return 'background-color: #fff8e1'
                else:
                    return 'background-color: #e8f5e8'
            
            if 'Risk Level' in df_display.columns:
                styled_df = df_display.style.applymap(color_risk_level, subset=['Risk Level'])
                st.dataframe(styled_df, use_container_width=True)
            else:
                st.dataframe(df_display, use_container_width=True)
        
        # Detailed connection analysis
        if predictions:
            st.subheader("🔍 Detailed Analysis")
            
            selected_connection = st.selectbox(
                "Select connection for detailed analysis:",
                options=range(len(predictions)),
                format_func=lambda x: f"{predictions[x].get('arrival_flight', 'Unknown')} → {predictions[x].get('departure_flight', 'Unknown')}"
            )
            
            if selected_connection is not None:
                conn = predictions[selected_connection]
                
                col1, col2 = st.columns(2)
                
                with col1:
                    st.write("**Connection Details:**")
                    st.write(f"• Success Probability: {conn.get('ensemble_probability', 0.5):.1%}")
                    st.write(f"• Risk Level: {conn.get('risk_level', 'Unknown')}")
                    st.write(f"• Connection Time: {conn.get('connection_time_minutes', 'Unknown')} minutes")
                    st.write(f"• Terminal Transfer: {'Yes' if conn.get('arrival_terminal') != conn.get('departure_terminal') else 'No'}")
                
                with col2:
                    st.write("**Recommendations:**")
                    recommendations = conn.get('recommendations', [])
                    for rec in recommendations:
                        st.write(f"• {rec}")
    
    def _render_analytics(self):
        """Render analytics tab"""
        
        st.header("📈 Connection Analytics")
        
        predictions_data = self._get_predictions_data()
        
        if not predictions_data or 'error' in predictions_data:
            st.warning("No prediction data available for analytics")
            return
        
        predictions = predictions_data.get('predictions', [])
        
        if not predictions:
            st.info("No connections to analyze")
            return
        
        df = pd.DataFrame(predictions)
        
        # Success probability distribution
        if 'ensemble_probability' in df.columns:
            fig_dist = px.histogram(
                df, 
                x='ensemble_probability',
                title="Success Probability Distribution",
                labels={'ensemble_probability': 'Success Probability'},
                nbins=20
            )
            st.plotly_chart(fig_dist, use_container_width=True)
        
        # Connection time vs success rate
        if 'connection_time_minutes' in df.columns and 'ensemble_probability' in df.columns:
            fig_scatter = px.scatter(
                df,
                x='connection_time_minutes',
                y='ensemble_probability',
                color='risk_level',
                title="Connection Time vs Success Probability",
                labels={
                    'connection_time_minutes': 'Connection Time (minutes)',
                    'ensemble_probability': 'Success Probability'
                }
            )
            st.plotly_chart(fig_scatter, use_container_width=True)
        
        # Terminal analysis
        if 'arrival_terminal' in df.columns and 'departure_terminal' in df.columns:
            # Terminal transfer analysis
            df['has_transfer'] = df['arrival_terminal'] != df['departure_terminal']
            transfer_analysis = df.groupby('has_transfer')['ensemble_probability'].agg(['mean', 'count']).reset_index()
            transfer_analysis['has_transfer'] = transfer_analysis['has_transfer'].map({True: 'Transfer Required', False: 'Same Terminal'})
            
            fig_terminal = px.bar(
                transfer_analysis,
                x='has_transfer',
                y='mean',
                title="Success Rate by Terminal Transfer Requirement",
                labels={'mean': 'Average Success Rate', 'has_transfer': 'Connection Type'}
            )
            st.plotly_chart(fig_terminal, use_container_width=True)
        
        # Route analysis
        col1, col2 = st.columns(2)
        
        with col1:
            if 'arrival_origin' in df.columns:
                origin_stats = df.groupby('arrival_origin')['ensemble_probability'].agg(['mean', 'count']).reset_index()
                origin_stats = origin_stats[origin_stats['count'] >= 2]  # Only show origins with 2+ connections
                
                fig_origin = px.bar(
                    origin_stats.sort_values('mean', ascending=True),
                    x='mean',
                    y='arrival_origin',
                    title="Success Rate by Origin Airport",
                    labels={'mean': 'Average Success Rate', 'arrival_origin': 'Origin Airport'}
                )
                st.plotly_chart(fig_origin, use_container_width=True)
        
        with col2:
            if 'departure_destination' in df.columns:
                dest_stats = df.groupby('departure_destination')['ensemble_probability'].agg(['mean', 'count']).reset_index()
                dest_stats = dest_stats[dest_stats['count'] >= 2]  # Only show destinations with 2+ connections
                
                fig_dest = px.bar(
                    dest_stats.sort_values('mean', ascending=True),
                    x='mean',
                    y='departure_destination',
                    title="Success Rate by Destination Airport",
                    labels={'mean': 'Average Success Rate', 'departure_destination': 'Destination Airport'}
                )
                st.plotly_chart(fig_dest, use_container_width=True)
    
    def _render_model_performance(self):
        """Render model performance tab"""
        
        st.header("🎯 Model Performance")
        
        # Load model metadata
        try:
            with open('heathrow_connection_training_report.json', 'r') as f:
                report = json.load(f)
            
            # Training summary
            st.subheader("📊 Training Summary")
            
            summary = report.get('training_summary', {})
            
            col1, col2, col3 = st.columns(3)
            
            with col1:
                st.metric("Training Samples", summary.get('training_samples', 'N/A'))
            
            with col2:
                st.metric("Test Samples", summary.get('test_samples', 'N/A'))
            
            with col3:
                st.metric("Features Used", summary.get('features_used', 'N/A'))
            
            # Model performance metrics
            st.subheader("📈 Model Performance Metrics")
            
            performance = report.get('model_performance', {})
            
            # Create performance comparison chart
            models = []
            mae_scores = []
            r2_scores = []
            
            for model_name, metrics in performance.items():
                if 'mae' in metrics:
                    models.append(model_name.replace('_', ' ').title())
                    mae_scores.append(metrics['mae'])
                    r2_scores.append(metrics.get('r2_score', 0))
            
            if models:
                fig_performance = make_subplots(
                    rows=1, cols=2,
                    subplot_titles=("Mean Absolute Error", "R² Score")
                )
                
                fig_performance.add_trace(
                    go.Bar(x=models, y=mae_scores, name="MAE"),
                    row=1, col=1
                )
                
                fig_performance.add_trace(
                    go.Bar(x=models, y=r2_scores, name="R²"),
                    row=1, col=2
                )
                
                fig_performance.update_layout(title="Model Performance Comparison")
                st.plotly_chart(fig_performance, use_container_width=True)
            
            # Feature importance
            st.subheader("🔍 Feature Importance")
            
            feature_importance = report.get('feature_importance', {})
            
            if feature_importance:
                # Show feature importance for best model
                best_model = report.get('model_selection', {}).get('best_probability_model', 'rf_probability')
                
                if best_model in feature_importance:
                    features = feature_importance[best_model][:15]  # Top 15 features
                    
                    feature_names = [f[0] for f in features]
                    importance_values = [f[1] for f in features]
                    
                    fig_importance = px.bar(
                        x=importance_values,
                        y=feature_names,
                        orientation='h',
                        title=f"Top 15 Features - {best_model.replace('_', ' ').title()}",
                        labels={'x': 'Importance', 'y': 'Feature'}
                    )
                    fig_importance.update_layout(yaxis={'categoryorder': 'total ascending'})
                    st.plotly_chart(fig_importance, use_container_width=True)
            
            # Recommendations
            st.subheader("💡 Model Recommendations")
            
            recommendations = report.get('recommendations', [])
            for rec in recommendations:
                st.write(f"• {rec}")
            
            # Training timestamp
            st.write(f"**Last trained:** {summary.get('timestamp', 'Unknown')}")
            
        except FileNotFoundError:
            st.warning("No model performance data available. Please train models first.")
    
    def _render_training_interface(self):
        """Render training interface tab"""
        
        st.header("⚙️ Model Training")
        
        st.write("Train new models with fresh FlightAware data:")
        
        col1, col2 = st.columns(2)
        
        with col1:
            use_fresh_data = st.checkbox("Use Fresh FlightAware Data", value=True)
            training_days = st.slider("Historical Days to Simulate", min_value=7, max_value=90, value=30)
        
        with col2:
            model_types = st.multiselect(
                "Model Types",
                ['Random Forest', 'Gradient Boosting', 'Classification'],
                default=['Random Forest', 'Gradient Boosting', 'Classification']
            )
        
        if st.button("🚀 Start Training"):
            with st.spinner("Training models... This may take several minutes."):
                try:
                    # Run training
                    trainer = HeathrowConnectionModelTrainer()
                    report = trainer.train_connection_models(use_fresh_data=use_fresh_data)
                    
                    st.success("✅ Training completed successfully!")
                    
                    # Show training results
                    st.subheader("📊 Training Results")
                    
                    col1, col2, col3 = st.columns(3)
                    
                    with col1:
                        st.metric("Models Trained", len(report['training_summary']['models_trained']))
                    
                    with col2:
                        st.metric("Training Samples", report['training_summary']['training_samples'])
                    
                    with col3:
                        st.metric("Features", report['training_summary']['features_used'])
                    
                    # Show performance
                    performance = report.get('model_performance', {})
                    for model_name, metrics in performance.items():
                        st.write(f"**{model_name.replace('_', ' ').title()}:**")
                        if 'mae' in metrics:
                            st.write(f"  • MAE: {metrics['mae']:.4f}")
                        if 'accuracy' in metrics:
                            st.write(f"  • Accuracy: {metrics['accuracy']:.1%}")
                    
                    # Reload models in predictor
                    self.predictor.models = {}  # Force reload
                    
                except Exception as e:
                    st.error(f"❌ Training failed: {str(e)}")
        
        # Model status
        st.subheader("📋 Current Model Status")
        
        model_loaded = self.predictor.load_models()
        
        if model_loaded:
            st.success("✅ Models loaded successfully")
            st.write(f"Available models: {', '.join(self.predictor.models.keys())}")
            st.write(f"Features: {len(self.predictor.feature_names)}")
        else:
            st.warning("⚠️ No trained models found")
    
    def _render_flight_data(self):
        """Render flight data tab"""
        
        st.header("📋 Raw Flight Data")
        
        # Get raw flight data
        fetcher = FlightAwareHeathrowFetcher()
        
        col1, col2 = st.columns(2)
        
        with col1:
            if st.button("🔄 Refresh Flight Data"):
                with st.spinner("Fetching fresh data from FlightAware..."):
                    flight_data = fetcher.get_connection_data()
                    st.session_state.flight_data = flight_data
        
        with col2:
            data_source = st.selectbox(
                "Data Source",
                ["Current Live Data", "Cached Data", "Simulated Data"]
            )
        
        # Display flight data
        if hasattr(st.session_state, 'flight_data'):
            flight_data = st.session_state.flight_data
        else:
            flight_data = fetcher.get_connection_data()
        
        if flight_data:
            # Arrivals
            st.subheader("✈️ Arrivals")
            arrivals = flight_data.get('arrivals', [])
            if arrivals:
                df_arrivals = pd.DataFrame(arrivals)
                st.dataframe(df_arrivals, use_container_width=True)
            else:
                st.info("No arrival data available")
            
            # Departures
            st.subheader("🛫 Departures")
            departures = flight_data.get('departures', [])
            if departures:
                df_departures = pd.DataFrame(departures)
                st.dataframe(df_departures, use_container_width=True)
            else:
                st.info("No departure data available")
            
            # Raw connection opportunities
            st.subheader("🔗 Connection Opportunities")
            connections = flight_data.get('connection_opportunities', [])
            if connections:
                df_connections = pd.DataFrame(connections)
                st.dataframe(df_connections, use_container_width=True)
            else:
                st.info("No connection opportunities found")
            
            # Data quality info
            st.subheader("📊 Data Quality")
            st.write(f"Data source: {flight_data.get('data_source', 'Unknown')}")
            st.write(f"Timestamp: {flight_data.get('data_timestamp', 'Unknown')}")
            st.write(f"Total arrivals: {len(arrivals)}")
            st.write(f"Total departures: {len(departures)}")
            st.write(f"Total connections: {len(connections)}")
    
    def _get_predictions_data(self):
        """Get current predictions data"""
        
        # Check cache first
        cached = self.predictor.get_cached_predictions()
        if cached:
            return cached
        
        # Generate fresh predictions
        try:
            predictions = self.predictor.predict_live_connections()
            st.session_state.predictions_data = predictions
            return predictions
        except Exception as e:
            st.error(f"Error generating predictions: {e}")
            return None
    
    def _refresh_data(self):
        """Refresh all data"""
        
        st.session_state.last_refresh = datetime.now()
        st.session_state.predictions_data = None
        self.predictor.predictions_cache = {}
        
        # Force fresh predictions
        try:
            predictions = self.predictor.predict_live_connections()
            st.session_state.predictions_data = predictions
        except Exception as e:
            st.error(f"Error refreshing data: {e}")
    
    def _check_api_status(self):
        """Check FlightAware API status"""
        
        try:
            fetcher = FlightAwareHeathrowFetcher()
            # Quick test - try to get arrivals
            test_data = fetcher.get_arrivals(max_results=1)
            return 'arrivals' in test_data or 'error' not in test_data
        except:
            return False

def main():
    """Run the Streamlit dashboard"""
    
    dashboard = HeathrowConnectionDashboard()
    
    # Auto-refresh logic
    if st.session_state.get('auto_refresh', False):
        time.sleep(0.1)  # Small delay to prevent excessive refreshing
        if (datetime.now() - st.session_state.last_refresh).seconds >= 30:
            dashboard._refresh_data()
            st.rerun()
    
    dashboard.run_dashboard()

if __name__ == "__main__":
    main()
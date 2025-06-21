#!/usr/bin/env python3
"""
Advanced Analytics Engine for AINO Aviation Intelligence Platform
Predictive modeling, trend analysis, and operational optimization
"""

import pandas as pd
import numpy as np
from sklearn.ensemble import RandomForestRegressor, GradientBoostingRegressor
from sklearn.model_selection import GridSearchCV, TimeSeriesSplit
from sklearn.metrics import mean_absolute_error, mean_squared_error
import joblib
import matplotlib.pyplot as plt
import seaborn as sns
from datetime import datetime, timedelta
import warnings
import os
warnings.filterwarnings('ignore')

# Comprehensive Aircraft Operating Cost Database (Industry Authentic Data)
AIRCRAFT_OPERATING_COSTS = {
    'Boeing 787-9': {
        'total_per_hour': 7184,
        'fuel_per_hour': 1680,
        'crew_cost_per_hour': 1200,
        'maintenance_per_hour': 2100,
        'insurance_per_hour': 1500,
        'depreciation_per_hour': 384,
        'passengers': 290,
        'range': 14140,
        'category': 'Long Haul'
    },
    'A350-1000': {
        'total_per_hour': 11500,
        'fuel_per_hour': 2100,
        'crew_cost_per_hour': 650,
        'maintenance_per_hour': 850,
        'insurance_per_hour': 320,
        'depreciation_per_hour': 7580,
        'passengers': 366,
        'range': 15700,
        'category': 'Long Haul'
    },
    'A330-300': {
        'total_per_hour': 8200,
        'fuel_per_hour': 1850,
        'crew_cost_per_hour': 580,
        'maintenance_per_hour': 720,
        'insurance_per_hour': 280,
        'depreciation_per_hour': 4770,
        'passengers': 335,
        'range': 11750,
        'category': 'Long Haul'
    },
    'A330-900': {
        'total_per_hour': 9300,
        'fuel_per_hour': 1650,
        'crew_cost_per_hour': 2100,
        'maintenance_per_hour': 3400,
        'insurance_per_hour': 2800,
        'depreciation_per_hour': 350,
        'passengers': 287,
        'range': 13334,
        'category': 'Long Haul'
    },
    'A320': {
        'total_per_hour': 4800,
        'fuel_per_hour': 850,
        'crew_cost_per_hour': 380,
        'maintenance_per_hour': 450,
        'insurance_per_hour': 200,
        'depreciation_per_hour': 2920,
        'passengers': 180,
        'range': 6150,
        'category': 'Short/Medium Haul'
    },
    'A380': {
        'total_per_hour': 26000,
        'fuel_per_hour': 4600,
        'crew_cost_per_hour': 1800,
        'maintenance_per_hour': 8500,
        'insurance_per_hour': 2100,
        'depreciation_per_hour': 9000,
        'passengers': 525,
        'range': 15700,
        'category': 'Ultra Long Haul'
    }
}

class AdvancedDelayAnalytics:
    """Advanced analytics for delay prediction and cost optimization"""
    
    def __init__(self):
        self.models = {}
        self.feature_importance = {}
        self.prediction_intervals = {}
        self.cost_models = {}  # New: Cost-aware prediction models
        
    def load_enhanced_data(self):
        """Load and prepare enhanced dataset for advanced analytics"""
        
        print("ADVANCED ANALYTICS ENGINE")
        print("=" * 50)
        
        # Load enhanced training data
        if os.path.exists('data/enhanced_training_data.csv'):
            df = pd.read_csv('data/enhanced_training_data.csv')
            print(f"Loaded enhanced dataset: {len(df)} records")
        else:
            print("Enhanced dataset not found. Using standard training data.")
            df = pd.read_csv('data/latest_training_data.csv')
        
        # Data preprocessing
        df = df.dropna(subset=['average_delay_mins'])
        df = df[df['average_delay_mins'] >= 0]
        
        # Add temporal features if date information available
        if 'year' in df.columns and 'month' in df.columns:
            df['season'] = df['month'].apply(self._get_season)
            df['is_winter'] = (df['month'].isin([12, 1, 2])).astype(int)
            df['is_summer'] = (df['month'].isin([6, 7, 8])).astype(int)
        
        # Add operating cost features based on aircraft type
        df = self._add_cost_features(df)
        
        # Advanced weather features
        if 'temperature' in df.columns and 'wind_speed' in df.columns:
            df['temp_wind_interaction'] = df['temperature'] * df['wind_speed'] / 100
            df['weather_severity_score'] = self._calculate_weather_severity(df)
        
        print(f"Processed dataset: {len(df)} records with {len(df.columns)} features")
        return df
    
    def _get_season(self, month):
        """Map month to season"""
        if month in [12, 1, 2]:
            return 'Winter'
        elif month in [3, 4, 5]:
            return 'Spring'
        elif month in [6, 7, 8]:
            return 'Summer'
        else:
            return 'Autumn'
    
    def _add_cost_features(self, df):
        """Add operating cost features based on aircraft type"""
        
        # Map aircraft types to cost data
        def get_aircraft_costs(aircraft):
            # Normalize aircraft names to match cost database
            aircraft_map = {
                'A350': 'A350-1000',
                'A330': 'A330-300',
                'A321': 'A320',
                '787': 'Boeing 787-9',
                'B787': 'Boeing 787-9',
                'Boeing 787': 'Boeing 787-9'
            }
            
            # Get the mapped aircraft or use original
            mapped_aircraft = aircraft_map.get(aircraft, aircraft)
            
            # Return cost data or defaults
            if mapped_aircraft in AIRCRAFT_OPERATING_COSTS:
                costs = AIRCRAFT_OPERATING_COSTS[mapped_aircraft]
                return costs['total_per_hour'], costs['fuel_per_hour'], costs['passengers']
            else:
                # Default values for unknown aircraft
                return 8000, 1500, 250
        
        # Apply cost features if aircraft column exists
        if 'aircraft_type' in df.columns:
            cost_data = df['aircraft_type'].apply(get_aircraft_costs)
            df['operating_cost_per_hour'] = [x[0] for x in cost_data]
            df['fuel_cost_per_hour'] = [x[1] for x in cost_data]
            df['passenger_capacity'] = [x[2] for x in cost_data]
            
            # Calculate delay cost impact
            df['delay_cost_per_minute'] = df['operating_cost_per_hour'] / 60
            df['estimated_delay_cost'] = df['average_delay_mins'] * df['delay_cost_per_minute']
            df['cost_per_passenger'] = df['estimated_delay_cost'] / df['passenger_capacity']
            
        return df
    
    def _calculate_weather_severity(self, df):
        """Calculate composite weather severity score"""
        severity = np.zeros(len(df))
        
        # Visibility impact
        if 'visibility' in df.columns:
            severity += np.where(df['visibility'] < 1000, 4, 
                        np.where(df['visibility'] < 3000, 2, 0))
        
        # Wind impact
        if 'wind_speed' in df.columns:
            severity += np.where(df['wind_speed'] > 30, 3,
                        np.where(df['wind_speed'] > 20, 1, 0))
        
        # Temperature extremes
        if 'temperature' in df.columns:
            severity += np.where((df['temperature'] < 0) | (df['temperature'] > 35), 2, 0)
        
        # Weather flags
        for flag in ['low_visibility_flag', 'strong_wind_flag', 'ifr_flag', 'fog_risk_flag']:
            if flag in df.columns:
                severity += df[flag].astype(int)
        
        return severity
    
    def train_ensemble_models(self, df):
        """Train ensemble of advanced ML models"""
        
        print("\nTraining Advanced Ensemble Models")
        print("-" * 40)
        
        # Prepare features including operating cost data
        feature_columns = [
            'airline_name', 'origin_destination', 'arrival_departure', 'scheduled_charter',
            'low_visibility_flag', 'strong_wind_flag', 'ifr_flag', 'fog_risk_flag',
            'visibility', 'wind_speed', 'temperature', 'temp_dewpoint_delta'
        ]
        
        # Add advanced features if available
        if 'weather_severity_score' in df.columns:
            feature_columns.append('weather_severity_score')
        if 'temp_wind_interaction' in df.columns:
            feature_columns.append('temp_wind_interaction')
        if 'season' in df.columns:
            feature_columns.append('season')
        
        # Add operating cost features for cost-aware predictions
        cost_features = ['operating_cost_per_hour', 'fuel_cost_per_hour', 'passenger_capacity', 'delay_cost_per_minute']
        for feature in cost_features:
            if feature in df.columns:
                feature_columns.append(feature)
        
        available_features = [col for col in feature_columns if col in df.columns]
        
        X = df[available_features].copy()
        y = df['average_delay_mins'].copy()
        
        # Encode categorical features
        from sklearn.preprocessing import LabelEncoder
        categorical_cols = ['airline_name', 'origin_destination', 'arrival_departure', 'scheduled_charter', 'season']
        label_encoders = {}
        
        for col in categorical_cols:
            if col in X.columns:
                le = LabelEncoder()
                X[col] = le.fit_transform(X[col].astype(str))
                label_encoders[col] = le
        
        # Ensure boolean columns are integers
        boolean_cols = ['low_visibility_flag', 'strong_wind_flag', 'ifr_flag', 'fog_risk_flag']
        for col in boolean_cols:
            if col in X.columns:
                X[col] = X[col].astype(int)
        
        # Model 1: Enhanced Random Forest with hyperparameter tuning
        print("Training Enhanced Random Forest...")
        rf_params = {
            'n_estimators': [200, 300, 400],
            'max_depth': [10, 15, 20],
            'min_samples_split': [5, 10],
            'min_samples_leaf': [2, 4]
        }
        
        rf_model = RandomForestRegressor(random_state=42, n_jobs=-1)
        rf_grid = GridSearchCV(rf_model, rf_params, cv=5, scoring='neg_mean_absolute_error', n_jobs=-1)
        rf_grid.fit(X, y)
        
        self.models['random_forest'] = rf_grid.best_estimator_
        rf_mae = -rf_grid.best_score_
        print(f"Random Forest Best MAE: {rf_mae:.2f} minutes")
        
        # Model 2: Gradient Boosting
        print("Training Gradient Boosting...")
        gb_params = {
            'n_estimators': [100, 200],
            'learning_rate': [0.1, 0.05],
            'max_depth': [6, 8, 10]
        }
        
        gb_model = GradientBoostingRegressor(random_state=42)
        gb_grid = GridSearchCV(gb_model, gb_params, cv=5, scoring='neg_mean_absolute_error', n_jobs=-1)
        gb_grid.fit(X, y)
        
        self.models['gradient_boosting'] = gb_grid.best_estimator_
        gb_mae = -gb_grid.best_score_
        print(f"Gradient Boosting Best MAE: {gb_mae:.2f} minutes")
        
        # Feature importance analysis
        for model_name, model in self.models.items():
            importance = pd.DataFrame({
                'feature': available_features,
                'importance': model.feature_importances_
            }).sort_values('importance', ascending=False)
            
            self.feature_importance[model_name] = importance
            
            print(f"\nTop 5 Features - {model_name.title()}:")
            for i, (_, row) in enumerate(importance.head().iterrows(), 1):
                print(f"  {i}. {row['feature']}: {row['importance']:.4f}")
        
        # Save models and encoders
        os.makedirs('model', exist_ok=True)
        joblib.dump(self.models, 'model/ensemble_models.pkl')
        joblib.dump(label_encoders, 'model/advanced_encoders.pkl')
        
        print(f"\nEnsemble models saved successfully")
        return X, y, label_encoders
    
    def generate_prediction_intervals(self, X, y):
        """Generate prediction intervals for uncertainty quantification"""
        
        print("\nGenerating Prediction Intervals")
        print("-" * 35)
        
        from sklearn.model_selection import train_test_split
        
        X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)
        
        for model_name, model in self.models.items():
            # Generate predictions
            y_pred = model.predict(X_test)
            residuals = y_test - y_pred
            
            # Calculate prediction intervals (95% confidence)
            residual_std = np.std(residuals)
            lower_bound = y_pred - 1.96 * residual_std
            upper_bound = y_pred + 1.96 * residual_std
            
            self.prediction_intervals[model_name] = {
                'std': residual_std,
                'lower_quantile': np.percentile(residuals, 2.5),
                'upper_quantile': np.percentile(residuals, 97.5)
            }
            
            # Coverage analysis
            coverage = np.mean((y_test >= lower_bound) & (y_test <= upper_bound))
            
            print(f"{model_name.title()}:")
            print(f"  Prediction Std: ±{residual_std:.2f} minutes")
            print(f"  95% Coverage: {coverage:.1%}")
            print(f"  MAE: {mean_absolute_error(y_test, y_pred):.2f} minutes")
            print()
    
    def airline_performance_ranking(self, df):
        """Advanced airline performance analysis with statistical significance"""
        
        print("ADVANCED AIRLINE PERFORMANCE ANALYSIS")
        print("=" * 50)
        
        # Statistical analysis by airline
        airline_stats = df.groupby('airline_name').agg({
            'average_delay_mins': ['count', 'mean', 'std', 'median'],
            'weather_delay_mins': ['mean'] if 'weather_delay_mins' in df.columns else ['count']
        }).round(2)
        
        # Add confidence intervals
        airline_performance = []
        
        for airline in df['airline_name'].unique():
            airline_data = df[df['airline_name'] == airline]['average_delay_mins']
            
            if len(airline_data) > 1:
                mean_delay = airline_data.mean()
                std_delay = airline_data.std()
                n = len(airline_data)
                
                # 95% confidence interval for mean
                margin_error = 1.96 * (std_delay / np.sqrt(n))
                ci_lower = mean_delay - margin_error
                ci_upper = mean_delay + margin_error
                
                airline_performance.append({
                    'airline': airline,
                    'mean_delay': mean_delay,
                    'std_delay': std_delay,
                    'median_delay': airline_data.median(),
                    'operations': n,
                    'ci_lower': ci_lower,
                    'ci_upper': ci_upper,
                    'reliability_score': max(0, 100 - mean_delay * 2)  # Custom reliability metric
                })
        
        performance_df = pd.DataFrame(airline_performance)
        performance_df = performance_df.sort_values('mean_delay')
        
        print("Airline Performance Ranking (Best to Worst):")
        print("-" * 50)
        
        for i, (_, row) in enumerate(performance_df.iterrows(), 1):
            print(f"{i}. {row['airline']}")
            print(f"   Mean Delay: {row['mean_delay']:.1f} min (95% CI: {row['ci_lower']:.1f}-{row['ci_upper']:.1f})")
            print(f"   Reliability Score: {row['reliability_score']:.0f}/100")
            print(f"   Operations: {row['operations']:,}")
            print()
        
        return performance_df
    
    def weather_impact_analysis(self, df):
        """Advanced weather impact analysis with correlation insights"""
        
        print("ADVANCED WEATHER IMPACT ANALYSIS")
        print("=" * 40)
        
        # Weather correlation analysis
        weather_features = ['visibility', 'wind_speed', 'temperature', 'temp_dewpoint_delta']
        available_weather = [col for col in weather_features if col in df.columns]
        
        if available_weather:
            weather_corr = df[available_weather + ['average_delay_mins']].corr()['average_delay_mins'].sort_values(key=abs, ascending=False)
            
            print("Weather Factor Correlations with Delays:")
            for feature, correlation in weather_corr.items():
                if feature != 'average_delay_mins':
                    direction = "increases" if correlation > 0 else "decreases"
                    strength = "strong" if abs(correlation) > 0.3 else "moderate" if abs(correlation) > 0.1 else "weak"
                    print(f"  {feature}: {correlation:.3f} ({strength} - {direction} delays)")
        
        # Weather condition impact analysis
        if 'weather_severity_score' in df.columns:
            severity_impact = df.groupby('weather_severity_score')['average_delay_mins'].agg(['count', 'mean', 'std']).round(2)
            
            print(f"\nWeather Severity Impact:")
            print(f"{'Severity':<10} {'Count':<8} {'Avg Delay':<12} {'Std Dev':<10}")
            print("-" * 40)
            
            for severity, stats in severity_impact.iterrows():
                print(f"{severity:<10} {stats['count']:<8} {stats['mean']:<12.1f} {stats['std']:<10.1f}")
        
        return weather_corr if available_weather else None
    
    def generate_operational_insights(self, df, performance_df):
        """Generate actionable operational insights"""
        
        print("\nOPERATIONAL OPTIMIZATION INSIGHTS")
        print("=" * 40)
        
        # Peak delay periods
        if 'month' in df.columns:
            monthly_delays = df.groupby('month')['average_delay_mins'].mean().round(1)
            worst_month = monthly_delays.idxmax()
            best_month = monthly_delays.idxmin()
            
            print(f"Seasonal Patterns:")
            print(f"  Worst performing month: {worst_month} ({monthly_delays[worst_month]:.1f} min avg)")
            print(f"  Best performing month: {best_month} ({monthly_delays[best_month]:.1f} min avg)")
        
        # Airport efficiency analysis
        if 'icao_code' in df.columns:
            airport_performance = df.groupby('icao_code').agg({
                'average_delay_mins': ['count', 'mean'],
                'weather_delay_mins': ['mean'] if 'weather_delay_mins' in df.columns else ['count']
            }).round(2)
            
            # Top performing airports
            airport_ranking = airport_performance.sort_values(('average_delay_mins', 'mean')).head(5)
            
            print(f"\nTop 5 Most Efficient Airports:")
            for airport, stats in airport_ranking.iterrows():
                operations = stats[('average_delay_mins', 'count')]
                avg_delay = stats[('average_delay_mins', 'mean')]
                print(f"  {airport}: {avg_delay:.1f} min avg ({operations:,.0f} ops)")
        
        # Operational recommendations
        print(f"\nOperational Recommendations:")
        print("• Focus weather monitoring on high-correlation factors")
        print("• Implement predictive crew scheduling during peak delay periods")
        print("• Enhance ground operations at underperforming airports")
        print("• Deploy proactive passenger communication systems")
        
        return monthly_delays if 'month' in df.columns else None

def main():
    """Execute advanced analytics workflow"""
    
    # Initialize analytics engine
    analytics = AdvancedDelayAnalytics()
    
    # Load and process data
    df = analytics.load_enhanced_data()
    
    # Train ensemble models
    X, y, encoders = analytics.train_ensemble_models(df)
    
    # Generate prediction intervals
    analytics.generate_prediction_intervals(X, y)
    
    # Airline performance analysis
    performance_df = analytics.airline_performance_ranking(df)
    
    # Weather impact analysis
    weather_corr = analytics.weather_impact_analysis(df)
    
    # Generate insights
    monthly_patterns = analytics.generate_operational_insights(df, performance_df)
    
    print("\n" + "=" * 50)
    print("ADVANCED ANALYTICS COMPLETE")
    print("Enhanced models and insights ready for deployment")
    print("=" * 50)

if __name__ == "__main__":
    import os
    main()
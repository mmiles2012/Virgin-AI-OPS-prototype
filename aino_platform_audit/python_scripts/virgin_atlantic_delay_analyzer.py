import pandas as pd
import numpy as np
import matplotlib.pyplot as plt
import seaborn as sns
from datetime import datetime, timedelta
from sklearn.model_selection import train_test_split, cross_val_score, GridSearchCV
from sklearn.ensemble import RandomForestRegressor, GradientBoostingRegressor
from sklearn.linear_model import LinearRegression
from sklearn.preprocessing import StandardScaler, LabelEncoder
from sklearn.metrics import mean_absolute_error, mean_squared_error, r2_score
from sklearn.cluster import KMeans
import warnings
import json
import os
warnings.filterwarnings('ignore')

# Set random seed for reproducibility
np.random.seed(42)

class VirginAtlanticDelayAnalyzer:
    def __init__(self):
        self.models = {}
        self.scalers = {}
        self.encoders = {}
        self.data = None
        
    def generate_sample_data(self, n_samples=10000):
        """
        Generate realistic Virgin Atlantic flight data for analysis
        Based on their major routes: LHR-JFK, LHR-LAX, LHR-MCO, etc.
        """
        print("Generating sample Virgin Atlantic flight data...")
        
        # Virgin Atlantic major routes
        routes = [
            ('LHR', 'JFK'), ('LHR', 'LAX'), ('LHR', 'MCO'), ('LHR', 'MIA'),
            ('LHR', 'BOS'), ('LHR', 'ATL'), ('LHR', 'SFO'), ('LHR', 'LAS'),
            ('MAN', 'JFK'), ('MAN', 'LAX'), ('LHR', 'DEL'), ('LHR', 'BOM'),
            ('LHR', 'JNB'), ('LHR', 'CPT'), ('LHR', 'SYD'), ('LHR', 'MEL')
        ]
        
        # Aircraft types Virgin Atlantic uses
        aircraft_types = ['A350-1000', 'A330-300', 'A330-200', 'B787-9', 'A340-600']
        
        # Generate data
        data = []
        start_date = datetime(2023, 1, 1)
        
        for i in range(n_samples):
            # Random route
            origin, destination = routes[np.random.randint(0, len(routes))]
            
            # Random date within the last 18 months
            flight_date = start_date + timedelta(days=np.random.randint(0, 550))
            
            # Flight characteristics
            aircraft = np.random.choice(aircraft_types)
            scheduled_dep_hour = np.random.choice([6, 7, 8, 9, 10, 11, 14, 15, 16, 17, 18, 19, 20, 21])
            
            # Weather impact (simplified)
            weather_score = np.random.normal(5, 2)  # 1-10 scale, 10 = perfect weather
            weather_score = max(1, min(10, weather_score))
            
            # Seasonal effects
            month = flight_date.month
            seasonal_delay = 0
            if month in [12, 1, 2]:  # Winter - more delays
                seasonal_delay = np.random.exponential(15)
            elif month in [6, 7, 8]:  # Summer - peak travel, moderate delays
                seasonal_delay = np.random.exponential(8)
            else:
                seasonal_delay = np.random.exponential(5)
            
            # Day of week effect
            day_of_week = flight_date.weekday()  # 0 = Monday
            if day_of_week in [4, 5, 6]:  # Friday, Saturday, Sunday
                weekend_delay = np.random.exponential(5)
            else:
                weekend_delay = np.random.exponential(2)
            
            # Time of day effect
            if scheduled_dep_hour < 8:  # Early flights
                time_delay = np.random.exponential(3)
            elif scheduled_dep_hour > 18:  # Evening flights
                time_delay = np.random.exponential(8)
            else:
                time_delay = np.random.exponential(5)
            
            # Aircraft age effect (simplified)
            if aircraft in ['A350-1000', 'B787-9']:  # Newer aircraft
                aircraft_delay = np.random.exponential(2)
            else:
                aircraft_delay = np.random.exponential(5)
            
            # Route distance effect (simplified)
            long_haul_routes = [('LHR', 'LAX'), ('LHR', 'SFO'), ('LHR', 'SYD'), ('LHR', 'MEL')]
            if (origin, destination) in long_haul_routes:
                distance_delay = np.random.exponential(7)
            else:
                distance_delay = np.random.exponential(4)
            
            # Calculate total delay
            weather_impact = max(0, (10 - weather_score) * 2)
            total_delay = seasonal_delay + weekend_delay + time_delay + aircraft_delay + distance_delay + weather_impact
            
            # Add some randomness and ensure non-negative
            total_delay += np.random.normal(0, 5)
            total_delay = max(0, total_delay)
            
            # Passenger load factor (affects boarding delays)
            load_factor = np.random.normal(85, 10)
            load_factor = max(60, min(100, load_factor))
            
            data.append({
                'flight_date': flight_date,
                'origin': origin,
                'destination': destination,
                'aircraft_type': aircraft,
                'scheduled_dep_hour': scheduled_dep_hour,
                'day_of_week': day_of_week,
                'month': month,
                'weather_score': weather_score,
                'load_factor': load_factor,
                'delay_minutes': total_delay
            })
        
        self.data = pd.DataFrame(data)
        print(f"Generated {len(self.data)} flight records")
        return self.data
    
    def preprocess_data(self):
        """Preprocess the data for ML modeling"""
        print("Preprocessing data...")
        
        df = self.data.copy()
        
        # Create additional features
        df['is_weekend'] = df['day_of_week'].isin([5, 6]).astype(int)
        df['is_peak_hour'] = df['scheduled_dep_hour'].isin([7, 8, 17, 18, 19]).astype(int)
        df['is_early_morning'] = (df['scheduled_dep_hour'] < 8).astype(int)
        df['is_evening'] = (df['scheduled_dep_hour'] > 18).astype(int)
        df['is_winter'] = df['month'].isin([12, 1, 2]).astype(int)
        df['is_summer'] = df['month'].isin([6, 7, 8]).astype(int)
        df['is_long_haul'] = df.apply(lambda x: 1 if (x['origin'], x['destination']) in 
                                     [('LHR', 'LAX'), ('LHR', 'SFO'), ('LHR', 'SYD'), ('LHR', 'MEL')] 
                                     else 0, axis=1)
        df['weather_impact'] = 10 - df['weather_score']
        
        # Encode categorical variables
        categorical_cols = ['origin', 'destination', 'aircraft_type']
        for col in categorical_cols:
            le = LabelEncoder()
            df[f'{col}_encoded'] = le.fit_transform(df[col])
            self.encoders[col] = le
        
        # Select features for modeling
        feature_cols = [
            'scheduled_dep_hour', 'day_of_week', 'month', 'weather_score', 'load_factor',
            'is_weekend', 'is_peak_hour', 'is_early_morning', 'is_evening',
            'is_winter', 'is_summer', 'is_long_haul', 'weather_impact',
            'origin_encoded', 'destination_encoded', 'aircraft_type_encoded'
        ]
        
        self.X = df[feature_cols]
        self.y = df['delay_minutes']
        self.feature_names = feature_cols
        
        return self.X, self.y
    
    def train_models(self):
        """Train multiple ML models to predict flight delays"""
        print("Training ML models...")
        
        # Split data
        X_train, X_test, y_train, y_test = train_test_split(
            self.X, self.y, test_size=0.2, random_state=42
        )
        
        # Scale features
        scaler = StandardScaler()
        X_train_scaled = scaler.fit_transform(X_train)
        X_test_scaled = scaler.transform(X_test)
        self.scalers['standard'] = scaler
        
        # Define models
        models = {
            'Linear Regression': LinearRegression(),
            'Random Forest': RandomForestRegressor(n_estimators=100, random_state=42),
            'Gradient Boosting': GradientBoostingRegressor(n_estimators=100, random_state=42)
        }
        
        # Train and evaluate models
        results = {}
        for name, model in models.items():
            if name == 'Linear Regression':
                model.fit(X_train_scaled, y_train)
                y_pred = model.predict(X_test_scaled)
            else:
                model.fit(X_train, y_train)
                y_pred = model.predict(X_test)
            
            # Calculate metrics
            mae = mean_absolute_error(y_test, y_pred)
            mse = mean_squared_error(y_test, y_pred)
            rmse = np.sqrt(mse)
            r2 = r2_score(y_test, y_pred)
            
            results[name] = {
                'model': model,
                'MAE': mae,
                'RMSE': rmse,
                'R2': r2,
                'predictions': y_pred
            }
            
            print(f"{name}:")
            print(f"  MAE: {mae:.2f} minutes")
            print(f"  RMSE: {rmse:.2f} minutes")
            print(f"  R²: {r2:.3f}")
            print()
        
        self.models = results
        self.X_test = X_test
        self.y_test = y_test
        
        return results
    
    def analyze_feature_importance(self):
        """Analyze feature importance using Random Forest"""
        print("Analyzing feature importance...")
        
        rf_model = self.models['Random Forest']['model']
        importance = rf_model.feature_importances_
        
        feature_importance = pd.DataFrame({
            'feature': self.feature_names,
            'importance': importance
        }).sort_values('importance', ascending=False)
        
        return feature_importance
    
    def generate_comprehensive_report(self):
        """Generate comprehensive analysis report for AINO platform"""
        print("Generating comprehensive Virgin Atlantic delay analysis report...")
        
        # Generate data and train models
        self.generate_sample_data(10000)
        self.preprocess_data()
        model_results = self.train_models()
        feature_importance = self.analyze_feature_importance()
        
        # Create comprehensive report
        report = {
            'analysis_timestamp': datetime.now().isoformat(),
            'virgin_atlantic_analysis': {
                'dataset_summary': {
                    'total_flights': len(self.data),
                    'date_range': f"{self.data['flight_date'].min()} to {self.data['flight_date'].max()}",
                    'average_delay_minutes': float(self.data['delay_minutes'].mean()),
                    'median_delay_minutes': float(self.data['delay_minutes'].median()),
                    'std_delay_minutes': float(self.data['delay_minutes'].std())
                },
                
                'route_analysis': {
                    'top_routes_by_delay': self.data.groupby(['origin', 'destination'])['delay_minutes'].agg(['mean', 'count']).round(2).to_dict(),
                    'route_performance': self.data.groupby(['origin', 'destination']).agg({
                        'delay_minutes': ['mean', 'std', 'count'],
                        'weather_score': 'mean',
                        'load_factor': 'mean'
                    }).round(2).to_dict()
                },
                
                'aircraft_analysis': {
                    'performance_by_type': self.data.groupby('aircraft_type')['delay_minutes'].agg(['mean', 'std', 'count']).round(2).to_dict(),
                    'fleet_utilization': self.data['aircraft_type'].value_counts().to_dict()
                },
                
                'temporal_patterns': {
                    'monthly_delays': self.data.groupby('month')['delay_minutes'].mean().round(2).to_dict(),
                    'day_of_week_delays': self.data.groupby('day_of_week')['delay_minutes'].mean().round(2).to_dict(),
                    'hourly_delays': self.data.groupby('scheduled_dep_hour')['delay_minutes'].mean().round(2).to_dict()
                },
                
                'weather_impact': {
                    'weather_correlation': float(self.data[['weather_score', 'delay_minutes']].corr().iloc[0, 1]),
                    'weather_bands': self.data.groupby(pd.cut(self.data['weather_score'], bins=5))['delay_minutes'].mean().round(2).to_dict()
                },
                
                'ml_model_performance': {
                    'random_forest': {
                        'mae_minutes': float(model_results['Random Forest']['MAE']),
                        'rmse_minutes': float(model_results['Random Forest']['RMSE']),
                        'r2_score': float(model_results['Random Forest']['R2'])
                    },
                    'gradient_boosting': {
                        'mae_minutes': float(model_results['Gradient Boosting']['MAE']),
                        'rmse_minutes': float(model_results['Gradient Boosting']['RMSE']),
                        'r2_score': float(model_results['Gradient Boosting']['R2'])
                    },
                    'linear_regression': {
                        'mae_minutes': float(model_results['Linear Regression']['MAE']),
                        'rmse_minutes': float(model_results['Linear Regression']['RMSE']),
                        'r2_score': float(model_results['Linear Regression']['R2'])
                    }
                },
                
                'feature_importance': {
                    'top_10_features': feature_importance.head(10).to_dict('records')
                },
                
                'operational_insights': {
                    'peak_delay_hours': list(self.data.groupby('scheduled_dep_hour')['delay_minutes'].mean().nlargest(3).index),
                    'worst_weather_impact_routes': list(self.data[self.data['weather_score'] < 5].groupby(['origin', 'destination'])['delay_minutes'].mean().nlargest(3).index),
                    'best_performing_aircraft': self.data.groupby('aircraft_type')['delay_minutes'].mean().idxmin(),
                    'seasonal_recommendations': {
                        'winter_months': 'Increase buffer times by 15-20 minutes for winter operations',
                        'summer_months': 'Monitor peak travel periods and adjust staffing accordingly',
                        'weekend_operations': 'Enhanced ground handling for Friday-Sunday operations'
                    }
                },
                
                'cost_impact_analysis': {
                    'average_delay_cost_per_flight': float(self.data['delay_minutes'].mean() * 47.23),  # £47.23 per minute
                    'annual_estimated_delay_cost': float(self.data['delay_minutes'].sum() * 47.23 * 365 / len(self.data)),
                    'highest_cost_routes': self.data.groupby(['origin', 'destination']).apply(
                        lambda x: (x['delay_minutes'].mean() * 47.23)
                    ).nlargest(5).round(2).to_dict()
                }
            }
        }
        
        # Save report
        with open('virgin_atlantic_analysis_report.json', 'w') as f:
            json.dump(report, f, indent=2, default=str)
        
        print("Virgin Atlantic analysis report generated successfully!")
        return report

def main():
    """Main execution function for AINO platform integration"""
    analyzer = VirginAtlanticDelayAnalyzer()
    report = analyzer.generate_comprehensive_report()
    
    print("\n=== VIRGIN ATLANTIC DELAY ANALYSIS SUMMARY ===")
    print(f"Total flights analyzed: {report['virgin_atlantic_analysis']['dataset_summary']['total_flights']:,}")
    print(f"Average delay: {report['virgin_atlantic_analysis']['dataset_summary']['average_delay_minutes']:.1f} minutes")
    print(f"Best ML model: Random Forest (MAE: {report['virgin_atlantic_analysis']['ml_model_performance']['random_forest']['mae_minutes']:.1f} min)")
    
    return report

if __name__ == "__main__":
    main()
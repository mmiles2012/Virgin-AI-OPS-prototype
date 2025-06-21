import joblib
import pandas as pd
import matplotlib.pyplot as plt
import numpy as np
import os
from utils.train_model import MODEL_PATH


def plot_feature_importance():
    """Plot feature importance from trained Random Forest model"""
    
    if not os.path.exists(MODEL_PATH):
        print("No trained model found. Run train_model first.")
        return
    
    try:
        # Load the trained model
        model = joblib.load(MODEL_PATH)
        preprocessor = model.named_steps['preprocessor']
        regressor = model.named_steps['regressor']
        
        # Get feature names from preprocessor
        feature_names = []
        
        # Handle different transformer types
        for name, transformer, features in preprocessor.transformers_:
            if name == 'cat' and hasattr(transformer, 'get_feature_names_out'):
                # Categorical features (one-hot encoded)
                cat_names = transformer.get_feature_names_out(features)
                feature_names.extend(cat_names)
            elif name in ['bool', 'num']:
                # Boolean and numeric features
                feature_names.extend(features)
        
        # Get feature importances
        importances = regressor.feature_importances_
        
        # Sort features by importance
        if len(feature_names) == len(importances):
            feature_importance_df = pd.DataFrame({
                'feature': feature_names,
                'importance': importances
            }).sort_values('importance', ascending=False)
        else:
            # Fallback if feature names don't match
            feature_importance_df = pd.DataFrame({
                'feature': [f'Feature_{i}' for i in range(len(importances))],
                'importance': importances
            }).sort_values('importance', ascending=False)
        
        # Plot top 15 features
        top_features = feature_importance_df.head(15)
        
        plt.figure(figsize=(12, 8))
        plt.barh(range(len(top_features)), top_features['importance'][::-1], align='center')
        plt.yticks(range(len(top_features)), top_features['feature'][::-1])
        plt.xlabel("Feature Importance")
        plt.title("Top 15 Feature Importances - Weather-Enhanced Delay Prediction")
        plt.tight_layout()
        
        # Save plot
        plt.savefig("feature_importance.png", dpi=300, bbox_inches='tight')
        plt.close()
        
        print("✓ Feature importance plot saved as feature_importance.png")
        
        # Print top features
        print("\nTop 10 Most Important Features:")
        print("-" * 50)
        for i, (_, row) in enumerate(top_features.head(10).iterrows(), 1):
            print(f"{i:2d}. {row['feature']:<30} {row['importance']:.4f}")
        
        return feature_importance_df
        
    except Exception as e:
        print(f"Error plotting feature importance: {e}")
        return None


def plot_weather_impact():
    """Plot weather conditions impact on delays"""
    
    data_path = "data/latest_training_data.csv"
    if not os.path.exists(data_path):
        print("No training data found.")
        return
    
    try:
        df = pd.read_csv(data_path)
        
        # Create weather impact comparison
        fig, axes = plt.subplots(2, 2, figsize=(15, 10))
        fig.suptitle('Weather Impact on Flight Delays', fontsize=16)
        
        # 1. Visibility impact
        if 'low_visibility_flag' in df.columns and 'average_delay_mins' in df.columns:
            visibility_delays = df.groupby('low_visibility_flag')['average_delay_mins'].mean()
            axes[0, 0].bar(['Good Visibility', 'Low Visibility'], 
                          [visibility_delays.get(False, 0), visibility_delays.get(True, 0)],
                          color=['green', 'red'])
            axes[0, 0].set_title('Average Delay by Visibility')
            axes[0, 0].set_ylabel('Delay (minutes)')
        
        # 2. Wind impact
        if 'strong_wind_flag' in df.columns:
            wind_delays = df.groupby('strong_wind_flag')['average_delay_mins'].mean()
            axes[0, 1].bar(['Normal Wind', 'Strong Wind'], 
                          [wind_delays.get(False, 0), wind_delays.get(True, 0)],
                          color=['blue', 'orange'])
            axes[0, 1].set_title('Average Delay by Wind Conditions')
            axes[0, 1].set_ylabel('Delay (minutes)')
        
        # 3. Flight rules impact
        if 'ifr_flag' in df.columns:
            ifr_delays = df.groupby('ifr_flag')['average_delay_mins'].mean()
            axes[1, 0].bar(['VFR', 'IFR'], 
                          [ifr_delays.get(False, 0), ifr_delays.get(True, 0)],
                          color=['lightgreen', 'darkred'])
            axes[1, 0].set_title('Average Delay by Flight Rules')
            axes[1, 0].set_ylabel('Delay (minutes)')
        
        # 4. Fog risk impact
        if 'fog_risk_flag' in df.columns:
            fog_delays = df.groupby('fog_risk_flag')['average_delay_mins'].mean()
            axes[1, 1].bar(['No Fog Risk', 'Fog Risk'], 
                          [fog_delays.get(False, 0), fog_delays.get(True, 0)],
                          color=['lightblue', 'purple'])
            axes[1, 1].set_title('Average Delay by Fog Risk')
            axes[1, 1].set_ylabel('Delay (minutes)')
        
        plt.tight_layout()
        plt.savefig("weather_impact_analysis.png", dpi=300, bbox_inches='tight')
        plt.close()
        
        print("✓ Weather impact analysis saved as weather_impact_analysis.png")
        
    except Exception as e:
        print(f"Error plotting weather impact: {e}")


if __name__ == "__main__":
    plot_feature_importance()
    plot_weather_impact()
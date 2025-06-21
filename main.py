from utils.fetch_weather import fetch_and_save_weather_data
from utils.train_model import train_and_save_model
from utils.plot_features import plot_feature_importance

if __name__ == "__main__":
    print("1. Fetching weather data...")
    fetch_and_save_weather_data()

    print("2. Training model with updated data...")
    train_and_save_model()

    print("3. Plotting feature importances...")
    plot_feature_importance()

    print("✅ Done!")
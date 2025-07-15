
# scheduler.py
import time
from faa_nas_scraper import scrape_faa_nas_status
from feature_engineering import create_features
from model_train import train_model
import pandas as pd

def run_scheduler(interval_minutes=60):
    while True:
        print("Running scheduled update...")
        df = scrape_faa_nas_status()
        df.to_csv("faa_nas_events.csv", index=False)
        train_model()
        print("Model retrained. Sleeping for {} minutes...".format(interval_minutes))
        time.sleep(interval_minutes * 60)

if __name__ == "__main__":
    run_scheduler()

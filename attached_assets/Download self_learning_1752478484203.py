
import pandas as pd
import os
from delay_predictor import train_model

LOG_CSV = "logs/ops_simulation_log.csv"
ARCHIVE_FOLDER = "logs/archive"

def archive_logs():
    os.makedirs(ARCHIVE_FOLDER, exist_ok=True)
    if not os.path.exists(LOG_CSV):
        print("No log file found to archive.")
        return

    df = pd.read_csv(LOG_CSV)
    if df.empty:
        print("Log file is empty, nothing to archive.")
        return

    archive_file = os.path.join(ARCHIVE_FOLDER, f"sim_log_archive_{pd.Timestamp.now().date()}.csv")
    df.to_csv(archive_file, index=False)
    print(f"Archived logs to {archive_file}")

def retrain_model():
    if not os.path.exists(LOG_CSV):
        raise FileNotFoundError("Missing ops_simulation_log.csv for training.")
    train_model(LOG_CSV)
    print("Model retrained from latest logs.")

def self_learn_cycle():
    archive_logs()
    retrain_model()
    print("Self-learning cycle complete.")

if __name__ == "__main__":
    self_learn_cycle()

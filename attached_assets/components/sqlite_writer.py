
import sqlite3
import pandas as pd

def save_to_sqlite(df, db_path="data/holding_history.db"):
    conn = sqlite3.connect(db_path)
    df.to_sql("holding_events", conn, if_exists="append", index=False)
    conn.close()

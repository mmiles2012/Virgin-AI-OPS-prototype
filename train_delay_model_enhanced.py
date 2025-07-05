import pandas as pd
from metar_scheduler import run_metar_update
from metar_enrichment import parse_metar_file, enrich_with_metar
from sklearn.ensemble import RandomForestClassifier
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import LabelEncoder
from sklearn.metrics import classification_report

# Step 1: Run monthly METAR update if needed
run_metar_update()

# Step 2: Load delay data (you can change this path to your dataset)
delay_df = pd.read_csv("data/ML_Delay_Data.csv")  # your ML-ready delay dataset

# Step 3: Load and enrich with METAR data
metar_df = pd.DataFrame()
for airport in ["JFK", "BOS", "ATL", "LAX", "SFO", "MCO", "MIA", "TPA", "LAS"]:
    path = f"data/metar/{airport}_202507_METAR.txt"  # example: current month file
    try:
        part = parse_metar_file(path)
        metar_df = pd.concat([metar_df, part])
    except FileNotFoundError:
        print(f"No METAR file found for {airport}")

df = enrich_with_metar(delay_df, metar_df)

# Step 4: Prepare for model training
df.dropna(subset=["delay_risk_category"], inplace=True)
X = df.select_dtypes(include=["number"])
y = df["delay_risk_category"]

le = LabelEncoder()
y_encoded = le.fit_transform(y)

X_train, X_test, y_train, y_test = train_test_split(X, y_encoded, test_size=0.3, random_state=42)

# Step 5: Train and evaluate model
model = RandomForestClassifier(n_estimators=100, random_state=42)
model.fit(X_train, y_train)
preds = model.predict(X_test)

print(classification_report(y_test, preds, target_names=le.classes_))
"""
SmartPark AI - Machine Learning Model Training Pipeline
Trains a multi-output RandomForestRegressor to predict parking occupancy at:
- 30 minutes
- 60 minutes
- 90 minutes

Pipeline steps:
1. Load dataset
2. Clean data
3. Feature engineering
4. Train/test split
5. Train RandomForestRegressor
6. Evaluate using MAE and R2
7. Save trained model & metadata with joblib
"""

import os
import joblib
import numpy as np
import pandas as pd
from datetime import datetime
from sklearn.model_selection import train_test_split
from sklearn.ensemble import RandomForestRegressor
from sklearn.metrics import mean_absolute_error, r2_score

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
DATASET_PATH = os.path.join(BASE_DIR, "dataset.csv")
MODEL_PATH = os.path.join(BASE_DIR, "model.joblib")

def load_data(file_path: str) -> pd.DataFrame:
    """1. Load dataset"""
    if not os.path.exists(file_path):
        raise FileNotFoundError(f"Dataset not found at {file_path}. Run generate_dataset.py first.")
    df = pd.read_csv(file_path)
    print(f"[1/7] Loaded dataset from {file_path} with {len(df)} records and {df.shape[1]} columns.")
    return df

def clean_data(df: pd.DataFrame) -> pd.DataFrame:
    """2. Clean data: handle nulls, clip bounds, validate ranges"""
    initial_len = len(df)
    # Remove nulls if any
    df = df.dropna()
    
    # Ensure hour is within [0, 23]
    df = df[(df["hour"] >= 0) & (df["hour"] <= 23)]
    # Ensure day_of_week is within [0, 6]
    df = df[(df["day_of_week"] >= 0) & (df["day_of_week"] <= 6)]
    # Ensure total_slots > 0
    df = df[df["total_slots"] > 0]
    # Ensure occupied_slots <= total_slots
    df["occupied_slots"] = df["occupied_slots"].clip(lower=0)
    df["occupied_slots"] = np.minimum(df["occupied_slots"], df["total_slots"])
    
    # Clip future targets
    for col in ["occupied_30m", "occupied_60m", "occupied_90m"]:
        if col in df.columns:
            df[col] = df[col].clip(lower=0)
            df[col] = np.minimum(df[col], df["total_slots"])
            
    print(f"[2/7] Cleaned dataset. Retained {len(df)} of {initial_len} rows.")
    return df

def build_features(df: pd.DataFrame, facility_encoder: dict = None) -> tuple:
    """
    3. Feature engineering:
    - Cyclical hour encoding (sin_hour, cos_hour)
    - Cyclical day encoding (sin_day, cos_day)
    - Weekend flag
    - Rush hour flag (morning commute 8-10, evening 17-20)
    - Current occupancy ratio
    - Historical occupancy ratio
    - Occupancy delta from historical
    - Facility categorical encoding
    """
    df = df.copy()
    
    # Facility mapping
    if facility_encoder is None:
        unique_facilities = sorted(df["parking_id"].unique())
        facility_encoder = {pid: idx for idx, pid in enumerate(unique_facilities)}
        
    df["facility_code"] = df["parking_id"].map(lambda x: facility_encoder.get(str(x), -1))
    
    # Cyclical time features
    df["sin_hour"] = np.sin(2 * np.pi * df["hour"] / 24.0)
    df["cos_hour"] = np.cos(2 * np.pi * df["hour"] / 24.0)
    df["sin_day"] = np.sin(2 * np.pi * df["day_of_week"] / 7.0)
    df["cos_day"] = np.cos(2 * np.pi * df["day_of_week"] / 7.0)
    
    # Calendar & Behavioral Flags
    df["is_weekend"] = (df["day_of_week"] >= 5).astype(int)
    df["rush_hour"] = (((df["hour"] >= 8) & (df["hour"] <= 10)) | 
                       ((df["hour"] >= 17) & (df["hour"] <= 20))).astype(int)
    
    # Occupancy Ratios & Dynamics
    # Support both 'occupied_slots' and 'current_occupied'
    occ_col = "occupied_slots" if "occupied_slots" in df.columns else "current_occupied"
    df["occupancy_ratio"] = df[occ_col] / np.maximum(df["total_slots"], 1.0)
    df["historical_ratio"] = df["historical_occupancy"] / np.maximum(df["total_slots"], 1.0)
    df["occupancy_delta"] = df[occ_col] - df["historical_occupancy"]
    
    feature_cols = [
        "facility_code",
        "hour",
        "day_of_week",
        "total_slots",
        occ_col,
        "historical_occupancy",
        "sin_hour",
        "cos_hour",
        "sin_day",
        "cos_day",
        "is_weekend",
        "rush_hour",
        "occupancy_ratio",
        "historical_ratio",
        "occupancy_delta"
    ]
    
    return df[feature_cols], facility_encoder, feature_cols

def train_pipeline():
    print("=" * 65)
    print(" SmartPark AI - Random Forest Occupancy Training Pipeline")
    print("=" * 65)
    
    # 1. Load data
    df = load_data(DATASET_PATH)
    
    # 2. Clean data
    df = clean_data(df)
    
    # Precompute historical lookup table for fallback when historical_occupancy isn't provided
    hist_lookup = df.groupby(["parking_id", "hour", "day_of_week"])["historical_occupancy"].mean().to_dict()
    # String key version for JSON serialization/lookups
    hist_lookup_str = {f"{k[0]}_{k[1]}_{k[2]}": round(float(v), 2) for k, v in hist_lookup.items()}
    
    # 3. Feature engineering
    X, facility_encoder, feature_cols = build_features(df)
    y = df[["occupied_30m", "occupied_60m", "occupied_90m"]]
    print(f"[3/7] Feature engineering complete. Generated {len(feature_cols)} features:")
    print("      " + ", ".join(feature_cols))
    
    # 4. Train / test split
    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=0.20, random_state=42
    )
    print(f"[4/7] Train/Test split: {len(X_train)} train samples, {len(X_test)} test samples.")
    
    # 5. Train RandomForestRegressor
    print("[5/7] Training RandomForestRegressor (n_estimators=100, max_depth=14)...")
    rf_model = RandomForestRegressor(
        n_estimators=100,
        max_depth=14,
        min_samples_split=4,
        min_samples_leaf=2,
        random_state=42,
        n_jobs=-1
    )
    rf_model.fit(X_train, y_train)
    print("      Random Forest training finished successfully!")
    
    # 6. Evaluate using MAE and R²
    print("[6/7] Evaluating model performance on test set:")
    y_pred = rf_model.predict(X_test)
    
    horizons = ["30m", "60m", "90m"]
    metrics = {}
    
    for idx, horizon in enumerate(horizons):
        mae = mean_absolute_error(y_test.iloc[:, idx], y_pred[:, idx])
        r2 = r2_score(y_test.iloc[:, idx], y_pred[:, idx])
        metrics[f"mae_{horizon}"] = round(float(mae), 3)
        metrics[f"r2_{horizon}"] = round(float(r2), 4)
        print(f"      Horizon +{horizon:>3} -> MAE: {mae:6.3f} slots | R²: {r2:6.4f}")
        
    overall_mae = mean_absolute_error(y_test, y_pred)
    overall_r2 = r2_score(y_test, y_pred)
    metrics["overall_mae"] = round(float(overall_mae), 3)
    metrics["overall_r2"] = round(float(overall_r2), 4)
    print(f"      =======================================================")
    print(f"      Overall Model Performance -> MAE: {overall_mae:6.3f} slots | R²: {overall_r2:6.4f}")
    
    # Feature importances
    importances = rf_model.feature_importances_
    sorted_idx = np.argsort(importances)[::-1]
    print("\n      Top Predictive Features:")
    for rank, i in enumerate(sorted_idx[:7], 1):
        print(f"       {rank}. {feature_cols[i]:<22}: {importances[i]*100:5.2f}%")
        
    # 7. Save model and metadata
    artifact = {
        "model": rf_model,
        "feature_names": feature_cols,
        "facility_encoder": facility_encoder,
        "historical_lookup": hist_lookup_str,
        "metrics": metrics,
        "horizons": horizons,
        "trained_at": datetime.now().isoformat(),
        "total_records": len(df)
    }
    
    joblib.dump(artifact, MODEL_PATH)
    print(f"\n[7/7] Trained model bundle saved to: {MODEL_PATH}")
    print("=" * 65)
    return artifact

if __name__ == "__main__":
    train_pipeline()

"""
SmartPark AI - FastAPI Real-Time Machine Learning Prediction Service
Serves real-time parking occupancy and slot availability predictions
powered by a trained multi-output RandomForestRegressor.
"""

import os
import joblib
import numpy as np
import pandas as pd
from typing import Optional, Dict, Any, List
from fastapi import FastAPI, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field

# Paths
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
MODEL_PATH = os.path.join(BASE_DIR, "model.joblib")

# Initialize FastAPI application
app = FastAPI(
    title="SmartPark AI Prediction Service",
    description="Production-grade AI/ML service for predicting future parking occupancy and available slots using Random Forest Regression.",
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc"
)

# Enable CORS for frontend and MERN backend integration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Global model state
model_bundle: Optional[Dict[str, Any]] = None

def load_model():
    """Load trained RandomForest model artifact from disk."""
    global model_bundle
    if not os.path.exists(MODEL_PATH):
        raise FileNotFoundError(
            f"Trained model not found at {MODEL_PATH}. Run 'python train.py' to train and save the model first."
        )
    model_bundle = joblib.load(MODEL_PATH)
    print(f"[Model Loaded] Successfully loaded Random Forest model trained at {model_bundle.get('trained_at')}")

# Load model immediately on module initialization
try:
    load_model()
except Exception as e:
    print(f"[Warning] Model could not be loaded on import: {e}")

# Also hook startup event
@app.on_event("startup")
def startup_event():
    if model_bundle is None:
        load_model()

# ==================== Pydantic Schemas ====================

class PredictionRequest(BaseModel):
    parking_id: str = Field(..., description="Unique parking location ID (e.g., PARK_001)", example="PARK_001")
    hour: int = Field(..., ge=0, le=23, description="Hour of the day in 24h format (0-23)", example=14)
    day_of_week: int = Field(..., ge=0, le=6, description="Day of the week (0=Monday, 6=Sunday)", example=4)
    total_slots: int = Field(..., gt=0, description="Total parking capacity slots", example=100)
    current_occupied: int = Field(..., ge=0, description="Currently occupied parking slots", example=58)
    historical_occupancy: Optional[float] = Field(
        None, 
        ge=0, 
        description="Historical average occupied slots for this location/time (auto-inferred if omitted)"
    )

    model_config = {
        "json_schema_extra": {
            "example": {
                "parking_id": "PARK_001",
                "hour": 14,
                "day_of_week": 4,
                "total_slots": 100,
                "current_occupied": 58,
                "historical_occupancy": 62.5
            }
        }
    }

class HorizonPrediction(BaseModel):
    horizon_minutes: int
    predicted_occupied_slots: int
    predicted_available_slots: int
    occupancy_rate_percentage: float
    status: str
    trend: str

class PredictionResponse(BaseModel):
    parking_id: str
    hour: int
    day_of_week: int
    total_slots: int
    current_occupied: int
    current_available_slots: int
    current_occupancy_percentage: float
    
    # Primary predictions
    predicted_occupied_slots: int
    predicted_available_slots: int
    
    # Detailed 30m, 60m, 90m predictions
    predictions: Dict[str, HorizonPrediction]
    
    # Model info
    model_type: str = "RandomForestRegressor"
    accuracy_metrics: Dict[str, float]

class BatchPredictionRequest(BaseModel):
    locations: List[PredictionRequest]

# ==================== Helper Functions ====================

def get_occupancy_status(occupancy_pct: float) -> str:
    """Categorize parking demand based on occupancy percentage."""
    if occupancy_pct < 40.0:
        return "Low Demand / High Availability"
    elif occupancy_pct < 75.0:
        return "Moderate Demand / Normal Availability"
    elif occupancy_pct < 90.0:
        return "High Demand / Limited Slots"
    else:
        return "Critical / Almost Full"

def get_trend(pred_slots: int, current_slots: int) -> str:
    """Determine directional trend."""
    diff = pred_slots - current_slots
    if diff >= 2:
        return "Increasing"
    elif diff <= -2:
        return "Decreasing"
    else:
        return "Stable"

def engineer_single_input(req: PredictionRequest, bundle: dict) -> pd.DataFrame:
    """Transform raw API input into exact feature vector expected by the model."""
    encoder = bundle.get("facility_encoder", {})
    hist_lookup = bundle.get("historical_lookup", {})
    
    # 1. Facility code
    fac_code = encoder.get(req.parking_id, -1)
    
    # 2. Historical occupancy fallback if not provided
    if req.historical_occupancy is not None:
        hist_occ = float(req.historical_occupancy)
    else:
        key = f"{req.parking_id}_{req.hour}_{req.day_of_week}"
        hist_occ = hist_lookup.get(key, float(req.current_occupied))
    
    # 3. Cyclical time features
    sin_hour = np.sin(2 * np.pi * req.hour / 24.0)
    cos_hour = np.cos(2 * np.pi * req.hour / 24.0)
    sin_day = np.sin(2 * np.pi * req.day_of_week / 7.0)
    cos_day = np.cos(2 * np.pi * req.day_of_week / 7.0)
    
    # 4. Behavioral flags
    is_weekend = 1 if req.day_of_week >= 5 else 0
    rush_hour = 1 if ((8 <= req.hour <= 10) or (17 <= req.hour <= 20)) else 0
    
    # 5. Ratios and dynamics
    total = max(float(req.total_slots), 1.0)
    occ_ratio = min(max(req.current_occupied / total, 0.0), 1.0)
    hist_ratio = min(max(hist_occ / total, 0.0), 1.0)
    occ_delta = req.current_occupied - hist_occ
    
    data = {
        "facility_code": [fac_code],
        "hour": [req.hour],
        "day_of_week": [req.day_of_week],
        "total_slots": [req.total_slots],
        "occupied_slots": [req.current_occupied],
        "historical_occupancy": [hist_occ],
        "sin_hour": [sin_hour],
        "cos_hour": [cos_hour],
        "sin_day": [sin_day],
        "cos_day": [cos_day],
        "is_weekend": [is_weekend],
        "rush_hour": [rush_hour],
        "occupancy_ratio": [occ_ratio],
        "historical_ratio": [hist_ratio],
        "occupancy_delta": [occ_delta],
    }
    
    return pd.DataFrame(data)[bundle["feature_names"]]

# ==================== API Endpoints ====================

@app.get("/", tags=["Info"])
def root():
    """Service overview, status, and loaded model metadata."""
    if model_bundle is None:
        return {"status": "initializing", "message": "Model not loaded yet."}
    
    return {
        "service": "SmartPark AI Occupancy & Slot Prediction Engine",
        "status": "operational",
        "model_type": "RandomForestRegressor (Multi-Output)",
        "horizons": ["30 minutes", "60 minutes", "90 minutes"],
        "metrics": model_bundle.get("metrics", {}),
        "trained_at": model_bundle.get("trained_at"),
        "endpoints": {
            "predict": "POST /predict",
            "batch_predict": "POST /batch-predict",
            "health": "GET /health",
            "metrics": "GET /metrics"
        }
    }

@app.get("/health", tags=["Health"])
def health_check():
    """Kubernetes/Container health probe."""
    if model_bundle is None or "model" not in model_bundle:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="ML Model not loaded or unavailable."
        )
    return {"status": "healthy", "model_loaded": True}

@app.get("/metrics", tags=["Metrics"])
def get_metrics():
    """Retrieve ML model evaluation metrics (MAE, R2, training date)."""
    if model_bundle is None:
        raise HTTPException(status_code=503, detail="Model bundle not loaded.")
    return {
        "model_type": "RandomForestRegressor",
        "evaluation": model_bundle.get("metrics", {}),
        "trained_at": model_bundle.get("trained_at"),
        "total_training_records": model_bundle.get("total_records"),
        "horizons": model_bundle.get("horizons")
    }

@app.post("/predict", response_model=PredictionResponse, tags=["Prediction"])
def predict_occupancy(request: PredictionRequest):
    """
    Predict future parking occupancy and available slots for 30, 60, and 90 minutes.
    
    - Inputs: parking_id, hour, day_of_week, total_slots, current_occupied
    - Calculates: available_slots = total_slots - predicted_occupied_slots
    - Returns: Predictions across all 3 horizons + demand categorization + directional trend.
    """
    if model_bundle is None or "model" not in model_bundle:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Prediction model is not loaded. Train the model using train.py."
        )
    
    # Validate logic
    if request.current_occupied > request.total_slots:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"current_occupied ({request.current_occupied}) cannot exceed total_slots ({request.total_slots})."
        )
    
    # 1. Feature Engineering
    X_input = engineer_single_input(request, model_bundle)
    
    # 2. Model Inference
    # outputs: array of shape (1, 3) -> [occ_30m, occ_60m, occ_90m]
    raw_preds = model_bundle["model"].predict(X_input)[0]
    
    # 3. Post-process and clamp bounds [0, total_slots]
    horizons_map = [
        ("30_min", 30, raw_preds[0]),
        ("60_min", 60, raw_preds[1]),
        ("90_min", 90, raw_preds[2]),
    ]
    
    predictions_dict = {}
    for key, minutes, raw_val in horizons_map:
        # Realistic integer slot rounding clamped to [0, total_slots]
        pred_occ = int(np.clip(round(float(raw_val)), 0, request.total_slots))
        pred_avail = max(0, request.total_slots - pred_occ)
        pct = round((pred_occ / request.total_slots) * 100.0, 1)
        
        predictions_dict[key] = HorizonPrediction(
            horizon_minutes=minutes,
            predicted_occupied_slots=pred_occ,
            predicted_available_slots=pred_avail,
            occupancy_rate_percentage=pct,
            status=get_occupancy_status(pct),
            trend=get_trend(pred_occ, request.current_occupied)
        )
        
    # Primary prediction uses 30m horizon
    primary_30m = predictions_dict["30_min"]
    
    current_avail = max(0, request.total_slots - request.current_occupied)
    current_pct = round((request.current_occupied / request.total_slots) * 100.0, 1)
    
    return PredictionResponse(
        parking_id=request.parking_id,
        hour=request.hour,
        day_of_week=request.day_of_week,
        total_slots=request.total_slots,
        current_occupied=request.current_occupied,
        current_available_slots=current_avail,
        current_occupancy_percentage=current_pct,
        predicted_occupied_slots=primary_30m.predicted_occupied_slots,
        predicted_available_slots=primary_30m.predicted_available_slots,
        predictions=predictions_dict,
        model_type="RandomForestRegressor (Multi-Output)",
        accuracy_metrics=model_bundle.get("metrics", {})
    )

@app.post("/batch-predict", tags=["Prediction"])
def batch_predict(batch: BatchPredictionRequest):
    """Predict for multiple parking locations in one batch call."""
    results = []
    for loc in batch.locations:
        results.append(predict_occupancy(loc))
    return {"count": len(results), "results": results}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("app:app", host="0.0.0.0", port=8000, reload=True)

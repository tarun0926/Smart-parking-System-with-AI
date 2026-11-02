# SmartPark AI - Real-Time Occupancy & Slot Prediction Engine

Production-grade Machine Learning service built with **Python**, **FastAPI**, and **Scikit-learn** (`RandomForestRegressor`) to predict future parking occupancy and slot availability at **30-minute**, **60-minute**, and **90-minute** horizons.

---

## 🧠 Machine Learning Architecture

### 1. Model Type
- **Algorithm**: Multi-Output `RandomForestRegressor`
- **Estimators**: 100 Trees
- **Max Depth**: 14
- **Frameworks**: Scikit-learn, Pandas, NumPy, Joblib

### 2. Dataset (`dataset.csv`)
Realistic dataset with **4,032 records** covering multiple facility archetypes (commercial mall, IT business park, metro transit terminal, hospital, entertainment center):
- `parking_id`: Location identifier (e.g. `PARK_001` to `PARK_006`)
- `hour`: Hour of the day (0–23)
- `day_of_week`: Day of the week (0 = Monday ... 6 = Sunday)
- `total_slots`: Total parking capacity
- `occupied_slots`: Current occupied slots
- `historical_occupancy`: Historical baseline occupancy for this time/day
- `occupied_30m`: Target occupancy at +30 minutes
- `occupied_60m`: Target occupancy at +60 minutes
- `occupied_90m`: Target occupancy at +90 minutes

### 3. Feature Engineering Pipeline
The training and inference pipelines engineer 15 robust features:
1. `facility_code`: Encoded parking location ID
2. `hour` & `day_of_week`: Continuous calendar features
3. `sin_hour` & `cos_hour`: Cyclical 24-hour diurnal encoding
4. `sin_day` & `cos_day`: Cyclical 7-day weekly encoding
5. `is_weekend`: Binary flag for weekend traffic patterns
6. `rush_hour`: Peak traffic flag (8–10 AM & 5–8 PM)
7. `total_slots` & `occupied_slots`: Slot counts
8. `historical_occupancy`: Facility baseline
9. `occupancy_ratio`: Current occupancy percentage (`occupied_slots / total_slots`)
10. `historical_ratio`: Historical baseline ratio (`historical_occupancy / total_slots`)
11. `occupancy_delta`: Momentum difference (`occupied_slots - historical_occupancy`)

---

## 📊 Model Evaluation Results

Tested on an independent 20% holdout test set (807 test samples):

| Horizon | Mean Absolute Error (MAE) | R² Score | Performance |
|---|---|---|---|
| **+30 Minutes** | **1.125 slots** | **0.9979** | Exceptional accuracy |
| **+60 Minutes** | **1.836 slots** | **0.9939** | High predictive power |
| **+90 Minutes** | **2.335 slots** | **0.9891** | Robust long-range trend |
| **Overall** | **1.765 slots** | **0.9936** | Production-ready |

---

## 🚀 Running the AI Service

### 1. Install Dependencies
```bash
pip install -r requirements.txt
```

### 2. Train the Model
```bash
python train.py
```
This cleans the data, engineers features, trains the Random Forest, prints evaluation metrics, and exports the bundle to `model.joblib`.

### 3. Launch FastAPI Server
```bash
python app.py
# Or via uvicorn:
uvicorn app:app --host 0.0.0.0 --port 8000 --reload
```
Interactive Swagger API docs available at: **`http://localhost:8000/docs`**

---

## 🔌 API Reference

### `POST /predict`
Predicts future occupied and available slots for 30, 60, and 90 minutes.

#### Request Body
```json
{
  "parking_id": "PARK_001",
  "hour": 14,
  "day_of_week": 4,
  "total_slots": 100,
  "current_occupied": 65
}
```

#### Response
```json
{
  "parking_id": "PARK_001",
  "hour": 14,
  "day_of_week": 4,
  "total_slots": 100,
  "current_occupied": 65,
  "current_available_slots": 35,
  "current_occupancy_percentage": 65.0,
  "predicted_occupied_slots": 68,
  "predicted_available_slots": 32,
  "predictions": {
    "30_min": {
      "horizon_minutes": 30,
      "predicted_occupied_slots": 68,
      "predicted_available_slots": 32,
      "occupancy_rate_percentage": 68.0,
      "status": "Moderate Demand / Normal Availability",
      "trend": "Increasing"
    },
    "60_min": {
      "horizon_minutes": 60,
      "predicted_occupied_slots": 72,
      "predicted_available_slots": 28,
      "occupancy_rate_percentage": 72.0,
      "status": "Moderate Demand / Normal Availability",
      "trend": "Increasing"
    },
    "90_min": {
      "horizon_minutes": 90,
      "predicted_occupied_slots": 76,
      "predicted_available_slots": 24,
      "occupancy_rate_percentage": 76.0,
      "status": "High Demand / Limited Slots",
      "trend": "Increasing"
    }
  },
  "model_type": "RandomForestRegressor (Multi-Output)",
  "accuracy_metrics": {
    "mae_30m": 1.125,
    "r2_30m": 0.9979,
    "mae_60m": 1.836,
    "r2_60m": 0.9939,
    "mae_90m": 2.335,
    "r2_90m": 0.9891,
    "overall_mae": 1.765,
    "overall_r2": 0.9936
  }
}
```

### Slot Calculation Formula
$$\text{available\_slots} = \max(0, \text{total\_slots} - \text{predicted\_occupied\_slots})$$

### Additional Endpoints
- `GET /` — Service status & model information
- `GET /health` — Health check probe
- `GET /metrics` — Machine learning evaluation metrics
- `POST /batch-predict` — Multi-location batch prediction

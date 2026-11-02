"""
SmartPark AI - Comprehensive Model and API Verification Suite
Tests the trained Random Forest model and FastAPI endpoints directly.
"""

import sys
import os
import json
import numpy as np

# Ensure ai-service directory is on python path
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, BASE_DIR)

from fastapi.testclient import TestClient
from app import app, model_bundle

client = TestClient(app)

def test_endpoints():
    print("=" * 60)
    print(" SMARTPARK AI - TEST SUITE")
    print("=" * 60)
    
    # 1. Test Root / Info endpoint
    print("\n[TEST 1] Testing GET / ...")
    res = client.get("/")
    assert res.status_code == 200, f"Expected 200, got {res.status_code}"
    data = res.json()
    print(f" -> Status: {data['status']}, Model: {data['model_type']}")
    print(f" -> Overall R2: {data['metrics']['overall_r2']}, Overall MAE: {data['metrics']['overall_mae']}")
    
    # 2. Test Health endpoint
    print("\n[TEST 2] Testing GET /health ...")
    res = client.get("/health")
    assert res.status_code == 200
    assert res.json()["status"] == "healthy"
    print(" -> Health probe passed!")
    
    # 3. Test Metrics endpoint
    print("\n[TEST 3] Testing GET /metrics ...")
    res = client.get("/metrics")
    assert res.status_code == 200
    metrics = res.json()["evaluation"]
    print(f" -> 30m MAE: {metrics['mae_30m']}, 60m MAE: {metrics['mae_60m']}, 90m MAE: {metrics['mae_90m']}")
    
    # 4. Test POST /predict with realistic input
    print("\n[TEST 4] Testing POST /predict (Mall Peak Hour: 2 PM Friday) ...")
    payload = {
        "parking_id": "PARK_001",
        "hour": 14,
        "day_of_week": 4, # Friday
        "total_slots": 100,
        "current_occupied": 65
    }
    res = client.post("/predict", json=payload)
    assert res.status_code == 200, f"Predict failed: {res.text}"
    body = res.json()
    
    print(f" -> Parking ID: {body['parking_id']}")
    print(f" -> Current Occupied: {body['current_occupied']} / {body['total_slots']} slots ({body['current_occupancy_percentage']}%)")
    print(f" -> Primary Predicted Occupied (30m): {body['predicted_occupied_slots']} slots")
    print(f" -> Primary Predicted Available: {body['predicted_available_slots']} slots")
    
    # Verify calculation: available_slots = total_slots - predicted_occupied_slots
    assert body['predicted_available_slots'] == body['total_slots'] - body['predicted_occupied_slots'], \
        "Calculation mismatch: available != total - occupied"
    
    # Check 30m, 60m, 90m horizons
    for h in ["30_min", "60_min", "90_min"]:
        pred_h = body["predictions"][h]
        print(f"   * +{pred_h['horizon_minutes']} min: {pred_h['predicted_occupied_slots']} occupied, {pred_h['predicted_available_slots']} available ({pred_h['occupancy_rate_percentage']}%) [{pred_h['status']}] Trend: {pred_h['trend']}")
        # Verify available slot arithmetic
        assert pred_h["predicted_available_slots"] == body["total_slots"] - pred_h["predicted_occupied_slots"]
        assert 0 <= pred_h["predicted_occupied_slots"] <= body["total_slots"]
        assert 0 <= pred_h["predicted_available_slots"] <= body["total_slots"]
        
    print(" -> Calculations & bounds verified for all horizons!")

    # 5. Test POST /predict with Night Low Traffic (2 AM Monday)
    print("\n[TEST 5] Testing POST /predict (Late Night Low Traffic: 2 AM Monday) ...")
    payload_night = {
        "parking_id": "PARK_002",
        "hour": 2,
        "day_of_week": 0,
        "total_slots": 150,
        "current_occupied": 12
    }
    res_night = client.post("/predict", json=payload_night)
    assert res_night.status_code == 200
    body_night = res_night.json()
    print(f" -> Night Predicted 30m Occupied: {body_night['predicted_occupied_slots']}, Available: {body_night['predicted_available_slots']}")
    assert body_night["predictions"]["30_min"]["predicted_occupied_slots"] < 30, "Night predictions should reflect low occupancy"
    
    # 6. Test Error Handling (occupied > total)
    print("\n[TEST 6] Testing Validation Error (current_occupied > total_slots) ...")
    invalid_payload = {
        "parking_id": "PARK_001",
        "hour": 10,
        "day_of_week": 2,
        "total_slots": 50,
        "current_occupied": 60 # Invalid!
    }
    res_err = client.post("/predict", json=invalid_payload)
    assert res_err.status_code == 400
    print(f" -> Correctly rejected invalid input with 400 Bad Request: {res_err.json()['detail']}")

    # 7. Test Batch Prediction
    print("\n[TEST 7] Testing POST /batch-predict ...")
    batch_res = client.post("/batch-predict", json={"locations": [payload, payload_night]})
    assert batch_res.status_code == 200
    assert batch_res.json()["count"] == 2
    print(" -> Batch prediction passed with 2 locations!")

    print("\n" + "=" * 60)
    print(" ALL 7 TESTS PASSED SUCCESSFULLY! Real ML system verified.")
    print("=" * 60)

if __name__ == "__main__":
    test_endpoints()

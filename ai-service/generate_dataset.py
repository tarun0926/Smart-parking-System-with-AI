"""
SmartPark AI - Dataset Generator
Generates realistic parking occupancy dataset (at least 1000 records).
Features realistic diurnal curves, location characteristics, weekend trends, and turnover dynamics.
"""

import numpy as np
import pandas as pd
import os

# Set seed for reproducibility
np.random.seed(42)

# Parking facilities configuration
FACILITIES = [
    {"parking_id": "PARK_001", "name": "Downtown Central Mall", "type": "commercial", "total_slots": 120},
    {"parking_id": "PARK_002", "name": "CyberTech Business Park", "type": "office", "total_slots": 150},
    {"parking_id": "PARK_003", "name": "Metro Grand Terminal", "type": "transit", "total_slots": 80},
    {"parking_id": "PARK_004", "name": "City General Hospital", "type": "hospital", "total_slots": 60},
    {"parking_id": "PARK_005", "name": "Arts & Culture Center", "type": "entertainment", "total_slots": 50},
    {"parking_id": "PARK_006", "name": "Harbor Bay Marina", "type": "leisure", "total_slots": 70},
]

def get_base_occupancy_ratio(fac_type, hour, day_of_week):
    """Calculate base occupancy ratio (0.0 to 1.0) according to facility type and time."""
    is_weekend = (day_of_week >= 5) # 5 = Saturday, 6 = Sunday
    
    if fac_type == "office":
        if is_weekend:
            # Very low on weekends
            base = 0.08 + 0.05 * np.sin((hour - 8) / 12 * np.pi) if 8 <= hour <= 18 else 0.04
        else:
            # High 8am to 6pm, peaking around 11am - 3pm
            if 6 <= hour < 8:
                base = 0.25 + 0.35 * ((hour - 6) / 2)
            elif 8 <= hour < 12:
                base = 0.60 + 0.32 * ((hour - 8) / 4)
            elif 12 <= hour < 16:
                base = 0.90 - 0.05 * ((hour - 12) / 4)
            elif 16 <= hour < 19:
                base = 0.85 - 0.50 * ((hour - 16) / 3)
            elif 19 <= hour < 22:
                base = 0.35 - 0.20 * ((hour - 19) / 3)
            else:
                base = 0.10
    elif fac_type == "commercial": # Mall / Shopping
        if is_weekend:
            # Huge crowds 12pm to 9pm
            if 10 <= hour < 14:
                base = 0.50 + 0.40 * ((hour - 10) / 4)
            elif 14 <= hour < 21:
                base = 0.90 + 0.05 * np.sin((hour - 14) / 7 * np.pi)
            elif 21 <= hour < 23:
                base = 0.80 - 0.45 * ((hour - 21) / 2)
            else:
                base = 0.12
        else:
            # Moderate weekday, afternoon/evening peak
            if 10 <= hour < 17:
                base = 0.35 + 0.25 * ((hour - 10) / 7)
            elif 17 <= hour < 21:
                base = 0.65 + 0.15 * np.sin((hour - 17) / 4 * np.pi)
            elif 21 <= hour < 24:
                base = 0.55 - 0.35 * ((hour - 21) / 3)
            else:
                base = 0.10
    elif fac_type == "transit": # Metro / Railway
        if is_weekend:
            base = 0.30 + 0.20 * np.sin((hour - 9) / 10 * np.pi) if 7 <= hour <= 21 else 0.12
        else:
            # Two peaks: Morning commute (7-10am) & Evening commute (5-8pm)
            if 6 <= hour < 9:
                base = 0.45 + 0.45 * ((hour - 6) / 3)
            elif 9 <= hour < 16:
                base = 0.85 - 0.10 * ((hour - 9) / 7)
            elif 16 <= hour < 19:
                base = 0.78 + 0.12 * ((hour - 16) / 3)
            elif 19 <= hour < 22:
                base = 0.75 - 0.45 * ((hour - 19) / 3)
            else:
                base = 0.15
    elif fac_type == "hospital":
        # Consistently moderate with day shift visits
        if 8 <= hour < 18:
            base = 0.65 + 0.15 * np.sin((hour - 8) / 10 * np.pi)
        else:
            base = 0.35
    elif fac_type == "entertainment": # Arts, Theater
        if 18 <= hour < 23:
            base = 0.75 + (0.15 if is_weekend else 0.05)
        elif 12 <= hour < 18:
            base = 0.45 if is_weekend else 0.20
        else:
            base = 0.10
    else: # leisure / Marina
        if is_weekend and 11 <= hour < 20:
            base = 0.75 + 0.15 * np.sin((hour - 11) / 9 * np.pi)
        else:
            base = 0.25 if 10 <= hour < 19 else 0.08

    return float(np.clip(base, 0.02, 0.98))

def generate_records():
    records = []
    
    # 6 facilities * 7 days * 24 hours * 4 samples (e.g. over 4 weeks of observations)
    # Total = 6 * 7 * 24 * 4 = 4032 records (well over 1000 records)
    for fac in FACILITIES:
        fid = fac["parking_id"]
        total_slots = fac["total_slots"]
        fac_type = fac["type"]
        
        # Precompute historical baseline for each (hour, day)
        hist_table = {}
        for d in range(7):
            for h in range(24):
                ratio = get_base_occupancy_ratio(fac_type, h, d)
                hist_table[(d, h)] = round(ratio * total_slots, 1)

        for week in range(4):
            for day in range(7):
                for hour in range(24):
                    hist_occ = hist_table[(day, hour)]
                    
                    # Current observed occupancy: historical baseline + realistic random fluctuation
                    noise = np.random.normal(0, 0.04 * total_slots)
                    # Add week-to-week trend/drift
                    week_factor = (week - 1.5) * 0.02 * total_slots
                    current_occ = int(np.clip(round(hist_occ + noise + week_factor), 0, total_slots))
                    
                    # Compute future horizon targets (30m, 60m, 90m)
                    # Horizon 30 min (hour + 0.5)
                    h_30 = (hour + 0.5) % 24
                    ratio_30 = get_base_occupancy_ratio(fac_type, h_30, day)
                    target_30 = ratio_30 * total_slots
                    # Autoregressive momentum: future blends current with target expected
                    occ_30 = int(np.clip(round(0.70 * current_occ + 0.30 * target_30 + np.random.normal(0, 1.2)), 0, total_slots))
                    
                    # Horizon 60 min (hour + 1.0)
                    h_60 = (hour + 1.0) % 24
                    ratio_60 = get_base_occupancy_ratio(fac_type, h_60, day)
                    target_60 = ratio_60 * total_slots
                    occ_60 = int(np.clip(round(0.45 * current_occ + 0.55 * target_60 + np.random.normal(0, 1.8)), 0, total_slots))
                    
                    # Horizon 90 min (hour + 1.5)
                    h_90 = (hour + 1.5) % 24
                    ratio_90 = get_base_occupancy_ratio(fac_type, h_90, day)
                    target_90 = ratio_90 * total_slots
                    occ_90 = int(np.clip(round(0.25 * current_occ + 0.75 * target_90 + np.random.normal(0, 2.3)), 0, total_slots))
                    
                    records.append({
                        "parking_id": fid,
                        "hour": hour,
                        "day_of_week": day,
                        "total_slots": total_slots,
                        "occupied_slots": current_occ,
                        "historical_occupancy": hist_occ,
                        "occupied_30m": occ_30,
                        "occupied_60m": occ_60,
                        "occupied_90m": occ_90
                    })
                    
    df = pd.DataFrame(records)
    # Shuffle for training realism
    df = df.sample(frac=1.0, random_state=42).reset_index(drop=True)
    return df

if __name__ == "__main__":
    out_dir = os.path.dirname(os.path.abspath(__file__))
    out_file = os.path.join(out_dir, "dataset.csv")
    df = generate_records()
    df.to_csv(out_file, index=False)
    print(f"Generated {len(df)} parking records to {out_file}")
    print("\nDataset Sample:")
    print(df.head(6))
    print("\nDataset Summary Statistics:")
    print(df.describe())

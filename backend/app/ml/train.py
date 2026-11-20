import os
import json
import numpy as np
import pandas as pd
from sklearn.ensemble import RandomForestClassifier, IsolationForest, GradientBoostingRegressor
from sklearn.preprocessing import StandardScaler
from sklearn.model_selection import train_test_split
from sklearn.metrics import classification_report, accuracy_score, f1_score
import joblib

from app.core.config import settings

def calculate_wqi(df_or_dict):
    """
    Computes standard Weighted Arithmetic Water Quality Index (WQI).
    Standard limits (WHO/EPA):
    - pH: 6.5 - 8.5 (ideal 7.0)
    - Turbidity: 5.0 NTU (ideal 0.0)
    - TDS: 500 mg/L (ideal 0.0)
    - Temperature: 25 °C (ideal 20.0)
    - Dissolved Oxygen: 5.0 mg/L (ideal 14.6)
    - Conductivity: 500 µS/cm (ideal 0.0)
    """
    standards = settings.WQI_STANDARDS
    total_weight = sum(s["weight"] for s in standards.values())
    
    # Calculate relative weights Wi = wi / sum(wi)
    rel_weights = {k: v["weight"] / total_weight for k, v in standards.items()}
    
    is_df = isinstance(df_or_dict, pd.DataFrame)
    
    # Calculate sub-indices qi = 100 * |(v - ideal) / (standard - ideal)|
    qi_series = {}
    for param, meta in standards.items():
        val = df_or_dict[param] if is_df else df_or_dict[param]
        ideal = meta["ideal"]
        std = meta["standard"]
        
        if param == "ph":
            # pH has safe band around 7.0
            if is_df:
                q = 100.0 * np.abs(val - ideal) / (std - ideal)
            else:
                q = 100.0 * abs(val - ideal) / (std - ideal)
        elif param == "dissolved_oxygen":
            # For DO, lower than ideal is worse
            if is_df:
                q = 100.0 * np.maximum(0.0, (ideal - val)) / (ideal - std)
            else:
                q = 100.0 * max(0.0, (ideal - val)) / (ideal - std)
        else:
            if is_df:
                q = 100.0 * np.maximum(0.0, (val - ideal)) / (std - ideal)
            else:
                q = 100.0 * max(0.0, (val - ideal)) / (std - ideal)
                
        qi_series[param] = q

    if is_df:
        wqi_raw = np.zeros(len(df_or_dict))
        for param, q in qi_series.items():
            wqi_raw += q * rel_weights[param]
        # Normalized WQI score (0 to 100, where 100 is pristine water)
        wqi_normalized = np.clip(100.0 - (wqi_raw * 0.5), 0.0, 100.0)
        return np.round(wqi_normalized, 1)
    else:
        wqi_raw = sum(qi_series[param] * rel_weights[param] for param in standards)
        wqi_normalized = max(0.0, min(100.0, 100.0 - (wqi_raw * 0.5)))
        return round(wqi_normalized, 1)

def get_wqi_status(wqi_score):
    if wqi_score >= 85:
        return "Excellent"
    elif wqi_score >= 70:
        return "Good"
    elif wqi_score >= 50:
        return "Moderate"
    elif wqi_score >= 35:
        return "Poor"
    else:
        return "Severe / Unsuitable"

def generate_synthetic_water_dataset(n_samples=5000, random_state=42):
    """
    Generates realistic water quality telemetry dataset with realistic distributions,
    cross-parameter physical correlations, environmental variations, and anomaly cases.
    """
    np.random.seed(random_state)
    
    # 65% clean/acceptable water samples, 25% moderately degraded, 10% severe/contaminated
    n_clean = int(n_samples * 0.65)
    n_moderate = int(n_samples * 0.25)
    n_severe = n_samples - n_clean - n_moderate
    
    # 1. Clean Water Samples
    clean_ph = np.random.normal(7.3, 0.4, n_clean).clip(6.6, 8.3)
    clean_turbidity = np.random.exponential(1.2, n_clean).clip(0.2, 4.5)
    clean_tds = np.random.normal(220, 60, n_clean).clip(80, 450)
    clean_temp = np.random.normal(21.0, 3.5, n_clean).clip(12.0, 27.0)
    # DO has inverse correlation with temperature + high values
    clean_do = (12.5 - 0.15 * clean_temp + np.random.normal(0, 0.5, n_clean)).clip(6.8, 12.0)
    # Conductivity correlates with TDS
    clean_cond = (clean_tds * 1.55 + np.random.normal(0, 25, n_clean)).clip(120, 750)
    
    clean_df = pd.DataFrame({
        "ph": clean_ph,
        "turbidity": clean_turbidity,
        "tds": clean_tds,
        "temperature": clean_temp,
        "dissolved_oxygen": clean_do,
        "conductivity": clean_cond,
        "potability": np.ones(n_clean, dtype=int)
    })
    
    # 2. Moderately Degraded (Runoff, seasonal algae, mild industrial)
    mod_ph = np.concatenate([
        np.random.uniform(5.8, 6.4, n_moderate // 2),
        np.random.uniform(8.6, 9.2, n_moderate - n_moderate // 2)
    ])
    np.random.shuffle(mod_ph)
    mod_turbidity = np.random.uniform(4.5, 9.5, n_moderate)
    mod_tds = np.random.normal(550, 100, n_moderate).clip(450, 850)
    mod_temp = np.random.normal(25.0, 4.0, n_moderate).clip(16.0, 32.0)
    mod_do = (8.5 - 0.12 * mod_temp + np.random.normal(0, 0.6, n_moderate)).clip(4.2, 6.5)
    mod_cond = (mod_tds * 1.6 + np.random.normal(0, 40, n_moderate)).clip(700, 1300)
    
    # 40% chance of being marginally safe if treated, 60% unsafe
    mod_potability = (np.random.rand(n_moderate) < 0.35).astype(int)
    
    mod_df = pd.DataFrame({
        "ph": mod_ph,
        "turbidity": mod_turbidity,
        "tds": mod_tds,
        "temperature": mod_temp,
        "dissolved_oxygen": mod_do,
        "conductivity": mod_cond,
        "potability": mod_potability
    })
    
    # 3. Severely Contaminated (Chemical discharge, sewage leak, acid mine drainage, extreme pollution)
    sev_ph = np.concatenate([
        np.random.uniform(3.5, 5.5, n_severe // 2),
        np.random.uniform(9.5, 12.0, n_severe - n_severe // 2)
    ])
    np.random.shuffle(sev_ph)
    sev_turbidity = np.random.uniform(10.0, 35.0, n_severe)
    sev_tds = np.random.uniform(900, 2400, n_severe)
    sev_temp = np.random.uniform(22.0, 38.0, n_severe)
    sev_do = np.random.uniform(0.5, 3.8, n_severe)
    sev_cond = (sev_tds * 1.7 + np.random.normal(0, 80, n_severe)).clip(1400, 4000)
    
    sev_df = pd.DataFrame({
        "ph": sev_ph,
        "turbidity": sev_turbidity,
        "tds": sev_tds,
        "temperature": sev_temp,
        "dissolved_oxygen": sev_do,
        "conductivity": sev_cond,
        "potability": np.zeros(n_severe, dtype=int)
    })
    
    df = pd.concat([clean_df, mod_df, sev_df], ignore_index=True)
    df = df.sample(frac=1.0, random_state=random_state).reset_index(drop=True)
    
    # Compute WQI
    df["wqi"] = calculate_wqi(df)
    
    return df

def train_and_save_models():
    """
    Trains:
    1. RandomForestClassifier for Potability prediction (Safe vs Unsafe)
    2. IsolationForest for Anomaly detection
    3. Scaler & Feature statistics
    """
    model_dir = settings.MODEL_DIR
    os.makedirs(model_dir, exist_ok=True)
    
    print("[ML] Generating synthetic water quality dataset...")
    df = generate_synthetic_water_dataset(n_samples=6000)
    
    feature_cols = ["ph", "turbidity", "tds", "temperature", "dissolved_oxygen", "conductivity"]
    X = df[feature_cols]
    y = df["potability"]
    
    X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42, stratify=y)
    
    # 1. StandardScaler
    scaler = StandardScaler()
    X_train_scaled = scaler.fit_transform(X_train)
    X_test_scaled = scaler.transform(X_test)
    
    # 2. Random Forest Potability Classifier
    print("[ML] Training Random Forest Potability Classifier...")
    clf = RandomForestClassifier(
        n_estimators=120,
        max_depth=12,
        min_samples_split=4,
        random_state=42,
        class_weight="balanced"
    )
    clf.fit(X_train, y_train) # train on unscaled for natural tree splitting & feature attributions
    
    y_pred = clf.predict(X_test)
    acc = accuracy_score(y_test, y_pred)
    f1 = f1_score(y_test, y_pred)
    print(f"[ML] Potability Model Accuracy: {acc*100:.2f}%, F1-Score: {f1:.3f}")
    
    # 3. Isolation Forest for Anomaly Detection (Trained on clean and nominal data)
    print("[ML] Training Isolation Forest for Anomaly Detection...")
    clean_X = df[df["potability"] == 1][feature_cols]
    iso_forest = IsolationForest(
        n_estimators=100,
        contamination=0.06,
        random_state=42
    )
    iso_forest.fit(clean_X)
    
    # 4. Save metadata, feature baselines & feature importance
    feature_importances = dict(zip(feature_cols, clf.feature_importances_.tolist()))
    feature_stats = {
        col: {
            "mean": float(df[col].mean()),
            "std": float(df[col].std()),
            "min": float(df[col].min()),
            "max": float(df[col].max()),
            "threshold": settings.THRESHOLDS[col]
        }
        for col in feature_cols
    }
    
    metadata = {
        "features": feature_cols,
        "feature_importances": feature_importances,
        "feature_stats": feature_stats,
        "model_accuracy": float(acc),
        "model_f1": float(f1),
        "dataset_size": len(df)
    }
    
    # Save artifacts
    joblib.dump(clf, os.path.join(model_dir, "potability_model.joblib"))
    joblib.dump(scaler, os.path.join(model_dir, "scaler.joblib"))
    joblib.dump(iso_forest, os.path.join(model_dir, "anomaly_detector.joblib"))
    
    with open(os.path.join(model_dir, "metadata.json"), "w") as f:
        json.dump(metadata, f, indent=2)
        
    print(f"[ML] All models and metadata successfully saved to: {model_dir}")
    return metadata

if __name__ == "__main__":
    train_and_save_models()

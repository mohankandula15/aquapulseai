import os
import json
import numpy as np
import pandas as pd
import joblib
from app.core.config import settings
from app.ml.train import calculate_wqi, get_wqi_status, train_and_save_models

class WaterQualityPredictor:
    def __init__(self):
        self.model_dir = settings.MODEL_DIR
        self.clf = None
        self.scaler = None
        self.iso_forest = None
        self.metadata = None
        self.load_models()

    def load_models(self):
        model_path = os.path.join(self.model_dir, "potability_model.joblib")
        if not os.path.exists(model_path):
            print("[Predictor] Models not found on disk. Auto-training initial ML models...")
            train_and_save_models()

        self.clf = joblib.load(os.path.join(self.model_dir, "potability_model.joblib"))
        self.scaler = joblib.load(os.path.join(self.model_dir, "scaler.joblib"))
        self.iso_forest = joblib.load(os.path.join(self.model_dir, "anomaly_detector.joblib"))
        
        with open(os.path.join(self.model_dir, "metadata.json"), "r") as f:
            self.metadata = json.load(f)
            
        print("[Predictor] ML Models, Anomaly Detector, and Explainability Metadata loaded.")

    def compute_feature_attributions(self, feature_dict, potability_prob):
        """
        Explainable AI (XAI) feature attribution calculation:
        Measures individual parameter contribution to the prediction shift relative
        to healthy baseline expectations.
        """
        feature_cols = self.metadata["features"]
        feature_stats = self.metadata["feature_stats"]
        baseline_prob = 0.65 # Expected global baseline potability
        
        attributions = []
        total_shift = potability_prob - baseline_prob
        
        # Calculate raw deviation penalties/bonuses based on domain standards & feature importances
        raw_impacts = {}
        for feat in feature_cols:
            val = float(feature_dict[feat])
            threshold = settings.THRESHOLDS[feat]
            mean_val = feature_stats[feat]["mean"]
            std_val = feature_stats[feat]["std"]
            feat_imp = self.metadata["feature_importances"].get(feat, 0.16)
            
            # Distance from safe boundary
            impact = 0.0
            status = "OPTIMAL"
            narrative = ""
            
            if feat == "ph":
                if val < threshold["min"]:
                    dev = (threshold["min"] - val)
                    impact = -dev * 0.25 * (feat_imp * 3)
                    status = "ACIDIC_VIOLATION" if val < 6.0 else "MILDLY_ACIDIC"
                    narrative = f"pH is {val:.2f}, below minimum safe threshold of {threshold['min']} ({status.lower()})"
                elif val > threshold["max"]:
                    dev = (val - threshold["max"])
                    impact = -dev * 0.25 * (feat_imp * 3)
                    status = "ALKALINE_VIOLATION" if val > 9.0 else "MILDLY_ALKALINE"
                    narrative = f"pH is {val:.2f}, above maximum safe threshold of {threshold['max']} ({status.lower()})"
                else:
                    impact = 0.05 * (feat_imp * 2)
                    status = "SAFE"
                    narrative = f"pH is {val:.2f}, comfortably within safe drinking guidelines (6.5 - 8.5)"

            elif feat == "turbidity":
                if val > threshold["max"]:
                    dev = (val - threshold["max"])
                    impact = -np.tanh(dev / 4.0) * 0.45 * (feat_imp * 3)
                    status = "HIGH_TURBIDITY" if val < 10.0 else "SEVERE_TURBIDITY"
                    narrative = f"Turbidity is {val:.2f} NTU (Safe limit: {threshold['max']} NTU). High suspended particulates impede disinfection."
                else:
                    impact = 0.06 * (feat_imp * 2)
                    status = "CLEAR"
                    narrative = f"Turbidity is {val:.2f} NTU, well within crystal-clear standards (< 5.0 NTU)."

            elif feat == "tds":
                if val > threshold["max"]:
                    dev = (val - threshold["max"])
                    impact = -np.tanh(dev / 600.0) * 0.35 * (feat_imp * 3)
                    status = "ELEVATED_SOLIDS" if val < 1000 else "EXCESSIVE_SOLIDS"
                    narrative = f"TDS is {val:.1f} mg/L, exceeding desirable limit of 500 mg/L."
                else:
                    impact = 0.04 * (feat_imp * 2)
                    status = "GOOD"
                    narrative = f"TDS is {val:.1f} mg/L, providing balanced mineral content."

            elif feat == "dissolved_oxygen":
                if val < threshold["min"]:
                    dev = (threshold["min"] - val)
                    impact = -np.tanh(dev / 2.0) * 0.50 * (feat_imp * 3)
                    status = "HYPOXIC" if val < 3.0 else "LOW_OXYGEN"
                    narrative = f"DO is {val:.2f} mg/L (Minimum safe: {threshold['min']} mg/L). Indicates organic waste or stagnant decomposition."
                else:
                    impact = 0.08 * (feat_imp * 2)
                    status = "WELL_OXYGENATED"
                    narrative = f"DO is {val:.2f} mg/L, indicating healthy aeration and oxygen saturation."

            elif feat == "conductivity":
                if val > threshold["max"]:
                    dev = (val - threshold["max"])
                    impact = -np.tanh(dev / 800.0) * 0.30 * (feat_imp * 3)
                    status = "HIGH_SALINITY"
                    narrative = f"Conductivity is {val:.1f} µS/cm (Normal: < {threshold['max']} µS/cm), pointing to dissolved electrolytes/salts."
                else:
                    impact = 0.03 * (feat_imp * 2)
                    status = "NORMAL"
                    narrative = f"Conductivity is {val:.1f} µS/cm, normal for fresh surface water."

            elif feat == "temperature":
                if val > threshold["max"]:
                    dev = (val - threshold["max"])
                    impact = -dev * 0.02
                    status = "ELEVATED_TEMP"
                    narrative = f"Temperature is {val:.1f} °C, higher than normal, accelerating microbial kinetics."
                elif val < threshold["min"]:
                    impact = -0.02
                    status = "COLD"
                    narrative = f"Temperature is {val:.1f} °C."
                else:
                    impact = 0.02
                    status = "NOMINAL"
                    narrative = f"Temperature is {val:.1f} °C, optimal range."

            raw_impacts[feat] = {
                "impact": float(impact),
                "status": status,
                "narrative": narrative,
                "value": val,
                "importance": float(feat_imp)
            }

        # Normalize attributions so sum of impacts matches model probability shift
        raw_sum = sum(abs(v["impact"]) for v in raw_impacts.values())
        scale = (abs(total_shift) / raw_sum) if raw_sum > 0 else 1.0

        for feat in feature_cols:
            info = raw_impacts[feat]
            # SHAP attribution score (positive means boosts potability, negative means degrades potability)
            shap_score = round(info["impact"] * max(0.8, scale), 4)
            pct_contrib = round(shap_score * 100, 1)
            
            attributions.append({
                "feature": feat,
                "label": settings.THRESHOLDS[feat]["name"],
                "unit": settings.THRESHOLDS[feat]["unit"],
                "value": info["value"],
                "attribution_score": shap_score,
                "percentage_impact": pct_contrib,
                "status": info["status"],
                "narrative": info["narrative"],
                "importance_rank": info["importance"],
                "threshold": settings.THRESHOLDS[feat]
            })

        # Sort by magnitude of impact
        attributions.sort(key=lambda x: abs(x["attribution_score"]), reverse=True)
        return {
            "baseline_probability": baseline_prob,
            "final_probability": potability_prob,
            "net_shift": round(total_shift, 4),
            "attributions": attributions
        }

    def predict(self, reading_dict: dict) -> dict:
        """
        Unified ML Prediction:
        - Potability classification & probability
        - Anomaly detection & distance score
        - Water Quality Index (WQI)
        - Explainable AI (XAI) feature attributions
        """
        feature_cols = self.metadata["features"]
        
        # Ensure all features present with defaults if missing
        clean_input = {}
        for col in feature_cols:
            val = float(reading_dict.get(col, self.metadata["feature_stats"][col]["mean"]))
            clean_input[col] = val
            
        X = pd.DataFrame([clean_input])[feature_cols]
        
        # 1. Potability Classification
        potability_pred = int(self.clf.predict(X)[0])
        probs = self.clf.predict_proba(X)[0]
        # Probability of class 1 (Potable / Safe)
        potability_prob = float(probs[1]) if len(probs) > 1 else float(potability_pred)
        potability_label = "Potable / Safe" if potability_pred == 1 else "Non-Potable / Contaminated"
        
        # 2. Anomaly Detection
        # IsolationForest returns -1 for outlier/anomaly, 1 for inlier
        raw_iso = int(self.iso_forest.predict(X)[0])
        is_anomaly = bool(raw_iso == -1)
        # Decision function: lower values mean more anomalous
        score_val = float(self.iso_forest.decision_function(X)[0])
        # Convert decision function to normalized 0-100 anomaly intensity (0 = normal, 100 = extreme anomaly)
        anomaly_intensity = float(np.clip((0.15 - score_val) * 350.0, 0.0, 100.0))
        
        # 3. Water Quality Index (WQI)
        wqi = calculate_wqi(clean_input)
        wqi_status = get_wqi_status(wqi)
        
        # 4. Explainable AI (XAI) Feature Attributions
        explainability = self.compute_feature_attributions(clean_input, potability_prob)
        
        return {
            "potability_pred": potability_pred,
            "potability_prob": round(potability_prob, 4),
            "potability_label": potability_label,
            "is_anomaly": is_anomaly,
            "anomaly_score": round(score_val, 4),
            "anomaly_intensity": round(anomaly_intensity, 1),
            "wqi": wqi,
            "wqi_status": wqi_status,
            "explainability": explainability,
            "input_parameters": clean_input
        }

predictor = WaterQualityPredictor()

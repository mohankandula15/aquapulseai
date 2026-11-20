import numpy as np
import pandas as pd
from datetime import datetime, timedelta
from app.core.config import settings

class TimeSeriesForecaster:
    def __init__(self):
        self.horizons = [1, 2, 3, 6, 12, 18, 24, 36, 48] # hours ahead
        self.parameters = ["ph", "turbidity", "tds", "temperature", "dissolved_oxygen", "conductivity"]

    def forecast_station(self, historical_readings: list, hours_ahead: int = 48) -> dict:
        """
        Takes recent chronological readings for a station and forecasts future values.
        Returns projected series, confidence bounds, and early warnings for forecasted threshold breaches.
        """
        if not historical_readings or len(historical_readings) < 5:
            # Fallback baseline synthesis if minimal history exists
            return self._generate_synthetic_forecast(hours_ahead)

        df = pd.DataFrame([
            {
                "timestamp": r.timestamp if hasattr(r, "timestamp") else r.get("timestamp"),
                "ph": r.ph if hasattr(r, "ph") else r.get("ph"),
                "turbidity": r.turbidity if hasattr(r, "turbidity") else r.get("turbidity"),
                "tds": r.tds if hasattr(r, "tds") else r.get("tds"),
                "temperature": r.temperature if hasattr(r, "temperature") else r.get("temperature"),
                "dissolved_oxygen": r.dissolved_oxygen if hasattr(r, "dissolved_oxygen") else r.get("dissolved_oxygen"),
                "conductivity": r.conductivity if hasattr(r, "conductivity") else r.get("conductivity")
            }
            for r in historical_readings
        ])
        
        # Ensure timestamp is datetime and sorted
        df["timestamp"] = pd.to_datetime(df["timestamp"])
        df = df.sort_values("timestamp").reset_index(drop=True)
        
        last_time = df["timestamp"].iloc[-1]
        forecast_points = []
        
        # Calculate time steps in hours
        t_hours = (df["timestamp"] - df["timestamp"].iloc[0]).dt.total_seconds() / 3600.0
        
        forecast_results = {param: [] for param in self.parameters}
        breach_warnings = []
        
        # Step through forecast horizon at 2-hour increments
        future_steps = list(range(2, hours_ahead + 2, 2))
        
        for param in self.parameters:
            series = df[param].values
            std_err = float(np.std(series[-10:])) if len(series) >= 10 else 0.5
            threshold = settings.THRESHOLDS[param]
            
            # Simple autoregressive + linear trend + diurnal cycle
            # Linear trend
            if len(series) >= 5:
                slope, intercept = np.polyfit(t_hours.values[-24:], series[-24:], 1)
            else:
                slope = 0.0
                intercept = series[-1]
                
            # Dampen slope for stability over 48h
            dampened_slope = slope * 0.4
            last_val = series[-1]
            
            for h in future_steps:
                fut_time = last_time + timedelta(hours=h)
                hour_of_day = fut_time.hour
                
                # Diurnal variation: Temperature peaks at 15:00, DO inversely oscillates
                diurnal = 0.0
                if param == "temperature":
                    diurnal = 1.8 * np.sin((hour_of_day - 9) * np.pi / 12)
                elif param == "dissolved_oxygen":
                    # Photosynthesis increases DO during daytime, respiration lowers at night
                    diurnal = 0.9 * np.sin((hour_of_day - 8) * np.pi / 12)
                elif param == "ph":
                    diurnal = 0.15 * np.sin((hour_of_day - 10) * np.pi / 12)
                    
                # Projected point value
                proj_val = last_val + (dampened_slope * h) + diurnal
                
                # Bound within physical reality
                if param == "ph":
                    proj_val = float(np.clip(proj_val, 2.0, 13.0))
                elif param == "turbidity":
                    proj_val = float(max(0.1, proj_val))
                elif param in ["tds", "conductivity"]:
                    proj_val = float(max(10.0, proj_val))
                elif param == "dissolved_oxygen":
                    proj_val = float(max(0.2, proj_val))
                elif param == "temperature":
                    proj_val = float(np.clip(proj_val, 5.0, 45.0))
                    
                # Expanding confidence bounds with forecast horizon
                uncertainty = (std_err * 0.8) + (0.04 * h * std_err)
                upper = round(float(proj_val + 1.96 * uncertainty), 2)
                lower = round(float(proj_val - 1.96 * uncertainty), 2)
                val_rounded = round(float(proj_val), 2)
                
                forecast_results[param].append({
                    "timestamp": fut_time.isoformat(),
                    "hours_ahead": h,
                    "predicted": val_rounded,
                    "upper_bound": upper,
                    "lower_bound": lower,
                    "threshold_min": threshold["min"],
                    "threshold_max": threshold["max"]
                })
                
                # Check for forecasted threshold breaches
                if val_rounded < threshold["min"] or val_rounded > threshold["max"]:
                    # Check if already flagged for this param
                    existing = next((b for b in breach_warnings if b["parameter"] == param), None)
                    if not existing:
                        breach_val = val_rounded
                        breach_dir = "below minimum" if val_rounded < threshold["min"] else "above maximum"
                        breach_warnings.append({
                            "parameter": param,
                            "parameter_name": threshold["name"],
                            "unit": threshold["unit"],
                            "hours_ahead": h,
                            "estimated_time": fut_time.isoformat(),
                            "predicted_value": breach_val,
                            "threshold_limit": threshold["min"] if val_rounded < threshold["min"] else threshold["max"],
                            "direction": breach_dir,
                            "severity": "CRITICAL" if h <= 12 else "WARNING",
                            "recommendation": f"Forecast indicates {threshold['name']} will breach safe limits ({threshold['min']} - {threshold['max']} {threshold['unit']}) in ~{h} hours. Inspect upstream feeds and prepare corrective measures."
                        })

        return {
            "forecast_generated_at": last_time.isoformat(),
            "horizon_hours": hours_ahead,
            "forecasts": forecast_results,
            "early_warning_breaches": breach_warnings,
            "has_warnings": len(breach_warnings) > 0
        }

    def _generate_synthetic_forecast(self, hours_ahead=48):
        now = datetime.utcnow()
        future_steps = list(range(2, hours_ahead + 2, 2))
        forecast_results = {}
        for param in self.parameters:
            t = settings.THRESHOLDS[param]
            mid = (t["min"] + t["max"]) / 2.0
            pts = []
            for h in future_steps:
                fut_time = now + timedelta(hours=h)
                pts.append({
                    "timestamp": fut_time.isoformat(),
                    "hours_ahead": h,
                    "predicted": round(mid, 2),
                    "upper_bound": round(mid + 0.5, 2),
                    "lower_bound": round(mid - 0.5, 2),
                    "threshold_min": t["min"],
                    "threshold_max": t["max"]
                })
            forecast_results[param] = pts
        return {
            "forecast_generated_at": now.isoformat(),
            "horizon_hours": hours_ahead,
            "forecasts": forecast_results,
            "early_warning_breaches": [],
            "has_warnings": False
        }

forecaster = TimeSeriesForecaster()

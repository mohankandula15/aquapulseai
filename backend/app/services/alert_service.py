from datetime import datetime
from sqlalchemy.orm import Session
from app.models.alert import Alert
from app.models.reading import Reading
from app.models.station import Station
from app.core.config import settings

class AlertService:
    @staticmethod
    def evaluate_reading_and_create_alerts(db: Session, reading: Reading, prediction_result: dict, station_name: str = None) -> list:
        """
        Evaluates a newly ingested water reading and creates actionable alerts if abnormal conditions exist.
        """
        alerts = []
        now = datetime.utcnow()
        thresholds = settings.THRESHOLDS
        
        # 1. Parameter Threshold Rule Engine
        param_checks = [
            ("ph", reading.ph, "pH Level"),
            ("turbidity", reading.turbidity, "Turbidity"),
            ("tds", reading.tds, "Total Dissolved Solids"),
            ("temperature", reading.temperature, "Water Temperature"),
            ("dissolved_oxygen", reading.dissolved_oxygen, "Dissolved Oxygen"),
            ("conductivity", reading.conductivity, "Electrical Conductivity")
        ]
        
        for param, val, name in param_checks:
            th = thresholds[param]
            unit = th["unit"]
            
            # Below minimum
            if val < th["min"]:
                severity = "CRITICAL" if (param == "dissolved_oxygen" and val < 3.0) or (param == "ph" and val < 6.0) else "WARNING"
                recom = AlertService._get_recommendation(param, "LOW", val)
                alert = Alert(
                    station_id=reading.station_id,
                    reading_id=reading.id,
                    timestamp=now,
                    severity=severity,
                    parameter=param,
                    alert_type="THRESHOLD_BREACH",
                    current_value=round(val, 2),
                    threshold_value=th["min"],
                    message=f"Critical Low {name} at {station_name or 'Station'}: {val:.2f} {unit} is below safe limit ({th['min']} {unit})",
                    recommendation=recom
                )
                alerts.append(alert)
                
            # Above maximum
            elif val > th["max"]:
                severity = "CRITICAL" if (param == "turbidity" and val > 12.0) or (param == "ph" and val > 9.5) or (param == "tds" and val > 1200) else "WARNING"
                recom = AlertService._get_recommendation(param, "HIGH", val)
                alert = Alert(
                    station_id=reading.station_id,
                    reading_id=reading.id,
                    timestamp=now,
                    severity=severity,
                    parameter=param,
                    alert_type="THRESHOLD_BREACH",
                    current_value=round(val, 2),
                    threshold_value=th["max"],
                    message=f"Elevated {name} at {station_name or 'Station'}: {val:.2f} {unit} exceeds threshold ({th['max']} {unit})",
                    recommendation=recom
                )
                alerts.append(alert)

        # 2. ML Anomaly Detection Alert
        if prediction_result.get("is_anomaly", False):
            alert = Alert(
                station_id=reading.station_id,
                reading_id=reading.id,
                timestamp=now,
                severity="CRITICAL" if prediction_result.get("anomaly_intensity", 0) > 75 else "WARNING",
                parameter="anomaly",
                alert_type="ANOMALY_DETECTED",
                current_value=prediction_result.get("anomaly_intensity"),
                threshold_value=50.0,
                message=f"ML Anomaly Detected at {station_name or 'Station'}: Isolation Forest identified abnormal telemetry pattern (Intensity: {prediction_result.get('anomaly_intensity', 0):.1f}%).",
                recommendation="Dispatch field inspection or calibrate sensors; multi-parameter vector indicates unusual contamination or sudden sensor drift."
            )
            alerts.append(alert)

        # 3. Potability Degradation Alert
        if prediction_result.get("potability_pred") == 0:
            alert = Alert(
                station_id=reading.station_id,
                reading_id=reading.id,
                timestamp=now,
                severity="CRITICAL",
                parameter="potability",
                alert_type="POTABILITY_DEGRADATION",
                current_value=round(prediction_result.get("potability_prob", 0) * 100, 1),
                threshold_value=50.0,
                message=f"Water Classified Non-Potable at {station_name or 'Station'} (Safe Probability: {prediction_result.get('potability_prob', 0)*100:.1f}%, WQI: {prediction_result.get('wqi', 0)}).",
                recommendation="Halt municipal distribution or issue boil water advisory until filtration and chlorination balance is restored."
            )
            alerts.append(alert)

        # Persist alerts to database
        if alerts:
            db.add_all(alerts)
            db.commit()
            for a in alerts:
                db.refresh(a)
                
        return alerts

    @staticmethod
    def _get_recommendation(param: str, direction: str, val: float) -> str:
        recom_map = {
            ("ph", "LOW"): "Water is acidic. Risk of pipe corrosion and heavy metal leaching. Dose alkaline buffer (lime / sodium carbonate).",
            ("ph", "HIGH"): "Water is alkaline. Risk of scaling and reduced chlorine disinfection efficiency. Adjust acid dosing.",
            ("turbidity", "HIGH"): "Suspended solids high. Inspect flocculation, coagulation dosage, and backwash sand filters.",
            ("tds", "HIGH"): "High dissolved solids. Check RO membrane flux, investigate upstream mineral or saline effluent.",
            ("dissolved_oxygen", "LOW"): "Severe hypoxia risk. Turn on aeration diffusers, mechanical splashers, and check biological oxygen demand (BOD).",
            ("conductivity", "HIGH"): "Elevated electrical conductivity. Investigate industrial discharge or saline intrusion.",
            ("temperature", "HIGH"): "Water temperature elevated. Monitor for toxic cyanobacterial blooms and dissolved oxygen reduction."
        }
        return recom_map.get((param, direction), "Monitor station closely and re-sample within 30 minutes.")

alert_service = AlertService()

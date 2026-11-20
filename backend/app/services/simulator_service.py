import random
import numpy as np
from datetime import datetime
from sqlalchemy.orm import Session
from app.models.station import Station
from app.models.reading import Reading
from app.ml.predictor import predictor
from app.services.alert_service import alert_service

class SensorSimulatorService:
    def __init__(self):
        self.is_running = False

    def generate_single_reading(self, db: Session, station_id: int, anomaly_type: str = None) -> dict:
        """
        Generates a realistic telemetry tick for a station, optionally injecting a specific anomaly event.
        Persists reading and generates real-time alerts.
        """
        station = db.query(Station).filter(Station.id == station_id).first()
        if not station:
            raise ValueError(f"Station with ID {station_id} does not exist.")

        # Baseline based on water body type
        water_type = station.water_body_type.lower()
        now = datetime.utcnow()
        hour = now.hour

        temp_diurnal = 2.0 * np.sin((hour - 9) * np.pi / 12)
        do_diurnal = 0.8 * np.sin((hour - 8) * np.pi / 12)

        if "treatment" in water_type:
            ph = round(float(np.random.normal(7.4, 0.1)), 2)
            turbidity = round(float(np.random.uniform(0.4, 1.8)), 2)
            tds = round(float(np.random.normal(170, 15)), 1)
            temp = round(float(18.5 + np.random.normal(0, 0.4)), 1)
            do = round(float(9.6 + np.random.normal(0, 0.3)), 2)
            cond = round(float(tds * 1.45 + np.random.normal(0, 5)), 1)
        elif "groundwater" in water_type:
            ph = round(float(np.random.normal(7.6, 0.12)), 2)
            turbidity = round(float(np.random.uniform(0.3, 1.2)), 2)
            tds = round(float(np.random.normal(470, 30)), 1)
            temp = round(float(15.5 + np.random.normal(0, 0.2)), 1)
            do = round(float(6.9 + np.random.normal(0, 0.3)), 2)
            cond = round(float(tds * 1.7 + np.random.normal(0, 10)), 1)
        elif "canal" in water_type or "industrial" in water_type:
            ph = round(float(np.random.normal(7.7, 0.25)), 2)
            turbidity = round(float(np.random.uniform(3.5, 6.8)), 2)
            tds = round(float(np.random.normal(510, 50)), 1)
            temp = round(float(23.5 + temp_diurnal + np.random.normal(0, 0.6)), 1)
            do = round(float(5.8 + do_diurnal + np.random.normal(0, 0.4)), 2)
            cond = round(float(tds * 1.65 + np.random.normal(0, 20)), 1)
        else: # River / Reservoir
            ph = round(float(np.random.normal(7.35, 0.18)), 2)
            turbidity = round(float(np.random.exponential(1.5) + 0.8), 2)
            tds = round(float(np.random.normal(210, 30)), 1)
            temp = round(float(20.0 + temp_diurnal + np.random.normal(0, 0.5)), 1)
            do = round(float(8.8 + do_diurnal + np.random.normal(0, 0.3)), 2)
            cond = round(float(tds * 1.55 + np.random.normal(0, 12)), 1)

        # Apply Injected Anomaly Overrides
        if anomaly_type == "ACID_SPILL":
            ph = round(float(np.random.uniform(3.8, 5.2)), 2)
            turbidity = round(float(turbidity * 2.2), 2)
            cond = round(float(cond * 1.8), 1)
        elif anomaly_type == "ALKALINE_SURGE":
            ph = round(float(np.random.uniform(9.6, 11.2)), 2)
            tds = round(float(tds * 1.7), 1)
        elif anomaly_type == "TURBIDITY_SPIKE":
            turbidity = round(float(np.random.uniform(14.5, 32.0)), 2) # Heavy runoff / mud
            do = round(float(max(2.5, do - 3.0)), 2)
        elif anomaly_type == "CHEMICAL_CONTAMINATION":
            tds = round(float(np.random.uniform(1200, 2200)), 1)
            cond = round(float(np.random.uniform(2200, 3800)), 1)
            do = round(float(np.random.uniform(1.2, 3.2)), 2)
            ph = round(float(np.random.choice([5.2, 9.8])), 2)
        elif anomaly_type == "OXYGEN_DEPLETION":
            do = round(float(np.random.uniform(0.8, 2.4)), 2) # Severe hypoxia / fish kill risk
            turbidity = round(float(turbidity * 1.8), 2)

        reading_dict = {
            "ph": ph,
            "turbidity": turbidity,
            "tds": tds,
            "temperature": temp,
            "dissolved_oxygen": do,
            "conductivity": cond
        }

        # ML Inference
        pred = predictor.predict(reading_dict)

        reading = Reading(
            station_id=station.id,
            timestamp=now,
            ph=ph,
            turbidity=turbidity,
            tds=tds,
            temperature=temp,
            dissolved_oxygen=do,
            conductivity=cond,
            wqi=pred["wqi"],
            wqi_status=pred["wqi_status"],
            potability_pred=pred["potability_pred"],
            potability_prob=pred["potability_prob"],
            is_anomaly=pred["is_anomaly"],
            anomaly_score=pred["anomaly_score"],
            source="simulated_iot" if not anomaly_type else f"simulated_anomaly_{anomaly_type.lower()}"
        )
        db.add(reading)
        db.commit()
        db.refresh(reading)

        # Trigger alert evaluation
        created_alerts = alert_service.evaluate_reading_and_create_alerts(db, reading, pred, station.name)

        return {
            "reading": reading,
            "prediction": pred,
            "alerts_generated": [
                {
                    "id": a.id,
                    "severity": a.severity,
                    "parameter": a.parameter,
                    "alert_type": a.alert_type,
                    "message": a.message,
                    "recommendation": a.recommendation
                }
                for a in created_alerts
            ]
        }

simulator_service = SensorSimulatorService()

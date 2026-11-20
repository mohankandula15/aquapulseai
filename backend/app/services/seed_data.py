import random
import numpy as np
from datetime import datetime, timedelta
from sqlalchemy.orm import Session
from app.models.station import Station
from app.models.reading import Reading
from app.models.alert import Alert
from app.ml.predictor import predictor
from app.services.alert_service import alert_service

def seed_database_if_empty(db: Session):
    """
    Seeds default monitoring stations and 14 days of realistic chronological telemetry.
    Includes normal operations, diurnal cycles, and historical anomaly events.
    """
    station_count = db.query(Station).count()
    if station_count > 0:
        print(f"[Seed] Database already has {station_count} stations. Skipping seed.")
        return

    print("[Seed] Seeding monitoring stations and historical telemetry...")
    
    stations_data = [
        {
            "name": "Station Alpha - Clear Lake Reservoir",
            "code": "STN-RES-01",
            "location": "North Basin, Clear Lake",
            "latitude": 37.7749,
            "longitude": -122.4194,
            "water_body_type": "Reservoir",
            "description": "Primary drinking water reservoir supplying North Municipal District.",
            "profile": "clean"
        },
        {
            "name": "Station Beta - Pine River Intake",
            "code": "STN-RIV-02",
            "location": "Pine River Mile 14 Intake Point",
            "latitude": 37.8044,
            "longitude": -122.2712,
            "water_body_type": "River",
            "description": "Upstream river intake prone to seasonal agricultural runoff and turbidity spikes.",
            "profile": "variable"
        },
        {
            "name": "Station Gamma - Metro Treatment Plant",
            "code": "STN-WTP-03",
            "location": "Central Finishing Filtration Facility",
            "latitude": 37.6879,
            "longitude": -122.4702,
            "water_body_type": "Treatment Plant",
            "description": "Final post-chlorination and filtration monitoring checkpoint before distribution.",
            "profile": "controlled"
        },
        {
            "name": "Station Delta - Industrial Outfall Canal",
            "code": "STN-IND-04",
            "location": "Canal Reach 3, South Industrial Corridor",
            "latitude": 37.8715,
            "longitude": -122.2730,
            "water_body_type": "Canal",
            "description": "Monitors industrial effluent and stormwater discharge with automated early warning alerts.",
            "profile": "industrial"
        },
        {
            "name": "Station Epsilon - Highland Aquifer Well #4",
            "code": "STN-GW-05",
            "location": "Highland Valley Deep Aquifer",
            "latitude": 37.5485,
            "longitude": -122.3186,
            "water_body_type": "Groundwater",
            "description": "Subterranean aquifer well with steady thermal profile and high dissolved mineral content.",
            "profile": "groundwater"
        }
    ]

    created_stations = []
    for s_info in stations_data:
        profile = s_info.pop("profile")
        station = Station(**s_info)
        db.add(station)
        db.flush()
        db.refresh(station)
        created_stations.append((station, profile))

    now = datetime.utcnow()
    # Generate 14 days of data with 2-hour sample intervals (168 samples per station)
    sample_intervals = 168
    total_readings = []
    
    print(f"[Seed] Generating {sample_intervals} historical telemetry samples per station...")
    
    for station, profile in created_stations:
        for i in range(sample_intervals, 0, -1):
            ts = now - timedelta(hours=i * 2)
            hour_of_day = ts.hour
            
            # Diurnal rhythms
            temp_diurnal = 2.0 * np.sin((hour_of_day - 9) * np.pi / 12)
            do_diurnal = 0.8 * np.sin((hour_of_day - 8) * np.pi / 12)
            
            # Profile-specific baseline physics
            if profile == "clean":
                ph = round(float(np.random.normal(7.35, 0.15)), 2)
                turbidity = round(float(np.random.exponential(1.1) + 0.5), 2)
                tds = round(float(np.random.normal(190, 20)), 1)
                temp = round(float(19.5 + temp_diurnal + np.random.normal(0, 0.5)), 1)
                do = round(float(9.2 + do_diurnal - (temp - 20) * 0.1 + np.random.normal(0, 0.2)), 2)
                cond = round(float(tds * 1.5 + np.random.normal(0, 10)), 1)
                
            elif profile == "variable":
                # Simulated storm runoff event around 3-4 days ago (i between 36 and 48)
                is_storm_event = 36 <= i <= 48
                if is_storm_event:
                    ph = round(float(np.random.normal(6.3, 0.2)), 2)
                    turbidity = round(float(np.random.uniform(9.5, 18.0)), 2) # Spike!
                    tds = round(float(np.random.normal(420, 50)), 1)
                    temp = round(float(17.5 + np.random.normal(0, 0.5)), 1)
                    do = round(float(np.random.uniform(5.1, 6.2)), 2)
                    cond = round(float(tds * 1.6 + 50), 1)
                else:
                    ph = round(float(np.random.normal(7.2, 0.2)), 2)
                    turbidity = round(float(np.random.exponential(2.2) + 1.2), 2)
                    tds = round(float(np.random.normal(260, 35)), 1)
                    temp = round(float(20.0 + temp_diurnal + np.random.normal(0, 0.6)), 1)
                    do = round(float(8.4 + do_diurnal + np.random.normal(0, 0.3)), 2)
                    cond = round(float(tds * 1.55 + np.random.normal(0, 15)), 1)

            elif profile == "controlled":
                # Municipal treated water: high precision, stable
                ph = round(float(np.random.normal(7.4, 0.08)), 2)
                turbidity = round(float(np.random.uniform(0.3, 1.4)), 2)
                tds = round(float(np.random.normal(160, 12)), 1)
                temp = round(float(18.0 + np.random.normal(0, 0.3)), 1)
                do = round(float(9.8 + np.random.normal(0, 0.2)), 2)
                cond = round(float(tds * 1.45 + np.random.normal(0, 5)), 1)

            elif profile == "industrial":
                # Industrial canal: higher conductivity & TDS, occasional chemical anomaly
                is_chemical_flush = 12 <= i <= 18
                if is_chemical_flush:
                    ph = round(float(np.random.uniform(9.4, 10.6)), 2) # Severe alkaline spike
                    turbidity = round(float(np.random.uniform(14.0, 26.0)), 2)
                    tds = round(float(np.random.uniform(1100, 1650)), 1) # High TDS
                    temp = round(float(28.0 + np.random.normal(0, 1.0)), 1)
                    do = round(float(np.random.uniform(1.8, 3.2)), 2) # Severe Hypoxia
                    cond = round(float(tds * 1.8 + np.random.normal(0, 40)), 1)
                else:
                    ph = round(float(np.random.normal(7.8, 0.3)), 2)
                    turbidity = round(float(np.random.uniform(3.5, 7.5)), 2)
                    tds = round(float(np.random.normal(520, 60)), 1)
                    temp = round(float(23.0 + temp_diurnal + np.random.normal(0, 0.7)), 1)
                    do = round(float(5.6 + do_diurnal + np.random.normal(0, 0.4)), 2)
                    cond = round(float(tds * 1.65 + np.random.normal(0, 20)), 1)

            elif profile == "groundwater":
                # Deep well: constant temp ~15.5C, high natural minerals/conductivity, low turbidity
                ph = round(float(np.random.normal(7.6, 0.1)), 2)
                turbidity = round(float(np.random.uniform(0.2, 1.1)), 2)
                tds = round(float(np.random.normal(480, 25)), 1)
                temp = round(float(15.5 + np.random.normal(0, 0.2)), 1)
                do = round(float(6.8 + np.random.normal(0, 0.3)), 2)
                cond = round(float(tds * 1.7 + np.random.normal(0, 10)), 1)

            reading_dict = {
                "ph": ph,
                "turbidity": turbidity,
                "tds": tds,
                "temperature": temp,
                "dissolved_oxygen": do,
                "conductivity": cond
            }
            
            # Run ML prediction & anomaly detection
            pred = predictor.predict(reading_dict)
            
            reading = Reading(
                station_id=station.id,
                timestamp=ts,
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
                source="sensor"
            )
            db.add(reading)
            db.flush()
            
            # If recent (within past 5 days) and has violations, generate alert records
            if i <= 60 and (pred["is_anomaly"] or pred["potability_pred"] == 0 or ph < 6.5 or ph > 8.5 or turbidity > 5.0 or do < 5.0):
                # Acknowledge older alerts, keep very recent unacknowledged
                alerts = alert_service.evaluate_reading_and_create_alerts(db, reading, pred, station.name)
                for a in alerts:
                    if i > 8: # Acknowledge alerts older than 16 hours
                        a.is_acknowledged = True
                        a.acknowledged_by = "Duty Environmental Chemist"
                        a.acknowledged_at = ts + timedelta(minutes=45)
                        db.add(a)

    db.commit()
    print("[Seed] Successfully seeded database with monitoring stations, telemetry, and alerts.")

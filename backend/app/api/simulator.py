from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import Optional, List
from pydantic import BaseModel
from app.core.database import get_db
from app.models.station import Station
from app.services.simulator_service import simulator_service

router = APIRouter(prefix="/simulator", tags=["IoT Simulator"])

class InjectAnomalyRequest(BaseModel):
    station_id: int
    anomaly_type: str # ACID_SPILL, ALKALINE_SURGE, TURBIDITY_SPIKE, CHEMICAL_CONTAMINATION, OXYGEN_DEPLETION

@router.post("/tick")
def trigger_telemetry_tick(
    station_id: Optional[int] = Query(None, description="Generate for specific station or all if omitted"),
    db: Session = Depends(get_db)
):
    """
    Simulates real-time IoT sensor telemetry generation.
    """
    if station_id:
        station = db.query(Station).filter(Station.id == station_id).first()
        if not station:
            raise HTTPException(status_code=404, detail="Station not found")
        result = simulator_service.generate_single_reading(db, station_id)
        return {
            "status": "success",
            "station": station.name,
            "reading_id": result["reading"].id,
            "potability_pred": result["prediction"]["potability_pred"],
            "wqi": result["prediction"]["wqi"],
            "is_anomaly": result["prediction"]["is_anomaly"],
            "alerts_generated": len(result["alerts_generated"])
        }
    else:
        stations = db.query(Station).all()
        ticks = []
        for s in stations:
            res = simulator_service.generate_single_reading(db, s.id)
            ticks.append({
                "station_id": s.id,
                "station_name": s.name,
                "reading_id": res["reading"].id,
                "potability": res["prediction"]["potability_pred"],
                "wqi": res["prediction"]["wqi"],
                "is_anomaly": res["prediction"]["is_anomaly"],
                "alerts": len(res["alerts_generated"])
            })
        return {
            "status": "success",
            "message": f"Generated telemetry ticks for {len(ticks)} stations",
            "stations_updated": ticks
        }

@router.post("/inject-anomaly")
def inject_anomaly_event(req: InjectAnomalyRequest, db: Session = Depends(get_db)):
    """
    Injects a severe environmental or chemical contamination event to test early warning detection.
    Types: ACID_SPILL, ALKALINE_SURGE, TURBIDITY_SPIKE, CHEMICAL_CONTAMINATION, OXYGEN_DEPLETION
    """
    valid_types = ["ACID_SPILL", "ALKALINE_SURGE", "TURBIDITY_SPIKE", "CHEMICAL_CONTAMINATION", "OXYGEN_DEPLETION"]
    if req.anomaly_type not in valid_types:
        raise HTTPException(status_code=400, detail=f"Invalid anomaly_type. Must be one of: {valid_types}")
        
    result = simulator_service.generate_single_reading(db, req.station_id, req.anomaly_type)
    
    return {
        "status": "injected",
        "anomaly_type": req.anomaly_type,
        "reading_id": result["reading"].id,
        "parameters": {
            "ph": result["reading"].ph,
            "turbidity": result["reading"].turbidity,
            "tds": result["reading"].tds,
            "dissolved_oxygen": result["reading"].dissolved_oxygen,
            "conductivity": result["reading"].conductivity
        },
        "ml_inference": {
            "potability_label": result["prediction"]["potability_label"],
            "potability_prob": result["prediction"]["potability_prob"],
            "is_anomaly": result["prediction"]["is_anomaly"],
            "anomaly_intensity": result["prediction"]["anomaly_intensity"],
            "wqi": result["prediction"]["wqi"]
        },
        "alerts_triggered": result["alerts_generated"]
    }

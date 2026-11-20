from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import List, Optional
from datetime import datetime, timedelta
from app.core.database import get_db
from app.models.reading import Reading
from app.models.station import Station
from app.schemas.reading import ReadingOut, ReadingCreate
from app.ml.predictor import predictor
from app.services.alert_service import alert_service

router = APIRouter(prefix="/readings", tags=["Readings"])

@router.get("", response_model=List[ReadingOut])
def get_readings(
    station_id: Optional[int] = Query(None, description="Filter by station ID"),
    hours: Optional[int] = Query(72, description="Get readings for the last N hours"),
    limit: Optional[int] = Query(500, description="Max records to return"),
    anomalies_only: Optional[bool] = Query(False, description="Filter only anomalous readings"),
    db: Session = Depends(get_db)
):
    query = db.query(Reading)
    
    if station_id:
        query = query.filter(Reading.station_id == station_id)
        
    if hours:
        since = datetime.utcnow() - timedelta(hours=hours)
        query = query.filter(Reading.timestamp >= since)
        
    if anomalies_only:
        query = query.filter(Reading.is_anomaly == True)
        
    # Return chronologically ascending for convenient charting
    readings = query.order_by(Reading.timestamp.asc()).limit(limit).all()
    return readings

@router.get("/latest")
def get_latest_readings(
    station_id: Optional[int] = Query(None),
    db: Session = Depends(get_db)
):
    if station_id:
        reading = db.query(Reading).filter(Reading.station_id == station_id).order_by(Reading.timestamp.desc()).first()
        if not reading:
            raise HTTPException(status_code=404, detail="No readings found for this station")
        return reading
        
    # Latest reading per station
    stations = db.query(Station).all()
    results = {}
    for s in stations:
        latest = db.query(Reading).filter(Reading.station_id == s.id).order_by(Reading.timestamp.desc()).first()
        if latest:
            results[s.id] = latest
    return results

@router.post("", response_model=ReadingOut)
def ingest_reading(reading_in: ReadingCreate, db: Session = Depends(get_db)):
    station = db.query(Station).filter(Station.id == reading_in.station_id).first()
    if not station:
        raise HTTPException(status_code=404, detail="Station not found")
        
    # Run ML prediction & Anomaly detection
    sample_data = {
        "ph": reading_in.ph,
        "turbidity": reading_in.turbidity,
        "tds": reading_in.tds,
        "temperature": reading_in.temperature,
        "dissolved_oxygen": reading_in.dissolved_oxygen,
        "conductivity": reading_in.conductivity
    }
    pred = predictor.predict(sample_data)
    
    reading = Reading(
        station_id=reading_in.station_id,
        timestamp=datetime.utcnow(),
        ph=reading_in.ph,
        turbidity=reading_in.turbidity,
        tds=reading_in.tds,
        temperature=reading_in.temperature,
        dissolved_oxygen=reading_in.dissolved_oxygen,
        conductivity=reading_in.conductivity,
        wqi=pred["wqi"],
        wqi_status=pred["wqi_status"],
        potability_pred=pred["potability_pred"],
        potability_prob=pred["potability_prob"],
        is_anomaly=pred["is_anomaly"],
        anomaly_score=pred["anomaly_score"],
        source=reading_in.source or "manual",
        notes=reading_in.notes
    )
    db.add(reading)
    db.commit()
    db.refresh(reading)
    
    # Evaluate alerts
    alert_service.evaluate_reading_and_create_alerts(db, reading, pred, station.name)
    
    return reading

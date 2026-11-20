from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from typing import List, Dict, Any
from app.core.database import get_db
from app.models.reading import Reading
from app.models.station import Station

router = APIRouter(prefix="/anomalies", tags=["Anomalies"])

@router.get("")
def get_anomalies(
    station_id: int = Query(None),
    limit: int = Query(50, ge=1, le=200),
    db: Session = Depends(get_db)
):
    """
    Returns recent anomalous sensor readings identified by the ML Isolation Forest.
    """
    query = db.query(Reading).filter(Reading.is_anomaly == True)
    if station_id:
        query = query.filter(Reading.station_id == station_id)
        
    records = query.order_by(Reading.timestamp.desc()).limit(limit).all()
    
    results = []
    for r in records:
        station = db.query(Station).filter(Station.id == r.station_id).first()
        results.append({
            "id": r.id,
            "station_id": r.station_id,
            "station_name": station.name if station else "Unknown",
            "timestamp": r.timestamp.isoformat(),
            "anomaly_score": r.anomaly_score,
            "wqi": r.wqi,
            "wqi_status": r.wqi_status,
            "potability_pred": r.potability_pred,
            "potability_prob": r.potability_prob,
            "ph": r.ph,
            "turbidity": r.turbidity,
            "tds": r.tds,
            "temperature": r.temperature,
            "dissolved_oxygen": r.dissolved_oxygen,
            "conductivity": r.conductivity,
            "source": r.source
        })
    return results

@router.get("/summary")
def get_anomaly_summary(db: Session = Depends(get_db)):
    """
    Returns high-level anomaly statistics.
    """
    total_readings = db.query(Reading).count()
    total_anomalies = db.query(Reading).filter(Reading.is_anomaly == True).count()
    
    # Anomaly rate
    rate = round((total_anomalies / total_readings * 100), 2) if total_readings > 0 else 0.0
    
    # Anomalies by station
    stations = db.query(Station).all()
    station_breakdown = []
    for s in stations:
        cnt = db.query(Reading).filter(
            Reading.station_id == s.id,
            Reading.is_anomaly == True
        ).count()
        station_breakdown.append({
            "station_id": s.id,
            "station_name": s.name,
            "anomaly_count": cnt
        })
        
    return {
        "total_readings": total_readings,
        "total_anomalies": total_anomalies,
        "anomaly_rate_percentage": rate,
        "station_breakdown": station_breakdown
    }

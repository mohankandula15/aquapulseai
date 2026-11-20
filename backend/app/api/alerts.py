from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import List, Optional
from datetime import datetime
from app.core.database import get_db
from app.models.alert import Alert
from app.models.station import Station
from app.schemas.alert import AlertOut, AlertAcknowledgeRequest

router = APIRouter(prefix="/alerts", tags=["Alerts"])

@router.get("", response_model=List[AlertOut])
def get_alerts(
    station_id: Optional[int] = Query(None),
    severity: Optional[str] = Query(None),
    acknowledged: Optional[bool] = Query(None),
    limit: int = Query(100, ge=1, le=500),
    db: Session = Depends(get_db)
):
    query = db.query(Alert)
    
    if station_id:
        query = query.filter(Alert.station_id == station_id)
    if severity:
        query = query.filter(Alert.severity == severity.upper())
    if acknowledged is not None:
        query = query.filter(Alert.is_acknowledged == acknowledged)
        
    alerts = query.order_by(Alert.timestamp.desc()).limit(limit).all()
    
    # Attach station names
    results = []
    for a in alerts:
        station = db.query(Station).filter(Station.id == a.station_id).first()
        out = AlertOut(
            id=a.id,
            station_id=a.station_id,
            reading_id=a.reading_id,
            station_name=station.name if station else "Unknown",
            timestamp=a.timestamp,
            severity=a.severity,
            parameter=a.parameter,
            alert_type=a.alert_type,
            current_value=a.current_value,
            threshold_value=a.threshold_value,
            message=a.message,
            recommendation=a.recommendation,
            is_acknowledged=a.is_acknowledged,
            acknowledged_by=a.acknowledged_by,
            acknowledged_at=a.acknowledged_at
        )
        results.append(out)
        
    return results

@router.post("/{alert_id}/acknowledge", response_model=AlertOut)
def acknowledge_alert(
    alert_id: int,
    req: AlertAcknowledgeRequest,
    db: Session = Depends(get_db)
):
    alert = db.query(Alert).filter(Alert.id == alert_id).first()
    if not alert:
        raise HTTPException(status_code=404, detail="Alert not found")
        
    alert.is_acknowledged = True
    alert.acknowledged_by = req.acknowledged_by
    alert.acknowledged_at = datetime.utcnow()
    db.commit()
    db.refresh(alert)
    
    station = db.query(Station).filter(Station.id == alert.station_id).first()
    return AlertOut(
        id=alert.id,
        station_id=alert.station_id,
        reading_id=alert.reading_id,
        station_name=station.name if station else "Unknown",
        timestamp=alert.timestamp,
        severity=alert.severity,
        parameter=alert.parameter,
        alert_type=alert.alert_type,
        current_value=alert.current_value,
        threshold_value=alert.threshold_value,
        message=alert.message,
        recommendation=alert.recommendation,
        is_acknowledged=alert.is_acknowledged,
        acknowledged_by=alert.acknowledged_by,
        acknowledged_at=alert.acknowledged_at
    )

@router.post("/acknowledge-all")
def acknowledge_all_alerts(
    req: AlertAcknowledgeRequest,
    station_id: Optional[int] = Query(None),
    db: Session = Depends(get_db)
):
    query = db.query(Alert).filter(Alert.is_acknowledged == False)
    if station_id:
        query = query.filter(Alert.station_id == station_id)
        
    unack_alerts = query.all()
    now = datetime.utcnow()
    for a in unack_alerts:
        a.is_acknowledged = True
        a.acknowledged_by = req.acknowledged_by
        a.acknowledged_at = now
        
    db.commit()
    return {
        "status": "success",
        "acknowledged_count": len(unack_alerts),
        "acknowledged_by": req.acknowledged_by
    }

@router.get("/summary")
def get_alerts_summary(db: Session = Depends(get_db)):
    active_critical = db.query(Alert).filter(Alert.is_acknowledged == False, Alert.severity == "CRITICAL").count()
    active_warning = db.query(Alert).filter(Alert.is_acknowledged == False, Alert.severity == "WARNING").count()
    total_unack = active_critical + active_warning
    total_all = db.query(Alert).count()
    
    return {
        "active_critical": active_critical,
        "active_warning": active_warning,
        "total_active": total_unack,
        "total_historical": total_all
    }

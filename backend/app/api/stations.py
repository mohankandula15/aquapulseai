from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from app.core.database import get_db
from app.models.station import Station
from app.models.reading import Reading
from app.models.alert import Alert
from app.schemas.station import StationOut, StationCreate, StationCardSummary

router = APIRouter(prefix="/stations", tags=["Stations"])

@router.get("", response_model=List[StationCardSummary])
def get_stations(db: Session = Depends(get_db)):
    stations = db.query(Station).all()
    results = []
    
    for s in stations:
        latest = db.query(Reading).filter(Reading.station_id == s.id).order_by(Reading.timestamp.desc()).first()
        active_alerts_cnt = db.query(Alert).filter(
            Alert.station_id == s.id,
            Alert.is_acknowledged == False
        ).count()
        
        card = StationCardSummary(
            id=s.id,
            name=s.name,
            code=s.code,
            location=s.location,
            latitude=s.latitude,
            longitude=s.longitude,
            water_body_type=s.water_body_type,
            description=s.description,
            is_active=s.is_active,
            created_at=s.created_at,
            latest_reading={
                "id": latest.id,
                "timestamp": latest.timestamp.isoformat(),
                "ph": latest.ph,
                "turbidity": latest.turbidity,
                "tds": latest.tds,
                "temperature": latest.temperature,
                "dissolved_oxygen": latest.dissolved_oxygen,
                "conductivity": latest.conductivity
            } if latest else None,
            latest_wqi=latest.wqi if latest else None,
            latest_wqi_status=latest.wqi_status if latest else None,
            latest_potability=latest.potability_pred if latest else None,
            active_alerts_count=active_alerts_cnt,
            has_anomaly=bool(latest.is_anomaly) if latest else False
        )
        results.append(card)
        
    return results

@router.get("/{station_id}", response_model=StationOut)
def get_station_detail(station_id: int, db: Session = Depends(get_db)):
    station = db.query(Station).filter(Station.id == station_id).first()
    if not station:
        raise HTTPException(status_code=404, detail="Station not found")
    return station

@router.post("", response_model=StationOut)
def create_station(station_in: StationCreate, db: Session = Depends(get_db)):
    existing = db.query(Station).filter((Station.name == station_in.name) | (Station.code == station_in.code)).first()
    if existing:
        raise HTTPException(status_code=400, detail="Station with this name or code already exists")
    station = Station(**station_in.dict())
    db.add(station)
    db.commit()
    db.refresh(station)
    return station

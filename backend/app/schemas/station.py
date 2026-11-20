from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime

class StationBase(BaseModel):
    name: str
    code: str
    location: str
    latitude: float
    longitude: float
    water_body_type: str = "River"
    description: Optional[str] = None
    is_active: bool = True

class StationCreate(StationBase):
    pass

class StationOut(StationBase):
    id: int
    created_at: datetime

    class Config:
        from_attributes = True

class StationCardSummary(StationOut):
    latest_reading: Optional[dict] = None
    latest_wqi: Optional[float] = None
    latest_wqi_status: Optional[str] = None
    latest_potability: Optional[int] = None
    active_alerts_count: int = 0
    has_anomaly: bool = False

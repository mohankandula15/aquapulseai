from pydantic import BaseModel
from typing import Optional
from datetime import datetime

class AlertOut(BaseModel):
    id: int
    station_id: int
    reading_id: Optional[int] = None
    station_name: Optional[str] = None
    timestamp: datetime
    severity: str
    parameter: str
    alert_type: str
    current_value: Optional[float] = None
    threshold_value: Optional[float] = None
    message: str
    recommendation: Optional[str] = None
    is_acknowledged: bool
    acknowledged_by: Optional[str] = None
    acknowledged_at: Optional[datetime] = None

    class Config:
        from_attributes = True

class AlertAcknowledgeRequest(BaseModel):
    acknowledged_by: str = "Operator"

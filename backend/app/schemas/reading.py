from pydantic import BaseModel, Field
from typing import Optional
from datetime import datetime

class ReadingBase(BaseModel):
    station_id: int
    ph: float = Field(..., ge=0.0, le=14.0, description="pH Level (0-14)")
    turbidity: float = Field(..., ge=0.0, description="Turbidity in NTU")
    tds: float = Field(..., ge=0.0, description="Total Dissolved Solids in mg/L")
    temperature: float = Field(..., description="Water Temperature in °C")
    dissolved_oxygen: float = Field(..., ge=0.0, description="Dissolved Oxygen in mg/L")
    conductivity: float = Field(..., ge=0.0, description="Conductivity in µS/cm")
    source: Optional[str] = "sensor"
    notes: Optional[str] = None

class ReadingCreate(ReadingBase):
    pass

class ReadingOut(ReadingBase):
    id: int
    timestamp: datetime
    wqi: Optional[float] = None
    wqi_status: Optional[str] = None
    potability_pred: Optional[int] = 1
    potability_prob: Optional[float] = 0.5
    is_anomaly: Optional[bool] = False
    anomaly_score: Optional[float] = 0.0

    class Config:
        from_attributes = True

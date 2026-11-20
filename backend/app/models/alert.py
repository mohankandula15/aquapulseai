from sqlalchemy import Column, Integer, Float, String, Boolean, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from datetime import datetime
from app.core.database import Base

class Alert(Base):
    __tablename__ = "alerts"

    id = Column(Integer, primary_key=True, index=True)
    station_id = Column(Integer, ForeignKey("stations.id", ondelete="CASCADE"), nullable=False, index=True)
    reading_id = Column(Integer, ForeignKey("readings.id", ondelete="SET NULL"), nullable=True)
    timestamp = Column(DateTime, default=datetime.utcnow, index=True)
    
    severity = Column(String(20), nullable=False) # CRITICAL, WARNING, INFO
    parameter = Column(String(50), nullable=False) # ph, turbidity, tds, dissolved_oxygen, conductivity, anomaly, forecast
    alert_type = Column(String(50), nullable=False) # THRESHOLD_BREACH, ANOMALY_DETECTED, RAPID_DROP, FORECAST_BREACH
    
    current_value = Column(Float, nullable=True)
    threshold_value = Column(Float, nullable=True)
    
    message = Column(String(500), nullable=False)
    recommendation = Column(String(500), nullable=True)
    
    is_acknowledged = Column(Boolean, default=False)
    acknowledged_by = Column(String(100), nullable=True)
    acknowledged_at = Column(DateTime, nullable=True)

    station = relationship("Station", back_populates="alerts")
    reading = relationship("Reading", back_populates="alerts")

from sqlalchemy import Column, Integer, Float, String, Boolean, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from datetime import datetime
from app.core.database import Base

class Reading(Base):
    __tablename__ = "readings"

    id = Column(Integer, primary_key=True, index=True)
    station_id = Column(Integer, ForeignKey("stations.id", ondelete="CASCADE"), nullable=False, index=True)
    timestamp = Column(DateTime, default=datetime.utcnow, index=True)
    
    # Core Sensor Measurements
    ph = Column(Float, nullable=False)
    turbidity = Column(Float, nullable=False) # in NTU
    tds = Column(Float, nullable=False) # in mg/L
    temperature = Column(Float, nullable=False) # in °C
    dissolved_oxygen = Column(Float, nullable=False) # in mg/L
    conductivity = Column(Float, nullable=False) # in µS/cm
    
    # ML & Analytics Inferences
    wqi = Column(Float, nullable=True) # Water Quality Index (0-100)
    wqi_status = Column(String(50), nullable=True) # Excellent, Good, Poor, Very Poor, Unsuitable
    potability_pred = Column(Integer, default=1) # 1 = Safe / Potable, 0 = Unsafe / Non-Potable
    potability_prob = Column(Float, default=0.5) # ML Confidence (0.0 - 1.0)
    is_anomaly = Column(Boolean, default=False)
    anomaly_score = Column(Float, default=0.0) # Isolation Forest / distance score
    
    source = Column(String(50), default="sensor") # sensor, simulated, manual, batch_upload
    notes = Column(String(255), nullable=True)

    station = relationship("Station", back_populates="readings")
    alerts = relationship("Alert", back_populates="reading")

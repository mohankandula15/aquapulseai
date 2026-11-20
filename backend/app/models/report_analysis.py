from sqlalchemy import Column, Integer, String, Float, Boolean, DateTime, Text, JSON
from datetime import datetime
from app.core.database import Base

class ReportAnalysis(Base):
    __tablename__ = "report_analyses"

    id = Column(Integer, primary_key=True, index=True)
    filename = Column(String(255), nullable=False)
    file_type = Column(String(50), nullable=True, default="pdf")
    file_size = Column(Integer, nullable=True, default=0)
    intended_use = Column(String(50), nullable=False, default="drinking")
    
    # Metadata (Lab name, sample date, collection location, etc.)
    sample_metadata = Column(JSON, nullable=True, default={})
    
    # Extracted parameters and evaluations
    extracted_parameters = Column(JSON, nullable=False, default={})
    evaluated_parameters = Column(JSON, nullable=False, default={})
    
    # Core Assessment
    wqi_score = Column(Float, nullable=True)
    overall_quality = Column(String(50), nullable=False, default="Moderate") # Good, Moderate, Poor
    risk_level = Column(String(50), nullable=False, default="Moderate Risk") # Low Risk, Moderate Risk, High Risk, Severe Hazard
    safety_category = Column(String(100), nullable=False, default="Needs Attention") # Safe or Within Reference Limits, Needs Attention, Potentially Unsafe
    potability_pred = Column(Integer, nullable=True) # 0 or 1 from Random Forest
    potability_probability = Column(Float, nullable=True)
    
    # Plain Language AI Explanations & Actionable Advice
    ai_explanation = Column(Text, nullable=False)
    potential_risks = Column(JSON, nullable=True, default=[])
    recommendations = Column(JSON, nullable=True, default={})
    missing_critical_tests = Column(JSON, nullable=True, default=[])
    
    # Flags and timestamps
    is_verified_by_user = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)

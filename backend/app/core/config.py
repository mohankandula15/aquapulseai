import os
from pydantic import BaseModel

class Settings(BaseModel):
    PROJECT_NAME: str = "ML-Based Intelligent Water Quality Monitoring and Early Warning System"
    API_V1_STR: str = "/api"
    
    # Database - Default to SQLite for zero-config out of the box,
    # or set DATABASE_URL (e.g. postgresql://user:pass@localhost:5432/watermonitor)
    DATABASE_URL: str = os.getenv("DATABASE_URL", "sqlite:///./watermonitor.db")
    
    # ML Model directory
    MODEL_DIR: str = os.path.join(os.path.dirname(os.path.dirname(__file__)), "ml", "saved_models")
    
    # Safe Water Thresholds (WHO / EPA standard guidelines)
    THRESHOLDS: dict = {
        "ph": {"min": 6.5, "max": 8.5, "unit": "pH", "name": "pH Level"},
        "turbidity": {"min": 0.0, "max": 5.0, "unit": "NTU", "name": "Turbidity"},
        "tds": {"min": 50.0, "max": 500.0, "unit": "mg/L", "name": "Total Dissolved Solids"},
        "temperature": {"min": 10.0, "max": 30.0, "unit": "°C", "name": "Temperature"},
        "dissolved_oxygen": {"min": 5.0, "max": 14.0, "unit": "mg/L", "name": "Dissolved Oxygen"},
        "conductivity": {"min": 50.0, "max": 800.0, "unit": "µS/cm", "name": "Conductivity"}
    }
    
    # WQI parameter ideal and standard values for Weighted Arithmetic WQI method
    WQI_STANDARDS: dict = {
        "ph": {"standard": 8.5, "ideal": 7.0, "weight": 4},
        "turbidity": {"standard": 5.0, "ideal": 0.0, "weight": 3},
        "tds": {"standard": 500.0, "ideal": 0.0, "weight": 4},
        "temperature": {"standard": 25.0, "ideal": 20.0, "weight": 2},
        "dissolved_oxygen": {"standard": 5.0, "ideal": 14.6, "weight": 5},
        "conductivity": {"standard": 500.0, "ideal": 0.0, "weight": 3}
    }

settings = Settings()

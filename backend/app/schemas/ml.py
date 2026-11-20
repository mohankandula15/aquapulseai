from pydantic import BaseModel, Field
from typing import List, Dict, Any, Optional

class WaterSampleInput(BaseModel):
    ph: float = Field(..., ge=0.0, le=14.0, example=7.2)
    turbidity: float = Field(..., ge=0.0, example=2.1)
    tds: float = Field(..., ge=0.0, example=220.0)
    temperature: float = Field(..., example=21.5)
    dissolved_oxygen: float = Field(..., ge=0.0, example=8.5)
    conductivity: float = Field(..., ge=0.0, example=340.0)

class FeatureAttribution(BaseModel):
    feature: str
    label: str
    unit: str
    value: float
    attribution_score: float
    percentage_impact: float
    status: str
    narrative: str
    importance_rank: float
    threshold: Dict[str, Any]

class ExplainabilityData(BaseModel):
    baseline_probability: float
    final_probability: float
    net_shift: float
    attributions: List[FeatureAttribution]

class PredictionResponse(BaseModel):
    potability_pred: int
    potability_prob: float
    potability_label: str
    is_anomaly: bool
    anomaly_score: float
    anomaly_intensity: float
    wqi: float
    wqi_status: str
    explainability: ExplainabilityData
    input_parameters: Dict[str, float]

class ForecastBreachWarning(BaseModel):
    parameter: str
    parameter_name: str
    unit: str
    hours_ahead: int
    estimated_time: str
    predicted_value: float
    threshold_limit: float
    direction: str
    severity: str
    recommendation: str

class ForecastResponse(BaseModel):
    station_id: int
    station_name: str
    forecast_generated_at: str
    horizon_hours: int
    forecasts: Dict[str, List[Dict[str, Any]]]
    early_warning_breaches: List[ForecastBreachWarning]
    has_warnings: bool

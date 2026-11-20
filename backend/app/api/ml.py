import io
import csv
import pandas as pd
from fastapi import APIRouter, Depends, HTTPException, Query, UploadFile, File
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session
from typing import List, Dict, Any
from app.core.database import get_db
from app.models.station import Station
from app.models.reading import Reading
from app.schemas.ml import WaterSampleInput, PredictionResponse, ForecastResponse
from app.ml.predictor import predictor
from app.ml.forecaster import forecaster
from app.ml.train import train_and_save_models

router = APIRouter(prefix="/ml", tags=["Machine Learning"])

@router.post("/predict", response_model=PredictionResponse)
def predict_sample(sample: WaterSampleInput):
    """
    On-demand intelligent water quality prediction:
    - Potability classification & probability
    - Water Quality Index (WQI)
    - Anomaly detection & score
    - Explainable AI (XAI) feature attributions (SHAP values & human explanations)
    """
    sample_dict = sample.dict()
    result = predictor.predict(sample_dict)
    return result

@router.post("/batch-predict")
def batch_predict_samples(samples: List[WaterSampleInput]):
    """
    Batch prediction endpoint for sensor bursts or uploaded dataset rows.
    """
    results = []
    for s in samples:
        res = predictor.predict(s.dict())
        results.append(res)
    return {
        "count": len(results),
        "predictions": results
    }

@router.get("/forecast/{station_id}", response_model=ForecastResponse)
def get_station_forecast(
    station_id: int,
    hours: int = Query(48, ge=6, le=72, description="Forecast horizon in hours"),
    db: Session = Depends(get_db)
):
    """
    Time-series forecasting for water quality parameters:
    - Multi-step ahead parameter projections (pH, turbidity, TDS, DO, conductivity, temp)
    - Upper & lower confidence intervals
    - Early Warning breach alerts if predicted values cross safety thresholds
    """
    station = db.query(Station).filter(Station.id == station_id).first()
    if not station:
        raise HTTPException(status_code=404, detail="Station not found")
        
    # Get last 72 hours of readings to train trend & seasonality
    readings = db.query(Reading).filter(
        Reading.station_id == station_id
    ).order_by(Reading.timestamp.desc()).limit(100).all()
    
    # Reverse so chronologically ascending
    readings = list(reversed(readings))
    
    forecast_data = forecaster.forecast_station(readings, hours_ahead=hours)
    
    return ForecastResponse(
        station_id=station.id,
        station_name=station.name,
        forecast_generated_at=forecast_data["forecast_generated_at"],
        horizon_hours=forecast_data["horizon_hours"],
        forecasts=forecast_data["forecasts"],
        early_warning_breaches=forecast_data["early_warning_breaches"],
        has_warnings=forecast_data["has_warnings"]
    )

@router.get("/model-info")
def get_model_info():
    """
    Returns ML model architecture, evaluation metrics, and feature importances.
    """
    if not predictor.metadata:
        return {"status": "loading"}
    return predictor.metadata

@router.post("/retrain")
def trigger_retrain():
    """
    Triggers model retraining and hot-reloads models in memory.
    """
    metadata = train_and_save_models()
    predictor.load_models()
    return {
        "status": "success",
        "message": "ML models retrained and hot-reloaded successfully",
        "metrics": {
            "accuracy": metadata["model_accuracy"],
            "f1_score": metadata["model_f1"],
            "dataset_size": metadata["dataset_size"]
        }
    }

@router.get("/sample-csv")
def get_sample_csv():
    """
    Returns a sample CSV with representative water quality sensor readings.
    """
    sample_rows = [
        {"sample_id": "SMP-001", "location": "Reservoir North", "ph": 7.35, "turbidity": 1.2, "tds": 210, "temperature": 19.5, "dissolved_oxygen": 9.4, "conductivity": 320},
        {"sample_id": "SMP-002", "location": "Intake River Mile 4", "ph": 7.10, "turbidity": 2.8, "tds": 280, "temperature": 21.0, "dissolved_oxygen": 8.1, "conductivity": 420},
        {"sample_id": "SMP-003", "location": "Agricultural Runoff Canal", "ph": 6.20, "turbidity": 14.5, "tds": 640, "temperature": 24.5, "dissolved_oxygen": 4.8, "conductivity": 960},
        {"sample_id": "SMP-004", "location": "Treated Water Basin", "ph": 7.45, "turbidity": 0.6, "tds": 165, "temperature": 18.0, "dissolved_oxygen": 9.9, "conductivity": 250},
        {"sample_id": "SMP-005", "location": "Industrial Park Outfall", "ph": 4.20, "turbidity": 19.8, "tds": 1520, "temperature": 28.5, "dissolved_oxygen": 1.9, "conductivity": 2700},
        {"sample_id": "SMP-006", "location": "Deep Aquifer Well 2", "ph": 7.60, "turbidity": 0.4, "tds": 460, "temperature": 15.5, "dissolved_oxygen": 7.2, "conductivity": 780},
        {"sample_id": "SMP-007", "location": "Downstream Creek", "ph": 8.10, "turbidity": 4.2, "tds": 390, "temperature": 22.0, "dissolved_oxygen": 6.8, "conductivity": 610},
        {"sample_id": "SMP-008", "location": "Alkaline Effluent Discharge", "ph": 10.20, "turbidity": 8.4, "tds": 1180, "temperature": 26.0, "dissolved_oxygen": 3.2, "conductivity": 1920}
    ]
    
    output = io.StringIO()
    writer = csv.DictWriter(output, fieldnames=["sample_id", "location", "ph", "turbidity", "tds", "temperature", "dissolved_oxygen", "conductivity"])
    writer.writeheader()
    writer.writerows(sample_rows)
    output.seek(0)
    
    return StreamingResponse(
        io.BytesIO(output.getvalue().encode('utf-8')),
        media_type="text/csv",
        headers={"Content-Disposition": "attachment; filename=sample_water_quality_dataset.csv"}
    )

@router.post("/upload-csv")
async def upload_csv_and_predict(file: UploadFile = File(...)):
    """
    Parses an uploaded water quality CSV file, validates columns,
    runs ML potability prediction, WQI calculation, and anomaly detection for each row,
    and returns aggregated statistics and row-by-row enriched predictions.
    """
    if not file.filename.endswith(('.csv', '.txt')):
        raise HTTPException(status_code=400, detail="Only CSV files (.csv) are supported.")
        
    contents = await file.read()
    try:
        df = pd.read_csv(io.BytesIO(contents))
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Failed to parse CSV file: {str(e)}")

    # Standardize column names (lowercase, stripped, replacing spaces/hyphens with underscores)
    df.columns = [c.lower().strip().replace(' ', '_').replace('-', '_') for c in df.columns]

    # Required core parameter columns
    required_cols = ["ph", "turbidity", "tds", "temperature", "dissolved_oxygen", "conductivity"]
    
    # Common column aliases mapping
    aliases = {
        "do": "dissolved_oxygen",
        "dissolvedoxygen": "dissolved_oxygen",
        "temp": "temperature",
        "ec": "conductivity",
        "elec_cond": "conductivity",
        "electrical_conductivity": "conductivity",
        "total_dissolved_solids": "tds"
    }
    
    # Rename aliases if present
    for old_col, new_col in aliases.items():
        if old_col in df.columns and new_col not in df.columns:
            df.rename(columns={old_col: new_col}, inplace=True)

    missing = [c for c in required_cols if c not in df.columns]
    if missing:
        raise HTTPException(
            status_code=400,
            detail=f"CSV is missing required parameter column(s): {', '.join(missing)}. Required columns are: {', '.join(required_cols)}"
        )

    # Process predictions row by row
    results = []
    potable_count = 0
    anomaly_count = 0
    wqi_sum = 0.0

    for idx, row in df.iterrows():
        sample_dict = {
            "ph": float(row["ph"]),
            "turbidity": float(row["turbidity"]),
            "tds": float(row["tds"]),
            "temperature": float(row["temperature"]),
            "dissolved_oxygen": float(row["dissolved_oxygen"]),
            "conductivity": float(row["conductivity"])
        }
        
        pred = predictor.predict(sample_dict)
        if pred["potability_pred"] == 1:
            potable_count += 1
        if pred["is_anomaly"]:
            anomaly_count += 1
        wqi_sum += pred["wqi"]

        # Preserve any metadata columns (sample_id, location, date, etc.)
        row_res = {
            "row_index": idx + 1,
            "sample_id": str(row.get("sample_id", f"ROW-{idx+1}")),
            "location": str(row.get("location", "Field Sample")),
            "ph": sample_dict["ph"],
            "turbidity": sample_dict["turbidity"],
            "tds": sample_dict["tds"],
            "temperature": sample_dict["temperature"],
            "dissolved_oxygen": sample_dict["dissolved_oxygen"],
            "conductivity": sample_dict["conductivity"],
            "potability_pred": pred["potability_pred"],
            "potability_label": pred["potability_label"],
            "potability_prob": pred["potability_prob"],
            "wqi": pred["wqi"],
            "wqi_status": pred["wqi_status"],
            "is_anomaly": pred["is_anomaly"],
            "anomaly_intensity": pred["anomaly_intensity"],
            "top_driving_factor": pred["explainability"]["attributions"][0]["label"] if pred["explainability"]["attributions"] else "None",
            "top_factor_impact": pred["explainability"]["attributions"][0]["percentage_impact"] if pred["explainability"]["attributions"] else 0.0
        }
        results.append(row_res)

    total_rows = len(results)
    avg_wqi = round(wqi_sum / total_rows, 1) if total_rows > 0 else 0.0
    potable_pct = round((potable_count / total_rows * 100), 1) if total_rows > 0 else 0.0
    anomaly_pct = round((anomaly_count / total_rows * 100), 1) if total_rows > 0 else 0.0

    return {
        "status": "success",
        "filename": file.filename,
        "total_records": total_rows,
        "summary": {
            "potable_count": potable_count,
            "non_potable_count": total_rows - potable_count,
            "potable_percentage": potable_pct,
            "anomaly_count": anomaly_count,
            "anomaly_percentage": anomaly_pct,
            "average_wqi": avg_wqi
        },
        "records": results
    }

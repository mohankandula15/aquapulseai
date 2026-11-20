import io
import csv
from datetime import datetime, timedelta
from fastapi import APIRouter, Depends, Query, HTTPException
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.core.config import settings
from app.models.station import Station
from app.models.reading import Reading
from app.models.alert import Alert

router = APIRouter(prefix="/reports", tags=["Compliance & Audit Reports"])

@router.get("/compliance")
def get_compliance_report(
    days: int = Query(14, ge=1, le=90, description="Evaluation window in days"),
    db: Session = Depends(get_db)
):
    """
    Generates comprehensive Water Quality & Environmental Safety Compliance Audit report
    benchmarked against standard EPA & WHO drinking water guidelines.
    """
    since = datetime.utcnow() - timedelta(days=days)
    stations = db.query(Station).all()
    
    thresholds = settings.THRESHOLDS
    total_readings_all = 0
    total_violations_all = 0
    param_violations = {p: 0 for p in thresholds.keys()}
    
    station_reports = []
    
    for s in stations:
        readings = db.query(Reading).filter(
            Reading.station_id == s.id,
            Reading.timestamp >= since
        ).all()
        
        n_readings = len(readings)
        if n_readings == 0:
            continue
            
        total_readings_all += n_readings
        station_violations = 0
        wqi_sum = 0.0
        stn_param_viol = {p: 0 for p in thresholds.keys()}
        potable_count = 0
        anomaly_count = 0
        
        for r in readings:
            wqi_sum += (r.wqi or 50.0)
            if r.potability_pred == 1:
                potable_count += 1
            if r.is_anomaly:
                anomaly_count += 1
                
            has_viol = False
            # Check thresholds
            if r.ph < thresholds["ph"]["min"] or r.ph > thresholds["ph"]["max"]:
                stn_param_viol["ph"] += 1
                param_violations["ph"] += 1
                has_viol = True
            if r.turbidity > thresholds["turbidity"]["max"]:
                stn_param_viol["turbidity"] += 1
                param_violations["turbidity"] += 1
                has_viol = True
            if r.dissolved_oxygen < thresholds["dissolved_oxygen"]["min"]:
                stn_param_viol["dissolved_oxygen"] += 1
                param_violations["dissolved_oxygen"] += 1
                has_viol = True
            if r.tds > thresholds["tds"]["max"]:
                stn_param_viol["tds"] += 1
                param_violations["tds"] += 1
                has_viol = True
            if r.conductivity > thresholds["conductivity"]["max"]:
                stn_param_viol["conductivity"] += 1
                param_violations["conductivity"] += 1
                has_viol = True
                
            if has_viol:
                station_violations += 1
                
        total_violations_all += station_violations
        
        comp_rate = round(((n_readings - station_violations) / n_readings * 100), 1)
        avg_wqi = round(wqi_sum / n_readings, 1)
        
        # Grade classification
        if comp_rate >= 95.0 and avg_wqi >= 80:
            grade = "A+ (Excellent Compliance)"
        elif comp_rate >= 85.0:
            grade = "B (Good Compliance)"
        elif comp_rate >= 70.0:
            grade = "C (Marginal / Requires Monitoring)"
        elif comp_rate >= 50.0:
            grade = "D (Poor / Frequent Threshold Breaches)"
        else:
            grade = "F (Non-Compliant / Severe Environmental Hazard)"
            
        station_reports.append({
            "station_id": s.id,
            "station_name": s.name,
            "station_code": s.code,
            "water_body_type": s.water_body_type,
            "total_samples": n_readings,
            "compliant_samples": n_readings - station_violations,
            "violation_samples": station_violations,
            "compliance_percentage": comp_rate,
            "average_wqi": avg_wqi,
            "potable_percentage": round(potable_count / n_readings * 100, 1),
            "anomaly_count": anomaly_count,
            "grade": grade,
            "parameter_violations": stn_param_viol
        })
        
    overall_comp_rate = round(
        ((total_readings_all - total_violations_all) / total_readings_all * 100), 1
    ) if total_readings_all > 0 else 100.0

    return {
        "report_generated_at": datetime.utcnow().isoformat(),
        "audit_window_days": days,
        "total_readings_audited": total_readings_all,
        "total_violations_recorded": total_violations_all,
        "overall_compliance_rate": overall_comp_rate,
        "parameter_violations_breakdown": param_violations,
        "station_scorecards": station_reports
    }

@router.get("/export-readings-csv")
def export_readings_csv(
    station_id: int = Query(None),
    days: int = Query(14, ge=1, le=90),
    db: Session = Depends(get_db)
):
    """
    Exports historical water quality readings and ML inferences as a clean CSV download.
    """
    since = datetime.utcnow() - timedelta(days=days)
    query = db.query(Reading).filter(Reading.timestamp >= since)
    if station_id:
        query = query.filter(Reading.station_id == station_id)
        
    readings = query.order_by(Reading.timestamp.desc()).all()
    
    output = io.StringIO()
    fieldnames = [
        "timestamp", "station_id", "station_code", "station_name",
        "ph", "turbidity_ntu", "tds_mg_l", "temperature_c", "dissolved_oxygen_mg_l", "conductivity_us_cm",
        "wqi", "wqi_status", "potability_pred", "potability_label", "is_anomaly", "anomaly_score", "source"
    ]
    writer = csv.DictWriter(output, fieldnames=fieldnames)
    writer.writeheader()
    
    # Station cache
    stations_map = {s.id: s for s in db.query(Station).all()}
    
    for r in readings:
        stn = stations_map.get(r.station_id)
        writer.writerow({
            "timestamp": r.timestamp.isoformat(),
            "station_id": r.station_id,
            "station_code": stn.code if stn else "",
            "station_name": stn.name if stn else "",
            "ph": r.ph,
            "turbidity_ntu": r.turbidity,
            "tds_mg_l": r.tds,
            "temperature_c": r.temperature,
            "dissolved_oxygen_mg_l": r.dissolved_oxygen,
            "conductivity_us_cm": r.conductivity,
            "wqi": r.wqi,
            "wqi_status": r.wqi_status,
            "potability_pred": r.potability_pred,
            "potability_label": "Potable" if r.potability_pred == 1 else "Non-Potable",
            "is_anomaly": r.is_anomaly,
            "anomaly_score": r.anomaly_score,
            "source": r.source
        })
        
    output.seek(0)
    filename = f"water_telemetry_export_{datetime.utcnow().strftime('%Y%m%d_%H%M%S')}.csv"
    
    return StreamingResponse(
        io.BytesIO(output.getvalue().encode('utf-8')),
        media_type="text/csv",
        headers={"Content-Disposition": f"attachment; filename={filename}"}
    )

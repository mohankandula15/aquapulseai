import os
from typing import Optional, Dict, Any
from datetime import datetime
from fastapi import APIRouter, Depends, UploadFile, File, Form, HTTPException, status
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session
from pydantic import BaseModel

from app.core.database import get_db
from app.models.report_analysis import ReportAnalysis
from app.services.extractor_service import extract_from_bytes
from app.services.report_analysis_service import evaluate_water_report
from app.services.pdf_report_service import generate_pdf_report

router = APIRouter(prefix="/water-reports", tags=["AI Water Report Analysis"])

ALLOWED_EXTENSIONS = {".pdf", ".csv", ".jpg", ".jpeg", ".png"}
MAX_FILE_SIZE = 25 * 1024 * 1024  # 25 MB

class AnalyzeReportRequest(BaseModel):
    filename: str = "water_report.pdf"
    file_type: str = "pdf"
    file_size: Optional[int] = 0
    intended_use: str = "drinking"
    sample_metadata: Optional[Dict[str, Any]] = {}
    parameters: Dict[str, Any]

@router.post("/extract")
async def extract_water_report(
    file: UploadFile = File(...)
):
    """
    Step 1: AI Document Parser.
    Extracts water quality parameters, units, lab info, sample date, and location from PDF/JPG/PNG/CSV.
    Returns preview for user verification before final analysis.
    """
    filename = file.filename or "uploaded_file"
    ext = os.path.splitext(filename)[1].lower()
    
    if ext not in ALLOWED_EXTENSIONS:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Unsupported file format '{ext}'. Supported formats: PDF, JPG, JPEG, PNG, CSV."
        )
        
    contents = await file.read()
    file_size = len(contents)
    
    if file_size > MAX_FILE_SIZE:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="File size exceeds the 25 MB limit."
        )
        
    try:
        extracted = extract_from_bytes(contents, filename)
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail=f"Failed to process document: {str(e)}"
        )
        
    return {
        "status": "success",
        "filename": filename,
        "file_type": ext.lstrip("."),
        "file_size": file_size,
        "metadata": extracted.get("metadata", {}),
        "parameters": extracted.get("parameters", {}),
        "verification_warnings": extracted.get("verification_warnings", []),
        "extracted_parameter_count": len(extracted.get("parameters", {})),
        "text_preview": extracted.get("raw_text", "")[:400]
    }

@router.post("/analyze")
def analyze_water_report(
    req: AnalyzeReportRequest,
    db: Session = Depends(get_db)
):
    """
    Step 2: Comprehensive Evaluation Engine.
    Evaluates verified parameters against selected standards (BIS IS 10500:2012 / WHO),
    computes WQI, runs ML potability model, compiles plain-language explanation and safety guidance,
    and stores the report in DB.
    """
    if not req.parameters or len(req.parameters) == 0:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="At least one water parameter is required for analysis."
        )
        
    evaluation = evaluate_water_report(
        extracted_parameters=req.parameters,
        intended_use=req.intended_use,
        sample_metadata=req.sample_metadata
    )
    
    # Persist in DB
    record = ReportAnalysis(
        filename=req.filename,
        file_type=req.file_type,
        file_size=req.file_size or 0,
        intended_use=req.intended_use,
        sample_metadata=req.sample_metadata or {},
        extracted_parameters=req.parameters,
        evaluated_parameters=evaluation["evaluated_parameters"],
        wqi_score=evaluation["wqi_score"],
        overall_quality=evaluation["overall_quality"],
        risk_level=evaluation["risk_level"],
        safety_category=evaluation["safety_category"],
        potability_pred=evaluation["potability_prediction"],
        potability_probability=evaluation["potability_probability"],
        ai_explanation=evaluation["ai_explanation"],
        potential_risks=evaluation["potential_risks"],
        recommendations=evaluation["recommendations"],
        missing_critical_tests=evaluation["missing_critical_tests"],
        is_verified_by_user=True,
        created_at=datetime.utcnow()
    )
    
    db.add(record)
    db.commit()
    db.refresh(record)
    
    res = evaluation.copy()
    res["id"] = record.id
    res["filename"] = record.filename
    res["file_type"] = record.file_type
    res["created_at"] = record.created_at.isoformat()
    return res

@router.get("/history")
def get_analysis_history(
    limit: int = 50,
    db: Session = Depends(get_db)
):
    """
    Returns history of analyzed water reports.
    """
    records = db.query(ReportAnalysis).order_by(ReportAnalysis.created_at.desc()).limit(limit).all()
    history = []
    for r in records:
        history.append({
            "id": r.id,
            "filename": r.filename,
            "file_type": r.file_type,
            "intended_use": r.intended_use,
            "overall_quality": r.overall_quality,
            "wqi_score": r.wqi_score,
            "risk_level": r.risk_level,
            "safety_category": r.safety_category,
            "potability_pred": r.potability_pred,
            "parameter_count": len(r.evaluated_parameters) if r.evaluated_parameters else 0,
            "sample_date": (r.sample_metadata or {}).get("sample_date", ""),
            "location": (r.sample_metadata or {}).get("sample_location", ""),
            "created_at": r.created_at.isoformat()
        })
    return {"total": len(history), "reports": history}

@router.get("/history/{report_id}")
def get_report_detail(
    report_id: int,
    db: Session = Depends(get_db)
):
    """
    Returns full analysis details for a single report.
    """
    record = db.query(ReportAnalysis).filter(ReportAnalysis.id == report_id).first()
    if not record:
        raise HTTPException(status_code=404, detail="Report analysis not found.")
        
    return {
        "id": record.id,
        "filename": record.filename,
        "file_type": record.file_type,
        "file_size": record.file_size,
        "intended_use": record.intended_use,
        "sample_metadata": record.sample_metadata or {},
        "evaluated_parameters": record.evaluated_parameters or {},
        "wqi_score": record.wqi_score,
        "overall_quality": record.overall_quality,
        "risk_level": record.risk_level,
        "safety_category": record.safety_category,
        "potability_prediction": record.potability_pred,
        "potability_probability": record.potability_probability,
        "ai_explanation": record.ai_explanation,
        "potential_risks": record.potential_risks or [],
        "recommendations": record.recommendations or {},
        "missing_critical_tests": record.missing_critical_tests or [],
        "created_at": record.created_at.isoformat()
    }

@router.delete("/history/{report_id}")
def delete_report(
    report_id: int,
    db: Session = Depends(get_db)
):
    """
    Deletes an analysis report from history.
    """
    record = db.query(ReportAnalysis).filter(ReportAnalysis.id == report_id).first()
    if not record:
        raise HTTPException(status_code=404, detail="Report analysis not found.")
    db.delete(record)
    db.commit()
    return {"status": "success", "message": f"Report #{report_id} deleted successfully."}

@router.get("/download-pdf/{report_id}")
def download_pdf_report(
    report_id: int,
    db: Session = Depends(get_db)
):
    """
    Generates and downloads a standardized, print-ready PDF Water Quality Assessment Report.
    """
    record = db.query(ReportAnalysis).filter(ReportAnalysis.id == report_id).first()
    if not record:
        raise HTTPException(status_code=404, detail="Report analysis not found.")
        
    record_dict = {
        "id": record.id,
        "filename": record.filename,
        "intended_use": record.intended_use,
        "sample_metadata": record.sample_metadata or {},
        "overall_quality": record.overall_quality,
        "wqi_score": record.wqi_score,
        "risk_level": record.risk_level,
        "safety_category": record.safety_category,
        "ai_explanation": record.ai_explanation,
        "evaluated_parameters": record.evaluated_parameters or {},
        "recommendations": record.recommendations or {},
        "potential_risks": record.potential_risks or [],
        "missing_critical_tests": record.missing_critical_tests or [],
        "standards_used": {
            "primary": "BIS IS 10500:2012 (Drinking Water Specification)",
            "secondary": "WHO Guidelines for Drinking-water Quality (4th Edition)"
        }
    }
    
    pdf_buffer = generate_pdf_report(record_dict)
    safe_name = os.path.splitext(record.filename)[0].replace(" ", "_")
    output_filename = f"AquaPulse_Report_{safe_name}_{record.id}.pdf"
    
    return StreamingResponse(
        pdf_buffer,
        media_type="application/pdf",
        headers={"Content-Disposition": f"attachment; filename={output_filename}"}
    )

@router.get("/sample-presets")
def get_sample_presets():
    """
    Provides pre-packaged realistic test cases so users can test immediately with one click.
    """
    return [
        {
            "id": "sample-safe-tap",
            "name": "Standard Municipal Tap Water (Safe & Compliant)",
            "intended_use": "drinking",
            "description": "Lab report from certified municipal utility meeting BIS IS 10500:2012 limits.",
            "sample_metadata": {
                "laboratory_name": "State Water & Sanitation Testing Laboratory",
                "sample_date": "2026-11-15",
                "sample_location": "Municipal Distribution Zone 4",
                "sample_id": "MUNI-2026-9841"
            },
            "parameters": {
                "ph": {"value": 7.35, "unit": "pH"},
                "turbidity": {"value": 0.8, "unit": "NTU"},
                "tds": {"value": 240.0, "unit": "mg/L"},
                "dissolved_oxygen": {"value": 6.8, "unit": "mg/L"},
                "conductivity": {"value": 380.0, "unit": "µS/cm"},
                "temperature": {"value": 23.5, "unit": "°C"},
                "nitrate": {"value": 12.0, "unit": "mg/L"},
                "chlorides": {"value": 45.0, "unit": "mg/L"}
            }
        },
        {
            "id": "sample-borewell-hard",
            "name": "Groundwater / Borewell (High TDS & Hardness)",
            "intended_use": "drinking",
            "description": "Deep aquifer borewell water exhibiting elevated mineral content and scaling potential.",
            "sample_metadata": {
                "laboratory_name": "AquaTech Environmental Testing Services",
                "sample_date": "2026-11-10",
                "sample_location": "Suburban Borewell 320ft",
                "sample_id": "BW-2026-4412"
            },
            "parameters": {
                "ph": {"value": 8.1, "unit": "pH"},
                "turbidity": {"value": 2.4, "unit": "NTU"},
                "tds": {"value": 1150.0, "unit": "mg/L"},
                "dissolved_oxygen": {"value": 4.8, "unit": "mg/L"},
                "conductivity": {"value": 1780.0, "unit": "µS/cm"},
                "temperature": {"value": 26.0, "unit": "°C"},
                "total_hardness": {"value": 480.0, "unit": "mg/L"},
                "nitrate": {"value": 28.0, "unit": "mg/L"}
            }
        },
        {
            "id": "sample-agricultural-runoff",
            "name": "Agricultural Runoff / Surface Water (High Nitrate & Turbidity)",
            "intended_use": "drinking",
            "description": "Rural well water adjacent to fertilized agricultural land showing dangerous nitrate levels.",
            "sample_metadata": {
                "laboratory_name": "AgriBio Analytical Laboratories",
                "sample_date": "2026-11-08",
                "sample_location": "Farm Well Sector 9",
                "sample_id": "AGRI-2026-1052"
            },
            "parameters": {
                "ph": {"value": 6.3, "unit": "pH"},
                "turbidity": {"value": 8.5, "unit": "NTU"},
                "tds": {"value": 820.0, "unit": "mg/L"},
                "dissolved_oxygen": {"value": 3.4, "unit": "mg/L"},
                "conductivity": {"value": 1240.0, "unit": "µS/cm"},
                "temperature": {"value": 25.0, "unit": "°C"},
                "nitrate": {"value": 68.0, "unit": "mg/L"},
                "coliform": {"value": 14.0, "unit": "MPN/100ml"}
            }
        }
    ]

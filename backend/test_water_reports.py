import io
from fastapi.testclient import TestClient
from reportlab.lib.pagesizes import letter
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle
from reportlab.lib.styles import getSampleStyleSheet
from reportlab.lib import colors

from app.main import app

def create_sample_lab_pdf():
    buffer = io.BytesIO()
    doc = SimpleDocTemplate(buffer, pagesize=letter)
    styles = getSampleStyleSheet()
    story = []

    story.append(Paragraph("<b>State Water & Analytical Testing Laboratory</b>", styles['Title']))
    story.append(Paragraph("Accredited by National Accreditation Board (NABL)", styles['Normal']))
    story.append(Spacer(1, 12))

    meta_text = (
        "<b>Sample ID:</b> SWTL-2026-9812<br/>"
        "<b>Collection Date:</b> 12/11/2026<br/>"
        "<b>Sample Location:</b> Sector 5 Groundwater Tubewell<br/>"
        "<b>Source Type:</b> Borewell Drinking Water Supply"
    )
    story.append(Paragraph(meta_text, styles['Normal']))
    story.append(Spacer(1, 14))

    table_data = [
        ["Parameter", "Observed Value", "Units", "Desirable Limit (BIS IS 10500:2012)"],
        ["pH", "7.35", "pH", "6.5 - 8.5"],
        ["Turbidity", "1.2", "NTU", "1.0 NTU (Max 5.0)"],
        ["Total Dissolved Solids (TDS)", "420.0", "mg/L", "500 mg/L (Max 2000)"],
        ["Dissolved Oxygen", "6.2", "mg/L", "Min 5.0 mg/L"],
        ["Electrical Conductivity", "640.0", "µS/cm", "750 µS/cm"],
        ["Nitrate (as NO3)", "16.4", "mg/L", "45.0 mg/L"],
        ["Total Hardness", "260.0", "mg/L", "200 mg/L (Max 600)"],
        ["Chlorides", "85.0", "mg/L", "250 mg/L (Max 1000)"]
    ]
    t = Table(table_data)
    t.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,0), colors.lightgrey),
        ('GRID', (0,0), (-1,-1), 0.5, colors.grey),
        ('PADDING', (0,0), (-1,-1), 5),
    ]))
    story.append(t)
    doc.build(story)
    buffer.seek(0)
    return buffer.getvalue()

def run_tests():
    print("=== Testing AquaPulse AI Water Report Endpoints ===")
    client = TestClient(app)

    # 1. Test Sample Presets
    res = client.get("/api/v1/water-reports/sample-presets")
    assert res.status_code == 200, f"Preset error: {res.text}"
    presets = res.json()
    print(f"[OK] Presets endpoint returned {len(presets)} sample presets.")

    # 2. Test Document Extraction with real PDF
    pdf_bytes = create_sample_lab_pdf()
    files = {"file": ("sample_lab_report.pdf", pdf_bytes, "application/pdf")}
    res = client.post("/api/v1/water-reports/extract", files=files)
    assert res.status_code == 200, f"Extraction failed: {res.text}"
    extract_data = res.json()
    print(f"[OK] Extracted parameters count: {extract_data['extracted_parameter_count']}")
    params = extract_data["parameters"]
    print(f"     Extracted keys: {list(params.keys())}")
    assert "ph" in params, "pH should be extracted"
    assert "tds" in params, "TDS should be extracted"
    assert "turbidity" in params, "Turbidity should be extracted"

    # 3. Test Report Analysis
    analyze_payload = {
        "filename": "sample_lab_report.pdf",
        "file_type": "pdf",
        "file_size": len(pdf_bytes),
        "intended_use": "drinking",
        "sample_metadata": extract_data.get("metadata", {}),
        "parameters": params
    }
    res = client.post("/api/v1/water-reports/analyze", json=analyze_payload)
    assert res.status_code == 200, f"Analyze failed: {res.text}"
    analysis = res.json()
    report_id = analysis["id"]
    print(f"[OK] Report analyzed successfully! Assigned DB ID: {report_id}")
    print(f"     Overall Quality: {analysis['overall_quality']}")
    print(f"     WQI Score: {analysis['wqi_score']}/100")
    print(f"     Safety Category: {analysis['safety_category']}")
    print(f"     AI Explanation: {analysis['ai_explanation'][:90]}...")

    # 4. Test History
    res = client.get("/api/v1/water-reports/history")
    assert res.status_code == 200
    history = res.json()
    assert history["total"] >= 1
    print(f"[OK] History contains {history['total']} report(s).")

    # 5. Test PDF Generation and Download
    res = client.get(f"/api/v1/water-reports/download-pdf/{report_id}")
    assert res.status_code == 200
    assert res.headers["content-type"] == "application/pdf"
    pdf_downloaded = res.content
    assert len(pdf_downloaded) > 1000
    print(f"[OK] PDF Report successfully generated! Size: {len(pdf_downloaded)} bytes.")

    print("\n>>> ALL AquaPulse AI Water Report Endpoints PASSED SUCCESSFULLY! <<<")

if __name__ == "__main__":
    run_tests()

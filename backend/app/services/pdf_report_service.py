import io
from datetime import datetime
from reportlab.lib.pagesizes import letter
from reportlab.lib import colors
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, KeepTogether, HRFlowable

def generate_pdf_report(analysis_record: dict) -> io.BytesIO:
    """
    Generates a professional, print-ready PDF Water Quality Assessment Report
    benchmarked against BIS IS 10500:2012 & WHO Guidelines.
    """
    buffer = io.BytesIO()
    doc = SimpleDocTemplate(
        buffer,
        pagesize=letter,
        rightMargin=36,
        leftMargin=36,
        topMargin=36,
        bottomMargin=36
    )
    
    styles = getSampleStyleSheet()
    
    # Custom Brand Styles
    brand_blue = colors.HexColor("#0284c7")
    dark_slate = colors.HexColor("#0f172a")
    subtle_gray = colors.HexColor("#64748b")
    bg_light = colors.HexColor("#f8fafc")
    green_safe = colors.HexColor("#16a34a")
    yellow_warn = colors.HexColor("#ca8a04")
    red_danger = colors.HexColor("#dc2626")
    
    title_style = ParagraphStyle(
        'DocTitle',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=20,
        leading=24,
        textColor=brand_blue
    )
    subtitle_style = ParagraphStyle(
        'DocSubtitle',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=10,
        leading=14,
        textColor=subtle_gray
    )
    h2_style = ParagraphStyle(
        'H2Style',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=13,
        leading=17,
        textColor=dark_slate,
        spaceBefore=10,
        spaceAfter=6
    )
    body_style = ParagraphStyle(
        'BodyDark',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=9,
        leading=13,
        textColor=dark_slate
    )
    bold_body_style = ParagraphStyle(
        'BoldBodyDark',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=9,
        leading=13,
        textColor=dark_slate
    )
    callout_style = ParagraphStyle(
        'CalloutText',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=8.5,
        leading=12,
        textColor=dark_slate
    )
    disclaimer_style = ParagraphStyle(
        'DisclaimerText',
        parent=styles['Normal'],
        fontName='Helvetica-Oblique',
        fontSize=7.5,
        leading=10,
        textColor=colors.HexColor("#475569")
    )

    story = []
    
    # 1. Header Banner
    header_data = [
        [
            Paragraph("<b>AquaPulse AI</b>", title_style),
            Paragraph(f"<b>Report ID:</b> #{analysis_record.get('id', 'NEW')}<br/><b>Date:</b> {datetime.utcnow().strftime('%B %d, %Y')}", subtitle_style)
        ],
        [
            Paragraph("Smart Water Quality Analysis & Safety Assistant", subtitle_style),
            Paragraph(f"<b>Intended Use:</b> {analysis_record.get('intended_use', 'drinking').title()}", subtitle_style)
        ]
    ]
    header_table = Table(header_data, colWidths=[340, 200])
    header_table.setStyle(TableStyle([
        ('VALIGN', (0,0), (-1,-1), 'TOP'),
        ('BOTTOMPADDING', (0,0), (-1,-1), 2),
    ]))
    story.append(header_table)
    story.append(Spacer(1, 8))
    story.append(HRFlowable(width="100%", thickness=1.5, color=brand_blue, spaceBefore=2, spaceAfter=10))

    # 2. Sample Metadata & Laboratory Context
    meta = analysis_record.get("sample_metadata", {}) or {}
    meta_text = (
        f"<b>Source Document:</b> {analysis_record.get('filename', 'Direct Report Upload')}&nbsp;&nbsp;&nbsp;|&nbsp;&nbsp;&nbsp;"
        f"<b>Lab:</b> {meta.get('laboratory_name') or 'Commercial / Municipal Lab'}&nbsp;&nbsp;&nbsp;|&nbsp;&nbsp;&nbsp;"
        f"<b>Sample Date:</b> {meta.get('sample_date') or 'Recorded on submission'}&nbsp;&nbsp;&nbsp;|&nbsp;&nbsp;&nbsp;"
        f"<b>Location:</b> {meta.get('sample_location') or 'Not specified'}"
    )
    story.append(Paragraph(meta_text, subtitle_style))
    story.append(Spacer(1, 10))

    # 3. Overall Executive Assessment Card
    overall_quality = analysis_record.get("overall_quality", "Moderate")
    wqi_score = analysis_record.get("wqi_score", 0.0)
    risk_level = analysis_record.get("risk_level", "Moderate Risk")
    safety_category = analysis_record.get("safety_category", "Needs Attention")

    badge_color = green_safe if overall_quality == "Good" else (yellow_warn if overall_quality == "Moderate" else red_danger)
    
    exec_data = [
        [
            Paragraph("<b>OVERALL QUALITY</b>", subtitle_style),
            Paragraph("<b>WATER QUALITY INDEX (WQI)</b>", subtitle_style),
            Paragraph("<b>RISK LEVEL</b>", subtitle_style),
            Paragraph("<b>SAFETY STATUS</b>", subtitle_style)
        ],
        [
            Paragraph(f"<font color='{badge_color.hexval()}'><b>{overall_quality.upper()}</b></font>", h2_style),
            Paragraph(f"<b>{wqi_score} / 100</b>", h2_style),
            Paragraph(f"<b>{risk_level}</b>", h2_style),
            Paragraph(f"<b>{safety_category}</b>", h2_style)
        ]
    ]
    exec_table = Table(exec_data, colWidths=[135, 135, 135, 135])
    exec_table.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,-1), bg_light),
        ('BOX', (0,0), (-1,-1), 1, colors.HexColor("#cbd5e1")),
        ('INNERGRID', (0,0), (-1,-1), 0.5, colors.HexColor("#e2e8f0")),
        ('TOPPADDING', (0,0), (-1,-1), 6),
        ('BOTTOMPADDING', (0,0), (-1,-1), 6),
        ('ALIGN', (0,0), (-1,-1), 'CENTER'),
        ('VALIGN', (0,0), (-1,-1), 'MIDDLE'),
    ]))
    story.append(exec_table)
    story.append(Spacer(1, 12))

    # 4. Plain Language AI Explanation ("What Does Your Water Report Mean?")
    story.append(Paragraph("What Does Your Water Report Mean?", h2_style))
    ai_exp = analysis_record.get("ai_explanation", "Analysis completed based on submitted data.")
    ai_box = Table([[Paragraph(ai_exp, body_style)]], colWidths=[540])
    ai_box.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,-1), colors.HexColor("#f0fdf4") if overall_quality == "Good" else colors.HexColor("#fefce8")),
        ('BOX', (0,0), (-1,-1), 1, colors.HexColor("#86efac") if overall_quality == "Good" else colors.HexColor("#fde047")),
        ('TOPPADDING', (0,0), (-1,-1), 8),
        ('BOTTOMPADDING', (0,0), (-1,-1), 8),
        ('LEFTPADDING', (0,0), (-1,-1), 10),
        ('RIGHTPADDING', (0,0), (-1,-1), 10),
    ]))
    story.append(ai_box)
    story.append(Spacer(1, 12))

    # 5. Parameter Analysis Table
    story.append(Paragraph("Extracted Parameter Analysis & Standards Comparison", h2_style))
    standards = analysis_record.get("standards_used", {})
    ref_note = f"Benchmarked against <b>{standards.get('primary', 'BIS IS 10500:2012')}</b> and <b>{standards.get('secondary', 'WHO Guidelines')}</b>"
    story.append(Paragraph(ref_note, subtitle_style))
    story.append(Spacer(1, 6))

    eval_params = analysis_record.get("evaluated_parameters", {})
    table_rows = [
        [
            Paragraph("<b>Parameter</b>", bold_body_style),
            Paragraph("<b>Observed</b>", bold_body_style),
            Paragraph("<b>Reference Range</b>", bold_body_style),
            Paragraph("<b>Standard Source</b>", bold_body_style),
            Paragraph("<b>Status</b>", bold_body_style)
        ]
    ]

    for pkey, pdata in eval_params.items():
        st = pdata.get("status", "grey")
        if st == "green":
            st_color = green_safe
            st_text = "Within Range"
        elif st == "yellow":
            st_color = yellow_warn
            st_text = "Attention"
        elif st == "red":
            st_color = red_danger
            st_text = "Exceeded"
        else:
            st_color = subtle_gray
            st_text = "Untested"

        row = [
            Paragraph(f"<b>{pdata.get('name', pkey.upper())}</b>", body_style),
            Paragraph(f"{pdata.get('value')} {pdata.get('unit', '')}", body_style),
            Paragraph(str(pdata.get("reference_range", "--")), body_style),
            Paragraph(str(pdata.get("standard_source", "BIS IS 10500:2012")), subtitle_style),
            Paragraph(f"<font color='{st_color.hexval()}'><b>{st_text}</b></font>", bold_body_style)
        ]
        table_rows.append(row)

    if len(table_rows) > 1:
        param_table = Table(table_rows, colWidths=[130, 95, 120, 120, 75])
        param_table.setStyle(TableStyle([
            ('BACKGROUND', (0,0), (-1,0), colors.HexColor("#f1f5f9")),
            ('BOX', (0,0), (-1,-1), 1, colors.HexColor("#cbd5e1")),
            ('INNERGRID', (0,0), (-1,-1), 0.5, colors.HexColor("#e2e8f0")),
            ('TOPPADDING', (0,0), (-1,-1), 5),
            ('BOTTOMPADDING', (0,0), (-1,-1), 5),
            ('LEFTPADDING', (0,0), (-1,-1), 6),
            ('RIGHTPADDING', (0,0), (-1,-1), 6),
            ('VALIGN', (0,0), (-1,-1), 'MIDDLE'),
        ]))
        story.append(param_table)
    else:
        story.append(Paragraph("No parameters extracted from document.", body_style))
    story.append(Spacer(1, 12))

    # 6. Water Safety & Precautionary Guidance
    recs = analysis_record.get("recommendations", {})
    story.append(Paragraph("Water Safety & What You Should Do", h2_style))
    story.append(Paragraph(f"<b>Assessment:</b> {recs.get('status_title', '')}", bold_body_style))
    story.append(Paragraph(recs.get('primary_notice', ''), body_style))
    story.append(Spacer(1, 4))

    action_items = recs.get("actions", [])
    if action_items:
        story.append(Paragraph("<b>Recommended Practical Actions:</b>", bold_body_style))
        for act in action_items:
            story.append(Paragraph(f"• {act}", body_style))
            story.append(Spacer(1, 2))

    caveat = recs.get("potability_caveat")
    if caveat:
        story.append(Spacer(1, 4))
        caveat_box = Table([[Paragraph(f"<b>Important Note:</b> {caveat}", callout_style)]], colWidths=[540])
        caveat_box.setStyle(TableStyle([
            ('BACKGROUND', (0,0), (-1,-1), colors.HexColor("#fef2f2") if safety_category == "Potentially Unsafe" else colors.HexColor("#f8fafc")),
            ('BOX', (0,0), (-1,-1), 1, colors.HexColor("#fca5a5") if safety_category == "Potentially Unsafe" else colors.HexColor("#cbd5e1")),
            ('TOPPADDING', (0,0), (-1,-1), 6),
            ('BOTTOMPADDING', (0,0), (-1,-1), 6),
            ('LEFTPADDING', (0,0), (-1,-1), 8),
            ('RIGHTPADDING', (0,0), (-1,-1), 8),
        ]))
        story.append(caveat_box)
    story.append(Spacer(1, 10))

    # 7. Parameter-Specific Guidance (if any)
    p_guidance = analysis_record.get("parameter_safety_guidance", [])
    if p_guidance:
        story.append(Paragraph("Parameter-Specific Safety Guidance", h2_style))
        for item in p_guidance[:3]: # Top 3 items to fit on page
            story.append(Paragraph(f"<b>{item.get('title')}:</b> {item.get('issue')}", bold_body_style))
            for g in item.get("guidance", []):
                story.append(Paragraph(f"  • {g}", body_style))
            story.append(Spacer(1, 4))

    # 8. Missing Critical Tests
    missing = analysis_record.get("missing_critical_tests", [])
    if missing:
        story.append(Spacer(1, 6))
        story.append(Paragraph("<b>Crucial Tests Not Detected in Uploaded Report:</b>", bold_body_style))
        missing_names = [f"<b>{m['name']}</b> ({m['reason']})" for m in missing]
        for mn in missing_names:
            story.append(Paragraph(f"• {mn}", subtitle_style))
            story.append(Spacer(1, 2))

    # 9. Statutory Regulatory Disclaimer
    story.append(Spacer(1, 12))
    story.append(HRFlowable(width="100%", thickness=0.8, color=colors.HexColor("#cbd5e1"), spaceBefore=4, spaceAfter=8))
    disclaimer_text = (
        "<b>STATUTORY DISCLAIMER:</b> AquaPulse AI is an algorithmic decision-support tool designed for automated "
        "preliminary screening. It benchmarks readings against BIS IS 10500:2012 and WHO guidelines. ML potability "
        "classifications do NOT constitute an official laboratory sanitary certification. Never consider untreated or "
        "chemically contaminated water safe to drink without certified laboratory verification (NABL/EPA accredited) "
        "and approval from your local public health authorities."
    )
    story.append(Paragraph(disclaimer_text, disclaimer_style))

    doc.build(story)
    buffer.seek(0)
    return buffer

from typing import Dict, Any, List, Optional
from datetime import datetime
from app.core.standards import get_reference_standards, evaluate_parameter_against_standard, STANDARDS
from app.ml.predictor import predictor

def calculate_wqi(parameters: Dict[str, Any]) -> Optional[float]:
    """
    Computes Water Quality Index (WQI) using the standard Weighted Arithmetic Index Method (Brown et al.):
    WQI = Sum(Wi * Qi) / Sum(Wi)
    Qi = [(Vi - Vo) / (Si - Vo)] * 100
    where Vo is ideal value (7.0 for pH, 14.6 for DO, 0 for others).
    """
    # Standard unit weights (Wi) and standard desirable limits (Si)
    param_configs = {
        "ph": {"si": 8.5, "vo": 7.0, "wi": 0.20},
        "turbidity": {"si": 5.0, "vo": 0.0, "wi": 0.15},
        "tds": {"si": 500.0, "vo": 0.0, "wi": 0.15},
        "dissolved_oxygen": {"si": 5.0, "vo": 14.6, "wi": 0.20},
        "conductivity": {"si": 750.0, "vo": 0.0, "wi": 0.10},
        "nitrate": {"si": 45.0, "vo": 0.0, "wi": 0.10},
        "bod": {"si": 3.0, "vo": 0.0, "wi": 0.05},
        "cod": {"si": 10.0, "vo": 0.0, "wi": 0.05}
    }
    
    sum_wi_qi = 0.0
    sum_wi = 0.0
    
    for key, cfg in param_configs.items():
        if key in parameters and parameters[key] is not None:
            val_data = parameters[key]
            val = val_data["value"] if isinstance(val_data, dict) else float(val_data)
            
            si = cfg["si"]
            vo = cfg["vo"]
            wi = cfg["wi"]
            
            # Quality rating scale (Qi)
            if key == "ph":
                qi = abs((val - vo) / (si - vo)) * 100.0
            elif key == "dissolved_oxygen":
                # For DO, higher is better up to saturation (14.6)
                if val >= 14.6:
                    qi = 0.0
                else:
                    qi = abs((14.6 - val) / (14.6 - si)) * 100.0
            else:
                qi = (val / si) * 100.0
                
            qi = max(0.0, min(300.0, qi))
            sum_wi_qi += wi * qi
            sum_wi += wi
            
    if sum_wi == 0:
        return None
        
    wqi_raw = sum_wi_qi / sum_wi
    # Scale into a 0 - 100 score where 100 is excellent and 0 is heavily polluted
    # If Brown WQI is 0-25 -> Excellent (100-85), 26-50 -> Good (84-70), 51-75 -> Poor (69-45), >75 -> Very Poor
    if wqi_raw <= 25:
        score = 100.0 - (wqi_raw / 25.0) * 15.0
    elif wqi_raw <= 50:
        score = 85.0 - ((wqi_raw - 25.0) / 25.0) * 15.0
    elif wqi_raw <= 75:
        score = 70.0 - ((wqi_raw - 50.0) / 25.0) * 25.0
    else:
        score = max(5.0, 45.0 - ((wqi_raw - 75.0) / 75.0) * 40.0)
        
    return round(score, 1)

def evaluate_water_report(
    extracted_parameters: Dict[str, Any],
    intended_use: str = "drinking",
    sample_metadata: Optional[Dict[str, Any]] = None
) -> Dict[str, Any]:
    """
    Full comprehensive evaluation engine adhering to:
    1. BIS IS 10500:2012 / WHO Drinking-water standards
    2. WQI computation
    3. ML Potability & Anomaly assessment
    4. Categorized Safety & Precautionary Guidance (Safe / Attention / Potentially Unsafe)
    5. Parameter-specific guidance without blanket boiling recommendations
    6. Human-first AI explanation
    """
    sample_metadata = sample_metadata or {}
    use_key = intended_use.lower() if intended_use else "drinking"
    standards_ref = get_reference_standards(use_key)
    
    # Evaluate every extracted parameter against reference standards
    evaluated_params = {}
    green_count = 0
    yellow_count = 0
    red_count = 0
    
    for param_key, param_info in extracted_parameters.items():
        val = param_info.get("value") if isinstance(param_info, dict) else float(param_info)
        unit = param_info.get("unit") if isinstance(param_info, dict) else ""
        
        evaluation = evaluate_parameter_against_standard(param_key, val, use_key)
        evaluated_params[param_key] = {
            "name": evaluation["name"],
            "value": val,
            "unit": unit or evaluation["unit"],
            "status": evaluation["status"], # 'green', 'yellow', 'red', 'grey'
            "reference_range": evaluation["reference_range"],
            "standard_source": evaluation["standard_source"],
            "message": evaluation["message"],
            "health_significance": evaluation.get("health_significance", "")
        }
        
        if evaluation["status"] == "green":
            green_count += 1
        elif evaluation["status"] == "yellow":
            yellow_count += 1
        elif evaluation["status"] == "red":
            red_count += 1

    # WQI Calculation
    wqi_score = calculate_wqi(extracted_parameters)
    if wqi_score is None:
        wqi_score = 75.0 if red_count == 0 else (50.0 if red_count == 1 else 30.0)

    # ML Model Prediction (Random Forest)
    # Check if we have key inputs or approximate
    ph_val = extracted_parameters.get("ph", {}).get("value", 7.2) if "ph" in extracted_parameters else 7.2
    turb_val = extracted_parameters.get("turbidity", {}).get("value", 1.5) if "turbidity" in extracted_parameters else 1.5
    tds_val = extracted_parameters.get("tds", {}).get("value", 320.0) if "tds" in extracted_parameters else 320.0
    temp_val = extracted_parameters.get("temperature", {}).get("value", 24.0) if "temperature" in extracted_parameters else 24.0
    do_val = extracted_parameters.get("dissolved_oxygen", {}).get("value", 6.5) if "dissolved_oxygen" in extracted_parameters else 6.5
    ec_val = extracted_parameters.get("conductivity", {}).get("value", 450.0) if "conductivity" in extracted_parameters else 450.0
    
    ml_potable = 1
    ml_prob = 0.85
    is_anomaly = False
    
    try:
        features = [ph_val, turb_val, tds_val, temp_val, do_val, ec_val]
        ml_res = predictor.predict_reading(features)
        ml_potable = int(ml_res.get("potability_pred", 1))
        ml_prob = float(ml_res.get("potability_probability", 0.8))
        is_anomaly = bool(ml_res.get("is_anomaly", False))
    except Exception as e:
        # Fallback heuristic
        ml_potable = 0 if red_count > 0 else 1
        ml_prob = 0.4 if red_count > 0 else 0.85

    # Overall Quality Classification: Good / Moderate / Poor
    if red_count == 0 and yellow_count <= 1 and wqi_score >= 70:
        overall_quality = "Good"
        risk_level = "Low Risk"
    elif red_count == 0 and yellow_count > 1 or (wqi_score >= 50 and red_count <= 1):
        overall_quality = "Moderate"
        risk_level = "Moderate Risk"
    else:
        overall_quality = "Poor"
        risk_level = "High Risk" if red_count <= 2 else "Severe Hazard"

    # Determine Safety Category (A, B, or C)
    # CRITICAL: Never declare drinking water potable without microbiological tests!
    has_microbial = any(k in extracted_parameters for k in ["e_coli", "coliform", "fecal_coliform"])
    
    if red_count > 0:
        safety_category = "Potentially Unsafe"
    elif yellow_count > 0:
        safety_category = "Needs Attention"
    else:
        safety_category = "Safe or Within Reference Limits"

    # Identify Missing Critical Tests for Drinking Water
    critical_drinking_tests = [
        {"key": "coliform", "name": "Total Coliform Bacteria", "reason": "Verifies absence of sewage or environmental microbial contamination."},
        {"key": "e_coli", "name": "Escherichia coli (E. coli)", "reason": "Crucial indicator of recent fecal contamination and disease-causing pathogens."},
        {"key": "nitrate", "name": "Nitrate (NO3)", "reason": "Guards against methemoglobinemia (blue baby syndrome) and fertilizer runoff."},
        {"key": "turbidity", "name": "Turbidity", "reason": "Ensures water is clear enough for effective disinfection."},
        {"key": "lead_arsenic", "name": "Heavy Metals (Lead / Arsenic)", "reason": "Guards against neurological toxicity and chronic carcinogens."}
    ]
    missing_critical = []
    if use_key == "drinking":
        for t in critical_drinking_tests:
            if t["key"] not in extracted_parameters:
                missing_critical.append(t)

    # Compile Potential Risks
    potential_risks = []
    for k, v in evaluated_params.items():
        if v["status"] in ["yellow", "red"]:
            severity = "High" if v["status"] == "red" else "Moderate"
            implications = v["health_significance"] or f"Parameter '{v['name']}' is outside desirable reference bounds."
            
            # Context-specific action
            if k == "ph":
                next_step = "Inspect plumbing and source water. Seek certified professional consultation before adding neutralizing filters."
            elif k == "turbidity":
                next_step = "Sediment/multimedia filtration required. Conduct microbiological test as turbidity shields pathogens."
            elif k == "tds":
                next_step = "Perform a laboratory mineral breakdown test to determine if high TDS is due to harmless hardness or toxic salts."
            elif k == "nitrate":
                next_step = "Avoid using for infant formula or pregnant women. Switch to verified bottled or reverse osmosis water."
            elif k in ["coliform", "e_coli"]:
                next_step = "STOP consumption immediately. Source requires shock chlorination or UV treatment followed by retesting."
            else:
                next_step = f"Perform confirmatory re-testing for {v['name']} at a NABL/EPA accredited water laboratory."
                
            potential_risks.append({
                "parameter": v["name"],
                "observed_value": f"{v['value']} {v['unit']}",
                "reference_range": v["reference_range"],
                "status": v["status"],
                "severity": severity,
                "implications": implications,
                "recommended_next_step": next_step
            })

    # Parameter-Specific Safety Guidance (No blanket boiling!)
    parameter_safety_guidance = []
    for k, v in evaluated_params.items():
        if v["status"] in ["yellow", "red"]:
            if k == "turbidity":
                parameter_safety_guidance.append({
                    "title": "Turbidity & Cloudiness Management",
                    "issue": f"Measured turbidity of {v['value']} {v['unit']} exceeds the standard target.",
                    "guidance": [
                        "Investigate suspended particles, silt, or recent pipe corrosion.",
                        "Consider appropriate mechanical sediment filtration (5-micron sediment filter).",
                        "Arrange microbiological testing immediately, as particulate matter shields harmful bacteria from disinfection.",
                        "Important: Do NOT assume clear water is microbiologically safe; clear appearance does not equal bacterial purity."
                    ]
                })
            elif k == "ph":
                parameter_safety_guidance.append({
                    "title": "pH Equilibrium & Corrosion Control",
                    "issue": f"Measured pH of {v['value']} is outside the ideal 6.5 - 8.5 range.",
                    "guidance": [
                        "Investigate the environmental or geological source of the pH alteration.",
                        "Arrange an on-site water-treatment assessment by an accredited professional.",
                        "Do not attempt chemical neutralizer additions (such as soda ash or acid injection) without professional engineering design."
                    ]
                })
            elif k == "tds":
                parameter_safety_guidance.append({
                    "title": "Total Dissolved Solids (TDS) Guidance",
                    "issue": f"Measured TDS of {v['value']} {v['unit']} is elevated.",
                    "guidance": [
                        "Investigate the underlying dissolved substances (e.g., sodium, calcium, magnesium, sulfates, chlorides).",
                        "Obtain laboratory testing for specific dissolved minerals and heavy metals.",
                        "Select targeted treatment (e.g., Reverse Osmosis or ion-exchange softening) based on the confirmed dissolved substances.",
                        "CAUTION: Boiling water does NOT remove TDS or dissolved salts. In fact, boiling evaporates pure water and further concentrates dissolved minerals."
                    ]
                })
            elif k == "dissolved_oxygen":
                parameter_safety_guidance.append({
                    "title": "Dissolved Oxygen (DO) & Freshness",
                    "issue": f"Measured DO of {v['value']} {v['unit']} indicates low oxygenation.",
                    "guidance": [
                        "Low DO indicates stagnation, biological decomposition, or organic waste intrusion.",
                        "Investigate storage tank stagnation, check valves, or surface contamination.",
                        "Ensure water tanks have proper ventilation and are cleaned periodically."
                    ]
                })
            elif k == "nitrate":
                parameter_safety_guidance.append({
                    "title": "Nitrate Health Warning",
                    "issue": f"Measured Nitrate of {v['value']} {v['unit']} exceeds recommended safety limits.",
                    "guidance": [
                        "CRITICAL: High nitrates pose a severe health risk to infants under 6 months (methemoglobinemia or 'Blue Baby Syndrome') and pregnant women.",
                        "Immediately switch to a verified alternative drinking water source for vulnerable individuals.",
                        "Arrange confirmatory laboratory testing.",
                        "CAUTION: NEVER boil water with high nitrate levels. Boiling does NOT destroy nitrates and causes water to evaporate, concentrating nitrate levels further.",
                        "Effective treatments include dedicated Reverse Osmosis (RO) or specific anion-exchange resin filters."
                    ]
                })
            elif k in ["coliform", "e_coli"]:
                parameter_safety_guidance.append({
                    "title": "Microbiological Pathogen Alert",
                    "issue": f"Microbial contamination detected ({v['name']}: {v['value']} {v['unit']}).",
                    "guidance": [
                        "STOP drinking this water immediately.",
                        "Use bottled or certified potable municipal supply for drinking, food preparation, and teeth brushing.",
                        "Boiling at a rolling boil for at least 1-3 minutes is effective ONLY for biological pathogens, provided chemical contaminants are within safe limits.",
                        "Directly contact local public-health authorities and arrange complete disinfection (shock chlorination/UV) followed by sterile repeat testing."
                    ]
                })

    # Dedicated Safety Recommendations based on Safety Category
    if safety_category == "Safe or Within Reference Limits":
        recommendations = {
            "status_title": "Water Parameters are Within Applicable Reference Limits",
            "primary_notice": "All extracted and tested parameters comply with acceptable reference thresholds for the selected intended use.",
            "actions": [
                "Maintain routine water testing (recommend twice-yearly testing for tap/well water: once pre-monsoon and once post-monsoon).",
                "Ensure routine inspection and sanitation of overhead and underground water storage tanks every 6 months.",
                "Replace water filter cartridges, sediment pre-filters, and UV lamps according to manufacturer schedules."
            ],
            "potability_caveat": "Note: While tested chemical parameters appear compliant, this report does NOT guarantee absolute drinking water safety unless comprehensive microbiological (E. coli, coliform) and toxic metal screening have been performed.",
            "emergency_actions": []
        }
    elif safety_category == "Needs Attention":
        recommendations = {
            "status_title": "Water Parameters Require Follow-Up Attention",
            "primary_notice": f"Your report contains {yellow_count} parameter(s) requiring attention or exceeding preferred reference baselines.",
            "actions": [
                "Arrange targeted follow-up testing with a certified water testing laboratory for the flagged parameters.",
                "Consult with a licensed water treatment technician to review your current filtration or conditioning setup.",
                "Check source pipelines, borewell casings, or storage tanks for leaks, sediment buildup, or cross-contamination.",
                "If using for drinking, consider using an alternative certified drinking water source until follow-up testing is completed."
            ],
            "potability_caveat": "Some parameters exceed standard aesthetic, palatability, or initial reference limits. While not necessarily an acute emergency, consumption should be reviewed with qualified specialists.",
            "emergency_actions": []
        }
    else: # Potentially Unsafe
        recommendations = {
            "status_title": "SAFETY ALERT: Water is Potentially Unsafe for Consumption",
            "primary_notice": f"CRITICAL: {red_count} parameter(s) significantly exceed acceptable limits under recognized standards ({standards_ref['primary_standard']}).",
            "actions": [
                "DO NOT CONSUME this water for drinking, beverage preparation, infant feeding, or oral hygiene.",
                "Immediately switch to a verified, certified alternative drinking water supply (such as certified packaged drinking water or safe municipal supply).",
                "Contact your local municipal water board, public health authority, or accredited water testing laboratory.",
                "Isolate the affected water line from household drinking taps to prevent accidental ingestion.",
                "Do not attempt unverified homemade treatments or random chemical additions."
            ],
            "potability_caveat": "SEVERE WARNING: Automated ML prediction and chemical benchmarks show severe parameter exceedances. Immediate professional remediation is required before this water can be considered safe.",
            "emergency_actions": [
                "Cease drinking immediately",
                "Use verified alternative source",
                "Notify all occupants or facility staff",
                "Schedule accredited laboratory verification"
            ]
        }

    # Generate Plain-Language Human AI Explanation ("What Does Your Water Report Mean?")
    ai_explanation = generate_human_ai_explanation(
        intended_use=use_key,
        overall_quality=overall_quality,
        wqi_score=wqi_score,
        evaluated_params=evaluated_params,
        green_count=green_count,
        yellow_count=yellow_count,
        red_count=red_count,
        safety_category=safety_category,
        has_microbial=has_microbial
    )

    return {
        "intended_use": use_key,
        "sample_metadata": sample_metadata,
        "overall_quality": overall_quality,
        "wqi_score": wqi_score,
        "risk_level": risk_level,
        "safety_category": safety_category,
        "potability_prediction": ml_potable,
        "potability_probability": ml_prob,
        "is_potable_certified": False, # Never certify drinking water on ML
        "is_anomaly": is_anomaly,
        "evaluated_parameters": evaluated_params,
        "parameter_counts": {
            "total": len(evaluated_params),
            "green": green_count,
            "yellow": yellow_count,
            "red": red_count
        },
        "ai_explanation": ai_explanation,
        "potential_risks": potential_risks,
        "parameter_safety_guidance": parameter_safety_guidance,
        "recommendations": recommendations,
        "missing_critical_tests": missing_critical,
        "standards_used": {
            "primary": standards_ref.get("primary_standard", "BIS IS 10500:2012"),
            "secondary": standards_ref.get("secondary_standard", "WHO Guidelines 4th Edition")
        },
        "statutory_disclaimer": (
            "AquaPulse AI provides informational water quality assessment based on algorithmic evaluation "
            "against recognized standards (BIS IS 10500:2012 / WHO). This analysis does NOT constitute a certified "
            "laboratory sanitary survey or legal guarantee of potability. In matters affecting public health, always "
            "verify with an accredited laboratory (e.g., NABL / EPA certified) and consult local health authorities."
        ),
        "analyzed_at": datetime.utcnow().isoformat()
    }

def generate_human_ai_explanation(
    intended_use: str,
    overall_quality: str,
    wqi_score: float,
    evaluated_params: Dict[str, Any],
    green_count: int,
    yellow_count: int,
    red_count: int,
    safety_category: str,
    has_microbial: bool
) -> str:
    """
    Generates plain-language, jargon-free summary ("What Does Your Water Report Mean?").
    """
    paragraphs = []
    
    # Opening sentence
    if overall_quality == "Good":
        paragraphs.append(
            f"Based on your report, your water quality is categorized as Good (Water Quality Index: {wqi_score}/100). "
            f"All {green_count} extracted measurement(s) align comfortably with established benchmark criteria."
        )
    elif overall_quality == "Moderate":
        paragraphs.append(
            f"Your water quality is categorized as Moderate (Water Quality Index: {wqi_score}/100). "
            f"While several parameters are satisfactory, {yellow_count + red_count} parameter(s) show elevated values or mild deviations "
            f"that warrant observation and preventative care."
        )
    else:
        paragraphs.append(
            f"Your water quality is categorized as Poor (Water Quality Index: {wqi_score}/100). "
            f"Significant parameter deviations ({red_count} exceedance(s)) were detected that exceed accepted reference thresholds."
        )

    # Specific insights
    highlights = []
    if "ph" in evaluated_params:
        p = evaluated_params["ph"]
        if p["status"] == "green":
            highlights.append(f"the pH is neutral and balanced ({p['value']})")
        else:
            highlights.append(f"the pH is { 'acidic' if p['value'] < 6.5 else 'alkaline' } ({p['value']}) which may cause plumbing wear or scale")
            
    if "tds" in evaluated_params:
        p = evaluated_params["tds"]
        if p["status"] == "green":
            highlights.append(f"mineral content is well-balanced (TDS: {p['value']} {p['unit']})")
        else:
            highlights.append(f"total dissolved solids are high at {p['value']} {p['unit']}, which affects taste and mineral deposition")
            
    if "turbidity" in evaluated_params:
        p = evaluated_params["turbidity"]
        if p["status"] == "green":
            highlights.append("water clarity is high")
        else:
            highlights.append(f"turbidity is elevated at {p['value']} {p['unit']}, giving water a cloudy appearance")

    if highlights:
        paragraphs.append(f"Specifically, {', and '.join(highlights)}.")

    # Safety disclaimer context
    if intended_use == "drinking":
        if not has_microbial:
            paragraphs.append(
                "Please note: This water report did not include microbiological testing (such as E. coli or coliform). "
                "Even when water is chemically clear and balanced, microscopic biological pathogens cannot be detected without specific bacterial tests."
            )
        if red_count > 0:
            paragraphs.append(
                "Because one or more parameters exceed permissible safety ceilings, this water should NOT be consumed directly without certified corrective treatment."
            )
    else:
        paragraphs.append(f"These results were evaluated specifically for suitability in {intended_use.title()} applications.")

    return " ".join(paragraphs)

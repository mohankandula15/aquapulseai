"""
Recognized Water Quality Reference Standards Repository.
Prioritizes:
- BIS IS 10500:2012 (Indian Standard Drinking Water Specification, Second Revision)
- WHO Guidelines for Drinking-water Quality (4th edition, incorporating 1st and 2nd addenda)
- CPCB / FAO Guidelines for Agricultural (Irrigation) Use
- General Process & Cooling Standards for Industrial Use
"""

STANDARDS = {
    "drinking": {
        "name": "Drinking Water (BIS IS 10500:2012 & WHO Guidelines)",
        "primary_standard": "Bureau of Indian Standards (BIS IS 10500:2012)",
        "secondary_standard": "WHO Guidelines for Drinking-water Quality (4th Edition)",
        "parameters": {
            "ph": {
                "name": "pH Level",
                "unit": "pH",
                "acceptable_min": 6.5,
                "acceptable_max": 8.5,
                "permissible_min": 6.5,
                "permissible_max": 8.5,
                "source": "BIS IS 10500:2012 / WHO 4th Edition",
                "significance": "Indicator of acidic or alkaline character. pH < 6.5 causes corrosion of plumbing and heavy metal leaching; pH > 8.5 causes scaling, bitter taste, and reduces chlorine disinfection efficacy."
            },
            "turbidity": {
                "name": "Turbidity",
                "unit": "NTU",
                "acceptable_max": 1.0,
                "permissible_max": 5.0,
                "acceptable_min": 0.0,
                "source": "BIS IS 10500:2012 (Acceptable: 1.0 NTU, Permissible in absence of alternate source: 5.0 NTU)",
                "significance": "Cloudiness caused by suspended particles. Particles shield microbial pathogens from chemical disinfection and can indicate structural pipe failure or sediment runoff."
            },
            "tds": {
                "name": "Total Dissolved Solids (TDS)",
                "unit": "mg/L",
                "acceptable_max": 500.0,
                "permissible_max": 2000.0,
                "acceptable_min": 50.0,
                "source": "BIS IS 10500:2012 (Acceptable: 500 mg/L, Permissible: 2000 mg/L) / WHO palatability guideline (<600 mg/L)",
                "significance": "Dissolved inorganic salts (calcium, magnesium, potassium, sodium, chlorides, sulfates). High TDS causes palatability loss, scaling, gastrointestinal irritation in unaccustomed consumers."
            },
            "dissolved_oxygen": {
                "name": "Dissolved Oxygen (DO)",
                "unit": "mg/L",
                "acceptable_min": 5.0,
                "acceptable_max": 14.0,
                "source": "CPCB Fresh Water Criteria Class A / Standard Limnology Guideline",
                "significance": "Essential for ecological freshness. Levels below 5.0 mg/L suggest biological waste decomposition, organic stagnation, or bacterial contamination."
            },
            "conductivity": {
                "name": "Electrical Conductivity (EC)",
                "unit": "µS/cm",
                "acceptable_max": 750.0,
                "permissible_max": 1500.0,
                "acceptable_min": 50.0,
                "source": "WHO International Standards for Drinking-water (Max recommended: 750 µS/cm)",
                "significance": "Direct indicator of total ionic charge. Rapid increases indicate saline intrusion or industrial effluent discharge."
            },
            "temperature": {
                "name": "Water Temperature",
                "unit": "°C",
                "acceptable_min": 10.0,
                "acceptable_max": 25.0,
                "permissible_max": 30.0,
                "source": "WHO Aesthetic & Kinetic Guidelines (Cool water <15-20°C is preferable)",
                "significance": "Temperature impacts gas solubility, chemical reaction rates, and microbiological proliferation kinetics."
            },
            "nitrate": {
                "name": "Nitrate (as NO3)",
                "unit": "mg/L",
                "acceptable_max": 45.0,
                "permissible_max": 45.0,
                "acceptable_min": 0.0,
                "source": "BIS IS 10500:2012 (Max 45 mg/L) / WHO Guideline (50 mg/L as NO3)",
                "significance": "Crucial health risk indicator. Excess nitrate poses serious risks of infantile methemoglobinemia ('blue baby syndrome') and thyroid disruption. Commonly originates from agricultural fertilizer runoff and sewage."
            },
            "bod": {
                "name": "Biochemical Oxygen Demand (BOD)",
                "unit": "mg/L",
                "acceptable_max": 2.0,
                "permissible_max": 3.0,
                "acceptable_min": 0.0,
                "source": "CPCB Water Quality Standards for Drinking Source after disinfection (Class A)",
                "significance": "Measures organic biodegradable matter. High BOD indicates fecal or industrial organic contamination consuming dissolved oxygen."
            },
            "cod": {
                "name": "Chemical Oxygen Demand (COD)",
                "unit": "mg/L",
                "acceptable_max": 10.0,
                "permissible_max": 15.0,
                "acceptable_min": 0.0,
                "source": "Environmental Protection Standards / Treated Drinking Water Baseline",
                "significance": "Measures both biologically degradable and non-biodegradable chemical oxidizable matter."
            },
            "coliform": {
                "name": "Total Coliform Bacteria",
                "unit": "MPN/100ml",
                "acceptable_max": 0.0,
                "permissible_max": 0.0,
                "acceptable_min": 0.0,
                "source": "BIS IS 10500:2012 (Shall not be detectable in any 100 ml sample)",
                "significance": "Microbiological sanitary indicator. Presence indicates potential pathogenic bacterial, viral, or protozoan contamination."
            },
            "e_coli": {
                "name": "Escherichia coli (E. coli)",
                "unit": "MPN/100ml",
                "acceptable_max": 0.0,
                "permissible_max": 0.0,
                "acceptable_min": 0.0,
                "source": "BIS IS 10500:2012 / WHO Guideline (Zero per 100 ml)",
                "significance": "Definitive evidence of recent fecal contamination. Serious biological health hazard requiring immediate boiling or alternative drinking source."
            },
            "chlorides": {
                "name": "Chlorides (as Cl)",
                "unit": "mg/L",
                "acceptable_max": 250.0,
                "permissible_max": 1000.0,
                "acceptable_min": 0.0,
                "source": "BIS IS 10500:2012 (Acceptable: 250 mg/L, Permissible: 1000 mg/L)",
                "significance": "High chloride gives a salty taste and accelerates metal pipe corrosion."
            },
            "sulfates": {
                "name": "Sulfates (as SO4)",
                "unit": "mg/L",
                "acceptable_max": 200.0,
                "permissible_max": 400.0,
                "acceptable_min": 0.0,
                "source": "BIS IS 10500:2012 (Acceptable: 200 mg/L, Permissible: 400 mg/L)",
                "significance": "High sulfate levels can induce laxative effects and dehydration in transient consumers."
            },
            "total_hardness": {
                "name": "Total Hardness (as CaCO3)",
                "unit": "mg/L",
                "acceptable_max": 200.0,
                "permissible_max": 600.0,
                "acceptable_min": 0.0,
                "source": "BIS IS 10500:2012 (Acceptable: 200 mg/L, Permissible: 600 mg/L)",
                "significance": "Causes soap precipitation and scaling in hot-water systems. Not directly toxic but affects utility."
            }
        }
    },
    "household": {
        "name": "Household & Domestic Use (Washing, Bathing, Sanitation)",
        "primary_standard": "CPCB Criteria for Bathing / Domestic Supply (Class B & C)",
        "secondary_standard": "WHO Domestic Water Safety Guidelines",
        "parameters": {
            "ph": {
                "name": "pH Level",
                "unit": "pH",
                "acceptable_min": 6.5,
                "acceptable_max": 8.5,
                "source": "CPCB Class B (Outdoor Bathing)",
                "significance": "Skin and eye irritation risk if outside 6.5 to 8.5 range."
            },
            "turbidity": {
                "name": "Turbidity",
                "unit": "NTU",
                "acceptable_max": 5.0,
                "permissible_max": 10.0,
                "source": "CPCB Domestic Standard",
                "significance": "Affects clothing laundry cleanliness, appliance lifespan, and filtration cartridge life."
            },
            "tds": {
                "name": "Total Dissolved Solids (TDS)",
                "unit": "mg/L",
                "acceptable_max": 1000.0,
                "permissible_max": 2000.0,
                "source": "CPCB Domestic Supply Standard",
                "significance": "Causes severe scaling in geysers, washing machines, and plumbing fixtures above 1000 mg/L."
            },
            "dissolved_oxygen": {
                "name": "Dissolved Oxygen",
                "unit": "mg/L",
                "acceptable_min": 5.0,
                "source": "CPCB Class B Standard (Minimum 5 mg/L)",
                "significance": "Prevents anaerobic odor formation in storage tanks."
            },
            "conductivity": {
                "name": "Electrical Conductivity",
                "unit": "µS/cm",
                "acceptable_max": 1500.0,
                "source": "WHO Domestic Water Standards",
                "significance": "Indicates high salt or ion presence."
            },
            "total_hardness": {
                "name": "Total Hardness",
                "unit": "mg/L",
                "acceptable_max": 300.0,
                "permissible_max": 600.0,
                "source": "BIS IS 10500 Domestic Baseline",
                "significance": "High hardness wastes soap and damages electrical heaters."
            }
        }
    },
    "agricultural": {
        "name": "Agricultural & Irrigation Use",
        "primary_standard": "FAO Irrigation Water Quality Standards",
        "secondary_standard": "CPCB Class E (Irrigation & Industrial Cooling)",
        "parameters": {
            "ph": {
                "name": "pH Level",
                "unit": "pH",
                "acceptable_min": 6.0,
                "acceptable_max": 8.5,
                "source": "FAO Guidelines for Irrigation Water",
                "significance": "Affects soil nutrient availability and root uptake."
            },
            "tds": {
                "name": "Total Dissolved Solids (Salinity)",
                "unit": "mg/L",
                "acceptable_max": 1000.0,
                "permissible_max": 2000.0,
                "source": "FAO Salinity Guidelines (<450 mg/L: no restriction, 450-2000 mg/L: slight to moderate restriction)",
                "significance": "Salinity causes osmotic stress, stunting crop development and salinizing agricultural soils."
            },
            "conductivity": {
                "name": "Electrical Conductivity (ECw)",
                "unit": "µS/cm",
                "acceptable_max": 1000.0,
                "permissible_max": 3000.0,
                "source": "FAO Irrigation Guidelines (EC < 700 µS/cm no restriction)",
                "significance": "Primary index of irrigation water salinity hazard."
            },
            "nitrate": {
                "name": "Nitrate (as NO3)",
                "unit": "mg/L",
                "acceptable_max": 30.0,
                "permissible_max": 100.0,
                "source": "FAO Nitrogen Guidelines (NO3-N > 30 mg/L severe restriction)",
                "significance": "Excessive nitrogen delays maturity, stimulates leafy growth over fruiting, and pollutes underlying groundwater."
            },
            "dissolved_oxygen": {
                "name": "Dissolved Oxygen",
                "unit": "mg/L",
                "acceptable_min": 4.0,
                "source": "CPCB Class E Standard",
                "significance": "Oxygenated water prevents root rot and anaerobic soil pathogens."
            }
        }
    },
    "industrial": {
        "name": "Industrial Process & Cooling Use",
        "primary_standard": "CPCB Class E & Standard Industrial Guidelines",
        "secondary_standard": "ASME Boiler and Cooling Water Standards",
        "parameters": {
            "ph": {
                "name": "pH Level",
                "unit": "pH",
                "acceptable_min": 6.5,
                "acceptable_max": 8.5,
                "source": "Industrial Process Reference",
                "significance": "Extreme pH corrodes metal boiler tubes and cooling jackets."
            },
            "turbidity": {
                "name": "Turbidity",
                "unit": "NTU",
                "acceptable_max": 10.0,
                "permissible_max": 25.0,
                "source": "Industrial Process Water Guideline",
                "significance": "Suspended solids cause erosion and fouling of heat exchanger surfaces."
            },
            "tds": {
                "name": "Total Dissolved Solids",
                "unit": "mg/L",
                "acceptable_max": 1500.0,
                "permissible_max": 3000.0,
                "source": "Industrial Cooling Specification",
                "significance": "High TDS produces dense thermal scale on heat transfer surfaces."
            },
            "conductivity": {
                "name": "Electrical Conductivity",
                "unit": "µS/cm",
                "acceptable_max": 2000.0,
                "source": "Industrial Process Reference",
                "significance": "Controls blowdown frequency in industrial cooling towers."
            }
        }
    }
}

def get_reference_standards(intended_use: str = "drinking") -> dict:
    use_key = intended_use.lower()
    if use_key not in STANDARDS:
        use_key = "drinking"
    return STANDARDS[use_key]

def evaluate_parameter_against_standard(param_key: str, value: float, intended_use: str = "drinking") -> dict:
    """
    Evaluates an observed water quality parameter value against reference standards
    for the selected intended use.
    Returns status: 'green' (safe/within limit), 'yellow' (attention required),
    'red' (exceeds permissible limit), or 'grey' (not tested / unstandardized).
    """
    standards = get_reference_standards(intended_use)
    params_std = standards.get("parameters", {})
    
    if param_key not in params_std:
        return {
            "name": param_key.replace("_", " ").title(),
            "value": value,
            "unit": "",
            "status": "grey",
            "reference_range": "No specific guideline",
            "standard_source": standards.get("primary_standard", "General Reference"),
            "message": "Parameter not listed in current baseline.",
            "health_significance": ""
        }
        
    cfg = params_std[param_key]
    unit = cfg.get("unit", "")
    name = cfg.get("name", param_key.title())
    source = cfg.get("source", standards.get("primary_standard", ""))
    sig = cfg.get("significance", "")
    
    acc_min = cfg.get("acceptable_min")
    acc_max = cfg.get("acceptable_max")
    perm_min = cfg.get("permissible_min", acc_min)
    perm_max = cfg.get("permissible_max", acc_max)
    
    # Build human-readable reference range string
    if acc_min is not None and acc_max is not None:
        if perm_max is not None and perm_max > acc_max:
            ref_str = f"{acc_min} - {acc_max} (Max {perm_max} {unit})"
        else:
            ref_str = f"{acc_min} - {acc_max} {unit}"
    elif acc_max is not None:
        if perm_max is not None and perm_max > acc_max:
            ref_str = f"<= {acc_max} (Max {perm_max} {unit})"
        else:
            ref_str = f"<= {acc_max} {unit}"
    elif acc_min is not None:
        ref_str = f">= {acc_min} {unit}"
    else:
        ref_str = "Desirable"

    # Evaluation logic
    status = "green"
    msg = f"{name} is within acceptable limits ({ref_str})."
    
    # 1. Microbiological zero-tolerance check
    if param_key in ["coliform", "e_coli"]:
        if value > 0:
            status = "red"
            msg = f"Pathogenic microbial contamination detected! ({value} {unit}). Immediate disinfection required."
        else:
            status = "green"
            msg = f"No {name} detected. Microbiologically compliant."
        return {
            "name": name,
            "value": value,
            "unit": unit,
            "status": status,
            "reference_range": "0 (Must not be detectable)",
            "standard_source": source,
            "message": msg,
            "health_significance": sig
        }

    # 2. Minimum bounds check (e.g., pH < 6.5, DO < 5.0)
    if acc_min is not None:
        if value < acc_min:
            if perm_min is not None and value < perm_min:
                status = "red"
                msg = f"{name} ({value}) falls below critical permissible lower bound ({perm_min})."
            else:
                status = "yellow"
                msg = f"{name} ({value}) is lower than desirable threshold ({acc_min})."

    # 3. Maximum bounds check (e.g., TDS > 500, Turbidity > 1.0, Nitrate > 45)
    if acc_max is not None and status != "red":
        if value > acc_max:
            if perm_max is not None and value > perm_max:
                status = "red"
                msg = f"{name} ({value} {unit}) exceeds permissible ceiling of {perm_max} {unit}."
            else:
                status = "yellow"
                msg = f"{name} ({value} {unit}) exceeds desirable baseline of {acc_max} {unit}."

    return {
        "name": name,
        "value": value,
        "unit": unit,
        "status": status,
        "reference_range": ref_str,
        "standard_source": source,
        "message": msg,
        "health_significance": sig
    }


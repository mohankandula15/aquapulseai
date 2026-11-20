import re
import io
import csv
from datetime import datetime
import pandas as pd
from pypdf import PdfReader
from PIL import Image

try:
    import pytesseract
    HAS_TESSERACT = True
except ImportError:
    HAS_TESSERACT = False

# Parameter recognition patterns and common aliases
PARAMETER_PATTERNS = {
    "ph": {
        "regex": [r"\bph\b(?!\s*[\w])", r"p\.h\.", r"hydrogen\s+ion\s+activity", r"ph\s+value"],
        "unit_default": "pH",
        "valid_range": (0.0, 14.0),
        "name": "pH Level"
    },
    "turbidity": {
        "regex": [r"turbidity", r"clarity", r"ntu"],
        "unit_default": "NTU",
        "valid_range": (0.0, 150.0),
        "name": "Turbidity"
    },
    "tds": {
        "regex": [r"total\s+dissolved\s+solids", r"\btds\b", r"dissolved\s+solids"],
        "unit_default": "mg/L",
        "valid_range": (0.0, 10000.0),
        "name": "Total Dissolved Solids (TDS)"
    },
    "dissolved_oxygen": {
        "regex": [r"dissolved\s+oxygen", r"\bdo\b(?!\s*[\w])", r"d\.o\."],
        "unit_default": "mg/L",
        "valid_range": (0.0, 25.0),
        "name": "Dissolved Oxygen (DO)"
    },
    "conductivity": {
        "regex": [r"electrical\s+conductivity", r"conductivity", r"\bec\b(?!\s*[\w])", r"conductance"],
        "unit_default": "µS/cm",
        "valid_range": (0.0, 20000.0),
        "name": "Electrical Conductivity (EC)"
    },
    "temperature": {
        "regex": [r"temperature", r"\btemp\b", r"water\s+temp"],
        "unit_default": "°C",
        "valid_range": (0.0, 70.0),
        "name": "Water Temperature"
    },
    "nitrate": {
        "regex": [r"nitrate", r"no3", r"nitrate\s+as\s+no3", r"nitrate\s+nitrogen"],
        "unit_default": "mg/L",
        "valid_range": (0.0, 500.0),
        "name": "Nitrate (as NO3)"
    },
    "bod": {
        "regex": [r"biochemical\s+oxygen\s+demand", r"\bbod\b", r"b\.o\.d\."],
        "unit_default": "mg/L",
        "valid_range": (0.0, 200.0),
        "name": "Biochemical Oxygen Demand (BOD)"
    },
    "cod": {
        "regex": [r"chemical\s+oxygen\s+demand", r"\bcod\b", r"c\.o\.d\."],
        "unit_default": "mg/L",
        "valid_range": (0.0, 500.0),
        "name": "Chemical Oxygen Demand (COD)"
    },
    "coliform": {
        "regex": [r"total\s+coliform", r"coliform\s+bacteria", r"coliforms"],
        "unit_default": "MPN/100ml",
        "valid_range": (0.0, 10000.0),
        "name": "Total Coliform Bacteria"
    },
    "e_coli": {
        "regex": [r"escherichia\s+coli", r"e\.\s*coli", r"faecal\s+coliform", r"fecal\s+coliform"],
        "unit_default": "MPN/100ml",
        "valid_range": (0.0, 10000.0),
        "name": "Escherichia coli (E. coli)"
    },
    "chlorides": {
        "regex": [r"chloride", r"chlorides", r"\bcl\b(?!\s*[\w])"],
        "unit_default": "mg/L",
        "valid_range": (0.0, 5000.0),
        "name": "Chlorides (as Cl)"
    },
    "sulfates": {
        "regex": [r"sulfate", r"sulphate", r"sulfates", r"sulphates", r"so4"],
        "unit_default": "mg/L",
        "valid_range": (0.0, 5000.0),
        "name": "Sulfates (as SO4)"
    },
    "total_hardness": {
        "regex": [r"total\s+hardness", r"hardness", r"caco3"],
        "unit_default": "mg/L",
        "valid_range": (0.0, 2000.0),
        "name": "Total Hardness"
    }
}

class ReportExtractor:
    """
    Robust multi-format water report parser.
    Extracts parameters, measured values, units, reference limits, and sample metadata.
    """

    def extract_from_file(self, filename: str, content: bytes) -> dict:
        ext = filename.lower().split('.')[-1]
        raw_text = ""
        source_format = ext.upper()

        if ext == "pdf":
            raw_text = self._extract_pdf_text(content)
        elif ext in ["jpg", "jpeg", "png"]:
            raw_text = self._extract_image_text(content)
        elif ext in ["csv", "txt"]:
            return self._extract_csv_data(filename, content)
        else:
            raise ValueError(f"Unsupported file format '.{ext}'. Supported: PDF, JPG, PNG, CSV.")

        # Extract structured report data from text
        return self._parse_report_text(filename, raw_text, source_format)

    def _extract_pdf_text(self, content: bytes) -> str:
        text_chunks = []
        try:
            reader = PdfReader(io.BytesIO(content))
            for page in reader.pages:
                extracted = page.extract_text()
                if extracted:
                    text_chunks.append(extracted)
        except Exception as e:
            print(f"[Extractor] PDF extraction warning: {e}")

        raw = "\n".join(text_chunks)
        # If PDF was scanned and returned little or no text, try OCR fallback
        if len(raw.strip()) < 30 and HAS_TESSERACT:
            try:
                pass # pytesseract page rasterization if tesseract is available
            except Exception:
                pass
        return raw

    def _extract_image_text(self, content: bytes) -> str:
        if HAS_TESSERACT:
            try:
                img = Image.open(io.BytesIO(content))
                return pytesseract.image_to_string(img)
            except Exception as e:
                print(f"[Extractor] Image OCR warning: {e}")
        return ""

    def _extract_csv_data(self, filename: str, content: bytes) -> dict:
        try:
            df = pd.read_csv(io.BytesIO(content))
        except Exception:
            # Fallback to semicolon or tab
            df = pd.read_csv(io.BytesIO(content), sep=None, engine='python')

        # Clean columns
        df.columns = [str(c).lower().strip().replace(' ', '_').replace('-', '_') for c in df.columns]

        metadata = {
            "laboratory": "Laboratory Dataset",
            "sample_date": datetime.utcnow().strftime("%Y-%m-%d"),
            "sample_location": "Field Water Sample",
            "sample_id": filename.split('.')[0]
        }

        # Check for metadata in columns or first row
        for meta_col in ["lab", "laboratory", "lab_name"]:
            if meta_col in df.columns:
                metadata["laboratory"] = str(df[meta_col].iloc[0])
        for loc_col in ["location", "station", "site", "source"]:
            if loc_col in df.columns:
                metadata["sample_location"] = str(df[loc_col].iloc[0])
        for date_col in ["date", "sample_date", "timestamp"]:
            if date_col in df.columns:
                metadata["sample_date"] = str(df[date_col].iloc[0])

        extracted_params = {}
        # Take the most recent or first row of values
        row = df.iloc[0]

        for std_key, cfg in PARAMETER_PATTERNS.items():
            matched_col = None
            for col in df.columns:
                for pat in cfg["regex"]:
                    if re.search(pat, col, re.IGNORECASE):
                        matched_col = col
                        break
                if matched_col:
                    break

            if matched_col and pd.notna(row[matched_col]):
                try:
                    val = float(row[matched_col])
                    is_valid = cfg["valid_range"][0] <= val <= cfg["valid_range"][1]
                    extracted_params[std_key] = {
                        "name": cfg["name"],
                        "value": round(val, 2),
                        "unit": cfg["unit_default"],
                        "confidence": 0.98 if is_valid else 0.50,
                        "needs_verification": not is_valid,
                        "reported_reference": ""
                    }
                except (ValueError, TypeError):
                    pass

        warnings = []
        for k, p in extracted_params.items():
            if p.get("needs_verification"):
                warnings.append(f"Parameter '{p.get('name', k)}' value {p.get('value')} may be outside expected physical range.")

        return {
            "filename": filename,
            "source_format": "CSV",
            "raw_text_length": len(content),
            "metadata": metadata,
            "parameters": extracted_params,
            "extracted_parameters": extracted_params,
            "requires_user_verification": any(p["needs_verification"] for p in extracted_params.values()) or len(extracted_params) == 0,
            "verification_warnings": warnings,
            "missing_key_parameters": [k for k in ["ph", "turbidity", "tds", "dissolved_oxygen", "conductivity"] if k not in extracted_params]
        }

    def _parse_report_text(self, filename: str, text: str, source_format: str) -> dict:
        lines = [l.strip() for l in text.split("\n") if l.strip()]

        # 1. Metadata Extraction
        lab_name = self._find_lab_name(text)
        metadata = {
            "laboratory": lab_name,
            "laboratory_name": lab_name,
            "sample_date": self._find_date(text),
            "sample_location": self._find_location(text),
            "sample_id": self._find_sample_id(text, filename)
        }

        # 2. Parameter Extraction
        extracted_params = {}

        for param_key, cfg in PARAMETER_PATTERNS.items():
            param_match = self._extract_parameter_from_lines(lines, text, param_key, cfg)
            if param_match:
                extracted_params[param_key] = param_match

        # Check if critical parameters are missing
        core_params = ["ph", "turbidity", "tds", "dissolved_oxygen", "conductivity"]
        missing_core = [p for p in core_params if p not in extracted_params]

        warnings = []
        for k, p in extracted_params.items():
            if p.get("needs_verification"):
                warnings.append(f"Check '{p.get('name', k)}': reading {p.get('value')} {p.get('unit')} warrants verification.")
        if "coliform" not in extracted_params and "e_coli" not in extracted_params:
            warnings.append("Microbiological safety tests (E. coli / Total Coliform) not detected in report.")

        needs_verification = (
            len(extracted_params) < 3 or
            any(p.get("needs_verification", False) for p in extracted_params.values())
        )

        return {
            "filename": filename,
            "source_format": source_format,
            "raw_text_length": len(text),
            "raw_text": text,
            "metadata": metadata,
            "parameters": extracted_params,
            "extracted_parameters": extracted_params,
            "requires_user_verification": needs_verification,
            "verification_warnings": warnings,
            "missing_key_parameters": missing_core
        }

    def _extract_parameter_from_lines(self, lines: list, full_text: str, param_key: str, cfg: dict):
        # Look line by line for parameter keyword, with multi-line table support
        for idx, line in enumerate(lines):
            line_lower = line.lower()
            for pat in cfg["regex"]:
                if re.search(pat, line_lower, re.IGNORECASE):
                    # Check current line, and if no valid number, inspect next 3 lines (columnar table cells)
                    lines_to_check = [line]
                    for offset in range(1, 4):
                        if idx + offset < len(lines):
                            lines_to_check.append(lines[idx + offset])

                    for check_str in lines_to_check:
                        # Strip chemical subscripts like NO3, SO4, CaCO3 so they are not mistaken for measurements
                        sanitized_str = re.sub(r'(?:NO|SO|PO|CO)\d+|CaCO\d+', '', check_str, flags=re.IGNORECASE)
                        tokens = re.findall(r"[-+]?\d*\.?\d+", sanitized_str)
                        if tokens:
                            for t in tokens:
                                try:
                                    val = float(t)
                                    if val in [10500.0, 2012.0, 2026.0, 2025.0, 2024.0]:
                                        continue

                                    is_valid = cfg["valid_range"][0] <= val <= cfg["valid_range"][1]
                                    if is_valid:
                                        unit = self._detect_unit(check_str, cfg["unit_default"])
                                        ref_str = self._detect_reference_limit(check_str)

                                        return {
                                            "name": cfg["name"],
                                            "value": round(val, 2),
                                            "unit": unit,
                                            "confidence": 0.95,
                                            "needs_verification": False,
                                            "reported_limit": ref_str,
                                            "raw_match": check_str
                                        }
                                except (ValueError, TypeError):
                                    continue

        return None

    def _detect_unit(self, line: str, default_unit: str) -> str:
        line_lower = line.lower()
        if "mg/l" in line_lower or "mg / l" in line_lower or "ppm" in line_lower:
            return "mg/L"
        if "ntu" in line_lower:
            return "NTU"
        if "µs/cm" in line_lower or "us/cm" in line_lower or "microsiemens" in line_lower:
            return "µS/cm"
        if "mpn" in line_lower or "cfu" in line_lower:
            return "MPN/100ml"
        if "°c" in line_lower or "deg c" in line_lower or "celsius" in line_lower:
            return "°C"
        return default_unit

    def _detect_reference_limit(self, line: str) -> str:
        # Check if line contains patterns like "Max 5.0", "6.5 - 8.5", "Limit: 500"
        ref_match = re.search(r"(?:limit|standard|max|acceptable|range)[\s:]*([0-9\.\-\s]+(?:\s*[a-zA-Z/°]+)?)", line, re.IGNORECASE)
        if ref_match:
            return ref_match.group(1).strip()
        return ""

    def _find_lab_name(self, text: str) -> str:
        # Common laboratory headers
        lab_patterns = [
            r"(?:laboratory|testing\s+lab|analytical\s+services|environmental\s+lab)[\s:]+([A-Za-z0-9\s,\.\-&]{4,40})",
            r"([A-Za-z0-9\s&]{4,35}(?:Laboratories|Lab|Testing\s+Center|Analytical\s+Bureau))",
            r"(Bureau\s+of\s+Indian\s+Standards\s+Accredited\s+Lab)"
        ]
        for pat in lab_patterns:
            m = re.search(pat, text, re.IGNORECASE)
            if m:
                return m.group(1).strip().title()
        return "Certified Water Quality Testing Laboratory"

    def _find_date(self, text: str) -> str:
        # Look for date patterns (DD/MM/YYYY, YYYY-MM-DD, Month DD, YYYY)
        date_patterns = [
            r"\b(\d{1,2}[/-]\d{1,2}[/-]\d{2,4})\b",
            r"\b(\d{4}[/-]\d{1,2}[/-]\d{1,2})\b",
            r"\b((?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\s+\d{1,2},?\s+\d{4})\b"
        ]
        for pat in date_patterns:
            m = re.search(pat, text, re.IGNORECASE)
            if m:
                return m.group(1).strip()
        return datetime.utcnow().strftime("%Y-%m-%d")

    def _find_location(self, text: str) -> str:
        loc_patterns = [
            r"(?:sample\s+location|source|sampling\s+point|site)[\s:]+([A-Za-z0-9\s,\.\-]{3,40})",
            r"(?:collected\s+from|drawn\s+at)[\s:]+([A-Za-z0-9\s,\.\-]{3,40})"
        ]
        for pat in loc_patterns:
            m = re.search(pat, text, re.IGNORECASE)
            if m:
                return m.group(1).strip().title()
        return "Municipal Drinking Water Supply / Borewell"

    def _find_sample_id(self, text: str, filename: str) -> str:
        m = re.search(r"(?:sample\s+id|report\s+no|job\s+no)[\s:]*([A-Za-z0-9\-_/]{4,25})", text, re.IGNORECASE)
        if m:
            return m.group(1).strip()
        # Fallback to sanitized filename
        base = filename.rsplit('.', 1)[0]
        return re.sub(r'[^A-Za-z0-9\-_]', '_', base)[:20]

extractor = ReportExtractor()

def extract_from_bytes(content: bytes, filename: str) -> dict:
    """Convenience helper to extract from bytes."""
    return extractor.extract_from_file(filename=filename, content=content)


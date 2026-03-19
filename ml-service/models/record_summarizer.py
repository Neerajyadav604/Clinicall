"""
Medical Record Summarizer — Module 3
TF-IDF extractive summarization on FHIR clinical records.
Pure scikit-learn + rule-based NLP. No LLM. No API calls.
Fully offline.

Pipeline:
  1. Parse FHIR conditions, observations, medications, allergies
  2. Build structured text corpus from records
  3. TF-IDF vectorization to rank medical terms
  4. Template-fill summary paragraph
  5. Rule-check allergy vs medication conflicts
  6. Flag abnormal vitals using standard medical ranges
  7. Compute health trend from severity of flags
"""

from typing import List, Dict, Optional
from sklearn.feature_extraction.text import TfidfVectorizer
import re


# ============================================================================
# VITAL SIGN RANGES (standard medical reference values)
# ============================================================================

VITAL_RANGES = {
    "blood pressure": {
        "systolic_normal_max": 120,
        "systolic_elevated_max": 140,
        "diastolic_normal_max": 80,
        "unit": "mmHg",
        "flags": {
            "normal":   lambda v: v <= 120,
            "elevated": lambda v: 120 < v <= 140,
            "high":     lambda v: v > 140,
        }
    },
    "heart rate": {
        "low": 60,
        "high": 100,
        "unit": "bpm",
        "flags": {
            "low":    lambda v: v < 60,
            "normal": lambda v: 60 <= v <= 100,
            "high":   lambda v: v > 100,
        }
    },
    "spo2": {
        "low": 95,
        "unit": "%",
        "flags": {
            "low":    lambda v: v < 95,
            "normal": lambda v: v >= 95,
        }
    },
    "temperature": {
        "fever_threshold": 37.5,
        "high_fever": 39.0,
        "unit": "C",
        "flags": {
            "normal":     lambda v: v <= 37.5,
            "fever":      lambda v: 37.5 < v <= 39.0,
            "high_fever": lambda v: v > 39.0,
        }
    },
    "glucose": {
        "low": 70,
        "normal_max": 140,
        "high": 200,
        "unit": "mg/dL",
        "flags": {
            "low":    lambda v: v < 70,
            "normal": lambda v: 70 <= v <= 140,
            "high":   lambda v: v > 140,
        }
    },
    "bmi": {
        "underweight": 18.5,
        "normal_max": 25.0,
        "overweight": 30.0,
        "unit": "kg/m2",
        "flags": {
            "underweight": lambda v: v < 18.5,
            "normal":      lambda v: 18.5 <= v < 25.0,
            "overweight":  lambda v: 25.0 <= v < 30.0,
            "obese":       lambda v: v >= 30.0,
        }
    }
}


# ============================================================================
# ALLERGY FAMILY MAP
# ============================================================================

ALLERGY_FAMILIES = {
    "penicillin": [
        "amoxicillin", "ampicillin", "cloxacillin",
        "flucloxacillin", "piperacillin", "amoxicillin-clavulanate",
        "co-amoxiclav", "augmentin"
    ],
    "sulfa": [
        "sulfamethoxazole", "co-trimoxazole", "trimethoprim",
        "bactrim", "septran", "furosemide", "hydrochlorothiazide"
    ],
    "cephalosporin": [
        "cephalexin", "cefazolin", "ceftriaxone", "cefuroxime",
        "cefixime", "cefpodoxime", "cefdinir", "cephalothin"
    ],
    "nsaid": [
        "ibuprofen", "naproxen", "diclofenac", "aspirin",
        "ketorolac", "indomethacin", "celecoxib", "piroxicam",
        "mefenamic acid"
    ],
    "tetracycline": [
        "doxycycline", "minocycline", "tetracycline",
        "oxytetracycline"
    ],
    "macrolide": [
        "azithromycin", "clarithromycin", "erythromycin",
        "roxithromycin"
    ],
    "fluoroquinolone": [
        "ciprofloxacin", "levofloxacin", "ofloxacin",
        "norfloxacin", "moxifloxacin"
    ],
    "ace inhibitor": [
        "enalapril", "lisinopril", "ramipril", "perindopril",
        "captopril", "benazepril"
    ],
    "statin": [
        "atorvastatin", "rosuvastatin", "simvastatin",
        "pravastatin", "lovastatin", "fluvastatin"
    ],
}


# ============================================================================
# HELPER: CHECK VITAL
# ============================================================================

def _check_vital(obs_code: str, value: float) -> Optional[Dict]:
    """
    Check if an observation value is abnormal.
    Match obs_code (case-insensitive) to VITAL_RANGES keys.

    Returns:
      {
        "vital": str,
        "value": float,
        "unit": str,
        "status": "elevated" | "high" | "low" | "fever" | etc.,
        "is_abnormal": bool
      }
    Or None if vital not recognized.
    """
    obs_lower = obs_code.lower().strip()

    for vital_name, vital_config in VITAL_RANGES.items():
        if vital_name in obs_lower or obs_lower in vital_name:
            # Found a match
            flags = vital_config.get("flags", {})
            status = None
            is_abnormal = False

            # Check each flag condition in order
            for flag_status, flag_fn in flags.items():
                try:
                    if flag_fn(value):
                        status = flag_status
                        if flag_status != "normal":
                            is_abnormal = True
                        break
                except:
                    continue

            if status is None:
                status = "unknown"

            return {
                "vital": vital_name,
                "value": value,
                "unit": vital_config.get("unit", ""),
                "status": status,
                "is_abnormal": is_abnormal
            }

    return None


# ============================================================================
# HELPER: CHECK ALLERGY CONFLICTS
# ============================================================================

def _check_allergy_conflicts(
        medications: List[Dict],
        allergies: List[str]
) -> List[Dict]:
    """
    Check for allergy-drug family conflicts.

    Args:
        medications: list of dicts with "name" key
        allergies: list of allergy strings

    Returns list of conflict dicts:
    [
      {
        "flag": "ALLERGY_DRUG_CONFLICT",
        "message": "...",
        "severity": "HIGH",
        "drug": "...",
        "allergy": "..."
      }
    ]
    """
    conflicts = []

    for allergy in allergies:
        allergy_lower = allergy.lower().strip()

        # Check if this allergy is in our family map
        for family_name, drug_list in ALLERGY_FAMILIES.items():
            if family_name in allergy_lower or allergy_lower in family_name:
                # Found the family — check medications
                for med in medications:
                    med_name = med.get("name", "").lower().strip()
                    if not med_name:
                        continue

                    # Check if medication is in this family
                    for family_drug in drug_list:
                        if family_drug in med_name:
                            # Conflict found
                            family_display = family_name.title()
                            conflicts.append({
                                "flag": "ALLERGY_DRUG_CONFLICT",
                                "message": (
                                    f"Patient allergic to {allergy} — "
                                    f"{med_name.title()} is a {family_display}-type medication"
                                ),
                                "severity": "HIGH",
                                "drug": med.get("name", ""),
                                "allergy": allergy
                            })
                            break

    return conflicts


# ============================================================================
# HELPER: EXTRACT KEY TERMS VIA TF-IDF
# ============================================================================

def _extract_key_terms(text_corpus: List[str], top_n: int = 10) -> List[str]:
    """
    Use TF-IDF to extract most important medical terms
    from a list of text strings.

    Returns: list of strings (key medical terms)
    """
    if not text_corpus:
        return []

    # Filter out empty strings
    text_corpus = [t for t in text_corpus if t and t.strip()]

    if not text_corpus:
        return []

    try:
        vectorizer = TfidfVectorizer(
            stop_words="english",
            max_features=100,
            ngram_range=(1, 2)
        )

        tfidf_matrix = vectorizer.fit_transform(text_corpus)
        feature_names = vectorizer.get_feature_names_out()

        # Sum TF-IDF scores across all documents
        scores = tfidf_matrix.sum(axis=0).A1
        top_indices = scores.argsort()[-top_n:][::-1]

        return [feature_names[i] for i in top_indices if i < len(feature_names)]

    except Exception as e:
        print(f"[ML] TF-IDF extraction error: {e}")
        return []


# ============================================================================
# HELPER: BUILD SUMMARY PARAGRAPH
# ============================================================================

def _build_summary_paragraph(
        conditions: List[Dict],
        observations: List[Dict],
        medications: List[Dict],
        allergies: List[str],
        abnormal_vitals: List[Dict],
        risk_flags: List[Dict]
) -> str:
    """
    Build a readable plain-English summary paragraph.
    """
    parts = []

    # Part 1 — Conditions
    if conditions:
        condition_names = [c.get("display", c.get("code", "Unknown")) for c in conditions]
        parts.append(f"Patient has a history of {', '.join(condition_names)}.")
    else:
        parts.append("No significant medical conditions recorded.")

    # Part 2 — Active medications
    active_meds = [m for m in medications if m.get("status", "").lower() == "active"]
    if active_meds:
        med_strs = []
        for med in active_meds:
            med_name = med.get("name", "Unknown")
            dosage = med.get("dosage", "")
            if dosage:
                med_strs.append(f"{med_name} {dosage}")
            else:
                med_strs.append(med_name)
        parts.append(f"Currently on {', '.join(med_strs)}.")
    else:
        parts.append("No active medications.")

    # Part 3 — Abnormal vitals
    for vital in abnormal_vitals:
        if vital.get("is_abnormal"):
            vital_name = vital.get("vital", "Vital").title()
            value = vital.get("value", 0)
            unit = vital.get("unit", "")
            status = vital.get("status", "abnormal").title()
            parts.append(f"{vital_name} {status}: {value} {unit}.")

    # Part 4 — Allergies
    if allergies:
        allergy_str = ", ".join(allergies)
        parts.append(f"Known allergies: {allergy_str}.")

    # Part 5 — High risk flag
    high_severity_flags = [f for f in risk_flags if f.get("severity") == "HIGH"]
    if high_severity_flags:
        first_message = high_severity_flags[0].get("message", "Alert: High-risk condition detected")
        parts.append(f"ATTENTION: {first_message}")

    return " ".join(parts)


# ============================================================================
# HELPER: CALCULATE HEALTH TREND
# ============================================================================

def _calculate_health_trend(
        risk_flags: List[Dict],
        abnormal_vitals: List[Dict],
        active_med_count: int,
        condition_count: int
) -> str:
    """
    Calculate overall health trend from clinical data.

    Rules (in priority order):
    1. If any flag with severity "HIGH" → "needs attention"
    2. If 2+ abnormal vitals → "needs attention"
    3. If active_med_count >= 5 → "needs attention" (polypharmacy)
    4. If condition_count >= 3 and abnormal_vitals → "needs attention"
    5. Otherwise → "stable"
    """
    # Rule 1: HIGH severity flags
    if any(f.get("severity") == "HIGH" for f in risk_flags):
        return "needs attention"

    # Rule 2: 2+ abnormal vitals
    abnormal_count = sum(1 for v in abnormal_vitals if v.get("is_abnormal"))
    if abnormal_count >= 2:
        return "needs attention"

    # Rule 3: Polypharmacy (5+ active medications)
    if active_med_count >= 5:
        return "needs attention"

    # Rule 4: Multiple conditions with abnormal vitals
    if condition_count >= 3 and abnormal_count > 0:
        return "needs attention"

    # Default: stable
    return "stable"


# ============================================================================
# MAIN SUMMARIZE FUNCTION
# ============================================================================

def summarize(data: Dict) -> Dict:
    """
    Generate clinical summary from patient FHIR records.

    Args:
        data: dict with keys:
          patient_id: str
          conditions: list of {code, display, date}
          observations: list of {type, code, value, unit, date}
          medications: list of {name, status, dosage}
          allergies: list of strings

    Returns:
        {
          "summary": str,
          "risk_flags": [...],
          "health_trend": "stable" | "needs attention",
          "key_stats": {...},
          "key_terms": [...]
        }
    """
    try:
        # Extract all fields with defaults
        patient_id = data.get("patient_id", "unknown")
        conditions = data.get("conditions", []) or []
        observations = data.get("observations", []) or []
        medications = data.get("medications", []) or []
        allergies = data.get("allergies", []) or []

        # Ensure they're all lists
        if not isinstance(conditions, list):
            conditions = []
        if not isinstance(observations, list):
            observations = []
        if not isinstance(medications, list):
            medications = []
        if not isinstance(allergies, list):
            allergies = []

        risk_flags = []
        abnormal_vitals = []

        # Step 1: Check allergy conflicts
        allergy_conflicts = _check_allergy_conflicts(medications, allergies)
        risk_flags.extend(allergy_conflicts)

        # Step 2: Check each observation for abnormal vitals
        for obs in observations:
            obs_code = obs.get("code", "")
            obs_value = obs.get("value", 0)

            try:
                vital_check = _check_vital(obs_code, obs_value)
                if vital_check:
                    abnormal_vitals.append(vital_check)

                    # Add flag if abnormal
                    if vital_check.get("is_abnormal"):
                        vital_name = vital_check.get("vital", "Vital")
                        value = vital_check.get("value", 0)
                        unit = vital_check.get("unit", "")
                        status = vital_check.get("status", "abnormal")

                        severity = "MODERATE"
                        if vital_name == "spo2" and status == "low":
                            severity = "HIGH"
                        elif vital_name == "blood pressure" and status == "high":
                            severity = "HIGH"
                        elif vital_name == "temperature" and status == "high_fever":
                            severity = "HIGH"

                        risk_flags.append({
                            "flag": "ABNORMAL_VITAL",
                            "message": f"{vital_name.title()}: {value} {unit} ({status})",
                            "severity": severity
                        })
            except Exception as e:
                print(f"[ML] Vital check error for {obs_code}: {e}")
                continue

        # Step 3: Build text corpus for TF-IDF
        text_corpus = []

        # Add condition texts
        for cond in conditions:
            display = cond.get("display", cond.get("code", ""))
            if display:
                text_corpus.append(display)

        # Add medication texts
        for med in medications:
            med_name = med.get("name", "")
            dosage = med.get("dosage", "")
            if med_name:
                text_corpus.append(med_name)
                if dosage:
                    text_corpus.append(dosage)

        # Add allergy texts
        text_corpus.extend(allergies)

        # Step 4: Extract key terms
        key_terms = _extract_key_terms(text_corpus, top_n=10)

        # Step 5: Build summary paragraph
        active_meds = [m for m in medications if m.get("status", "").lower() == "active"]
        summary = _build_summary_paragraph(
            conditions,
            observations,
            medications,
            allergies,
            abnormal_vitals,
            risk_flags
        )

        # Step 6: Calculate health trend
        health_trend = _calculate_health_trend(
            risk_flags,
            abnormal_vitals,
            len(active_meds),
            len(conditions)
        )

        # Log
        print(f"[ML] Record summarizer: processed patient {patient_id}")
        print(f"[ML] Found: {len(conditions)} conditions, "
              f"{len(observations)} observations, {len(medications)} medications")
        print(f"[ML] Risk flags: {len(risk_flags)}  Abnormal vitals: "
              f"{sum(1 for v in abnormal_vitals if v.get('is_abnormal'))}")

        # Build response
        return {
            "summary": summary,
            "risk_flags": risk_flags,
            "health_trend": health_trend,
            "key_stats": {
                "total_conditions": len(conditions),
                "active_medications": len(active_meds),
                "total_medications": len(medications),
                "abnormal_vitals": [
                    v.get("vital", "")
                    for v in abnormal_vitals
                    if v.get("is_abnormal")
                ],
                "known_allergies": len(allergies),
                "risk_flag_count": len(risk_flags)
            },
            "key_terms": key_terms
        }

    except Exception as e:
        print(f"[ML] Summarize error: {e}")
        return {
            "summary": "Unable to generate summary. Please try again.",
            "risk_flags": [],
            "health_trend": "stable",
            "key_stats": {
                "total_conditions": 0,
                "active_medications": 0,
                "total_medications": 0,
                "abnormal_vitals": [],
                "known_allergies": 0,
                "risk_flag_count": 0
            },
            "key_terms": [],
            "error": str(e)
        }

"""
Doctor Recommender — Module 2
Cosine similarity + multi-factor weighted scoring on live MongoDB
doctor data passed from Node.js backend.

Algorithm:
  score = 0.40 * specialization_match
        + 0.30 * normalized_rating
        + 0.20 * normalized_experience
        + 0.10 * inverse_normalized_fee

Cosine similarity applied on top when doctor pool > 5.
Always returns top 3 doctors sorted by matchScore desc.
"""

from typing import List, Dict, Optional
import math


# ============================================================================
# SPECIALIZATION SIMILARITY MAP
# ============================================================================

SPEC_SIMILARITY = {
    "general physician": [
        "general practice", "family medicine",
        "internal medicine", "general medicine"
    ],
    "cardiologist": [
        "cardiovascular", "heart specialist",
        "interventional cardiology"
    ],
    "pulmonologist": [
        "respiratory", "chest specialist",
        "pulmonary medicine"
    ],
    "neurologist": [
        "neuro", "brain specialist",
        "neuroscience"
    ],
    "endocrinologist": [
        "diabetes specialist", "hormone specialist",
        "metabolic diseases"
    ],
    "dermatologist": [
        "skin specialist", "cosmetology",
        "dermatology"
    ],
    "gastroenterologist": [
        "digestive", "gut specialist",
        "hepatology"
    ],
    "rheumatologist": [
        "arthritis specialist", "autoimmune",
        "musculoskeletal"
    ],
    "psychiatrist": [
        "mental health", "psychology",
        "behavioral health"
    ],
    "orthopedist": [
        "bone specialist", "orthopedic",
        "sports medicine"
    ],
    "nephrologist": [
        "kidney specialist", "renal medicine"
    ],
    "urologist": [
        "urinary specialist", "urology"
    ],
    "hematologist": [
        "blood specialist", "oncology"
    ],
    "ophthalmologist": [
        "eye specialist", "optometry"
    ],
    "ent specialist": [
        "otolaryngologist", "ear nose throat"
    ],
}


# ============================================================================
# DISEASE TO SPECIALIZATION MAP
# ============================================================================

DISEASE_SPEC_MAP = {
    # General Physician
    "malaria":             "general physician",
    "typhoid":             "general physician",
    "dengue":              "general physician",
    "common cold":         "general physician",
    "influenza":           "general physician",
    "chickenpox":          "general physician",
    "allergy":             "general physician",
    "gastroenteritis":     "general physician",
    "urinary tract infection": "urologist",
    "fungal infection":    "dermatologist",
    # Specialists
    "tuberculosis":        "pulmonologist",
    "asthma":              "pulmonologist",
    "pneumonia":           "pulmonologist",
    "diabetes":            "endocrinologist",
    "hypertension":        "cardiologist",
    "heart attack":        "cardiologist",
    "migraine":            "neurologist",
    "arthritis":           "rheumatologist",
    "jaundice":            "gastroenterologist",
    "hepatitis":           "gastroenterologist",
    "anemia":              "hematologist",
    "acne":                "dermatologist",
    "eczema":              "dermatologist",
    "psoriasis":           "dermatologist",
    "anxiety":             "psychiatrist",
    "depression":          "psychiatrist",
    "epilepsy":            "neurologist",
    "osteoporosis":        "rheumatologist",
    "kidney disease":      "nephrologist",
}


# ============================================================================
# HELPER FUNCTION: NORMALIZER
# ============================================================================

def _normalize(values: List[float]) -> List[float]:
    """
    Min-max normalize a list of floats to [0, 1] range.
    Returns list of same length.
    If all values equal, returns list of 1.0 (avoid div by zero).
    """
    if not values:
        return []

    min_val = min(values)
    max_val = max(values)

    if min_val == max_val:
        # All values are the same
        return [1.0] * len(values)

    normalized = []
    for v in values:
        norm = (v - min_val) / (max_val - min_val)
        normalized.append(norm)

    return normalized


# ============================================================================
# HELPER FUNCTION: SPECIALIZATION MATCHER
# ============================================================================

def _spec_match_score(doctor_spec: str, target_spec: str) -> float:
    """
    Score how well doctor's specialization matches target.

    Returns:
      1.00 — exact match (case-insensitive)
      0.75 — doctor spec contains target or vice versa
      0.50 — doctor spec is in target's similarity list
      0.25 — target is general physician (any doctor can help)
      0.10 — no match found
    """
    doc_lower = doctor_spec.lower().strip()
    tgt_lower = target_spec.lower().strip()

    # Exact match
    if doc_lower == tgt_lower:
        return 1.0

    # Substring match (either direction)
    if doc_lower in tgt_lower or tgt_lower in doc_lower:
        return 0.75

    # Check similarity list
    if tgt_lower in SPEC_SIMILARITY:
        similar_specs = SPEC_SIMILARITY[tgt_lower]
        if any(spec in doc_lower for spec in similar_specs):
            return 0.50

    # Target is general physician (most doctors can help)
    if tgt_lower == "general physician":
        return 0.25

    # No match
    return 0.10


# ============================================================================
# HELPER FUNCTION: BUILD FEATURE VECTOR
# ============================================================================

def _build_feature_vector(
        doctor: Dict,
        target_spec: str,
        max_rating: float,
        max_exp: float,
        max_fee: float
) -> List[float]:
    """
    Build a normalized feature vector for cosine similarity.
    Vector: [spec_score, rating_norm, exp_norm, fee_inv_norm]
    Used when doctor pool > 5 doctors.
    """
    spec_score = _spec_match_score(doctor.get("specialization", ""), target_spec)

    rating = doctor.get("rating", 0)
    rating_norm = (rating / max_rating) if max_rating > 0 else 0

    exp = doctor.get("experience", 0)
    exp_norm = (exp / max_exp) if max_exp > 0 else 0

    fee = doctor.get("consultationFee", 0)
    fee_inv_norm = 1 - ((fee / max_fee) if max_fee > 0 else 0)

    return [spec_score, rating_norm, exp_norm, fee_inv_norm]


# ============================================================================
# COSINE SIMILARITY HELPER
# ============================================================================

def _cosine_similarity(vec1: List[float], vec2: List[float]) -> float:
    """
    Compute cosine similarity between two vectors.
    Both should be same length.
    """
    if not vec1 or not vec2 or len(vec1) != len(vec2):
        return 0.0

    dot_product = sum(a * b for a, b in zip(vec1, vec2))
    mag1 = math.sqrt(sum(a * a for a in vec1))
    mag2 = math.sqrt(sum(b * b for b in vec2))

    if mag1 == 0 or mag2 == 0:
        return 0.0

    return dot_product / (mag1 * mag2)


# ============================================================================
# MATCH REASON BUILDER
# ============================================================================

def _build_match_reason(
        spec_score: float,
        rating: float,
        experience: float,
        consulting_fee: float
) -> str:
    """Build a human-readable match reason string."""
    parts = []

    # Specialization reason
    if spec_score == 1.0:
        parts.append("Exact specialization match")
    elif spec_score >= 0.75:
        parts.append("Related specialization")
    else:
        parts.append("General practitioner")

    # Rating reason
    if rating >= 4.5:
        parts.append(f"highly rated ({rating:.1f}/5)")

    # Experience reason
    if experience >= 10:
        parts.append(f"{int(experience)} years experience")

    # Fee reason
    if consulting_fee <= 300:
        parts.append("affordable fee")

    return ", ".join(parts)


# ============================================================================
# MAIN RECOMMEND FUNCTION
# ============================================================================

def recommend(
        predicted_disease: str,
        recommended_specialization: str,
        doctors: List[Dict]
) -> Dict:
    """
    Score and rank doctors for a predicted disease.

    Args:
        predicted_disease: Top disease from symptom checker
        recommended_specialization: Specialization string
        doctors: List of doctor dicts from Node.js MongoDB query
                 Each dict has: id, name, specialization,
                 experience, rating, consultationFee,
                 totalAppointments

    Returns:
        {
          "recommended_doctors": [
            {
              "doctorId": str,
              "name": str,
              "specialization": str,
              "matchScore": float (0-1),
              "matchReason": str,
              "matchPercentage": int (0-100),
              "rating": float,
              "experience": float,
              "consultationFee": float
            }
          ],
          "total_doctors_evaluated": int,
          "target_specialization": str
        }
    """
    # Handle empty doctors list
    if not doctors:
        print("[ML] Doctor recommendation: no doctors provided")
        return {
            "recommended_doctors": [],
            "total_doctors_evaluated": 0,
            "target_specialization": recommended_specialization.lower()
        }

    # Determine target specialization
    target_spec = recommended_specialization.lower()

    # Try to get more specific spec from disease map
    disease_lower = predicted_disease.lower()
    if disease_lower in DISEASE_SPEC_MAP:
        mapped_spec = DISEASE_SPEC_MAP[disease_lower]
        # Use mapped spec if it's not general physician, or if target is also general
        if mapped_spec != "general physician":
            target_spec = mapped_spec

    # Extract numeric values for normalization
    ratings = [d.get("rating", 0) for d in doctors]
    experiences = [d.get("experience", 0) for d in doctors]
    fees = [d.get("consultationFee", 0) for d in doctors]

    max_rating = max(ratings) if ratings else 1
    max_exp = max(experiences) if experiences else 1
    max_fee = max(fees) if fees else 1

    # Avoid division by zero
    if max_rating == 0:
        max_rating = 1
    if max_exp == 0:
        max_exp = 1
    if max_fee == 0:
        max_fee = 1

    # Score each doctor
    scored_doctors = []

    for doctor in doctors:
        # Weighted score components
        spec_score = _spec_match_score(doctor.get("specialization", ""), target_spec)
        rating = doctor.get("rating", 0)
        rating_norm = rating / max_rating if max_rating > 0 else 0
        experience = doctor.get("experience", 0)
        exp_norm = experience / max_exp if max_exp > 0 else 0
        fee = doctor.get("consultationFee", 0)
        fee_norm = fee / max_fee if max_fee > 0 else 0
        fee_inv_norm = 1 - fee_norm

        # Weighted score
        weighted_score = (
            0.40 * spec_score
            + 0.30 * rating_norm
            + 0.20 * exp_norm
            + 0.10 * fee_inv_norm
        )

        final_score = weighted_score

        # Apply cosine similarity if enough doctors
        if len(doctors) > 5:
            feature_vec = _build_feature_vector(
                doctor,
                target_spec,
                max_rating,
                max_exp,
                max_fee
            )
            query_vec = [1.0, 1.0, 1.0, 1.0]  # Ideal doctor
            cosine_score = _cosine_similarity(feature_vec, query_vec)
            final_score = 0.7 * weighted_score + 0.3 * cosine_score

        match_reason = _build_match_reason(spec_score, rating, experience, fee)

        scored_doctors.append({
            "doctorId": str(doctor.get("id", "")),
            "name": doctor.get("name", "Unknown"),
            "specialization": doctor.get("specialization", ""),
            "matchScore": round(final_score, 3),
            "matchPercentage": round(final_score * 100),
            "matchReason": match_reason,
            "rating": round(rating, 1),
            "experience": round(experience, 1),
            "consultationFee": float(fee)
        })

    # Sort by match score descending
    scored_doctors.sort(key=lambda x: x["matchScore"], reverse=True)

    # Get top 3
    top_doctors = scored_doctors[:3]

    # Log
    if top_doctors:
        print(
            f"[ML] Doctor recommendation: evaluated {len(doctors)} doctors"
        )
        print(f"[ML] Target specialization: {target_spec}")
        print(f"[ML] Top match: {top_doctors[0]['name']} ({top_doctors[0]['matchPercentage']}%)")

    return {
        "recommended_doctors": top_doctors,
        "total_doctors_evaluated": len(doctors),
        "target_specialization": target_spec
    }

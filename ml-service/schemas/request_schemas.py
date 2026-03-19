"""Pydantic request and response schemas for Clinicall ML modules."""

from typing import List, Optional

from pydantic import BaseModel, Field


class SymptomRequest(BaseModel):
    """Input payload for the symptom checker."""

    symptoms: List[str]


class DiseasePrediction(BaseModel):
    """Single disease prediction item."""

    disease: str
    confidence: float
    description: str
    precautions: List[str]


class SymptomResponse(BaseModel):
    """Response payload for symptom analysis."""

    predictions: List[DiseasePrediction]
    recommended_specialization: str


class DoctorInfo(BaseModel):
    """Doctor data used by the recommender module."""

    id: str
    name: str
    specialization: str
    experience: Optional[float] = 0
    rating: Optional[float] = 0
    consultationFee: Optional[float] = 0
    totalAppointments: Optional[int] = 0


class RecommendRequest(BaseModel):
    """Input payload for doctor recommendation."""

    predicted_disease: str
    recommended_specialization: str
    patient_location: Optional[str] = None
    doctors: List[DoctorInfo]


class RecommendedDoctor(BaseModel):
    """Recommended doctor output item."""

    doctorId: str
    name: str
    specialization: str
    matchScore: float
    matchReason: str
    rating: float
    consultationFee: float


class RecommendResponse(BaseModel):
    """Response payload for doctor recommendation."""

    recommended_doctors: List[RecommendedDoctor]


class ConditionItem(BaseModel):
    """Condition record used by the summarizer."""

    code: Optional[str] = None
    display: str
    date: Optional[str] = None


class ObservationItem(BaseModel):
    """Observation record used by the summarizer."""

    type: Optional[str] = None
    code: str
    value: float
    unit: str
    date: Optional[str] = None


class MedicationItem(BaseModel):
    """Medication record used by the summarizer."""

    name: str
    status: str
    dosage: Optional[str] = None


class SummarizeRequest(BaseModel):
    """Input payload for medical record summarization."""

    patient_id: str
    conditions: List[ConditionItem] = Field(default_factory=list)
    observations: List[ObservationItem] = Field(default_factory=list)
    medications: List[MedicationItem] = Field(default_factory=list)
    allergies: List[str] = Field(default_factory=list)


class RiskFlag(BaseModel):
    """Risk flag returned by the summarizer."""

    flag: str
    message: str
    severity: str


class KeyStats(BaseModel):
    """Structured summary statistics for a patient record."""

    total_conditions: int
    active_medications: int
    abnormal_vitals: List[str]


class SummarizeResponse(BaseModel):
    """Response payload for medical record summarization."""

    summary: str
    risk_flags: List[RiskFlag]
    health_trend: str
    key_stats: KeyStats


class DrugCheckRequest(BaseModel):
    """Input payload for drug interaction checking."""

    medications: List[str]
    allergies: List[str] = Field(default_factory=list)


class DrugInteraction(BaseModel):
    """Drug-drug interaction result item."""

    drug1: str
    drug2: str
    severity: str
    effect: str
    recommendation: str


class AllergyConflict(BaseModel):
    """Drug-allergy conflict result item."""

    drug: str
    allergy: str
    severity: str
    message: str


class DrugCheckResponse(BaseModel):
    """Response payload for drug interaction checking."""

    interactions: List[DrugInteraction]
    allergy_conflicts: List[AllergyConflict]
    overall_risk: str

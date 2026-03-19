"""FastAPI entry point for the Clinicall ML microservice."""

from contextlib import asynccontextmanager
import os

import nltk
from dotenv import load_dotenv
from fastapi import APIRouter, FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from models.symptom_model import predict as predict_symptoms
from models.symptom_model import train_model
from models.doctor_recommender import recommend as recommend_doctors
from models.record_summarizer import summarize as summarize_records
from models.drug_checker import check as check_drugs, reload_database
from schemas.request_schemas import SymptomRequest, RecommendRequest, SummarizeRequest, DrugCheckRequest

load_dotenv()


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Handle service startup and shutdown lifecycle events."""
    print("[ML] Clinicall ML Service starting...")
    nltk.download("punkt", quiet=True)
    nltk.download("stopwords", quiet=True)
    nltk.download("punkt_tab", quiet=True)
    print("[ML] NLTK data ready")
    print("[ML] Checking symptom model...")
    if not os.path.exists("saved_models/symptom_model.pkl"):
        print("[ML] No saved model found. Training now...")
        train_model()
    else:
        print("[ML] Saved model found. Will load on first request.")
    print("[ML] Symptom checker ready.")
    print("[ML] Doctor recommender ready.")
    print("[ML] Record summarizer ready.")
    print("[ML] Loading drug interaction database...")
    reload_database()
    print("[ML] Drug interaction checker ready.")
    print("[ML] All models ready")
    yield


app = FastAPI(
    title="Clinicall ML Service",
    description="Classical ML microservice for Clinicall healthcare platform",
    version="1.0.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "http://localhost:4000",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

ml_router = APIRouter(prefix="/ml")


@app.get("/health")
async def health_check() -> dict:
    """Return service readiness status."""
    # Load drug database to get count
    from models.drug_checker import _load_interaction_db
    drug_db = _load_interaction_db()
    
    return {
        "status": "ok",
        "models_loaded": True,
        "version": "1.0.0",
        "service": "Clinicall ML",
        "drug_interactions_loaded": True,
        "total_drug_interactions": len(drug_db),
    }


@app.post("/ml/symptoms/predict")
def symptom_predict(req: SymptomRequest):
    """
    Predict top-3 diseases from a list of symptoms.
    Uses Random Forest classifier trained on symptom-disease dataset.
    """
    if not req.symptoms:
        return JSONResponse(
            status_code=400,
            content={
                "error": "symptoms list cannot be empty",
                "hint": "provide at least 1 symptom",
            },
        )
    if len(req.symptoms) > 20:
        return JSONResponse(
            status_code=400,
            content={
                "error": "too many symptoms",
                "hint": "provide maximum 20 symptoms",
            },
        )
    try:
        result = predict_symptoms(req.symptoms)
        return result
    except Exception as exc:
        print(f"[ML] Prediction error: {exc}")
        return JSONResponse(
            status_code=500,
            content={
                "error": "prediction failed",
                "detail": str(exc),
            },
        )


@app.post("/ml/doctor/recommend")
def doctor_recommend(req: RecommendRequest):
    """
    Rank doctors by match score for a predicted disease.
    Uses cosine similarity + weighted scoring.
    """
    if not req.doctors:
        return {
            "recommended_doctors": [],
            "total_doctors_evaluated": 0,
            "target_specialization": req.recommended_specialization
        }
    try:
        result = recommend_doctors(
            req.predicted_disease,
            req.recommended_specialization,
            [d.model_dump() for d in req.doctors]
        )
        return result
    except Exception as e:
        print(f"[ML] Doctor recommend error: {e}")
        return JSONResponse(
            status_code=500,
            content={"error": "recommendation failed",
                     "detail": str(e)}
        )


@app.post("/ml/records/summarize")
def records_summarize(req: SummarizeRequest):
    """
    Generate plain-English health summary from FHIR records.
    Uses TF-IDF extractive summarization + rule-based NLP.
    """
    try:
        result = summarize_records(req.model_dump())
        return result
    except Exception as e:
        print(f"[ML] Summarize error: {e}")
        return JSONResponse(
            status_code=500,
            content={"error": "summarization failed",
                     "detail": str(e)}
        )


@app.post("/ml/drugs/interactions")
def drug_interactions(req: DrugCheckRequest):
    """
    Check drug-drug interactions and allergy conflicts.
    Uses 60+ hardcoded clinical interactions database.
    100% offline — no external API calls.
    """
    if not req.medications:
        return {
            "interactions": [],
            "allergy_conflicts": [],
            "safe_combinations": [],
            "overall_risk": "SAFE",
            "summary": {
                "total_medications": 0,
                "interactions_found": 0,
                "allergy_conflicts_found": 0,
                "highest_severity": "SAFE",
                "requires_immediate_attention": False
            }
        }
    try:
        result = check_drugs(req.medications, req.allergies)
        return result
    except Exception as e:
        print(f"[ML] Drug check error: {e}")
        return JSONResponse(
            status_code=500,
            content={"error": "drug check failed",
                     "detail": str(e)}
        )


@app.post("/ml/drugs/reload-db")
def reload_drug_db():
    """
    Force reload drug interaction database from JSON file.
    Useful after updating drug_interactions.json at runtime.
    """
    try:
        interactions = reload_database()
        return {
            "success": True,
            "message": "Drug database reloaded",
            "total_interactions": len(interactions)
        }
    except Exception as e:
        return JSONResponse(
            status_code=500,
            content={"error": "reload failed", "detail": str(e)}
        )


app.include_router(ml_router)


if __name__ == "__main__":
    import uvicorn

    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)

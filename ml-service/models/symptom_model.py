"""Symptom Checker model utilities for Clinicall Phase 2."""

from __future__ import annotations

import re
import warnings
from datetime import datetime
from pathlib import Path
from typing import Dict, List, Tuple

import joblib
import numpy as np
import pandas as pd
from sklearn.ensemble import RandomForestClassifier
from sklearn.preprocessing import MultiLabelBinarizer

MODEL_PATH = "saved_models/symptom_model.pkl"
DATA_PATH = "data/symptom_disease.csv"

MASTER_SYMPTOMS = sorted(
    {
        "abdominal pain",
        "back pain",
        "blisters",
        "blood in urine",
        "blurred vision",
        "burning urination",
        "chest pain",
        "chest tightness",
        "chills",
        "cold hands and feet",
        "constipation",
        "cough",
        "dark urine",
        "diarrhea",
        "dizziness",
        "dry cough",
        "ear pain",
        "excessive thirst",
        "eye pain",
        "fatigue",
        "fever",
        "frequent urination",
        "headache",
        "high blood pressure",
        "high fever",
        "irregular heartbeat",
        "itching",
        "joint pain",
        "loss of appetite",
        "loss of smell",
        "loss of taste",
        "mild fever",
        "muscle pain",
        "nausea",
        "neck stiffness",
        "night sweats",
        "pale stool",
        "palpitations",
        "productive cough",
        "rapid breathing",
        "rash",
        "runny nose",
        "severe headache",
        "shortness of breath",
        "skin rash",
        "sneezing",
        "sore throat",
        "spots on skin",
        "sweating",
        "swollen lymph nodes",
        "vomiting",
        "weakness",
        "weight gain",
        "weight loss",
        "wheezing",
        "yellow eyes",
        "yellow skin",
    }
)

FALLBACK_DISEASE_DATA: Dict[str, Dict[str, object]] = {
    "Malaria": {
        "symptoms": ["high fever", "chills", "sweating", "headache", "nausea", "vomiting"],
        "desc": "Malaria is a mosquito-borne parasitic infection that commonly causes recurring fever, chills, and intense weakness.",
        "prec": ["use mosquito nets", "drink plenty of fluids", "seek prompt medical treatment", "avoid stagnant water exposure"],
        "spec": "General Physician",
    },
    "Typhoid": {
        "symptoms": ["high fever", "headache", "abdominal pain", "constipation", "loss of appetite", "weakness"],
        "desc": "Typhoid is a bacterial infection spread through contaminated food or water and often presents with prolonged fever and abdominal discomfort.",
        "prec": ["drink safe water", "eat hygienic food", "complete prescribed antibiotics", "maintain hand hygiene"],
        "spec": "General Physician",
    },
    "Dengue": {
        "symptoms": ["high fever", "severe headache", "joint pain", "muscle pain", "rash", "nausea"],
        "desc": "Dengue is a viral mosquito-borne illness that often causes high fever, body pain, rash, and fatigue.",
        "prec": ["rest adequately", "stay hydrated", "avoid mosquito bites", "monitor for warning signs"],
        "spec": "General Physician",
    },
    "Tuberculosis": {
        "symptoms": ["cough", "weight loss", "fatigue", "night sweats", "chest pain", "loss of appetite"],
        "desc": "Tuberculosis is a lung infection that can cause persistent cough, weight loss, chest discomfort, and night sweats.",
        "prec": ["complete full treatment course", "wear a mask if advised", "improve ventilation", "seek pulmonary evaluation"],
        "spec": "Pulmonologist",
    },
    "Diabetes": {
        "symptoms": ["frequent urination", "excessive thirst", "weight loss", "fatigue", "blurred vision"],
        "desc": "Diabetes is a metabolic disorder marked by high blood sugar and symptoms such as thirst, urination, and fatigue.",
        "prec": ["monitor blood sugar", "follow a balanced diet", "exercise regularly", "take medicines as prescribed"],
        "spec": "Endocrinologist",
    },
    "Hypertension": {
        "symptoms": ["high blood pressure", "headache", "dizziness", "blurred vision", "chest pain"],
        "desc": "Hypertension is persistently elevated blood pressure that may lead to headache, dizziness, and cardiovascular strain.",
        "prec": ["reduce salt intake", "monitor blood pressure", "exercise regularly", "take antihypertensive medicines"],
        "spec": "Cardiologist",
    },
    "Heart Attack": {
        "symptoms": ["chest pain", "shortness of breath", "sweating", "nausea", "palpitations", "irregular heartbeat"],
        "desc": "A heart attack occurs when blood flow to heart muscle is blocked and often presents with chest pain, sweating, and breathlessness.",
        "prec": ["seek emergency care immediately", "avoid physical exertion", "take emergency medication if prescribed", "call emergency services"],
        "spec": "Cardiologist",
    },
    "Migraine": {
        "symptoms": ["severe headache", "nausea", "vomiting", "blurred vision", "eye pain"],
        "desc": "Migraine is a neurological headache disorder that often causes severe head pain with nausea and visual symptoms.",
        "prec": ["rest in a dark quiet room", "stay hydrated", "avoid known triggers", "take prescribed migraine medicines"],
        "spec": "Neurologist",
    },
    "Arthritis": {
        "symptoms": ["joint pain", "back pain", "fatigue", "weakness", "weight gain"],
        "desc": "Arthritis is joint inflammation that commonly causes pain, stiffness, limited movement, and chronic discomfort.",
        "prec": ["do low-impact exercise", "maintain healthy weight", "use joint protection", "follow rheumatology advice"],
        "spec": "Rheumatologist",
    },
    "Asthma": {
        "symptoms": ["shortness of breath", "chest tightness", "wheezing", "cough", "rapid breathing"],
        "desc": "Asthma is an airway disease that leads to episodic wheezing, breathlessness, chest tightness, and cough.",
        "prec": ["avoid trigger exposure", "use inhalers correctly", "monitor breathing symptoms", "follow asthma action plan"],
        "spec": "Pulmonologist",
    },
    "Pneumonia": {
        "symptoms": ["high fever", "productive cough", "shortness of breath", "chest pain", "rapid breathing", "fatigue"],
        "desc": "Pneumonia is a lung infection that can cause fever, cough with sputum, chest pain, and breathing difficulty.",
        "prec": ["seek medical evaluation", "rest sufficiently", "stay hydrated", "take antibiotics or antivirals if prescribed"],
        "spec": "Pulmonologist",
    },
    "Jaundice": {
        "symptoms": ["yellow skin", "yellow eyes", "dark urine", "loss of appetite", "abdominal pain", "fatigue"],
        "desc": "Jaundice is yellow discoloration caused by bilirubin buildup and may signal liver or bile duct disease.",
        "prec": ["avoid alcohol", "eat light meals", "get liver evaluation", "follow medical treatment promptly"],
        "spec": "Gastroenterologist",
    },
    "Gastroenteritis": {
        "symptoms": ["abdominal pain", "diarrhea", "vomiting", "nausea", "mild fever", "weakness"],
        "desc": "Gastroenteritis is inflammation of the stomach and intestines that often causes diarrhea, vomiting, and cramps.",
        "prec": ["drink oral rehydration fluids", "eat bland food", "wash hands frequently", "avoid contaminated food"],
        "spec": "General Physician",
    },
    "Urinary Tract Infection": {
        "symptoms": ["burning urination", "frequent urination", "blood in urine", "mild fever", "abdominal pain"],
        "desc": "A urinary tract infection is a bacterial infection that causes painful urination, urinary frequency, and lower abdominal discomfort.",
        "prec": ["drink more water", "maintain urinary hygiene", "do not delay urination", "take antibiotics as prescribed"],
        "spec": "Nephrologist/Urologist",
    },
    "Common Cold": {
        "symptoms": ["runny nose", "sneezing", "sore throat", "cough", "mild fever"],
        "desc": "Common cold is a mild viral upper respiratory infection causing nasal symptoms, sore throat, and cough.",
        "prec": ["rest well", "drink warm fluids", "wash hands often", "avoid close contact when symptomatic"],
        "spec": "General Physician",
    },
    "Influenza": {
        "symptoms": ["high fever", "muscle pain", "fatigue", "cough", "headache", "sore throat"],
        "desc": "Influenza is a viral respiratory illness that typically causes sudden fever, body aches, fatigue, and cough.",
        "prec": ["rest at home", "drink fluids", "consider antiviral treatment early", "wear a mask around others"],
        "spec": "General Physician",
    },
    "Chickenpox": {
        "symptoms": ["fever", "itching", "blisters", "spots on skin", "fatigue", "loss of appetite"],
        "desc": "Chickenpox is a contagious viral illness that causes fever and an itchy blistering rash.",
        "prec": ["avoid scratching lesions", "keep skin clean", "isolate until lesions crust", "consult a doctor if symptoms worsen"],
        "spec": "General Physician",
    },
    "Fungal Infection": {
        "symptoms": ["itching", "skin rash", "rash", "spots on skin", "swollen lymph nodes"],
        "desc": "Fungal skin infections commonly cause itching, rashes, irritation, and sometimes localized skin changes.",
        "prec": ["keep skin dry", "avoid sharing towels", "use antifungal medication", "wear breathable clothing"],
        "spec": "Dermatologist",
    },
    "Allergy": {
        "symptoms": ["sneezing", "runny nose", "itching", "rash", "eye pain", "swollen lymph nodes"],
        "desc": "Allergy is an exaggerated immune response that may cause sneezing, itching, rash, and irritation after exposure to triggers.",
        "prec": ["avoid known allergens", "use antihistamines if prescribed", "keep indoor air clean", "seek care for breathing difficulty"],
        "spec": "General Physician",
    },
    "Anemia": {
        "symptoms": ["fatigue", "weakness", "dizziness", "cold hands and feet", "shortness of breath", "headache"],
        "desc": "Anemia is a low red blood cell or hemoglobin state that often causes tiredness, weakness, and breathlessness.",
        "prec": ["eat iron-rich foods", "take supplements if prescribed", "investigate cause of anemia", "follow up with blood tests"],
        "spec": "Hematologist",
    },
}

DISEASE_INFO = {
    disease: {
        "desc": info["desc"],
        "prec": list(info["prec"]),
        "spec": info["spec"],
    }
    for disease, info in FALLBACK_DISEASE_DATA.items()
}

SPECIALIZATION_MAP = {
    "malaria": "General Physician",
    "typhoid": "General Physician",
    "dengue": "General Physician",
    "gastroenteritis": "General Physician",
    "common cold": "General Physician",
    "influenza": "General Physician",
    "uti": "General Physician",
    "chickenpox": "General Physician",
    "chicken pox": "General Physician",
    "allergy": "General Physician",
    "tuberculosis": "Pulmonologist",
    "asthma": "Pulmonologist",
    "bronchial asthma": "Pulmonologist",
    "pneumonia": "Pulmonologist",
    "diabetes": "Endocrinologist",
    "obesity": "Endocrinologist",
    "thyroid disorders": "Endocrinologist",
    "hypothyroidism": "Endocrinologist",
    "hyperthyroidism": "Endocrinologist",
    "hypoglycemia": "Endocrinologist",
    "hypertension": "Cardiologist",
    "heart attack": "Cardiologist",
    "irregular heartbeat": "Cardiologist",
    "chest pain": "Cardiologist",
    "migraine": "Neurologist",
    "epilepsy": "Neurologist",
    "stroke": "Neurologist",
    "alzheimers": "Neurologist",
    "paralysis brain hemorrhage": "Neurologist",
    "paralysis (brain hemorrhage)": "Neurologist",
    "vertigo": "Neurologist",
    "(vertigo) paroymsal positional vertigo": "Neurologist",
    "arthritis": "Rheumatologist",
    "gout": "Rheumatologist",
    "osteoporosis": "Rheumatologist",
    "bone/joint": "Rheumatologist",
    "osteoarthristis": "Rheumatologist",
    "cervical spondylosis": "Rheumatologist",
    "jaundice": "Gastroenterologist",
    "hepatitis": "Gastroenterologist",
    "hepatitis a": "Gastroenterologist",
    "hepatitis b": "Gastroenterologist",
    "hepatitis c": "Gastroenterologist",
    "hepatitis d": "Gastroenterologist",
    "hepatitis e": "Gastroenterologist",
    "alcoholic hepatitis": "Gastroenterologist",
    "peptic ulcer": "Gastroenterologist",
    "peptic ulcer diseae": "Gastroenterologist",
    "gerd": "Gastroenterologist",
    "chronic cholestasis": "Gastroenterologist",
    "fungal infection": "Dermatologist",
    "acne": "Dermatologist",
    "eczema": "Dermatologist",
    "psoriasis": "Dermatologist",
    "drug reaction": "Dermatologist",
    "impetigo": "Dermatologist",
    "anemia": "Hematologist",
    "blood disorders": "Hematologist",
    "urinary tract infection": "Nephrologist/Urologist",
    "kidney disease": "Nephrologist/Urologist",
    "dimorphic hemmorhoids(piles)": "General Physician",
    "aids": "General Physician",
    "varicose veins": "Cardiologist",
}


def _resolve_path(relative_path: str) -> Path:
    """Resolve a project-relative path within the ml-service directory."""
    return Path(__file__).resolve().parent.parent / relative_path


def _normalize_symptom(value: object) -> str:
    """Normalize an input symptom string into lowercase text."""
    if value is None:
        return ""
    text = str(value).strip().lower()
    text = re.sub(r"\s+", " ", text)
    return "" if text in {"", "nan", "none"} else text


def _normalize_dataset_symptom(value: object) -> str:
    """Normalize dataset symptom values and convert underscores to spaces."""
    return _normalize_symptom(value).replace("_", " ")


def _normalize_disease_name(name: object) -> str:
    """Normalize a disease string for specialization lookup."""
    text = str(name).strip().lower().replace("_", " ")
    text = re.sub(r"[^a-z0-9()/\s-]", "", text)
    text = re.sub(r"\s+", " ", text)
    return text


def _get_specialization(disease: str) -> str:
    """Return the recommended specialization for a disease."""
    normalized = _normalize_disease_name(disease)
    if normalized in SPECIALIZATION_MAP:
        return SPECIALIZATION_MAP[normalized]
    if disease in DISEASE_INFO:
        return str(DISEASE_INFO[disease]["spec"])
    return "General Physician"


def _get_description(disease: str) -> str:
    """Return disease description text."""
    if disease in DISEASE_INFO:
        return str(DISEASE_INFO[disease]["desc"])
    return f"{disease} is a medical condition that should be reviewed by a qualified clinician."


def _get_precautions(disease: str) -> List[str]:
    """Return default precautions for a disease."""
    if disease in DISEASE_INFO:
        return list(DISEASE_INFO[disease]["prec"])
    return ["seek medical evaluation", "monitor symptoms closely", "avoid self-medication"]


def _build_fallback_dataframe() -> pd.DataFrame:
    """
    Build training DataFrame from hardcoded data when CSV unavailable.
    Returns DataFrame with columns: Disease, Symptom_1..Symptom_7
    Each disease gets multiple training rows with symptom variations
    to improve model accuracy (minimum 5 rows per disease).
    """
    rows: List[Dict[str, str]] = []

    for disease, info in FALLBACK_DISEASE_DATA.items():
        base_symptoms = list(info["symptoms"])
        variations = [
            base_symptoms[:],
            base_symptoms[:-1],
            base_symptoms[1:],
            base_symptoms[::2] + base_symptoms[1:2],
            base_symptoms[1::2] + base_symptoms[:1],
        ]

        for variation in variations:
            unique_variation: List[str] = []
            for symptom in variation:
                cleaned = _normalize_dataset_symptom(symptom)
                if cleaned and cleaned not in unique_variation:
                    unique_variation.append(cleaned)

            for symptom in base_symptoms:
                cleaned = _normalize_dataset_symptom(symptom)
                if len(unique_variation) >= 7:
                    break
                if cleaned not in unique_variation:
                    unique_variation.append(cleaned)

            if len(unique_variation) < 3:
                for symptom in base_symptoms:
                    cleaned = _normalize_dataset_symptom(symptom)
                    if cleaned not in unique_variation:
                        unique_variation.append(cleaned)
                    if len(unique_variation) >= 3:
                        break

            row = {"Disease": disease}
            for index in range(7):
                key = f"Symptom_{index + 1}"
                row[key] = unique_variation[index] if index < len(unique_variation) else ""
            rows.append(row)

    return pd.DataFrame(rows)


def train_model() -> Tuple[RandomForestClassifier, MultiLabelBinarizer]:
    """
    Train RandomForestClassifier on symptom-disease dataset.

    Steps:
    1. Try to load CSV from DATA_PATH
    2. If CSV missing, call _build_fallback_dataframe()
    3. Get all Symptom_N columns
    4. Strip + lowercase all symptom values
    5. Replace NaN with empty string ""
    6. Build symptom lists per row (exclude empty strings)
    7. MultiLabelBinarizer().fit_transform(symptom_lists)
    8. y = df["Disease"].str.strip()
    9. Train RandomForestClassifier
    10. Save bundle to pkl
    11. Print training stats
    12. Return (clf, mlb)
    """
    data_file = _resolve_path(DATA_PATH)
    model_file = _resolve_path(MODEL_PATH)

    print("[ML] Training symptom model...")
    if data_file.exists():
        df = pd.read_csv(data_file)
    else:
        df = _build_fallback_dataframe()

    symptom_columns = sorted(
        [column for column in df.columns if str(column).startswith("Symptom_")],
        key=lambda item: int(str(item).split("_")[1]),
    )

    for column in symptom_columns:
        df[column] = df[column].fillna("").apply(_normalize_dataset_symptom)

    y = df["Disease"].fillna("").astype(str).str.strip()
    symptom_lists = []
    for _, row in df[symptom_columns].iterrows():
        symptoms = [value for value in row.tolist() if value]
        symptom_lists.append(symptoms)

    mlb = MultiLabelBinarizer()
    X = mlb.fit_transform(symptom_lists)

    clf = RandomForestClassifier(
        n_estimators=100,
        random_state=42,
        min_samples_split=2,
        min_samples_leaf=1,
    )
    clf.fit(X, y)

    accuracy = float(clf.score(X, y))
    bundle = {
        "clf": clf,
        "mlb": mlb,
        "classes": list(clf.classes_),
        "feature_names": list(mlb.classes_),
        "trained_at": datetime.now().isoformat(),
        "n_samples": len(X),
        "n_diseases": len(clf.classes_),
    }

    model_file.parent.mkdir(parents=True, exist_ok=True)
    joblib.dump(bundle, model_file)

    print(
        f"[ML] Dataset: {len(X)} rows, {len(clf.classes_)} diseases, "
        f"{len(mlb.classes_)} unique symptoms"
    )
    print(f"[ML] Model trained. Accuracy: {accuracy:.2%} (on training data)")
    print(f"[ML] Model saved to {MODEL_PATH}")

    return clf, mlb


def load_model() -> Tuple[RandomForestClassifier, MultiLabelBinarizer]:
    """
    Load saved model or train if pkl missing.
    Prints model loading details and returns (clf, mlb).
    """
    model_file = _resolve_path(MODEL_PATH)
    if not model_file.exists():
        return train_model()

    print("[ML] Loading symptom model from pkl...")
    bundle = joblib.load(model_file)
    clf = bundle["clf"]
    mlb = bundle["mlb"]
    print(
        "[ML] Symptom model loaded. "
        f"({bundle.get('n_diseases', len(clf.classes_))} diseases, "
        f"trained at {bundle.get('trained_at', 'unknown')})"
    )
    return clf, mlb


def predict(symptoms: list) -> dict:
    """
    Predict top-3 diseases from symptom list.

    Unknown symptoms never fail prediction. The response includes
    known symptoms used and unknown symptoms excluded from the vector.
    """
    clf, mlb = _get_model()

    cleaned_symptoms: List[str] = []
    for symptom in symptoms:
        normalized = _normalize_symptom(symptom)
        if normalized and normalized not in cleaned_symptoms:
            cleaned_symptoms.append(normalized)

    if not cleaned_symptoms:
        raise ValueError("No valid symptoms provided for prediction.")

    known_set = set(mlb.classes_)
    unknown_symptoms = [symptom for symptom in cleaned_symptoms if symptom not in known_set]
    known_symptoms = [symptom for symptom in cleaned_symptoms if symptom in known_set]

    if unknown_symptoms:
        print(f"[ML] Unknown symptoms ignored: {unknown_symptoms}")

    try:
        with warnings.catch_warnings():
            warnings.simplefilter("ignore")
            vector = mlb.transform([cleaned_symptoms])
    except Exception:
        with warnings.catch_warnings():
            warnings.simplefilter("ignore")
            vector = mlb.transform([known_symptoms])

    probabilities = clf.predict_proba(vector)[0]
    top_indices = np.argsort(probabilities)[::-1][:3]

    preliminary_results = []
    for index in top_indices:
        disease = str(clf.classes_[index])
        confidence = round(float(probabilities[index]), 4)
        preliminary_results.append(
            {
                "disease": disease,
                "confidence": confidence,
                "description": _get_description(disease),
                "precautions": _get_precautions(disease),
            }
        )

    results = [item for item in preliminary_results if item["confidence"] > 0.01]
    if len(results) < 3:
        existing = {item["disease"] for item in results}
        for item in preliminary_results:
            if item["disease"] not in existing:
                results.append(item)
            if len(results) >= 3:
                break

    if not results:
        results = preliminary_results

    top_disease = results[0]["disease"]
    recommended_specialization = _get_specialization(top_disease)

    return {
        "predictions": results[:3],
        "recommended_specialization": recommended_specialization,
        "symptoms_used": cleaned_symptoms,
        "symptoms_unknown": unknown_symptoms,
    }


# Pre-load model when module is imported
# This means first request is fast (model already in memory)
_cached_clf = None
_cached_mlb = None


def _get_model() -> Tuple[RandomForestClassifier, MultiLabelBinarizer]:
    """Return a cached model pair, loading the model once per process."""
    global _cached_clf, _cached_mlb
    if _cached_clf is None or _cached_mlb is None:
        _cached_clf, _cached_mlb = load_model()
    return _cached_clf, _cached_mlb

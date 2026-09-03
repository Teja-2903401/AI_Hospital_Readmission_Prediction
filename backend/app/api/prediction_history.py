from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.database import get_db
from app.models import Prediction, Admission

from app.services.prediction_history_service import (
    get_all_predictions,
    get_prediction_by_id,
)


router = APIRouter(
    prefix="/api/predictions",
    tags=["Prediction History"],
)


from app.services.prediction_service import (
    evaluate_disease_risk_factors,
    resolve_department,
    resolve_diagnosis_type,
)


import json


# ============================================================
# HELPER
# ============================================================

def prediction_to_response(
    prediction: Prediction,
    db: Session,
):
    """
    Convert a Prediction database object into
    a frontend-friendly response.

    Prediction.admission_id stores the numeric
    primary key of the admissions table.

    The frontend should receive the actual
    admission identifier such as A10027.
    """

    admission = (
        db.query(Admission)
        .filter(
            Admission.id
            == prediction.admission_id
        )
        .first()
    )

    admission_identifier = (
        admission.admission_id
        if admission
        else str(prediction.admission_id)
    )

    # Check if prediction.message contains stored JSON metadata
    meta = None
    if prediction.message and prediction.message.strip().startswith("{"):
        try:
            meta = json.loads(prediction.message)
        except Exception:
            meta = None

    if meta and isinstance(meta, dict):
        return {
            "id": prediction.id,
            "admission_id": admission_identifier,
            "probability": prediction.probability,
            "probability_percent": round(
                prediction.probability * 100,
                2,
            ),
            "risk_level": prediction.risk_level,
            "department_name": meta.get("department_name", "General Medicine"),
            "diagnosis_type": meta.get("diagnosis_type", "Primary Clinical Diagnosis"),
            "primary_icd10": meta.get("primary_icd10"),
            "primary_diag_category": meta.get("primary_diag_category"),
            "risk_factors": meta.get("risk_factors", []),
            "disease_risk_factors": meta.get("disease_risk_factors", []),
            "clinical_summary": meta.get("clinical_summary"),
            "recommendations": meta.get("recommendations", []),
            "model_name": prediction.model_name,
            "model_version": prediction.model_version,
            "message": meta.get("message", "Model-estimated 30-day hospital readmission risk. This system is intended for educational and predictive analytics purposes only and does not provide a medical diagnosis or treatment recommendation."),
            "created_at": prediction.created_at,
        }

    patient = admission.patient if admission else None

    # Derive diagnosis and clinical features from admission if available
    features = {
        "hba1c": getattr(admission, "hba1c", 5.6) or 5.6,
        "creatinine": getattr(admission, "creatinine", 0.8) or 0.8,
        "systolic_bp": getattr(admission, "systolic_bp", 120) or 120,
        "haemoglobin": getattr(admission, "haemoglobin", 12.0) or 12.0,
        "comorbidity_count": patient.comorbidity_count if patient else 1,
        "charlson_index": getattr(admission, "charlson_index", 1) or 1,
        "prev_admissions": patient.prev_admissions if patient else 0,
        "los_days": getattr(admission, "los_days", 3) or 3,
        "ward_type": getattr(admission, "ward_type", "General") or "General",
        "primary_diag_category": getattr(admission, "primary_diag_category", "Neurological") or "Neurological",
        "primary_icd10": getattr(admission, "primary_icd10", "G40") or "G40",
    }

    dept = resolve_department(features.get("primary_diag_category"), features.get("ward_type"))
    diag = resolve_diagnosis_type(features.get("primary_icd10"), features.get("primary_diag_category"))
    assessment = evaluate_disease_risk_factors(features, prediction.probability, prediction.risk_level)

    return {
        "id": prediction.id,

        "admission_id": admission_identifier,

        "probability": prediction.probability,

        "probability_percent": round(
            prediction.probability * 100,
            2,
        ),

        "risk_level": prediction.risk_level,

        "department_name": dept,

        "diagnosis_type": diag,

        "primary_icd10": features.get("primary_icd10"),

        "primary_diag_category": features.get("primary_diag_category"),

        "risk_factors": assessment.get("risk_factors", []),

        "disease_risk_factors": assessment.get("disease_risk_factors", []),

        "clinical_summary": assessment.get("clinical_summary"),

        "recommendations": assessment.get("recommendations", []),

        "model_name": prediction.model_name,

        "model_version": prediction.model_version,

        "message": prediction.message,

        "created_at": prediction.created_at,
    }


# ============================================================
# GET ALL PREDICTIONS
# ============================================================

@router.get("/")
def list_predictions(
    limit: int = 50,
    risk_level: str | None = None,
    db: Session = Depends(get_db),
):
    """
    Get recent prediction history, with optional risk_level filter (Low, Medium, High).

    Results are returned newest first.
    """

    if limit < 1:
        limit = 1

    if limit > 200:
        limit = 200

    predictions = get_all_predictions(
        db=db,
        limit=limit,
        risk_level=risk_level,
    )

    results = []

    for prediction in predictions:

        results.append(
            prediction_to_response(
                prediction=prediction,
                db=db,
            )
        )

    return results


# ============================================================
# GET PREDICTIONS FOR ONE ADMISSION
# ============================================================

@router.get("/admission/{admission_id}")
def get_admission_predictions(
    admission_id: str,
    db: Session = Depends(get_db),
):
    """
    Get all prediction records belonging to
    one human-readable admission ID.

    Example:

        GET /api/predictions/admission/A10027

    Returns all predictions for A10027,
    newest first.
    """

    clean_admission_id = (
        admission_id.strip()
    )

    if not clean_admission_id:

        raise HTTPException(
            status_code=400,
            detail="Admission ID cannot be empty",
        )

    # --------------------------------------------------------
    # FIND ADMISSION
    # --------------------------------------------------------

    admission = (
        db.query(Admission)
        .filter(
            Admission.admission_id
            == clean_admission_id
        )
        .first()
    )

    if admission is None:

        raise HTTPException(
            status_code=404,
            detail=(
                f"Admission "
                f"'{clean_admission_id}' "
                "not found"
            ),
        )

    # --------------------------------------------------------
    # FIND PREDICTIONS
    # --------------------------------------------------------

    predictions = (
        db.query(Prediction)
        .filter(
            Prediction.admission_id
            == admission.id
        )
        .order_by(
            Prediction.id.desc()
        )
        .all()
    )

    # --------------------------------------------------------
    # BUILD RESPONSE
    # --------------------------------------------------------

    results = []

    for prediction in predictions:

        results.append(
            prediction_to_response(
                prediction=prediction,
                db=db,
            )
        )

    return {
        "admission_id": admission.admission_id,

        "prediction_count": len(
            results
        ),

        "predictions": results,
    }


# ============================================================
# GET SINGLE PREDICTION
# ============================================================

@router.get("/{prediction_id}")
def get_prediction(
    prediction_id: int,
    db: Session = Depends(get_db),
):
    """
    Get one prediction by database ID.

    Example:

        GET /api/predictions/21
    """

    prediction = get_prediction_by_id(
        db=db,
        prediction_id=prediction_id,
    )

    if prediction is None:

        raise HTTPException(
            status_code=404,
            detail="Prediction not found",
        )

    return prediction_to_response(
        prediction=prediction,
        db=db,
    )
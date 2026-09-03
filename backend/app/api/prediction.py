import json
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.database import get_db

from app.schemas.prediction import (
    PredictionRequest,
    PredictionResponse,
)

from app.services.prediction_service import predict_readmission
from app.models import (
    Patient,
    Admission,
    Prediction,
)


router = APIRouter(
    prefix="/api/predictions",
    tags=["Predictions"],
)


@router.post(
    "/predict",
    response_model=PredictionResponse,
)
def predict(
    request: PredictionRequest,
    db: Session = Depends(get_db),
):

    try:

        admission_identifier = (
            request.admission_id.strip()
        )

        if not admission_identifier:
            raise HTTPException(
                status_code=400,
                detail="Admission ID cannot be empty.",
            )

        # ----------------------------------------------------
        # FIND ADMISSION
        # ----------------------------------------------------

        admission = (
            db.query(Admission)
            .filter(
                Admission.admission_id
                == admission_identifier
            )
            .first()
        )

        # ----------------------------------------------------
        # CREATE ADMISSION IF NOT FOUND
        # ----------------------------------------------------

        if not admission:

            patient_id = (
                f"PT-{admission_identifier}"
            )

            patient = (
                db.query(Patient)
                .filter(
                    Patient.patient_id
                    == patient_id
                )
                .first()
            )

            if not patient:

                patient = Patient(
                    patient_id=patient_id,
                    age=request.age,
                    gender=request.gender,
                    state=request.state,
                    bpl_card=request.bpl_card,
                    insurance_type=request.insurance_type,
                    comorbidity_count=(
                        request.comorbidity_count
                    ),
                    prev_admissions=(
                        request.prev_admissions
                    ),
                )

                db.add(patient)
                db.flush()

            admission = Admission(
                admission_id=admission_identifier,
                patient_id=patient.id,
                admit_type=request.admit_type,
                ward_type=request.ward_type,
                discharge_type="Pending",
                los_days=request.los_days,
                num_procedures=request.num_procedures,
                charlson_index=request.charlson_index,
                hba1c=request.hba1c,
                creatinine=request.creatinine,
                haemoglobin=request.haemoglobin,
                systolic_bp=request.systolic_bp,
            )

            db.add(admission)
            db.flush()

        # ----------------------------------------------------
        # PREPARE ML FEATURES
        # ----------------------------------------------------

        features = request.model_dump()

        features.pop("admission_id", None)

        features.pop("cost_category", None)

        features.pop("total_cost_inr", None)

        features.pop("govt_subsidy_inr", None)

        features.pop("out_of_pocket_inr", None)

        # ----------------------------------------------------
        # RUN MODEL
        # ----------------------------------------------------

        result = predict_readmission(features)

        # ----------------------------------------------------
        # SAVE PREDICTION (WITH COMPLETE METADATA)
        # ----------------------------------------------------

        payload_meta = {
            "department_name": result.get("department_name", "General Medicine"),
            "diagnosis_type": result.get("diagnosis_type", "Primary Clinical Diagnosis"),
            "primary_icd10": result.get("primary_icd10"),
            "primary_diag_category": result.get("primary_diag_category"),
            "risk_factors": result.get("risk_factors", []),
            "disease_risk_factors": result.get("disease_risk_factors", []),
            "clinical_summary": result.get("clinical_summary"),
            "recommendations": result.get("recommendations", []),
            "message": result.get("message", "Model-estimated 30-day hospital readmission risk."),
        }

        prediction = Prediction(
            admission_id=admission.id,
            probability=result["probability"],
            risk_level=result["risk_level"],
            model_name="Logistic Regression",
            model_version="1.0",
            message=json.dumps(payload_meta),
        )

        db.add(prediction)

        db.commit()

        db.refresh(prediction)

        # ----------------------------------------------------
        # RETURN RESPONSE
        # ----------------------------------------------------

        return PredictionResponse(
            admission_id=admission.admission_id,
            probability=result["probability"],
            probability_percent=(
                result["probability_percent"]
            ),
            risk_level=result["risk_level"],
            department_name=result.get("department_name", "General Medicine"),
            diagnosis_type=result.get("diagnosis_type", "Primary Clinical Diagnosis"),
            primary_icd10=result.get("primary_icd10"),
            primary_diag_category=result.get("primary_diag_category"),
            risk_factors=result.get("risk_factors", []),
            disease_risk_factors=result.get("disease_risk_factors", []),
            clinical_summary=result.get("clinical_summary"),
            recommendations=result.get("recommendations", []),
            model_name="Logistic Regression",
            model_version="1.0",
            created_at=prediction.created_at.isoformat() if prediction.created_at else None,
            message=result["message"],
        )

    except HTTPException:

        db.rollback()

        raise

    except Exception as e:

        db.rollback()

        raise HTTPException(
            status_code=500,
            detail=f"Prediction failed: {str(e)}",
        )
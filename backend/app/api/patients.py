import csv
import io
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status, Response
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session

from app.database import get_db
from app.models import Patient, Admission, Prediction
from app.schemas.patient import PatientCreate, PatientUpdate, PatientResponse


router = APIRouter(
    prefix="/api/patients",
    tags=["Patients"],
)


# ============================================================
# GENERATE NEXT PATIENT ID
# ============================================================

def generate_patient_id(db: Session) -> str:
    """Generate the next available patient ID (e.g. P10001)."""
    patients = (
        db.query(Patient)
        .order_by(Patient.id.desc())
        .all()
    )

    if not patients:
        return "P10001"

    numbers = []
    for patient in patients:
        patient_id = str(patient.patient_id)
        if patient_id.startswith("P"):
            try:
                number = int(patient_id[1:])
                numbers.append(number)
            except ValueError:
                continue

    if not numbers:
        return "P10001"

    next_number = max(numbers) + 1
    return f"P{next_number}"


# ============================================================
# EXPORT ALL PATIENTS AS CSV
# ============================================================

@router.get("/export/csv")
def export_patients_csv(db: Session = Depends(get_db)):
    """Export complete patient roster and history summary as a downloadable CSV."""
    patients = db.query(Patient).order_by(Patient.id.desc()).all()

    output = io.StringIO()
    writer = csv.writer(output)

    # Header
    writer.writerow([
        "Patient ID",
        "Age",
        "Gender",
        "State",
        "BPL Card",
        "Insurance Type",
        "Comorbidity Count",
        "Previous Admissions",
        "Total Recorded Admissions",
        "Latest Risk Level",
        "Latest Risk Probability (%)",
        "Created Date",
    ])

    for p in patients:
        admissions = p.admissions or []
        latest_risk = "Not Assessed"
        latest_prob = "-"

        if admissions:
            # Find latest prediction across admissions
            all_preds = []
            for adm in admissions:
                all_preds.extend(adm.predictions or [])
            if all_preds:
                all_preds.sort(key=lambda x: x.id, reverse=True)
                latest_risk = all_preds[0].risk_level
                latest_prob = f"{round(all_preds[0].probability * 100, 2)}%"

        writer.writerow([
            p.patient_id,
            p.age,
            p.gender,
            p.state,
            "Yes" if p.bpl_card else "No",
            p.insurance_type or "Unspecified",
            p.comorbidity_count,
            p.prev_admissions,
            len(admissions),
            latest_risk,
            latest_prob,
            p.created_at.strftime("%Y-%m-%d %H:%M:%S") if p.created_at else "-",
        ])

    output.seek(0)
    response = StreamingResponse(
        iter([output.getvalue()]),
        media_type="text/csv",
    )
    response.headers["Content-Disposition"] = "attachment; filename=hospital_patients_master_export.csv"
    return response


# ============================================================
# GET ALL PATIENTS
# ============================================================

@router.get("/")
def get_patients(
    db: Session = Depends(get_db),
):
    """Return all patients with aggregated admission & risk counts."""
    patients = (
        db.query(Patient)
        .order_by(Patient.id.desc())
        .all()
    )

    results = []
    for p in patients:
        admissions = p.admissions or []
        all_preds = []
        for adm in admissions:
            all_preds.extend(adm.predictions or [])

        latest_prediction = None
        if all_preds:
            all_preds.sort(key=lambda x: x.id, reverse=True)
            latest_prediction = {
                "id": all_preds[0].id,
                "probability": all_preds[0].probability,
                "probability_percent": round(all_preds[0].probability * 100, 2),
                "risk_level": all_preds[0].risk_level,
                "created_at": all_preds[0].created_at,
            }

        results.append({
            "id": p.id,
            "patient_id": p.patient_id,
            "age": p.age,
            "gender": p.gender,
            "state": p.state,
            "bpl_card": p.bpl_card,
            "insurance_type": p.insurance_type,
            "comorbidity_count": p.comorbidity_count,
            "prev_admissions": p.prev_admissions,
            "created_at": p.created_at,
            "admissions_count": len(admissions),
            "latest_prediction": latest_prediction,
        })

    return results


# ============================================================
# GET FULL PATIENT CLINICAL HISTORY & DOSSIER
# ============================================================

@router.get("/{patient_id}/full-history")
def get_patient_full_history(
    patient_id: str,
    db: Session = Depends(get_db),
):
    """
    Get full comprehensive patient history dossier including:
    - Demographics & Social Determinants (BPL, Insurance, State)
    - All Past Admission records & timelines
    - Clinical Lab Biomarkers (HbA1c, Creatinine, Systolic BP, Hemoglobin, LOS, Procedures)
    - AI Readmission Predictions & Risk Trajectory
    """
    clean_id = patient_id.strip()
    patient = (
        db.query(Patient)
        .filter(
            (Patient.patient_id == clean_id) | (Patient.id == (int(clean_id) if clean_id.isdigit() else -1))
        )
        .first()
    )

    if not patient:
        raise HTTPException(
            status_code=404,
            detail=f"Patient '{patient_id}' not found",
        )

    # Gather all admissions
    admissions_data = []
    all_predictions = []

    for adm in patient.admissions or []:
        # Admission predictions
        adm_preds = []
        for pr in adm.predictions or []:
            pred_item = {
                "id": pr.id,
                "probability": pr.probability,
                "probability_percent": round(pr.probability * 100, 2),
                "risk_level": pr.risk_level,
                "model_name": pr.model_name,
                "message": pr.message,
                "created_at": pr.created_at,
            }
            adm_preds.append(pred_item)
            all_predictions.append({
                **pred_item,
                "admission_id": adm.admission_id,
            })

        details = {
            "total_cost_inr": 0,
            "govt_subsidy_inr": 0,
            "out_of_pocket_inr": 0,
            "cost_category": "Standard",
            "department_name": "General Medicine",
        }
        try:
            from app.api.admissions import derive_admission_details
            details = derive_admission_details(adm, patient)
        except Exception:
            pass

        admissions_data.append({
            "id": adm.id,
            "admission_id": adm.admission_id,
            "admit_type": adm.admit_type,
            "ward_type": adm.ward_type,
            "discharge_type": adm.discharge_type,
            "los_days": adm.los_days,
            "num_procedures": adm.num_procedures,
            "charlson_index": adm.charlson_index,
            "hba1c": adm.hba1c,
            "creatinine": adm.creatinine,
            "haemoglobin": adm.haemoglobin,
            "systolic_bp": adm.systolic_bp,
            "created_at": adm.created_at,
            "total_cost_inr": details.get("total_cost_inr", 0),
            "govt_subsidy_inr": details.get("govt_subsidy_inr", 0),
            "out_of_pocket_inr": details.get("out_of_pocket_inr", 0),
            "cost_category": details.get("cost_category", "Standard"),
            "department_name": details.get("department_name", "General Medicine"),
            "predictions": adm_preds,
        })

    # Sort admissions newest first
    admissions_data.sort(key=lambda x: x["id"], reverse=True)
    all_predictions.sort(key=lambda x: x["id"], reverse=True)

    total_cost = sum(a["total_cost_inr"] for a in admissions_data)
    total_subsidy = sum(a["govt_subsidy_inr"] for a in admissions_data)
    total_out_of_pocket = sum(a["out_of_pocket_inr"] for a in admissions_data)

    return {
        "patient": {
            "id": patient.id,
            "patient_id": patient.patient_id,
            "age": patient.age,
            "gender": patient.gender,
            "state": patient.state,
            "bpl_card": patient.bpl_card,
            "insurance_type": patient.insurance_type,
            "comorbidity_count": patient.comorbidity_count,
            "prev_admissions": patient.prev_admissions,
            "created_at": patient.created_at,
        },
        "admissions_count": len(admissions_data),
        "admissions": admissions_data,
        "predictions_count": len(all_predictions),
        "predictions": all_predictions,
        "total_cost_inr": total_cost,
        "total_subsidy_inr": total_subsidy,
        "total_out_of_pocket_inr": total_out_of_pocket,
        "latest_risk": all_predictions[0]["risk_level"] if all_predictions else "Not Evaluated",
        "latest_probability": all_predictions[0]["probability_percent"] if all_predictions else None,
    }


# ============================================================
# GET SINGLE PATIENT
# ============================================================

@router.get("/{patient_id}")
def get_patient(
    patient_id: str,
    db: Session = Depends(get_db),
):
    """Get a patient using the public patient ID."""
    clean_id = patient_id.strip()
    patient = (
        db.query(Patient)
        .filter(
            (Patient.patient_id == clean_id) | (Patient.id == (int(clean_id) if clean_id.isdigit() else -1))
        )
        .first()
    )

    if not patient:
        raise HTTPException(
            status_code=404,
            detail=f"Patient '{patient_id}' not found",
        )

    return patient


# ============================================================
# CREATE PATIENT
# ============================================================

@router.post(
    "/",
    response_model=PatientResponse,
)
def create_patient(
    patient_data: PatientCreate,
    db: Session = Depends(get_db),
):
    """Create a new patient. The patient ID is generated by the backend."""
    try:
        generated_patient_id = generate_patient_id(db)

        patient = Patient(
            patient_id=generated_patient_id,
            age=patient_data.age,
            gender=patient_data.gender,
            state=patient_data.state,
            bpl_card=patient_data.bpl_card,
            insurance_type=patient_data.insurance_type,
            comorbidity_count=patient_data.comorbidity_count,
            prev_admissions=patient_data.prev_admissions,
        )

        db.add(patient)
        db.commit()
        db.refresh(patient)
        return patient

    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=500,
            detail=f"Failed to create patient: {str(e)}",
        )


# ============================================================
# UPDATE PATIENT
# ============================================================

@router.put("/{patient_id}", response_model=PatientResponse)
def update_patient(
    patient_id: str,
    patient_data: PatientUpdate,
    db: Session = Depends(get_db),
):
    """Update an existing patient record."""
    clean_id = patient_id.strip()
    patient = (
        db.query(Patient)
        .filter(
            (Patient.patient_id == clean_id) | (Patient.id == (int(clean_id) if clean_id.isdigit() else -1))
        )
        .first()
    )

    if not patient:
        raise HTTPException(
            status_code=404,
            detail=f"Patient '{patient_id}' not found",
        )

    if patient_data.age is not None:
        patient.age = patient_data.age
    if patient_data.gender is not None:
        patient.gender = patient_data.gender
    if patient_data.state is not None:
        patient.state = patient_data.state
    if patient_data.bpl_card is not None:
        patient.bpl_card = patient_data.bpl_card
    if patient_data.insurance_type is not None:
        patient.insurance_type = patient_data.insurance_type
    if patient_data.comorbidity_count is not None:
        patient.comorbidity_count = patient_data.comorbidity_count
    if patient_data.prev_admissions is not None:
        patient.prev_admissions = patient_data.prev_admissions

    try:
        db.commit()
        db.refresh(patient)
        return patient
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=500,
            detail=f"Failed to update patient: {str(e)}",
        )


# ============================================================
# DELETE PATIENT
# ============================================================

@router.delete("/{patient_id}")
def delete_patient(
    patient_id: str,
    db: Session = Depends(get_db),
):
    """Delete a patient record and cascade associated admissions (Administrator only)."""
    clean_id = patient_id.strip()
    patient = (
        db.query(Patient)
        .filter(
            (Patient.patient_id == clean_id) | (Patient.id == (int(clean_id) if clean_id.isdigit() else -1))
        )
        .first()
    )

    if not patient:
        raise HTTPException(
            status_code=404,
            detail=f"Patient '{patient_id}' not found",
        )

    try:
        db.delete(patient)
        db.commit()
        return {"message": f"Patient '{patient.patient_id}' and associated records deleted successfully."}
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=500,
            detail=f"Failed to delete patient: {str(e)}",
        )
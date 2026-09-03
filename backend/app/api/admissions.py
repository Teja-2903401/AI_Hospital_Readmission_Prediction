from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.database import get_db
from app.models import Patient, Admission
from app.schemas.admission import (
    AdmissionCreate,
    AdmissionUpdate,
    AdmissionResponse,
)


router = APIRouter(
    prefix="/api/admissions",
    tags=["Admissions"],
)


# ============================================================
# GENERATE NEXT ADMISSION ID
# ============================================================

def generate_admission_id(db: Session) -> str:
    """
    Generate the next available admission ID.

    Examples:
        A10025
        A10026
        A10027
    """

    admissions = (
        db.query(Admission)
        .order_by(Admission.id.desc())
        .all()
    )

    if not admissions:
        return "A10025"

    numbers = []

    for admission in admissions:

        admission_id = str(
            admission.admission_id
        )

        if admission_id.startswith("A"):

            try:
                number = int(
                    admission_id[1:]
                )

                numbers.append(number)

            except ValueError:
                continue

    if not numbers:
        return "A10025"

    next_number = max(numbers) + 1

    return f"A{next_number}"


# ============================================================
# CONVERT ADMISSION TO RESPONSE
# ============================================================

def derive_admission_details(admission: Admission, patient: Patient | None):
    """
    Derive clinical diagnosis, hospital capacity, and financial
    billing information for an admission record.
    """
    hba1c = admission.hba1c if admission.hba1c is not None else 5.6
    sbp = admission.systolic_bp if admission.systolic_bp is not None else 120
    creat = admission.creatinine if admission.creatinine is not None else 0.8
    charlson = admission.charlson_index if admission.charlson_index is not None else 1
    los = admission.los_days if admission.los_days is not None else 4
    procs = admission.num_procedures if admission.num_procedures is not None else 0
    comorb = patient.comorbidity_count if patient else 1
    bpl = patient.bpl_card if patient else False
    ins = patient.insurance_type if patient else "Government"

    if hba1c >= 7.0:
        primary_icd = "E11"
        primary_cat = "Endocrine"
        dept = "Endocrinology & Diabetology"
    elif sbp >= 145 or charlson >= 3:
        primary_icd = "I50"
        primary_cat = "Cardiovascular"
        dept = "Cardiology & Cardiovascular Medicine"
    elif creat >= 1.5:
        primary_icd = "N18"
        primary_cat = "Genitourinary"
        dept = "Nephrology & Urology"
    elif los >= 7:
        primary_icd = "J44"
        primary_cat = "Respiratory"
        dept = "Pulmonology & Respiratory Medicine"
    else:
        primary_icd = "G40"
        primary_cat = "Neurological"
        dept = "Neurology"

    # Hospital features
    tier = "tier2" if los < 6 else "tier1"
    beds = 400 + (los * 25)
    teaching = True

    # Financial / Billing calculation
    ward_clean = str(admission.ward_type or "").lower()
    ward_mult = 2.0 if "icu" in ward_clean else (1.4 if "semi" in ward_clean or "private" in ward_clean else 1.0)
    base_daily = 4500 * ward_mult
    proc_cost = procs * 12500
    lab_cost = 4500 + (charlson * 1500)
    total_cost = int((los * base_daily) + proc_cost + lab_cost)

    cost_category = "ICU" if "icu" in ward_clean else ("Surgical" if procs > 0 else "Room")

    if bpl or str(ins).lower() in ["government", "bpl"]:
        subsidy = int(total_cost * 0.85)
    elif str(ins).lower() in ["esi", "employer"]:
        subsidy = int(total_cost * 0.70)
    elif str(ins).lower() in ["private"]:
        subsidy = int(total_cost * 0.60)
    else:
        subsidy = int(total_cost * 0.40)

    out_of_pocket = max(0, total_cost - subsidy)

    return {
        "primary_icd10": primary_icd,
        "primary_diag_category": primary_cat,
        "department_name": dept,
        "num_diagnoses": max(1, comorb + 1),
        "num_diagnosis_categories": max(1, min(comorb + 1, 3)),
        "tier": tier,
        "beds": beds,
        "teaching": teaching,
        "cost_category": cost_category,
        "total_cost_inr": total_cost,
        "govt_subsidy_inr": subsidy,
        "out_of_pocket_inr": out_of_pocket,
    }


def admission_to_dict(admission: Admission):
    """
    Convert an Admission database object into a JSON-friendly
    dictionary containing admission, clinical diagnosis,
    hospital, financial, and patient data.
    """

    patient = admission.patient
    details = derive_admission_details(admission, patient)

    return {
        # ----------------------------------------------------
        # ADMISSION DATABASE INFORMATION
        # ----------------------------------------------------

        "id": admission.id,

        "admission_id": admission.admission_id,

        "patient_id": admission.patient_id,

        # ----------------------------------------------------
        # ADMISSION INFORMATION
        # ----------------------------------------------------

        "admit_type": admission.admit_type,

        "ward_type": admission.ward_type,

        "discharge_type": admission.discharge_type,

        "los_days": admission.los_days,

        "num_procedures": admission.num_procedures,

        "charlson_index": admission.charlson_index,

        "hba1c": admission.hba1c,

        "creatinine": admission.creatinine,

        "haemoglobin": admission.haemoglobin,

        "systolic_bp": admission.systolic_bp,

        "created_at": admission.created_at,

        # ----------------------------------------------------
        # DIAGNOSIS, HOSPITAL & FINANCIAL VARIABLES
        # ----------------------------------------------------

        "primary_icd10": details["primary_icd10"],

        "primary_diag_category": details["primary_diag_category"],

        "department_name": details["department_name"],

        "num_diagnoses": details["num_diagnoses"],

        "num_diagnosis_categories": details["num_diagnosis_categories"],

        "tier": details["tier"],

        "beds": details["beds"],

        "teaching": details["teaching"],

        "cost_category": details["cost_category"],

        "total_cost_inr": details["total_cost_inr"],

        "govt_subsidy_inr": details["govt_subsidy_inr"],

        "out_of_pocket_inr": details["out_of_pocket_inr"],

        # ----------------------------------------------------
        # PATIENT INFORMATION
        # ----------------------------------------------------

        "patient": (
            {
                "id": patient.id,

                "patient_id": patient.patient_id,

                "age": patient.age,

                "gender": patient.gender,

                "state": patient.state,

                "bpl_card": patient.bpl_card,

                "insurance_type": patient.insurance_type,

                "comorbidity_count": (
                    patient.comorbidity_count
                ),

                "prev_admissions": (
                    patient.prev_admissions
                ),

                "created_at": patient.created_at,
            }
            if patient
            else None
        ),
    }


# ============================================================
# GET ALL ADMISSIONS
# ============================================================

@router.get("/")
def get_admissions(
    db: Session = Depends(get_db),
):

    admissions = (
        db.query(Admission)
        .order_by(Admission.id.desc())
        .all()
    )

    return [
        admission_to_dict(admission)
        for admission in admissions
    ]


# ============================================================
# GET SINGLE ADMISSION
# ============================================================

@router.get("/{admission_id}")
def get_admission(
    admission_id: str,
    db: Session = Depends(get_db),
):

    admission = (
        db.query(Admission)
        .filter(
            Admission.admission_id
            == admission_id.strip()
        )
        .first()
    )

    if not admission:

        raise HTTPException(
            status_code=404,
            detail=(
                f"Admission '{admission_id}' "
                "not found"
            ),
        )

    return admission_to_dict(admission)


# ============================================================
# CREATE ADMISSION
# ============================================================

@router.post(
    "/",
    response_model=AdmissionResponse,
)
def create_admission(
    admission_data: AdmissionCreate,
    db: Session = Depends(get_db),
):

    try:

        # ----------------------------------------------------
        # FIND PATIENT
        # ----------------------------------------------------

        patient = (
            db.query(Patient)
            .filter(
                Patient.patient_id
                == admission_data.patient_id.strip()
            )
            .first()
        )

        if not patient:

            raise HTTPException(
                status_code=404,
                detail=(
                    f"Patient "
                    f"'{admission_data.patient_id}' "
                    "not found"
                ),
            )

        # ----------------------------------------------------
        # GENERATE ADMISSION ID
        # ----------------------------------------------------

        generated_admission_id = (
            generate_admission_id(db)
        )

        # ----------------------------------------------------
        # CREATE ADMISSION
        # ----------------------------------------------------

        admission = Admission(

            admission_id=(
                generated_admission_id
            ),

            patient_id=patient.id,

            admit_type=(
                admission_data.admit_type
            ),

            ward_type=(
                admission_data.ward_type
            ),

            discharge_type=(
                admission_data.discharge_type
            ),

            los_days=(
                admission_data.los_days
            ),

            num_procedures=(
                admission_data.num_procedures
            ),

            charlson_index=(
                admission_data.charlson_index
            ),

            hba1c=(
                admission_data.hba1c
            ),

            creatinine=(
                admission_data.creatinine
            ),

            haemoglobin=(
                admission_data.haemoglobin
            ),

            systolic_bp=(
                admission_data.systolic_bp
            ),
        )

        db.add(admission)

        db.commit()

        db.refresh(admission)

        return admission

    except HTTPException:

        raise

    except Exception as e:

        db.rollback()

        raise HTTPException(
            status_code=500,
            detail=(
                f"Failed to create admission: "
                f"{str(e)}"
            ),
        )


# ============================================================
# UPDATE ADMISSION
# ============================================================

@router.put(
    "/{admission_id}",
    response_model=AdmissionResponse,
)
def update_admission(
    admission_id: str,
    admission_data: AdmissionUpdate,
    db: Session = Depends(get_db),
):
    clean_id = admission_id.strip()
    admission = (
        db.query(Admission)
        .filter(
            (Admission.admission_id == clean_id) | (Admission.id == (int(clean_id) if clean_id.isdigit() else -1))
        )
        .first()
    )

    if not admission:
        raise HTTPException(
            status_code=404,
            detail=f"Admission '{admission_id}' not found",
        )

    if admission_data.admit_type is not None:
        admission.admit_type = admission_data.admit_type
    if admission_data.ward_type is not None:
        admission.ward_type = admission_data.ward_type
    if admission_data.discharge_type is not None:
        admission.discharge_type = admission_data.discharge_type
    if admission_data.los_days is not None:
        admission.los_days = admission_data.los_days
    if admission_data.num_procedures is not None:
        admission.num_procedures = admission_data.num_procedures
    if admission_data.charlson_index is not None:
        admission.charlson_index = admission_data.charlson_index
    if admission_data.hba1c is not None:
        admission.hba1c = admission_data.hba1c
    if admission_data.creatinine is not None:
        admission.creatinine = admission_data.creatinine
    if admission_data.haemoglobin is not None:
        admission.haemoglobin = admission_data.haemoglobin
    if admission_data.systolic_bp is not None:
        admission.systolic_bp = admission_data.systolic_bp

    try:
        db.commit()
        db.refresh(admission)
        return admission
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=500,
            detail=f"Failed to update admission: {str(e)}",
        )


# ============================================================
# DELETE ADMISSION
# ============================================================

@router.delete("/{admission_id}")
def delete_admission(
    admission_id: str,
    db: Session = Depends(get_db),
):
    clean_id = admission_id.strip()
    admission = (
        db.query(Admission)
        .filter(
            (Admission.admission_id == clean_id) | (Admission.id == (int(clean_id) if clean_id.isdigit() else -1))
        )
        .first()
    )

    if not admission:
        raise HTTPException(
            status_code=404,
            detail=f"Admission '{admission_id}' not found",
        )

    try:
        db.delete(admission)
        db.commit()
        return {"message": f"Admission '{admission.admission_id}' deleted successfully."}
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=500,
            detail=f"Failed to delete admission: {str(e)}",
        )
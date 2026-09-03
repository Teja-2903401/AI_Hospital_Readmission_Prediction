import sys
from pathlib import Path

# ============================================================
# ADD BACKEND DIRECTORY TO PYTHON PATH
# ============================================================

BACKEND_DIR = Path(__file__).resolve().parents[1]

sys.path.insert(
    0,
    str(BACKEND_DIR)
)


from app.services.prediction_service import (
    predict_readmission
)


print("=" * 70)
print("TESTING LIVE READMISSION PREDICTION")
print("=" * 70)


# ============================================================
# SAMPLE LIVE PATIENT
# ============================================================

patient_features = {

    # --------------------------------------------------------
    # PATIENT INFORMATION
    # --------------------------------------------------------

    "age": 67,

    "gender": "F",

    "state": "Telangana",

    "bpl_card": False,

    "insurance_type": "ESI",

    "comorbidity_count": 3,

    "prev_admissions": 2,


    # --------------------------------------------------------
    # ADMISSION / CLINICAL INFORMATION
    # --------------------------------------------------------

    "los_days": 5,

    "admit_type": "Emergency",

    "ward_type": "General",

    "num_procedures": 2,

    "charlson_index": 2,

    "hba1c": 6.8,

    "creatinine": 1.20,

    "haemoglobin": 12.5,

    "systolic_bp": 150,


    # --------------------------------------------------------
    # DIAGNOSIS INFORMATION
    # --------------------------------------------------------

    "num_diagnoses": 2,

    "num_diagnosis_categories": 2,

    "primary_icd10": "E11",

    "primary_diag_category": "Endocrine",


    # --------------------------------------------------------
    # HOSPITAL INFORMATION
    # --------------------------------------------------------

    "tier": "tier2",

    "beds": 400,

    "teaching": True,
}


# ============================================================
# RUN PREDICTION
# ============================================================

try:

    result = predict_readmission(
        patient_features
    )

    print()
    print("Prediction successful!")
    print()

    print(
        f"Probability: "
        f"{result['probability']}"
    )

    print(
        f"Probability percentage: "
        f"{result['probability_percent']}%"
    )

    print(
        f"Risk level: "
        f"{result['risk_level']}"
    )

    print()
    print("Message:")
    print(
        result["message"]
    )

    print()
    print("=" * 70)
    print("LIVE PREDICTION TEST COMPLETE")
    print("=" * 70)


except Exception as e:

    print()
    print("Prediction failed.")

    print(
        f"Error: {e}"
    )
from pydantic import BaseModel, Field


# ============================================================
# PREDICTION REQUEST
# ============================================================

class PredictionRequest(BaseModel):

    # --------------------------------------------------------
    # ADMISSION
    # --------------------------------------------------------

    admission_id: str = Field(
        ...,
        min_length=1,
    )

    admit_type: str

    ward_type: str

    # --------------------------------------------------------
    # PATIENT
    # --------------------------------------------------------

    age: int = Field(
        ...,
        ge=0,
        le=120,
    )

    gender: str

    state: str

    bpl_card: bool

    insurance_type: str | None = None

    comorbidity_count: int = Field(
        ...,
        ge=0,
    )

    prev_admissions: int = Field(
        ...,
        ge=0,
    )

    # --------------------------------------------------------
    # CLINICAL
    # --------------------------------------------------------

    los_days: int = Field(
        ...,
        ge=0,
    )

    num_procedures: int = Field(
        ...,
        ge=0,
    )

    charlson_index: int = Field(
        ...,
        ge=0,
    )

    hba1c: float = Field(
        ...,
        ge=0,
    )

    creatinine: float = Field(
        ...,
        ge=0,
    )

    haemoglobin: float = Field(
        ...,
        ge=0,
    )

    systolic_bp: int = Field(
        ...,
        ge=0,
    )

    # --------------------------------------------------------
    # DIAGNOSIS
    # --------------------------------------------------------

    num_diagnoses: int = Field(
        ...,
        ge=1,
    )

    num_diagnosis_categories: int = Field(
        ...,
        ge=1,
    )

    primary_icd10: str

    primary_diag_category: str

    # --------------------------------------------------------
    # HOSPITAL
    # --------------------------------------------------------

    tier: str

    beds: int = Field(
        ...,
        ge=0,
    )

    teaching: bool

    # --------------------------------------------------------
    # BILLING
    # --------------------------------------------------------

    cost_category: str

    total_cost_inr: float = Field(
        ...,
        ge=0,
    )

    govt_subsidy_inr: float = Field(
        ...,
        ge=0,
    )

    out_of_pocket_inr: float = Field(
        ...,
        ge=0,
    )


    # --------------------------------------------------------
    # DEPARTMENT (OPTIONAL OVERRIDE)
    # --------------------------------------------------------

    department_name: str | None = None


# ============================================================
# PREDICTION RESPONSE
# ============================================================

class PredictionResponse(BaseModel):

    admission_id: str

    probability: float

    probability_percent: float

    risk_level: str

    department_name: str = "General Medicine"

    diagnosis_type: str = "Primary Clinical Diagnosis"

    primary_icd10: str | None = None

    primary_diag_category: str | None = None

    risk_factors: list[dict] = []

    disease_risk_factors: list[dict] = []

    clinical_summary: str | None = None

    recommendations: list[str] = []

    model_name: str = "Logistic Regression"

    model_version: str = "1.0"

    created_at: str | None = None

    message: str
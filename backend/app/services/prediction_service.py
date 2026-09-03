import joblib
import pandas as pd

from pathlib import Path


# ---------------------------------------------------------
# PATHS
# ---------------------------------------------------------

BACKEND_DIR = Path(__file__).resolve().parents[2]

MODEL_PATH = (
    BACKEND_DIR
    / "trained_models"
    / "logistic_regression.joblib"
)

PREPROCESSOR_PATH = (
    BACKEND_DIR
    / "trained_models"
    / "preprocessor.joblib"
)


# ---------------------------------------------------------
# LOAD MODEL
# ---------------------------------------------------------

print("Loading Logistic Regression model...")

model = joblib.load(MODEL_PATH)

print("Loading preprocessing pipeline...")

preprocessor = joblib.load(PREPROCESSOR_PATH)

print("Model and preprocessor loaded successfully.")


# ---------------------------------------------------------
# RISK CLASSIFICATION
# ---------------------------------------------------------

# ---------------------------------------------------------
# RISK CLASSIFICATION
# ---------------------------------------------------------

def classify_risk(probability: float) -> str:

    if probability < 0.35:
        return "LOW"

    elif probability < 0.55:
        return "MEDIUM"

    else:
        return "HIGH"


# ---------------------------------------------------------
# CLINICAL DEPARTMENT MAPPINGS
# ---------------------------------------------------------

DEPARTMENT_MAPPINGS = {
    "Cardiovascular": "Cardiology & Cardiovascular Medicine",
    "Endocrine": "Endocrinology & Diabetology",
    "Respiratory": "Pulmonology & Respiratory Medicine",
    "Genitourinary": "Nephrology & Urology",
    "Gastrointestinal": "Gastroenterology & Hepatology",
    "Neurological": "Neurology",
    "Infectious": "Infectious Diseases & General Medicine",
    "Neoplasm": "Medical & Surgical Oncology",
    "Injury": "Trauma & Orthopedic Surgery",
    "Obstetric": "Obstetrics & Gynecology",
    "Perinatal": "Neonatology & Pediatrics",
}

# ---------------------------------------------------------
# ICD-10 DIAGNOSIS DESCRIPTIONS
# ---------------------------------------------------------

DIAGNOSIS_ICD_DESCRIPTIONS = {
    "G40": "Epilepsy & Seizure Disorders",
    "G35": "Multiple Sclerosis",
    "I50": "Congestive Heart Failure",
    "I21": "Acute Myocardial Infarction (AMI)",
    "I10": "Essential (Primary) Hypertension",
    "I48": "Atrial Fibrillation and Flutter",
    "I63": "Cerebral Infarction (Ischemic Stroke)",
    "E11": "Type 2 Diabetes Mellitus",
    "E10": "Type 1 Diabetes Mellitus",
    "E87": "Metabolic & Electrolyte Disorder",
    "J44": "Chronic Obstructive Pulmonary Disease (COPD)",
    "J45": "Bronchial Asthma",
    "J18": "Pneumonia (Organism Unspecified)",
    "J96": "Respiratory Failure",
    "N18": "Chronic Kidney Disease (CKD)",
    "N39": "Urinary Tract Infection (UTI)",
    "K70": "Alcoholic Liver Disease",
    "K80": "Cholelithiasis (Gallstones)",
    "K57": "Diverticular Disease of Intestine",
    "A41": "Sepsis & Severe Systemic Infection",
    "A15": "Pulmonary Tuberculosis",
    "A91": "Dengue Haemorrhagic Fever",
    "A09": "Infectious Gastroenteritis & Colitis",
    "B54": "Unspecified Malaria",
    "C50": "Malignant Neoplasm of Breast",
    "C18": "Malignant Neoplasm of Colon",
    "C34": "Malignant Neoplasm of Bronchus & Lung",
    "S72": "Fracture of Femur",
    "S06": "Intracranial Injury / Head Trauma",
    "T14": "Injury of Unspecified Body Region",
    "O80": "Single Spontaneous Delivery",
    "O34": "Maternal Care for Uterine Anomaly",
    "P07": "Disorders Related to Short Gestation",
    "P22": "Respiratory Distress of Newborn",
}


def resolve_department(category: str | None, ward: str | None = None) -> str:
    """
    Resolve medical department from diagnosis category or ward.
    """
    if category and category in DEPARTMENT_MAPPINGS:
        return DEPARTMENT_MAPPINGS[category]

    if ward:
        ward_clean = ward.strip().lower()
        if "icu" in ward_clean or "hdu" in ward_clean:
            return "Critical Care & Emergency Medicine"
        if "pediatric" in ward_clean or "nicu" in ward_clean:
            return "Pediatrics & Neonatology"

    return "General Medicine"


def resolve_diagnosis_type(icd_code: str | None, category: str | None) -> str:
    """
    Build a comprehensive diagnosis type description.
    """
    code = (icd_code or "").strip().upper()
    desc = DIAGNOSIS_ICD_DESCRIPTIONS.get(code)
    cat = (category or "").strip()

    if desc and cat:
        return f"{desc} ({cat} - ICD {code})"
    elif desc:
        return f"{desc} (ICD {code})"
    elif cat and code:
        return f"{cat} Disorder (ICD {code})"
    elif cat:
        return f"{cat} Condition"
    elif code:
        return f"ICD-10 {code}"
    return "Primary Clinical Diagnosis"


# ---------------------------------------------------------
# DISEASE RISK FACTORS ASSESSMENT ENGINE
# ---------------------------------------------------------

def evaluate_disease_risk_factors(features: dict, probability: float, risk_level: str) -> dict:
    """
    Evaluate comprehensive disease-specific and physiological risk factors.
    """
    risk_factors = []
    category = features.get("primary_diag_category", "")
    icd = features.get("primary_icd10", "")

    # 1. Disease / Diagnosis specific factor
    diag_name = resolve_diagnosis_type(icd, category)
    if category in ["Cardiovascular", "Genitourinary", "Respiratory", "Infectious"]:
        risk_factors.append({
            "name": f"High-Acuity Diagnosis ({category})",
            "category": "Disease / Diagnosis",
            "level": "HIGH",
            "value": diag_name,
            "description": f"{diag_name} carries elevated post-discharge decompensation and readmission vulnerability."
        })
    elif category in ["Endocrine", "Neurological", "Neoplasm", "Gastrointestinal"]:
        risk_factors.append({
            "name": f"Chronic Condition Management ({category})",
            "category": "Disease / Diagnosis",
            "level": "MODERATE",
            "value": diag_name,
            "description": f"Ongoing disease management and medication adherence are critical for {diag_name}."
        })
    else:
        risk_factors.append({
            "name": f"Primary Diagnosis ({category or 'General'})",
            "category": "Disease / Diagnosis",
            "level": "LOW",
            "value": diag_name,
            "description": f"Standard recovery trajectory under clinical protocol."
        })

    # 2. Glycemic Control (HbA1c)
    hba1c = float(features.get("hba1c", 5.5) or 5.5)
    if hba1c >= 8.0:
        risk_factors.append({
            "name": "Severe Hyperglycemia (HbA1c)",
            "category": "Endocrine & Metabolic",
            "level": "HIGH",
            "value": f"{hba1c:.1f}%",
            "description": "HbA1c >= 8.0% reflects poor chronic glycemic control, accelerating vascular and infectious risk."
        })
    elif hba1c >= 6.5:
        risk_factors.append({
            "name": "Elevated HbA1c",
            "category": "Endocrine & Metabolic",
            "level": "MODERATE",
            "value": f"{hba1c:.1f}%",
            "description": "HbA1c indicates borderline or moderate hyperglycemia requiring post-discharge diabetic monitoring."
        })
    else:
        risk_factors.append({
            "name": "Controlled HbA1c",
            "category": "Endocrine & Metabolic",
            "level": "LOW",
            "value": f"{hba1c:.1f}%",
            "description": "Glycemic level is within controlled normal parameters."
        })

    # 3. Renal Function (Creatinine)
    creatinine = float(features.get("creatinine", 0.9) or 0.9)
    if creatinine >= 1.6:
        risk_factors.append({
            "name": "Renal Impairment (Elevated Creatinine)",
            "category": "Renal & Biomarkers",
            "level": "HIGH",
            "value": f"{creatinine:.2f} mg/dL",
            "description": "High creatinine indicates impaired renal clearance, fluid overload risk, and nephrotoxicity risk."
        })
    elif creatinine >= 1.2:
        risk_factors.append({
            "name": "Mild Creatinine Elevation",
            "category": "Renal & Biomarkers",
            "level": "MODERATE",
            "value": f"{creatinine:.2f} mg/dL",
            "description": "Borderline creatinine levels suggest mild renal vulnerability and hydration sensitivity."
        })
    else:
        risk_factors.append({
            "name": "Normal Renal Function",
            "category": "Renal & Biomarkers",
            "level": "LOW",
            "value": f"{creatinine:.2f} mg/dL",
            "description": "Serum creatinine is within standard baseline range."
        })

    # 4. Blood Pressure / Cardiovascular Strain (Systolic BP)
    sbp = int(features.get("systolic_bp", 120) or 120)
    if sbp >= 150:
        risk_factors.append({
            "name": "Stage 2 Severe Hypertension",
            "category": "Cardiovascular",
            "level": "HIGH",
            "value": f"{sbp} mmHg",
            "description": f"Markedly elevated systolic blood pressure ({sbp} mmHg) increases cardiac strain and cerebrovascular risk."
        })
    elif sbp >= 135:
        risk_factors.append({
            "name": "Prehypertension / Stage 1 Hypertension",
            "category": "Cardiovascular",
            "level": "MODERATE",
            "value": f"{sbp} mmHg",
            "description": f"Systolic pressure of {sbp} mmHg indicates moderate hemodynamic stress."
        })
    else:
        risk_factors.append({
            "name": "Normotensive Blood Pressure",
            "category": "Cardiovascular",
            "level": "LOW",
            "value": f"{sbp} mmHg",
            "description": f"Systolic blood pressure ({sbp} mmHg) is in optimal range."
        })

    # 5. Hematologic / Anemia (Haemoglobin)
    hb = float(features.get("haemoglobin", 12.0) or 12.0)
    if hb < 9.5:
        risk_factors.append({
            "name": "Significant Anemia (Low Haemoglobin)",
            "category": "Hematology",
            "level": "HIGH",
            "value": f"{hb:.1f} g/dL",
            "description": f"Haemoglobin {hb:.1f} g/dL causes tissue hypoxia, weakness, and delayed surgical/medical recovery."
        })
    elif hb < 11.5:
        risk_factors.append({
            "name": "Mild Anemia",
            "category": "Hematology",
            "level": "MODERATE",
            "value": f"{hb:.1f} g/dL",
            "description": f"Suboptimal haemoglobin ({hb:.1f} g/dL) may increase fatigue and recovery time."
        })
    else:
        risk_factors.append({
            "name": "Normal Haemoglobin",
            "category": "Hematology",
            "level": "LOW",
            "value": f"{hb:.1f} g/dL",
            "description": f"Haemoglobin {hb:.1f} g/dL is within acceptable clinical range."
        })

    # 6. Comorbidity Count & Charlson Index
    comorbidities = int(features.get("comorbidity_count", 0) or 0)
    charlson = int(features.get("charlson_index", 0) or 0)
    if comorbidities >= 3 or charlson >= 3:
        risk_factors.append({
            "name": "High Comorbidity Burden",
            "category": "Clinical Complexity",
            "level": "HIGH",
            "value": f"{comorbidities} comorbidities (Charlson: {charlson})",
            "description": "Multiple chronic comorbidities substantially amplify disease interaction and readmission odds."
        })
    elif comorbidities >= 1 or charlson >= 1:
        risk_factors.append({
            "name": "Moderate Comorbid Burden",
            "category": "Clinical Complexity",
            "level": "MODERATE",
            "value": f"{comorbidities} comorbidities (Charlson: {charlson})",
            "description": "Secondary conditions present requiring coordinated outpatient care."
        })
    else:
        risk_factors.append({
            "name": "Low Comorbidity Complexity",
            "category": "Clinical Complexity",
            "level": "LOW",
            "value": "0 comorbidities",
            "description": "No significant underlying secondary chronic diagnoses documented."
        })

    # 7. Previous Hospital Admissions
    prev_adm = int(features.get("prev_admissions", 0) or 0)
    if prev_adm >= 2:
        risk_factors.append({
            "name": "Frequent Hospital Readmissions",
            "category": "Utilization History",
            "level": "HIGH",
            "value": f"{prev_adm} prior admissions",
            "description": f"History of {prev_adm} prior hospitalizations is a strong predictive indicator of disease instability."
        })
    elif prev_adm == 1:
        risk_factors.append({
            "name": "Single Prior Admission",
            "category": "Utilization History",
            "level": "MODERATE",
            "value": "1 prior admission",
            "description": "One previous hospitalization within record."
        })
    else:
        risk_factors.append({
            "name": "First-time Admission",
            "category": "Utilization History",
            "level": "LOW",
            "value": "0 prior admissions",
            "description": "No previous admission history on file."
        })

    # 8. Length of Stay (LOS)
    los = int(features.get("los_days", 1) or 1)
    if los > 7:
        risk_factors.append({
            "name": "Prolonged Length of Stay",
            "category": "Hospital Course",
            "level": "HIGH",
            "value": f"{los} days",
            "description": f"Hospital stay of {los} days reflects complex inpatient course and debility risk."
        })
    elif los >= 4:
        risk_factors.append({
            "name": "Moderate Inpatient Stay",
            "category": "Hospital Course",
            "level": "MODERATE",
            "value": f"{los} days",
            "description": f"Length of stay of {los} days indicates standard acute inpatient management."
        })
    else:
        risk_factors.append({
            "name": "Short Length of Stay",
            "category": "Hospital Course",
            "level": "LOW",
            "value": f"{los} days",
            "description": f"Brief hospitalization ({los} days) with quick stabilization."
        })

    # Recommendations & Clinical Summary
    recommendations = []
    if risk_level == "HIGH":
        recommendations = [
            f"Schedule mandatory specialist follow-up with {resolve_department(category)} within 7 days of discharge.",
            "Conduct comprehensive medication reconciliation to prevent drug-drug interactions.",
            "Establish patient telephone check-in within 48-72 hours post-discharge.",
            "Ensure caregiver education regarding red-flag symptom recognition."
        ]
    elif risk_level == "MEDIUM":
        recommendations = [
            f"Routine outpatient review with {resolve_department(category)} within 14 days.",
            "Review diagnostic lab targets (HbA1c, Creatinine, BP) during primary care visit.",
            "Provide written discharge instructions and emergency contact details."
        ]
    else:
        recommendations = [
            "Standard discharge protocol with routine follow-up as clinically indicated.",
            "Maintain prescribed medications and lifestyle modifications."
        ]

    clinical_summary = (
        f"Patient presents with {diag_name} managed in {resolve_department(category, features.get('ward_type'))}. "
        f"Evaluated overall 30-day readmission risk is {risk_level} ({probability * 100:.1f}%). "
        f"Key clinical risk drivers include: "
        f"{', '.join([f['name'] for f in risk_factors if f['level'] in ['HIGH', 'MODERATE']][:3]) or 'None (stable clinical profile)'}."
    )

    return {
        "risk_factors": risk_factors,
        "disease_risk_factors": risk_factors,
        "clinical_summary": clinical_summary,
        "recommendations": recommendations,
    }


# ---------------------------------------------------------
# PREDICTION
# ---------------------------------------------------------

def predict_readmission(features: dict):

    # Clone features dictionary
    raw_features = dict(features)

    department_name = raw_features.pop("department_name", None) or resolve_department(
        raw_features.get("primary_diag_category"),
        raw_features.get("ward_type")
    )

    diagnosis_type = resolve_diagnosis_type(
        raw_features.get("primary_icd10"),
        raw_features.get("primary_diag_category")
    )

    # ML dataframe preparation
    dataframe = pd.DataFrame([raw_features])

    processed_data = preprocessor.transform(
        dataframe
    )

    probability = model.predict_proba(
        processed_data
    )[0][1]

    probability = float(probability)

    risk_level = classify_risk(
        probability
    )

    # Calculate disease risk factors
    assessment = evaluate_disease_risk_factors(
        raw_features,
        probability,
        risk_level
    )

    return {
        "probability": round(probability, 4),

        "probability_percent": round(
            probability * 100,
            2
        ),

        "risk_level": risk_level,

        "department_name": department_name,

        "diagnosis_type": diagnosis_type,

        "primary_icd10": raw_features.get("primary_icd10"),

        "primary_diag_category": raw_features.get("primary_diag_category"),

        "risk_factors": assessment["risk_factors"],

        "disease_risk_factors": assessment["disease_risk_factors"],

        "clinical_summary": assessment["clinical_summary"],

        "recommendations": assessment["recommendations"],

        "message": (
            "Model-estimated 30-day hospital "
            "readmission risk. This system is "
            "intended for educational and predictive "
            "analytics purposes only and does not "
            "provide a medical diagnosis or treatment "
            "recommendation."
        )
    }
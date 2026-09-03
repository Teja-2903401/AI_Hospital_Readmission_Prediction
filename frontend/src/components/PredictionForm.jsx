import { useEffect, useRef, useState } from "react";
import axios from "axios";

const API_URL = "http://127.0.0.1:8000";

const DEPARTMENT_OPTIONS = [
  ["Cardiology & Cardiovascular Medicine", "Cardiology & Cardiovascular Medicine"],
  ["Endocrinology & Diabetology", "Endocrinology & Diabetology"],
  ["Pulmonology & Respiratory Medicine", "Pulmonology & Respiratory Medicine"],
  ["Nephrology & Urology", "Nephrology & Urology"],
  ["Gastroenterology & Hepatology", "Gastroenterology & Hepatology"],
  ["Neurology", "Neurology"],
  ["Infectious Diseases & General Medicine", "Infectious Diseases & General Medicine"],
  ["Medical & Surgical Oncology", "Medical & Surgical Oncology"],
  ["Trauma & Orthopedic Surgery", "Trauma & Orthopedic Surgery"],
  ["Obstetrics & Gynecology", "Obstetrics & Gynecology"],
  ["Neonatology & Pediatrics", "Neonatology & Pediatrics"],
  ["General Medicine", "General Medicine"],
];

const DIAGNOSIS_CATEGORIES = [
  ["Neurological", "Neurological"],
  ["Cardiovascular", "Cardiovascular"],
  ["Endocrine", "Endocrine"],
  ["Respiratory", "Respiratory"],
  ["Genitourinary", "Genitourinary"],
  ["Gastrointestinal", "Gastrointestinal"],
  ["Infectious", "Infectious"],
  ["Neoplasm", "Neoplasm"],
  ["Injury", "Injury"],
  ["Obstetric", "Obstetric"],
  ["Perinatal", "Perinatal"],
];

const POPULAR_DIAGNOSES = [
  { icd: "G40", name: "Epilepsy & Seizures", category: "Neurological", dept: "Neurology" },
  { icd: "G35", name: "Multiple Sclerosis", category: "Neurological", dept: "Neurology" },
  { icd: "I50", name: "Heart Failure", category: "Cardiovascular", dept: "Cardiology & Cardiovascular Medicine" },
  { icd: "I21", name: "Acute Myocardial Infarction", category: "Cardiovascular", dept: "Cardiology & Cardiovascular Medicine" },
  { icd: "I10", name: "Essential Hypertension", category: "Cardiovascular", dept: "Cardiology & Cardiovascular Medicine" },
  { icd: "I48", name: "Atrial Fibrillation", category: "Cardiovascular", dept: "Cardiology & Cardiovascular Medicine" },
  { icd: "I63", name: "Ischemic Stroke", category: "Cardiovascular", dept: "Cardiology & Cardiovascular Medicine" },
  { icd: "E11", name: "Type 2 Diabetes Mellitus", category: "Endocrine", dept: "Endocrinology & Diabetology" },
  { icd: "E10", name: "Type 1 Diabetes Mellitus", category: "Endocrine", dept: "Endocrinology & Diabetology" },
  { icd: "E87", name: "Metabolic / Electrolyte Disorder", category: "Endocrine", dept: "Endocrinology & Diabetology" },
  { icd: "J44", name: "COPD", category: "Respiratory", dept: "Pulmonology & Respiratory Medicine" },
  { icd: "J45", name: "Bronchial Asthma", category: "Respiratory", dept: "Pulmonology & Respiratory Medicine" },
  { icd: "J18", name: "Pneumonia", category: "Respiratory", dept: "Pulmonology & Respiratory Medicine" },
  { icd: "J96", name: "Respiratory Failure", category: "Respiratory", dept: "Pulmonology & Respiratory Medicine" },
  { icd: "N18", name: "Chronic Kidney Disease", category: "Genitourinary", dept: "Nephrology & Urology" },
  { icd: "N39", name: "Urinary Tract Infection", category: "Genitourinary", dept: "Nephrology & Urology" },
  { icd: "K70", name: "Alcoholic Liver Disease", category: "Gastrointestinal", dept: "Gastroenterology & Hepatology" },
  { icd: "K80", name: "Cholelithiasis", category: "Gastrointestinal", dept: "Gastroenterology & Hepatology" },
  { icd: "K57", name: "Diverticular Disease", category: "Gastrointestinal", dept: "Gastroenterology & Hepatology" },
  { icd: "A41", name: "Sepsis", category: "Infectious", dept: "Infectious Diseases & General Medicine" },
  { icd: "A15", name: "Pulmonary Tuberculosis", category: "Infectious", dept: "Infectious Diseases & General Medicine" },
  { icd: "A91", name: "Dengue Haemorrhagic Fever", category: "Infectious", dept: "Infectious Diseases & General Medicine" },
  { icd: "A09", name: "Gastroenteritis & Colitis", category: "Infectious", dept: "Infectious Diseases & General Medicine" },
  { icd: "B54", name: "Malaria", category: "Infectious", dept: "Infectious Diseases & General Medicine" },
  { icd: "C50", name: "Breast Neoplasm", category: "Neoplasm", dept: "Medical & Surgical Oncology" },
  { icd: "C18", name: "Colon Neoplasm", category: "Neoplasm", dept: "Medical & Surgical Oncology" },
  { icd: "C34", name: "Lung Neoplasm", category: "Neoplasm", dept: "Medical & Surgical Oncology" },
  { icd: "S72", name: "Fracture of Femur", category: "Injury", dept: "Trauma & Orthopedic Surgery" },
  { icd: "S06", name: "Head Trauma / Injury", category: "Injury", dept: "Trauma & Orthopedic Surgery" },
  { icd: "T14", name: "Unspecified Injury", category: "Injury", dept: "Trauma & Orthopedic Surgery" },
  { icd: "O80", name: "Single Spontaneous Delivery", category: "Obstetric", dept: "Obstetrics & Gynecology" },
  { icd: "O34", name: "Maternal Care", category: "Obstetric", dept: "Obstetrics & Gynecology" },
  { icd: "P07", name: "Prematurity (Short Gestation)", category: "Perinatal", dept: "Neonatology & Pediatrics" },
  { icd: "P22", name: "Respiratory Distress of Newborn", category: "Perinatal", dept: "Neonatology & Pediatrics" },
];

const CATEGORY_TO_DEPARTMENT = {
  Cardiovascular: "Cardiology & Cardiovascular Medicine",
  Endocrine: "Endocrinology & Diabetology",
  Respiratory: "Pulmonology & Respiratory Medicine",
  Genitourinary: "Nephrology & Urology",
  Gastrointestinal: "Gastroenterology & Hepatology",
  Neurological: "Neurology",
  Infectious: "Infectious Diseases & General Medicine",
  Neoplasm: "Medical & Surgical Oncology",
  Injury: "Trauma & Orthopedic Surgery",
  Obstetric: "Obstetrics & Gynecology",
  Perinatal: "Neonatology & Pediatrics",
};

const initialForm = {
  admission_id: "A10025",
  department_name: "Neurology",

  age: 67,
  gender: "F",
  state: "Telangana",
  bpl_card: false,
  insurance_type: "ESI",
  comorbidity_count: 3,
  prev_admissions: 0,

  los_days: 5,
  admit_type: "Emergency",
  ward_type: "General",
  num_procedures: 0,
  charlson_index: 2,
  hba1c: 5.6,
  creatinine: 0.67,
  haemoglobin: 10.9,
  systolic_bp: 130,

  num_diagnoses: 1,
  num_diagnosis_categories: 1,
  primary_icd10: "G40",
  primary_diag_category: "Neurological",

  tier: "tier2",
  beds: 400,
  teaching: true,

  cost_category: "Room",
  total_cost_inr: 59696,
  govt_subsidy_inr: 48650,
  out_of_pocket_inr: 11046,
};


/* ============================================================
   MAIN COMPONENT
   ============================================================ */

function PredictionForm({
  selectedAdmission,
  onPredictionCreated,
}) {
  const [form, setForm] =
    useState(initialForm);

  const [result, setResult] =
    useState(null);

  const [predictionHistory, setPredictionHistory] =
    useState([]);

  const [loading, setLoading] =
    useState(false);

  const [historyLoading, setHistoryLoading] =
    useState(false);

  const [error, setError] =
    useState("");

  const lastAdmissionIdRef = useRef(null);


  /* ============================================================
     POPULATE SELECTED ADMISSION
     ============================================================ */

  useEffect(() => {
    if (!selectedAdmission || !selectedAdmission.admission_id) {
      return;
    }

    const isNewAdmission =
      lastAdmissionIdRef.current !== selectedAdmission.admission_id;

    if (!isNewAdmission) {
      return;
    }

    lastAdmissionIdRef.current = selectedAdmission.admission_id;

    const patient =
      selectedAdmission.patient || {};

    const diagCategory =
      selectedAdmission.primary_diag_category ??
      initialForm.primary_diag_category;

    const dept =
      selectedAdmission.department_name ??
      CATEGORY_TO_DEPARTMENT[diagCategory] ??
      initialForm.department_name;

    setForm((current) => ({
      ...current,

      admission_id:
        selectedAdmission.admission_id ??
        current.admission_id,

      department_name: dept,

      age:
        patient.age ??
        selectedAdmission.age ??
        current.age,

      gender:
        patient.gender ??
        selectedAdmission.gender ??
        current.gender,

      state:
        patient.state ??
        selectedAdmission.state ??
        current.state,

      bpl_card:
        patient.bpl_card ??
        selectedAdmission.bpl_card ??
        current.bpl_card,

      insurance_type:
        patient.insurance_type ??
        selectedAdmission.insurance_type ??
        current.insurance_type,

      comorbidity_count:
        patient.comorbidity_count ??
        selectedAdmission.comorbidity_count ??
        current.comorbidity_count,

      prev_admissions:
        patient.prev_admissions ??
        selectedAdmission.prev_admissions ??
        current.prev_admissions,

      los_days:
        selectedAdmission.los_days ??
        current.los_days,

      admit_type:
        selectedAdmission.admit_type ??
        current.admit_type,

      ward_type:
        selectedAdmission.ward_type ??
        current.ward_type,

      num_procedures:
        selectedAdmission.num_procedures ??
        current.num_procedures,

      charlson_index:
        selectedAdmission.charlson_index ??
        current.charlson_index,

      hba1c:
        selectedAdmission.hba1c ??
        current.hba1c,

      creatinine:
        selectedAdmission.creatinine ??
        current.creatinine,

      haemoglobin:
        selectedAdmission.haemoglobin ??
        current.haemoglobin,

      systolic_bp:
        selectedAdmission.systolic_bp ??
        current.systolic_bp,

      num_diagnoses:
        selectedAdmission.num_diagnoses ??
        current.num_diagnoses,

      num_diagnosis_categories:
        selectedAdmission.num_diagnosis_categories ??
        current.num_diagnosis_categories,

      primary_icd10:
        selectedAdmission.primary_icd10 ??
        current.primary_icd10,

      primary_diag_category:
        diagCategory,

      tier:
        selectedAdmission.tier ??
        current.tier,

      beds:
        selectedAdmission.beds ??
        current.beds,

      teaching:
        selectedAdmission.teaching ??
        current.teaching,

      cost_category:
        selectedAdmission.cost_category ??
        current.cost_category,

      total_cost_inr:
        selectedAdmission.total_cost_inr ??
        current.total_cost_inr,

      govt_subsidy_inr:
        selectedAdmission.govt_subsidy_inr ??
        current.govt_subsidy_inr,

      out_of_pocket_inr:
        selectedAdmission.out_of_pocket_inr ??
        current.out_of_pocket_inr,
    }));

    setError("");
    setResult(null);

    loadPredictionHistory(
      selectedAdmission.admission_id
    );
  }, [selectedAdmission]);


  /* ============================================================
     LOAD HISTORY
     ============================================================ */

  const loadPredictionHistory =
    async (admissionId, keepCurrentResult = false) => {
      if (!admissionId) {
        setPredictionHistory([]);
        return;
      }

      try {
        setHistoryLoading(true);

        const response =
          await axios.get(
            `${API_URL}/api/predictions/admission/${encodeURIComponent(
              admissionId
            )}`
          );

        const data =
          response.data || {};

        const rows =
          Array.isArray(
            data.predictions
          )
            ? data.predictions
            : [];

        setPredictionHistory(rows);

        if (!keepCurrentResult) {
          if (rows.length > 0) {
            setResult(rows[0]);
          } else {
            setResult(null);
          }
        }
      } catch (err) {
        console.error(
          "Prediction history error:",
          err
        );

        setPredictionHistory([]);
        if (!keepCurrentResult) {
          setResult(null);
        }
      } finally {
        setHistoryLoading(false);
      }
    };


  /* ============================================================
     INPUT
     ============================================================ */

  const handleChange = (event) => {
    const {
      name,
      value,
      type,
      checked,
    } = event.target;

    setForm((current) => {
      const updated = {
        ...current,
        [name]:
          type === "checkbox"
            ? checked
            : type === "number"
              ? Number(value)
              : value,
      };

      // Auto-sync department when category changes
      if (name === "primary_diag_category") {
        const matchedDept = CATEGORY_TO_DEPARTMENT[value];
        if (matchedDept) {
          updated.department_name = matchedDept;
        }
      }

      // Auto-sync category and department when popular diagnosis changes
      if (name === "primary_icd10") {
        const matchedDiag = POPULAR_DIAGNOSES.find(
          (d) => d.icd.toLowerCase() === String(value).trim().toLowerCase()
        );
        if (matchedDiag) {
          updated.primary_diag_category = matchedDiag.category;
          updated.department_name = matchedDiag.dept;
        }
      }

      return updated;
    });
  };

  const handleQuickDiagnosisSelect = (event) => {
    const icd = event.target.value;
    if (!icd) return;

    const matched = POPULAR_DIAGNOSES.find((d) => d.icd === icd);
    if (matched) {
      setForm((current) => ({
        ...current,
        primary_icd10: matched.icd,
        primary_diag_category: matched.category,
        department_name: matched.dept,
      }));
    }
  };


  /* ============================================================
     SUBMIT
     ============================================================ */

  const handleSubmit =
    async (event) => {
      event.preventDefault();

      setLoading(true);
      setError("");

      try {
        const requestData = {
          ...form,

          admission_id:
            String(
              form.admission_id
            ).trim(),
        };

        const response =
          await axios.post(
            `${API_URL}/api/predictions/predict`,
            requestData
          );

        const prediction =
          response.data;

        setResult(prediction);

        await loadPredictionHistory(
          prediction.admission_id ??
          requestData.admission_id,
          true
        );

        if (onPredictionCreated) {
          await onPredictionCreated(
            prediction
          );
        }
      } catch (err) {
        console.error(
          "Prediction error:",
          err
        );

        if (
          err.response?.data?.detail
        ) {
          const detail =
            err.response.data.detail;

          if (Array.isArray(detail)) {
            setError(
              detail
                .map((item) => {
                  const field =
                    Array.isArray(
                      item.loc
                    )
                      ? item.loc[
                      item.loc.length - 1
                      ]
                      : "field";

                  return `${field}: ${item.msg}`;
                })
                .join(" | ")
            );
          } else {
            setError(
              String(detail)
            );
          }
        } else if (
          err.response?.status ===
          404
        ) {
          setError(
            "Admission not found. Please select an existing admission."
          );
        } else if (
          err.response?.status ===
          422
        ) {
          setError(
            "Some prediction fields are invalid. Please check the values."
          );
        } else {
          setError(
            "Unable to connect to the prediction backend."
          );
        }
      } finally {
        setLoading(false);
      }
    };


  /* ============================================================
     RISK CLASS
     ============================================================ */

  const riskClass = (risk) => {
    const value =
      String(risk || "")
        .toLowerCase();

    if (value === "low") {
      return "risk-low";
    }

    if (value === "high") {
      return "risk-high";
    }

    return "risk-medium";
  };


  /* ============================================================
     DATE FORMAT
     ============================================================ */

  const formatDate = (value) => {
    if (!value) {
      return "—";
    }

    const date =
      new Date(value);

    if (
      Number.isNaN(
        date.getTime()
      )
    ) {
      return String(value);
    }

    return date.toLocaleString();
  };


  /* ============================================================
     RENDER
     ============================================================ */

  return (
    <section className="prediction-workspace">

      {/* ======================================================
          HEADER
          ====================================================== */}

      <div className="prediction-page-header">

        <div>

          <p className="section-eyebrow">
            AI PREDICTION ENGINE
          </p>

          <div className="title-with-heartbeat">

            <h2>
              AI Hospital Readmission Risk Prediction
            </h2>

          </div>

          <p>
            Generate a 30-day readmission risk estimate with department classification,
            diagnosis analysis, and disease risk factors.
          </p>

        </div>

        {selectedAdmission && (

          <div className="selected-admission-pill">

            <span>
              Admission
            </span>

            <strong>
              {
                selectedAdmission.admission_id
              }
            </strong>

          </div>

        )}

      </div>


      {/* ======================================================
          SELECTED PATIENT
          ====================================================== */}

      {selectedAdmission && (

        <div className="prediction-context">

          <div className="context-icon">
            ♙
          </div>

          <div>

            <span>
              Prediction subject
            </span>

            <strong>
              Patient{" "}
              {
                selectedAdmission.patient_id ??
                selectedAdmission.patient?.patient_id ??
                "—"
              }
            </strong>

            <small>
              {
                selectedAdmission.admit_type ??
                "Admission"
              }
              {" · "}
              {
                selectedAdmission.ward_type ??
                "Ward"
              }
            </small>

          </div>

          <div className="context-note">
            Patient and admission information is loaded from the selected record.
          </div>

        </div>

      )}


      {/* ======================================================
          FORM
          ====================================================== */}

      <div className="prediction-form-card">

        <div className="prediction-form-intro">

          <p className="section-eyebrow">
            MODEL INPUTS
          </p>

          <h3>
            Clinical & Diagnosis Variables
          </h3>

          <p>
            Review patient condition, medical department, diagnosis, and clinical lab values before running the prediction.
          </p>

        </div>


        <form
          className="prediction-form"
          onSubmit={handleSubmit}
        >

          {/* ==================================================
              DEPARTMENT & DIAGNOSIS SECTION
              ================================================== */}

          <FormSection
            title="Department & Diagnosis"
            description="Clinical specialty department, primary diagnosis type, and ICD-10 coding."
          >

            <label className="field full-width">
              <span>Quick Select Primary Condition</span>
              <select
                onChange={handleQuickDiagnosisSelect}
                value={form.primary_icd10}
              >
                <option value="">-- Choose a standard disease condition --</option>
                {POPULAR_DIAGNOSES.map((d) => (
                  <option key={d.icd} value={d.icd}>
                    {d.icd} - {d.name} ({d.category})
                  </option>
                ))}
              </select>
            </label>

            <Field
              label="Department Name"
              name="department_name"
              type="select"
              value={form.department_name}
              onChange={handleChange}
              options={DEPARTMENT_OPTIONS}
            />

            <Field
              label="Diagnosis Category"
              name="primary_diag_category"
              type="select"
              value={form.primary_diag_category}
              onChange={handleChange}
              options={DIAGNOSIS_CATEGORIES}
            />

            <Field
              label="Primary ICD-10 Code"
              name="primary_icd10"
              value={form.primary_icd10}
              onChange={handleChange}
            />

            <Field
              label="Number of Diagnoses"
              name="num_diagnoses"
              type="number"
              value={form.num_diagnoses}
              onChange={handleChange}
            />

            <Field
              label="Diagnosis Categories"
              name="num_diagnosis_categories"
              type="number"
              value={form.num_diagnosis_categories}
              onChange={handleChange}
            />

            <Field
              label="Admission Type"
              name="admit_type"
              type="select"
              value={form.admit_type}
              onChange={handleChange}
              options={[
                ["Emergency", "Emergency"],
                ["Urgent", "Urgent"],
                ["Elective", "Elective"],
                ["OPD", "Outpatient (OPD)"],
              ]}
            />

            <Field
              label="Ward"
              name="ward_type"
              type="select"
              value={form.ward_type}
              onChange={handleChange}
              options={[
                ["General", "General Ward"],
                ["ICU", "ICU (Intensive Care Unit)"],
                ["HDU", "HDU (High Dependency Unit)"],
                ["NICU", "NICU (Neonatal ICU)"],
                ["Semi-Private", "Semi-Private"],
                ["Private", "Private Room"],
              ]}
            />

          </FormSection>


          {/* ==================================================
              PATIENT
              ================================================== */}

          <FormSection
            title="Patient Demographics"
            description="Demographic, socioeconomic, and patient history variables."
          >

            <Field
              label="Age"
              name="age"
              type="number"
              value={form.age}
              onChange={handleChange}
            />

            <Field
              label="Gender"
              name="gender"
              type="select"
              value={form.gender}
              onChange={handleChange}
              options={[
                ["F", "Female"],
                ["M", "Male"],
              ]}
            />

            <Field
              label="State"
              name="state"
              value={form.state}
              onChange={handleChange}
            />

            <Field
              label="Insurance Type"
              name="insurance_type"
              value={
                form.insurance_type
              }
              onChange={handleChange}
            />

            <Field
              label="Comorbidity Count"
              name="comorbidity_count"
              type="number"
              value={
                form.comorbidity_count
              }
              onChange={handleChange}
            />

            <Field
              label="Previous Admissions"
              name="prev_admissions"
              type="number"
              value={
                form.prev_admissions
              }
              onChange={handleChange}
            />

          </FormSection>


          {/* ==================================================
              CLINICAL LABS & MEASUREMENTS
              ================================================== */}

          <FormSection
            title="Clinical Labs & Vitals"
            description="Diagnostic lab markers and physiological measurements."
          >

            <Field
              label="Length of Stay (Days)"
              name="los_days"
              type="number"
              value={
                form.los_days
              }
              onChange={handleChange}
            />

            <Field
              label="Procedures Count"
              name="num_procedures"
              type="number"
              value={
                form.num_procedures
              }
              onChange={handleChange}
            />

            <Field
              label="Charlson Index"
              name="charlson_index"
              type="number"
              value={
                form.charlson_index
              }
              onChange={handleChange}
            />

            <Field
              label="HbA1c (%)"
              name="hba1c"
              type="number"
              step="0.1"
              value={
                form.hba1c
              }
              onChange={handleChange}
            />

            <Field
              label="Creatinine (mg/dL)"
              name="creatinine"
              type="number"
              step="0.01"
              value={
                form.creatinine
              }
              onChange={handleChange}
            />

            <Field
              label="Haemoglobin (g/dL)"
              name="haemoglobin"
              type="number"
              step="0.1"
              value={
                form.haemoglobin
              }
              onChange={handleChange}
            />

            <Field
              label="Systolic BP (mmHg)"
              name="systolic_bp"
              type="number"
              value={
                form.systolic_bp
              }
              onChange={handleChange}
            />

          </FormSection>


          {/* ==================================================
              HOSPITAL & BILLING
              ================================================== */}

          <FormSection
            title="Hospital & Socioeconomic"
            description="Facility characteristics and hospital tiering."
          >

            <Field
              label="Hospital Tier"
              name="tier"
              value={form.tier}
              onChange={handleChange}
            />

            <Field
              label="Beds"
              name="beds"
              type="number"
              value={form.beds}
              onChange={handleChange}
            />

            <Checkbox
              label="Teaching Hospital"
              name="teaching"
              checked={
                form.teaching
              }
              onChange={handleChange}
            />

            <Checkbox
              label="BPL Card Holder"
              name="bpl_card"
              checked={
                form.bpl_card
              }
              onChange={handleChange}
            />

          </FormSection>


          {/* ==================================================
              ERROR
              ================================================== */}

          {error && (

            <div className="error-box">

              <strong>
                Prediction Error
              </strong>

              <p>
                {error}
              </p>

            </div>

          )}


          {/* ==================================================
              SUBMIT
              ================================================== */}

          <div className="prediction-submit-row">

            <div>

              <strong>
                Ready to evaluate readmission risk?
              </strong>

              <span>
                Calculates probability, department analysis, and disease risk factors.
              </span>

            </div>

            <button
              type="submit"
              className="predict-button"
              disabled={loading}
            >
              {loading
                ? "Calculating Risk..."
                : "Run Prediction →"}
            </button>

          </div>

        </form>

      </div>


      {/* ======================================================
          RESULT
          ====================================================== */}

      {result && (

        <section className="prediction-result-card">

          <div className="result-top">

            <div>

              <p className="section-eyebrow">
                MODEL RESULT
              </p>

              <h2>
                30-Day Readmission Risk
              </h2>

            </div>

            <span
              className={`risk-badge large ${riskClass(
                result.risk_level
              )}`}
            >
              {result.risk_level}
            </span>

          </div>


          <div className="result-main">

            <div className="result-number">

              <span>
                Probability
              </span>

              <strong>
                {Number(
                  result.probability_percent
                ).toFixed(2)}
                %
              </strong>

            </div>


            <div className="result-bar">

              <div
                className={`result-bar-fill ${riskClass(
                  result.risk_level
                )}`}
                style={{
                  width: `${Math.min(
                    100,
                    Math.max(
                      0,
                      Number(
                        result.probability_percent ||
                        0
                      )
                    )
                  )}%`,
                }}
              />

            </div>

          </div>


          <p className="result-message">
            {result.message}
          </p>


          {/* ==================================================
              DEPARTMENT & TYPE OF DIAGNOSIS HIGHLIGHT
              ================================================== */}

          <div className="result-dept-diag-box">

            <div className="result-dept-card">

              <div className="result-dept-icon">
                🏥
              </div>

              <div>

                <span className="result-dept-label">
                  DEPARTMENT NAME
                </span>

                <strong className="result-dept-value">
                  {result.department_name || form.department_name || "General Medicine"}
                </strong>

                <small className="result-dept-sub">
                  Ward: {form.ward_type || "General"} · Tier: {form.tier || "tier2"}
                </small>

              </div>

            </div>


            <div className="result-diag-card">

              <div className="result-diag-icon">
                🩺
              </div>

              <div>

                <span className="result-diag-label">
                  TYPE OF DIAGNOSIS
                </span>

                <strong className="result-diag-value">
                  {result.diagnosis_type ||
                    `${form.primary_diag_category} Disorder (ICD ${form.primary_icd10})`}
                </strong>

                <div className="result-diag-badges">

                  <span className="mini-badge">
                    ICD-10: {result.primary_icd10 || form.primary_icd10}
                  </span>

                  <span className="mini-badge">
                    Category: {result.primary_diag_category || form.primary_diag_category}
                  </span>

                  <span className="mini-badge">
                    Admit: {form.admit_type}
                  </span>

                </div>

              </div>

            </div>

          </div>


          {/* ==================================================
              DISEASE RISK FACTORS ANALYSIS
              ================================================== */}

          {Array.isArray(result.disease_risk_factors || result.risk_factors) &&
            (result.disease_risk_factors || result.risk_factors).length > 0 && (

              <div className="disease-risk-factors-section">

                <div className="disease-risk-header">

                  <div>

                    <p className="section-eyebrow">
                      CLINICAL RISK FACTOR BREAKDOWN
                    </p>

                    <h3>
                      Disease Risk Factors & Contributing Biomarkers
                    </h3>

                    <p className="disease-risk-sub">
                      Multi-variable analysis based on diagnosis, clinical vitals, laboratory markers, and hospital dynamics:
                    </p>

                  </div>

                </div>

                <div className="risk-factors-grid">

                  {(result.disease_risk_factors || result.risk_factors).map((factor, index) => {
                    const level = String(factor.level || "LOW").toUpperCase();
                    const badgeClass =
                      level === "HIGH"
                        ? "factor-badge-high"
                        : level === "MODERATE"
                          ? "factor-badge-moderate"
                          : "factor-badge-low";

                    const cardClass =
                      level === "HIGH"
                        ? "factor-card-high"
                        : level === "MODERATE"
                          ? "factor-card-moderate"
                          : "factor-card-low";

                    return (
                      <div
                        key={index}
                        className={`risk-factor-card ${cardClass}`}
                      >

                        <div className="risk-factor-top">

                          <div className="risk-factor-info">

                            <span className="risk-factor-category">
                              {factor.category || "Clinical Indicator"}
                            </span>

                            <strong className="risk-factor-title">
                              {factor.name}
                            </strong>

                          </div>

                          <span className={`risk-factor-badge ${badgeClass}`}>
                            {level === "LOW" ? "CONTROLLED" : `${level} RISK`}
                          </span>

                        </div>

                        {factor.value && (
                          <div className="risk-factor-value-pill">
                            <strong>Recorded:</strong> {factor.value}
                          </div>
                        )}

                        <p className="risk-factor-desc">
                          {factor.description}
                        </p>

                      </div>
                    );
                  })}

                </div>

              </div>

            )}


          {/* ==================================================
              CLINICAL RECOMMENDATIONS
              ================================================== */}

          {Array.isArray(result.recommendations) && result.recommendations.length > 0 && (

            <div className="clinical-recommendations-box">

              <div className="recommendations-title">
                <span>📋</span>
                <strong>Recommended Disease Action Plan</strong>
              </div>

              <ul className="recommendations-list">
                {result.recommendations.map((rec, idx) => (
                  <li key={idx}>
                    {rec}
                  </li>
                ))}
              </ul>

            </div>

          )}


          {/* ==================================================
              META DETAILS
              ================================================== */}

          <div className="result-meta">

            <Detail
              label="Admission"
              value={
                result.admission_id
              }
            />

            <Detail
              label="Department"
              value={
                result.department_name || form.department_name || "General Medicine"
              }
            />

            <Detail
              label="Diagnosis"
              value={
                result.primary_icd10
                  ? `${result.primary_icd10} (${result.primary_diag_category || "Primary"})`
                  : form.primary_icd10
              }
            />

            <Detail
              label="Model"
              value={
                result.model_name ??
                "Logistic Regression"
              }
            />

            <Detail
              label="Created"
              value={formatDate(
                result.created_at
              )}
            />

          </div>

        </section>

      )}


      {/* ======================================================
          HISTORY
          ====================================================== */}

      <section className="prediction-history-card">

        <div className="card-header">

          <div>

            <p className="section-eyebrow">
              DATABASE
            </p>

            <h2>
              Prediction History
            </h2>

          </div>


          <button
            type="button"
            className="secondary-button"
            onClick={() =>
              loadPredictionHistory(
                form.admission_id
              )
            }
            disabled={historyLoading}
          >
            {historyLoading
              ? "Loading..."
              : "↻ Refresh History"}
          </button>

        </div>


        {predictionHistory.length === 0 ? (

          <div className="empty-state">

            <div>
              ◷
            </div>

            <h3>
              No predictions yet
            </h3>

            <p>
              Prediction records will
              appear here after running
              the model.
            </p>

          </div>

        ) : (

          <div className="table-wrapper">

            <table className="history-table">

              <thead>

                <tr>
                  <th>ID</th>
                  <th>Admission</th>
                  <th>Probability</th>
                  <th>Risk</th>
                  <th>Model</th>
                  <th>Created</th>
                </tr>

              </thead>


              <tbody>

                {predictionHistory.map(
                  (prediction) => (

                    <tr
                      key={
                        prediction.id
                      }
                    >

                      <td>
                        {prediction.id}
                      </td>

                      <td>
                        {
                          prediction.admission_id
                        }
                      </td>

                      <td>
                        {Number(
                          prediction.probability_percent
                        ).toFixed(2)}
                        %
                      </td>

                      <td>

                        <span
                          className={`risk-badge ${riskClass(
                            prediction.risk_level
                          )}`}
                        >
                          {
                            prediction.risk_level
                          }
                        </span>

                      </td>

                      <td>
                        {
                          prediction.model_name ??
                          "Logistic Regression"
                        }
                      </td>

                      <td>
                        {formatDate(
                          prediction.created_at
                        )}
                      </td>

                    </tr>

                  )
                )}

              </tbody>

            </table>

          </div>

        )}

      </section>

    </section>
  );
}


/* ============================================================
   FORM SECTION
   ============================================================ */

function FormSection({
  title,
  description,
  children,
}) {
  return (
    <section className="form-section">

      <div className="form-section-heading">

        <h3>
          {title}
        </h3>

        <p>
          {description}
        </p>

      </div>

      <div className="form-grid">
        {children}
      </div>

    </section>
  );
}


/* ============================================================
   FIELD
   ============================================================ */

function Field({
  label,
  name,
  type = "text",
  value,
  onChange,
  options = [],
  step,
}) {
  return (
    <label className="field">

      <span>
        {label}
      </span>

      {type === "select" ? (

        <select
          name={name}
          value={value}
          onChange={onChange}
        >

          {options.map(
            ([
              optionValue,
              optionLabel,
            ]) => (

              <option
                key={optionValue}
                value={optionValue}
              >
                {optionLabel}
              </option>

            )
          )}

        </select>

      ) : (

        <input
          type={type}
          name={name}
          value={value ?? ""}
          onChange={onChange}
          min={
            type === "number"
              ? 0
              : undefined
          }
          step={step}
          required
        />

      )}

    </label>
  );
}


/* ============================================================
   CHECKBOX
   ============================================================ */

function Checkbox({
  label,
  name,
  checked,
  onChange,
}) {
  return (
    <label className="checkbox-field">

      <input
        type="checkbox"
        name={name}
        checked={checked}
        onChange={onChange}
      />

      <span>
        {label}
      </span>

    </label>
  );
}


/* ============================================================
   DETAIL
   ============================================================ */

function Detail({
  label,
  value,
}) {
  return (
    <div className="detail-item">

      <span>
        {label}
      </span>

      <strong>
        {
          value === null ||
            value === undefined ||
            value === ""
            ? "—"
            : String(value)
        }
      </strong>

    </div>
  );
}


export default PredictionForm;
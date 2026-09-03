import { useState } from "react";
import axios from "axios";

const API_URL = "http://127.0.0.1:8000";

const initialForm = {
  age: 50,
  gender: "F",
  state: "Karnataka",
  bpl_card: false,
  insurance_type: "Government",
  comorbidity_count: 1,
  prev_admissions: 0,
  admit_type: "Emergency",
  ward_type: "General",
  discharge_type: "Home",
  los_days: 5,
  num_procedures: 1,
  charlson_index: 1,
  hba1c: 5.8,
  creatinine: 0.9,
  haemoglobin: 12.0,
  systolic_bp: 125,
};

function AddAdmissionForm({ onCreated, onCancel }) {
  const [form, setForm] = useState(initialForm);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const handleChange = (event) => {
    const { name, value, type, checked } = event.target;
    setForm((current) => ({
      ...current,
      [name]:
        type === "checkbox"
          ? checked
          : type === "number"
            ? Number(value)
            : value,
    }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setSaving(true);
    setError("");

    try {
      const payload = {
        patient: {
          age: form.age,
          gender: form.gender,
          state: form.state,
          bpl_card: form.bpl_card,
          insurance_type: form.insurance_type || null,
          comorbidity_count: form.comorbidity_count,
          prev_admissions: form.prev_admissions,
        },
        admission: {
          admit_type: form.admit_type,
          ward_type: form.ward_type,
          discharge_type: form.discharge_type,
          los_days: form.los_days,
          num_procedures: form.num_procedures,
          charlson_index: form.charlson_index,
          hba1c: form.hba1c,
          creatinine: form.creatinine,
          haemoglobin: form.haemoglobin,
          systolic_bp: form.systolic_bp,
        },
      };

      const response = await axios.post(
        `${API_URL}/api/admissions/with-patient`,
        payload
      );

      setForm(initialForm);
      if (onCreated) {
        await onCreated(response.data);
      }
    } catch (err) {
      console.error("Create admission error:", err);
      const detail = err.response?.data?.detail;
      if (Array.isArray(detail)) {
        setError(
          detail
            .map((item) => `${item.loc?.at(-1) ?? "field"}: ${item.msg}`)
            .join(" | ")
        );
      } else {
        setError(String(detail || "Unable to create the admission."));
      }
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="add-admission-overlay" role="dialog" aria-modal="true">
      <div className="add-admission-modal">
        <div className="add-admission-header">
          <div>
            <p className="section-eyebrow">ADMISSION MANAGEMENT</p>
            <h2>Add New Admission</h2>
            <p className="card-description">
              A new patient and admission will be saved to the database.
            </p>
          </div>
          <button type="button" className="modal-close-button" onClick={onCancel}>
            ×
          </button>
        </div>

        <form className="add-admission-form" onSubmit={handleSubmit}>
          <div className="add-admission-section">
            <div className="add-admission-section-heading">
              <h3>Patient Information</h3>
              <p>Basic patient details.</p>
            </div>
            <div className="add-admission-grid">
              <Field label="Age" name="age" type="number" value={form.age} onChange={handleChange} />
              <Field label="Gender" name="gender" type="select" value={form.gender} onChange={handleChange} options={[["F", "Female"], ["M", "Male"]]} />
              <Field label="State" name="state" value={form.state} onChange={handleChange} />
              <Field label="Insurance Type" name="insurance_type" value={form.insurance_type} onChange={handleChange} />
              <Field label="Comorbidity Count" name="comorbidity_count" type="number" value={form.comorbidity_count} onChange={handleChange} />
              <Field label="Previous Admissions" name="prev_admissions" type="number" value={form.prev_admissions} onChange={handleChange} />
              <label className="add-admission-checkbox">
                <input type="checkbox" name="bpl_card" checked={form.bpl_card} onChange={handleChange} />
                <span>BPL Card</span>
              </label>
            </div>
          </div>

          <div className="add-admission-section">
            <div className="add-admission-section-heading">
              <h3>Admission & Clinical Information</h3>
              <p>Values used by the existing prediction workflow.</p>
            </div>
            <div className="add-admission-grid">
              <Field label="Admission Type" name="admit_type" type="select" value={form.admit_type} onChange={handleChange} options={[["Emergency", "Emergency"], ["Urgent", "Urgent"], ["Elective", "Elective"]]} />
              <Field label="Ward" name="ward_type" type="select" value={form.ward_type} onChange={handleChange} options={[["General", "General"], ["ICU", "ICU"], ["Semi-Private", "Semi-Private"], ["Private", "Private"]]} />
              <Field label="Discharge Type" name="discharge_type" type="select" value={form.discharge_type} onChange={handleChange} options={[["Home", "Home"], ["Transfer", "Transfer"], ["Follow-up", "Follow-up"]]} />
              <Field label="Length of Stay" name="los_days" type="number" value={form.los_days} onChange={handleChange} />
              <Field label="Procedures" name="num_procedures" type="number" value={form.num_procedures} onChange={handleChange} />
              <Field label="Charlson Index" name="charlson_index" type="number" value={form.charlson_index} onChange={handleChange} />
              <Field label="HbA1c" name="hba1c" type="number" step="0.1" value={form.hba1c} onChange={handleChange} />
              <Field label="Creatinine" name="creatinine" type="number" step="0.01" value={form.creatinine} onChange={handleChange} />
              <Field label="Haemoglobin" name="haemoglobin" type="number" step="0.1" value={form.haemoglobin} onChange={handleChange} />
              <Field label="Systolic BP" name="systolic_bp" type="number" value={form.systolic_bp} onChange={handleChange} />
            </div>
          </div>

          {error && (
            <div className="add-admission-error">
              <strong>Unable to save admission</strong>
              <p>{error}</p>
            </div>
          )}

          <div className="add-admission-actions">
            <button type="button" className="secondary-button" onClick={onCancel} disabled={saving}>
              Cancel
            </button>
            <button type="submit" className="primary-button" disabled={saving}>
              {saving ? "Saving..." : "Add Admission"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function Field({ label, name, type = "text", value, onChange, options = [], step }) {
  return (
    <label className="add-admission-field">
      <span>{label}</span>
      {type === "select" ? (
        <select name={name} value={value} onChange={onChange} required>
          {options.map(([optionValue, optionLabel]) => (
            <option key={optionValue} value={optionValue}>{optionLabel}</option>
          ))}
        </select>
      ) : (
        <input
          type={type}
          name={name}
          value={value ?? ""}
          onChange={onChange}
          min={type === "number" ? 0 : undefined}
          step={step}
          required
        />
      )}
    </label>
  );
}

export default AddAdmissionForm;
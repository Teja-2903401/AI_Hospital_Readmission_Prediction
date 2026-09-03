
import { useEffect, useState } from "react";
import axios from "axios";

const API_URL =
  import.meta.env.VITE_API_URL || "http://127.0.0.1:8000";

const emptyAdmission = {
  admission_id: "",
  admit_type: "Emergency",
  ward_type: "General",

  age: 50,
  gender: "F",
  state: "Telangana",
  bpl_card: false,
  insurance_type: "ESI",
  comorbidity_count: 0,
  prev_admissions: 0,

  los_days: 1,
  num_procedures: 0,
  charlson_index: 0,
  hba1c: 5.6,
  creatinine: 0.8,
  haemoglobin: 12,
  systolic_bp: 120,

  num_diagnoses: 1,
  num_diagnosis_categories: 1,
  primary_icd10: "G40",
  primary_diag_category: "Neurological",

  tier: "tier2",
  beds: 400,
  teaching: true,

  cost_category: "Room",
  total_cost_inr: 0,
  govt_subsidy_inr: 0,
  out_of_pocket_inr: 0,
};

function AdmissionManager({
  onAdmissionSelected,
}) {
  const [admissions, setAdmissions] = useState([]);
  const [form, setForm] = useState(emptyAdmission);

  const [loading, setLoading] = useState(false);
  const [creating, setCreating] = useState(false);

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const loadAdmissions = async () => {
    try {
      setLoading(true);
      setError("");

      const response = await axios.get(
        `${API_URL}/api/admissions/`
      );

      const data = response.data;

      let rows = [];

      if (Array.isArray(data)) {
        rows = data;
      } else if (Array.isArray(data?.admissions)) {
        rows = data.admissions;
      } else if (Array.isArray(data?.items)) {
        rows = data.items;
      }

      setAdmissions(rows);
    } catch (err) {
      console.error("Admission loading error:", err);

      setError(
        err.response?.data?.detail ||
          "Unable to load admissions from the backend."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAdmissions();
  }, []);

  const handleChange = (event) => {
    const {
      name,
      value,
      type,
      checked,
    } = event.target;

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

    try {
      setCreating(true);
      setError("");
      setSuccess("");

      const payload = {
        ...form,
        admission_id: String(
          form.admission_id
        ).trim(),
      };

      const response = await axios.post(
        `${API_URL}/api/admissions/`,
        payload
      );

      const createdAdmission =
        response.data;

      setSuccess(
        `Admission ${
          createdAdmission?.admission_id ??
          payload.admission_id
        } created successfully.`
      );

      await loadAdmissions();

      if (onAdmissionSelected) {
        onAdmissionSelected(
          createdAdmission
        );
      }

      setForm(emptyAdmission);
    } catch (err) {
      console.error(
        "Admission creation error:",
        err
      );

      const detail =
        err.response?.data?.detail;

      if (Array.isArray(detail)) {
        setError(
          detail
            .map((item) => {
              const location =
                Array.isArray(item.loc)
                  ? item.loc
                  : [];

              const field =
                location.length > 0
                  ? location[
                      location.length - 1
                    ]
                  : "field";

              return `${field}: ${item.msg}`;
            })
            .join(" | ")
        );
      } else {
        setError(
          String(
            detail ||
              "Unable to create the admission."
          )
        );
      }
    } finally {
      setCreating(false);
    }
  };

  const selectAdmission = async (
    admission
  ) => {
    setError("");
    setSuccess("");

    try {
      let selected = admission;

      const id =
        admission.admission_id;

      if (id !== undefined && id !== null) {
        try {
          const response =
            await axios.get(
              `${API_URL}/api/admissions/${encodeURIComponent(
                id
              )}`
            );

          if (response.data) {
            selected = response.data;
          }
        } catch {
          // Use the already-loaded row
          // if a detail endpoint is unavailable.
        }
      }

      if (onAdmissionSelected) {
        onAdmissionSelected(
          selected
        );
      }

      setSuccess(
        `Admission ${id} selected.`
      );
    } catch (err) {
      console.error(
        "Admission selection error:",
        err
      );

      setError(
        "Unable to select this admission."
      );
    }
  };

  return (
    <section className="prediction-section admission-manager">
      {/* ====================================================
          HEADER
          ==================================================== */}

      <div className="form-header">
        <p className="eyebrow">
          ADMISSION MANAGEMENT
        </p>

        <h2>
          Hospital Admissions
        </h2>

        <p>
          Select an existing admission or create a
          new admission record before generating a
          readmission prediction.
        </p>
      </div>

      {/* ====================================================
          MESSAGES
          ==================================================== */}

      {success && (
        <div className="success-box">
          <strong>
            Success
          </strong>

          <p>
            {success}
          </p>
        </div>
      )}

      {error && (
        <div className="error-box">
          <strong>
            Admission Error
          </strong>

          <p>
            {error}
          </p>
        </div>
      )}

      {/* ====================================================
          CREATE ADMISSION
          ==================================================== */}

      <div className="form-group">
        <div className="section-heading-row">
          <div>
            <span className="section-number">
              01
            </span>

            <h3>
              Create Admission
            </h3>
          </div>
        </div>

        <form
          onSubmit={handleSubmit}
          className="prediction-form"
        >
          <div className="form-grid">
            <label>
              Admission ID
              <input
                type="text"
                name="admission_id"
                value={form.admission_id}
                onChange={handleChange}
                required
              />
            </label>

            <label>
              Admission Type
              <select
                name="admit_type"
                value={form.admit_type}
                onChange={handleChange}
              >
                <option value="Emergency">
                  Emergency
                </option>

                <option value="Elective">
                  Elective
                </option>

                <option value="Urgent">
                  Urgent
                </option>
              </select>
            </label>

            <label>
              Ward Type
              <input
                type="text"
                name="ward_type"
                value={form.ward_type}
                onChange={handleChange}
                required
              />
            </label>

            <label>
              Age
              <input
                type="number"
                name="age"
                min="0"
                max="120"
                value={form.age}
                onChange={handleChange}
                required
              />
            </label>

            <label>
              Gender
              <select
                name="gender"
                value={form.gender}
                onChange={handleChange}
              >
                <option value="F">
                  Female
                </option>

                <option value="M">
                  Male
                </option>
              </select>
            </label>

            <label>
              State
              <input
                type="text"
                name="state"
                value={form.state}
                onChange={handleChange}
                required
              />
            </label>

            <label>
              Insurance Type
              <input
                type="text"
                name="insurance_type"
                value={form.insurance_type}
                onChange={handleChange}
                required
              />
            </label>

            <label>
              Comorbidity Count
              <input
                type="number"
                name="comorbidity_count"
                min="0"
                value={
                  form.comorbidity_count
                }
                onChange={handleChange}
                required
              />
            </label>

            <label>
              Previous Admissions
              <input
                type="number"
                name="prev_admissions"
                min="0"
                value={form.prev_admissions}
                onChange={handleChange}
                required
              />
            </label>

            <label>
              Length of Stay
              <input
                type="number"
                name="los_days"
                min="0"
                value={form.los_days}
                onChange={handleChange}
                required
              />
            </label>

            <label>
              Procedures
              <input
                type="number"
                name="num_procedures"
                min="0"
                value={
                  form.num_procedures
                }
                onChange={handleChange}
                required
              />
            </label>

            <label>
              Charlson Index
              <input
                type="number"
                name="charlson_index"
                min="0"
                value={
                  form.charlson_index
                }
                onChange={handleChange}
                required
              />
            </label>

            <label>
              HbA1c
              <input
                type="number"
                name="hba1c"
                min="0"
                step="0.1"
                value={form.hba1c}
                onChange={handleChange}
                required
              />
            </label>

            <label>
              Creatinine
              <input
                type="number"
                name="creatinine"
                min="0"
                step="0.01"
                value={form.creatinine}
                onChange={handleChange}
                required
              />
            </label>

            <label>
              Haemoglobin
              <input
                type="number"
                name="haemoglobin"
                min="0"
                step="0.1"
                value={form.haemoglobin}
                onChange={handleChange}
                required
              />
            </label>

            <label>
              Systolic BP
              <input
                type="number"
                name="systolic_bp"
                min="0"
                value={form.systolic_bp}
                onChange={handleChange}
                required
              />
            </label>

            <label>
              Primary ICD-10
              <input
                type="text"
                name="primary_icd10"
                value={
                  form.primary_icd10
                }
                onChange={handleChange}
                required
              />
            </label>

            <label>
              Diagnosis Category
              <input
                type="text"
                name="primary_diag_category"
                value={
                  form.primary_diag_category
                }
                onChange={handleChange}
                required
              />
            </label>

            <label>
              Hospital Tier
              <input
                type="text"
                name="tier"
                value={form.tier}
                onChange={handleChange}
                required
              />
            </label>

            <label>
              Hospital Beds
              <input
                type="number"
                name="beds"
                min="0"
                value={form.beds}
                onChange={handleChange}
                required
              />
            </label>

            <label>
              Cost Category
              <input
                type="text"
                name="cost_category"
                value={
                  form.cost_category
                }
                onChange={handleChange}
                required
              />
            </label>

            <label>
              Total Cost (INR)
              <input
                type="number"
                name="total_cost_inr"
                min="0"
                value={
                  form.total_cost_inr
                }
                onChange={handleChange}
                required
              />
            </label>

            <label>
              Government Subsidy (INR)
              <input
                type="number"
                name="govt_subsidy_inr"
                min="0"
                value={
                  form.govt_subsidy_inr
                }
                onChange={handleChange}
                required
              />
            </label>

            <label>
              Out-of-Pocket (INR)
              <input
                type="number"
                name="out_of_pocket_inr"
                min="0"
                value={
                  form.out_of_pocket_inr
                }
                onChange={handleChange}
                required
              />
            </label>
          </div>

          <div className="checkbox-row">
            <label className="checkbox-label">
              <input
                type="checkbox"
                name="bpl_card"
                checked={form.bpl_card}
                onChange={handleChange}
              />

              <span>
                BPL Card
              </span>
            </label>

            <label className="checkbox-label">
              <input
                type="checkbox"
                name="teaching"
                checked={form.teaching}
                onChange={handleChange}
              />

              <span>
                Teaching Hospital
              </span>
            </label>
          </div>

          <button
            type="submit"
            className="primary-button"
            disabled={creating}
          >
            {creating
              ? "Creating Admission..."
              : "Create Admission"}
          </button>
        </form>
      </div>

      {/* ====================================================
          EXISTING ADMISSIONS
          ==================================================== */}

      <div className="form-group">
        <div className="section-heading-row">
          <div>
            <span className="section-number">
              02
            </span>

            <h3>
              Existing Admissions
            </h3>
          </div>

          <button
            type="button"
            className="secondary-button"
            onClick={loadAdmissions}
            disabled={loading}
          >
            {loading
              ? "Loading..."
              : "Refresh"}
          </button>
        </div>

        {loading && (
          <div className="loading-box">
            Loading admissions...
          </div>
        )}

        {!loading &&
          admissions.length === 0 && (
            <div className="empty-state">
              <strong>
                No admissions found
              </strong>

              <p>
                Create an admission to begin
                prediction analysis.
              </p>
            </div>
          )}

        {!loading &&
          admissions.length > 0 && (
            <div className="table-wrapper">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>
                      Admission
                    </th>

                    <th>
                      Age
                    </th>

                    <th>
                      Gender
                    </th>

                    <th>
                      Admission Type
                    </th>

                    <th>
                      Ward
                    </th>

                    <th>
                      State
                    </th>

                    <th>
                      Action
                    </th>
                  </tr>
                </thead>

                <tbody>
                  {admissions.map(
                    (admission, index) => (
                      <tr
                        key={
                          admission.admission_id ??
                          index
                        }
                      >
                        <td>
                          <strong>
                            {
                              admission.admission_id ??
                              "-"
                            }
                          </strong>
                        </td>

                        <td>
                          {admission.age ??
                            admission.patient?.age ??
                            "-"}
                        </td>

                        <td>
                          {admission.gender ??
                            admission.patient?.gender ??
                            "-"}
                        </td>

                        <td>
                          {
                            admission.admit_type ??
                            "-"
                          }
                        </td>

                        <td>
                          {
                            admission.ward_type ??
                            "-"
                          }
                        </td>

                        <td>
                          {admission.state ??
                            admission.patient?.state ??
                            "-"}
                        </td>

                        <td>
                          <button
                            type="button"
                            className="table-action-button"
                            onClick={() =>
                              selectAdmission(
                                admission
                              )
                            }
                          >
                            Use Admission
                          </button>
                        </td>
                      </tr>
                    )
                  )}
                </tbody>
              </table>
            </div>
          )}
      </div>
    </section>
  );
}

export default AdmissionManager;


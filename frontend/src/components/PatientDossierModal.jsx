import { useEffect, useState } from "react";
import axios from "axios";
import {
  X,
  Download,
  Printer,
  FileText,
  Calendar,
  Activity,
  Heart,
  TrendingUp,
  ShieldAlert,
  ShieldCheck,
  CheckCircle,
  FileSpreadsheet,
  Building,
  Clock,
  FlaskConical,
  Stethoscope,
  CreditCard,
  IndianRupee,
  Receipt,
} from "lucide-react";

const API_URL = "http://127.0.0.1:8000";

const formatCurrency = (val) => {
  if (val === null || val === undefined || val === "") return "₹0";
  const num = Number(val);
  if (Number.isNaN(num)) return `₹${val}`;
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(num);
};

function PatientDossierModal({ patientId, onClose }) {
  const [dossier, setDossier] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const loadDossier = async () => {
    try {
      setLoading(true);
      setError("");
      const response = await axios.get(
        `${API_URL}/api/patients/${encodeURIComponent(patientId)}/full-history`
      );
      setDossier(response.data);
    } catch (err) {
      console.error("Load dossier error:", err);
      setError(
        err.response?.data?.detail || "Failed to load comprehensive patient history."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (patientId) {
      loadDossier();
    }
  }, [patientId]);

  // Export full patient history as CSV
  const handleDownloadCSV = () => {
    if (!dossier || !dossier.patient) return;
    const p = dossier.patient;

    let csvContent = "data:text/csv;charset=utf-8,";

    // Patient Header Section
    csvContent += "PATIENT DEMOGRAPHICS & CLINICAL DOSSIER\n";
    csvContent += `Patient ID,${p.patient_id}\n`;
    csvContent += `Age,${p.age}\n`;
    csvContent += `Gender,${p.gender}\n`;
    csvContent += `State,${p.state}\n`;
    csvContent += `BPL Card,${p.bpl_card ? "Yes" : "No"}\n`;
    csvContent += `Insurance Type,${p.insurance_type || "Unspecified"}\n`;
    csvContent += `Comorbidity Count,${p.comorbidity_count}\n`;
    csvContent += `Previous Admissions,${p.prev_admissions}\n`;
    csvContent += `Total Incurred Cost (INR),${dossier.total_cost_inr || 0}\n`;
    csvContent += `Govt / Insurance Subsidy (INR),${dossier.total_subsidy_inr || 0}\n`;
    csvContent += `Patient Out-of-Pocket (INR),${dossier.total_out_of_pocket_inr || 0}\n`;
    csvContent += `Latest Risk Assessment,${dossier.latest_risk}\n\n`;

    // Admission History Section
    csvContent += "ADMISSION & CLINICAL BIOMARKERS & COST HISTORY\n";
    csvContent += "Admission ID,Admit Type,Ward Type,LOS Days,HbA1c (%),Creatinine (mg/dL),Systolic BP (mmHg),Haemoglobin (g/dL),Procedures,Total Cost (INR),Govt Subsidy (INR),Out-of-Pocket (INR),Cost Category,Discharge Type,Admission Date\n";

    (dossier.admissions || []).forEach((adm) => {
      csvContent += `${adm.admission_id},${adm.admit_type},${adm.ward_type},${adm.los_days},${adm.hba1c},${adm.creatinine},${adm.systolic_bp},${adm.haemoglobin},${adm.num_procedures},${adm.total_cost_inr || 0},${adm.govt_subsidy_inr || 0},${adm.out_of_pocket_inr || 0},"${adm.cost_category || "Room"}",${adm.discharge_type},"${new Date(adm.created_at).toLocaleDateString()}"\n`;
    });

    csvContent += "\nAI READMISSION PREDICTION HISTORY\n";
    csvContent += "Prediction ID,Admission ID,Risk Probability (%),Risk Level,Model Name,Timestamp\n";

    (dossier.predictions || []).forEach((pr) => {
      csvContent += `${pr.id},${pr.admission_id || ""},${pr.probability_percent}%,${pr.risk_level},"${pr.model_name || "Logistic Regression"}","${new Date(pr.created_at).toLocaleString()}"\n`;
    });

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `patient_${p.patient_id}_full_clinical_history.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Export JSON dossier
  const handleDownloadJSON = () => {
    if (!dossier) return;
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(dossier, null, 2));
    const downloadAnchor = document.createElement("a");
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", `patient_${dossier.patient?.patient_id}_dossier.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  // Print clinical dossier
  const handlePrint = () => {
    window.print();
  };

  const getRiskColor = (risk) => {
    const r = String(risk).toLowerCase();
    if (r.includes("high")) return "risk-high";
    if (r.includes("medium")) return "risk-medium";
    return "risk-low";
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div
        className="modal-card dossier-modal printable-dossier"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Dossier Header */}
        <div className="dossier-topbar no-print">
          <div className="dossier-title-group">
            <FileText className="dossier-header-icon" size={24} />
            <div>
              <h3>Comprehensive Patient Dossier & Clinical History</h3>
              <p>Complete clinical trajectory, admissions telemetry, cost billing, and AI predictions</p>
            </div>
          </div>

          <div className="dossier-actions-group">
            <button
              className="dossier-btn primary"
              onClick={handleDownloadCSV}
              title="Download full CSV history report"
            >
              <FileSpreadsheet size={16} />
              <span>Download History (CSV)</span>
            </button>

            <button
              className="dossier-btn secondary"
              onClick={handleDownloadJSON}
              title="Download complete JSON dossier"
            >
              <Download size={16} />
              <span>JSON</span>
            </button>

            <button
              className="dossier-btn secondary"
              onClick={handlePrint}
              title="Print clinical summary"
            >
              <Printer size={16} />
              <span>Print / PDF</span>
            </button>

            <button className="modal-close-btn" onClick={onClose}>
              <X size={20} />
            </button>
          </div>
        </div>

        {loading ? (
          <div className="dossier-loading">
            <Activity className="spin" size={32} />
            <p>Compiling full patient clinical record, billing telemetry, and admissions trajectory...</p>
          </div>
        ) : error ? (
          <div className="dossier-error">
            <ShieldAlert size={28} />
            <p>{error}</p>
          </div>
        ) : dossier && dossier.patient ? (
          <div className="dossier-content">
            {/* Printable Hospital Banner */}
            <div className="dossier-print-header">
              <div className="hospital-print-logo">
                <h2>AI Hospital Readmission Prediction & Research Center</h2>
                <p>Department of Clinical Informatics & Healthcare Predictive Medicine</p>
              </div>
              <div className="dossier-print-meta">
                <span>Dossier ID: DOS-{dossier.patient.patient_id}</span>
                <span>Date: {new Date().toLocaleDateString()}</span>
              </div>
            </div>

            {/* Patient Demographics Hero Card */}
            <div className="patient-hero-banner">
              <div className="patient-avatar-large">
                {String(dossier.patient.gender).toUpperCase() === "F" ? "♀" : "♂"}
              </div>

              <div className="patient-hero-info">
                <div className="patient-id-tag">Patient Record: #{dossier.patient.patient_id}</div>
                <h2>
                  Patient #{dossier.patient.patient_id}{" "}
                  <span className="patient-sub-badge">
                    {dossier.patient.age} yrs • {dossier.patient.gender === "F" ? "Female" : "Male"}
                  </span>
                </h2>

                <div className="patient-demographics-grid">
                  <div className="demo-chip">
                    <span className="demo-label">State of Residence</span>
                    <span className="demo-val">{dossier.patient.state}</span>
                  </div>
                  <div className="demo-chip">
                    <span className="demo-label">Insurance Scheme</span>
                    <span className="demo-val">{dossier.patient.insurance_type || "Government / Standard"}</span>
                  </div>
                  <div className="demo-chip">
                    <span className="demo-label">BPL Card Status</span>
                    <span className="demo-val">{dossier.patient.bpl_card ? "Eligible (BPL Cardholder)" : "Standard Non-BPL"}</span>
                  </div>
                  <div className="demo-chip">
                    <span className="demo-label">Comorbidity Index</span>
                    <span className="demo-val">{dossier.patient.comorbidity_count} Condition(s)</span>
                  </div>
                </div>
              </div>

              <div className="patient-hero-risk">
                <span className="risk-title-sm">Current Readmission Risk</span>
                <div className={`risk-pill-large ${getRiskColor(dossier.latest_risk)}`}>
                  {dossier.latest_risk}
                </div>
                {dossier.latest_probability && (
                  <span className="risk-prob-pct">
                    {dossier.latest_probability}% Probability
                  </span>
                )}
              </div>
            </div>

            {/* Lifetime Summary Stats */}
            <div className="lifetime-stats-grid">
              <div className="stat-card">
                <div className="stat-icon-wrapper blue">
                  <Building size={18} />
                </div>
                <div className="stat-info">
                  <span className="stat-num">{dossier.admissions_count}</span>
                  <span className="stat-label">Total Admissions</span>
                </div>
              </div>

              <div className="stat-card">
                <div className="stat-icon-wrapper amber">
                  <Clock size={18} />
                </div>
                <div className="stat-info">
                  <span className="stat-num">
                    {dossier.admissions.length > 0
                      ? Math.round(
                          dossier.admissions.reduce((a, b) => a + (b.los_days || 0), 0) /
                            dossier.admissions.length
                        )
                      : 0}{" "}
                    days
                  </span>
                  <span className="stat-label">Avg Length of Stay</span>
                </div>
              </div>

              <div className="stat-card">
                <div className="stat-icon-wrapper purple">
                  <FlaskConical size={18} />
                </div>
                <div className="stat-info">
                  <span className="stat-num">
                    {dossier.admissions.reduce((a, b) => a + (b.num_procedures || 0), 0)}
                  </span>
                  <span className="stat-label">Procedures Performed</span>
                </div>
              </div>

              <div className="stat-card">
                <div className="stat-icon-wrapper green">
                  <Activity size={18} />
                </div>
                <div className="stat-info">
                  <span className="stat-num">{dossier.predictions_count}</span>
                  <span className="stat-label">AI Risk Assessments</span>
                </div>
              </div>
            </div>

            {/* Lifetime Financial & Cost Information Summary */}
            <div className="dossier-section">
              <div className="section-title-row">
                <h4>
                  <Receipt size={18} /> Financial Billing & Incurred Healthcare Cost Summary
                </h4>
              </div>

              <div className="lifetime-stats-grid" style={{ gridTemplateColumns: "repeat(3, 1fr)" }}>
                <div className="stat-card" style={{ background: "#eff6ff", borderColor: "#bfdbfe" }}>
                  <div className="stat-icon-wrapper blue">
                    <Receipt size={18} />
                  </div>
                  <div className="stat-info">
                    <span className="stat-num" style={{ color: "#1e3a8a" }}>
                      {formatCurrency(dossier.total_cost_inr)}
                    </span>
                    <span className="stat-label">Total Incurred Hospital Cost</span>
                  </div>
                </div>

                <div className="stat-card" style={{ background: "#ecfdf5", borderColor: "#a7f3d0" }}>
                  <div className="stat-icon-wrapper green">
                    <ShieldCheck size={18} />
                  </div>
                  <div className="stat-info">
                    <span className="stat-num" style={{ color: "#065f46" }}>
                      {formatCurrency(dossier.total_subsidy_inr)}
                    </span>
                    <span className="stat-label">Govt / Insurance Subsidy Cover</span>
                  </div>
                </div>

                <div className="stat-card" style={{ background: "#fff7ed", borderColor: "#fed7aa" }}>
                  <div className="stat-icon-wrapper amber">
                    <CreditCard size={18} />
                  </div>
                  <div className="stat-info">
                    <span className="stat-num" style={{ color: "#9a3412" }}>
                      {formatCurrency(dossier.total_out_of_pocket_inr)}
                    </span>
                    <span className="stat-label">Patient Out-of-Pocket Share</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Admission Records Timeline with Cost Breakdown */}
            <div className="dossier-section">
              <div className="section-title-row">
                <h4>
                  <Calendar size={18} /> Inpatient Admissions Trajectory & Billing History ({dossier.admissions_count})
                </h4>
              </div>

              {dossier.admissions.length === 0 ? (
                <div className="dossier-empty">No admission records on file for this patient.</div>
              ) : (
                <div className="admissions-timeline-list">
                  {dossier.admissions.map((adm) => (
                    <div key={adm.id} className="timeline-admission-card">
                      <div className="adm-header">
                        <div className="adm-id-badge">
                          <strong>Admission #{adm.admission_id}</strong>
                          <span className="adm-date">
                            {new Date(adm.created_at).toLocaleDateString("en-US", {
                              year: "numeric",
                              month: "short",
                              day: "numeric",
                            })}
                          </span>
                        </div>
                        <div className="adm-type-pill">
                          <span>{adm.admit_type}</span> • <span>{adm.ward_type} Ward</span> • <span>{adm.department_name || "General Medicine"}</span>
                        </div>
                      </div>

                      {/* Clinical Biomarkers Grid */}
                      <div className="biomarkers-grid">
                        <div className="biomarker-box">
                          <span className="bm-name">HbA1c</span>
                          <span className={`bm-val ${adm.hba1c >= 7.0 ? "alert" : "normal"}`}>
                            {adm.hba1c}%
                          </span>
                          <small>{adm.hba1c >= 7.0 ? "Elevated Glycemia" : "Normal"}</small>
                        </div>

                        <div className="biomarker-box">
                          <span className="bm-name">Serum Creatinine</span>
                          <span className={`bm-val ${adm.creatinine >= 1.5 ? "alert" : "normal"}`}>
                            {adm.creatinine} mg/dL
                          </span>
                          <small>{adm.creatinine >= 1.5 ? "Renal Stress" : "Normal"}</small>
                        </div>

                        <div className="biomarker-box">
                          <span className="bm-name">Systolic BP</span>
                          <span className={`bm-val ${adm.systolic_bp >= 140 ? "alert" : "normal"}`}>
                            {adm.systolic_bp} mmHg
                          </span>
                          <small>{adm.systolic_bp >= 140 ? "Stage 2 HTN" : "Controlled"}</small>
                        </div>

                        <div className="biomarker-box">
                          <span className="bm-name">Haemoglobin</span>
                          <span className={`bm-val ${adm.haemoglobin < 11.0 ? "alert" : "normal"}`}>
                            {adm.haemoglobin} g/dL
                          </span>
                          <small>{adm.haemoglobin < 11.0 ? "Anemic" : "Normal"}</small>
                        </div>

                        <div className="biomarker-box">
                          <span className="bm-name">Length of Stay</span>
                          <span className="bm-val">{adm.los_days} days</span>
                          <small>Inpatient Duration</small>
                        </div>

                        <div className="biomarker-box">
                          <span className="bm-name">Procedures</span>
                          <span className="bm-val">{adm.num_procedures}</span>
                          <small>Interventions</small>
                        </div>
                      </div>

                      {/* Financial Cost Strip for Admission */}
                      <div className="adm-cost-strip" style={{ display: "flex", gap: "16px", padding: "10px 14px", background: "#f8fafc", borderRadius: "10px", border: "1px solid #e2e8f0", marginBottom: "10px", flexWrap: "wrap" }}>
                        <div style={{ fontSize: "12px" }}>
                          <span style={{ color: "#64748b" }}>Total Cost: </span>
                          <strong style={{ color: "#0f172a" }}>{formatCurrency(adm.total_cost_inr)}</strong>
                        </div>
                        <div style={{ fontSize: "12px" }}>
                          <span style={{ color: "#64748b" }}>Govt Subsidy: </span>
                          <strong style={{ color: "#059669" }}>{formatCurrency(adm.govt_subsidy_inr)}</strong>
                        </div>
                        <div style={{ fontSize: "12px" }}>
                          <span style={{ color: "#64748b" }}>Patient Out-of-Pocket: </span>
                          <strong style={{ color: "#d97706" }}>{formatCurrency(adm.out_of_pocket_inr)}</strong>
                        </div>
                        <div style={{ fontSize: "12px", marginLeft: "auto" }}>
                          <span style={{ color: "#64748b" }}>Cost Category: </span>
                          <span className="role-preset-badge">{adm.cost_category || "Room & Care"}</span>
                        </div>
                      </div>

                      {/* Admission Predictions Sub-list */}
                      {adm.predictions && adm.predictions.length > 0 && (
                        <div className="adm-predictions-sub">
                          <span className="sub-title">AI Predictions Recorded:</span>
                          <div className="adm-preds-pills">
                            {adm.predictions.map((p) => (
                              <span key={p.id} className={`adm-pred-chip ${getRiskColor(p.risk_level)}`}>
                                {p.risk_level} ({p.probability_percent}%)
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* AI Readmission Risk Assessment History */}
            <div className="dossier-section">
              <div className="section-title-row">
                <h4>
                  <TrendingUp size={18} /> AI 30-Day Readmission Risk Predictions ({dossier.predictions_count})
                </h4>
              </div>

              {dossier.predictions.length === 0 ? (
                <div className="dossier-empty">No prediction assessments run yet for this patient.</div>
              ) : (
                <div className="table-wrapper">
                  <table className="dossier-table">
                    <thead>
                      <tr>
                        <th>ID</th>
                        <th>Admission</th>
                        <th>Predicted Probability</th>
                        <th>Risk Stratification</th>
                        <th>Model Name</th>
                        <th>Assessment Date</th>
                      </tr>
                    </thead>
                    <tbody>
                      {dossier.predictions.map((pr) => (
                        <tr key={pr.id}>
                          <td><strong>#{pr.id}</strong></td>
                          <td><strong>{pr.admission_id || "—"}</strong></td>
                          <td>
                            <strong>{pr.probability_percent}%</strong>
                          </td>
                          <td>
                            <span className={`risk-badge-pill ${getRiskColor(pr.risk_level)}`}>
                              {pr.risk_level}
                            </span>
                          </td>
                          <td>{pr.model_name || "Logistic Regression"}</td>
                          <td>{new Date(pr.created_at).toLocaleString()}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            {/* Footer Disclaimer */}
            <div className="dossier-footer-note">
              <small>
                This clinical intelligence report is generated by AI Hospital Readmission Prediction for medical decision support and hospital readmission risk management.
              </small>
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}

export default PatientDossierModal;

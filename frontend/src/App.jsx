import { useEffect, useMemo, useState } from "react";
import axios from "axios";
import {
  ShieldCheck,
  Stethoscope,
  Users,
  Building2,
  Activity,
  HeartPulse,
  LogOut,
  Download,
  Plus,
  Search,
  RefreshCw,
  FileText,
  FileSpreadsheet,
  CheckCircle2,
  AlertTriangle,
  AlertCircle,
  TrendingUp,
  Clock,
  FlaskConical,
  Bed,
  Phone,
  Trash2,
  Edit2,
  Calendar,
  X,
} from "lucide-react";

import LoginPage from "./components/LoginPage";
import PredictionForm from "./components/PredictionForm";
import PredictionHistory from "./components/PredictionHistory";
import UserManagement from "./components/UserManagement";
import DepartmentManagement from "./components/DepartmentManagement";
import PatientDossierModal from "./components/PatientDossierModal";
import "./index.css";
import "./App.css";

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

function App() {
  // ============================================================
  // AUTHENTICATION & USER SESSION
  // ============================================================
  const [currentUser, setCurrentUser] = useState(() => {
    try {
      const stored = localStorage.getItem("hospital_user");
      return stored ? JSON.parse(stored) : null;
    } catch {
      return null;
    }
  });

  const [token, setToken] = useState(() => localStorage.getItem("hospital_token") || "");
  const [permissions, setPermissions] = useState(() => {
    try {
      const stored = localStorage.getItem("hospital_permissions");
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  });

  const handleLoginSuccess = (user, userToken, userPerms) => {
    setCurrentUser(user);
    setToken(userToken);
    setPermissions(userPerms);
    setActivePage("dashboard");
  };

  const handleLogout = () => {
    localStorage.removeItem("hospital_user");
    localStorage.removeItem("hospital_token");
    localStorage.removeItem("hospital_permissions");
    setCurrentUser(null);
    setToken("");
    setPermissions([]);
  };

  // Switch role quick demo shortcut
  const handleQuickRoleSwitch = async (roleUsername, rolePassword) => {
    try {
      setLoading(true);
      const response = await axios.post(`${API_URL}/api/auth/login`, {
        username_or_email: roleUsername,
        password: rolePassword,
      });
      if (response.data?.success) {
        handleLoginSuccess(
          response.data.user,
          response.data.token,
          response.data.permissions
        );
      }
    } catch (err) {
      console.error("Quick role switch error:", err);
    } finally {
      setLoading(false);
    }
  };

  // Role booleans
  const isAdmin = currentUser?.role === "admin";
  const isDoctor = currentUser?.role === "doctor" || currentUser?.role === "medical_staff";
  const isStaff = currentUser?.role === "hospital_staff";

  // ============================================================
  // APPLICATION STATE
  // ============================================================
  const [backendConnected, setBackendConnected] = useState(false);
  const [admissions, setAdmissions] = useState([]);
  const [patients, setPatients] = useState([]);
  const [selectedAdmission, setSelectedAdmission] = useState(null);
  const [predictions, setPredictions] = useState([]);

  const [loading, setLoading] = useState(true);
  const [admissionsLoading, setAdmissionsLoading] = useState(false);
  const [predictionLoading, setPredictionLoading] = useState(false);

  const [search, setSearch] = useState("");
  const [activePage, setActivePage] = useState("dashboard");
  const [riskFilter, setRiskFilter] = useState("all");
  const [error, setError] = useState("");

  // Patient Dossier Modal State
  const [dossierPatientId, setDossierPatientId] = useState(null);

  // Add Admission Modal State
  const [showAddAdmission, setShowAddAdmission] = useState(false);
  const [addAdmissionLoading, setAddAdmissionLoading] = useState(false);
  const [addAdmissionError, setAddAdmissionError] = useState("");
  const [addAdmissionForm, setAddAdmissionForm] = useState({
    age: 50,
    gender: "F",
    state: "Karnataka",
    bpl_card: false,
    insurance_type: "Government",
    comorbidity_count: 0,
    prev_admissions: 0,
    admit_type: "Emergency",
    ward_type: "General",
    discharge_type: "Home",
    los_days: 3,
    num_procedures: 1,
    charlson_index: 0,
    hba1c: 5.5,
    creatinine: 1.0,
    haemoglobin: 12.0,
    systolic_bp: 120,
  });

  // Add Patient Modal State
  const [showAddPatient, setShowAddPatient] = useState(false);
  const [addPatientLoading, setAddPatientLoading] = useState(false);
  const [addPatientError, setAddPatientError] = useState("");
  const [addPatientForm, setAddPatientForm] = useState({
    age: 45,
    gender: "M",
    state: "Maharashtra",
    bpl_card: false,
    insurance_type: "Private",
    comorbidity_count: 1,
    prev_admissions: 0,
  });

  // ============================================================
  // BACKEND HEALTH & DATA LOADERS
  // ============================================================
  const checkBackend = async () => {
    try {
      await axios.get(`${API_URL}/health`);
      setBackendConnected(true);
    } catch (err) {
      console.error("Backend health error:", err);
      setBackendConnected(false);
    }
  };

  const loadPatients = async () => {
    try {
      const response = await axios.get(`${API_URL}/api/patients/`);
      const rows = Array.isArray(response.data) ? response.data : [];
      setPatients(rows);
      return rows;
    } catch (err) {
      console.error("Patients load error:", err);
      setPatients([]);
      return [];
    }
  };

  const loadAdmissions = async () => {
    try {
      setAdmissionsLoading(true);
      setError("");
      const response = await axios.get(`${API_URL}/api/admissions/`);
      const data = response.data;
      let rows = Array.isArray(data) ? data : (data?.admissions || []);
      setAdmissions(rows);

      if (!selectedAdmission && rows.length > 0) {
        setSelectedAdmission(rows[0]);
      }
      return rows;
    } catch (err) {
      console.error("Admissions error:", err);
      setAdmissions([]);
      setError("Unable to load admissions. Make sure the FastAPI backend is running.");
      return [];
    } finally {
      setAdmissionsLoading(false);
    }
  };

  const loadPredictions = async () => {
    try {
      setPredictionLoading(true);
      const response = await axios.get(`${API_URL}/api/predictions/?limit=100`);
      const data = response.data;
      setPredictions(Array.isArray(data) ? data : (data?.predictions || []));
    } catch (err) {
      console.error("Prediction loading error:", err);
      setPredictions([]);
    } finally {
      setPredictionLoading(false);
    }
  };

  const initialise = async () => {
    setLoading(true);
    await checkBackend();
    await loadPatients();
    await loadAdmissions();
    await loadPredictions();
    setLoading(false);
  };

  useEffect(() => {
    if (currentUser) {
      initialise();
    }
  }, [currentUser]);

  const refreshDashboard = async () => {
    setLoading(true);
    await checkBackend();
    await loadPatients();
    await loadAdmissions();
    await loadPredictions();
    setLoading(false);
  };

  // ============================================================
  // ADD ADMISSION HANDLERS
  // ============================================================
  const handleAddAdmissionChange = (e) => {
    const { name, value, type, checked } = e.target;
    setAddAdmissionForm((curr) => ({
      ...curr,
      [name]: type === "checkbox" ? checked : type === "number" ? Number(value) : value,
    }));
  };

  const openAddAdmission = () => {
    setAddAdmissionError("");
    setAddAdmissionForm({
      age: 50,
      gender: "F",
      state: "Karnataka",
      bpl_card: false,
      insurance_type: "Government",
      comorbidity_count: 0,
      prev_admissions: 0,
      admit_type: "Emergency",
      ward_type: "General",
      discharge_type: "Home",
      los_days: 3,
      num_procedures: 1,
      charlson_index: 0,
      hba1c: 5.5,
      creatinine: 1.0,
      haemoglobin: 12.0,
      systolic_bp: 120,
    });
    setShowAddAdmission(true);
  };

  const closeAddAdmission = () => {
    if (!addAdmissionLoading) {
      setShowAddAdmission(false);
      setAddAdmissionError("");
    }
  };

  const handleAddAdmissionSubmit = async (e) => {
    e.preventDefault();
    setAddAdmissionLoading(true);
    setAddAdmissionError("");

    try {
      // 1. Create Patient
      const patientResponse = await axios.post(`${API_URL}/api/patients/`, {
        age: Number(addAdmissionForm.age),
        gender: String(addAdmissionForm.gender).trim(),
        state: String(addAdmissionForm.state).trim(),
        bpl_card: Boolean(addAdmissionForm.bpl_card),
        insurance_type: String(addAdmissionForm.insurance_type).trim(),
        comorbidity_count: Number(addAdmissionForm.comorbidity_count),
        prev_admissions: Number(addAdmissionForm.prev_admissions),
      });

      const patientData = patientResponse.data || {};
      const patientId = patientData.patient_id || patientData.id;

      if (!patientId) {
        throw new Error("Patient created, but no patient ID returned.");
      }

      // 2. Create Admission
      const admissionResponse = await axios.post(`${API_URL}/api/admissions/`, {
        patient_id: String(patientId),
        admit_type: String(addAdmissionForm.admit_type).trim(),
        ward_type: String(addAdmissionForm.ward_type).trim(),
        discharge_type: String(addAdmissionForm.discharge_type).trim(),
        los_days: Number(addAdmissionForm.los_days),
        num_procedures: Number(addAdmissionForm.num_procedures),
        charlson_index: Number(addAdmissionForm.charlson_index),
        hba1c: Number(addAdmissionForm.hba1c),
        creatinine: Number(addAdmissionForm.creatinine),
        haemoglobin: Number(addAdmissionForm.haemoglobin),
        systolic_bp: Number(addAdmissionForm.systolic_bp),
      });

      const newAdmission = admissionResponse.data;
      const updatedAdmissions = await loadAdmissions();
      await loadPatients();

      if (newAdmission?.admission_id) {
        const found = updatedAdmissions.find(
          (a) => String(a.admission_id) === String(newAdmission.admission_id)
        );
        if (found) setSelectedAdmission(found);
      }

      setShowAddAdmission(false);
      alert(`Admission '${newAdmission.admission_id || "new"}' created successfully!`);
    } catch (err) {
      console.error("Add admission error:", err);
      setAddAdmissionError(
        err.response?.data?.detail || err.message || "Failed to create admission."
      );
    } finally {
      setAddAdmissionLoading(false);
    }
  };

  // ============================================================
  // ADD PATIENT HANDLERS
  // ============================================================
  const handleAddPatientSubmit = async (e) => {
    e.preventDefault();
    setAddPatientLoading(true);
    setAddPatientError("");

    try {
      const res = await axios.post(`${API_URL}/api/patients/`, {
        age: Number(addPatientForm.age),
        gender: String(addPatientForm.gender).trim(),
        state: String(addPatientForm.state).trim(),
        bpl_card: Boolean(addPatientForm.bpl_card),
        insurance_type: String(addPatientForm.insurance_type).trim(),
        comorbidity_count: Number(addPatientForm.comorbidity_count),
        prev_admissions: Number(addPatientForm.prev_admissions),
      });

      await loadPatients();
      setShowAddPatient(false);
      alert(`Patient #${res.data?.patient_id} registered successfully!`);
    } catch (err) {
      console.error("Register patient error:", err);
      setAddPatientError(
        err.response?.data?.detail || "Failed to register patient."
      );
    } finally {
      setAddPatientLoading(false);
    }
  };

  // Delete Patient Handler (Admin only)
  const handleDeletePatient = async (pId) => {
    if (!isAdmin) return;
    if (!window.confirm(`Are you sure you want to delete patient #${pId} and all associated records?`)) {
      return;
    }
    try {
      setLoading(true);
      await axios.delete(`${API_URL}/api/patients/${pId}`);
      await loadPatients();
      await loadAdmissions();
      alert(`Patient #${pId} deleted successfully.`);
    } catch (err) {
      console.error("Delete patient error:", err);
      alert(err.response?.data?.detail || "Failed to delete patient.");
    } finally {
      setLoading(false);
    }
  };

  // Delete Admission Handler (Admin / Staff)
  const handleDeleteAdmission = async (admId) => {
    if (isDoctor) return;
    if (!window.confirm(`Are you sure you want to delete admission #${admId}?`)) {
      return;
    }
    try {
      setLoading(true);
      await axios.delete(`${API_URL}/api/admissions/${admId}`);
      await loadAdmissions();
      await loadPredictions();
      alert(`Admission #${admId} deleted successfully.`);
    } catch (err) {
      console.error("Delete admission error:", err);
      alert(err.response?.data?.detail || "Failed to delete admission.");
    } finally {
      setLoading(false);
    }
  };

  // Master CSV Download
  const handleDownloadMasterPatientsCSV = () => {
    window.open(`${API_URL}/api/patients/export/csv`, "_blank");
  };

  const handleSelectAdmission = (admission) => {
    setSelectedAdmission(admission);
    setActivePage("dashboard");
  };

  const handlePredictionCreated = async (prediction) => {
    await loadPredictions();
    await loadPatients();
    if (prediction?.admission_id) {
      const match = admissions.find(
        (item) => String(item.admission_id) === String(prediction.admission_id)
      );
      if (match) setSelectedAdmission(match);
    }
  };

  // ============================================================
  // DERIVED DATA & FILTERING
  // ============================================================
  const selectedPatient = selectedAdmission?.patient || {};

  const selectedPredictions = useMemo(() => {
    if (!selectedAdmission) return predictions;
    return predictions.filter(
      (item) => String(item.admission_id) === String(selectedAdmission.admission_id)
    );
  }, [predictions, selectedAdmission]);

  const latestPrediction = selectedPredictions[0] || null;

  // Filtered Admissions (with Search & Risk Filter)
  const filteredAdmissions = useMemo(() => {
    const query = search.trim().toLowerCase();
    return admissions.filter((item) => {
      const matchesSearch =
        !query ||
        String(item.admission_id ?? "").toLowerCase().includes(query) ||
        String(item.patient_id ?? "").toLowerCase().includes(query) ||
        String(item.patient?.state ?? item.state ?? "").toLowerCase().includes(query) ||
        String(item.admit_type ?? "").toLowerCase().includes(query) ||
        String(item.ward_type ?? "").toLowerCase().includes(query);

      // Find risk from predictions
      const admPreds = predictions.filter(
        (p) => String(p.admission_id) === String(item.admission_id)
      );
      const admRisk = admPreds[0]?.risk_level?.toLowerCase() || "unknown";

      const matchesRisk =
        riskFilter === "all" ? true : admRisk === riskFilter.toLowerCase();

      return matchesSearch && matchesRisk;
    });
  }, [admissions, predictions, search, riskFilter]);

  // Filtered Patients (with Search & Risk Filter)
  const filteredPatients = useMemo(() => {
    const query = search.trim().toLowerCase();
    return patients.filter((p) => {
      const matchesSearch =
        !query ||
        String(p.patient_id ?? "").toLowerCase().includes(query) ||
        String(p.state ?? "").toLowerCase().includes(query) ||
        String(p.insurance_type ?? "").toLowerCase().includes(query) ||
        String(p.gender ?? "").toLowerCase().includes(query);

      const pRisk = p.latest_prediction?.risk_level?.toLowerCase() || "unassessed";
      const matchesRisk =
        riskFilter === "all" ? true : pRisk === riskFilter.toLowerCase();

      return matchesSearch && matchesRisk;
    });
  }, [patients, search, riskFilter]);

  // Analytics Metrics
  const analytics = useMemo(() => {
    const total = predictions.length;
    const low = predictions.filter((p) => String(p.risk_level).toUpperCase() === "LOW").length;
    const medium = predictions.filter((p) => String(p.risk_level).toUpperCase() === "MEDIUM").length;
    const high = predictions.filter((p) => String(p.risk_level).toUpperCase() === "HIGH").length;

    const totalProbability = predictions.reduce(
      (sum, item) => sum + (Number(item.probability_percent) || 0),
      0
    );
    const average = total > 0 ? totalProbability / total : 0;

    return { total, low, medium, high, average };
  }, [predictions]);

  const riskClass = (risk) => {
    const val = String(risk).toLowerCase().trim();
    if (val === "low") return "risk-low";
    if (val === "high") return "risk-high";
    return "risk-medium";
  };

  const formatDate = (dateValue) => {
    if (!dateValue) return "—";
    const d = new Date(dateValue);
    return Number.isNaN(d.getTime()) ? String(dateValue) : d.toLocaleString();
  };

  // If not authenticated, render LoginPage
  if (!currentUser) {
    return <LoginPage onLoginSuccess={handleLoginSuccess} />;
  }

  return (
    <div className="app-shell">
      {/* ======================================================
          SIDEBAR NAVIGATION (ROLE GATED)
          ====================================================== */}
      <aside className="sidebar">
        <div className="brand" style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "20px" }}>
          <div className="login-brand-logo" style={{ width: "40px", height: "40px", borderRadius: "10px" }}>
            <HeartPulse size={22} className="brand-icon-pulse" />
          </div>
          <div className="brand-text">
            <strong style={{ fontSize: "14px", color: "#1e1b4b", lineHeight: "1.2", display: "block" }}>AI Hospital Readmission Prediction</strong>
            <span style={{ fontSize: "11px", color: "#64748b" }}>Clinical Intelligence</span>
          </div>
        </div>

        <nav className="sidebar-nav">
          <button
            className={activePage === "dashboard" ? "nav-item active" : "nav-item"}
            onClick={() => setActivePage("dashboard")}
          >
            <span>▦</span> Dashboard
          </button>

          <button
            className={activePage === "patients" ? "nav-item active" : "nav-item"}
            onClick={() => setActivePage("patients")}
          >
            <span>♙</span> Patients ({patients.length})
          </button>

          <button
            className={activePage === "admissions" ? "nav-item active" : "nav-item"}
            onClick={() => setActivePage("admissions")}
          >
            <span>▤</span> Admissions ({admissions.length})
          </button>

          <button
            className={activePage === "prediction" ? "nav-item active" : "nav-item"}
            onClick={() => setActivePage("prediction")}
          >
            <span>⌁</span> AI Prediction Engine
          </button>

          <button
            className={activePage === "history" ? "nav-item active" : "nav-item"}
            onClick={() => setActivePage("history")}
          >
            <span>◷</span> Prediction History
          </button>

          {/* Departments Tab: Accessible to Admin & Doctors */}
          {(isAdmin || isDoctor) && (
            <button
              className={activePage === "departments" ? "nav-item active" : "nav-item"}
              onClick={() => setActivePage("departments")}
            >
              <Building2 size={17} /> Departments & Wards
            </button>
          )}

          {/* User Management Tab: Administrator Only */}
          {isAdmin && (
            <button
              className={activePage === "users" ? "nav-item active" : "nav-item"}
              onClick={() => setActivePage("users")}
            >
              <Users size={17} /> User Management
            </button>
          )}
        </nav>

        {/* Sidebar Bottom: Status & Quick Switch */}
        <div className="sidebar-bottom">
          <div className="user-role-card" style={{ padding: "12px", background: "#f8fafc", borderRadius: "12px", border: "1px solid #e2e8f0", marginBottom: "12px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "4px" }}>
              {isAdmin && <ShieldCheck size={16} color="#ef4444" />}
              {isDoctor && <Stethoscope size={16} color="#3b82f6" />}
              {isStaff && <Users size={16} color="#10b981" />}
              <strong style={{ fontSize: "12px", color: "#0f172a" }}>
                {isAdmin ? "Administrator" : isDoctor ? "Doctor / Clinical" : "Hospital Staff"}
              </strong>
            </div>
            <p style={{ margin: 0, fontSize: "11px", color: "#64748b" }}>
              {currentUser.full_name}
            </p>
          </div>

          <div className={backendConnected ? "backend-card connected" : "backend-card disconnected"}>
            <div className="backend-indicator">
              <span />
              <strong>Backend API</strong>
            </div>
            <small>{backendConnected ? "Online (127.0.0.1:8000)" : "Offline"}</small>
          </div>
        </div>
      </aside>

      {/* ======================================================
          MAIN WORKSPACE AREA
          ====================================================== */}
      <main className="main-area">
        {/* TOPBAR WITH USER PROFILE & ACTIONS */}
        <header className="topbar">
          <div className="topbar-title-area">
            <p className="topbar-label">CLINICAL PREDICTIVE SYSTEM</p>
            <div className="main-title-row">
              <h1>AI Hospital Readmission Risk Prediction</h1>
            </div>
            <p className="topbar-description">
              Evidence-based AI predictive intelligence, patient dossiers, and clinical risk stratification.
            </p>
          </div>

          <div className="topbar-actions">
            {/* Topbar User Profile & Switcher */}
            <div className="user-profile-widget">
              <div className={`user-avatar-circle ${currentUser.role}`}>
                {currentUser.full_name?.charAt(0) || "U"}
              </div>
              <div className="user-details-meta">
                <span className="user-display-name">{currentUser.full_name}</span>
                <span className={`user-role-badge-tag ${currentUser.role}`}>
                  {isAdmin ? "Administrator" : isDoctor ? "Doctor / Clinical" : "Hospital Staff"}
                </span>
              </div>
            </div>

            {/* Quick Demo Role Switcher Dropdown */}
            <div className="quick-role-switcher" style={{ display: "flex", gap: "6px" }}>
              <button
                className="secondary-button"
                style={{ fontSize: "11px", padding: "6px 10px" }}
                title="Quick switch to Admin"
                onClick={() => handleQuickRoleSwitch("admin", "admin123")}
              >
                👑 Admin
              </button>
              <button
                className="secondary-button"
                style={{ fontSize: "11px", padding: "6px 10px" }}
                title="Quick switch to Doctor"
                onClick={() => handleQuickRoleSwitch("doctor", "doctor123")}
              >
                🩺 Doctor
              </button>
              <button
                className="secondary-button"
                style={{ fontSize: "11px", padding: "6px 10px" }}
                title="Quick switch to Staff"
                onClick={() => handleQuickRoleSwitch("staff", "staff123")}
              >
                📋 Staff
              </button>
            </div>

            <button className="logout-topbar-button" onClick={handleLogout} title="Sign Out">
              <LogOut size={14} style={{ verticalAlign: "middle", marginRight: "4px" }} />
              Logout
            </button>
          </div>
        </header>

        {/* ====================================================
            PAGE 1: DASHBOARD
            ==================================================== */}
        {activePage === "dashboard" && (
          <>
            {/* Active Admission Selector */}
            <section className="selector-card">
              <div>
                <p className="section-eyebrow">ACTIVE CLINICAL RECORD</p>
                <h2>
                  {selectedAdmission
                    ? `Admission ${selectedAdmission.admission_id}`
                    : "No admission selected"}
                </h2>
                <p>Select an admission to inspect patient history, lab telemetry, and readmission risk.</p>
              </div>

              <div className="selector-controls">
                <input
                  type="search"
                  placeholder="Search admission or state..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />

                <select
                  value={selectedAdmission?.admission_id || ""}
                  onChange={(e) => {
                    const match = admissions.find((a) => String(a.admission_id) === e.target.value);
                    if (match) setSelectedAdmission(match);
                  }}
                >
                  <option value="">Select Admission</option>
                  {filteredAdmissions.map((adm) => (
                    <option key={adm.admission_id} value={adm.admission_id}>
                      {adm.admission_id} (Patient {adm.patient_id || adm.patient?.patient_id})
                    </option>
                  ))}
                </select>
              </div>
            </section>

            {/* Selected Patient Banner with Full Dossier Button */}
            {selectedAdmission && (
              <section className="patient-summary">
                <div className="patient-avatar">
                  {String(selectedPatient.gender || selectedAdmission.gender || "P").toUpperCase() === "F" ? "♀" : "♂"}
                </div>

                <div className="patient-main">
                  <p className="section-eyebrow">PATIENT PROFILE</p>
                  <h2>
                    Patient #{selectedAdmission.patient_id ?? selectedPatient.patient_id ?? "—"}
                  </h2>
                  <div className="patient-meta">
                    <span>Age: {selectedPatient.age ?? selectedAdmission.age ?? "—"}</span>
                    <span>Gender: {selectedPatient.gender ?? selectedAdmission.gender ?? "—"}</span>
                    <span>State: {selectedPatient.state ?? selectedAdmission.state ?? "—"}</span>
                    <span>Insurance: {selectedPatient.insurance_type ?? selectedAdmission.insurance_type ?? "—"}</span>
                    <span>BPL Card: {(selectedPatient.bpl_card ?? selectedAdmission.bpl_card) ? "Yes" : "No"}</span>
                  </div>
                </div>

                <div className="patient-actions" style={{ display: "flex", flexDirection: "column", gap: "8px", alignItems: "flex-end" }}>
                  <button
                    className="primary-action-button"
                    style={{ background: "#0284c7" }}
                    onClick={() => setDossierPatientId(selectedAdmission.patient_id || selectedPatient.patient_id)}
                  >
                    <FileText size={16} />
                    View Full Patient Dossier & History
                  </button>
                  <small style={{ color: "#64748b" }}>
                    Admission: <strong>{selectedAdmission.admission_id}</strong> ({selectedAdmission.admit_type})
                  </small>
                </div>
              </section>
            )}

            {/* Analytics Metric Cards */}
            <section className="analytics-grid">
              <div className="analytics-card blue">
                <span>Total Predictions</span>
                <strong>{analytics.total}</strong>
                <small>Stored prediction records</small>
              </div>

              <div className="analytics-card green">
                <span>Low Risk</span>
                <strong>{analytics.low}</strong>
                <small>Low 30-day readmission risk</small>
              </div>

              <div className="analytics-card amber">
                <span>Medium Risk</span>
                <strong>{analytics.medium}</strong>
                <small>Moderate monitoring required</small>
              </div>

              <div className="analytics-card red">
                <span>High Risk</span>
                <strong>{analytics.high}</strong>
                <small>High post-discharge care required</small>
              </div>

              <div className="analytics-card purple">
                <span>Average Probability</span>
                <strong>{analytics.average.toFixed(1)}%</strong>
                <small>Across active cohorts</small>
              </div>
            </section>

            {/* Two-Column Clinical & Model Layout */}
            <section className="two-column-layout">
              {/* Model Readmission Prediction */}
              <div className="dashboard-card prediction-dashboard-card">
                <div className="card-header">
                  <div>
                    <p className="section-eyebrow">AI MODEL PREDICTION</p>
                    <h2>Readmission Risk Assessment</h2>
                  </div>
                  {latestPrediction && (
                    <span className={`risk-badge ${riskClass(latestPrediction.risk_level)}`}>
                      {latestPrediction.risk_level} Risk
                    </span>
                  )}
                </div>

                {latestPrediction ? (
                  <>
                    <div className="prediction-highlight">
                      <div>
                        <span className="probability-display">
                          {Number(latestPrediction.probability_percent).toFixed(2)}%
                        </span>
                        <p className="probability-label">Estimated 30-Day Readmission Probability</p>
                      </div>
                      <div className="gauge-wrapper">
                        <div
                          className={`risk-gauge ${riskClass(latestPrediction.risk_level)}`}
                          style={{ "--prob": `${latestPrediction.probability_percent}%` }}
                        />
                      </div>
                    </div>

                    <div className="details-grid">
                      <Detail label="Admission ID" value={latestPrediction.admission_id} />
                      <Detail label="Department" value={latestPrediction.department_name || "General Medicine"} />
                      <Detail label="Clinical Diagnosis" value={latestPrediction.diagnosis_type || "Primary Clinical Diagnosis"} />
                      <Detail label="Model Engine" value={latestPrediction.model_name || "Logistic Regression"} />
                      <Detail label="Timestamp" value={formatDate(latestPrediction.created_at)} />
                    </div>
                  </>
                ) : (
                  <div className="empty-state">
                    <p>No prediction recorded yet for this admission. Use the AI Prediction Engine to evaluate readmission probability.</p>
                  </div>
                )}
              </div>

              {/* Clinical Lab & Vitals Details */}
              {selectedAdmission && (
                <div className="dashboard-card">
                  <div className="card-header">
                    <div>
                      <p className="section-eyebrow">INPATIENT LABS & VITALS</p>
                      <h2>Clinical Measurements</h2>
                    </div>
                  </div>
                  <div className="details-grid">
                    <Detail label="HbA1c" value={`${selectedAdmission.hba1c}%`} />
                    <Detail label="Serum Creatinine" value={`${selectedAdmission.creatinine} mg/dL`} />
                    <Detail label="Systolic Blood Pressure" value={`${selectedAdmission.systolic_bp} mmHg`} />
                    <Detail label="Haemoglobin" value={`${selectedAdmission.haemoglobin} g/dL`} />
                    <Detail label="Length of Stay" value={`${selectedAdmission.los_days} days`} />
                    <Detail label="Procedures Count" value={selectedAdmission.num_procedures} />
                    <Detail label="Charlson Comorbidity Index" value={selectedAdmission.charlson_index} />
                    <Detail label="Ward / Unit" value={selectedAdmission.ward_type} />
                  </div>
                </div>
              )}

              {/* Financial & Healthcare Cost Information */}
              {selectedAdmission && (
                <div className="dashboard-card" style={{ borderLeft: "4px solid #10b981" }}>
                  <div className="card-header">
                    <div>
                      <p className="section-eyebrow" style={{ color: "#059669" }}>FINANCIAL BILLING & COST BREAKDOWN</p>
                      <h2>Cost & Subsidy Information</h2>
                    </div>
                    <span className="role-preset-badge" style={{ background: "#ecfdf5", color: "#047857", borderColor: "#a7f3d0" }}>
                      {selectedAdmission.cost_category || "Room & Care"}
                    </span>
                  </div>
                  <div className="details-grid">
                    <Detail label="Total Inpatient Cost" value={formatCurrency(selectedAdmission.total_cost_inr)} />
                    <Detail label="Govt / Insurance Subsidy" value={formatCurrency(selectedAdmission.govt_subsidy_inr)} />
                    <Detail label="Patient Out-of-Pocket Share" value={formatCurrency(selectedAdmission.out_of_pocket_inr)} />
                    <Detail label="Insurance Scheme" value={selectedPatient.insurance_type || selectedAdmission.insurance_type || "Government"} />
                    <Detail label="BPL Subsidy Eligible" value={(selectedPatient.bpl_card || selectedAdmission.bpl_card) ? "Yes (85% Subsidy)" : "Standard Coverage"} />
                    <Detail label="Billing Cost Category" value={selectedAdmission.cost_category || "Standard Inpatient"} />
                  </div>
                </div>
              )}

              {/* Hospital Facility & Diagnostic Details */}
              {selectedAdmission && (
                <div className="dashboard-card" style={{ borderLeft: "4px solid #6366f1" }}>
                  <div className="card-header">
                    <div>
                      <p className="section-eyebrow" style={{ color: "#4f46e5" }}>FACILITY & DIAGNOSIS</p>
                      <h2>Hospital Infrastructure & ICD-10</h2>
                    </div>
                  </div>
                  <div className="details-grid">
                    <Detail label="Hospital Care Tier" value={selectedAdmission.tier === "tier1" ? "Tier 1 Tertiary Care" : "Tier 2 District Hospital"} />
                    <Detail label="Facility Bed Capacity" value={`${selectedAdmission.beds || 450} Total Beds`} />
                    <Detail label="Academic / Teaching" value={selectedAdmission.teaching ? "Yes (Academic Medical Center)" : "Standard Hospital"} />
                    <Detail label="Clinical Department" value={selectedAdmission.department_name || "General Medicine"} />
                    <Detail label="Primary ICD-10 Code" value={selectedAdmission.primary_icd10 || "E11 / I50"} />
                    <Detail label="Diagnostic Category" value={selectedAdmission.primary_diag_category || "General Medical"} />
                  </div>
                </div>
              )}
            </section>

            {/* Recent Predictions Table (Version column removed) */}
            <section className="dashboard-card page-card">
              <div className="card-header">
                <div>
                  <p className="section-eyebrow">AUDIT LOG</p>
                  <h2>Recent Readmission Risk Assessments</h2>
                  <p className="card-description">Latest machine learning predictions generated for patients.</p>
                </div>
                <button className="secondary-button" onClick={refreshDashboard} disabled={loading}>
                  <RefreshCw size={16} className={loading ? "spin" : ""} /> Refresh
                </button>
              </div>

              <div className="table-wrapper">
                <table className="history-table">
                  <thead>
                    <tr>
                      <th>ID</th>
                      <th>Admission</th>
                      <th>Predicted Probability</th>
                      <th>Risk Stratification</th>
                      <th>Department</th>
                      <th>AI Model</th>
                      <th>Assessment Date</th>
                    </tr>
                  </thead>
                  <tbody>
                    {predictions.slice(0, 10).map((pr) => (
                      <tr key={pr.id}>
                        <td><strong>#{pr.id}</strong></td>
                        <td><strong>{pr.admission_id}</strong></td>
                        <td><strong>{Number(pr.probability_percent).toFixed(2)}%</strong></td>
                        <td>
                          <span className={`risk-badge ${riskClass(pr.risk_level)}`}>
                            {pr.risk_level}
                          </span>
                        </td>
                        <td>{pr.department_name || "General Medicine"}</td>
                        <td>{pr.model_name || "Logistic Regression"}</td>
                        <td>{formatDate(pr.created_at)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>
          </>
        )}

        {/* ====================================================
            PAGE 2: PATIENTS (WITH FULL HISTORY DOSSIER & CSV)
            ==================================================== */}
        {activePage === "patients" && (
          <section className="dashboard-card page-card">
            <div className="management-header">
              <div>
                <p className="section-eyebrow">PATIENT REGISTRY</p>
                <h2>Master Patients Roster</h2>
                <p className="card-description">
                  View complete patient records, access full clinical history dossiers, and export master data.
                </p>
              </div>

              <div className="management-actions">
                <button
                  className="primary-action-button"
                  style={{ background: "#0284c7" }}
                  onClick={handleDownloadMasterPatientsCSV}
                >
                  <FileSpreadsheet size={16} />
                  Download Master Patients (CSV)
                </button>

                {!isDoctor && (
                  <button className="primary-action-button" onClick={() => setShowAddPatient(true)}>
                    <Plus size={18} />
                    + Register Patient
                  </button>
                )}

                <button className="secondary-button" onClick={loadPatients} disabled={loading}>
                  <RefreshCw size={16} className={loading ? "spin" : ""} />
                  Refresh
                </button>
              </div>
            </div>

            {/* Search & Risk Filter Bar */}
            <div className="management-filter-bar" style={{ marginTop: "16px" }}>
              <div className="search-input-group">
                <Search size={18} />
                <input
                  type="search"
                  placeholder="Search patient ID, state, insurance, gender..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>

              <div className="filter-pills">
                <button
                  className={`filter-pill ${riskFilter === "all" ? "active" : ""}`}
                  onClick={() => setRiskFilter("all")}
                >
                  All Patients ({patients.length})
                </button>
                <button
                  className={`filter-pill low ${riskFilter === "low" ? "active" : ""}`}
                  onClick={() => setRiskFilter("low")}
                >
                  🟢 Low Risk
                </button>
                <button
                  className={`filter-pill medium ${riskFilter === "medium" ? "active" : ""}`}
                  onClick={() => setRiskFilter("medium")}
                >
                  🟡 Medium Risk
                </button>
                <button
                  className={`filter-pill high ${riskFilter === "high" ? "active" : ""}`}
                  onClick={() => setRiskFilter("high")}
                >
                  🔴 High Risk
                </button>
              </div>
            </div>

            {/* Patients Table */}
            <div className="table-wrapper" style={{ marginTop: "16px" }}>
              <table className="management-table">
                <thead>
                  <tr>
                    <th>Patient ID</th>
                    <th>Age / Gender</th>
                    <th>State</th>
                    <th>Insurance</th>
                    <th>BPL Card</th>
                    <th>Comorbidities</th>
                    <th>Admissions Count</th>
                    <th>Latest Readmission Risk</th>
                    <th>Clinical Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredPatients.length === 0 ? (
                    <tr>
                      <td colSpan="9" className="table-empty-cell">
                        No patients found matching the criteria.
                      </td>
                    </tr>
                  ) : (
                    filteredPatients.map((p) => {
                      const latestRisk = p.latest_prediction?.risk_level || "Not Evaluated";
                      return (
                        <tr key={p.id}>
                          <td><strong>#{p.patient_id}</strong></td>
                          <td>{p.age} yrs • {p.gender === "F" ? "Female" : "Male"}</td>
                          <td>{p.state}</td>
                          <td>{p.insurance_type || "Government"}</td>
                          <td>
                            {p.bpl_card ? (
                              <span className="status-badge-pill active">Yes (BPL)</span>
                            ) : (
                              <span className="status-badge-pill inactive">No</span>
                            )}
                          </td>
                          <td>{p.comorbidity_count} condition(s)</td>
                          <td>
                            <strong>{p.admissions_count || 0} recorded</strong>
                          </td>
                          <td>
                            <span className={`risk-badge ${riskClass(latestRisk)}`}>
                              {latestRisk}
                              {p.latest_prediction?.probability_percent
                                ? ` (${p.latest_prediction.probability_percent}%)`
                                : ""}
                            </span>
                          </td>
                          <td>
                            <div className="action-buttons-group">
                              <button
                                className="primary-action-button"
                                style={{ padding: "6px 12px", fontSize: "12px", background: "#0284c7" }}
                                title="View & Download Full Patient History Dossier"
                                onClick={() => setDossierPatientId(p.patient_id)}
                              >
                                <FileText size={14} /> Full History Dossier
                              </button>

                              {isAdmin && (
                                <button
                                  className="table-action-btn delete"
                                  title="Delete Patient Record"
                                  onClick={() => handleDeletePatient(p.patient_id)}
                                >
                                  <Trash2 size={15} />
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </section>
        )}

        {/* ====================================================
            PAGE 3: ADMISSIONS MANAGEMENT
            ==================================================== */}
        {activePage === "admissions" && (
          <section className="dashboard-card page-card">
            <div className="management-header">
              <div>
                <p className="section-eyebrow">INPATIENT ADMISSIONS</p>
                <h2>Hospital Admissions Records</h2>
                <p className="card-description">
                  Review inpatient admissions, register new patient admissions, and initiate AI readmission evaluations.
                </p>
              </div>

              <div className="management-actions">
                {!isDoctor && (
                  <button className="primary-action-button" onClick={openAddAdmission}>
                    <Plus size={18} />
                    + Add Admission
                  </button>
                )}

                <button className="secondary-button" onClick={loadAdmissions} disabled={admissionsLoading}>
                  <RefreshCw size={16} className={admissionsLoading ? "spin" : ""} />
                  Refresh
                </button>
              </div>
            </div>

            {/* Risk & Search Filter */}
            <div className="management-filter-bar" style={{ marginTop: "16px" }}>
              <div className="search-input-group">
                <Search size={18} />
                <input
                  type="search"
                  placeholder="Search by admission ID, patient, type, ward..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>

              <div className="filter-pills">
                <button
                  className={`filter-pill ${riskFilter === "all" ? "active" : ""}`}
                  onClick={() => setRiskFilter("all")}
                >
                  All Admissions ({admissions.length})
                </button>
                <button
                  className={`filter-pill low ${riskFilter === "low" ? "active" : ""}`}
                  onClick={() => setRiskFilter("low")}
                >
                  🟢 Low Risk
                </button>
                <button
                  className={`filter-pill medium ${riskFilter === "medium" ? "active" : ""}`}
                  onClick={() => setRiskFilter("medium")}
                >
                  🟡 Medium Risk
                </button>
                <button
                  className={`filter-pill high ${riskFilter === "high" ? "active" : ""}`}
                  onClick={() => setRiskFilter("high")}
                >
                  🔴 High Risk
                </button>
              </div>
            </div>

            {/* Admissions Table */}
            <div className="table-wrapper" style={{ marginTop: "16px" }}>
              <table className="management-table">
                <thead>
                  <tr>
                    <th>Admission ID</th>
                    <th>Patient ID</th>
                    <th>Age / Gender</th>
                    <th>Admission Type</th>
                    <th>Ward / Unit</th>
                    <th>Length of Stay</th>
                    <th>HbA1c / Creatinine</th>
                    <th>Est. Total Cost</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredAdmissions.length === 0 ? (
                    <tr>
                      <td colSpan="9" className="table-empty-cell">
                        No admissions found.
                      </td>
                    </tr>
                  ) : (
                    filteredAdmissions.map((adm) => (
                      <tr key={adm.admission_id}>
                        <td><strong>#{adm.admission_id}</strong></td>
                        <td>#{adm.patient_id ?? adm.patient?.patient_id}</td>
                        <td>
                          {adm.patient?.age ?? adm.age} yrs • {adm.patient?.gender ?? adm.gender}
                        </td>
                        <td>{adm.admit_type}</td>
                        <td>{adm.ward_type}</td>
                        <td>{adm.los_days} days</td>
                        <td>
                          <strong>{adm.hba1c}%</strong> • {adm.creatinine} mg/dL
                        </td>
                        <td>
                          <div style={{ display: "flex", flexDirection: "column" }}>
                            <strong>{formatCurrency(adm.total_cost_inr)}</strong>
                            <small style={{ color: "#059669" }}>
                              Subsidy: {formatCurrency(adm.govt_subsidy_inr)}
                            </small>
                          </div>
                        </td>
                        <td>
                          <div className="action-buttons-group">
                            <button
                              className="secondary-button"
                              style={{ padding: "5px 10px", fontSize: "11px" }}
                              onClick={() => handleSelectAdmission(adm)}
                            >
                              Open in Dashboard
                            </button>

                            <button
                              className="primary-action-button"
                              style={{ padding: "5px 10px", fontSize: "11px", background: "#4f46e5" }}
                              onClick={() => {
                                setSelectedAdmission(adm);
                                setActivePage("prediction");
                              }}
                            >
                              Run AI Prediction
                            </button>

                            <button
                              className="secondary-button"
                              style={{ padding: "5px 10px", fontSize: "11px", background: "#f0fdf4", color: "#15803d" }}
                              onClick={() => setDossierPatientId(adm.patient_id || adm.patient?.patient_id)}
                            >
                              📋 Dossier
                            </button>

                            {!isDoctor && (
                              <button
                                className="table-action-btn delete"
                                title="Delete Admission"
                                onClick={() => handleDeleteAdmission(adm.admission_id)}
                              >
                                <Trash2 size={15} />
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </section>
        )}

        {/* ====================================================
            PAGE 4: AI PREDICTION ENGINE
            ==================================================== */}
        {activePage === "prediction" && (
          <div className="prediction-page-wrapper">
            <PredictionForm
              selectedAdmission={selectedAdmission}
              onPredictionCreated={handlePredictionCreated}
            />
          </div>
        )}

        {/* ====================================================
            PAGE 5: PREDICTION HISTORY (VERSION COLUMN REMOVED)
            ==================================================== */}
        {activePage === "history" && (
          <PredictionHistory
            selectedAdmission={selectedAdmission}
            refreshTrigger={predictions.length}
          />
        )}

        {/* ====================================================
            PAGE 6: DEPARTMENTS & WARDS
            ==================================================== */}
        {activePage === "departments" && (
          <DepartmentManagement currentUser={currentUser} />
        )}

        {/* ====================================================
            PAGE 7: USER MANAGEMENT (ADMIN ONLY)
            ==================================================== */}
        {activePage === "users" && isAdmin && (
          <UserManagement currentUser={currentUser} />
        )}

        {/* ====================================================
            PATIENT DOSSIER & FULL HISTORY MODAL
            ==================================================== */}
        {dossierPatientId && (
          <PatientDossierModal
            patientId={dossierPatientId}
            onClose={() => setDossierPatientId(null)}
          />
        )}

        {/* ====================================================
            ADD ADMISSION MODAL
            ==================================================== */}
        {showAddAdmission && (
          <div className="modal-backdrop" onClick={closeAddAdmission}>
            <div className="modal-card" onClick={(e) => e.stopPropagation()} style={{ maxWidth: "700px" }}>
              <div className="modal-header">
                <h3>+ Register New Hospital Admission</h3>
                <button type="button" className="modal-close-btn" onClick={closeAddAdmission}>
                  <X size={20} />
                </button>
              </div>

              <form onSubmit={handleAddAdmissionSubmit} className="modal-form">
                <div className="modal-form-grid">
                  <div className="form-group">
                    <label>Patient Age *</label>
                    <input
                      type="number"
                      name="age"
                      min="0"
                      max="120"
                      required
                      value={addAdmissionForm.age}
                      onChange={handleAddAdmissionChange}
                    />
                  </div>

                  <div className="form-group">
                    <label>Gender *</label>
                    <select
                      name="gender"
                      value={addAdmissionForm.gender}
                      onChange={handleAddAdmissionChange}
                    >
                      <option value="F">Female (F)</option>
                      <option value="M">Male (M)</option>
                    </select>
                  </div>

                  <div className="form-group">
                    <label>State *</label>
                    <input
                      type="text"
                      name="state"
                      required
                      value={addAdmissionForm.state}
                      onChange={handleAddAdmissionChange}
                    />
                  </div>

                  <div className="form-group">
                    <label>Insurance Type *</label>
                    <select
                      name="insurance_type"
                      value={addAdmissionForm.insurance_type}
                      onChange={handleAddAdmissionChange}
                    >
                      <option value="Government">Government / Ayushman</option>
                      <option value="ESI">ESI / Employer</option>
                      <option value="Private">Private Insurance</option>
                      <option value="Self-Pay">Self-Pay</option>
                    </select>
                  </div>

                  <div className="form-group">
                    <label>Admission Type *</label>
                    <select
                      name="admit_type"
                      value={addAdmissionForm.admit_type}
                      onChange={handleAddAdmissionChange}
                    >
                      <option value="Emergency">Emergency</option>
                      <option value="Elective">Elective</option>
                      <option value="Urgent">Urgent</option>
                      <option value="Trauma">Trauma</option>
                    </select>
                  </div>

                  <div className="form-group">
                    <label>Ward Type *</label>
                    <select
                      name="ward_type"
                      value={addAdmissionForm.ward_type}
                      onChange={handleAddAdmissionChange}
                    >
                      <option value="General">General Ward</option>
                      <option value="Semi-Private">Semi-Private</option>
                      <option value="Private">Private Room</option>
                      <option value="ICU">Intensive Care Unit (ICU)</option>
                    </select>
                  </div>

                  <div className="form-group">
                    <label>Length of Stay (Days) *</label>
                    <input
                      type="number"
                      name="los_days"
                      min="1"
                      required
                      value={addAdmissionForm.los_days}
                      onChange={handleAddAdmissionChange}
                    />
                  </div>

                  <div className="form-group">
                    <label>Number of Procedures *</label>
                    <input
                      type="number"
                      name="num_procedures"
                      min="0"
                      required
                      value={addAdmissionForm.num_procedures}
                      onChange={handleAddAdmissionChange}
                    />
                  </div>

                  <div className="form-group">
                    <label>HbA1c (%) *</label>
                    <input
                      type="number"
                      step="0.1"
                      name="hba1c"
                      required
                      value={addAdmissionForm.hba1c}
                      onChange={handleAddAdmissionChange}
                    />
                  </div>

                  <div className="form-group">
                    <label>Serum Creatinine (mg/dL) *</label>
                    <input
                      type="number"
                      step="0.1"
                      name="creatinine"
                      required
                      value={addAdmissionForm.creatinine}
                      onChange={handleAddAdmissionChange}
                    />
                  </div>

                  <div className="form-group">
                    <label>Haemoglobin (g/dL) *</label>
                    <input
                      type="number"
                      step="0.1"
                      name="haemoglobin"
                      required
                      value={addAdmissionForm.haemoglobin}
                      onChange={handleAddAdmissionChange}
                    />
                  </div>

                  <div className="form-group">
                    <label>Systolic BP (mmHg) *</label>
                    <input
                      type="number"
                      name="systolic_bp"
                      required
                      value={addAdmissionForm.systolic_bp}
                      onChange={handleAddAdmissionChange}
                    />
                  </div>

                  <div className="form-group checkbox-group">
                    <label className="checkbox-label">
                      <input
                        type="checkbox"
                        name="bpl_card"
                        checked={addAdmissionForm.bpl_card}
                        onChange={handleAddAdmissionChange}
                      />
                      <span>BPL Cardholder (Below Poverty Line)</span>
                    </label>
                  </div>
                </div>

                {addAdmissionError && (
                  <div className="status-banner error" style={{ marginTop: "16px" }}>
                    <AlertCircle size={18} />
                    <span>{addAdmissionError}</span>
                  </div>
                )}

                <div className="modal-footer">
                  <button type="button" className="secondary-button" onClick={closeAddAdmission}>
                    Cancel
                  </button>
                  <button type="submit" className="primary-action-button" disabled={addAdmissionLoading}>
                    {addAdmissionLoading ? "Registering..." : "+ Register Admission"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* ====================================================
            ADD PATIENT MODAL
            ==================================================== */}
        {showAddPatient && (
          <div className="modal-backdrop" onClick={() => setShowAddPatient(false)}>
            <div className="modal-card" onClick={(e) => e.stopPropagation()}>
              <div className="modal-header">
                <h3>+ Register New Patient Profile</h3>
                <button type="button" className="modal-close-btn" onClick={() => setShowAddPatient(false)}>
                  <X size={20} />
                </button>
              </div>

              <form onSubmit={handleAddPatientSubmit} className="modal-form">
                <div className="modal-form-grid">
                  <div className="form-group">
                    <label>Age *</label>
                    <input
                      type="number"
                      min="0"
                      max="120"
                      required
                      value={addPatientForm.age}
                      onChange={(e) => setAddPatientForm({ ...addPatientForm, age: parseInt(e.target.value) || 0 })}
                    />
                  </div>

                  <div className="form-group">
                    <label>Gender *</label>
                    <select
                      value={addPatientForm.gender}
                      onChange={(e) => setAddPatientForm({ ...addPatientForm, gender: e.target.value })}
                    >
                      <option value="F">Female (F)</option>
                      <option value="M">Male (M)</option>
                    </select>
                  </div>

                  <div className="form-group">
                    <label>State of Residence *</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Karnataka, Telangana"
                      value={addPatientForm.state}
                      onChange={(e) => setAddPatientForm({ ...addPatientForm, state: e.target.value })}
                    />
                  </div>

                  <div className="form-group">
                    <label>Insurance Scheme</label>
                    <select
                      value={addPatientForm.insurance_type}
                      onChange={(e) => setAddPatientForm({ ...addPatientForm, insurance_type: e.target.value })}
                    >
                      <option value="Government">Government / Ayushman</option>
                      <option value="ESI">ESI / Employer</option>
                      <option value="Private">Private Insurance</option>
                      <option value="Self-Pay">Self-Pay</option>
                    </select>
                  </div>

                  <div className="form-group">
                    <label>Comorbidities Count</label>
                    <input
                      type="number"
                      min="0"
                      value={addPatientForm.comorbidity_count}
                      onChange={(e) => setAddPatientForm({ ...addPatientForm, comorbidity_count: parseInt(e.target.value) || 0 })}
                    />
                  </div>

                  <div className="form-group">
                    <label>Prior Hospital Admissions</label>
                    <input
                      type="number"
                      min="0"
                      value={addPatientForm.prev_admissions}
                      onChange={(e) => setAddPatientForm({ ...addPatientForm, prev_admissions: parseInt(e.target.value) || 0 })}
                    />
                  </div>

                  <div className="form-group checkbox-group">
                    <label className="checkbox-label">
                      <input
                        type="checkbox"
                        checked={addPatientForm.bpl_card}
                        onChange={(e) => setAddPatientForm({ ...addPatientForm, bpl_card: e.target.checked })}
                      />
                      <span>BPL Cardholder (Below Poverty Line Subsidy)</span>
                    </label>
                  </div>
                </div>

                {addPatientError && (
                  <div className="status-banner error" style={{ marginTop: "16px" }}>
                    <AlertCircle size={18} />
                    <span>{addPatientError}</span>
                  </div>
                )}

                <div className="modal-footer">
                  <button type="button" className="secondary-button" onClick={() => setShowAddPatient(false)}>
                    Cancel
                  </button>
                  <button type="submit" className="primary-action-button" disabled={addPatientLoading}>
                    {addPatientLoading ? "Registering..." : "+ Register Patient"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Global Error Banner */}
        {error && (
          <div className="status-banner error" style={{ margin: "20px 0" }}>
            <AlertCircle size={18} />
            <span>{error}</span>
            <button onClick={() => setError("")} style={{ marginLeft: "auto", background: "none", border: "none", cursor: "pointer", color: "#b91c1c", fontWeight: "bold" }}>
              ✕
            </button>
          </div>
        )}

        {/* Footer */}
        <footer className="app-footer" style={{ marginTop: "40px", padding: "20px 0", borderTop: "1px solid #e2e8f0", display: "flex", justifyContent: "space-between", color: "#94a3b8", fontSize: "12px" }}>
          <span>AI Hospital Readmission Prediction • Clinical Decision Support Platform</span>
          <span>Role-Based Healthcare Intelligence • HIPAA & ABDM Ready</span>
          <span>Department of Clinical Informatics</span>
        </footer>
      </main>
    </div>
  );
}

// Subcomponent: Detail Item
function Detail({ label, value }) {
  return (
    <div className="detail-item">
      <span>{label}</span>
      <strong>{value === null || value === undefined || value === "" ? "—" : String(value)}</strong>
    </div>
  );
}

export default App;
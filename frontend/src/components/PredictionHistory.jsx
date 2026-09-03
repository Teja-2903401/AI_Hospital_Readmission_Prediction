import { useEffect, useState, useMemo } from "react";
import axios from "axios";
import {
  History,
  Download,
  Search,
  RefreshCw,
  TrendingUp,
  AlertTriangle,
  CheckCircle2,
  AlertCircle,
  FileSpreadsheet,
  Building2,
  Calendar,
} from "lucide-react";

const API_URL = "http://127.0.0.1:8000";

function PredictionHistory({
  selectedAdmission,
  refreshTrigger,
}) {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [riskFilter, setRiskFilter] = useState("all");

  // Load predictions
  const loadAllHistory = async (risk = null) => {
    try {
      setLoading(true);
      setError("");

      let url = `${API_URL}/api/predictions/?limit=100`;
      if (risk && risk !== "all") {
        url += `&risk_level=${encodeURIComponent(risk)}`;
      }

      const response = await axios.get(url);
      setHistory(Array.isArray(response.data) ? response.data : []);
    } catch (err) {
      console.error("Prediction history error:", err);
      setError(
        err.response?.data?.detail || "Unable to load prediction history from backend."
      );
      setHistory([]);
    } finally {
      setLoading(false);
    }
  };

  const loadAdmissionHistory = async (admissionId) => {
    if (!admissionId) {
      await loadAllHistory();
      return;
    }

    try {
      setLoading(true);
      setError("");
      const response = await axios.get(
        `${API_URL}/api/predictions/admission/${encodeURIComponent(admissionId)}`
      );
      const predictions = response.data?.predictions;
      setHistory(Array.isArray(predictions) ? predictions : []);
    } catch (err) {
      console.error("Admission prediction history error:", err);
      setError(
        err.response?.data?.detail ||
          "Unable to load prediction history for this admission."
      );
      setHistory([]);
    } finally {
      setLoading(false);
    }
  };

  const loadHistory = async () => {
    const admissionId = selectedAdmission?.admission_id;
    if (admissionId) {
      await loadAdmissionHistory(admissionId);
    } else {
      await loadAllHistory(riskFilter);
    }
  };

  useEffect(() => {
    loadHistory();
  }, [selectedAdmission, refreshTrigger]);

  const handleRiskFilterChange = (risk) => {
    setRiskFilter(risk);
    if (!selectedAdmission) {
      loadAllHistory(risk);
    }
  };

  const formatDate = (dateValue) => {
    if (!dateValue) return "-";
    const date = new Date(dateValue);
    if (Number.isNaN(date.getTime())) return dateValue;
    return date.toLocaleString();
  };

  const getRiskClass = (risk) => {
    const value = String(risk).toLowerCase().trim();
    if (value === "low") return "risk-low";
    if (value === "high") return "risk-high";
    return "risk-medium";
  };

  // Client-side filtering for search & risk
  const filteredHistory = useMemo(() => {
    return history.filter((item) => {
      const query = search.toLowerCase();
      const matchesSearch =
        item.admission_id?.toLowerCase().includes(query) ||
        item.risk_level?.toLowerCase().includes(query) ||
        item.department_name?.toLowerCase().includes(query) ||
        item.diagnosis_type?.toLowerCase().includes(query) ||
        item.model_name?.toLowerCase().includes(query);

      const matchesRisk =
        riskFilter === "all"
          ? true
          : item.risk_level?.toLowerCase() === riskFilter.toLowerCase();

      return matchesSearch && matchesRisk;
    });
  }, [history, search, riskFilter]);

  // Download Prediction History CSV
  const handleDownloadCSV = () => {
    if (filteredHistory.length === 0) return;

    let csvContent = "data:text/csv;charset=utf-8,";
    csvContent += "ID,Admission ID,Risk Probability (%),Risk Level,Department,Diagnosis Category,ICU / Ward,Clinical Model,Timestamp\n";

    filteredHistory.forEach((item) => {
      csvContent += `${item.id},${item.admission_id},${item.probability_percent}%,${item.risk_level},"${item.department_name || "General Medicine"}","${item.primary_diag_category || "Standard"}","${item.ward_type || "General"}","${item.model_name || "Logistic Regression"}","${formatDate(item.created_at)}"\n`;
    });

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `hospital_prediction_history_${riskFilter}_risk.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const totalCount = history.length;
  const lowCount = history.filter((i) => i.risk_level?.toLowerCase() === "low").length;
  const medCount = history.filter((i) => i.risk_level?.toLowerCase() === "medium").length;
  const highCount = history.filter((i) => i.risk_level?.toLowerCase() === "high").length;

  return (
    <section className="dashboard-card page-card">
      <div className="card-header">
        <div>
          <p className="section-eyebrow">PREDICTIVE AUDIT TRAIL</p>
          <h2>
            {selectedAdmission
              ? `Prediction History — Admission ${selectedAdmission.admission_id}`
              : "Readmission Prediction History"}
          </h2>
          <p className="card-description">
            Complete database log of AI-generated 30-day readmission risk assessments.
          </p>
        </div>

        <div className="page-actions">
          <button
            className="secondary-button"
            onClick={loadHistory}
            disabled={loading}
          >
            <RefreshCw size={16} className={loading ? "spin" : ""} />
            Refresh
          </button>

          <button
            className="secondary-button"
            onClick={handleDownloadCSV}
            disabled={filteredHistory.length === 0}
          >
            <FileSpreadsheet size={16} />
            Export CSV
          </button>
        </div>
      </div>

      {error && (
        <div className="status-banner error">
          <AlertCircle size={18} />
          <span>{error}</span>
        </div>
      )}

      {/* Risk Metrics Quick Badges */}
      <div className="history-metric-strip">
        <div
          className={`metric-chip all ${riskFilter === "all" ? "active" : ""}`}
          onClick={() => handleRiskFilterChange("all")}
        >
          <TrendingUp size={16} />
          <span>All Records</span>
          <strong>{totalCount}</strong>
        </div>

        <div
          className={`metric-chip low ${riskFilter === "low" ? "active" : ""}`}
          onClick={() => handleRiskFilterChange("low")}
        >
          <CheckCircle2 size={16} />
          <span>Low Risk</span>
          <strong>{lowCount}</strong>
        </div>

        <div
          className={`metric-chip medium ${riskFilter === "medium" ? "active" : ""}`}
          onClick={() => handleRiskFilterChange("medium")}
        >
          <AlertTriangle size={16} />
          <span>Medium Risk</span>
          <strong>{medCount}</strong>
        </div>

        <div
          className={`metric-chip high ${riskFilter === "high" ? "active" : ""}`}
          onClick={() => handleRiskFilterChange("high")}
        >
          <AlertCircle size={16} />
          <span>High Risk</span>
          <strong>{highCount}</strong>
        </div>
      </div>

      {/* Search & Filter Toolbar */}
      <div className="management-filter-bar" style={{ marginTop: "16px" }}>
        <div className="search-input-group">
          <Search size={18} />
          <input
            type="search"
            placeholder="Search admission, department, diagnosis, or risk..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <div className="filter-pills">
          <button
            className={`filter-pill ${riskFilter === "all" ? "active" : ""}`}
            onClick={() => handleRiskFilterChange("all")}
          >
            All Risk ({totalCount})
          </button>
          <button
            className={`filter-pill low ${riskFilter === "low" ? "active" : ""}`}
            onClick={() => handleRiskFilterChange("low")}
          >
            🟢 Low Risk ({lowCount})
          </button>
          <button
            className={`filter-pill medium ${riskFilter === "medium" ? "active" : ""}`}
            onClick={() => handleRiskFilterChange("medium")}
          >
            🟡 Medium Risk ({medCount})
          </button>
          <button
            className={`filter-pill high ${riskFilter === "high" ? "active" : ""}`}
            onClick={() => handleRiskFilterChange("high")}
          >
            🔴 High Risk ({highCount})
          </button>
        </div>
      </div>

      {/* History Table (Version column removed) */}
      <div className="table-wrapper">
        <table className="history-table">
          <thead>
            <tr>
              <th>ID</th>
              <th>Admission</th>
              <th>Predicted Probability</th>
              <th>Risk Level</th>
              <th>Department</th>
              <th>Diagnosis / Category</th>
              <th>AI Model</th>
              <th>Assessment Date</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan="8" className="table-empty-cell">
                  Loading prediction history...
                </td>
              </tr>
            ) : filteredHistory.length === 0 ? (
              <tr>
                <td colSpan="8" className="table-empty-cell">
                  No prediction records found matching current criteria.
                </td>
              </tr>
            ) : (
              filteredHistory.map((prediction) => (
                <tr key={prediction.id}>
                  <td><strong>#{prediction.id}</strong></td>
                  <td>
                    <strong>{prediction.admission_id}</strong>
                  </td>
                  <td>
                    <strong style={{ fontSize: "15px" }}>
                      {Number(prediction.probability_percent).toFixed(2)}%
                    </strong>
                  </td>
                  <td>
                    <span className={`risk-badge ${getRiskClass(prediction.risk_level)}`}>
                      {prediction.risk_level}
                    </span>
                  </td>
                  <td>
                    <span className="dept-tag">
                      {prediction.department_name || "General Medicine"}
                    </span>
                  </td>
                  <td>
                    <div className="diag-category-cell">
                      <span>{prediction.diagnosis_type || prediction.primary_diag_category || "Clinical Assessment"}</span>
                      {prediction.primary_icd10 && (
                        <small className="icd10-code">ICD-10: {prediction.primary_icd10}</small>
                      )}
                    </div>
                  </td>
                  <td>{prediction.model_name || "Logistic Regression"}</td>
                  <td>{formatDate(prediction.created_at)}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
}

export default PredictionHistory;

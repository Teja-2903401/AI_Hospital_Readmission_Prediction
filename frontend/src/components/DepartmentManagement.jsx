import { useEffect, useState } from "react";
import axios from "axios";
import {
  Building2,
  Bed,
  Phone,
  UserCheck,
  Plus,
  RefreshCw,
  Edit3,
  Trash2,
  AlertCircle,
  CheckCircle2,
  X,
  Activity,
} from "lucide-react";

const API_URL = "http://127.0.0.1:8000";

function DepartmentManagement({ currentUser }) {
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const isAdmin = currentUser?.role === "admin";

  // Modal State
  const [showModal, setShowModal] = useState(false);
  const [editingDept, setEditingDept] = useState(null);
  const [formData, setFormData] = useState({
    name: "",
    code: "",
    head_doctor: "",
    total_beds: 50,
    occupied_beds: 0,
    contact_number: "",
    description: "",
  });
  const [modalLoading, setModalLoading] = useState(false);

  const loadDepartments = async () => {
    try {
      setLoading(true);
      setError("");
      const response = await axios.get(`${API_URL}/api/departments/`);
      setDepartments(Array.isArray(response.data) ? response.data : []);
    } catch (err) {
      console.error("Load departments error:", err);
      setError(
        err.response?.data?.detail || "Failed to load department records from backend."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDepartments();
  }, []);

  const openCreateModal = () => {
    setEditingDept(null);
    setFormData({
      name: "",
      code: "",
      head_doctor: "",
      total_beds: 50,
      occupied_beds: 0,
      contact_number: "",
      description: "",
    });
    setShowModal(true);
  };

  const openEditModal = (dept) => {
    setEditingDept(dept);
    setFormData({
      name: dept.name,
      code: dept.code,
      head_doctor: dept.head_doctor,
      total_beds: dept.total_beds,
      occupied_beds: dept.occupied_beds,
      contact_number: dept.contact_number || "",
      description: dept.description || "",
    });
    setShowModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setModalLoading(true);
    setError("");
    setSuccess("");

    try {
      if (editingDept) {
        await axios.put(`${API_URL}/api/departments/${editingDept.id}`, formData);
        setSuccess(`Department '${formData.name}' updated successfully.`);
      } else {
        await axios.post(`${API_URL}/api/departments/`, formData);
        setSuccess(`Department '${formData.name}' created successfully.`);
      }
      setShowModal(false);
      await loadDepartments();
    } catch (err) {
      console.error("Save department error:", err);
      setError(err.response?.data?.detail || "Failed to save department details.");
    } finally {
      setModalLoading(false);
    }
  };

  const handleDelete = async (dept) => {
    if (!window.confirm(`Are you sure you want to delete department '${dept.name}'?`)) {
      return;
    }
    try {
      setLoading(true);
      await axios.delete(`${API_URL}/api/departments/${dept.id}`);
      setSuccess(`Department '${dept.name}' deleted successfully.`);
      await loadDepartments();
    } catch (err) {
      console.error("Delete department error:", err);
      setError(err.response?.data?.detail || "Failed to delete department.");
    } finally {
      setLoading(false);
    }
  };

  // Hospital-wide Metrics
  const totalHospitalBeds = departments.reduce((acc, d) => acc + (d.total_beds || 0), 0);
  const totalOccupiedBeds = departments.reduce((acc, d) => acc + (d.occupied_beds || 0), 0);
  const overallOccupancy = totalHospitalBeds > 0 ? ((totalOccupiedBeds / totalHospitalBeds) * 100).toFixed(1) : 0;

  return (
    <div className="management-page-container">
      {/* Header */}
      <div className="management-header">
        <div>
          <p className="section-eyebrow">HOSPITAL OPERATIONS</p>
          <h2>Departments & Ward Capacities</h2>
          <p className="card-description">
            Monitor clinical departments, bed telemetry, specialist heads, and inpatient ward utilization.
          </p>
        </div>

        <div className="management-actions">
          <button className="secondary-button" onClick={loadDepartments} disabled={loading}>
            <RefreshCw size={16} className={loading ? "spin" : ""} />
            Refresh
          </button>

          {isAdmin && (
            <button className="primary-action-button" onClick={openCreateModal}>
              <Plus size={18} />
              + Add Department
            </button>
          )}
        </div>
      </div>

      {error && (
        <div className="status-banner error">
          <AlertCircle size={18} />
          <span>{error}</span>
        </div>
      )}

      {success && (
        <div className="status-banner success">
          <CheckCircle2 size={18} />
          <span>{success}</span>
        </div>
      )}

      {/* Hospital Bed Telemetry Summary Cards */}
      <div className="analytics-grid">
        <div className="analytics-card blue">
          <span>Active Departments</span>
          <strong>{departments.length}</strong>
          <small>Specialized clinical wings</small>
        </div>

        <div className="analytics-card purple">
          <span>Total Bed Capacity</span>
          <strong>{totalHospitalBeds}</strong>
          <small>Registered inpatient beds</small>
        </div>

        <div className="analytics-card amber">
          <span>Occupied Beds</span>
          <strong>{totalOccupiedBeds}</strong>
          <small>Currently admitted patients</small>
        </div>

        <div className="analytics-card green">
          <span>Available Beds</span>
          <strong>{totalHospitalBeds - totalOccupiedBeds}</strong>
          <small>Ready for intake</small>
        </div>

        <div className="analytics-card red">
          <span>Hospital Occupancy Rate</span>
          <strong>{overallOccupancy}%</strong>
          <small>Facility-wide utilization</small>
        </div>
      </div>

      {/* Departments Grid */}
      <div className="departments-cards-grid">
        {departments.map((dept) => {
          const occRate = dept.total_beds > 0 ? Math.round((dept.occupied_beds / dept.total_beds) * 100) : 0;
          const availableBeds = Math.max(0, dept.total_beds - dept.occupied_beds);

          return (
            <div key={dept.id} className="department-card">
              <div className="department-card-top">
                <div className="department-badge-code">{dept.code}</div>
                <div className="department-card-actions">
                  {isAdmin && (
                    <>
                      <button
                        className="dept-icon-btn edit"
                        title="Edit Department"
                        onClick={() => openEditModal(dept)}
                      >
                        <Edit3 size={15} />
                      </button>
                      <button
                        className="dept-icon-btn delete"
                        title="Delete Department"
                        onClick={() => handleDelete(dept)}
                      >
                        <Trash2 size={15} />
                      </button>
                    </>
                  )}
                </div>
              </div>

              <h3 className="department-title">{dept.name}</h3>

              <p className="department-desc">
                {dept.description || "General inpatient clinical and specialty care unit."}
              </p>

              <div className="department-meta-info">
                <div className="meta-row">
                  <UserCheck size={16} className="meta-icon" />
                  <span>
                    Head: <strong>{dept.head_doctor}</strong>
                  </span>
                </div>
                {dept.contact_number && (
                  <div className="meta-row">
                    <Phone size={16} className="meta-icon" />
                    <span>{dept.contact_number}</span>
                  </div>
                )}
              </div>

              {/* Bed Occupancy Meter */}
              <div className="bed-occupancy-section">
                <div className="bed-occupancy-labels">
                  <span>
                    <Bed size={15} /> Beds: <strong>{dept.occupied_beds} / {dept.total_beds}</strong>
                  </span>
                  <span className={`occ-rate-tag ${occRate > 85 ? "high" : occRate > 60 ? "medium" : "low"}`}>
                    {occRate}% Occupied
                  </span>
                </div>

                <div className="occupancy-progress-track">
                  <div
                    className={`occupancy-progress-bar ${occRate > 85 ? "high" : occRate > 60 ? "medium" : "low"}`}
                    style={{ width: `${Math.min(100, occRate)}%` }}
                  />
                </div>

                <div className="bed-availability-note">
                  <span>{availableBeds} beds currently available</span>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Create / Edit Department Modal */}
      {showModal && (
        <div className="modal-backdrop" onClick={() => !modalLoading && setShowModal(false)}>
          <div className="modal-card" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>{editingDept ? "Edit Department" : "Add New Department"}</h3>
              <button
                type="button"
                className="modal-close-btn"
                onClick={() => setShowModal(false)}
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="modal-form">
              <div className="modal-form-grid">
                <div className="form-group">
                  <label>Department Name *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Cardiology & Cardiovascular Medicine"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  />
                </div>

                <div className="form-group">
                  <label>Department Code *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. CARD, NEUR, ICU"
                    value={formData.code}
                    onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                  />
                </div>

                <div className="form-group">
                  <label>Head Doctor / Specialist *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Dr. Rajesh Sharma, MD"
                    value={formData.head_doctor}
                    onChange={(e) => setFormData({ ...formData, head_doctor: e.target.value })}
                  />
                </div>

                <div className="form-group">
                  <label>Contact Phone / Extension</label>
                  <input
                    type="text"
                    placeholder="e.g. +91 (080) 4120-1101"
                    value={formData.contact_number}
                    onChange={(e) => setFormData({ ...formData, contact_number: e.target.value })}
                  />
                </div>

                <div className="form-group">
                  <label>Total Beds Capacity *</label>
                  <input
                    type="number"
                    min="1"
                    required
                    value={formData.total_beds}
                    onChange={(e) => setFormData({ ...formData, total_beds: parseInt(e.target.value) || 0 })}
                  />
                </div>

                <div className="form-group">
                  <label>Currently Occupied Beds *</label>
                  <input
                    type="number"
                    min="0"
                    max={formData.total_beds}
                    required
                    value={formData.occupied_beds}
                    onChange={(e) => setFormData({ ...formData, occupied_beds: parseInt(e.target.value) || 0 })}
                  />
                </div>

                <div className="form-group full-width">
                  <label>Description & Specialties</label>
                  <textarea
                    rows="3"
                    placeholder="Describe clinical capabilities, ward equipment, and specialized treatments..."
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  />
                </div>
              </div>

              <div className="modal-footer">
                <button
                  type="button"
                  className="secondary-button"
                  onClick={() => setShowModal(false)}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="primary-action-button"
                  disabled={modalLoading}
                >
                  {modalLoading ? "Saving..." : editingDept ? "Update Department" : "Create Department"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default DepartmentManagement;

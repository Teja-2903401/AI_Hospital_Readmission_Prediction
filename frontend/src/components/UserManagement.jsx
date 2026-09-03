import { useEffect, useState } from "react";
import axios from "axios";
import {
  UserPlus,
  ShieldCheck,
  Stethoscope,
  Users,
  Search,
  Trash2,
  Edit2,
  CheckCircle2,
  XCircle,
  AlertCircle,
  RefreshCw,
  X,
} from "lucide-react";

const API_URL = "http://127.0.0.1:8000";

function UserManagement({ currentUser }) {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");

  // Modal State
  const [showModal, setShowModal] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [formData, setFormData] = useState({
    username: "",
    email: "",
    full_name: "",
    password: "",
    role: "hospital_staff",
    department: "General Medicine",
    designation: "",
    is_active: true,
  });
  const [modalLoading, setModalLoading] = useState(false);

  const loadUsers = async () => {
    try {
      setLoading(true);
      setError("");
      const response = await axios.get(`${API_URL}/api/users/`);
      setUsers(Array.isArray(response.data) ? response.data : []);
    } catch (err) {
      console.error("Load users error:", err);
      setError(
        err.response?.data?.detail || "Failed to load user accounts from backend."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadUsers();
  }, []);

  const openCreateModal = () => {
    setEditingUser(null);
    setFormData({
      username: "",
      email: "",
      full_name: "",
      password: "",
      role: "hospital_staff",
      department: "General Medicine",
      designation: "",
      is_active: true,
    });
    setShowModal(true);
  };

  const openEditModal = (user) => {
    setEditingUser(user);
    setFormData({
      username: user.username,
      email: user.email,
      full_name: user.full_name,
      password: "",
      role: user.role,
      department: user.department || "General Medicine",
      designation: user.designation || "",
      is_active: user.is_active,
    });
    setShowModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setModalLoading(true);
    setError("");
    setSuccess("");

    try {
      if (editingUser) {
        // Update user
        const payload = {
          full_name: formData.full_name,
          email: formData.email,
          role: formData.role,
          department: formData.department,
          designation: formData.designation,
          is_active: formData.is_active,
        };
        if (formData.password.trim()) {
          payload.password = formData.password.trim();
        }
        await axios.put(`${API_URL}/api/users/${editingUser.id}`, payload);
        setSuccess(`User '${formData.full_name}' updated successfully.`);
      } else {
        // Create user
        if (!formData.password.trim()) {
          setError("Password is required for new user creation.");
          setModalLoading(false);
          return;
        }
        await axios.post(`${API_URL}/api/users/`, formData);
        setSuccess(`User '${formData.full_name}' created successfully.`);
      }

      setShowModal(false);
      await loadUsers();
    } catch (err) {
      console.error("Save user error:", err);
      setError(err.response?.data?.detail || "Failed to save user record.");
    } finally {
      setModalLoading(false);
    }
  };

  const handleDeleteUser = async (user) => {
    if (user.username === "admin") {
      alert("The primary administrator account cannot be deleted.");
      return;
    }
    if (!window.confirm(`Are you sure you want to permanently delete user '${user.full_name}'?`)) {
      return;
    }

    try {
      setLoading(true);
      await axios.delete(`${API_URL}/api/users/${user.id}`);
      setSuccess(`User '${user.full_name}' deleted successfully.`);
      await loadUsers();
    } catch (err) {
      console.error("Delete user error:", err);
      setError(err.response?.data?.detail || "Failed to delete user.");
    } finally {
      setLoading(false);
    }
  };

  const filteredUsers = users.filter((u) => {
    const matchesSearch =
      u.full_name?.toLowerCase().includes(search.toLowerCase()) ||
      u.username?.toLowerCase().includes(search.toLowerCase()) ||
      u.email?.toLowerCase().includes(search.toLowerCase()) ||
      u.department?.toLowerCase().includes(search.toLowerCase());

    const matchesRole =
      roleFilter === "all" ? true : u.role === roleFilter;

    return matchesSearch && matchesRole;
  });

  const getRoleBadge = (role) => {
    switch (role) {
      case "admin":
        return (
          <span className="role-pill admin">
            <ShieldCheck size={14} /> Administrator
          </span>
        );
      case "doctor":
      case "medical_staff":
        return (
          <span className="role-pill doctor">
            <Stethoscope size={14} /> Doctor / Medical Staff
          </span>
        );
      default:
        return (
          <span className="role-pill staff">
            <Users size={14} /> Hospital Staff
          </span>
        );
    }
  };

  return (
    <div className="management-page-container">
      {/* Header */}
      <div className="management-header">
        <div>
          <p className="section-eyebrow">ADMINISTRATION</p>
          <h2>User & Role Management</h2>
          <p className="card-description">
            Manage system users, define role-based access privileges, and configure staff departments.
          </p>
        </div>

        <div className="management-actions">
          <button className="secondary-button" onClick={loadUsers} disabled={loading}>
            <RefreshCw size={16} className={loading ? "spin" : ""} />
            Refresh
          </button>

          <button className="primary-action-button" onClick={openCreateModal}>
            <UserPlus size={18} />
            + Add New User
          </button>
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

      {/* Filter and Search Bar */}
      <div className="management-filter-bar">
        <div className="search-input-group">
          <Search size={18} />
          <input
            type="search"
            placeholder="Search by name, username, email, department..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <div className="filter-pills">
          <button
            className={`filter-pill ${roleFilter === "all" ? "active" : ""}`}
            onClick={() => setRoleFilter("all")}
          >
            All Roles ({users.length})
          </button>
          <button
            className={`filter-pill ${roleFilter === "admin" ? "active" : ""}`}
            onClick={() => setRoleFilter("admin")}
          >
            Administrators ({users.filter((u) => u.role === "admin").length})
          </button>
          <button
            className={`filter-pill ${roleFilter === "doctor" ? "active" : ""}`}
            onClick={() => setRoleFilter("doctor")}
          >
            Doctors ({users.filter((u) => u.role === "doctor").length})
          </button>
          <button
            className={`filter-pill ${roleFilter === "hospital_staff" ? "active" : ""}`}
            onClick={() => setRoleFilter("hospital_staff")}
          >
            Hospital Staff ({users.filter((u) => u.role === "hospital_staff").length})
          </button>
        </div>
      </div>

      {/* Users Table */}
      <div className="table-wrapper">
        <table className="management-table">
          <thead>
            <tr>
              <th>ID</th>
              <th>Full Name & Username</th>
              <th>Email</th>
              <th>Role & Access Level</th>
              <th>Department / Designation</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredUsers.length === 0 ? (
              <tr>
                <td colSpan="7" className="table-empty-cell">
                  No users found matching current filters.
                </td>
              </tr>
            ) : (
              filteredUsers.map((user) => (
                <tr key={user.id}>
                  <td><strong>#{user.id}</strong></td>
                  <td>
                    <div className="user-name-cell">
                      <div className="user-avatar-initials">
                        {user.full_name?.charAt(0) || "U"}
                      </div>
                      <div>
                        <strong>{user.full_name}</strong>
                        <span className="user-handle">@{user.username}</span>
                      </div>
                    </div>
                  </td>
                  <td>{user.email}</td>
                  <td>{getRoleBadge(user.role)}</td>
                  <td>
                    <div className="dept-cell">
                      <strong>{user.department || "General"}</strong>
                      <small>{user.designation || "Staff Member"}</small>
                    </div>
                  </td>
                  <td>
                    {user.is_active ? (
                      <span className="status-badge-pill active">
                        <CheckCircle2 size={14} /> Active
                      </span>
                    ) : (
                      <span className="status-badge-pill inactive">
                        <XCircle size={14} /> Inactive
                      </span>
                    )}
                  </td>
                  <td>
                    <div className="action-buttons-group">
                      <button
                        className="table-action-btn edit"
                        title="Edit User"
                        onClick={() => openEditModal(user)}
                      >
                        <Edit2 size={15} />
                      </button>
                      {user.username !== "admin" && (
                        <button
                          className="table-action-btn delete"
                          title="Delete User"
                          onClick={() => handleDeleteUser(user)}
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

      {/* Create / Edit User Modal */}
      {showModal && (
        <div className="modal-backdrop" onClick={() => !modalLoading && setShowModal(false)}>
          <div className="modal-card" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>{editingUser ? "Edit User Account" : "Create New User"}</h3>
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
                  <label>Full Name *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Dr. Rajesh Sharma"
                    value={formData.full_name}
                    onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                  />
                </div>

                <div className="form-group">
                  <label>Username *</label>
                  <input
                    type="text"
                    required
                    disabled={!!editingUser}
                    placeholder="e.g. dr_sharma"
                    value={formData.username}
                    onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                  />
                </div>

                <div className="form-group">
                  <label>Email Address *</label>
                  <input
                    type="email"
                    required
                    placeholder="e.g. doctor@hospital.com"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  />
                </div>

                <div className="form-group">
                  <label>
                    {editingUser ? "Password (leave blank to keep unchanged)" : "Password *"}
                  </label>
                  <input
                    type="password"
                    required={!editingUser}
                    placeholder={editingUser ? "••••••••" : "Create password"}
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  />
                </div>

                <div className="form-group">
                  <label>System Role *</label>
                  <select
                    value={formData.role}
                    onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                  >
                    <option value="admin">Administrator (Full Access)</option>
                    <option value="doctor">Doctor / Medical Staff (Clinical & Prediction)</option>
                    <option value="hospital_staff">Hospital Staff (Admissions & Patients)</option>
                  </select>
                </div>

                <div className="form-group">
                  <label>Assigned Department</label>
                  <select
                    value={formData.department}
                    onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                  >
                    <option value="Cardiology & Cardiovascular Medicine">Cardiology</option>
                    <option value="Neurology & Stroke Center">Neurology</option>
                    <option value="Endocrinology & Diabetology">Endocrinology</option>
                    <option value="Pulmonology & Respiratory Care">Pulmonology</option>
                    <option value="Nephrology & Dialysis">Nephrology</option>
                    <option value="General Medicine">General Medicine</option>
                    <option value="Emergency & Trauma Care">Emergency</option>
                    <option value="Intensive Care Unit (ICU)">ICU</option>
                    <option value="Administration & Medical Directorship">Administration</option>
                    <option value="Patient Admissions & Records">Admissions Desk</option>
                  </select>
                </div>

                <div className="form-group">
                  <label>Designation / Title</label>
                  <input
                    type="text"
                    placeholder="e.g. Senior Consultant Cardiologist"
                    value={formData.designation}
                    onChange={(e) => setFormData({ ...formData, designation: e.target.value })}
                  />
                </div>

                <div className="form-group checkbox-group">
                  <label className="checkbox-label">
                    <input
                      type="checkbox"
                      checked={formData.is_active}
                      onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                    />
                    <span>Account Active (User can log in)</span>
                  </label>
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
                  {modalLoading ? "Saving..." : editingUser ? "Update User" : "Create User"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default UserManagement;

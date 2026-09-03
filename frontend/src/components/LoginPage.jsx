import { useState } from "react";
import axios from "axios";
import {
  ShieldCheck,
  Stethoscope,
  Building2,
  Users,
  Lock,
  Mail,
  ArrowRight,
  Sparkles,
  AlertCircle,
  Activity,
  HeartPulse,
} from "lucide-react";

const API_URL = "http://127.0.0.1:8000";

function LoginPage({ onLoginSuccess }) {
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleLogin = async (e, customIdentifier = null, customPassword = null) => {
    if (e && e.preventDefault) e.preventDefault();
    const loginId = customIdentifier !== null ? customIdentifier : identifier;
    const loginPass = customPassword !== null ? customPassword : password;

    if (!loginId.trim() || !loginPass.trim()) {
      setError("Please enter both username/email and password.");
      return;
    }

    try {
      setLoading(true);
      setError("");
      const response = await axios.post(`${API_URL}/api/auth/login`, {
        username_or_email: loginId.trim(),
        password: loginPass.trim(),
      });

      if (response.data?.success) {
        const userData = response.data.user;
        const token = response.data.token;
        const permissions = response.data.permissions;

        localStorage.setItem("hospital_user", JSON.stringify(userData));
        localStorage.setItem("hospital_token", token);
        localStorage.setItem("hospital_permissions", JSON.stringify(permissions));

        onLoginSuccess(userData, token, permissions);
      } else {
        setError(response.data?.message || "Login failed.");
      }
    } catch (err) {
      console.error("Login error:", err);
      setError(
        err.response?.data?.detail ||
          "Authentication failed. Please verify that the backend API is running."
      );
    } finally {
      setLoading(false);
    }
  };

  const handleQuickLogin = (roleIdentifier, rolePassword) => {
    setIdentifier(roleIdentifier);
    setPassword(rolePassword);
    handleLogin(null, roleIdentifier, rolePassword);
  };

  return (
    <div className="login-container">
      {/* Background Decorative Blobs */}
      <div className="login-bg-glow glow-1" />
      <div className="login-bg-glow glow-2" />

      <div className="login-card-wrapper">
        {/* Left Side: Hospital Branding & Info */}
        <div className="login-brand-panel">
          <div className="login-brand-header">
            <div className="login-brand-logo">
              <HeartPulse className="brand-icon-pulse" size={28} />
            </div>
            <div>
              <h1 className="login-brand-title">AI Hospital Readmission Prediction</h1>
              <p className="login-brand-subtitle">
                Clinical Readmission Intelligence Platform
              </p>
            </div>
          </div>

          <div className="login-brand-hero">
            <h2>Clinical Decision Support & Risk Stratification</h2>
            <p>
              AI-driven 30-day hospital readmission predictive modeling, clinical
              dossiers, and multi-department patient care management.
            </p>
          </div>

          <div className="login-features-list">
            <div className="feature-item">
              <div className="feature-icon">
                <Activity size={18} />
              </div>
              <div>
                <strong>Predictive Analytics</strong>
                <span>Instant 30-day readmission risk calculations</span>
              </div>
            </div>

            <div className="feature-item">
              <div className="feature-icon">
                <ShieldCheck size={18} />
              </div>
              <div>
                <strong>Role-Based Access Control</strong>
                <span>Audited administrative, clinical & intake privileges</span>
              </div>
            </div>

            <div className="feature-item">
              <div className="feature-icon">
                <Building2 size={18} />
              </div>
              <div>
                <strong>Department & Bed Operations</strong>
                <span>Real-time ward telemetry and capacity tracking</span>
              </div>
            </div>
          </div>

          <div className="login-footer-badge">
            <Sparkles size={16} />
            <span>Healthcare HIPAA & ABDM Compliant Analytics Engine</span>
          </div>
        </div>

        {/* Right Side: Login Form & Role Presets */}
        <div className="login-form-panel">
          <div className="login-form-header">
            <h2>Sign In to Medical Portal</h2>
            <p>Select your authorized role preset or enter credentials</p>
          </div>

          {/* Quick Demo Role Presets */}
          <div className="quick-roles-section">
            <p className="quick-roles-label">QUICK DEMO ONE-CLICK SIGN IN</p>
            <div className="quick-roles-grid">
              {/* Administrator */}
              <button
                type="button"
                className="role-preset-btn admin"
                onClick={() => handleQuickLogin("admin@hospital.com", "admin123")}
                disabled={loading}
              >
                <div className="role-preset-icon admin">
                  <ShieldCheck size={20} />
                </div>
                <div className="role-preset-info">
                  <div className="role-preset-title">Administrator</div>
                  <div className="role-preset-desc">
                    Admissions, Patients, Departments, Users
                  </div>
                </div>
                <div className="role-preset-badge">Full Access</div>
              </button>

              {/* Doctor / Medical Staff */}
              <button
                type="button"
                className="role-preset-btn doctor"
                onClick={() => handleQuickLogin("doctor@hospital.com", "doctor123")}
                disabled={loading}
              >
                <div className="role-preset-icon doctor">
                  <Stethoscope size={20} />
                </div>
                <div className="role-preset-info">
                  <div className="role-preset-title">Doctor / Medical Staff</div>
                  <div className="role-preset-desc">
                    View Patients, Predictions, Risk Analysis
                  </div>
                </div>
                <div className="role-preset-badge">Clinical</div>
              </button>

              {/* Hospital Staff */}
              <button
                type="button"
                className="role-preset-btn staff"
                onClick={() => handleQuickLogin("staff@hospital.com", "staff123")}
                disabled={loading}
              >
                <div className="role-preset-icon staff">
                  <Users size={20} />
                </div>
                <div className="role-preset-info">
                  <div className="role-preset-title">Hospital Staff</div>
                  <div className="role-preset-desc">
                    Manage Admissions & Patient Records
                  </div>
                </div>
                <div className="role-preset-badge">Operations</div>
              </button>
            </div>
          </div>

          <div className="login-divider">
            <span>or sign in with credentials</span>
          </div>

          {error && (
            <div className="login-error-alert">
              <AlertCircle size={18} />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleLogin} className="login-form">
            <div className="form-group">
              <label htmlFor="identifier">Username or Email</label>
              <div className="input-with-icon">
                <Mail className="input-icon" size={18} />
                <input
                  id="identifier"
                  type="text"
                  placeholder="e.g. admin@hospital.com or admin"
                  value={identifier}
                  onChange={(e) => setIdentifier(e.target.value)}
                  disabled={loading}
                  required
                />
              </div>
            </div>

            <div className="form-group">
              <label htmlFor="password">Password</label>
              <div className="input-with-icon">
                <Lock className="input-icon" size={18} />
                <input
                  id="password"
                  type="password"
                  placeholder="Enter password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={loading}
                  required
                />
              </div>
            </div>

            <button
              type="submit"
              className="login-submit-button"
              disabled={loading}
            >
              {loading ? (
                <span>Authenticating...</span>
              ) : (
                <>
                  <span>Sign In to System</span>
                  <ArrowRight size={18} />
                </>
              )}
            </button>
          </form>

          <div className="login-form-footer">
            <small>
              Demo credentials: <code>admin123</code> | <code>doctor123</code> | <code>staff123</code>
            </small>
          </div>
        </div>
      </div>
    </div>
  );
}

export default LoginPage;

# 🏥 AI-Powered Hospital Readmission Prediction & Clinical Intelligence Platform

[![Python](https://img.shields.io/badge/Python-3.10%2B-blue.svg?style=flat-square&logo=python)](https://www.python.org/)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.141.1-009688.svg?style=flat-square&logo=fastapi)](https://fastapi.tiangolo.com/)
[![React](https://img.shields.io/badge/React-19.0-61DAFB.svg?style=flat-square&logo=react)](https://react.dev/)
[![Vite](https://img.shields.io/badge/Vite-8.0-646CFF.svg?style=flat-square&logo=vite)](https://vitejs.dev/)
[![Scikit-Learn](https://img.shields.io/badge/scikit--learn-1.9.0-F7931E.svg?style=flat-square&logo=scikit-learn)](https://scikit-learn.org/)
[![MySQL](https://img.shields.io/badge/MySQL-8.0%2B-4479A1.svg?style=flat-square&logo=mysql)](https://www.mysql.com/)
[![License](https://img.shields.io/badge/License-MIT-green.svg?style=flat-square)](LICENSE)

An end-to-end clinical decision support platform that leverages ensemble Machine Learning models to predict the 30-day hospital readmission risk of patients at discharge. The system pairs high-precision predictive modeling with explainable AI insights, patient dossier tracking, department analytics, and role-based access control.

---

## 🌟 Key Features

### 🤖 Multi-Model Machine Learning Engine
- **Ensemble Algorithms**: Pre-trained and fine-tuned models including **Random Forest**, **Gradient Boosting**, **XGBoost**, **Logistic Regression**, and **Decision Trees**.
- **Pre-trained Pipeline**: Robust automated preprocessing (`preprocessor.joblib`) handling numerical scaling, categorical encoding, and dynamic imputation.
- **Risk Stratification**: Classifies readmission risk into **Low**, **Moderate**, **High**, and **Critical** risk tiers with confidence scores.
- **Explainable Clinical Factors**: Highlights top contributing risk factors (e.g., prior admissions, length of stay, comorbidities, lab counts, medication complexity) with personalized clinical intervention recommendations.

### 💻 Modern Interactive Frontend (React 19 + Vite)
- **Live Risk Assessment**: Dynamic form with real-time field validation and multi-model selector.
- **Visual Analytics**: Interactive risk gauge, probability breakdowns, and actionable medical recommendations.
- **Patient Dossier Modal**: Unified longitudinal history of patient vitals, admissions, and past risk assessments.
- **Admission & Inpatient Management**: Real-time management of active hospital admissions, discharge planning, and department tracking.
- **Role-Based Access Control (RBAC)**: Distinct permissions for **Admin**, **Doctor**, **Nurse**, and **Staff**.
- **Sleek Glassmorphic UI**: High-contrast, responsive clinical dashboard designed for modern medical workflows.

### ⚡ Enterprise FastAPI Backend
- **Asynchronous REST API**: High-throughput FastAPI endpoints with automatic Swagger/OpenAPI documentation.
- **Database ORM**: SQLAlchemy with MySQL, connection pooling, and automated schema seeding.
- **Auditing & History**: Persistent logging of all predictions for longitudinal patient monitoring and compliance.

---

## 🏗️ System Architecture

```
Ai_Hospital_Readmission_Prediction/
├── backend/
│   ├── app/
│   │   ├── api/                  # REST API route handlers
│   │   │   ├── admissions.py     # Admission management endpoints
│   │   │   ├── auth.py           # Authentication & login endpoints
│   │   │   ├── departments.py    # Hospital departments
│   │   │   ├── patients.py       # Patient registry & dossiers
│   │   │   ├── prediction.py     # ML prediction endpoint
│   │   │   ├── prediction_history.py # Audit trails & history
│   │   │   └── users.py          # User & role management
│   │   ├── database/             # Database connection & session
│   │   ├── schemas/              # Pydantic validation schemas
│   │   ├── services/             # Business logic & ML inference service
│   │   ├── database.py           # SQLAlchemy configuration
│   │   ├── main.py               # FastAPI application entrypoint
│   │   └── models.py             # SQLAlchemy ORM models
│   ├── scripts/                  # Data engineering & ML training scripts
│   │   ├── build_training_data.py
│   │   ├── train_models.py
│   │   ├── analyze_thresholds.py
│   │   ├── create_tables.py
│   │   └── test_prediction_service.py
│   ├── trained_models/           # Exported .joblib model artifacts
│   │   ├── random_forest.joblib
│   │   ├── xgboost.joblib
│   │   ├── gradient_boosting.joblib
│   │   ├── logistic_regression.joblib
│   │   ├── decision_tree.joblib
│   │   └── preprocessor.joblib
│   └── requirements.txt          # Python dependencies
│
├── frontend/
│   ├── src/
│   │   ├── assets/               # Icons and UI images
│   │   ├── components/           # Reusable React components
│   │   │   ├── AddAdmissionForm.jsx
│   │   │   ├── AdmissionManager.jsx
│   │   │   ├── DepartmentManagement.jsx
│   │   │   ├── LoginPage.jsx
│   │   │   ├── PatientDossierModal.jsx
│   │   │   ├── PredictionForm.jsx
│   │   │   ├── PredictionHistory.jsx
│   │   │   └── UserManagement.jsx
│   │   ├── services/             # Axios API client services
│   │   ├── App.jsx               # Main Dashboard & routing layout
│   │   ├── App.css
│   │   ├── index.css
│   │   └── main.jsx
│   ├── package.json              # Frontend dependencies & scripts
│   └── vite.config.js
│
├── data/                         # Datasets (Raw & Processed)
│   ├── admissions.csv
│   ├── billing.csv
│   ├── diagnoses.csv
│   ├── hospitals.csv
│   ├── patients.csv
│   └── processed/
│       └── admission_training_data.csv
│
├── notebooks/                    # Jupyter notebooks for EDA & research
├── requirements.txt              # Top-level dependencies
└── README.md
```

---

## 🚀 Quick Start Guide

### Prerequisites
- **Python 3.10+**
- **Node.js 18+** & **npm**
- **MySQL Server 8.0+**

---

### 1. Backend Setup

1. **Navigate to the backend directory**:
   ```bash
   cd backend
   ```

2. **Create and activate a virtual environment**:
   ```bash
   # Windows (PowerShell)
   python -m venv .venv
   .\.venv\Scripts\Activate.ps1

   # Linux / macOS
   python3 -m venv .venv
   source .venv/bin/activate
   ```

3. **Install Python dependencies**:
   ```bash
   pip install -r requirements.txt
   ```

4. **Configure Environment Variables**:
   Copy `.env.example` to `.env` and fill in your database credentials:
   ```bash
   cp .env.example .env
   ```
   Edit `.env`:
   ```env
   DB_USER=root
   DB_PASSWORD=your_mysql_password
   DB_HOST=localhost
   DB_PORT=3306
   DB_NAME=ai_hospital_readmission
   ```

5. **Initialize Database Tables & Seed Data**:
   Ensure MySQL is running, create the database `ai_hospital_readmission`, and run:
   ```bash
   python -m scripts.create_tables
   ```

6. **Start the FastAPI Server**:
   ```bash
   uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
   ```
   Interactive API documentation will be available at:
   - **Swagger UI**: [http://localhost:8000/docs](http://localhost:8000/docs)
   - **ReDoc**: [http://localhost:8000/redoc](http://localhost:8000/redoc)

---

### 2. Frontend Setup

1. **Navigate to the frontend directory**:
   ```bash
   cd ../frontend
   ```

2. **Install Node dependencies**:
   ```bash
   npm install
   ```

3. **Start the Vite Development Server**:
   ```bash
   npm run dev
   ```
   Open your browser at [http://localhost:5173](http://localhost:5173).

---

### 3. (Optional) Re-training Machine Learning Models

To re-process raw data and re-train all models:

```bash
cd backend
python -m scripts.build_training_data
python -m scripts.train_models
```

The updated `.joblib` model artifacts will be saved automatically to `backend/trained_models/`.

---

## 📊 Default Test Credentials

| Role | Username | Password | Access Level |
|---|---|---|---|
| **Admin** | `admin` | `admin123` | Full access (Users, Departments, Predictions, Admissions, History) |
| **Doctor** | `doctor` | `doctor123` | Predictions, Dossiers, Inpatient Admissions, History |
| **Nurse** | `nurse` | `nurse123` | Predictions, Patient Management, Inpatient Admissions |

---

## 📡 Key API Endpoints

| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/auth/login` | Authenticate user & retrieve session |
| `POST` | `/predict/` | Run ML readmission prediction on patient data |
| `GET` | `/patients/` | List all registered patients |
| `GET` | `/patients/{id}/dossier` | Retrieve full clinical dossier for a patient |
| `GET` | `/admissions/` | Get current & historical hospital admissions |
| `POST` | `/admissions/` | Record new hospital admission |
| `GET` | `/prediction-history/` | View historical predictions & audit log |
| `GET` | `/departments/` | List hospital departments & occupancy |
| `GET` | `/health` | API service health check |

---

## 🛡️ License

This project is licensed under the **MIT License**.

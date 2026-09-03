import hashlib
import hmac
import secrets
from typing import List, Dict, Any, Optional
from sqlalchemy.orm import Session
from app.models import User, Department


SECRET_SALT = "ai_hospital_readmission_secret_salt_2026"


def hash_password(password: str) -> str:
    """Hash password using SHA-256 with a salt."""
    salted = f"{SECRET_SALT}:{password}"
    return hashlib.sha256(salted.encode("utf-8")).hexdigest()


def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Verify password against hash."""
    return hmac.compare_digest(hash_password(plain_password), hashed_password)


def get_role_permissions(role: str) -> List[str]:
    """Return list of permissions for a role."""
    role = role.lower().strip()
    if role == "admin":
        return [
            "manage_admissions",
            "manage_patients",
            "manage_departments",
            "manage_users",
            "view_predictions",
            "run_predictions",
            "export_data",
            "delete_records",
            "admin_access",
        ]
    elif role in ["doctor", "medical_staff"]:
        return [
            "view_patients",
            "view_predictions",
            "run_predictions",
            "download_history",
            "view_departments",
            "export_data",
        ]
    elif role == "hospital_staff":
        return [
            "manage_admissions",
            "manage_patients",
            "view_predictions",
            "run_predictions",
            "download_history",
            "export_data",
        ]
    return ["view_patients", "view_predictions"]


def seed_default_users_and_departments(db: Session):
    """Seed initial demo users and hospital departments if they don't exist."""
    # 1. Seed Users
    default_users = [
        {
            "username": "admin",
            "email": "admin@hospital.com",
            "full_name": "Dr. Vikram Malhotra (Admin)",
            "password": "admin123",
            "role": "admin",
            "department": "Administration & Medical Directorship",
            "designation": "Chief Medical Administrator",
        },
        {
            "username": "doctor",
            "email": "doctor@hospital.com",
            "full_name": "Dr. Rajesh Sharma, MD",
            "password": "doctor123",
            "role": "doctor",
            "department": "Cardiology & Cardiovascular Medicine",
            "designation": "Senior Consultant Physician",
        },
        {
            "username": "staff",
            "email": "staff@hospital.com",
            "full_name": "Priya Patel",
            "password": "staff123",
            "role": "hospital_staff",
            "department": "Patient Admissions & Records",
            "designation": "Admission & Records Coordinator",
        },
    ]

    for u_data in default_users:
        existing = db.query(User).filter(
            (User.username == u_data["username"]) | (User.email == u_data["email"])
        ).first()
        if not existing:
            user = User(
                username=u_data["username"],
                email=u_data["email"],
                full_name=u_data["full_name"],
                password_hash=hash_password(u_data["password"]),
                role=u_data["role"],
                department=u_data["department"],
                designation=u_data["designation"],
                is_active=True,
            )
            db.add(user)

    # 2. Seed Departments
    default_departments = [
        {
            "name": "Cardiology & Cardiovascular Medicine",
            "code": "CARD",
            "head_doctor": "Dr. Rajesh Sharma, MD (Cardio)",
            "total_beds": 80,
            "occupied_beds": 62,
            "contact_number": "+91 (080) 4120-1101",
            "description": "Comprehensive cardiac care, cath lab, acute coronary care, and heart failure telemetry unit.",
        },
        {
            "name": "Neurology & Stroke Center",
            "code": "NEUR",
            "head_doctor": "Dr. Sunita Deshmukh, DM (Neuro)",
            "total_beds": 60,
            "occupied_beds": 44,
            "contact_number": "+91 (080) 4120-1102",
            "description": "Advanced acute stroke management, neuro-intensive care, epilepsy, and neurological rehabilitation.",
        },
        {
            "name": "Endocrinology & Diabetology",
            "code": "ENDO",
            "head_doctor": "Dr. Arvind Rao, MD, DNB",
            "total_beds": 45,
            "occupied_beds": 31,
            "contact_number": "+91 (080) 4120-1103",
            "description": "Specialized glycemic control, diabetic ketoacidosis stabilization, and metabolic disorder care.",
        },
        {
            "name": "Pulmonology & Respiratory Care",
            "code": "PULM",
            "head_doctor": "Dr. Kavita Menon, MD (Chest)",
            "total_beds": 50,
            "occupied_beds": 39,
            "contact_number": "+91 (080) 4120-1104",
            "description": "COPD exacerbation, acute asthma, pneumonia management, and respiratory therapy.",
        },
        {
            "name": "Nephrology & Dialysis",
            "code": "NEPH",
            "head_doctor": "Dr. Suresh Varma, DM (Nephro)",
            "total_beds": 40,
            "occupied_beds": 28,
            "contact_number": "+91 (080) 4120-1105",
            "description": "Renal replacement therapy, hemodialysis unit, and acute kidney injury management.",
        },
        {
            "name": "General Medicine",
            "code": "GEN",
            "head_doctor": "Dr. Ananya Roy, MD",
            "total_beds": 100,
            "occupied_beds": 75,
            "contact_number": "+91 (080) 4120-1106",
            "description": "Inpatient multi-system medical care, geriatric medicine, and infection control.",
        },
        {
            "name": "Emergency & Trauma Care",
            "code": "EMERG",
            "head_doctor": "Dr. Rohan Nambiar, MD (Emergency)",
            "total_beds": 50,
            "occupied_beds": 42,
            "contact_number": "+91 (080) 4120-1107",
            "description": "24/7 Level-1 Emergency triage, rapid resuscitation, and critical trauma management.",
        },
        {
            "name": "Intensive Care Unit (ICU)",
            "code": "ICU",
            "head_doctor": "Dr. Meenakshi Sundaram, MD (Crit Care)",
            "total_beds": 35,
            "occupied_beds": 30,
            "contact_number": "+91 (080) 4120-1108",
            "description": "High-dependency multi-organ support, mechanical ventilation, and continuous hemodynamic monitoring.",
        },
    ]

    for d_data in default_departments:
        existing_dept = db.query(Department).filter(
            (Department.name == d_data["name"]) | (Department.code == d_data["code"])
        ).first()
        if not existing_dept:
            dept = Department(
                name=d_data["name"],
                code=d_data["code"],
                head_doctor=d_data["head_doctor"],
                total_beds=d_data["total_beds"],
                occupied_beds=d_data["occupied_beds"],
                contact_number=d_data["contact_number"],
                description=d_data["description"],
            )
            db.add(dept)

    try:
        db.commit()
    except Exception as e:
        db.rollback()
        print(f"Warning during seed: {e}")

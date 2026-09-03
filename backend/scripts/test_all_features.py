import sys
from pathlib import Path

BACKEND_DIR = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(BACKEND_DIR))

from app.database import SessionLocal
from app.models import User, Department, Patient, Admission, Prediction
from app.services.auth_service import verify_password, get_role_permissions, seed_default_users_and_departments
from app.api.auth import login, LoginRequest
from app.api.users import get_all_users
from app.api.departments import get_all_departments
from app.api.patients import get_patient_full_history, get_patients
from app.api.prediction_history import list_predictions

print("=" * 70)
print("TESTING BACKEND AUTH, RBAC, USERS, DEPTS, PATIENTS, DOSSIER & RISK")
print("=" * 70)

db = SessionLocal()
try:
    # 1. Ensure seed
    seed_default_users_and_departments(db)
    print("[OK] Seed Default Users & Departments: OK")

    # 2. Administrator Login
    admin_res = login(LoginRequest(username_or_email="admin@hospital.com", password="admin123"), db=db)
    assert admin_res["success"] is True
    assert admin_res["user"].role == "admin"
    assert "manage_users" in admin_res["permissions"]
    assert "manage_departments" in admin_res["permissions"]
    print("[OK] Administrator Login & Permissions: OK (", admin_res["user"].full_name, ")")

    # 3. Doctor Login
    doc_res = login(LoginRequest(username_or_email="doctor@hospital.com", password="doctor123"), db=db)
    assert doc_res["success"] is True
    assert doc_res["user"].role == "doctor"
    assert "run_predictions" in doc_res["permissions"]
    assert "manage_users" not in doc_res["permissions"]
    print("[OK] Doctor / Medical Staff Login: OK (", doc_res["user"].full_name, ")")

    # 4. Hospital Staff Login
    staff_res = login(LoginRequest(username_or_email="staff@hospital.com", password="staff123"), db=db)
    assert staff_res["success"] is True
    assert staff_res["user"].role == "hospital_staff"
    assert "manage_admissions" in staff_res["permissions"]
    assert "manage_users" not in staff_res["permissions"]
    print("[OK] Hospital Staff Login: OK (", staff_res["user"].full_name, ")")

    # 5. User Management Listing
    users = get_all_users(db=db)
    assert len(users) >= 3
    print(f"[OK] User Management API: OK ({len(users)} users registered)")

    # 6. Departments Listing
    depts = get_all_departments(db=db)
    assert len(depts) >= 8
    print(f"[OK] Department Management API: OK ({len(depts)} departments registered)")

    # 7. Patients Listing
    patients_list = get_patients(db=db)
    assert len(patients_list) > 0
    p1 = patients_list[0]
    print(f"[OK] Patients Roster: OK ({len(patients_list)} patients registered)")

    # 8. Full Patient History Dossier
    dossier = get_patient_full_history(p1["patient_id"], db=db)
    assert "patient" in dossier
    assert "admissions" in dossier
    assert "predictions" in dossier
    print(f"[OK] Full Patient History Dossier (#{p1['patient_id']}): OK ({dossier['admissions_count']} admissions, {dossier['predictions_count']} predictions)")

    # 9. Risk Filtering on Prediction History
    all_preds = list_predictions(limit=100, risk_level="all", db=db)
    high_preds = list_predictions(limit=100, risk_level="High", db=db)
    low_preds = list_predictions(limit=100, risk_level="Low", db=db)
    med_preds = list_predictions(limit=100, risk_level="Medium", db=db)

    print(f"[OK] Risk Level Filtering: Total={len(all_preds)}, High={len(high_preds)}, Medium={len(med_preds)}, Low={len(low_preds)}")
    for hp in high_preds:
        assert hp["risk_level"].upper() == "HIGH"
    print("[OK] All High risk predictions correctly verified!")

    print("=" * 70)
    print("ALL BACKEND & INTEGRATION TESTS PASSED PERFECTLY!")
    print("=" * 70)

finally:
    db.close()

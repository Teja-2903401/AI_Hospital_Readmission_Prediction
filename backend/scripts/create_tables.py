import sys
from pathlib import Path

# Add backend directory to Python path
BACKEND_DIR = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(BACKEND_DIR))

from app.database import Base, engine, SessionLocal
from app.models import Patient, Admission, Prediction, User, Department
from app.services.auth_service import seed_default_users_and_departments

print("=" * 70)
print("CREATING DATABASE TABLES & SEEDING")
print("=" * 70)

try:
    Base.metadata.create_all(bind=engine)
    print("Database tables created successfully!")
    print()
    print("Tables:")
    print("  - patients")
    print("  - admissions")
    print("  - predictions")
    print("  - users")
    print("  - departments")

    db = SessionLocal()
    try:
        seed_default_users_and_departments(db)
        print("Default users and departments seeded successfully!")
    finally:
        db.close()

except Exception as e:
    print("Failed to create database tables.")
    print(f"Error: {e}")
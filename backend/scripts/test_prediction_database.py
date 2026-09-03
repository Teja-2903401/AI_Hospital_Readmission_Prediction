import sys
from pathlib import Path

# Add backend directory to Python path
BACKEND_DIR = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(BACKEND_DIR))

from sqlalchemy import text
from app.database import engine


print("=" * 70)
print("VERIFYING SAVED PREDICTIONS")
print("=" * 70)

try:

    with engine.connect() as connection:

        result = connection.execute(
            text("""
                SELECT
                    id,
                    admission_id,
                    probability,
                    risk_level,
                    model_name,
                    model_version,
                    created_at
                FROM predictions
                ORDER BY id DESC
                LIMIT 10
            """)
        )

        rows = result.fetchall()

        if not rows:

            print()
            print("No predictions found in database.")
            print()
            print("Run a successful prediction through")
            print("/api/predictions/predict first.")

        else:

            print()
            print(f"Found {len(rows)} recent prediction(s):")
            print()

            for row in rows:

                print(
                    f"ID: {row.id} | "
                    f"Admission: {row.admission_id} | "
                    f"Probability: {row.probability:.4f} | "
                    f"Risk: {row.risk_level} | "
                    f"Model: {row.model_name} | "
                    f"Version: {row.model_version} | "
                    f"Created: {row.created_at}"
                )

            print()
            print("Prediction database verification successful!")

except Exception as e:

    print()
    print("Database verification failed.")
    print(f"Error: {e}")
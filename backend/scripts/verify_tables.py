import sys
from pathlib import Path

# Add backend directory to Python path
BACKEND_DIR = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(BACKEND_DIR))

from sqlalchemy import text

from app.database import engine


print("=" * 70)
print("VERIFYING MYSQL DATABASE TABLES")
print("=" * 70)

try:

    with engine.connect() as connection:

        result = connection.execute(
            text("SHOW TABLES")
        )

        tables = [row[0] for row in result]

        print()
        print("Database tables found:")

        for table in tables:
            print(f"  - {table}")

        print()

        required_tables = {
            "patients",
            "admissions",
            "predictions",
        }

        missing_tables = required_tables - set(tables)

        if missing_tables:

            print("Missing tables:")

            for table in missing_tables:
                print(f"  - {table}")

        else:

            print("All required tables exist!")

            print()
            print("Database verification successful.")

except Exception as e:

    print("Database verification failed.")
    print(f"Error: {e}")
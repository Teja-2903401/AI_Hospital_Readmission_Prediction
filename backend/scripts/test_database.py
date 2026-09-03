import sys
from pathlib import Path

# Add backend directory to Python path
BACKEND_DIR = Path(__file__).resolve().parents[1]

sys.path.insert(0, str(BACKEND_DIR))


from sqlalchemy import text

from app.database import engine


print("=" * 70)
print("TESTING MYSQL DATABASE CONNECTION")
print("=" * 70)

try:

    with engine.connect() as connection:

        result = connection.execute(
            text("SELECT DATABASE()")
        )

        database_name = result.scalar()

        print("Database connection successful!")
        print(f"Connected database: {database_name}")

except Exception as e:

    print("Database connection failed.")
    print(f"Error: {e}")
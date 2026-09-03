from pathlib import Path
import pandas as pd


DATA_DIR = Path(__file__).resolve().parents[2] / "data"

FILES = [
    "patients.csv",
    "admissions.csv",
    "diagnoses.csv",
    "billing.csv",
    "hospitals.csv",
]


def inspect_file(filename):
    file_path = DATA_DIR / filename

    print("\n" + "=" * 80)
    print(f"FILE: {filename}")
    print("=" * 80)

    df = pd.read_csv(file_path)

    print(f"Rows: {len(df):,}")
    print(f"Columns: {len(df.columns)}")

    print("\nColumns:")
    for column in df.columns:
        print(f"  - {column}")

    print("\nData types:")
    print(df.dtypes)

    print("\nMissing values:")
    missing = df.isnull().sum()
    print(missing[missing > 0])

    print("\nFirst 3 rows:")
    print(df.head(3).to_string(index=False))


def main():
    print(f"Data directory: {DATA_DIR}")

    for filename in FILES:
        inspect_file(filename)


if __name__ == "__main__":
    main()
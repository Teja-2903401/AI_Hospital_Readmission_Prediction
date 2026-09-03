from pathlib import Path

import pandas as pd


DATA_DIR = Path(__file__).resolve().parents[2] / "data"
FILE_PATH = DATA_DIR / "processed" / "admission_training_data.csv"


def main():
    print("=" * 70)
    print("TIME-BASED DATASET ANALYSIS")
    print("=" * 70)

    df = pd.read_csv(FILE_PATH)

    df["admit_date"] = pd.to_datetime(df["admit_date"])

    df["year"] = df["admit_date"].dt.year

    yearly = (
        df.groupby("year")
        .agg(
            admissions=("admission_id", "count"),
            readmissions=("readmitted_30d", "sum"),
            readmission_rate=("readmitted_30d", "mean"),
        )
        .reset_index()
    )

    yearly["readmission_rate"] = (
        yearly["readmission_rate"] * 100
    ).round(2)

    print("\nAdmissions and readmissions by year:\n")

    print(yearly.to_string(index=False))

    print("\n" + "=" * 70)

    train = df[df["year"] <= 2023]
    test = df[df["year"] == 2024]

    print("PROPOSED TIME SPLIT")
    print("=" * 70)

    print("\nTraining period: 2015–2023")
    print(f"Training rows: {len(train):,}")
    print(
        f"Training readmissions: "
        f"{train['readmitted_30d'].sum():,}"
    )

    print("\nTesting period: 2024")
    print(f"Testing rows: {len(test):,}")
    print(
        f"Testing readmissions: "
        f"{test['readmitted_30d'].sum():,}"
    )

    print("\nTraining readmission rate:")
    print(
        f"{train['readmitted_30d'].mean() * 100:.2f}%"
    )

    print("\nTesting readmission rate:")
    print(
        f"{test['readmitted_30d'].mean() * 100:.2f}%"
    )

    print("\n" + "=" * 70)


if __name__ == "__main__":
    main()
from pathlib import Path
import pandas as pd


DATA_DIR = Path(__file__).resolve().parents[2] / "data"


def main():
    patients = pd.read_csv(DATA_DIR / "patients.csv")
    admissions = pd.read_csv(DATA_DIR / "admissions.csv")
    diagnoses = pd.read_csv(DATA_DIR / "diagnoses.csv")
    billing = pd.read_csv(DATA_DIR / "billing.csv")
    hospitals = pd.read_csv(DATA_DIR / "hospitals.csv")

    print("\n" + "=" * 70)
    print("DATASET VALIDATION")
    print("=" * 70)

    # Target distribution
    print("\n1. 30-DAY READMISSION DISTRIBUTION")
    print(admissions["readmitted_30d"].value_counts())
    print("\nPercentage:")
    print(
        admissions["readmitted_30d"]
        .value_counts(normalize=True)
        .mul(100)
        .round(2)
    )

    # Date range
    admissions["admit_date"] = pd.to_datetime(admissions["admit_date"])
    admissions["discharge_date"] = pd.to_datetime(
        admissions["discharge_date"]
    )

    print("\n2. ADMISSION DATE RANGE")
    print("Earliest:", admissions["admit_date"].min())
    print("Latest:", admissions["admit_date"].max())

    # Duplicate primary keys
    print("\n3. DUPLICATE PRIMARY KEYS")

    print(
        "Patient IDs:",
        patients["patient_id"].duplicated().sum()
    )

    print(
        "Admission IDs:",
        admissions["admission_id"].duplicated().sum()
    )

    print(
        "Diagnosis IDs:",
        diagnoses["diag_id"].duplicated().sum()
    )

    print(
        "Billing IDs:",
        billing["bill_id"].duplicated().sum()
    )

    print(
        "Hospital IDs:",
        hospitals["hospital_id"].duplicated().sum()
    )

    # Relationships
    print("\n4. RELATIONSHIP CHECKS")

    print(
        "Admissions without patient:",
        (~admissions["patient_id"].isin(
            patients["patient_id"]
        )).sum()
    )

    print(
        "Admissions without hospital:",
        (~admissions["hospital_id"].isin(
            hospitals["hospital_id"]
        )).sum()
    )

    print(
        "Diagnoses without admission:",
        (~diagnoses["admission_id"].isin(
            admissions["admission_id"]
        )).sum()
    )

    print(
        "Bills without admission:",
        (~billing["admission_id"].isin(
            admissions["admission_id"]
        )).sum()
    )

    # Diagnoses per admission
    diagnosis_counts = diagnoses.groupby(
        "admission_id"
    ).size()

    print("\n5. DIAGNOSES PER ADMISSION")
    print(diagnosis_counts.describe())

    print("\nAdmissions with no diagnosis:")
    print(
        len(
            admissions[
                ~admissions["admission_id"].isin(
                    diagnoses["admission_id"]
                )
            ]
        )
    )

    # Categorical information
    print("\n6. IMPORTANT CATEGORICAL VALUES")

    print("\nGender:")
    print(patients["gender"].value_counts())

    print("\nAdmission type:")
    print(admissions["admit_type"].value_counts())

    print("\nWard type:")
    print(admissions["ward_type"].value_counts())

    print("\nDischarge type:")
    print(admissions["discharge_type"].value_counts())

    print("\nHospital tier:")
    print(hospitals["tier"].value_counts())

    print("\n" + "=" * 70)
    print("VALIDATION COMPLETE")
    print("=" * 70)


if __name__ == "__main__":
    main()
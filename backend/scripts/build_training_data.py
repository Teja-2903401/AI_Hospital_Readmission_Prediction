from pathlib import Path

import pandas as pd


DATA_DIR = Path(__file__).resolve().parents[2] / "data"
OUTPUT_DIR = DATA_DIR / "processed"


def load_data():
    print("Loading datasets...")

    patients = pd.read_csv(DATA_DIR / "patients.csv")
    admissions = pd.read_csv(DATA_DIR / "admissions.csv")
    diagnoses = pd.read_csv(DATA_DIR / "diagnoses.csv")
    billing = pd.read_csv(DATA_DIR / "billing.csv")
    hospitals = pd.read_csv(DATA_DIR / "hospitals.csv")

    return patients, admissions, diagnoses, billing, hospitals


def prepare_diagnoses(diagnoses):
    print("Aggregating diagnoses...")

    diagnosis_features = (
        diagnoses.groupby("admission_id")
        .agg(
            num_diagnoses=("diag_id", "count"),
            num_diagnosis_categories=("diag_category", "nunique"),
            primary_icd10=("icd10_code", "first"),
            primary_diagnosis=("diag_desc", "first"),
            primary_diag_category=("diag_category", "first"),
        )
        .reset_index()
    )

    return diagnosis_features


def prepare_hospitals(hospitals):
    print("Preparing hospital features...")

    hospital_features = hospitals[
        [
            "hospital_id",
            "tier",
            "beds",
            "teaching",
        ]
    ].copy()

    return hospital_features


def prepare_billing(billing):
    print("Preparing billing features...")

    billing_features = billing[
        [
            "admission_id",
            "total_cost_inr",
            "govt_subsidy_inr",
            "out_of_pocket_inr",
            "cost_category",
        ]
    ].copy()

    return billing_features


def build_dataset():
    patients, admissions, diagnoses, billing, hospitals = load_data()

    diagnosis_features = prepare_diagnoses(diagnoses)
    hospital_features = prepare_hospitals(hospitals)
    billing_features = prepare_billing(billing)

    print("Joining patient information...")

    dataset = admissions.merge(
        patients,
        on="patient_id",
        how="left",
        validate="many_to_one",
    )

    print("Joining diagnosis information...")

    dataset = dataset.merge(
        diagnosis_features,
        on="admission_id",
        how="left",
        validate="one_to_one",
    )

    print("Joining hospital information...")

    dataset = dataset.merge(
        hospital_features,
        on="hospital_id",
        how="left",
        validate="many_to_one",
    )

    print("Joining billing information...")

    dataset = dataset.merge(
        billing_features,
        on="admission_id",
        how="left",
        validate="one_to_one",
    )

    return dataset


def main():
    print("=" * 70)
    print("BUILDING ML TRAINING DATASET")
    print("=" * 70)

    dataset = build_dataset()

    print("\nFinal dataset shape:")
    print(dataset.shape)

    print("\nMissing values:")
    missing = dataset.isnull().sum()
    print(missing[missing > 0])

    print("\nTarget distribution:")
    print(dataset["readmitted_30d"].value_counts())

    print("\nTarget percentage:")
    print(
        dataset["readmitted_30d"]
        .value_counts(normalize=True)
        .mul(100)
        .round(2)
    )

    OUTPUT_DIR.mkdir(parents=True, exist_ok=True)

    output_file = OUTPUT_DIR / "admission_training_data.csv"

    dataset.to_csv(output_file, index=False)

    print("\nSaved:")
    print(output_file)

    print("\nFinal columns:")
    for column in dataset.columns:
        print(f"  - {column}")

    print("\n" + "=" * 70)
    print("TRAINING DATASET CREATED")
    print("=" * 70)


if __name__ == "__main__":
    main()
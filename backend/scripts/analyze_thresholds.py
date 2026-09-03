from pathlib import Path

import joblib
import pandas as pd

from sklearn.metrics import (
    confusion_matrix,
    precision_score,
    recall_score,
    f1_score,
)


DATA_DIR = Path(__file__).resolve().parents[2] / "data"

MODEL_PATH = (
    Path(__file__).resolve().parents[1]
    / "trained_models"
    / "logistic_regression.joblib"
)

DATASET_PATH = (
    DATA_DIR
    / "processed"
    / "admission_training_data.csv"
)


NUMERICAL_FEATURES = [
    "age",
    "los_days",
    "num_procedures",
    "charlson_index",
    "hba1c",
    "creatinine",
    "haemoglobin",
    "systolic_bp",
    "comorbidity_count",
    "prev_admissions",
    "num_diagnoses",
    "num_diagnosis_categories",
    "beds",
    "total_cost_inr",
    "govt_subsidy_inr",
    "out_of_pocket_inr",
]


CATEGORICAL_FEATURES = [
    "gender",
    "state",
    "insurance_type",
    "admit_type",
    "ward_type",
    "discharge_type",
    "primary_icd10",
    "primary_diag_category",
    "tier",
    "teaching",
    "cost_category",
]


TARGET = "readmitted_30d"


def main():

    print("=" * 70)
    print("READMISSION RISK THRESHOLD ANALYSIS")
    print("=" * 70)

    print("\nLoading dataset...")

    df = pd.read_csv(DATASET_PATH)

    df["admit_date"] = pd.to_datetime(
        df["admit_date"]
    )

    test_df = df[
        df["admit_date"].dt.year == 2024
    ].copy()

    features = (
        NUMERICAL_FEATURES
        + CATEGORICAL_FEATURES
    )

    X_test = test_df[features]

    y_test = test_df[TARGET]

    print(
        f"\nTest records: {len(test_df):,}"
    )

    print("\nLoading Logistic Regression model...")

    model = joblib.load(MODEL_PATH)

    probabilities = model.predict_proba(
        X_test
    )[:, 1]

    test_df["probability"] = probabilities

    print("\nProbability distribution:")

    print(
        test_df["probability"].describe()
    )

    print("\n" + "=" * 70)
    print("THRESHOLD COMPARISON")
    print("=" * 70)

    thresholds = [
        0.20,
        0.25,
        0.30,
        0.35,
        0.40,
        0.45,
        0.50,
        0.55,
        0.60,
    ]

    results = []

    for threshold in thresholds:

        predictions = (
            probabilities >= threshold
        ).astype(int)

        precision = precision_score(
            y_test,
            predictions,
            zero_division=0,
        )

        recall = recall_score(
            y_test,
            predictions,
            zero_division=0,
        )

        f1 = f1_score(
            y_test,
            predictions,
            zero_division=0,
        )

        tn, fp, fn, tp = confusion_matrix(
            y_test,
            predictions,
        ).ravel()

        results.append(
            {
                "threshold": threshold,
                "precision": precision,
                "recall": recall,
                "f1": f1,
                "true_positives": tp,
                "false_positives": fp,
                "false_negatives": fn,
            }
        )

    results_df = pd.DataFrame(
        results
    )

    print(
        results_df.to_string(
            index=False,
            float_format=lambda x: f"{x:.4f}",
        )
    )

    print("\n" + "=" * 70)
    print("THRESHOLD ANALYSIS COMPLETE")
    print("=" * 70)


if __name__ == "__main__":
    main()
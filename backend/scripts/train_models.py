import sys
from pathlib import Path

# ============================================================
# ADD BACKEND DIRECTORY TO PYTHON PATH
# ============================================================

BACKEND_DIR = Path(__file__).resolve().parents[1]

sys.path.insert(0, str(BACKEND_DIR))


import joblib
import pandas as pd

from sklearn.compose import ColumnTransformer
from sklearn.impute import SimpleImputer
from sklearn.linear_model import LogisticRegression
from sklearn.metrics import (
    accuracy_score,
    classification_report,
    confusion_matrix,
    f1_score,
    precision_score,
    recall_score,
    roc_auc_score,
)
from sklearn.pipeline import Pipeline
from sklearn.preprocessing import OneHotEncoder, StandardScaler


# ============================================================
# PATHS
# ============================================================

PROJECT_DIR = BACKEND_DIR.parent

DATA_PATH = (
    PROJECT_DIR
    / "data"
    / "processed"
    / "admission_training_data.csv"
)

MODEL_DIR = (
    BACKEND_DIR
    / "trained_models"
)

MODEL_DIR.mkdir(
    parents=True,
    exist_ok=True
)


PREPROCESSOR_PATH = (
    MODEL_DIR
    / "preprocessor.joblib"
)

MODEL_PATH = (
    MODEL_DIR
    / "logistic_regression.joblib"
)


# ============================================================
# CONFIGURATION
# ============================================================

TARGET_COLUMN = "readmitted_30d"

# ------------------------------------------------------------
# LIVE PREDICTION FEATURES
#
# These are features that we want the web application
# to provide to the ML model.
# ------------------------------------------------------------

FEATURE_COLUMNS = [

    # --------------------------------------------------------
    # PATIENT FEATURES
    # --------------------------------------------------------

    "age",
    "gender",
    "state",
    "bpl_card",
    "insurance_type",
    "comorbidity_count",
    "prev_admissions",

    # --------------------------------------------------------
    # CLINICAL / ADMISSION FEATURES
    # --------------------------------------------------------

    "los_days",
    "admit_type",
    "ward_type",
    "num_procedures",
    "charlson_index",
    "hba1c",
    "creatinine",
    "haemoglobin",
    "systolic_bp",

    # --------------------------------------------------------
    # DIAGNOSIS FEATURES
    # --------------------------------------------------------

    "num_diagnoses",
    "num_diagnosis_categories",
    "primary_icd10",
    "primary_diag_category",

    # --------------------------------------------------------
    # HOSPITAL FEATURES
    # --------------------------------------------------------

    "tier",
    "beds",
    "teaching",
]


# ============================================================
# LOAD DATA
# ============================================================

print("=" * 70)
print("LOGISTIC REGRESSION - FINAL PRIMARY MODEL")
print("=" * 70)

print()
print("Loading training dataset...")

df = pd.read_csv(
    DATA_PATH
)

print(
    f"Dataset shape: {df.shape}"
)


# ============================================================
# VALIDATE REQUIRED COLUMNS
# ============================================================

required_columns = (
    FEATURE_COLUMNS
    + [TARGET_COLUMN]
)

missing_columns = [
    column
    for column in required_columns
    if column not in df.columns
]

if missing_columns:

    print()
    print("ERROR: Required columns are missing:")

    for column in missing_columns:
        print(f"  - {column}")

    sys.exit(1)


# ============================================================
# CONVERT DATE
# ============================================================

df["admit_date"] = pd.to_datetime(
    df["admit_date"],
    errors="coerce"
)


# ============================================================
# TIME-BASED SPLIT
#
# 2015-2023 = Training
# 2024       = Testing
# ============================================================

train_df = df[
    df["admit_date"].dt.year <= 2023
].copy()

test_df = df[
    df["admit_date"].dt.year == 2024
].copy()


print()
print("Training rows:", len(train_df))
print("Testing rows:", len(test_df))


# ============================================================
# FEATURES AND TARGET
# ============================================================

X_train = train_df[
    FEATURE_COLUMNS
].copy()

y_train = train_df[
    TARGET_COLUMN
].copy()

X_test = test_df[
    FEATURE_COLUMNS
].copy()

y_test = test_df[
    TARGET_COLUMN
].copy()


print()
print("Training target:")
print(
    y_train.value_counts()
)

print()
print("Testing target:")
print(
    y_test.value_counts()
)


# ============================================================
# IDENTIFY NUMERICAL AND CATEGORICAL FEATURES
# ============================================================

NUMERICAL_FEATURES = [

    "age",
    "comorbidity_count",
    "prev_admissions",
    "los_days",
    "num_procedures",
    "charlson_index",
    "hba1c",
    "creatinine",
    "haemoglobin",
    "systolic_bp",
    "num_diagnoses",
    "num_diagnosis_categories",
    "beds",
]


CATEGORICAL_FEATURES = [

    "gender",
    "state",
    "bpl_card",
    "insurance_type",
    "admit_type",
    "ward_type",
    "primary_icd10",
    "primary_diag_category",
    "tier",
    "teaching",
]


# ============================================================
# NUMERICAL PREPROCESSING
# ============================================================

numerical_pipeline = Pipeline(
    steps=[

        (
            "imputer",
            SimpleImputer(
                strategy="median"
            )
        ),

        (
            "scaler",
            StandardScaler()
        ),

    ]
)


# ============================================================
# CATEGORICAL PREPROCESSING
# ============================================================

categorical_pipeline = Pipeline(
    steps=[

        (
            "imputer",
            SimpleImputer(
                strategy="most_frequent"
            )
        ),

        (
            "onehot",
            OneHotEncoder(
                handle_unknown="ignore"
            )
        ),

    ]
)


# ============================================================
# COMBINED PREPROCESSOR
# ============================================================

preprocessor = ColumnTransformer(

    transformers=[

        (
            "numerical",
            numerical_pipeline,
            NUMERICAL_FEATURES
        ),

        (
            "categorical",
            categorical_pipeline,
            CATEGORICAL_FEATURES
        ),

    ]
)


# ============================================================
# FIT PREPROCESSOR
# ============================================================

print()
print("Fitting preprocessing pipeline...")

X_train_processed = preprocessor.fit_transform(
    X_train
)

X_test_processed = preprocessor.transform(
    X_test
)


print()
print(
    "Processed training shape:",
    X_train_processed.shape
)

print(
    "Processed testing shape:",
    X_test_processed.shape
)


# ============================================================
# SAVE PREPROCESSOR
# ============================================================

joblib.dump(
    preprocessor,
    PREPROCESSOR_PATH
)

print()
print("Preprocessor saved:")
print(
    PREPROCESSOR_PATH
)


# ============================================================
# TRAIN LOGISTIC REGRESSION
# ============================================================

print()
print("=" * 70)
print("TRAINING LOGISTIC REGRESSION")
print("=" * 70)

print()
print("Training Logistic Regression...")

model = LogisticRegression(

    max_iter=2000,

    class_weight="balanced",

    random_state=42
)


model.fit(
    X_train_processed,
    y_train
)

print(
    "Training complete."
)


# ============================================================
# PREDICTIONS
# ============================================================

y_pred = model.predict(
    X_test_processed
)

y_probability = model.predict_proba(
    X_test_processed
)[:, 1]


# ============================================================
# PERFORMANCE METRICS
# ============================================================

accuracy = accuracy_score(
    y_test,
    y_pred
)

precision = precision_score(
    y_test,
    y_pred,
    zero_division=0
)

recall = recall_score(
    y_test,
    y_pred,
    zero_division=0
)

f1 = f1_score(
    y_test,
    y_pred,
    zero_division=0
)

roc_auc = roc_auc_score(
    y_test,
    y_probability
)


# ============================================================
# DISPLAY PERFORMANCE
# ============================================================

print()
print("=" * 70)
print("MODEL PERFORMANCE")
print("=" * 70)

print()
print(
    f"Accuracy: {accuracy:.4f}"
)

print(
    f"Precision: {precision:.4f}"
)

print(
    f"Recall: {recall:.4f}"
)

print(
    f"F1 Score: {f1:.4f}"
)

print(
    f"ROC-AUC: {roc_auc:.4f}"
)


print()
print("Confusion Matrix:")

print(
    confusion_matrix(
        y_test,
        y_pred
    )
)


print()
print("Classification Report:")

print(
    classification_report(
        y_test,
        y_pred,
        zero_division=0
    )
)


# ============================================================
# SAVE MODEL
# ============================================================

joblib.dump(
    model,
    MODEL_PATH
)

print()
print("Model saved:")

print(
    MODEL_PATH
)


# ============================================================
# FINAL SUMMARY
# ============================================================

print()
print("=" * 70)
print("FINAL LOGISTIC REGRESSION MODEL READY")
print("=" * 70)

print()
print("Features used:")
for feature in FEATURE_COLUMNS:
    print(f"  - {feature}")

print()
print(
    "Total features before preprocessing:",
    len(FEATURE_COLUMNS)
)

print()
print(
    "Training period: 2015-2023"
)

print(
    "Testing period: 2024"
)

print()
print("Model:")
print("  Logistic Regression")

print()
print("Preprocessor:")
print("  Saved successfully")

print()
print("Model:")
print("  Saved successfully")

print()
print("=" * 70)
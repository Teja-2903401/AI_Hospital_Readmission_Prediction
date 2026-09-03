
from datetime import datetime

from sqlalchemy import (
    Boolean,
    DateTime,
    Float,
    ForeignKey,
    Integer,
    String,
    Text,
)
from sqlalchemy.orm import (
    Mapped,
    mapped_column,
    relationship,
)

from app.database import Base


# ============================================================
# PATIENT MODEL
# ============================================================

class Patient(Base):

    __tablename__ = "patients"

    # --------------------------------------------------------
    # PRIMARY KEY
    # --------------------------------------------------------

    id: Mapped[int] = mapped_column(
        Integer,
        primary_key=True,
        index=True,
    )

    # --------------------------------------------------------
    # PATIENT IDENTIFIER
    # --------------------------------------------------------

    patient_id: Mapped[str] = mapped_column(
        String(100),
        unique=True,
        index=True,
        nullable=False,
    )

    # --------------------------------------------------------
    # PATIENT INFORMATION
    # --------------------------------------------------------

    age: Mapped[int] = mapped_column(
        Integer,
        nullable=False,
    )

    gender: Mapped[str] = mapped_column(
        String(20),
        nullable=False,
    )

    state: Mapped[str] = mapped_column(
        String(100),
        nullable=False,
    )

    bpl_card: Mapped[bool] = mapped_column(
        Boolean,
        default=False,
        nullable=False,
    )

    insurance_type: Mapped[str | None] = mapped_column(
        String(50),
        nullable=True,
    )

    comorbidity_count: Mapped[int] = mapped_column(
        Integer,
        default=0,
        nullable=False,
    )

    prev_admissions: Mapped[int] = mapped_column(
        Integer,
        default=0,
        nullable=False,
    )

    # --------------------------------------------------------
    # CREATED TIME
    # --------------------------------------------------------

    created_at: Mapped[datetime] = mapped_column(
        DateTime,
        default=datetime.utcnow,
        nullable=False,
    )

    # --------------------------------------------------------
    # RELATIONSHIP
    # Patient -> Admissions
    # --------------------------------------------------------

    admissions = relationship(
        "Admission",
        back_populates="patient",
        cascade="all, delete-orphan",
    )


# ============================================================
# ADMISSION MODEL
# ============================================================

class Admission(Base):

    __tablename__ = "admissions"

    # --------------------------------------------------------
    # PRIMARY KEY
    # --------------------------------------------------------

    id: Mapped[int] = mapped_column(
        Integer,
        primary_key=True,
        index=True,
    )

    # --------------------------------------------------------
    # USER-FACING ADMISSION ID
    #
    # Example:
    # A10025
    # A10026
    # A10027
    # --------------------------------------------------------

    admission_id: Mapped[str] = mapped_column(
        String(100),
        unique=True,
        index=True,
        nullable=False,
    )

    # --------------------------------------------------------
    # PATIENT FOREIGN KEY
    #
    # admissions.patient_id
    #        ↓
    # patients.id
    # --------------------------------------------------------

    patient_id: Mapped[int] = mapped_column(
        ForeignKey("patients.id"),
        nullable=False,
        index=True,
    )

    # --------------------------------------------------------
    # ADMISSION INFORMATION
    # --------------------------------------------------------

    admit_type: Mapped[str] = mapped_column(
        String(50),
        nullable=False,
    )

    ward_type: Mapped[str] = mapped_column(
        String(50),
        nullable=False,
    )

    discharge_type: Mapped[str] = mapped_column(
        String(50),
        nullable=False,
    )

    # --------------------------------------------------------
    # CLINICAL INFORMATION
    # --------------------------------------------------------

    los_days: Mapped[int] = mapped_column(
        Integer,
        nullable=False,
    )

    num_procedures: Mapped[int] = mapped_column(
        Integer,
        default=0,
        nullable=False,
    )

    charlson_index: Mapped[int] = mapped_column(
        Integer,
        default=0,
        nullable=False,
    )

    hba1c: Mapped[float] = mapped_column(
        Float,
        nullable=False,
    )

    creatinine: Mapped[float] = mapped_column(
        Float,
        nullable=False,
    )

    haemoglobin: Mapped[float] = mapped_column(
        Float,
        nullable=False,
    )

    systolic_bp: Mapped[int] = mapped_column(
        Integer,
        nullable=False,
    )

    # --------------------------------------------------------
    # CREATED TIME
    # --------------------------------------------------------

    created_at: Mapped[datetime] = mapped_column(
        DateTime,
        default=datetime.utcnow,
        nullable=False,
    )

    # --------------------------------------------------------
    # RELATIONSHIPS
    # --------------------------------------------------------

    # Admission -> Patient

    patient = relationship(
        "Patient",
        back_populates="admissions",
    )

    # Admission -> Predictions

    predictions = relationship(
        "Prediction",
        back_populates="admission",
        cascade="all, delete-orphan",
    )


# ============================================================
# PREDICTION MODEL
# ============================================================

class Prediction(Base):

    __tablename__ = "predictions"

    # --------------------------------------------------------
    # PRIMARY KEY
    # --------------------------------------------------------

    id: Mapped[int] = mapped_column(
        Integer,
        primary_key=True,
        index=True,
    )

    # --------------------------------------------------------
    # ADMISSION FOREIGN KEY
    #
    # IMPORTANT:
    #
    # This stores the numeric database ID:
    #
    # predictions.admission_id
    #        ↓
    # admissions.id
    #
    # It does NOT store A10025 directly.
    # --------------------------------------------------------

    admission_id: Mapped[int] = mapped_column(
        ForeignKey("admissions.id"),
        nullable=False,
        index=True,
    )

    # --------------------------------------------------------
    # MODEL RESULT
    # --------------------------------------------------------

    probability: Mapped[float] = mapped_column(
        Float,
        nullable=False,
    )

    risk_level: Mapped[str] = mapped_column(
        String(20),
        nullable=False,
    )

    # --------------------------------------------------------
    # MODEL INFORMATION
    # --------------------------------------------------------

    model_name: Mapped[str] = mapped_column(
        String(100),
        default="Logistic Regression",
        nullable=False,
    )

    model_version: Mapped[str] = mapped_column(
        String(50),
        default="1.0",
        nullable=False,
    )

    # --------------------------------------------------------
    # MESSAGE
    # --------------------------------------------------------

    message: Mapped[str] = mapped_column(
        Text,
        nullable=False,
    )

    # --------------------------------------------------------
    # CREATED TIME
    # --------------------------------------------------------

    created_at: Mapped[datetime] = mapped_column(
        DateTime,
        default=datetime.utcnow,
        nullable=False,
    )

    # --------------------------------------------------------
    # RELATIONSHIP
    #
    # Prediction -> Admission
    # --------------------------------------------------------

    admission = relationship(
        "Admission",
        back_populates="predictions",
    )


# ============================================================
# USER MODEL (ROLE-BASED ACCESS CONTROL)
# ============================================================

class User(Base):

    __tablename__ = "users"

    # Primary Key
    id: Mapped[int] = mapped_column(
        Integer,
        primary_key=True,
        index=True,
    )

    # Username
    username: Mapped[str] = mapped_column(
        String(100),
        unique=True,
        index=True,
        nullable=False,
    )

    # Email
    email: Mapped[str] = mapped_column(
        String(150),
        unique=True,
        index=True,
        nullable=False,
    )

    # Full Name
    full_name: Mapped[str] = mapped_column(
        String(150),
        nullable=False,
    )

    # Hashed / Stored Password
    password_hash: Mapped[str] = mapped_column(
        String(255),
        nullable=False,
    )

    # Role: 'admin', 'doctor', 'hospital_staff'
    role: Mapped[str] = mapped_column(
        String(50),
        default="hospital_staff",
        nullable=False,
    )

    # Department
    department: Mapped[str | None] = mapped_column(
        String(100),
        nullable=True,
        default="General Medicine",
    )

    # Designation / Title
    designation: Mapped[str | None] = mapped_column(
        String(100),
        nullable=True,
    )

    # Status
    is_active: Mapped[bool] = mapped_column(
        Boolean,
        default=True,
        nullable=False,
    )

    # Created Time
    created_at: Mapped[datetime] = mapped_column(
        DateTime,
        default=datetime.utcnow,
        nullable=False,
    )


# ============================================================
# DEPARTMENT MODEL
# ============================================================

class Department(Base):

    __tablename__ = "departments"

    # Primary Key
    id: Mapped[int] = mapped_column(
        Integer,
        primary_key=True,
        index=True,
    )

    # Department Name
    name: Mapped[str] = mapped_column(
        String(150),
        unique=True,
        nullable=False,
    )

    # Department Code (e.g., CARD, NEUR, ENDO)
    code: Mapped[str] = mapped_column(
        String(20),
        unique=True,
        nullable=False,
    )

    # Head of Department / Chief Specialist
    head_doctor: Mapped[str] = mapped_column(
        String(150),
        nullable=False,
    )

    # Bed Capacity
    total_beds: Mapped[int] = mapped_column(
        Integer,
        default=50,
        nullable=False,
    )

    # Currently Occupied Beds
    occupied_beds: Mapped[int] = mapped_column(
        Integer,
        default=0,
        nullable=False,
    )

    # Contact Extension
    contact_number: Mapped[str | None] = mapped_column(
        String(50),
        nullable=True,
    )

    # Description / Specialties
    description: Mapped[str | None] = mapped_column(
        Text,
        nullable=True,
    )

    # Created Time
    created_at: Mapped[datetime] = mapped_column(
        DateTime,
        default=datetime.utcnow,
        nullable=False,
    )



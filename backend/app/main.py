# `backend/app/main.py`

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager

from app.database import Base, engine, SessionLocal
from app import models
from app.services.auth_service import seed_default_users_and_departments

# ============================================================
# API ROUTERS
# ============================================================

from app.api.auth import router as auth_router
from app.api.users import router as users_router
from app.api.departments import router as departments_router
from app.api.patients import router as patients_router
from app.api.admissions import router as admissions_router
from app.api.prediction import router as prediction_router
from app.api.prediction_history import (
    router as prediction_history_router,
)


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Ensure all tables exist on startup
    try:
        Base.metadata.create_all(bind=engine)
        db = SessionLocal()
        try:
            seed_default_users_and_departments(db)
        finally:
            db.close()
    except Exception as e:
        print(f"Startup DB init notice: {e}")
    yield


# ============================================================
# FASTAPI APPLICATION
# ============================================================

app = FastAPI(
    title="AI Hospital Readmission Prediction",
    description=(
        "AI-based hospital readmission prediction "
        "and clinical management platform"
    ),
    version="2.0.0",
    lifespan=lifespan,
)


# ============================================================
# CORS CONFIGURATION
# ============================================================

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "http://localhost:3000",
        "http://127.0.0.1:3000",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ============================================================
# REGISTER API ROUTERS
# ============================================================

app.include_router(auth_router)
app.include_router(users_router)
app.include_router(departments_router)
app.include_router(patients_router)
app.include_router(admissions_router)
app.include_router(prediction_router)
app.include_router(prediction_history_router)


# ============================================================
# ROOT ENDPOINT
# ============================================================

@app.get("/")
def root():
    return {
        "message": (
            "AI Hospital Readmission Prediction & "
            "Healthcare Clinical Intelligence API is running"
        ),
        "version": "2.0.0",
    }


# ============================================================
# HEALTH CHECK
# ============================================================

@app.get("/health")
def health_check():
    return {
        "status": "healthy",
        "service": "hospital-readmission-backend",
    }

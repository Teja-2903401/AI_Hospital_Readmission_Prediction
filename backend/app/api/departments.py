from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.database import get_db
from app.models import Department
from app.schemas.department import DepartmentCreate, DepartmentUpdate, DepartmentResponse
from app.services.auth_service import seed_default_users_and_departments

router = APIRouter(
    prefix="/api/departments",
    tags=["Hospital Departments"],
)


@router.get("/", response_model=List[DepartmentResponse])
def get_all_departments(db: Session = Depends(get_db)):
    """List all hospital departments with bed capacities and occupancy."""
    seed_default_users_and_departments(db)
    departments = db.query(Department).order_by(Department.id.asc()).all()

    results = []
    for dept in departments:
        occ_rate = round((dept.occupied_beds / dept.total_beds * 100), 1) if dept.total_beds > 0 else 0.0
        results.append({
            "id": dept.id,
            "name": dept.name,
            "code": dept.code,
            "head_doctor": dept.head_doctor,
            "total_beds": dept.total_beds,
            "occupied_beds": dept.occupied_beds,
            "contact_number": dept.contact_number,
            "description": dept.description,
            "created_at": dept.created_at,
            "occupancy_rate": occ_rate,
        })
    return results


@router.post("/", response_model=DepartmentResponse)
def create_department(
    dept_data: DepartmentCreate,
    db: Session = Depends(get_db),
):
    """Create a new hospital department (Administrator only)."""
    existing = db.query(Department).filter(
        (Department.name == dept_data.name.strip()) | (Department.code == dept_data.code.strip().upper())
    ).first()
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="A department with this name or code already exists.",
        )

    dept = Department(
        name=dept_data.name.strip(),
        code=dept_data.code.strip().upper(),
        head_doctor=dept_data.head_doctor.strip(),
        total_beds=dept_data.total_beds,
        occupied_beds=dept_data.occupied_beds,
        contact_number=dept_data.contact_number,
        description=dept_data.description,
    )
    db.add(dept)
    db.commit()
    db.refresh(dept)
    
    occ_rate = round((dept.occupied_beds / dept.total_beds * 100), 1) if dept.total_beds > 0 else 0.0
    return {
        "id": dept.id,
        "name": dept.name,
        "code": dept.code,
        "head_doctor": dept.head_doctor,
        "total_beds": dept.total_beds,
        "occupied_beds": dept.occupied_beds,
        "contact_number": dept.contact_number,
        "description": dept.description,
        "created_at": dept.created_at,
        "occupancy_rate": occ_rate,
    }


@router.put("/{dept_id}", response_model=DepartmentResponse)
def update_department(
    dept_id: int,
    dept_data: DepartmentUpdate,
    db: Session = Depends(get_db),
):
    """Update a department's details or capacity (Administrator only)."""
    dept = db.query(Department).filter(Department.id == dept_id).first()
    if not dept:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Department not found",
        )

    if dept_data.name is not None:
        dept.name = dept_data.name.strip()
    if dept_data.code is not None:
        dept.code = dept_data.code.strip().upper()
    if dept_data.head_doctor is not None:
        dept.head_doctor = dept_data.head_doctor.strip()
    if dept_data.total_beds is not None:
        dept.total_beds = dept_data.total_beds
    if dept_data.occupied_beds is not None:
        dept.occupied_beds = dept_data.occupied_beds
    if dept_data.contact_number is not None:
        dept.contact_number = dept_data.contact_number
    if dept_data.description is not None:
        dept.description = dept_data.description

    db.commit()
    db.refresh(dept)
    
    occ_rate = round((dept.occupied_beds / dept.total_beds * 100), 1) if dept.total_beds > 0 else 0.0
    return {
        "id": dept.id,
        "name": dept.name,
        "code": dept.code,
        "head_doctor": dept.head_doctor,
        "total_beds": dept.total_beds,
        "occupied_beds": dept.occupied_beds,
        "contact_number": dept.contact_number,
        "description": dept.description,
        "created_at": dept.created_at,
        "occupancy_rate": occ_rate,
    }


@router.delete("/{dept_id}")
def delete_department(
    dept_id: int,
    db: Session = Depends(get_db),
):
    """Delete a department (Administrator only)."""
    dept = db.query(Department).filter(Department.id == dept_id).first()
    if not dept:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Department not found",
        )

    db.delete(dept)
    db.commit()
    return {"message": f"Department '{dept.name}' deleted successfully."}

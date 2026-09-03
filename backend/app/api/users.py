from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.database import get_db
from app.models import User
from app.schemas.user import UserCreate, UserUpdate, UserResponse
from app.services.auth_service import hash_password, seed_default_users_and_departments

router = APIRouter(
    prefix="/api/users",
    tags=["User Management (Administrator)"],
)


@router.get("/", response_model=List[UserResponse])
def get_all_users(db: Session = Depends(get_db)):
    """List all registered system users."""
    seed_default_users_and_departments(db)
    users = db.query(User).order_by(User.id.asc()).all()
    return users


@router.post("/", response_model=UserResponse)
def create_user(
    user_data: UserCreate,
    db: Session = Depends(get_db),
):
    """Create a new system user (Administrator only)."""
    # Check if username or email already exists
    existing = db.query(User).filter(
        (User.username == user_data.username.strip()) | (User.email == user_data.email.strip().lower())
    ).first()
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="A user with this username or email already exists.",
        )

    user = User(
        username=user_data.username.strip(),
        email=user_data.email.strip().lower(),
        full_name=user_data.full_name.strip(),
        password_hash=hash_password(user_data.password),
        role=user_data.role,
        department=user_data.department,
        designation=user_data.designation,
        is_active=user_data.is_active,
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    return user


@router.put("/{user_id}", response_model=UserResponse)
def update_user(
    user_id: int,
    user_data: UserUpdate,
    db: Session = Depends(get_db),
):
    """Update a user's details, role, or active status (Administrator only)."""
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found",
        )

    if user_data.full_name is not None:
        user.full_name = user_data.full_name.strip()
    if user_data.email is not None:
        user.email = user_data.email.strip().lower()
    if user_data.role is not None:
        user.role = user_data.role
    if user_data.department is not None:
        user.department = user_data.department
    if user_data.designation is not None:
        user.designation = user_data.designation
    if user_data.is_active is not None:
        user.is_active = user_data.is_active
    if user_data.password:
        user.password_hash = hash_password(user_data.password)

    db.commit()
    db.refresh(user)
    return user


@router.delete("/{user_id}")
def delete_user(
    user_id: int,
    db: Session = Depends(get_db),
):
    """Delete a user (Administrator only)."""
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found",
        )

    # Protect main admin account from deletion
    if user.username == "admin":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="The root administrator account cannot be deleted.",
        )

    db.delete(user)
    db.commit()
    return {"message": f"User '{user.username}' deleted successfully."}

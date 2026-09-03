import uuid
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.database import get_db
from app.models import User
from app.schemas.user import LoginRequest, LoginResponse, UserResponse
from app.services.auth_service import (
    verify_password,
    get_role_permissions,
    seed_default_users_and_departments,
)

router = APIRouter(
    prefix="/api/auth",
    tags=["Authentication"],
)


@router.post("/login", response_model=LoginResponse)
def login(
    req: LoginRequest,
    db: Session = Depends(get_db),
):
    """Authenticate user with username/email and password."""
    identifier = req.username_or_email.strip()
    if not identifier:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Username or email is required",
        )

    # Ensure default accounts exist
    seed_default_users_and_departments(db)

    user = (
        db.query(User)
        .filter(
            (User.username == identifier) | (User.email == identifier.lower())
        )
        .first()
    )

    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid credentials. Please check your username/email or password.",
        )

    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="This user account has been deactivated. Please contact the administrator.",
        )

    if not verify_password(req.password, user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid credentials. Please check your password.",
        )

    token = f"med_auth_{user.role}_{user.id}_{uuid.uuid4().hex[:16]}"
    permissions = get_role_permissions(user.role)

    return {
        "success": True,
        "message": f"Welcome back, {user.full_name}!",
        "user": user,
        "token": token,
        "permissions": permissions,
    }


@router.get("/me", response_model=UserResponse)
def get_current_user_profile(
    user_id: int = 1,
    db: Session = Depends(get_db),
):
    """Get current user details."""
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found",
        )
    return user


@router.post("/seed")
def trigger_seed(db: Session = Depends(get_db)):
    """Seed default users and departments."""
    seed_default_users_and_departments(db)
    return {"message": "Default users and departments seeded successfully."}

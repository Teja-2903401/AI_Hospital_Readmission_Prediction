from datetime import datetime
from pydantic import BaseModel, EmailStr, Field
from typing import Optional, List


class UserBase(BaseModel):
    username: str
    email: str
    full_name: str
    role: str = Field(..., description="admin, doctor, or hospital_staff")
    department: Optional[str] = "General Medicine"
    designation: Optional[str] = None
    is_active: bool = True


class UserCreate(BaseModel):
    username: str
    email: str
    full_name: str
    password: str
    role: str = "hospital_staff"
    department: Optional[str] = "General Medicine"
    designation: Optional[str] = None
    is_active: bool = True


class UserUpdate(BaseModel):
    full_name: Optional[str] = None
    email: Optional[str] = None
    role: Optional[str] = None
    department: Optional[str] = None
    designation: Optional[str] = None
    is_active: Optional[bool] = None
    password: Optional[str] = None


class UserResponse(BaseModel):
    id: int
    username: str
    email: str
    full_name: str
    role: str
    department: Optional[str] = None
    designation: Optional[str] = None
    is_active: bool
    created_at: datetime

    class Config:
        from_attributes = True


class LoginRequest(BaseModel):
    username_or_email: str
    password: str


class LoginResponse(BaseModel):
    success: bool
    message: str
    user: UserResponse
    token: str
    permissions: List[str]

from datetime import datetime
from pydantic import BaseModel, Field
from typing import Optional


class DepartmentBase(BaseModel):
    name: str
    code: str
    head_doctor: str
    total_beds: int = 50
    occupied_beds: int = 0
    contact_number: Optional[str] = None
    description: Optional[str] = None


class DepartmentCreate(DepartmentBase):
    pass


class DepartmentUpdate(BaseModel):
    name: Optional[str] = None
    code: Optional[str] = None
    head_doctor: Optional[str] = None
    total_beds: Optional[int] = None
    occupied_beds: Optional[int] = None
    contact_number: Optional[str] = None
    description: Optional[str] = None


class DepartmentResponse(DepartmentBase):
    id: int
    created_at: datetime
    occupancy_rate: Optional[float] = None

    class Config:
        from_attributes = True

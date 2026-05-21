from datetime import datetime
from typing import Optional

from pydantic import BaseModel, ConfigDict, EmailStr, Field


class TicketBase(BaseModel):
    employee_name: str = Field(min_length=2, max_length=255)
    department: str = Field(min_length=2, max_length=255)
    issue_category: str = Field(min_length=2, max_length=100)
    description: str = Field(min_length=10)
    priority: str = Field(pattern="^(Low|Medium|High|Critical)$")
    status: str = Field(default="Open", pattern="^(Open|In Progress|Resolved|Closed)$")
    resolution_notes: Optional[str] = None


class TicketCreate(TicketBase):
    pass


class TicketUpdate(BaseModel):
    employee_name: Optional[str] = Field(default=None, min_length=2, max_length=255)
    department: Optional[str] = Field(default=None, min_length=2, max_length=255)
    issue_category: Optional[str] = Field(default=None, min_length=2, max_length=100)
    description: Optional[str] = Field(default=None, min_length=10)
    priority: Optional[str] = Field(default=None, pattern="^(Low|Medium|High|Critical)$")
    status: Optional[str] = Field(default=None, pattern="^(Open|In Progress|Resolved|Closed)$")
    resolution_notes: Optional[str] = None


class TicketRead(TicketBase):
    model_config = ConfigDict(from_attributes=True)

    ticket_id: int
    created_at: datetime


class UserRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    email: EmailStr
    full_name: str
    role: str


class LoginRequest(BaseModel):
    email: EmailStr
    password: str


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserRead


class SearchFilters(BaseModel):
    query: Optional[str] = None
    category: Optional[str] = None
    status: Optional[str] = None
    priority: Optional[str] = None

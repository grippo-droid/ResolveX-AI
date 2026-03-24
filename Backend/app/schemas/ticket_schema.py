"""
ticket_schema.py — Pydantic schemas for ticket request/response contracts.
"""

from pydantic import BaseModel, Field
from typing import Optional
from datetime import datetime


class TicketCreate(BaseModel):
    """Payload for creating a new ticket (POST /tickets)."""
    title: str = Field(..., min_length=3, max_length=255, example="Application crashes on login")
    description: str = Field(..., min_length=10, example="The app throws a 500 error whenever I try to log in.")
    submitted_by: Optional[str] = Field(None, example="user@company.com")
    category: str = Field(..., example="technical")
    image: Optional[str] = Field(None, example="screenshot.png")   # filename only; no processing done


class TicketUpdate(BaseModel):
    """Payload for partial ticket updates."""
    title: Optional[str] = None
    description: Optional[str] = None
    status: Optional[str] = None
    assigned_to: Optional[str] = None
    category: Optional[str] = None


class TicketResponse(BaseModel):
    """Full ticket response returned to the client."""
    id: int
    title: str
    description: str
    category: Optional[str] = None
    status: str
    solution: Optional[str] = None
    confidence: Optional[float] = None
    explanation: Optional[str] = None
    submitted_by: Optional[str] = None
    assigned_to: Optional[str] = None
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True   # replaces orm_mode in Pydantic v2


class TicketListResponse(BaseModel):
    """Paginated list of tickets."""
    total: int
    page: int
    page_size: int
    tickets: list[TicketResponse]

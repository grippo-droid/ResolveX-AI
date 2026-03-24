"""
ticket_routes.py — CRUD endpoints for support tickets.

Routes:
    POST   /tickets          → submit a new ticket (with optional attachments)
    GET    /tickets          → list tickets (paginated)
    GET    /tickets/{id}     → fetch a single ticket
    PATCH  /tickets/{id}     → update ticket fields
    DELETE /tickets/{id}     → soft-delete / close a ticket
"""

from fastapi import APIRouter, Depends, UploadFile, File, Form, Query
from sqlalchemy.orm import Session
from typing import List, Optional
import logging
from app.services.resolution_service import ResolutionService
logger = logging.getLogger("resolvex")

from app.database import get_db
from app.schemas.ticket_schema import TicketResponse, TicketListResponse, TicketUpdate
from app.services.ticket_service import TicketService

router = APIRouter()


@router.post("/tickets", response_model=TicketResponse, status_code=201)
async def create_ticket(
    title:        str                  = Form(...),
    description:  str                  = Form(...),
    submitted_by: Optional[str]        = Form(None),
    category:     str                  = Form(...),
    image:        Optional[UploadFile] = File(None),
    db:           Session              = Depends(get_db),
):
    """
    Submit a new support ticket AND auto-trigger AI resolution pipeline.
    Returns merged ticket + AI result in one response.
    """
    # Step 1: Create ticket in DB
    ticket_service = TicketService(db)
    ticket = await ticket_service.create_ticket(
        title=title,
        description=description,
        submitted_by=submitted_by,
        category=category,
        image=image,
    )

    # Step 2: Auto-trigger AI resolution
    resolution_service = ResolutionService(db)
    resolution = await resolution_service.resolve(ticket_id=ticket.id, force=False)

    # Step 3: Map decision from resolution booleans
    if resolution.auto_resolved:
        decision = "auto-resolved"
    elif resolution.escalated_to_human:
        decision = "escalated"
    else:
        decision = "human-review"

    # Step 4: Map confidence % to frontend format
    confidence_percent = round(resolution.confidence * 100) if resolution.confidence <= 1 else round(resolution.confidence)

    # Step 5: Build merged response
    return TicketResponse(
        # Core ticket fields
        id=ticket.id,
        title=ticket.title,
        description=ticket.description,
        category=resolution.category or ticket.category,
        status=ticket.status,
        submitted_by=ticket.submitted_by,
        assigned_to=ticket.assigned_to,
        created_at=ticket.created_at,
        updated_at=ticket.updated_at,

        # AI resolution fields — mapped from ResolutionResult
        solution=resolution.solution,
        suggested_fix=resolution.solution,
        confidence=confidence_percent,
        explanation=resolution.explanation,
        decision=decision,
        intent=resolution.category,        # category = intent in your schema
        processing_time=None,              # not in ResolutionResult, add later if needed
    )   



@router.get("/tickets", response_model=TicketListResponse)
def list_tickets(
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    status: Optional[str] = Query(None),
    category: Optional[str] = Query(None),
    db: Session = Depends(get_db),
):
    """Return a paginated list of tickets, optionally filtered by status/category."""
    service = TicketService(db)
    return service.list_tickets(page=page, page_size=page_size, status=status, category=category)


@router.get("/tickets/{ticket_id}", response_model=TicketResponse)
def get_ticket(ticket_id: int, db: Session = Depends(get_db)):
    """Fetch a single ticket by ID."""
    service = TicketService(db)
    return service.get_ticket(ticket_id)


@router.patch("/tickets/{ticket_id}", response_model=TicketResponse)
def update_ticket(ticket_id: int, payload: TicketUpdate, db: Session = Depends(get_db)):
    """Partially update ticket metadata (status, assignment, priority, etc.)."""
    service = TicketService(db)
    return service.update_ticket(ticket_id, payload)


@router.delete("/tickets/{ticket_id}", status_code=204)
def delete_ticket(ticket_id: int, db: Session = Depends(get_db)):
    """Close / remove a ticket."""
    service = TicketService(db)
    service.delete_ticket(ticket_id)

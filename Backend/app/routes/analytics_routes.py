"""
analytics_routes.py — Analytics and reporting endpoints.

Routes:
    GET /analytics          → aggregated summary
    GET /analytics/tickets  → ticket volume stats
    GET /analytics/confidence → confidence distribution
"""

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.database import get_db
from app.schemas.analytics_schema import AnalyticsSummary, TicketStats, ConfidenceStats
from app.services.analytics_service import AnalyticsService

router = APIRouter()


@router.get("/analytics", response_model=AnalyticsSummary)
def get_analytics_summary(db: Session = Depends(get_db)):
    """Return a combined analytics snapshot: ticket counts, confidence stats, category breakdown."""
    service = AnalyticsService(db)
    return service.get_summary()


@router.get("/analytics/tickets", response_model=TicketStats)
def get_ticket_stats(db: Session = Depends(get_db)):
    """Return ticket volume grouped by status."""
    service = AnalyticsService(db)
    return service.get_ticket_stats()


@router.get("/analytics/confidence", response_model=ConfidenceStats)
def get_confidence_stats(db: Session = Depends(get_db)):
    """Return average confidence and high/low distribution."""
    service = AnalyticsService(db)
    return service.get_confidence_stats()

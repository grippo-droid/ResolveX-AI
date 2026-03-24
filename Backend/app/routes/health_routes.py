"""
health_routes.py — Health check endpoints.
"""

from fastapi import APIRouter
from app.config import settings

router = APIRouter()


@router.get("/health")
def health_check():
    """Basic liveness probe — returns 200 if the app is running happy birthday pranao."""
    return {
        "status": "ok",
        "app": settings.APP_NAME,
        "version": settings.APP_VERSION,
    }


@router.get("/health/ready")
def readiness_check():
    """
    Readiness probe — checks that critical dependencies are reachable.
    Placeholder: extend to ping DB / FAISS in production.
    """
    return {"status": "ready", "database": "ok", "vector_store": "ok"}

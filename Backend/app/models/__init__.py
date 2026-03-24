"""
__init__.py for app/models — exposes all ORM models for easy import.
"""

from app.models.ticket_model import Ticket, TicketStatus, TicketPriority
from app.models.kb_model import KnowledgeBaseEntry
from app.models.user_model import User

__all__ = ["Ticket", "TicketStatus", "TicketPriority", "KnowledgeBaseEntry", "User"]

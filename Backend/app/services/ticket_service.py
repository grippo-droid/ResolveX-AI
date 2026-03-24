"""
ticket_service.py — Business logic for ticket creation, listing, and management.
Calls TicketRepository for DB access and storage for file handling.
"""

import os
from typing import List, Optional
from fastapi import UploadFile
from sqlalchemy.orm import Session

from app.repositories.ticket_repo import TicketRepository
from app.models.ticket_model import Ticket
from app.schemas.ticket_schema import TicketUpdate, TicketListResponse, TicketResponse
from app.core.exceptions import TicketNotFoundException
from app.core.logger import logger
from storage.file_manager import FileManager


class TicketService:
    def __init__(self, db: Session):
        self.repo = TicketRepository(db)
        self.file_manager = FileManager()

    async def create_ticket(
        self,
        title: str,
        description: str,
        submitted_by: Optional[str],
        category: str,
        image: Optional[UploadFile] = None,
    ) -> Ticket:
        """
        Persist a new ticket.
        `image` is accepted for future use but no file processing is performed.
        """
        logger.info(f"Creating ticket: '{title}' category='{category}'")

        # image is intentionally not processed — placeholder for future storage hook
        image_filename = image.filename if image and image.filename else None

        ticket = Ticket(
            title=title,
            description=description,
            submitted_by=submitted_by,
            category=category,
            attachment_paths=image_filename,   # store filename only
            status="open",
        )
        created = self.repo.create(ticket)
        logger.info(f"Ticket created with id={created.id}")
        return created

    def get_ticket(self, ticket_id: int) -> Ticket:
        """Fetch a single ticket or raise 404."""
        ticket = self.repo.get_by_id(ticket_id)
        if not ticket:
            raise TicketNotFoundException(ticket_id)
        return ticket

    def list_tickets(
        self,
        page: int,
        page_size: int,
        status: Optional[str],
        category: Optional[str],
    ) -> TicketListResponse:
        """Return a paginated list of tickets."""
        skip = (page - 1) * page_size
        tickets = self.repo.list_all(skip=skip, limit=page_size, status=status, category=category)
        total = self.repo.count(status=status, category=category)
        return TicketListResponse(
            total=total,
            page=page,
            page_size=page_size,
            tickets=[TicketResponse.model_validate(t) for t in tickets],
        )

    def update_ticket(self, ticket_id: int, payload: TicketUpdate) -> Ticket:
        """Apply partial updates to a ticket."""
        ticket = self.get_ticket(ticket_id)
        for field, value in payload.model_dump(exclude_unset=True).items():
            setattr(ticket, field, value)
        return self.repo.update(ticket)

    def delete_ticket(self, ticket_id: int) -> None:
        """Delete a ticket (hard delete)."""
        ticket = self.get_ticket(ticket_id)
        self.repo.delete(ticket)

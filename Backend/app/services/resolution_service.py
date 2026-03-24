"""
resolution_service.py — Orchestrates the AI pipeline for ticket resolution.
Calls the AI pipeline, evaluates confidence, and updates the ticket status.
"""

from sqlalchemy.orm import Session

from app.repositories.ticket_repo import TicketRepository
from app.schemas.resolution_schema import ResolutionResult
from app.core.exceptions import TicketNotFoundException
from app.core.constants import CONFIDENCE_HIGH, CONFIDENCE_LOW, STATUS_AUTO_RESOLVED, STATUS_ESCALATED
from app.core.logger import logger
from ai.pipeline.ticket_pipeline import run_pipeline


class ResolutionService:
    def __init__(self, db: Session):
        self.repo = TicketRepository(db)

    async def resolve(self, ticket_id: int, force: bool = False) -> ResolutionResult:
        """
        Run the full AI pipeline on a ticket.
        Decision:
            confidence >= CONFIDENCE_HIGH → auto-resolve
            confidence <  CONFIDENCE_LOW  → escalate to HITL
            otherwise                     → partial resolution, still escalate
        """
        ticket = self.repo.get_by_id(ticket_id)
        if not ticket:
            raise TicketNotFoundException(ticket_id)

        # Skip if already resolved (unless force=True)
        if ticket.status == STATUS_AUTO_RESOLVED and not force:
            logger.info(f"Ticket {ticket_id} already resolved. Skipping.")
            return self._build_result(ticket)

        logger.info(f"Running AI pipeline for ticket {ticket_id}")

        # ── Run AI pipeline ────────────────────────────────────────────────────
        pipeline_output = await run_pipeline(ticket)

        solution = pipeline_output.get("solution", "")
        confidence = pipeline_output.get("confidence", 0.0)
        category = pipeline_output.get("category", "other")
        explanation = pipeline_output.get("explanation", "")

        # ── Confidence-based decision ──────────────────────────────────────────
        auto_resolved = confidence >= CONFIDENCE_HIGH
        escalated = confidence < CONFIDENCE_LOW or not auto_resolved

        new_status = STATUS_AUTO_RESOLVED if auto_resolved else STATUS_ESCALATED

        # ── Persist results ────────────────────────────────────────────────────
        ticket.solution = solution
        ticket.confidence = confidence
        ticket.category = category
        ticket.explanation = explanation
        ticket.status = new_status
        self.repo.update(ticket)

        logger.info(f"Ticket {ticket_id} → status={new_status}, confidence={confidence:.3f}")

        return ResolutionResult(
            ticket_id=ticket_id,
            category=category,
            solution=solution,
            confidence=confidence,
            auto_resolved=auto_resolved,
            escalated_to_human=escalated,
            explanation=explanation,
        )

    def get_resolution(self, ticket_id: int) -> ResolutionResult:
        """Return the stored resolution result for a ticket."""
        ticket = self.repo.get_by_id(ticket_id)
        if not ticket:
            raise TicketNotFoundException(ticket_id)
        return self._build_result(ticket)

    def _build_result(self, ticket) -> ResolutionResult:
        confidence = ticket.confidence or 0.0
        return ResolutionResult(
            ticket_id=ticket.id,
            category=ticket.category,
            solution=ticket.solution,
            confidence=confidence,
            auto_resolved=ticket.status == STATUS_AUTO_RESOLVED,
            escalated_to_human=ticket.status == STATUS_ESCALATED,
            explanation=ticket.explanation,
        )

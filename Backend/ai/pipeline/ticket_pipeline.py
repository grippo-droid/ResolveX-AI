"""
ticket_pipeline.py — Master orchestrator of the ResolveX-AI processing pipeline.

Pipeline flow:
    Ticket Input
    → preprocess  (clean text + extract from attachments)
    → classify    (assign category)
    → embed       (generate vector embedding)
    → retrieve    (RAG: fetch similar KB entries)
    → generate    (Groq LLM produces solution)
    → confidence  (compute composite score)
    → explain     (generate human-readable reasoning)
"""

from app.core.logger import logger

from ai.preprocessing.text_cleaner import clean_text
from ai.preprocessing.file_parser import parse_attachments
from ai.classification.classifier import classify_ticket
from ai.embedding.embedding_model import generate_embedding
from ai.rag.retriever import retrieve_context
from ai.llm.solution_generator import generate_solution
from ai.confidence.confidence_engine import compute_confidence
from ai.explainability.explainer import explain


async def run_pipeline(ticket) -> dict:
    """
    Run the full AI pipeline on a Ticket ORM object.

    Args:
        ticket: Ticket ORM instance (from the database)

    Returns:
        dict with keys: solution, confidence, category, explanation
    """
    logger.info(f"[Pipeline] Starting for ticket_id={ticket.id}")

    # ── Step 1: Preprocessing ─────────────────────────────────────────────────
    cleaned_text = clean_text(ticket.description)

    # Append any extracted text from attached files (OCR / PDF parse)
    if ticket.attachment_paths:
        paths = [p.strip() for p in ticket.attachment_paths.split(",") if p.strip()]
        extracted = parse_attachments(paths)
        if extracted:
            cleaned_text = f"{cleaned_text}\n\n[Attachments]\n{extracted}"

    logger.debug(f"[Pipeline] Preprocessed text length: {len(cleaned_text)}")

    # ── Step 2: Classification ────────────────────────────────────────────────
    category, classification_score = classify_ticket(cleaned_text)
    logger.info(f"[Pipeline] Category: {category} (score={classification_score:.3f})")

    # ── Step 3: Embedding ─────────────────────────────────────────────────────
    embedding = generate_embedding(cleaned_text)
    logger.debug("[Pipeline] Embedding generated")

    # ── Step 4: RAG Retrieval ─────────────────────────────────────────────────
    context_docs = retrieve_context(embedding)
    context_text = "\n\n---\n\n".join(context_docs)
    logger.info(f"[Pipeline] Retrieved {len(context_docs)} context documents")

    # ── Step 5: LLM Solution Generation ──────────────────────────────────────
    solution, llm_score = generate_solution(cleaned_text, context_text)
    logger.info(f"[Pipeline] Solution generated (llm_score={llm_score:.3f})")

    # ── Step 6: Confidence Scoring ────────────────────────────────────────────
    similarity_score = _compute_similarity_score(context_docs)
    confidence = compute_confidence(
        similarity_score=similarity_score,
        llm_score=llm_score,
        classification_score=classification_score,
    )
    logger.info(f"[Pipeline] Confidence: {confidence:.3f}")

    # ── Step 7: Explainability ────────────────────────────────────────────────
    explanation = explain(
        ticket_text=cleaned_text,
        category=category,
        context_docs=context_docs,
        solution=solution,
        confidence=confidence,
    )

    logger.info(f"[Pipeline] Completed for ticket_id={ticket.id}")

    return {
        "solution": solution,
        "confidence": confidence,
        "category": category,
        "explanation": explanation,
    }


def _compute_similarity_score(context_docs: list) -> float:
    """
    Placeholder: derive a similarity score from retrieved context.
    In production, use the FAISS distance scores returned by the retriever.
    """
    if not context_docs:
        return 0.0
    # Simulate: more context docs → higher similarity (capped at 1.0)
    return min(len(context_docs) / 5.0, 1.0)

"""
solution_generator.py — Groq LLM integration for generating ticket solutions.
Uses the Groq API with llama3-8b-8192 to produce natural-language resolution text.
"""

from typing import Tuple
from app.core.logger import logger
from app.config import settings
from ai.config.ai_config import GROQ_MODEL, GROQ_MAX_TOKENS, GROQ_TEMPERATURE

try:
    from groq import Groq
    GROQ_AVAILABLE = True
except ImportError:
    GROQ_AVAILABLE = False
    logger.warning("groq package not installed – LLM will return a placeholder solution")


def _build_prompt(ticket_text: str, context: str) -> str:
    """Construct the system + user prompt for the LLM."""
    system_prompt = (
        "You are ResolveX-AI, an expert enterprise support resolution assistant. "
        "Given a support ticket and relevant context from the knowledge base, "
        "provide a clear, concise, and actionable solution. "
        "Be professional and reference the context where appropriate."
    )
    user_prompt = (
        f"### Support Ticket\n{ticket_text}\n\n"
        f"### Relevant Knowledge Base Context\n{context or 'No context available.'}\n\n"
        "### Your Solution"
    )
    return system_prompt, user_prompt


def generate_solution(ticket_text: str, context: str) -> Tuple[str, float]:
    """
    Call the Groq LLM API to generate a resolution for the given ticket.

    Args:
        ticket_text: Pre-processed ticket description.
        context: Concatenated RAG retrieval results.

    Returns:
        Tuple of (solution_text: str, llm_confidence_score: float)
        The llm_confidence_score is a heuristic proxy (e.g., response length ratio).
    """
    if not GROQ_AVAILABLE:
        logger.warning("Groq unavailable — returning placeholder solution")
        return _placeholder_solution(), 0.5

    system_prompt, user_prompt = _build_prompt(ticket_text, context)

    try:
        client = Groq(api_key=settings.GROQ_API_KEY)

        completion = client.chat.completions.create(
            model=GROQ_MODEL,
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user",   "content": user_prompt},
            ],
            max_tokens=GROQ_MAX_TOKENS,
            temperature=GROQ_TEMPERATURE,
        )

        solution = completion.choices[0].message.content.strip()
        logger.info(f"Groq solution generated ({len(solution)} chars)")

        # Heuristic LLM score: longer / more detailed solutions score higher (capped at 0.95)
        llm_score = min(len(solution) / 1000, 0.95)

        return solution, llm_score

    except Exception as exc:
        logger.error(f"Groq API call failed: {exc}")
        return _placeholder_solution(), 0.3


def _placeholder_solution() -> str:
    return (
        "We have received your ticket and are currently investigating the issue. "
        "Our system has detected relevant patterns from past tickets. "
        "Please try restarting the affected service and clearing your cache. "
        "If the issue persists, a support agent will follow up within 24 hours."
    )

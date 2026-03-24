"""
text_cleaner.py — Text normalisation and cleaning utilities.
Prepares raw ticket text for embedding and classification.
"""

import re


def clean_text(text: str) -> str:
    """
    Clean and normalise raw ticket text.

    Steps:
        1. Strip leading/trailing whitespace
        2. Collapse multiple whitespace / newlines
        3. Remove special characters (keep punctuation relevant to support)
        4. Lower-case the text

    Args:
        text: Raw ticket description or extracted content

    Returns:
        Cleaned string ready for downstream AI steps
    """
    if not text:
        return ""

    # Remove HTML tags (in case ticket was submitted via web form)
    text = re.sub(r"<[^>]+>", " ", text)

    # Collapse excessive whitespace
    text = re.sub(r"\s+", " ", text)

    # Strip
    text = text.strip()

    # Lower-case
    text = text.lower()

    return text


def truncate(text: str, max_chars: int = 2000) -> str:
    """Truncate text to `max_chars` characters to stay within LLM context limits."""
    return text[:max_chars] if len(text) > max_chars else text

"""
retriever.py — RAG retrieval layer.
Uses the FAISS vector store to find similar past tickets/KB entries and returns their text.
"""

from typing import List
import numpy as np
from app.core.logger import logger
from ai.rag.vector_store import get_vector_store
from ai.config.ai_config import FAISS_TOP_K

# In-memory document store: maps FAISS vector index → text content
# In production, this should be backed by the PostgreSQL KB table via kb_repo.
_doc_store: List[str] = []


def register_document(text: str) -> int:
    """
    Register a document in the in-memory store and return its index ID.
    Called when building or updating the FAISS index.
    """
    _doc_store.append(text)
    return len(_doc_store) - 1


def retrieve_context(query_embedding: np.ndarray, top_k: int = FAISS_TOP_K) -> List[str]:
    """
    Retrieve the top-k most relevant documents for a query embedding.

    Args:
        query_embedding: Dense vector from the embedding model (shape: 384,)
        top_k: Number of results to return

    Returns:
        List of text strings (KB entries / past ticket solutions)
    """
    store = get_vector_store()

    if store.total_vectors == 0:
        logger.warning("FAISS index is empty — no context retrieved")
        return []

    distances, indices = store.search(query_embedding, top_k=top_k)

    results: List[str] = []
    for dist, idx in zip(distances, indices):
        if idx < 0 or idx >= len(_doc_store):
            continue   # FAISS may return -1 for empty slots
        results.append(_doc_store[idx])
        logger.debug(f"Retrieved doc idx={idx} with distance={dist:.4f}")

    return results

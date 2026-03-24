"""
retriever.py — RAG retrieval layer.

Uses FAISS vector store to find similar KB entries / past tickets
and returns structured retrieval results.
"""

from typing import List, Dict, Optional
import numpy as np
from app.core.logger import logger
from ai.rag.vector_store import get_vector_store
from ai.rag.doc_store import get_doc_store
from ai.config.ai_config import FAISS_TOP_K, FAISS_SCORE_THRESHOLD


def register_document(
    source: str,
    title: str,
    category: str,
    content: str,
    doc_id: Optional[int] = None,
    extra_metadata: Optional[Dict] = None,
) -> int:
    """
    Register a document in the persistent doc store and return its index ID.

    This ID must align with the FAISS vector insertion order.
    """
    store = get_doc_store()
    index_id = store.add_document(
        source=source,
        title=title,
        category=category,
        content=content,
        doc_id=doc_id,
        extra_metadata=extra_metadata,
    )
    return index_id


def save_doc_store() -> None:
    """Persist the document store to disk."""
    get_doc_store().save()


def validate_store_alignment() -> bool:
    """
    Ensure FAISS vector count matches doc store count.
    """
    vector_store = get_vector_store()
    doc_store = get_doc_store()

    if vector_store.total_vectors != doc_store.total_documents:
        logger.warning(
            f"FAISS/doc store mismatch: vectors={vector_store.total_vectors}, "
            f"docs={doc_store.total_documents}"
        )
        return False

    logger.info(
        f"FAISS/doc store aligned: {vector_store.total_vectors} vectors, "
        f"{doc_store.total_documents} docs"
    )
    return True


def retrieve_context(
    query_embedding: np.ndarray,
    top_k: int = FAISS_TOP_K,
    score_threshold: float = FAISS_SCORE_THRESHOLD,
) -> List[Dict]:
    """
    Retrieve the top-k most relevant documents for a query embedding.

    Args:
        query_embedding: Dense vector from the embedding model (shape: 384,)
        top_k: Number of results to retrieve
        score_threshold: Minimum similarity score required

    Returns:
        List of structured retrieval results:
        [
            {
                "index_id": 0,
                "doc_id": 123,
                "source": "kb",
                "title": "...",
                "category": "...",
                "content": "...",
                "score": 0.82
            }
        ]
    """
    vector_store = get_vector_store()
    doc_store = get_doc_store()

    if vector_store.total_vectors == 0:
        logger.warning("FAISS index is empty — no context retrieved")
        return []

    if not validate_store_alignment():
        logger.warning("Skipping retrieval due to FAISS/doc store mismatch")
        return []

    try:
        scores, indices = vector_store.search(query_embedding, top_k=top_k)
    except Exception as exc:
        logger.error(f"Vector search failed: {exc}")
        return []

    results: List[Dict] = []

    for score, idx in zip(scores, indices):
        if idx < 0:
            continue

        if float(score) < score_threshold:
            logger.debug(f"Rejected doc idx={idx} score={score:.4f} below threshold={score_threshold}")
            continue

        doc = doc_store.get_document(int(idx))
        if not doc:
            continue

        result = {
            **doc,
            "score": float(score),
        }
        results.append(result)

        logger.debug(f"Retrieved doc idx={idx} score={score:.4f} title={doc.get('title', '')}")

    return results
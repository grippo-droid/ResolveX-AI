"""
vector_store.py — FAISS vector index manager.
Handles building, saving, loading, and querying the FAISS index.
"""

import os
import numpy as np
from typing import Optional
from app.core.logger import logger
from ai.config.ai_config import FAISS_INDEX_PATH, EMBEDDING_DIMENSION

try:
    import faiss
    FAISS_AVAILABLE = True
except ImportError:
    FAISS_AVAILABLE = False
    logger.warning("faiss-cpu not installed – vector search unavailable")


class VectorStore:
    """Wraps a FAISS flat L2 index with load/save/add/search helpers."""

    def __init__(self):
        self.index: Optional[object] = None
        self._load_or_create()

    def _load_or_create(self) -> None:
        """Load existing index from disk, or create a fresh one."""
        if not FAISS_AVAILABLE:
            return
        if os.path.exists(FAISS_INDEX_PATH):
            try:
                self.index = faiss.read_index(FAISS_INDEX_PATH)
                logger.info(f"FAISS index loaded from {FAISS_INDEX_PATH} ({self.index.ntotal} vectors)")
            except Exception as exc:
                logger.error(f"Failed to load FAISS index: {exc}")
                self.index = self._create_index()
        else:
            logger.info("No existing FAISS index found — creating new flat L2 index")
            self.index = self._create_index()

    def _create_index(self):
        """Create a new flat (brute-force) L2 FAISS index."""
        if not FAISS_AVAILABLE:
            return None
        return faiss.IndexFlatL2(EMBEDDING_DIMENSION)

    def add(self, embeddings: np.ndarray) -> None:
        """Add vectors to the index."""
        if self.index is None:
            logger.warning("FAISS index not available — skipping add")
            return
        self.index.add(embeddings)
        logger.debug(f"Added {len(embeddings)} vectors. Total: {self.index.ntotal}")

    def search(self, query_vector: np.ndarray, top_k: int = 5):
        """
        Search for the top-k most similar vectors.

        Returns:
            Tuple of (distances, indices) — both numpy arrays of shape (1, top_k).
        """
        if self.index is None or self.index.ntotal == 0:
            logger.warning("FAISS index empty or unavailable")
            return [], []

        query = query_vector.reshape(1, -1).astype(np.float32)
        distances, indices = self.index.search(query, min(top_k, self.index.ntotal))
        return distances[0], indices[0]

    def save(self) -> None:
        """Persist the FAISS index to disk."""
        if self.index is None:
            return
        os.makedirs(os.path.dirname(FAISS_INDEX_PATH), exist_ok=True)
        faiss.write_index(self.index, FAISS_INDEX_PATH)
        logger.info(f"FAISS index saved to {FAISS_INDEX_PATH}")

    @property
    def total_vectors(self) -> int:
        return self.index.ntotal if self.index else 0


# Module-level singleton (loaded once per process)
_vector_store: Optional[VectorStore] = None


def get_vector_store() -> VectorStore:
    global _vector_store
    if _vector_store is None:
        _vector_store = VectorStore()
    return _vector_store

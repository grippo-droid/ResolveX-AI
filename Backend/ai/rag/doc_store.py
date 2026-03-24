"""
doc_store.py — Persistent document metadata store for RAG.

Maps FAISS vector index -> structured document metadata.
Stored as JSON on disk so FAISS and document metadata stay aligned across restarts.
"""

import os
import json
from typing import List, Dict, Optional
from app.core.logger import logger
from ai.config.ai_config import FAISS_DOCSTORE_PATH


class DocumentStore:
    """Persistent JSON-backed document store."""

    def __init__(self):
        self.documents: List[Dict] = []
        self._load()

    def _load(self) -> None:
        """Load document metadata from disk."""
        if not os.path.exists(FAISS_DOCSTORE_PATH):
            logger.info("No existing doc store found — starting fresh")
            self.documents = []
            return

        try:
            with open(FAISS_DOCSTORE_PATH, "r", encoding="utf-8") as f:
                self.documents = json.load(f)

            if not isinstance(self.documents, list):
                logger.warning("Doc store file invalid — resetting")
                self.documents = []

            logger.info(f"Loaded doc store from {FAISS_DOCSTORE_PATH} ({len(self.documents)} docs)")
        except Exception as exc:
            logger.error(f"Failed to load doc store: {exc}")
            self.documents = []

    def save(self) -> None:
        """Persist document metadata to disk."""
        try:
            os.makedirs(os.path.dirname(FAISS_DOCSTORE_PATH), exist_ok=True)
            with open(FAISS_DOCSTORE_PATH, "w", encoding="utf-8") as f:
                json.dump(self.documents, f, ensure_ascii=False, indent=2)
            logger.info(f"Doc store saved to {FAISS_DOCSTORE_PATH}")
        except Exception as exc:
            logger.error(f"Failed to save doc store: {exc}")

    def add_document(
        self,
        source: str,
        title: str,
        category: str,
        content: str,
        doc_id: Optional[int] = None,
        extra_metadata: Optional[Dict] = None,
    ) -> int:
        """
        Add a structured document and return its vector index.
        """
        index_id = len(self.documents)

        doc = {
            "index_id": index_id,
            "doc_id": doc_id,
            "source": source,          # e.g. "kb", "ticket", "solution"
            "title": title,
            "category": category,
            "content": content,
        }

        if extra_metadata:
            doc.update(extra_metadata)

        self.documents.append(doc)
        return index_id

    def get_document(self, index_id: int) -> Optional[Dict]:
        """Get document by vector index."""
        if 0 <= index_id < len(self.documents):
            return self.documents[index_id]
        return None

    def clear(self) -> None:
        """Clear all documents."""
        self.documents = []

    @property
    def total_documents(self) -> int:
        return len(self.documents)


_doc_store: Optional[DocumentStore] = None


def get_doc_store() -> DocumentStore:
    global _doc_store
    if _doc_store is None:
        _doc_store = DocumentStore()
    return _doc_store
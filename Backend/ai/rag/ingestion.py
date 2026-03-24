"""
ingestion.py — Document ingestion pipeline for RAG.

Builds canonical text, generates embeddings, adds to FAISS,
registers metadata in doc store, and persists both.
"""

from typing import List, Dict
import numpy as np
from app.core.logger import logger
from ai.rag.vector_store import get_vector_store
from ai.rag.retriever import register_document, save_doc_store
from ai.embedding.embedding_model import generate_batch_embeddings


def build_embedding_text(title: str, category: str, content: str, source: str) -> str:
    """
    Build canonical text used for embedding.
    """
    return (
        f"Source: {source}. "
        f"Title: {title}. "
        f"Category: {category}. "
        f"Content: {content}"
    )


def ingest_documents(documents: List[Dict]) -> int:
    """
    Ingest documents into FAISS + persistent doc store.

    Expected input format:
    [
        {
            "doc_id": 1,
            "source": "kb",
            "title": "Resolving 500 Login Errors",
            "category": "software",
            "content": "Clear sessions, restart auth service..."
        }
    ]

    Returns:
        Number of documents ingested.
    """
    if not documents:
        logger.info("No documents provided for ingestion")
        return 0

    texts_to_embed: List[str] = []

    for doc in documents:
        text = build_embedding_text(
            title=doc["title"],
            category=doc["category"],
            content=doc["content"],
            source=doc["source"],
        )
        texts_to_embed.append(text)

    embeddings = generate_batch_embeddings(texts_to_embed)

    if embeddings.ndim != 2 or len(embeddings) != len(documents):
        logger.error("Embedding generation failed or shape mismatch during ingestion")
        return 0

    vector_store = get_vector_store()

    ingested_count = 0
    for i, doc in enumerate(documents):
        emb = embeddings[i].reshape(1, -1).astype(np.float32)

        register_document(
            source=doc["source"],
            title=doc["title"],
            category=doc["category"],
            content=doc["content"],
            doc_id=doc.get("doc_id"),
            extra_metadata=doc.get("extra_metadata"),
        )

        vector_store.add(emb)
        ingested_count += 1

    vector_store.save()
    save_doc_store()

    logger.info(f"Ingested {ingested_count} documents into RAG store")
    return ingested_count
"""
build_vector_index.py — Offline script to build/rebuild the FAISS vector index
from all Knowledge Base entries stored in PostgreSQL.

Run: python scripts/build_vector_index.py
"""

import sys
import os

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.database import SessionLocal, init_db
from app.models.kb_model import KnowledgeBaseEntry
from ai.embedding.embedding_model import generate_batch_embeddings
from ai.rag.vector_store import get_vector_store
from ai.rag.retriever import register_document
from app.core.logger import logger


def build_index():
    logger.info("Starting FAISS index build...")
    init_db()

    db = SessionLocal()
    try:
        entries = db.query(KnowledgeBaseEntry).all()
        if not entries:
            logger.warning("No KB entries found. Run seed_data.py first.")
            return

        texts = [f"{e.title}\n{e.content}" for e in entries]
        logger.info(f"Generating embeddings for {len(texts)} KB entries...")

        embeddings = generate_batch_embeddings(texts)

        store = get_vector_store()
        store.add(embeddings)

        # Register documents in the retriever's in-memory store
        for text in texts:
            register_document(text)

        store.save()
        logger.info(f"✅ FAISS index built with {len(texts)} vectors and saved.")
    except Exception as exc:
        logger.error(f"❌ Index build failed: {exc}")
        raise
    finally:
        db.close()


if __name__ == "__main__":
    build_index()

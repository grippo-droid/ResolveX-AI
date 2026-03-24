"""
seed_data.py — Seed script to populate the database with sample tickets and KB entries.
               Also ingests KB entries into FAISS so RAG similarity scores are non-zero.
Run: python scripts/seed_data.py
"""

import sys
import os

# Ensure backend root is on path
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.database import SessionLocal, init_db
from app.models.ticket_model import Ticket
from app.models.kb_model import KnowledgeBaseEntry
from app.models.user_model import User
from ai.rag.ingestion import ingest_documents
from ai.rag.vector_store import get_vector_store


SAMPLE_TICKETS = [
    Ticket(
        title="Login fails with 500 error",
        description="I get a 500 Internal Server Error when I try to log in.",
        status="open",
        category="software"
    ),
    Ticket(
        title="Invoice not received",
        description="I haven't received my monthly invoice for March.",
        status="open",
        category="other"   # billing moved to "other"
    ),
    Ticket(
        title="Feature request: dark mode",
        description="Please add dark mode to the dashboard.",
        status="open",
        category="software"
    ),
    Ticket(
        title="App crashes on mobile",
        description="The mobile app crashes immediately after launch on iOS 17.",
        status="open",
        category="software"
    ),
    Ticket(
        title="Password reset email not arriving",
        description="I requested a password reset but the email never arrived.",
        status="open",
        category="access_permission"
    ),
]

SAMPLE_KB_ENTRIES = [
    KnowledgeBaseEntry(
        title="Resolving 500 Login Errors",
        content="Clear sessions, restart auth service, check DB connection.",
        category="software"
    ),
    KnowledgeBaseEntry(
        title="Invoice Re-delivery Process",
        content="Manually trigger invoice re-send from the billing portal.",
        category="other"
    ),
    KnowledgeBaseEntry(
        title="iOS App Crash Troubleshooting",
        content="Update to the latest app version and clear cache.",
        category="software"
    ),
    KnowledgeBaseEntry(
        title="Password Reset Email Delivery",
        content="Check spam folder, whitelist noreply@resolvex.ai, resend.",
        category="access_permission"
    ),
]

SAMPLE_USERS = [
    User(name="Alice Agent",  email="alice@resolvex.ai",  role="agent"),
    User(name="Bob Admin",    email="bob@resolvex.ai",    role="admin"),
]


def seed():
    print("Initialising database...")
    init_db()

    db = SessionLocal()
    try:
        if db.query(Ticket).count() == 0:
            db.add_all(SAMPLE_TICKETS)
            print(f"Seeded {len(SAMPLE_TICKETS)} tickets.")

        if db.query(KnowledgeBaseEntry).count() == 0:
            db.add_all(SAMPLE_KB_ENTRIES)
            print(f"Seeded {len(SAMPLE_KB_ENTRIES)} KB entries.")

        if db.query(User).count() == 0:
            db.add_all(SAMPLE_USERS)
            print(f"Seeded {len(SAMPLE_USERS)} users.")

        db.commit()
        print("✅ DB seed complete.")
    except Exception as exc:
        db.rollback()
        print(f"❌ Seed failed: {exc}")
        raise
    finally:
        db.close()

    # ── FAISS ingestion ───────────────────────────────────────────────────────
    # Only ingest if the FAISS index is currently empty (idempotent).
    vector_store = get_vector_store()
    if vector_store.total_vectors == 0:
        print("FAISS index is empty — ingesting KB entries...")
        docs = [
            {
                "doc_id":  i + 1,
                "source":  "kb",
                "title":   entry.title,
                "category": entry.category,
                "content": entry.content,
            }
            for i, entry in enumerate(SAMPLE_KB_ENTRIES)
        ]
        count = ingest_documents(docs)
        print(f"✅ Ingested {count} KB entries into FAISS.")
    else:
        print(f"FAISS already has {vector_store.total_vectors} vectors — skipping ingestion.")


if __name__ == "__main__":
    seed()

"""
constants.py — Application-wide constants for ResolveX-AI.
"""

# ── Ticket Status constants ───────────────────────────────────────────────────
STATUS_OPEN = "open"
STATUS_IN_PROGRESS = "in_progress"
STATUS_AUTO_RESOLVED = "auto_resolved"
STATUS_ESCALATED = "escalated"
STATUS_CLOSED = "closed"

# ── Priority levels ───────────────────────────────────────────────────────────
PRIORITY_LOW = "low"
PRIORITY_MEDIUM = "medium"
PRIORITY_HIGH = "high"
PRIORITY_CRITICAL = "critical"

# ── Confidence thresholds ─────────────────────────────────────────────────────
CONFIDENCE_HIGH = 0.75   # auto-resolve threshold
CONFIDENCE_LOW = 0.50    # escalate to HITL threshold

# ── Ticket categories ─────────────────────────────────────────────────────────
CATEGORIES = [
    "billing",
    "technical",
    "account",
    "feature_request",
    "bug_report",
    "other",
]

# ── File upload limits ────────────────────────────────────────────────────────
ALLOWED_EXTENSIONS = {".pdf", ".png", ".jpg", ".jpeg", ".txt", ".log"}
MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024  # 10 MB

# ── Embedding ─────────────────────────────────────────────────────────────────
EMBEDDING_DIMENSION = 384   # all-MiniLM-L6-v2 output size
TOP_K_RETRIEVAL = 5         # number of similar docs to retrieve

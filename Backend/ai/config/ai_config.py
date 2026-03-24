"""
ai_config.py — AI-specific configuration constants and model settings.
Centralises all hyperparameters for the AI pipeline.
"""

# ── Embedding ─────────────────────────────────────────────────────────────────
EMBEDDING_MODEL_NAME = "all-MiniLM-L6-v2"
EMBEDDING_DIMENSION = 384

# ── FAISS ─────────────────────────────────────────────────────────────────────
FAISS_INDEX_PATH = "storage/faiss_index.bin"
FAISS_TOP_K = 5

# ── Groq LLM ─────────────────────────────────────────────────────────────────
GROQ_MODEL = "llama-3.3-70b-versatile"
GROQ_MAX_TOKENS = 1024
GROQ_TEMPERATURE = 0.3

# ── Classification ────────────────────────────────────────────────────────────
SUPPORTED_CATEGORIES = ["billing", "technical", "account", "feature_request", "bug_report", "other"]
CLASSIFICATION_CONFIDENCE_THRESHOLD = 0.6

# ── Confidence weights (must sum to 1.0) ─────────────────────────────────────
CONFIDENCE_WEIGHT_SIMILARITY = 0.4
CONFIDENCE_WEIGHT_LLM_SCORE = 0.3
CONFIDENCE_WEIGHT_CLASSIFICATION = 0.3

# ── OCR ───────────────────────────────────────────────────────────────────────
OCR_LANGUAGE = "eng"
OCR_ENABLED = True

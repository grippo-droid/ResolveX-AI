from transformers import pipeline
from groq import Groq
from typing import Tuple
import os
from dotenv import load_dotenv
import re
from app.core.logger import logger

load_dotenv()

classifier = pipeline(
    "zero-shot-classification",
    model="facebook/bart-large-mnli",
    device=-1
)

groq_api_key = os.getenv("GROQ_API_KEY")
if not groq_api_key:
    logger.error("GROQ_API_KEY not found in .env")
    groq_client = None
else:
    groq_client = Groq(api_key=groq_api_key)
    logger.info("Groq client loaded from .env")


# Fine-grained internal categories
IT_CATEGORIES = [
    "server_error",
    "database_error",
    "network_error",
    "vpn_error",
    "hardware_error",
    "windows_error",
    "login_error",
    "email_error",
    "billing_error",
    "access_error",
    "performance_error",
    "security_error",
    "mouse_error",
    "printer_error",
    "keyboard_error",
]

# Final fixed 6-category taxonomy
CATEGORY_MAP = {
    # SOFTWARE
    "server_error": "software",
    "database_error": "software",
    "windows_error": "software",
    "performance_error": "software",
    "email_error": "software",

    # NETWORK
    "network_error": "network",
    "vpn_error": "network",

    # HARDWARE
    "hardware_error": "hardware",
    "mouse_error": "hardware",
    "printer_error": "hardware",
    "keyboard_error": "hardware",

    # ACCESS & PERMISSION
    "login_error": "access_permission",
    "access_error": "access_permission",

    # SECURITY
    "security_error": "security",

    # OTHER
    "billing_error": "other",
}


def llm_classify_fallback(text: str) -> Tuple[str, float]:
    if not groq_client:
        return "software", 0.75

    try:
        completion = groq_client.chat.completions.create(
            model="llama-3.3-70b-versatile",
            messages=[
                {
                    "role": "system",
                    "content": f"""
Classify the IT support ticket into exactly ONE of these categories:
{', '.join(IT_CATEGORIES)}

Return ONLY in this exact format:
category,confidence

Where:
- category must be one of the listed categories
- confidence must be a float between 0.0 and 1.0

Example:
login_error,0.92
""".strip()
                },
                {"role": "user", "content": text[:1000]}
            ],
            max_tokens=30,
            temperature=0.1
        )

        response = completion.choices[0].message.content.strip()

        if "," in response:
            category, conf_str = response.split(",", 1)
            category = category.strip()
            confidence = float(conf_str.strip())

            final_category = CATEGORY_MAP.get(category, "other")
            logger.info(
                f"Groq LLM fallback: {category} -> {final_category} ({confidence:.2f})"
            )
            return final_category, confidence

        return "software", 0.80

    except Exception as e:
        logger.error(f"Groq fallback failed: {e}")
        return "software", 0.75


def classify_ticket(text: str) -> Tuple[str, float]:
    text = text.strip()
    if len(text) < 5:
        return "software", 0.50

    text_lower = text.lower()

    patterns = {
        # SOFTWARE
        r"\b(500|internal server|server error)\b": ("server_error", 0.98),
        r"\b(database|postgres|mysql|sql|connection refused|db error|query failed)\b": ("database_error", 0.97),
        r"\b(blue screen|bsod|windows.*error|win\d+.*error)\b": ("windows_error", 0.97),
        r"\b(slow|performance|lag|hang|hanging|freezing|freeze|memory leak|high cpu|high ram)\b": ("performance_error", 0.92),
        r"\b(email|outlook|mailbox|smtp|imap|email delivery|mail not working)\b": ("email_error", 0.93),

        # NETWORK
        r"\b(vpn)\b": ("vpn_error", 0.97),
        r"\b(network|wifi|wi-fi|internet|connection timeout|ping fail|latency|packet loss|dns)\b": ("network_error", 0.96),

        # HARDWARE
        r"\b(mouse|trackpad|click|cursor|pointer)\b.*?(broken|not working|dead|stopped|issue|problem)": ("mouse_error", 0.97),
        r"\b(keyboard|keys?|typing)\b.*?(not working|broken|dead|stuck|issue|problem)": ("keyboard_error", 0.96),
        r"\b(printer|print)\b.*?(not working|jam|offline|error|issue|problem)": ("printer_error", 0.95),
        r"\b(monitor|screen|display|laptop|desktop|cpu|battery|charger|fan|motherboard|usb port)\b.*?(blank|black|flicker|dead|broken|damaged|not working|issue|problem)": ("hardware_error", 0.95),

        # ACCESS & PERMISSION
        r"\b(login|password|auth|authentication|access denied|permission denied|unauthorized|forbidden|reset password|password reset)\b": ("login_error", 0.95),
        r"\b(role access|permission|privilege|grant access|revoke access|cannot access|no access)\b": ("access_error", 0.94),

        # SECURITY
        r"\b(security|malware|virus|phishing|hacked|breach|suspicious login|ransomware|threat)\b": ("security_error", 0.97),

        # OTHER
        r"\b(billing|invoice|payment|refund|charge|subscription)\b": ("billing_error", 0.94),
    }

    for pattern, (cat, conf) in patterns.items():
        if re.search(pattern, text_lower, re.IGNORECASE):
            final_cat = CATEGORY_MAP.get(cat, "other")
            logger.info(f"Pattern match: {cat} -> {final_cat} ({conf:.3f})")
            return final_cat, conf

    try:
        result = classifier(text[:512], IT_CATEGORIES)
        raw_cat = result["labels"][0]
        ml_conf = result["scores"][0]

        if ml_conf > 0.35:
            final_cat = CATEGORY_MAP.get(raw_cat, "other")
            calibrated = min(0.95, ml_conf * 1.2 + 0.05)
            logger.info(f"Zero-shot: {raw_cat} -> {final_cat} ({calibrated:.3f})")
            return final_cat, float(calibrated)

    except Exception as e:
        logger.warning(f"Zero-shot failed: {e}")

    logger.info("Using Groq LLM fallback")
    return llm_classify_fallback(text)
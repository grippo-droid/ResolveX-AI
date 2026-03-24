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

IT_CATEGORIES = [
    "server_error", "database_error", "network_error", "vpn_error", "hardware_error",
    "windows_error", "login_error", "email_error", "billing_error", "access_error",
    "performance_error", "security_error", "mouse_error", "printer_error", "keyboard_error"
]

CATEGORY_MAP = {
    "server_error": "technical", "database_error": "technical", "network_error": "technical",
    "vpn_error": "technical", "hardware_error": "technical", "windows_error": "technical",
    "performance_error": "technical", "email_error": "technical", "mouse_error": "technical",
    "printer_error": "technical", "keyboard_error": "technical",
    "login_error": "account", "access_error": "account",
    "billing_error": "billing", 
    "security_error": "security"
}

def llm_classify_fallback(text: str) -> Tuple[str, float]:
    if not groq_client:
        return "technical", 0.75
    
    try:
        completion = groq_client.chat.completions.create(
            model="llama-3.3-70b-versatile",
            messages=[
                {
                    "role": "system", 
                    "content": f"Classify IT ticket into one category from: {', '.join(IT_CATEGORIES)}. Respond ONLY with: CATEGORY,confidence where confidence is 0.0-1.0"
                },
                {"role": "user", "content": text[:1000]}
            ],
            max_tokens=30,
            temperature=0.1
        )
        
        response = completion.choices[0].message.content.strip()
        if "," in response:
            category, conf_str = response.split(",", 1)
            confidence = float(conf_str.strip())
            final_category = CATEGORY_MAP.get(category.strip(), "technical")
            logger.info(f"Groq LLM fallback: {category.strip()} -> {final_category} ({confidence:.2f})")
            return final_category, confidence
        return "technical", 0.80
        
    except Exception as e:
        logger.error(f"Groq fallback failed: {e}")
        return "technical", 0.75

def classify_ticket(text: str) -> Tuple[str, float]:
    text = text.strip()
    if len(text) < 5:
        return "technical", 0.5
    
    text_lower = text.lower()
    
    patterns = {
        r"\b(500|internal server|server error)\b": ("server_error", 0.98),
        r"\b(mouse|trackpad|click|cursor|pointer)\b.*?(broken|not working|dead|stopped)": ("mouse_error", 0.97),
        r"\b(keyboard|keys?|typing)\b.*?(not working|broken|dead|stuck)": ("keyboard_error", 0.96),
        r"\b(printer|print)\b.*?(not working|jam|offline|error)": ("printer_error", 0.95),
        r"\b(monitor|screen|display)\b.*?(blank|black|flicker|dead)": ("hardware_error", 0.95),
        r"\b(blue screen|bsod|windows.*error|win\d+.*error)\b": ("windows_error", 0.97),
        r"\b(vpn|network|wifi|connection.*timeout|ping.*fail)\b": ("network_error", 0.96),
        r"\b(database|postgres|mysql|sql|connection refused)\b": ("database_error", 0.97),
        r"\b(login|password|auth|authentication|access denied)\b": ("login_error", 0.95),
        r"\b(billing|invoice|payment|refund|charge|subscription)\b": ("billing_error", 0.94),
        r"\b(slow|performance|lag|hang|freezing|memory)\b": ("performance_error", 0.92),
    }
    
    for pattern, (cat, conf) in patterns.items():
        if re.search(pattern, text_lower, re.IGNORECASE):
            final_cat = CATEGORY_MAP.get(cat, "technical")
            logger.info(f"Pattern match: {cat} -> {final_cat} ({conf:.3f})")
            return final_cat, conf
    
    try:
        result = classifier(text[:512], IT_CATEGORIES)
        raw_cat = result['labels'][0]
        ml_conf = result['scores'][0]
        
        if ml_conf > 0.35:
            final_cat = CATEGORY_MAP.get(raw_cat, "technical")
            calibrated = min(0.95, ml_conf * 1.2 + 0.05)
            logger.info(f"Zero-shot: {raw_cat} -> {final_cat} ({calibrated:.3f})")
            return final_cat, float(calibrated)
    
    except Exception as e:
        logger.warning(f"Zero-shot failed: {e}")
    
    logger.info("Using Groq LLM fallback")
    return llm_classify_fallback(text)

if __name__ == "__main__":
    tests = [
        "500 internal server error when accessing dashboard",
        "My mouse is broken left click not working",
        "Windows blue screen error after update", 
        "Printer offline cannot print documents",
        "VPN connection timeout error code 812",
        "Random text that doesnt match anything",
        "Billing invoice 12345 not received",
        "Cannot login after password reset",
        "Database connection refused port 5432"
    ]
    
    print("Production Classifier Test Results:")
    print("-" * 60)
    for text in tests:
        category, confidence = classify_ticket(text)
        print(f"'{text[:40]}...' -> {category:12s} ({confidence:.3f})")

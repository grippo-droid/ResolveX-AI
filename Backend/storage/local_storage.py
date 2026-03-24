"""
local_storage.py — Local filesystem storage implementation.
Stores uploaded files in a configurable directory.
"""

import os
import uuid
from app.core.logger import logger


class LocalStorage:
    """Stores files on the local filesystem under `base_dir`."""

    def __init__(self, base_dir: str = "uploads"):
        self.base_dir = base_dir
        os.makedirs(self.base_dir, exist_ok=True)

    def write(self, filename: str, content: bytes) -> str:
        """
        Write bytes to a file.
        Prefixes with a UUID to avoid name collisions.

        Returns:
            Full path of the saved file.
        """
        safe_name = f"{uuid.uuid4().hex}_{filename}"
        full_path = os.path.join(self.base_dir, safe_name)
        with open(full_path, "wb") as f:
            f.write(content)
        logger.debug(f"LocalStorage: wrote {len(content)} bytes to {full_path}")
        return full_path

    def remove(self, path: str) -> None:
        """Delete a file from disk."""
        try:
            os.remove(path)
            logger.debug(f"LocalStorage: deleted {path}")
        except FileNotFoundError:
            logger.warning(f"LocalStorage: file not found for deletion: {path}")

    def exists(self, path: str) -> bool:
        return os.path.exists(path)

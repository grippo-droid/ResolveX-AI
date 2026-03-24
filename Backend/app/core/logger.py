"""
logger.py — Centralized structured logger for ResolveX-AI.
"""

import logging
import sys


def _build_logger(name: str) -> logging.Logger:
    handler = logging.StreamHandler(sys.stdout)
    handler.setFormatter(
        logging.Formatter(
            fmt="%(asctime)s | %(levelname)-8s | %(name)s | %(message)s",
            datefmt="%Y-%m-%d %H:%M:%S",
        )
    )
    _logger = logging.getLogger(name)
    _logger.addHandler(handler)
    _logger.setLevel(logging.DEBUG)
    _logger.propagate = False
    return _logger


# Single shared logger instance — import this everywhere
logger = _build_logger("resolvex")

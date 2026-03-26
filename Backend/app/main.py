"""
main.py — FastAPI application factory for ResolveX-AI.

Registers all routers, sets up CORS, lifespan events, and global exception handlers.
"""

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from contextlib import asynccontextmanager

from app.config import settings
from app.database import init_db
from app.core.logger import logger
from app.core.exceptions import ResolveXException
from app.routes import ticket_routes, resolution_routes, analytics_routes, health_routes, ws_routes


# ── Lifespan (startup / shutdown) ────────────────────────────────────────────

@asynccontextmanager
async def lifespan(app: FastAPI):
    """Run startup logic, then yield, then run shutdown logic."""
    logger.info(f"🚀 Starting {settings.APP_NAME} v{settings.APP_VERSION}")
    init_db()       # create tables if they don't exist
    logger.info("✅ Database tables initialised")
    yield
    logger.info("👋 Shutting down ResolveX-AI")


# ── App factory ───────────────────────────────────────────────────────────────

app = FastAPI(
    title=settings.APP_NAME,
    version=settings.APP_VERSION,
    description=(
        "Intelligent Auto-Handling of Support Tickets "
        "with Confidence-Based Human-in-the-Loop"
    ),
    docs_url="/docs",
    redoc_url="/redoc",
    lifespan=lifespan,
)

# ── CORS ──────────────────────────────────────────────────────────────────────

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],   # tighten this in production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ── Global exception handler ──────────────────────────────────────────────────

@app.exception_handler(ResolveXException)
async def resolvex_exception_handler(request: Request, exc: ResolveXException):
    logger.error(f"ResolveXException: {exc.detail}")
    return JSONResponse(status_code=exc.status_code, content={"detail": exc.detail})


@app.exception_handler(Exception)
async def generic_exception_handler(request: Request, exc: Exception):
    logger.exception("Unhandled exception")
    return JSONResponse(status_code=500, content={"detail": "Internal server error"})


# ── Routers ───────────────────────────────────────────────────────────────────

API_PREFIX = "/api/v1"

app.include_router(health_routes.router,     prefix=API_PREFIX, tags=["Health"])
app.include_router(ticket_routes.router,     prefix=API_PREFIX, tags=["Tickets"])
app.include_router(resolution_routes.router, prefix=API_PREFIX, tags=["Resolution"])
app.include_router(analytics_routes.router,  prefix=API_PREFIX, tags=["Analytics"])
app.include_router(ws_routes.router,         prefix=f"{API_PREFIX}/ws", tags=["WebSockets"])

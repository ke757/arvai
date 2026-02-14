"""FastAPI application entry point for Arvai Kernel."""

import logging
from contextlib import asynccontextmanager
from collections.abc import AsyncGenerator

import uvicorn
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.config import get_settings
from app.database import init_db, close_db
from app.routers.bookmarks import router as bookmarks_router

logger = logging.getLogger("arvai-kernel")


# ---------------------------------------------------------------------------
# Lifespan: startup / shutdown
# ---------------------------------------------------------------------------

@asynccontextmanager
async def lifespan(_app: FastAPI) -> AsyncGenerator[None, None]:
    settings = get_settings()
    logger.info(
        "Starting %s v%s → %s:%s",
        settings.app.name,
        settings.app.version,
        settings.server.host,
        settings.server.port,
    )
    await init_db()
    logger.info("Database ready: %s", settings.database.path)

    yield  # --- application running ---

    await close_db()
    logger.info("Shutdown complete.")


# ---------------------------------------------------------------------------
# Application factory
# ---------------------------------------------------------------------------

def create_app() -> FastAPI:
    settings = get_settings()

    app = FastAPI(
        title=settings.app.name,
        version=settings.app.version,
        description="AI-powered bookmark knowledge management service",
        lifespan=lifespan,
    )

    # CORS
    app.add_middleware(
        CORSMiddleware,
        allow_origins=settings.server.cors_origins,
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    # Routers
    app.include_router(bookmarks_router)

    # Health check
    @app.get("/health", tags=["system"])
    async def health():
        return {"status": "ok", "version": settings.app.version}

    return app


# ---------------------------------------------------------------------------
# CLI entry point
# ---------------------------------------------------------------------------

def run() -> None:
    settings = get_settings()
    logging.basicConfig(
        level=logging.DEBUG if settings.server.debug else logging.INFO,
        format="%(asctime)s  %(levelname)-8s  %(name)s  %(message)s",
    )
    uvicorn.run(
        "app.main:create_app",
        factory=True,
        host=settings.server.host,
        port=settings.server.port,
        reload=settings.server.debug,
    )


if __name__ == "__main__":
    run()

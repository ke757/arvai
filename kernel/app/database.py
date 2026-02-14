"""Async SQLite database engine and session management via SQLModel."""

from collections.abc import AsyncGenerator
from pathlib import Path

from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession
from sqlalchemy.orm import sessionmaker
from sqlmodel import SQLModel

from app.config import get_settings

# ---------------------------------------------------------------------------
# Engine (module-level singleton, created lazily)
# ---------------------------------------------------------------------------

_engine = None


def _get_engine():
    global _engine
    if _engine is None:
        settings = get_settings()
        db_path = Path(settings.database.path)
        db_path.parent.mkdir(parents=True, exist_ok=True)

        db_url = f"sqlite+aiosqlite:///{db_path}"
        _engine = create_async_engine(db_url, echo=settings.server.debug)
    return _engine


# Session factory
_async_session_factory = None


def _get_session_factory():
    global _async_session_factory
    if _async_session_factory is None:
        _async_session_factory = sessionmaker(
            bind=_get_engine(),
            class_=AsyncSession,
            expire_on_commit=False,
        )
    return _async_session_factory


# ---------------------------------------------------------------------------
# Lifecycle helpers (called from main.py lifespan)
# ---------------------------------------------------------------------------

async def init_db() -> None:
    """Create all tables defined in SQLModel metadata."""
    engine = _get_engine()
    async with engine.begin() as conn:
        await conn.run_sync(SQLModel.metadata.create_all)


async def close_db() -> None:
    """Dispose of the engine connection pool."""
    global _engine, _async_session_factory
    if _engine is not None:
        await _engine.dispose()
        _engine = None
        _async_session_factory = None


# ---------------------------------------------------------------------------
# FastAPI dependency
# ---------------------------------------------------------------------------

async def get_session() -> AsyncGenerator[AsyncSession, None]:
    """Yield an async session for use in route handlers via `Depends`."""
    factory = _get_session_factory()
    async with factory() as session:
        yield session

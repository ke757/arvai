"""API Key authentication module for browser extension."""

import hashlib
import secrets
from datetime import datetime, timezone
from typing import Annotated, Optional

from fastapi import Header, HTTPException, Depends
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_session
from app.models import ApiKey


# ---------------------------------------------------------------------------
# Key Generation & Hashing
# ---------------------------------------------------------------------------

def generate_api_key() -> str:
    """Generate a new API key with 'arvai_' prefix."""
    random_part = secrets.token_hex(16)  # 32 chars
    return f"arvai_{random_part}"


def hash_api_key(key: str) -> str:
    """Hash an API key using SHA256."""
    return hashlib.sha256(key.encode()).hexdigest()


def get_key_prefix(key: str) -> str:
    """Get the display prefix of an API key (first 12 chars)."""
    return key[:12] if len(key) >= 12 else key


# ---------------------------------------------------------------------------
# API Key Verification Dependency
# ---------------------------------------------------------------------------

async def verify_api_key(
    session: Annotated[AsyncSession, Depends(get_session)],
    x_arvai_api_key: Annotated[Optional[str], Header()] = None,
) -> ApiKey:
    """
    FastAPI dependency to verify API key from request header.
    
    Expects header: X-Arvai-API-Key: arvai_xxx
    """
    if not x_arvai_api_key:
        raise HTTPException(
            status_code=401,
            detail="Missing API key. Include 'X-Arvai-API-Key' header.",
        )
    
    if not x_arvai_api_key.startswith("arvai_"):
        raise HTTPException(
            status_code=401,
            detail="Invalid API key format. Key must start with 'arvai_'.",
        )
    
    key_hash = hash_api_key(x_arvai_api_key)
    
    stmt = select(ApiKey).where(
        ApiKey.key_hash == key_hash,
        ApiKey.is_active == True,
    )
    result = await session.execute(stmt)
    api_key = result.scalar_one_or_none()
    
    if api_key is None:
        raise HTTPException(
            status_code=401,
            detail="Invalid or revoked API key.",
        )
    
    # Update last_used_at
    api_key.last_used_at = datetime.now(timezone.utc)
    await session.commit()
    
    return api_key


# Type alias for dependency injection
ApiKeyDep = Annotated[ApiKey, Depends(verify_api_key)]

"""API Key CRUD operations."""

from sqlalchemy.ext.asyncio import AsyncSession
from sqlmodel import select

from app.models import ApiKey
from app.schemas import ApiKeyOut, ApiKeyCreated
from app.auth import generate_api_key, hash_api_key, get_key_prefix


def _to_response(api_key: ApiKey) -> ApiKeyOut:
    """Convert an ApiKey model to API response schema."""
    return ApiKeyOut(
        id=api_key.id,  # type: ignore
        key_prefix=api_key.key_prefix,
        name=api_key.name,
        is_active=api_key.is_active,
        created_at=api_key.created_at,
        last_used_at=api_key.last_used_at,
    )


async def create(session: AsyncSession, *, name: str = "Extension") -> ApiKeyCreated:
    """Create a new API key. Returns the full key (only shown once)."""
    key = generate_api_key()
    key_hash = hash_api_key(key)
    key_prefix = get_key_prefix(key)

    api_key = ApiKey(
        key_hash=key_hash,
        key_prefix=key_prefix,
        name=name,
        is_active=True,
    )
    session.add(api_key)
    await session.commit()
    await session.refresh(api_key)

    return ApiKeyCreated(
        id=api_key.id,  # type: ignore
        key=key,  # Full key, only returned once
        key_prefix=key_prefix,
        name=api_key.name,
        created_at=api_key.created_at,
    )


async def list_all(session: AsyncSession) -> list[ApiKeyOut]:
    """List all API keys (without full key values)."""
    stmt = select(ApiKey).order_by(ApiKey.created_at.desc())
    result = await session.execute(stmt)
    keys = result.scalars().all()
    return [_to_response(k) for k in keys]


async def revoke(session: AsyncSession, key_id: int) -> bool:
    """Revoke (deactivate) an API key. Returns True if found and revoked."""
    stmt = select(ApiKey).where(ApiKey.id == key_id)
    result = await session.execute(stmt)
    api_key = result.scalar_one_or_none()

    if not api_key:
        return False

    api_key.is_active = False
    await session.commit()
    return True


async def delete(session: AsyncSession, key_id: int) -> bool:
    """Delete an API key permanently. Returns True if deleted."""
    stmt = select(ApiKey).where(ApiKey.id == key_id)
    result = await session.execute(stmt)
    api_key = result.scalar_one_or_none()

    if not api_key:
        return False

    await session.delete(api_key)
    await session.commit()
    return True

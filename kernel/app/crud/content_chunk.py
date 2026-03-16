"""ContentChunk CRUD operations."""

from datetime import datetime, timezone
from typing import Optional

from sqlalchemy.ext.asyncio import AsyncSession
from sqlmodel import select, delete

from app.models import ContentChunk


async def create_chunks(
    session: AsyncSession,
    bookmark_id: int,
    chunks_data: list[tuple[str, str, int]],  # (chunk_id, content, index)
) -> list[ContentChunk]:
    """Create multiple content chunks for a bookmark.

    Args:
        session: Database session
        bookmark_id: Parent bookmark ID
        chunks_data: List of (chunk_id, content, index) tuples

    Returns:
        List of created ContentChunk objects
    """
    chunks = [
        ContentChunk(
            chunk_id=chunk_id,
            bookmark_id=bookmark_id,
            content=content,
            index=index,
            created_at=datetime.now(timezone.utc),
        )
        for chunk_id, content, index in chunks_data
    ]

    session.add_all(chunks)
    await session.commit()

    # Refresh all chunks to get their IDs
    for chunk in chunks:
        await session.refresh(chunk)

    return chunks


async def get_chunks_by_bookmark(
    session: AsyncSession,
    bookmark_id: int,
) -> list[ContentChunk]:
    """Get all chunks belonging to a bookmark.

    Args:
        session: Database session
        bookmark_id: Bookmark ID

    Returns:
        List of ContentChunk objects ordered by index
    """
    stmt = (
        select(ContentChunk)
        .where(ContentChunk.bookmark_id == bookmark_id)
        .order_by(ContentChunk.index)
    )
    result = await session.execute(stmt)
    return list(result.scalars().all())


async def get_chunk_by_chunk_id(
    session: AsyncSession,
    chunk_id: str,
) -> Optional[ContentChunk]:
    """Get a chunk by its UUID chunk_id.

    Args:
        session: Database session
        chunk_id: The chunk UUID

    Returns:
        ContentChunk object or None
    """
    stmt = select(ContentChunk).where(ContentChunk.chunk_id == chunk_id)
    result = await session.execute(stmt)
    return result.scalar_one_or_none()


async def delete_chunks_by_bookmark(
    session: AsyncSession,
    bookmark_id: int,
) -> int:
    """Delete all chunks belonging to a bookmark.

    Args:
        session: Database session
        bookmark_id: Bookmark ID

    Returns:
        Number of chunks deleted
    """
    stmt = delete(ContentChunk).where(ContentChunk.bookmark_id == bookmark_id)
    result = await session.execute(stmt)
    await session.commit()
    return result.rowcount or 0


async def get_chunk_count(
    session: AsyncSession,
    bookmark_id: Optional[int] = None,
) -> int:
    """Get the count of chunks.

    Args:
        session: Database session
        bookmark_id: Optional bookmark ID to filter by

    Returns:
        Number of chunks
    """
    from sqlmodel import func

    stmt = select(func.count(ContentChunk.id))
    if bookmark_id is not None:
        stmt = stmt.where(ContentChunk.bookmark_id == bookmark_id)

    result = await session.execute(stmt)
    return result.scalar() or 0


async def chunk_exists(
    session: AsyncSession,
    chunk_id: str,
) -> bool:
    """Check if a chunk exists by its chunk_id.

    Args:
        session: Database session
        chunk_id: The chunk UUID

    Returns:
        True if exists, False otherwise
    """
    from sqlmodel import func

    stmt = select(func.count(ContentChunk.id)).where(ContentChunk.chunk_id == chunk_id)
    result = await session.execute(stmt)
    return (result.scalar() or 0) > 0

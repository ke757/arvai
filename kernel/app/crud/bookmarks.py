"""Bookmark CRUD operations."""

from datetime import datetime, timezone
from urllib.parse import urlparse
from typing import Optional

from sqlalchemy.ext.asyncio import AsyncSession
from sqlmodel import select, func, col, or_

from app.models import Bookmark
from app.schemas import BookmarkOut


def _extract_domain(url: str) -> str:
    """Extract domain from URL."""
    try:
        return urlparse(url).hostname or ""
    except Exception:
        return ""


def _to_response(bookmark: Bookmark) -> BookmarkOut:
    """Convert a Bookmark model to API response schema."""
    return BookmarkOut(
        id=bookmark.id,  # type: ignore
        url=bookmark.url,
        title=bookmark.title,
        description=bookmark.description,
        favicon=bookmark.favicon,
        domain=bookmark.domain,
        tags=bookmark.tag_list,
        source=bookmark.source,
        created_at=bookmark.created_at,
        updated_at=bookmark.updated_at,
    )


async def create(
    session: AsyncSession,
    *,
    url: str,
    title: str = "",
    description: str = "",
    favicon: str = "",
    tags: Optional[list[str]] = None,
    source: str = "extension",
) -> BookmarkOut:
    """
    Create a new bookmark or update if URL already exists (upsert).
    """
    domain = _extract_domain(url)
    tags_str = ",".join(tags or [])

    # Check if bookmark exists
    stmt = select(Bookmark).where(Bookmark.url == url)
    result = await session.execute(stmt)
    existing = result.scalar_one_or_none()

    if existing:
        # Update existing: only update non-empty fields
        if title:
            existing.title = title
        if description:
            existing.description = description
        if favicon:
            existing.favicon = favicon
        if tags_str:
            existing.tags = tags_str
        existing.domain = domain
        existing.source = source
        existing.updated_at = datetime.now(timezone.utc)
        await session.commit()
        await session.refresh(existing)
        return _to_response(existing)
    else:
        # Create new
        bookmark = Bookmark(
            url=url,
            title=title,
            description=description,
            favicon=favicon,
            domain=domain,
            tags=tags_str,
            source=source,
        )
        session.add(bookmark)
        await session.commit()
        await session.refresh(bookmark)
        return _to_response(bookmark)


async def get_by_id(session: AsyncSession, bookmark_id: int) -> Optional[BookmarkOut]:
    """Get a bookmark by its ID."""
    stmt = select(Bookmark).where(Bookmark.id == bookmark_id)
    result = await session.execute(stmt)
    bookmark = result.scalar_one_or_none()
    return _to_response(bookmark) if bookmark else None


async def get_by_url(session: AsyncSession, url: str) -> Optional[BookmarkOut]:
    """Get a bookmark by its URL."""
    stmt = select(Bookmark).where(Bookmark.url == url)
    result = await session.execute(stmt)
    bookmark = result.scalar_one_or_none()
    return _to_response(bookmark) if bookmark else None


async def list_all(
    session: AsyncSession,
    *,
    query: Optional[str] = None,
    tag: Optional[str] = None,
    limit: int = 50,
    offset: int = 0,
) -> tuple[list[BookmarkOut], int]:
    """
    List bookmarks with optional keyword/tag filter.
    Returns (items, total_count).
    """
    # Build base query
    stmt = select(Bookmark)
    count_stmt = select(func.count(Bookmark.id))

    # Apply filters
    conditions = []

    if query:
        like_pattern = f"%{query}%"
        conditions.append(
            or_(
                col(Bookmark.title).ilike(like_pattern),
                col(Bookmark.url).ilike(like_pattern),
                col(Bookmark.description).ilike(like_pattern),
                col(Bookmark.domain).ilike(like_pattern),
            )
        )

    if tag:
        # Match tag in comma-separated list
        conditions.append(
            or_(
                col(Bookmark.tags).ilike(f"{tag},%"),      # starts with
                col(Bookmark.tags).ilike(f"%,{tag},%"),    # in middle
                col(Bookmark.tags).ilike(f"%,{tag}"),      # ends with
                col(Bookmark.tags) == tag,                  # exact match (single tag)
            )
        )

    if conditions:
        for cond in conditions:
            stmt = stmt.where(cond)
            count_stmt = count_stmt.where(cond)

    # Get total count
    count_result = await session.execute(count_stmt)
    total = count_result.scalar() or 0

    # Apply ordering and pagination
    stmt = stmt.order_by(Bookmark.created_at.desc()).offset(offset).limit(limit)

    result = await session.execute(stmt)
    bookmarks = result.scalars().all()

    return [_to_response(b) for b in bookmarks], total


async def update(
    session: AsyncSession,
    bookmark_id: int,
    *,
    title: Optional[str] = None,
    description: Optional[str] = None,
    favicon: Optional[str] = None,
    tags: Optional[list[str]] = None,
) -> Optional[BookmarkOut]:
    """Update a bookmark by ID. Only provided fields are updated."""
    stmt = select(Bookmark).where(Bookmark.id == bookmark_id)
    result = await session.execute(stmt)
    bookmark = result.scalar_one_or_none()

    if not bookmark:
        return None

    if title is not None:
        bookmark.title = title
    if description is not None:
        bookmark.description = description
    if favicon is not None:
        bookmark.favicon = favicon
    if tags is not None:
        bookmark.tags = ",".join(tags)

    bookmark.updated_at = datetime.now(timezone.utc)

    await session.commit()
    await session.refresh(bookmark)
    return _to_response(bookmark)


async def delete(session: AsyncSession, bookmark_id: int) -> bool:
    """Delete a bookmark by ID. Returns True if deleted, False if not found."""
    stmt = select(Bookmark).where(Bookmark.id == bookmark_id)
    result = await session.execute(stmt)
    bookmark = result.scalar_one_or_none()

    if not bookmark:
        return False

    await session.delete(bookmark)
    await session.commit()
    return True

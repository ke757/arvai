"""Bookmark API router — CRUD endpoints for browser extension and frontend."""

from typing import Optional, Annotated

from fastapi import APIRouter, HTTPException, Query, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_session
from app.schemas import (
    BookmarkCreate,
    BookmarkUpdate,
    BookmarkOut,
    BookmarkListOut,
    BookmarkCheckOut,
    MessageOut,
)
from app.auth import ApiKeyDep
from app import crud

router = APIRouter(prefix="/api/bookmarks", tags=["bookmarks"])

# Type alias for session dependency
SessionDep = Annotated[AsyncSession, Depends(get_session)]


# ---------------------------------------------------------------------------
# GET /api/bookmarks/check — check if URL is bookmarked (requires auth)
# ---------------------------------------------------------------------------

@router.get("/check", response_model=BookmarkCheckOut)
async def check_bookmark(
    url: str,
    session: SessionDep,
    api_key: ApiKeyDep,
):
    """Check if a URL is already bookmarked. Requires API key authentication."""
    bookmark = await crud.get_bookmark_by_url(session, url)
    if bookmark:
        return BookmarkCheckOut(
            bookmarked=True,
            bookmark_id=bookmark.id,
            created_at=bookmark.created_at,
        )
    return BookmarkCheckOut(bookmarked=False)


# ---------------------------------------------------------------------------
# POST /api/bookmarks  — save a tab (browser extension entry point)
# ---------------------------------------------------------------------------

@router.post("", response_model=BookmarkOut, status_code=201)
async def create_bookmark(payload: BookmarkCreate, session: SessionDep, api_key: ApiKeyDep):
    """Save a bookmark. Duplicate URLs will update the existing record. Requires API key."""
    result = await crud.create_bookmark(
        session,
        url=str(payload.url),
        title=payload.title,
        description=payload.description,
        favicon=payload.favicon,
        tags=payload.tags,
        source=payload.source,
    )
    return result


# ---------------------------------------------------------------------------
# GET /api/bookmarks  — list / search bookmarks
# ---------------------------------------------------------------------------

@router.get("", response_model=BookmarkListOut)
async def list_bookmarks(
    session: SessionDep,
    api_key: ApiKeyDep,
    q: Optional[str] = Query(None, description="关键字搜索"),
    tag: Optional[str] = Query(None, description="按标签筛选"),
    limit: int = Query(50, ge=1, le=200),
    offset: int = Query(0, ge=0),
):
    """List bookmarks with optional keyword search and tag filter. Requires API key."""
    items, total = await crud.list_bookmarks(
        session, query=q, tag=tag, limit=limit, offset=offset
    )
    return BookmarkListOut(total=total, items=items)


# ---------------------------------------------------------------------------
# GET /api/bookmarks/{id}
# ---------------------------------------------------------------------------

@router.get("/{bookmark_id}", response_model=BookmarkOut)
async def get_bookmark(bookmark_id: int, session: SessionDep, api_key: ApiKeyDep):
    """Get a bookmark by ID. Requires API key."""
    result = await crud.get_bookmark_by_id(session, bookmark_id)
    if result is None:
        raise HTTPException(status_code=404, detail="Bookmark not found")
    return result


# ---------------------------------------------------------------------------
# PATCH /api/bookmarks/{id}
# ---------------------------------------------------------------------------

@router.patch("/{bookmark_id}", response_model=BookmarkOut)
async def update_bookmark(bookmark_id: int, payload: BookmarkUpdate, session: SessionDep, api_key: ApiKeyDep):
    """Update a bookmark by ID. Requires API key."""
    existing = await crud.get_bookmark_by_id(session, bookmark_id)
    if existing is None:
        raise HTTPException(status_code=404, detail="Bookmark not found")

    result = await crud.update_bookmark(
        session,
        bookmark_id,
        title=payload.title,
        description=payload.description,
        favicon=payload.favicon,
        tags=payload.tags,
    )
    return result


# ---------------------------------------------------------------------------
# DELETE /api/bookmarks/{id}
# ---------------------------------------------------------------------------

@router.delete("/{bookmark_id}", response_model=MessageOut)
async def delete_bookmark(bookmark_id: int, session: SessionDep, api_key: ApiKeyDep):
    """Delete a bookmark by ID. Requires API key."""
    deleted = await crud.delete_bookmark(session, bookmark_id)
    if not deleted:
        raise HTTPException(status_code=404, detail="Bookmark not found")
    return MessageOut(message="Bookmark deleted", detail=f"id={bookmark_id}")

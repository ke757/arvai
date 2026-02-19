"""Pydantic schemas for API request/response models.

These are separate from SQLModel table models to maintain clean API boundaries.
"""

from datetime import datetime
from typing import Optional

from pydantic import BaseModel, HttpUrl, Field, ConfigDict


# ---------------------------------------------------------------------------
# Request Schemas
# ---------------------------------------------------------------------------

class BookmarkCreate(BaseModel):
    """Schema for creating a bookmark (from browser extension or manual input)."""

    url: HttpUrl
    title: str = ""
    description: str = ""
    favicon: str = ""
    tags: list[str] = Field(default_factory=list)
    source: str = "extension"


class BookmarkUpdate(BaseModel):
    """Schema for partially updating a bookmark."""

    title: Optional[str] = None
    description: Optional[str] = None
    favicon: Optional[str] = None
    tags: Optional[list[str]] = None


# ---------------------------------------------------------------------------
# Response Schemas
# ---------------------------------------------------------------------------

class BookmarkOut(BaseModel):
    """Schema returned from API for a single bookmark."""

    model_config = ConfigDict(from_attributes=True)

    id: int
    url: str
    title: str
    description: str
    favicon: str
    domain: str
    tags: list[str]
    source: str
    created_at: datetime
    updated_at: datetime


class BookmarkListOut(BaseModel):
    """Paginated list of bookmarks."""

    total: int
    items: list[BookmarkOut]


class MessageOut(BaseModel):
    """Generic message response."""

    message: str
    detail: str = ""


# ---------------------------------------------------------------------------
# API Key Schemas
# ---------------------------------------------------------------------------

class ApiKeyCreate(BaseModel):
    """Schema for creating an API key."""

    name: str = "Extension"


class ApiKeyOut(BaseModel):
    """Schema returned from API for an API key (without full key)."""

    model_config = ConfigDict(from_attributes=True)

    id: int
    key_prefix: str
    name: str
    is_active: bool
    created_at: datetime
    last_used_at: Optional[datetime]


class ApiKeyCreated(BaseModel):
    """Schema returned when creating a new API key (includes full key once)."""

    id: int
    key: str  # Full key, only returned once
    key_prefix: str
    name: str
    created_at: datetime


class BookmarkCheckOut(BaseModel):
    """Schema for bookmark check response."""

    bookmarked: bool
    bookmark_id: Optional[int] = None
    created_at: Optional[datetime] = None

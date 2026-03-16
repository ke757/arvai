"""SQLModel table definitions for Arvai Kernel."""

from datetime import datetime, timezone
from typing import Optional

from sqlmodel import SQLModel, Field, Relationship
import sqlalchemy as sa


class Bookmark(SQLModel, table=True):
    """A saved browser tab / bookmark."""

    __tablename__ = "bookmarks"

    id: Optional[int] = Field(default=None, primary_key=True)
    url: str = Field(
        sa_column=sa.Column(sa.Text, nullable=False, unique=True, index=True),
    )
    title: str = Field(default="", sa_column=sa.Column(sa.Text, nullable=False, server_default=""))   # 标题
    description: str = Field(default="", sa_column=sa.Column(sa.Text, nullable=False, server_default=""))   # 描述
    favicon: str = Field(default="", sa_column=sa.Column(sa.Text, nullable=False, server_default=""))   # 图标
    domain: str = Field(
        default="",
        sa_column=sa.Column(sa.Text, nullable=False, server_default="", index=True),
    )   # 域名
    tags: str = Field(default="", sa_column=sa.Column(sa.Text, nullable=False, server_default=""))   # 标签
    source: str = Field(default="extension", sa_column=sa.Column(sa.Text, nullable=False, server_default="extension"))   # 来源
    content: str = Field(default="", sa_column=sa.Column(sa.Text, nullable=False, server_default=""))   # 内容
    created_at: datetime = Field(
        default_factory=lambda: datetime.now(timezone.utc),
        sa_column=sa.Column(sa.DateTime, nullable=False, index=True),
    )
    updated_at: datetime = Field(
        default_factory=lambda: datetime.now(timezone.utc),
        sa_column=sa.Column(sa.DateTime, nullable=False),
    )

    # ---- Helpers for tag list conversion ----

    @property
    def tag_list(self) -> list[str]:
        """Return tags as a Python list."""
        return [t.strip() for t in self.tags.split(",") if t.strip()]

    @tag_list.setter
    def tag_list(self, value: list[str]) -> None:
        self.tags = ",".join(value)

    # ---- Relationships ----
    chunks: list["ContentChunk"] = Relationship(
        back_populates="bookmark",
        sa_relationship_kwargs={"cascade": "all, delete-orphan"},
    )


class ContentChunk(SQLModel, table=True):
    """A text chunk from a bookmark's content for vector search."""

    __tablename__ = "content_chunks"

    id: Optional[int] = Field(default=None, primary_key=True)
    chunk_id: str = Field(
        sa_column=sa.Column(sa.String(36), nullable=False, unique=True, index=True),
    )  # UUID for vector store reference
    bookmark_id: int = Field(
        sa_column=sa.Column(
            sa.Integer,
            sa.ForeignKey("bookmarks.id", ondelete="CASCADE"),
            nullable=False,
            index=True,
        ),
    )
    content: str = Field(
        default="",
        sa_column=sa.Column(sa.Text, nullable=False),
    )  # The actual chunk text
    index: int = Field(
        default=0,
        sa_column=sa.Column(sa.Integer, nullable=False),
    )  # Position in the original document
    created_at: datetime = Field(
        default_factory=lambda: datetime.now(timezone.utc),
        sa_column=sa.Column(sa.DateTime, nullable=False),
    )

    # ---- Relationships ----
    bookmark: Optional[Bookmark] = Relationship(back_populates="chunks")


class ApiKey(SQLModel, table=True):
    """API key for browser extension authentication."""

    __tablename__ = "api_keys"

    id: Optional[int] = Field(default=None, primary_key=True)
    key_hash: str = Field(
        sa_column=sa.Column(sa.Text, nullable=False, unique=True, index=True),
    )
    key_prefix: str = Field(
        default="",
        sa_column=sa.Column(sa.Text, nullable=False, server_default=""),
    )
    name: str = Field(
        default="Extension",
        sa_column=sa.Column(sa.Text, nullable=False, server_default="Extension"),
    )
    is_active: bool = Field(
        default=True,
        sa_column=sa.Column(sa.Boolean, nullable=False, server_default="1"),
    )
    created_at: datetime = Field(
        default_factory=lambda: datetime.now(timezone.utc),
        sa_column=sa.Column(sa.DateTime, nullable=False),
    )
    last_used_at: Optional[datetime] = Field(
        default=None,
        sa_column=sa.Column(sa.DateTime, nullable=True),
    )

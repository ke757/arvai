"""SQLModel table definitions for Arvai Kernel."""

from datetime import datetime, timezone
from typing import Optional

from sqlmodel import SQLModel, Field
import sqlalchemy as sa


class Bookmark(SQLModel, table=True):
    """A saved browser tab / bookmark."""

    __tablename__ = "bookmarks"

    id: Optional[int] = Field(default=None, primary_key=True)
    url: str = Field(
        sa_column=sa.Column(sa.Text, nullable=False, unique=True, index=True),
    )
    title: str = Field(default="", sa_column=sa.Column(sa.Text, nullable=False, server_default=""))
    description: str = Field(default="", sa_column=sa.Column(sa.Text, nullable=False, server_default=""))
    favicon: str = Field(default="", sa_column=sa.Column(sa.Text, nullable=False, server_default=""))
    domain: str = Field(
        default="",
        sa_column=sa.Column(sa.Text, nullable=False, server_default="", index=True),
    )
    tags: str = Field(default="", sa_column=sa.Column(sa.Text, nullable=False, server_default=""))
    source: str = Field(default="extension", sa_column=sa.Column(sa.Text, nullable=False, server_default="extension"))
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

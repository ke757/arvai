"""Abstract base class for vector store implementations.

Defines the standard interface that all vector store implementations must follow.
This allows for easy swapping of underlying vector database technologies.
"""

from abc import ABC, abstractmethod
from dataclasses import dataclass
from typing import List, Optional, Protocol


@dataclass
class ChunkMetadata:
    """Metadata for a text chunk stored in the vector database.

    Attributes:
        chunk_id: Unique identifier for the chunk (UUID)
        bookmark_id: ID of the parent bookmark in SQLite
        content: The actual text content of the chunk
        index: Position of this chunk in the original document (0-based)
    """
    chunk_id: str
    bookmark_id: int
    content: str
    index: int


@dataclass
class SearchResult:
    """Result from a similarity search query.

    Attributes:
        chunk: The chunk metadata
        score: Similarity score (0-1, higher is better)
    """
    chunk: ChunkMetadata
    score: float


class VectorStoreBase(ABC):
    """Abstract base class for vector store implementations.

    All vector store implementations must inherit from this class and implement
    all abstract methods. This ensures a consistent interface regardless of the
    underlying vector database technology.
    """

    @abstractmethod
    async def initialize(self) -> None:
        """Initialize the vector store connection and resources.

        This should be called before any other operations.
        """
        pass

    @abstractmethod
    async def close(self) -> None:
        """Close the vector store connection and release resources."""
        pass

    @abstractmethod
    async def add_chunks(
        self,
        chunks: List[ChunkMetadata],
    ) -> List[str]:
        """Add text chunks to the vector store.

        Args:
            chunks: List of chunk metadata to add

        Returns:
            List of chunk IDs that were added
        """
        pass

    @abstractmethod
    async def delete_chunks_by_bookmark(self, bookmark_id: int) -> int:
        """Delete all chunks belonging to a specific bookmark.

        Args:
            bookmark_id: The bookmark ID whose chunks should be deleted

        Returns:
            Number of chunks deleted
        """
        pass

    @abstractmethod
    async def search(
        self,
        query: str,
        top_k: int = 5,
        bookmark_ids: Optional[List[int]] = None,
    ) -> List[SearchResult]:
        """Search for similar chunks using the query text.

        Args:
            query: The search query text
            top_k: Maximum number of results to return
            bookmark_ids: Optional list of bookmark IDs to filter by

        Returns:
            List of search results sorted by relevance (highest first)
        """
        pass

    @abstractmethod
    async def get_chunk_count(self, bookmark_id: Optional[int] = None) -> int:
        """Get the total number of chunks in the store.

        Args:
            bookmark_id: Optional bookmark ID to count chunks for

        Returns:
            Number of chunks
        """
        pass

    @abstractmethod
    async def health_check(self) -> bool:
        """Check if the vector store is healthy and accessible.

        Returns:
            True if healthy, False otherwise
        """
        pass

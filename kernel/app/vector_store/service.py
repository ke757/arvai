"""Vector store service layer.

Provides a high-level interface for indexing bookmark content and searching
across chunks. Coordinates between SQLite (metadata) and vector store (embeddings).
"""

import logging
from typing import List, Optional

from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import get_settings
from app.core.vector_store_config import VectorStoreConfig
from app.vector_store.base import VectorStoreBase, ChunkMetadata, SearchResult
from app.vector_store.chroma_store import ChromaVectorStore
from app.vector_store.splitter import TextSplitter
from app.crud import content_chunk as chunk_crud

logger = logging.getLogger("arvai-kernel.vector_store")


class VectorStoreService:
    """Service for managing bookmark content indexing and vector search.

    This service coordinates between:
    - SQLite database (chunk metadata storage)
    - Vector database (embedding storage and similarity search)
    - Text splitter (content chunking)

    Usage:
        service = VectorStoreService()
        await service.initialize()

        # Index a bookmark
        await service.index_bookmark(session, bookmark_id=1, content="...")

        # Search
        results = await service.search("query text", top_k=5)
    """

    def __init__(
        self,
        vector_store: Optional[VectorStoreBase] = None,
        config: Optional[VectorStoreConfig] = None,
    ):
        """Initialize the vector store service.

        Args:
            vector_store: Vector store implementation. If None, creates ChromaVectorStore.
            config: Vector store configuration. If None, loads from app settings.
        """
        self.config = config or get_settings().vector_store
        self._vector_store = vector_store
        self._splitter = TextSplitter(self.config)
        self._initialized = False

    async def initialize(self) -> None:
        """Initialize the service and underlying vector store."""
        if self._initialized:
            return

        # Create vector store if not provided
        if self._vector_store is None:
            if self.config.provider == "chroma":
                self._vector_store = ChromaVectorStore(self.config)
            else:
                raise ValueError(f"Unsupported vector store provider: {self.config.provider}")

        await self._vector_store.initialize()
        self._initialized = True
        logger.info("Vector store service initialized")

    async def close(self) -> None:
        """Close the service and release resources."""
        if self._vector_store is not None:
            await self._vector_store.close()
        self._initialized = False
        logger.info("Vector store service closed")

    async def index_bookmark(
        self,
        session: AsyncSession,
        bookmark_id: int,
        content: str,
    ) -> int:
        """Index a bookmark's content by splitting and storing chunks.

        If the bookmark already has chunks, they will be replaced.

        Args:
            session: Database session for SQLite operations
            bookmark_id: The bookmark ID to index
            content: The text content to index

        Returns:
            Number of chunks created
        """
        if not self._initialized:
            raise RuntimeError("Service not initialized. Call initialize() first.")

        if not content or not content.strip():
            logger.debug("Empty content for bookmark %d, skipping indexing", bookmark_id)
            return 0

        # Delete existing chunks for this bookmark
        await self.delete_bookmark_index(session, bookmark_id)

        # Split content into chunks
        chunks = self._splitter.split_text(content, bookmark_id)

        if not chunks:
            return 0

        # Store in SQLite
        chunks_data = [(c.chunk_id, c.content, c.index) for c in chunks]
        await chunk_crud.create_chunks(session, bookmark_id, chunks_data)

        # Store in vector store
        await self._vector_store.add_chunks(chunks)

        logger.info(
            "Indexed bookmark %d: created %d chunks",
            bookmark_id,
            len(chunks),
        )

        return len(chunks)

    async def delete_bookmark_index(
        self,
        session: AsyncSession,
        bookmark_id: int,
    ) -> int:
        """Delete all indexed chunks for a bookmark.

        Args:
            session: Database session for SQLite operations
            bookmark_id: The bookmark ID to delete

        Returns:
            Number of chunks deleted
        """
        if not self._initialized:
            raise RuntimeError("Service not initialized. Call initialize() first.")

        # Delete from vector store
        vector_deleted = await self._vector_store.delete_chunks_by_bookmark(bookmark_id)

        # Delete from SQLite
        sqlite_deleted = await chunk_crud.delete_chunks_by_bookmark(session, bookmark_id)

        total_deleted = max(vector_deleted, sqlite_deleted)

        if total_deleted > 0:
            logger.info(
                "Deleted index for bookmark %d: %d chunks",
                bookmark_id,
                total_deleted,
            )

        return total_deleted

    async def search(
        self,
        query: str,
        top_k: Optional[int] = None,
        bookmark_ids: Optional[List[int]] = None,
    ) -> List[SearchResult]:
        """Search for similar chunks using the query text.

        Args:
            query: The search query text
            top_k: Maximum number of results. Uses config default if None.
            bookmark_ids: Optional list of bookmark IDs to filter by

        Returns:
            List of search results with chunk metadata and scores
        """
        if not self._initialized:
            raise RuntimeError("Service not initialized. Call initialize() first.")

        if not query or not query.strip():
            return []

        k = top_k or self.config.default_top_k

        results = await self._vector_store.search(
            query=query,
            top_k=k,
            bookmark_ids=bookmark_ids,
        )

        logger.debug(
            "Search query '%s...' returned %d results",
            query[:50],
            len(results),
        )

        return results

    async def get_chunk_count(
        self,
        session: AsyncSession,
        bookmark_id: Optional[int] = None,
    ) -> int:
        """Get the total number of indexed chunks.

        Args:
            session: Database session
            bookmark_id: Optional bookmark ID to count chunks for

        Returns:
            Number of chunks
        """
        if not self._initialized:
            raise RuntimeError("Service not initialized. Call initialize() first.")

        # Use SQLite as source of truth
        return await chunk_crud.get_chunk_count(session, bookmark_id)

    async def health_check(self) -> bool:
        """Check if the vector store service is healthy.

        Returns:
            True if healthy, False otherwise
        """
        if not self._initialized or self._vector_store is None:
            return False
        return await self._vector_store.health_check()


# Global service instance for singleton access
_service_instance: Optional[VectorStoreService] = None


async def get_vector_store_service() -> VectorStoreService:
    """Get or create the global vector store service instance.

    Returns:
        Initialized VectorStoreService instance
    """
    global _service_instance

    if _service_instance is None:
        _service_instance = VectorStoreService()
        await _service_instance.initialize()

    return _service_instance


def reset_vector_store_service() -> None:
    """Reset the global service instance.

    Useful for testing or when configuration changes.
    """
    global _service_instance
    _service_instance = None
    logger.info("Vector store service reset")

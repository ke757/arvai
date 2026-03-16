"""ChromaDB implementation of the vector store interface."""

import logging
import uuid
from pathlib import Path
from typing import List, Optional

from langchain_chroma import Chroma
from langchain_core.embeddings import Embeddings

from app.core.config import get_settings
from app.core.vector_store_config import VectorStoreConfig
from app.vector_store.base import VectorStoreBase, ChunkMetadata, SearchResult

logger = logging.getLogger("arvai-kernel.vector_store")


class ChromaVectorStore(VectorStoreBase):
    """ChromaDB-based vector store implementation.

    Uses LangChain's Chroma integration for embeddings and similarity search.
    Supports persistent storage on disk.
    """

    def __init__(self, config: Optional[VectorStoreConfig] = None):
        """Initialize the ChromaDB vector store.

        Args:
            config: Vector store configuration. If None, loads from app settings.
        """
        self.config = config or get_settings().vector_store
        self._vector_store: Optional[Chroma] = None
        self._embeddings: Optional[Embeddings] = None

    def _create_embeddings(self) -> Embeddings:
        """Create the embedding model based on configuration.

        Returns:
            Configured embedding model instance
        """
        settings = get_settings()

        if self.config.embedding_provider == "openai":
            from langchain_openai import OpenAIEmbeddings

            # Get API key from LLM config
            llm_cfg = settings.llm
            api_key = ""
            if "openai" in llm_cfg.providers:
                api_key = llm_cfg.providers["openai"].api_key

            return OpenAIEmbeddings(
                model=self.config.embedding_model,
                api_key=api_key if api_key else None,
            )

        elif self.config.embedding_provider == "ollama":
            from langchain_ollama import OllamaEmbeddings

            base_url = None
            if "ollama" in settings.llm.providers:
                base_url = settings.llm.providers["ollama"].base_url

            return OllamaEmbeddings(
                model=self.config.embedding_model,
                base_url=base_url,
            )

        else:
            raise ValueError(f"Unsupported embedding provider: {self.config.embedding_provider}")

    async def initialize(self) -> None:
        """Initialize the ChromaDB vector store."""
        if self._vector_store is not None:
            return

        logger.info("Initializing ChromaDB vector store...")

        # Create embeddings
        self._embeddings = self._create_embeddings()

        # Ensure persist directory exists
        persist_dir = Path(self.config.persist_directory)
        persist_dir.mkdir(parents=True, exist_ok=True)

        # Initialize Chroma vector store
        self._vector_store = Chroma(
            collection_name=self.config.collection_name,
            embedding_function=self._embeddings,
            persist_directory=str(persist_dir),
        )

        logger.info(
            "ChromaDB vector store initialized: collection=%s, path=%s",
            self.config.collection_name,
            persist_dir,
        )

    async def close(self) -> None:
        """Close the vector store connection."""
        if self._vector_store is not None:
            # Chroma doesn't require explicit close, but we clear the reference
            self._vector_store = None
            self._embeddings = None
            logger.info("ChromaDB vector store closed")

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
        if self._vector_store is None:
            raise RuntimeError("Vector store not initialized. Call initialize() first.")

        if not chunks:
            return []

        # Prepare data for Chroma
        texts = [chunk.content for chunk in chunks]
        ids = [chunk.chunk_id for chunk in chunks]
        metadatas = [
            {
                "chunk_id": chunk.chunk_id,
                "bookmark_id": chunk.bookmark_id,
                "index": chunk.index,
            }
            for chunk in chunks
        ]

        # Add to vector store
        self._vector_store.add_texts(
            texts=texts,
            metadatas=metadatas,
            ids=ids,
        )

        logger.debug("Added %d chunks to vector store", len(chunks))
        return ids

    async def delete_chunks_by_bookmark(self, bookmark_id: int) -> int:
        """Delete all chunks belonging to a specific bookmark.

        Args:
            bookmark_id: The bookmark ID whose chunks should be deleted

        Returns:
            Number of chunks deleted
        """
        if self._vector_store is None:
            raise RuntimeError("Vector store not initialized. Call initialize() first.")

        # Query to find chunks by bookmark_id
        results = self._vector_store.get(
            where={"bookmark_id": bookmark_id},
            include=["metadatas"],
        )

        if not results or not results["ids"]:
            return 0

        chunk_ids = results["ids"]
        self._vector_store.delete(ids=chunk_ids)

        logger.debug("Deleted %d chunks for bookmark %d", len(chunk_ids), bookmark_id)
        return len(chunk_ids)

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
            List of search results sorted by relevance
        """
        if self._vector_store is None:
            raise RuntimeError("Vector store not initialized. Call initialize() first.")

        # Build filter if bookmark_ids provided
        filter_dict = None
        if bookmark_ids:
            if len(bookmark_ids) == 1:
                filter_dict = {"bookmark_id": bookmark_ids[0]}
            else:
                filter_dict = {"bookmark_id": {"$in": bookmark_ids}}

        # Perform similarity search
        results = self._vector_store.similarity_search_with_score(
            query=query,
            k=top_k,
            filter=filter_dict,
        )

        # Convert to SearchResult format
        search_results = []
        for doc, score in results:
            metadata = doc.metadata
            chunk = ChunkMetadata(
                chunk_id=metadata.get("chunk_id", ""),
                bookmark_id=metadata.get("bookmark_id", 0),
                content=doc.page_content,
                index=metadata.get("index", 0),
            )
            search_results.append(SearchResult(chunk=chunk, score=float(score)))

        return search_results

    async def get_chunk_count(self, bookmark_id: Optional[int] = None) -> int:
        """Get the total number of chunks in the store.

        Args:
            bookmark_id: Optional bookmark ID to count chunks for

        Returns:
            Number of chunks
        """
        if self._vector_store is None:
            raise RuntimeError("Vector store not initialized. Call initialize() first.")

        if bookmark_id is not None:
            results = self._vector_store.get(
                where={"bookmark_id": bookmark_id},
                include=[],
            )
            return len(results["ids"]) if results else 0
        else:
            return self._vector_store._collection.count()

    async def health_check(self) -> bool:
        """Check if the vector store is healthy and accessible.

        Returns:
            True if healthy, False otherwise
        """
        try:
            if self._vector_store is None:
                return False
            # Try to get collection count as a health check
            self._vector_store._collection.count()
            return True
        except Exception as e:
            logger.error("Vector store health check failed: %s", e)
            return False

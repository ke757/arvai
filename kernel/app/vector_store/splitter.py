"""Text splitting utilities for chunking bookmark content."""

import logging
import uuid
from typing import List

from langchain_text_splitters import RecursiveCharacterTextSplitter

from app.core.vector_store_config import VectorStoreConfig
from app.vector_store.base import ChunkMetadata

logger = logging.getLogger("arvai-kernel.vector_store")


class TextSplitter:
    """Text splitter for dividing content into chunks.

    Uses LangChain's RecursiveCharacterTextSplitter for intelligent text
    splitting that respects sentence and paragraph boundaries.
    """

    def __init__(self, config: VectorStoreConfig):
        """Initialize the text splitter.

        Args:
            config: Vector store configuration containing chunk parameters
        """
        self.config = config
        self._splitter = RecursiveCharacterTextSplitter(
            chunk_size=config.chunk_size,
            chunk_overlap=config.chunk_overlap,
            length_function=len,
            separators=["\n\n", "\n", "。", ". ", "!", "?", "；", ";", " ", ""],
        )

    def split_text(self, text: str, bookmark_id: int) -> List[ChunkMetadata]:
        """Split text into chunks and generate metadata.

        Args:
            text: The text content to split
            bookmark_id: The parent bookmark ID

        Returns:
            List of ChunkMetadata objects with generated UUIDs
        """
        if not text or not text.strip():
            return []

        # Split the text
        chunks = self._splitter.split_text(text)

        # Create metadata for each chunk
        chunk_metadata = []
        for index, chunk_text in enumerate(chunks):
            chunk_id = str(uuid.uuid4())
            metadata = ChunkMetadata(
                chunk_id=chunk_id,
                bookmark_id=bookmark_id,
                content=chunk_text.strip(),
                index=index,
            )
            chunk_metadata.append(metadata)

        logger.debug(
            "Split text into %d chunks for bookmark %d",
            len(chunk_metadata),
            bookmark_id,
        )

        return chunk_metadata

    def split_text_with_existing_chunks(
        self,
        text: str,
        bookmark_id: int,
        existing_chunk_count: int = 0,
    ) -> List[ChunkMetadata]:
        """Split text into chunks, continuing from existing chunk count.

        Useful when appending content to an existing bookmark.

        Args:
            text: The text content to split
            bookmark_id: The parent bookmark ID
            existing_chunk_count: Number of existing chunks (for index continuation)

        Returns:
            List of ChunkMetadata objects
        """
        if not text or not text.strip():
            return []

        chunks = self._splitter.split_text(text)

        chunk_metadata = []
        for index, chunk_text in enumerate(chunks):
            chunk_id = str(uuid.uuid4())
            metadata = ChunkMetadata(
                chunk_id=chunk_id,
                bookmark_id=bookmark_id,
                content=chunk_text.strip(),
                index=existing_chunk_count + index,
            )
            chunk_metadata.append(metadata)

        return chunk_metadata

    @property
    def chunk_size(self) -> int:
        """Get the configured chunk size."""
        return self.config.chunk_size

    @property
    def chunk_overlap(self) -> int:
        """Get the configured chunk overlap."""
        return self.config.chunk_overlap

"""Vector store module for managing text embeddings and similarity search."""

from app.vector_store.base import VectorStoreBase, ChunkMetadata, SearchResult
from app.vector_store.chroma_store import ChromaVectorStore
from app.vector_store.splitter import TextSplitter
from app.vector_store.service import VectorStoreService, get_vector_store_service, reset_vector_store_service

__all__ = [
    "VectorStoreBase",
    "ChunkMetadata",
    "SearchResult",
    "ChromaVectorStore",
    "TextSplitter",
    "VectorStoreService",
    "get_vector_store_service",
    "reset_vector_store_service",
]

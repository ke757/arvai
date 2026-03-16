"""Vector store configuration and settings."""

from pydantic import BaseModel
from typing import Literal


class VectorStoreConfig(BaseModel):
    """Configuration for vector store."""

    # 存储类型: 目前支持 chroma，后续可扩展
    provider: Literal["chroma"] = "chroma"

    # ChromaDB 配置
    persist_directory: str = "./data/vector_store"

    # 集合名称
    collection_name: str = "bookmark_chunks"

    # 嵌入模型配置
    embedding_provider: Literal["openai", "ollama"] = "openai"
    embedding_model: str = "text-embedding-3-small"

    # 文本分割配置
    chunk_size: int = 500
    chunk_overlap: int = 50

    # 检索配置
    default_top_k: int = 5


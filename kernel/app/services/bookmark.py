import re
import logging
from typing import Optional

from sqlalchemy.ext.asyncio import AsyncSession

from app.schemas import BookmarkOut
from app.crud import bookmark as crud_bookmark
from app.services.llm import get_llm, LLMConfigError

logger = logging.getLogger("arvai-kernel.bookmark")


def _is_meaningful_text(text: str) -> bool:
    """
    Check if text content is meaningful.
    
    Criteria:
    - Symbol count should not be much greater than sentence count
    - Short sentences (<=3 chars) should not dominate
    
    Returns True if text is meaningful, False otherwise.
    """
    if not text or len(text.strip()) < 50:
        return False
    
    # Split into sentences (basic sentence splitting)
    sentences = re.split(r'[.!?。！？\n]+', text)
    sentences = [s.strip() for s in sentences if s.strip()]
    
    if not sentences:
        return False
    
    # Count symbols (non-alphanumeric, non-space characters)
    symbol_pattern = re.compile(r'[^\w\s\u4e00-\u9fff]')
    symbol_count = len(symbol_pattern.findall(text))
    
    # Check symbol to sentence ratio
    if symbol_count > len(sentences) * 10:  # Too many symbols per sentence
        return False
    
    # Check short sentence ratio
    short_sentences = sum(1 for s in sentences if len(s) <= 3)
    short_ratio = short_sentences / len(sentences)
    
    if short_ratio > 0.5:  # More than 50% are very short sentences
        return False
    
    return True


async def _generate_ai_summary(title: str, excerpt: str, text: str) -> str:
    """
    Generate AI summary using LLM based on title, excerpt and text.
    
    Returns generated summary or empty string if generation fails.
    """
    try:
        llm = get_llm()
        
        # Prepare content for summarization
        content_parts = []
        if title:
            content_parts.append(f"Title: {title}")
        if excerpt:
            content_parts.append(f"Excerpt: {excerpt}")
        if text and _is_meaningful_text(text):
            # Truncate text if too long (keep first 3000 chars)
            truncated_text = text[:3000] if len(text) > 3000 else text
            content_parts.append(f"Content: {truncated_text}")
        
        if not content_parts:
            return ""
        
        content = "\n\n".join(content_parts)
        
        prompt = f"""Please summarize the following web page content in a concise and informative way.
The summary should be 1-2 sentences that capture the main point of the page.

{content}

Summary:"""
        
        response = await llm.ainvoke(prompt)
        summary = response.content.strip() if response.content else ""
        
        # Validate summary length
        if len(summary) < 10 or len(summary) > 500:
            return ""
        
        return summary
        
    except LLMConfigError as e:
        logger.warning("LLM not configured, skipping AI summary generation: %s", e)
        return ""
    except Exception as e:
        logger.error("Failed to generate AI summary: %s", e)
        return ""


async def create_bookmark(
    session: AsyncSession,
    *,
    url: str,
    title: str = "",
    favicon: str = "",
    tags: Optional[list[str]] = None,
    source: str = "extension",
    excerpt: str = "",
    text: str = "",
    html: str = "",
) -> BookmarkOut:
    """
    Create a new bookmark with AI-generated summary.
    
    Steps:
    1. Check if URL already exists (via CRUD layer)
    2. Validate text content quality
    3. Generate AI summary from excerpt and text
    4. Save to database via CRUD layer
    
    If URL already exists, updates the existing bookmark instead.
    """
    # Step 1: Check if bookmark already exists via CRUD layer
    existing = await crud_bookmark.get_by_url_raw(session, url)
    
    # Step 2: Validate text and generate AI summary if needed
    ai_description = ""
    # Only generate if we have meaningful content
    if excerpt or (text and _is_meaningful_text(text)):
        ai_description = await _generate_ai_summary(title, excerpt, text)
    
    # Step 3 & 4: Create or update via CRUD layer
    result = await crud_bookmark.create(
        session,
        url=url,
        title=title,
        description=ai_description,
        favicon=favicon,
        tags=tags,
        source=source,
        content=html,
    )
    
    if existing:
        logger.info("Updated existing bookmark: id=%s, url=%s", existing.id, url)
    else:
        logger.info("Created new bookmark: url=%s", url)
    
    return result

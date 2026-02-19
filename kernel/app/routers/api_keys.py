"""API Key management router."""

from typing import Annotated

from fastapi import APIRouter, HTTPException, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_session
from app.schemas import ApiKeyCreate, ApiKeyOut, ApiKeyCreated, MessageOut
from app import crud

router = APIRouter(prefix="/api/keys", tags=["api-keys"])

# Type alias for session dependency
SessionDep = Annotated[AsyncSession, Depends(get_session)]


# ---------------------------------------------------------------------------
# POST /api/keys — generate a new API key
# ---------------------------------------------------------------------------

@router.post("", response_model=ApiKeyCreated, status_code=201)
async def create_api_key(payload: ApiKeyCreate, session: SessionDep):
    """
    Generate a new API key for browser extension authentication.
    
    The full key is only returned once in this response.
    Store it securely - it cannot be retrieved again.
    """
    result = await crud.create_api_key(session, name=payload.name)
    return result


# ---------------------------------------------------------------------------
# GET /api/keys — list all API keys
# ---------------------------------------------------------------------------

@router.get("", response_model=list[ApiKeyOut])
async def list_api_keys(session: SessionDep):
    """
    List all API keys.
    
    Only the key prefix is shown for identification.
    Full keys are never returned after creation.
    """
    return await crud.list_api_keys(session)


# ---------------------------------------------------------------------------
# DELETE /api/keys/{id} — revoke/delete an API key
# ---------------------------------------------------------------------------

@router.delete("/{key_id}", response_model=MessageOut)
async def delete_api_key(key_id: int, session: SessionDep):
    """Delete an API key permanently."""
    deleted = await crud.delete_api_key(session, key_id)
    if not deleted:
        raise HTTPException(status_code=404, detail="API key not found")
    return MessageOut(message="API key deleted", detail=f"id={key_id}")

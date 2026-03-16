"""CRUD operations package.

Usage:
    from app.crud import bookmarks, api_keys

    # Bookmark operations
    bookmark = await bookmarks.create(session, url="...", title="...")
    bookmark = await bookmarks.get_by_id(session, 1)
    bookmark = await bookmarks.get_by_url(session, "https://...")
    items, total = await bookmarks.list_all(session, query="...", tag="...")
    bookmark = await bookmarks.update(session, 1, title="...")
    deleted = await bookmarks.delete(session, 1)

    # API Key operations
    key = await api_keys.create(session, name="...")
    keys = await api_keys.list_all(session)
    revoked = await api_keys.revoke(session, 1)
    deleted = await api_keys.delete(session, 1)
"""

from app.crud import bookmark, api_keys, content_chunk

# Re-export for backward compatibility with existing routers
# Bookmark operations
create_bookmark = bookmark.create
get_bookmark_by_id = bookmark.get_by_id
get_bookmark_by_url = bookmark.get_by_url
list_bookmarks = bookmark.list_all
update_bookmark = bookmark.update
delete_bookmark = bookmark.delete

# API Key operations
create_api_key = api_keys.create
list_api_keys = api_keys.list_all
revoke_api_key = api_keys.revoke
delete_api_key = api_keys.delete

__all__ = [
    # Modules
    "bookmarks",
    "api_keys",
    # Backward-compatible functions
    "create_bookmark",
    "get_bookmark_by_id",
    "get_bookmark_by_url",
    "list_bookmarks",
    "update_bookmark",
    "delete_bookmark",
    "create_api_key",
    "list_api_keys",
    "revoke_api_key",
    "delete_api_key",
]

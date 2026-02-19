import { useState, useEffect } from 'react'
import { getConnection, saveConnection, clearConnection } from '../lib/storage'
import { parseConnectionUrl } from '../lib/connection'
import { ArvaiApi } from '../lib/api'
import type { ConnectionConfig, PageMetadata, BookmarkCheck } from '../types'
import ConnectionSetup from './components/ConnectionSetup'
import BookmarkButton from './components/BookmarkButton'
import BookmarkStatus from './components/BookmarkStatus'

type AppState = 'loading' | 'not_connected' | 'connected'

export default function Popup() {
  const [state, setState] = useState<AppState>('loading')
  const [connection, setConnection] = useState<ConnectionConfig | null>(null)
  const [pageData, setPageData] = useState<PageMetadata | null>(null)
  const [bookmarkStatus, setBookmarkStatus] = useState<BookmarkCheck | null>(null)
  const [error, setError] = useState<string | null>(null)

  // Initialize: check connection and get page data
  useEffect(() => {
    async function init() {
      try {
        // Get connection config
        const conn = await getConnection()
        setConnection(conn)

        if (!conn || !conn.connected) {
          setState('not_connected')
          return
        }

        // Get current tab info
        const [tab] = await chrome.tabs.query({ active: true, currentWindow: true })
        if (!tab?.url || (!tab.url.startsWith('http://') && !tab.url.startsWith('https://'))) {
          setPageData({ url: '', title: '不支持的页面', description: '', favicon: '' })
          setState('connected')
          return
        }

        // Get page metadata from content script
        const metadata = await chrome.runtime.sendMessage({ type: 'GET_PAGE_DATA' })
        setPageData(metadata || { url: tab.url, title: tab.title || '', description: '', favicon: '' })

        // Check bookmark status
        const status = await chrome.runtime.sendMessage({ type: 'CHECK_STATUS', url: tab.url })
        setBookmarkStatus(status)

        setState('connected')
      } catch (err) {
        console.error('Init error:', err)
        setError('初始化失败')
        setState('not_connected')
      }
    }

    init()
  }, [])

  // Handle connection
  const handleConnect = async (url: string) => {
    setError(null)

    const parsed = parseConnectionUrl(url)
    if (!parsed) {
      setError('无效的连接 URL')
      return
    }

    try {
      const api = new ArvaiApi(parsed.server, parsed.key)

      // Verify server is reachable
      const serverOk = await api.verifyConnection()
      if (!serverOk) {
        setError('无法连接到服务器')
        return
      }

      // Verify API key
      const keyOk = await api.verifyApiKey()
      if (!keyOk) {
        setError('API Key 无效')
        return
      }

      // Save connection
      const config: ConnectionConfig = {
        server: parsed.server,
        apiKey: parsed.key,
        connected: true,
        lastVerified: new Date().toISOString(),
      }
      await saveConnection(config)
      setConnection(config)

      // Notify background script
      await chrome.runtime.sendMessage({ type: 'CONNECTION_CHANGED' })

      // Refresh state
      setState('loading')
      setTimeout(() => window.location.reload(), 100)
    } catch (err) {
      console.error('Connection error:', err)
      setError('连接失败，请检查网络')
    }
  }

  // Handle disconnect
  const handleDisconnect = async () => {
    await clearConnection()
    setConnection(null)
    await chrome.runtime.sendMessage({ type: 'CONNECTION_CHANGED' })
    setState('not_connected')
  }

  // Handle bookmark
  const handleBookmark = async () => {
    if (!pageData?.url || !connection) return

    setError(null)

    try {
      const result = await chrome.runtime.sendMessage({
        type: 'ADD_BOOKMARK',
        data: {
          url: pageData.url,
          title: pageData.title,
          description: pageData.description,
          favicon: pageData.favicon,
          source: 'extension',
        },
      })

      if (result.error) {
        setError(result.error)
        return
      }

      setBookmarkStatus({
        bookmarked: true,
        bookmark_id: result.bookmark.id,
        created_at: result.bookmark.created_at,
      })
    } catch (err) {
      console.error('Bookmark error:', err)
      setError('保存失败')
    }
  }

  // Handle remove bookmark
  const handleRemove = async () => {
    if (!bookmarkStatus?.bookmark_id || !pageData?.url) return

    setError(null)

    try {
      const result = await chrome.runtime.sendMessage({
        type: 'REMOVE_BOOKMARK',
        bookmarkId: bookmarkStatus.bookmark_id,
        url: pageData.url,
      })

      if (result.error) {
        setError(result.error)
        return
      }

      setBookmarkStatus({ bookmarked: false })
    } catch (err) {
      console.error('Remove error:', err)
      setError('删除失败')
    }
  }

  // Render
  if (state === 'loading') {
    return (
      <div className="p-4 flex items-center justify-center min-h-[200px]">
        <div className="text-gray-500">加载中...</div>
      </div>
    )
  }

  if (state === 'not_connected') {
    return (
      <ConnectionSetup
        onConnect={handleConnect}
        error={error}
      />
    )
  }

  // Connected state
  return (
    <div className="p-4">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-lg font-semibold text-gray-800">Arvai</h1>
        <button
          onClick={handleDisconnect}
          className="text-xs text-gray-400 hover:text-gray-600"
        >
          断开连接
        </button>
      </div>

      {/* Error message */}
      {error && (
        <div className="mb-4 p-2 bg-red-50 text-red-600 text-sm rounded">
          {error}
        </div>
      )}

      {/* Page info and actions */}
      {pageData?.url ? (
        bookmarkStatus?.bookmarked ? (
          <BookmarkStatus
            pageData={pageData}
            createdAt={bookmarkStatus.created_at}
            onRemove={handleRemove}
          />
        ) : (
          <BookmarkButton
            pageData={pageData}
            onBookmark={handleBookmark}
          />
        )
      ) : (
        <div className="text-center text-gray-500 py-8">
          不支持当前页面
        </div>
      )}
    </div>
  )
}

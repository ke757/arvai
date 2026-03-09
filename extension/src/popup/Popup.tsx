import { useState, useEffect, useRef, useCallback } from 'react'
import { getConnection, saveConnection } from '@/lib/storage'
import { parseConnectionUrl } from '@/lib/connection'
import { ArvaiApi } from '@/lib/api'
import { useLocale } from '@/lib/i18n'
import type { ConnectionConfig, PageMetadata, BookmarkCheck } from '@/types'
import ConnectionSection from '@/popup/components/ConnectionSection'
import BookmarkSection from '@/popup/components/BookmarkSection'

export default function Popup() {
  const { t } = useLocale()

  // Connection state
  const [connection, setConnection] = useState<ConnectionConfig | null>(null)
  const [isEditingConnection, setIsEditingConnection] = useState(false)
  const [connectionLoading, setConnectionLoading] = useState(false)
  const [connectionError, setConnectionError] = useState<string | null>(null)

  // Page state
  const [pageData, setPageData] = useState<PageMetadata | null>(null)
  const [isSupportedPage, setIsSupportedPage] = useState(true)

  // Bookmark state
  const [bookmarkStatus, setBookmarkStatus] = useState<BookmarkCheck | null>(null)
  const [bookmarkLoading, setBookmarkLoading] = useState(false)
  const [bookmarkError, setBookmarkError] = useState<string | null>(null)

  // Init state
  const [initializing, setInitializing] = useState(true)
  const autoTriggeredRef = useRef(false)

  // Fetch page data and bookmark status
  const fetchPageAndStatus = useCallback(async () => {
    try {
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true })
      if (!tab?.url || (!tab.url.startsWith('http://') && !tab.url.startsWith('https://'))) {
        setIsSupportedPage(false)
        setPageData(tab?.url ? { url: tab.url, title: tab.title || '', description: '', favicon: '' } : null)
        return
      }

      setIsSupportedPage(true)

      // Get page metadata from content script
      try {
        const metadata = await chrome.runtime.sendMessage({ type: 'GET_PAGE_DATA' })
        setPageData(metadata || { url: tab.url, title: tab.title || '', description: '', favicon: '' })
      } catch {
        setPageData({ url: tab.url, title: tab.title || '', description: '', favicon: '' })
      }

      // Check bookmark status
      try {
        const status = await chrome.runtime.sendMessage({ type: 'CHECK_STATUS', url: tab.url })
        if (status && typeof status.bookmarked === 'boolean') {
          setBookmarkStatus(status)
        } else {
          setBookmarkError(t('bookmark.statusError'))
        }
      } catch {
        setBookmarkError(t('bookmark.statusError'))
      }
    } catch (err) {
      console.error('Fetch page data error:', err)
      setBookmarkError(t('bookmark.fetchError'))
    }
  }, [t])

  // Initialize
  useEffect(() => {
    async function init() {
      try {
        const conn = await getConnection()
        setConnection(conn)

        if (!conn || !conn.connected) {
          setIsEditingConnection(true)
          setInitializing(false)
          return
        }

        await fetchPageAndStatus()
      } catch (err) {
        console.error('Init error:', err)
      } finally {
        setInitializing(false)
      }
    }

    init()
  }, [fetchPageAndStatus])

  // Auto-bookmark trigger
  useEffect(() => {
    if (
      !initializing &&
      connection?.connected &&
      isSupportedPage &&
      pageData?.url &&
      bookmarkStatus &&
      !bookmarkStatus.bookmarked &&
      !autoTriggeredRef.current &&
      !bookmarkError
    ) {
      autoTriggeredRef.current = true
      handleBookmark()
    }
  }, [initializing, connection, isSupportedPage, pageData, bookmarkStatus, bookmarkError])

  // Handle connection save
  const handleConnectionSave = async (url: string) => {
    setConnectionError(null)

    const parsed = parseConnectionUrl(url)
    if (!parsed) {
      setConnectionError(t('connection.urlInvalid'))
      return
    }

    setConnectionLoading(true)
    try {
      const api = new ArvaiApi(parsed.server, parsed.key)

      const serverOk = await api.verifyConnection()
      if (!serverOk) {
        setConnectionError(t('connection.serverUnreachable'))
        return
      }

      const keyOk = await api.verifyApiKey()
      if (!keyOk) {
        setConnectionError(t('connection.keyInvalid'))
        return
      }

      const config: ConnectionConfig = {
        server: parsed.server,
        apiKey: parsed.key,
        connected: true,
        lastVerified: new Date().toISOString(),
      }
      await saveConnection(config)
      setConnection(config)
      setIsEditingConnection(false)

      // Notify background script
      await chrome.runtime.sendMessage({ type: 'CONNECTION_CHANGED' })

      // Reset bookmark state and re-fetch
      autoTriggeredRef.current = false
      setBookmarkStatus(null)
      setBookmarkError(null)
      setBookmarkLoading(false)
      await fetchPageAndStatus()
    } catch (err) {
      console.error('Connection error:', err)
      setConnectionError(t('connection.networkError'))
    } finally {
      setConnectionLoading(false)
    }
  }

  // Handle bookmark
  const handleBookmark = async () => {
    if (!pageData?.url || !connection) return

    setBookmarkError(null)
    setBookmarkLoading(true)

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

      if (!result || result.error) {
        setBookmarkError(result?.error || t('bookmark.saveFailed'))
        return
      }

      if (!result.bookmark?.id) {
        setBookmarkError(t('bookmark.dataError'))
        return
      }

      setBookmarkStatus({
        bookmarked: true,
        bookmark_id: result.bookmark.id,
        created_at: result.bookmark.created_at,
      })
    } catch (err) {
      console.error('Bookmark error:', err)
      setBookmarkError(t('bookmark.saveFailed'))
    } finally {
      setBookmarkLoading(false)
    }
  }

  // Handle remove bookmark
  const handleRemove = async () => {
    if (!bookmarkStatus?.bookmark_id || !pageData?.url) return

    setBookmarkError(null)

    try {
      const result = await chrome.runtime.sendMessage({
        type: 'REMOVE_BOOKMARK',
        bookmarkId: bookmarkStatus.bookmark_id,
        url: pageData.url,
      })

      if (!result || result.error) {
        setBookmarkError(result?.error || t('bookmark.removeFailed'))
        return
      }

      setBookmarkStatus({ bookmarked: false })
    } catch (err) {
      console.error('Remove error:', err)
      setBookmarkError(t('bookmark.removeFailed'))
    }
  }

  return (
    <div className="p-3 space-y-3">
      {/* Section 1: Connection Config */}
      <div className="glass-card rounded-xl">
        <ConnectionSection
          connection={connection}
          isEditing={isEditingConnection}
          onEdit={() => setIsEditingConnection(true)}
          onSave={handleConnectionSave}
          onCancel={() => {
            setIsEditingConnection(false)
            setConnectionError(null)
          }}
          loading={connectionLoading}
          error={connectionError}
        />
      </div>

      {/* Section 2: Bookmark Status */}
      <div className="glass-card rounded-xl">
        <BookmarkSection
          connected={!!connection?.connected}
          pageData={pageData}
          isSupportedPage={isSupportedPage}
          bookmarkStatus={bookmarkStatus}
          loading={bookmarkLoading || initializing}
          error={bookmarkError}
          onRemove={handleRemove}
        />
      </div>
    </div>
  )
}

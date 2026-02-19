import { useState } from 'react'
import type { PageMetadata } from '../../types'

interface BookmarkButtonProps {
  pageData: PageMetadata
  onBookmark: () => Promise<void>
}

export default function BookmarkButton({ pageData, onBookmark }: BookmarkButtonProps) {
  const [loading, setLoading] = useState(false)

  const handleClick = async () => {
    if (loading) return
    setLoading(true)
    try {
      await onBookmark()
    } finally {
      setLoading(false)
    }
  }

  return (
    <div>
      {/* Page preview */}
      <div className="mb-4 p-3 bg-gray-50 rounded-lg">
        <div className="flex items-start gap-3">
          {pageData.favicon && (
            <img
              src={pageData.favicon}
              alt=""
              className="w-6 h-6 flex-shrink-0 mt-0.5"
              onError={(e) => {
                (e.target as HTMLImageElement).style.display = 'none'
              }}
            />
          )}
          <div className="min-w-0 flex-1">
            <h3 className="text-sm font-medium text-gray-800 truncate">
              {pageData.title || '无标题'}
            </h3>
            <p className="text-xs text-gray-500 truncate mt-0.5">
              {pageData.url}
            </p>
          </div>
        </div>
      </div>

      {/* Bookmark button */}
      <button
        onClick={handleClick}
        disabled={loading}
        className="w-full py-3 px-4 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
      >
        {loading ? (
          <>
            <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
                fill="none"
              />
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              />
            </svg>
            保存中...
          </>
        ) : (
          <>
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z"
              />
            </svg>
            添加到 Arvai
          </>
        )}
      </button>
    </div>
  )
}

import { useState } from 'react'
import type { PageMetadata } from '../../types'

interface BookmarkStatusProps {
  pageData: PageMetadata
  createdAt?: string
  onRemove: () => Promise<void>
}

export default function BookmarkStatus({ pageData, createdAt, onRemove }: BookmarkStatusProps) {
  const [loading, setLoading] = useState(false)

  const handleRemove = async () => {
    if (loading) return
    setLoading(true)
    try {
      await onRemove()
    } finally {
      setLoading(false)
    }
  }

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return ''
    try {
      const date = new Date(dateStr)
      return date.toLocaleDateString('zh-CN', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      })
    } catch {
      return ''
    }
  }

  return (
    <div>
      {/* Success badge */}
      <div className="mb-4 flex items-center justify-center gap-2 py-3 bg-green-50 rounded-lg">
        <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M5 13l4 4L19 7"
          />
        </svg>
        <span className="text-green-700 font-medium">已收藏</span>
      </div>

      {/* Page info */}
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
            {createdAt && (
              <p className="text-xs text-gray-400 mt-1">
                收藏于 {formatDate(createdAt)}
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Remove button */}
      <button
        onClick={handleRemove}
        disabled={loading}
        className="w-full py-2 px-4 border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
      >
        {loading ? '移除中...' : '移除收藏'}
      </button>
    </div>
  )
}

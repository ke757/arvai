import { useState, useEffect, useRef } from 'react'
import { Loader2, XCircle, CheckCircle, Bookmark } from 'lucide-react'
import type { PageMetadata, BookmarkCheck } from '@/types'
import { useLocale, type TFunction } from '@/lib/i18n'
import { cn } from '@/lib/utils'
import { Button } from '@/popup/components/ui/button'

interface BookmarkSectionProps {
  connected: boolean
  pageData: PageMetadata | null
  isSupportedPage: boolean
  bookmarkStatus: BookmarkCheck | null
  loading: boolean
  error: string | null
  onRemove: () => Promise<void>
}

export default function BookmarkSection({
  connected,
  pageData,
  isSupportedPage,
  bookmarkStatus,
  loading,
  error,
  onRemove,
}: BookmarkSectionProps) {
  const { t, locale } = useLocale()
  const [removeLoading, setRemoveLoading] = useState(false)
  const [justBookmarked, setJustBookmarked] = useState(false)
  const prevBookmarkedRef = useRef(false)

  // Detect transition to bookmarked state for flip animation
  useEffect(() => {
    if (bookmarkStatus?.bookmarked && !prevBookmarkedRef.current) {
      setJustBookmarked(true)
    }
    prevBookmarkedRef.current = !!bookmarkStatus?.bookmarked
  }, [bookmarkStatus?.bookmarked])

  const handleRemove = async () => {
    if (removeLoading) return
    setRemoveLoading(true)
    try {
      await onRemove()
    } finally {
      setRemoveLoading(false)
    }
  }

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return ''
    try {
      const date = new Date(dateStr)
      return date.toLocaleDateString(locale === 'zh' ? 'zh-CN' : 'en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      })
    } catch {
      return ''
    }
  }

  // Not connected
  if (!connected) {
    return (
      <div className="p-3">
        <h2 className="text-sm font-medium text-foreground mb-2">{t('bookmark.title')}</h2>
        <div className="py-6 text-center text-sm text-muted-foreground">
          {t('bookmark.configureFirst')}
        </div>
      </div>
    )
  }

  // Unsupported page
  if (!isSupportedPage) {
    return (
      <div className="p-3">
        <h2 className="text-sm font-medium text-foreground mb-2">{t('bookmark.title')}</h2>
        <div className="py-6 text-center text-sm text-muted-foreground">
          {t('bookmark.unsupported')}
        </div>
      </div>
    )
  }

  // Error state
  if (error) {
    return (
      <div className="p-3">
        <h2 className="text-sm font-medium text-foreground mb-2">{t('bookmark.title')}</h2>
        <div className="mb-3 flex items-center justify-center gap-2 py-2.5 bg-red-50 rounded-md">
          <XCircle className="w-4 h-4 text-red-600" />
          <span className="text-sm font-medium text-red-700">{t('bookmark.failed')}</span>
        </div>
        <div className="mb-3 text-xs text-red-600">{error}</div>
        {pageData && <PagePreview pageData={pageData} t={t} />}
      </div>
    )
  }

  // Loading state
  if (loading || (!bookmarkStatus && !error)) {
    return (
      <div className="p-3">
        <h2 className="text-sm font-medium text-foreground mb-2">{t('bookmark.title')}</h2>
        <div className="py-6 flex flex-col items-center justify-center gap-3">
          <div className="animate-pulse-glow">
            <Loader2 className="w-6 h-6 text-muted-foreground animate-spin" />
          </div>
          <span className="text-sm text-muted-foreground">{t('bookmark.saving')}</span>
        </div>
      </div>
    )
  }

  // Bookmarked state
  if (bookmarkStatus?.bookmarked) {
    return (
      <div className="p-3">
        <h2 className="text-sm font-medium text-foreground mb-2">{t('bookmark.title')}</h2>

        {/* Flip animation badge */}
        <div className="mb-3 flex items-center justify-center gap-2 py-2.5 bg-green-50 rounded-md">
          <div className="flip-container w-5 h-5">
            <div className={cn("flip-inner", justBookmarked && "flipped")}>
              <div className="flip-front">
                <Bookmark className="w-4 h-4 text-muted-foreground" />
              </div>
              <div className="flip-back">
                <CheckCircle className="w-4 h-4 text-green-600" />
              </div>
            </div>
          </div>
          <span className="text-sm font-medium text-green-700">{t('bookmark.saved')}</span>
        </div>

        {/* Page info */}
        {pageData && (
          <PagePreview
            pageData={pageData}
            createdAt={formatDate(bookmarkStatus.created_at)}
            t={t}
          />
        )}

        {/* Remove button */}
        <Button
          variant="outline"
          size="sm"
          className="mt-3 w-full"
          onClick={handleRemove}
          disabled={removeLoading}
        >
          {removeLoading && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
          {removeLoading ? t('bookmark.removing') : t('bookmark.remove')}
        </Button>
      </div>
    )
  }

  // Waiting for auto-trigger
  return (
    <div className="p-3">
      <h2 className="text-sm font-medium text-foreground mb-2">{t('bookmark.title')}</h2>
      <div className="py-6 flex flex-col items-center justify-center gap-3">
        <div className="animate-pulse-glow">
          <Loader2 className="w-6 h-6 text-muted-foreground animate-spin" />
        </div>
        <span className="text-sm text-muted-foreground">{t('bookmark.saving')}</span>
      </div>
    </div>
  )
}

function PagePreview({
  pageData,
  createdAt,
  t,
}: {
  pageData: PageMetadata
  createdAt?: string
  t: TFunction
}) {
  return (
    <div className="rounded-md bg-muted/60 p-3">
      <div className="flex items-start gap-2.5">
        {pageData.favicon && (
          <img
            src={pageData.favicon}
            alt=""
            className="w-5 h-5 flex-shrink-0 mt-0.5 rounded-sm"
            onError={(e) => {
              (e.target as HTMLImageElement).style.display = 'none'
            }}
          />
        )}
        <div className="min-w-0 flex-1">
          <h3 className="text-sm font-medium text-foreground truncate">
            {pageData.title || t('bookmark.noTitle')}
          </h3>
          <p className="text-xs text-muted-foreground truncate mt-0.5">
            {pageData.url}
          </p>
          {createdAt && (
            <p className="text-xs text-muted-foreground/70 mt-1">
              {t('bookmark.savedAt', { date: createdAt })}
            </p>
          )}
        </div>
      </div>
    </div>
  )
}

import { Star, ExternalLink, Globe } from 'lucide-react'
import { cn, getTagStyles, formatDate, truncate } from '@/lib/utils'
import { openUrl } from '@/lib/shell'
import type { Bookmark } from '@/types'

type BookmarkCardProps = {
  bookmark: Bookmark
  isSelected: boolean
  onClick: () => void
  onToggleFavorite: () => void
}

export default function BookmarkCard({
  bookmark,
  isSelected,
  onClick,
  onToggleFavorite,
}: BookmarkCardProps) {
  return (
    <article
      onClick={onClick}
      className={cn(
        'group relative bg-panel border rounded-xl p-4 cursor-pointer transition-all duration-200',
        isSelected
          ? 'border-brand/40 shadow-glow bg-brand/5'
          : 'border-edge hover:border-edge-hover hover:bg-raised/50'
      )}
    >
      {/* Header */}
      <div className="flex items-start gap-3 mb-2.5">
        <div className="w-8 h-8 rounded-lg bg-raised border border-edge flex items-center justify-center shrink-0 mt-0.5">
          {bookmark.favicon ? (
            <img
              src={bookmark.favicon}
              alt={bookmark.domain}
              className="w-4 h-4 rounded"
            />
          ) : (
            <Globe className="w-3.5 h-3.5 text-ink-faint" />
          )}
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="text-[13px] font-semibold text-ink leading-snug line-clamp-2">
            {bookmark.title}
          </h3>
          <div className="flex items-center gap-1.5 mt-1">
            <span className="text-[11px] text-ink-faint truncate">
              {bookmark.domain}
            </span>
          </div>
        </div>
        {/* Actions */}
        <div className="flex items-center gap-1 shrink-0">
          <button
            onClick={e => {
              e.stopPropagation()
              onToggleFavorite()
            }}
            className={cn(
              'p-1 rounded-md transition-all duration-150 cursor-pointer',
              bookmark.isFavorite
                ? 'text-tag-amber'
                : 'text-ink-faint opacity-0 group-hover:opacity-100 hover:text-tag-amber'
            )}
          >
            <Star
              className="w-3.5 h-3.5"
              fill={bookmark.isFavorite ? 'currentColor' : 'none'}
            />
          </button>
          <button
            onClick={e => {
              e.stopPropagation()
              openUrl(bookmark.url)
            }}
            className="p-1 rounded-md text-ink-faint opacity-0 group-hover:opacity-100 hover:text-ink transition-all duration-150"
          >
            <ExternalLink className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Description */}
      {bookmark.description && (
        <p className="text-[12px] text-ink-dim leading-relaxed mb-3 line-clamp-2">
          {truncate(bookmark.description, 100)}
        </p>
      )}

      {/* Footer: Tags + Date */}
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-1.5 flex-wrap min-w-0">
          {bookmark.tags.slice(0, 3).map(tag => {
            const styles = getTagStyles(tag)
            return (
              <span
                key={tag}
                className={cn(
                  'inline-flex items-center px-1.5 py-0.5 rounded-md text-[10px] font-medium',
                  styles.bg,
                  styles.text
                )}
              >
                {tag}
              </span>
            )
          })}
          {bookmark.tags.length > 3 && (
            <span className="text-[10px] text-ink-faint">
              +{bookmark.tags.length - 3}
            </span>
          )}
        </div>
        <time className="text-[10px] text-ink-faint shrink-0 tabular-nums">
          {formatDate(bookmark.createdAt)}
        </time>
      </div>
    </article>
  )
}

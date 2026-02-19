import {
  X,
  ExternalLink,
  Star,
  Trash2,
  Copy,
  Globe,
  Calendar,
  Tag,
  Link,
} from 'lucide-react'
import { cn, getTagStyles, formatDate } from '@/lib/utils'
import { openUrl } from '@/lib/shell'
import type { Bookmark } from '@/types'
import { useState } from 'react'

type BookmarkDetailProps = {
  bookmark: Bookmark
  onClose: () => void
  onDelete: () => void
  onToggleFavorite: () => void
}

export default function BookmarkDetail({
  bookmark,
  onClose,
  onDelete,
  onToggleFavorite,
}: BookmarkDetailProps) {
  const [copied, setCopied] = useState(false)

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(bookmark.url)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      // Clipboard API not available
    }
  }

  const handleDelete = () => {
    onDelete()
    onClose()
  }

  return (
    <aside className="w-[340px] shrink-0 bg-panel border-l border-edge h-full flex flex-col animate-slide-right">
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-4 border-b border-edge">
        <h2 className="text-xs font-semibold uppercase tracking-widest text-ink-faint">
          书签详情
        </h2>
        <button
          onClick={onClose}
          className="p-1 rounded-md hover:bg-raised text-ink-faint hover:text-ink transition-colors cursor-pointer"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto px-5 py-5 space-y-5">
        {/* Favicon + Domain */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-raised border border-edge flex items-center justify-center">
            {bookmark.favicon ? (
              <img
                src={bookmark.favicon}
                alt={bookmark.domain}
                className="w-5 h-5 rounded"
              />
            ) : (
              <Globe className="w-5 h-5 text-ink-faint" />
            )}
          </div>
          <div>
            <p className="text-xs font-medium text-ink-dim">{bookmark.domain}</p>
            <p className="text-[10px] text-ink-faint">
              {formatDate(bookmark.createdAt)}
            </p>
          </div>
        </div>

        {/* Title */}
        <div>
          <h3 className="text-base font-semibold text-ink leading-snug">
            {bookmark.title}
          </h3>
        </div>

        {/* URL */}
        <div className="space-y-1.5">
          <label className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-widest text-ink-faint">
            <Link className="w-3 h-3" />
            链接
          </label>
          <button
            onClick={() => openUrl(bookmark.url)}
            className="block text-left text-xs text-brand-soft hover:text-brand transition-colors break-all leading-relaxed cursor-pointer"
          >
            {bookmark.url}
          </button>
        </div>

        {/* Description */}
        {bookmark.description && (
          <div className="space-y-1.5">
            <label className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-widest text-ink-faint">
              <Calendar className="w-3 h-3" />
              描述
            </label>
            <p className="text-xs text-ink-dim leading-relaxed">
              {bookmark.description}
            </p>
          </div>
        )}

        {/* Tags */}
        {bookmark.tags.length > 0 && (
          <div className="space-y-2">
            <label className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-widest text-ink-faint">
              <Tag className="w-3 h-3" />
              标签
            </label>
            <div className="flex flex-wrap gap-1.5">
              {bookmark.tags.map(tag => {
                const styles = getTagStyles(tag)
                return (
                  <span
                    key={tag}
                    className={cn(
                      'inline-flex items-center px-2 py-1 rounded-lg text-[11px] font-medium',
                      styles.bg,
                      styles.text
                    )}
                  >
                    #{tag}
                  </span>
                )
              })}
            </div>
          </div>
        )}

        {/* Metadata */}
        <div className="space-y-1.5">
          <label className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-widest text-ink-faint">
            元数据
          </label>
          <div className="bg-raised rounded-lg border border-edge p-3 space-y-2 text-xs">
            <div className="flex justify-between">
              <span className="text-ink-faint">ID</span>
              <span className="text-ink-dim font-mono text-[10px]">{bookmark.id}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-ink-faint">域名</span>
              <span className="text-ink-dim">{bookmark.domain}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-ink-faint">创建时间</span>
              <span className="text-ink-dim">
                {new Date(bookmark.createdAt).toLocaleDateString('zh-CN')}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-ink-faint">收藏</span>
              <span className="text-ink-dim">{bookmark.isFavorite ? '是' : '否'}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="px-5 py-4 border-t border-edge space-y-2">
        <div className="flex gap-2">
          <button
            onClick={() => openUrl(bookmark.url)}
            className="flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg bg-brand text-[13px] font-medium text-ink hover:bg-brand-deep transition-colors cursor-pointer"
          >
            <ExternalLink className="w-3.5 h-3.5" />
            打开
          </button>
          <button
            onClick={handleCopy}
            className={cn(
              'flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg border text-[13px] font-medium transition-colors cursor-pointer',
              copied
                ? 'border-success/30 bg-success/10 text-success'
                : 'border-edge bg-raised text-ink-dim hover:text-ink hover:border-edge-hover'
            )}
          >
            <Copy className="w-3.5 h-3.5" />
            {copied ? '已复制' : '复制'}
          </button>
          <button
            onClick={onToggleFavorite}
            className={cn(
              'flex items-center justify-center py-2 px-3 rounded-lg border transition-colors cursor-pointer',
              bookmark.isFavorite
                ? 'border-tag-amber/30 bg-tag-amber/10 text-tag-amber'
                : 'border-edge bg-raised text-ink-dim hover:text-ink hover:border-edge-hover'
            )}
          >
            <Star
              className="w-3.5 h-3.5"
              fill={bookmark.isFavorite ? 'currentColor' : 'none'}
            />
          </button>
        </div>
        <button
          onClick={handleDelete}
          className="w-full flex items-center justify-center gap-1.5 py-2 rounded-lg text-[12px] text-danger/70 hover:bg-danger/10 hover:text-danger transition-colors cursor-pointer"
        >
          <Trash2 className="w-3.5 h-3.5" />
          删除此书签
        </button>
      </div>
    </aside>
  )
}

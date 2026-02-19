import { useState } from 'react'
import { X, Link, FileText, Tag, AlignLeft, Plus, Loader2 } from 'lucide-react'
import { cn, extractDomain } from '@/lib/utils'
import type { BookmarkFormData } from '@/types'

type AddBookmarkModalProps = {
  onAdd: (data: BookmarkFormData) => void
  onClose: () => void
}

export default function AddBookmarkModal({ onAdd, onClose }: AddBookmarkModalProps) {
  const [url, setUrl] = useState('')
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [tagsInput, setTagsInput] = useState('')
  const [saving, setSaving] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})

  const validate = (): boolean => {
    const errs: Record<string, string> = {}
    if (!url.trim()) errs.url = '请输入 URL'
    else {
      try {
        new URL(url)
      } catch {
        errs.url = '请输入有效的 URL'
      }
    }
    if (!title.trim()) errs.title = '请输入标题'
    setErrors(errs)
    return Object.keys(errs).length === 0
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!validate()) return

    setSaving(true)
    // Simulate a small delay for UX
    setTimeout(() => {
      const tags = tagsInput
        .split(/[,，\s]+/)
        .map(t => t.trim().toLowerCase())
        .filter(Boolean)

      onAdd({
        url: url.trim(),
        title: title.trim(),
        description: description.trim(),
        tags,
      })
      setSaving(false)
    }, 300)
  }

  const domain = url.trim() ? extractDomain(url.trim()) : ''

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-base/80 backdrop-blur-sm animate-fade-in"
      onClick={onClose}
    >
      <div
        className="w-full max-w-md bg-panel border border-edge rounded-2xl shadow-modal animate-scale-in"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-edge">
          <div className="flex items-center gap-2">
            <Plus className="w-4 h-4 text-brand-soft" />
            <h2 className="text-sm font-semibold text-ink">添加书签</h2>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-md hover:bg-raised text-ink-faint hover:text-ink transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="px-6 py-5 space-y-4">
          {/* URL */}
          <div className="space-y-1.5">
            <label className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider text-ink-faint">
              <Link className="w-3 h-3" />
              URL
            </label>
            <input
              type="text"
              value={url}
              onChange={e => setUrl(e.target.value)}
              placeholder="https://example.com/article"
              className={cn(
                'w-full px-3 py-2.5 rounded-lg bg-raised border text-sm text-ink placeholder:text-ink-faint outline-none transition-colors',
                errors.url
                  ? 'border-danger/50 focus:border-danger'
                  : 'border-edge focus:border-brand/50'
              )}
              autoFocus
            />
            {errors.url && (
              <p className="text-[11px] text-danger">{errors.url}</p>
            )}
            {domain && !errors.url && (
              <p className="text-[10px] text-ink-faint">
                域名: {domain}
              </p>
            )}
          </div>

          {/* Title */}
          <div className="space-y-1.5">
            <label className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider text-ink-faint">
              <FileText className="w-3 h-3" />
              标题
            </label>
            <input
              type="text"
              value={title}
              onChange={e => setTitle(e.target.value)}
              placeholder="页面标题"
              className={cn(
                'w-full px-3 py-2.5 rounded-lg bg-raised border text-sm text-ink placeholder:text-ink-faint outline-none transition-colors',
                errors.title
                  ? 'border-danger/50 focus:border-danger'
                  : 'border-edge focus:border-brand/50'
              )}
            />
            {errors.title && (
              <p className="text-[11px] text-danger">{errors.title}</p>
            )}
          </div>

          {/* Description */}
          <div className="space-y-1.5">
            <label className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider text-ink-faint">
              <AlignLeft className="w-3 h-3" />
              描述
              <span className="text-ink-faint/60 normal-case tracking-normal">(可选)</span>
            </label>
            <textarea
              value={description}
              onChange={e => setDescription(e.target.value)}
              placeholder="简要描述页面内容..."
              rows={3}
              className="w-full px-3 py-2.5 rounded-lg bg-raised border border-edge text-sm text-ink placeholder:text-ink-faint outline-none focus:border-brand/50 transition-colors resize-none"
            />
          </div>

          {/* Tags */}
          <div className="space-y-1.5">
            <label className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider text-ink-faint">
              <Tag className="w-3 h-3" />
              标签
              <span className="text-ink-faint/60 normal-case tracking-normal">(逗号分隔)</span>
            </label>
            <input
              type="text"
              value={tagsInput}
              onChange={e => setTagsInput(e.target.value)}
              placeholder="react, frontend, docs"
              className="w-full px-3 py-2.5 rounded-lg bg-raised border border-edge text-sm text-ink placeholder:text-ink-faint outline-none focus:border-brand/50 transition-colors"
            />
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2.5 rounded-lg border border-edge text-sm font-medium text-ink-dim hover:bg-raised hover:text-ink transition-colors cursor-pointer"
            >
              取消
            </button>
            <button
              type="submit"
              disabled={saving}
              className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg bg-brand text-sm font-medium text-ink hover:bg-brand-deep transition-colors disabled:opacity-60 cursor-pointer"
            >
              {saving ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  保存中...
                </>
              ) : (
                '保存书签'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

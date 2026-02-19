import { Search, X, Command } from 'lucide-react'
import { cn } from '@/lib/utils'

type SearchBarProps = {
  value: string
  onChange: (value: string) => void
}

export default function SearchBar({ value, onChange }: SearchBarProps) {
  return (
    <div className="px-6 pt-5 pb-3">
      <div
        className={cn(
          'relative flex items-center gap-3 bg-raised border rounded-xl px-4 py-2.5 transition-all duration-200',
          value
            ? 'border-brand/40 shadow-glow'
            : 'border-edge hover:border-edge-hover'
        )}
      >
        <Search className="w-4.5 h-4.5 text-ink-faint shrink-0" />
        <input
          id="search-input"
          type="text"
          value={value}
          onChange={e => onChange(e.target.value)}
          placeholder="搜索书签、标签或关键词..."
          className="flex-1 bg-transparent text-sm text-ink placeholder:text-ink-faint outline-none"
          autoComplete="off"
        />
        {value ? (
          <button
            onClick={() => onChange('')}
            className="p-0.5 rounded-md hover:bg-dim transition-colors cursor-pointer"
          >
            <X className="w-3.5 h-3.5 text-ink-dim" />
          </button>
        ) : (
          <kbd className="hidden sm:flex items-center gap-0.5 px-1.5 py-0.5 rounded-md bg-dim/60 border border-edge text-[10px] text-ink-faint">
            <Command className="w-2.5 h-2.5" />
            <span>K</span>
          </kbd>
        )}
      </div>
      {value && (
        <p className="mt-2 px-1 text-[11px] text-ink-faint animate-fade-in">
          搜索 &ldquo;{value}&rdquo; 的相关结果
        </p>
      )}
    </div>
  )
}

import {
  Bookmark,
  Clock,
  Star,
  Hash,
  Plus,
  Brain,
  Zap,
  Chrome,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import type { BookmarkFilter, BookmarkStats } from '@/types'

type SidebarProps = {
  activeFilter: BookmarkFilter
  onFilterChange: (filter: BookmarkFilter) => void
  tags: [string, number][]
  stats: BookmarkStats
  onSearchByTag: (tag: string) => void
  onAddClick: () => void
  onExtensionClick: () => void
}

const NAV_ITEMS: { filter: BookmarkFilter; label: string; icon: typeof Bookmark }[] = [
  { filter: 'all', label: '全部书签', icon: Bookmark },
  { filter: 'recent', label: '最近添加', icon: Clock },
  { filter: 'favorites', label: '收藏夹', icon: Star },
]

export default function Sidebar({
  activeFilter,
  onFilterChange,
  tags,
  stats,
  onSearchByTag,
  onAddClick,
  onExtensionClick,
}: SidebarProps) {
  const getCount = (filter: BookmarkFilter) => {
    if (filter === 'all') return stats.total
    if (filter === 'recent') return stats.recent
    return stats.favorites
  }

  return (
    <aside className="w-[220px] shrink-0 bg-panel border-r border-edge flex flex-col h-full">
      {/* Logo */}
      <div className="px-5 py-5 flex items-center gap-2.5">
        <div className="w-8 h-8 rounded-lg bg-brand/15 flex items-center justify-center">
          <Brain className="w-4.5 h-4.5 text-brand-soft" />
        </div>
        <div>
          <h1 className="text-sm font-semibold text-ink tracking-tight">Arvai</h1>
          <p className="text-[10px] text-ink-faint">Knowledge Hub</p>
        </div>
      </div>

      {/* Navigation */}
      <nav className="px-3 mt-1 space-y-0.5">
        {NAV_ITEMS.map(item => {
          const Icon = item.icon
          const isActive = activeFilter === item.filter
          return (
            <button
              key={item.filter}
              onClick={() => onFilterChange(item.filter)}
              className={cn(
                'w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-[13px] font-medium transition-all duration-150 cursor-pointer',
                isActive
                  ? 'bg-brand/12 text-brand-soft'
                  : 'text-ink-dim hover:bg-raised hover:text-ink'
              )}
            >
              <Icon className="w-4 h-4 shrink-0" />
              <span className="flex-1 text-left">{item.label}</span>
              <span
                className={cn(
                  'text-[11px] tabular-nums',
                  isActive ? 'text-brand-soft/70' : 'text-ink-faint'
                )}
              >
                {getCount(item.filter)}
              </span>
            </button>
          )
        })}
      </nav>

      {/* Divider */}
      <div className="mx-5 my-3 h-px bg-edge" />

      {/* Tags Section */}
      <div className="px-3 flex-1 overflow-hidden flex flex-col">
        <h2 className="px-3 text-[10px] font-semibold uppercase tracking-widest text-ink-faint mb-2">
          标签
        </h2>
        <div className="flex-1 overflow-y-auto space-y-0.5">
          {tags.slice(0, 12).map(([tag, count]) => (
            <button
              key={tag}
              onClick={() => onSearchByTag(tag)}
              className="w-full flex items-center gap-2.5 px-3 py-1.5 rounded-lg text-[12px] text-ink-dim hover:bg-raised hover:text-ink transition-colors cursor-pointer"
            >
              <Hash className="w-3.5 h-3.5 text-ink-faint shrink-0" />
              <span className="flex-1 text-left truncate">{tag}</span>
              <span className="text-[10px] text-ink-faint">{count}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Bottom Section */}
      <div className="px-3 pb-4 space-y-2">
        <div className="mx-2 h-px bg-edge" />

        {/* Add Button */}
        <button
          onClick={onAddClick}
          className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-[13px] font-medium text-brand-soft hover:bg-brand/10 transition-colors cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>添加书签</span>
        </button>

        {/* Extension Button */}
        <button
          onClick={onExtensionClick}
          className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-[13px] font-medium text-ink-dim hover:bg-raised hover:text-ink transition-colors cursor-pointer"
        >
          <Chrome className="w-4 h-4" />
          <span>浏览器扩展</span>
        </button>

        {/* API Status */}
        <div className="flex items-center gap-2 px-3 py-1.5 text-[10px] text-ink-faint">
          <Zap className="w-3 h-3" />
          <span>本地模式</span>
          <span className="ml-auto w-1.5 h-1.5 rounded-full bg-success" />
        </div>
      </div>
    </aside>
  )
}

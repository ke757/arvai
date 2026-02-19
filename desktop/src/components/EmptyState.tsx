import { Search, BookmarkPlus } from 'lucide-react'

type EmptyStateProps = {
  query: string
}

export default function EmptyState({ query }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center h-full animate-fade-in">
      <div className="w-16 h-16 rounded-2xl bg-raised border border-edge flex items-center justify-center mb-5">
        {query ? (
          <Search className="w-7 h-7 text-ink-faint" />
        ) : (
          <BookmarkPlus className="w-7 h-7 text-ink-faint" />
        )}
      </div>
      <h3 className="text-base font-semibold text-ink mb-1.5">
        {query ? '未找到匹配结果' : '暂无书签'}
      </h3>
      <p className="text-sm text-ink-dim text-center max-w-xs leading-relaxed">
        {query
          ? `没有找到与 "${query}" 相关的书签，请尝试其他关键词`
          : '点击左侧「添加书签」按钮或使用浏览器插件保存你的第一个书签'}
      </p>
    </div>
  )
}

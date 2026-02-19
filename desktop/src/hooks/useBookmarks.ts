import { useState, useEffect, useCallback, useMemo } from 'react'
import type { Bookmark, BookmarkFilter, BookmarkFormData, BookmarkStats } from '@/types'
import { generateId, extractDomain } from '@/lib/utils'

const STORAGE_KEY = 'arvai-bookmarks'

const MOCK_BOOKMARKS: Bookmark[] = [
  {
    id: generateId(),
    url: 'https://react.dev/learn',
    title: 'React 官方文档 - 快速入门',
    description: '最新 React 19 官方文档，包含完整的教程、指南和 API 参考，帮助你构建现代化的用户界面。',
    tags: ['react', 'frontend', 'docs'],
    favicon: '',
    domain: 'react.dev',
    createdAt: new Date(Date.now() - 86400000 * 1).toISOString(),
    isFavorite: true,
  },
  {
    id: generateId(),
    url: 'https://arxiv.org/abs/2401.00001',
    title: 'Prompt Engineering 最佳实践：从理论到应用',
    description: '深入探讨大型语言模型的提示词工程技术，包括 Chain-of-Thought、Few-shot Learning 等高级策略。',
    tags: ['ai', 'llm', 'research'],
    favicon: '',
    domain: 'arxiv.org',
    createdAt: new Date(Date.now() - 86400000 * 3).toISOString(),
    isFavorite: true,
  },
  {
    id: generateId(),
    url: 'https://tailwindcss.com/docs/installation/using-vite',
    title: 'Tailwind CSS v4 安装指南 - Vite 集成',
    description: '使用 Vite 构建工具集成 Tailwind CSS v4 的完整安装和配置指南。',
    tags: ['css', 'frontend', 'tailwind'],
    favicon: '',
    domain: 'tailwindcss.com',
    createdAt: new Date(Date.now() - 86400000 * 5).toISOString(),
    isFavorite: false,
  },
  {
    id: generateId(),
    url: 'https://tauri.app/start/',
    title: 'Tauri 2.0 - 构建跨平台桌面应用',
    description: 'Tauri 是一个使用 Web 前端构建轻量级、安全桌面应用的框架，基于 Rust 内核，性能卓越。',
    tags: ['tauri', 'desktop', 'rust'],
    favicon: '',
    domain: 'tauri.app',
    createdAt: new Date(Date.now() - 86400000 * 7).toISOString(),
    isFavorite: false,
  },
  {
    id: generateId(),
    url: 'https://www.pinecone.io/learn/vector-database/',
    title: '向量数据库原理详解 - Pinecone',
    description: '全面解析向量数据库的工作原理、应用场景和技术选型，适合构建 AI 检索增强系统。',
    tags: ['database', 'ai', 'vector'],
    favicon: '',
    domain: 'pinecone.io',
    createdAt: new Date(Date.now() - 86400000 * 10).toISOString(),
    isFavorite: true,
  },
  {
    id: generateId(),
    url: 'https://fastapi.tiangolo.com/zh/',
    title: 'FastAPI 中文文档 - 高性能 Python Web 框架',
    description: '基于 Python 类型提示的现代 Web 框架，自动生成 API 文档，性能可媲美 Node.js 和 Go。',
    tags: ['python', 'backend', 'api'],
    favicon: '',
    domain: 'fastapi.tiangolo.com',
    createdAt: new Date(Date.now() - 86400000 * 14).toISOString(),
    isFavorite: false,
  },
  {
    id: generateId(),
    url: 'https://docs.anthropic.com/en/docs',
    title: 'Claude API 文档 - Anthropic',
    description: '大型语言模型 Claude 的官方 API 文档，包含模型能力说明、接口调用示例和最佳实践。',
    tags: ['ai', 'llm', 'api'],
    favicon: '',
    domain: 'docs.anthropic.com',
    createdAt: new Date(Date.now() - 86400000 * 20).toISOString(),
    isFavorite: false,
  },
  {
    id: generateId(),
    url: 'https://github.com/langchain-ai/langchain',
    title: 'LangChain - LLM 应用开发框架',
    description: '用于开发大语言模型驱动应用的框架，提供链式调用、Agent、RAG 等核心能力。',
    tags: ['ai', 'python', 'framework'],
    favicon: '',
    domain: 'github.com',
    createdAt: new Date(Date.now() - 86400000 * 30).toISOString(),
    isFavorite: false,
  },
  {
    id: generateId(),
    url: 'https://www.typescriptlang.org/docs/',
    title: 'TypeScript 官方手册',
    description: 'TypeScript 语言的完整参考文档，涵盖类型系统、泛型、装饰器等核心概念。',
    tags: ['typescript', 'frontend', 'docs'],
    favicon: '',
    domain: 'typescriptlang.org',
    createdAt: new Date(Date.now() - 86400000 * 45).toISOString(),
    isFavorite: false,
  },
  {
    id: generateId(),
    url: 'https://chromium.googlesource.com/chromium/src/+/main/chrome/browser/extensions/api/',
    title: 'Chrome Extensions API 开发指南',
    description: '浏览器扩展开发的完整 API 参考，包括标签页管理、书签操作、存储等核心接口。',
    tags: ['chrome', 'extension', 'browser'],
    favicon: '',
    domain: 'googlesource.com',
    createdAt: new Date(Date.now() - 86400000 * 60).toISOString(),
    isFavorite: false,
  },
]

export function useBookmarks() {
  const [bookmarks, setBookmarks] = useState<Bookmark[]>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY)
      if (stored) {
        const parsed = JSON.parse(stored) as Bookmark[]
        if (Array.isArray(parsed) && parsed.length > 0) return parsed
      }
    } catch {
      // ignore parse errors
    }
    return MOCK_BOOKMARKS
  })

  const [searchQuery, setSearchQuery] = useState('')
  const [activeFilter, setActiveFilter] = useState<BookmarkFilter>('all')
  const [selectedId, setSelectedId] = useState<string | null>(null)

  // Persist to localStorage
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(bookmarks))
  }, [bookmarks])

  const addBookmark = useCallback((data: BookmarkFormData) => {
    const bookmark: Bookmark = {
      id: generateId(),
      url: data.url,
      title: data.title,
      description: data.description,
      tags: data.tags,
      favicon: '',
      domain: extractDomain(data.url),
      createdAt: new Date().toISOString(),
      isFavorite: false,
    }
    setBookmarks(prev => [bookmark, ...prev])
    return bookmark
  }, [])

  const removeBookmark = useCallback((id: string) => {
    setBookmarks(prev => prev.filter(b => b.id !== id))
    setSelectedId(prev => (prev === id ? null : prev))
  }, [])

  const toggleFavorite = useCallback((id: string) => {
    setBookmarks(prev =>
      prev.map(b => (b.id === id ? { ...b, isFavorite: !b.isFavorite } : b))
    )
  }, [])

  const filteredBookmarks = useMemo(() => {
    let result = [...bookmarks]

    // Apply filter
    if (activeFilter === 'favorites') {
      result = result.filter(b => b.isFavorite)
    } else if (activeFilter === 'recent') {
      const weekAgo = Date.now() - 7 * 86400000
      result = result.filter(b => new Date(b.createdAt).getTime() > weekAgo)
    }

    // Apply search
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase().trim()
      const terms = query.split(/\s+/)
      result = result
        .map(b => {
          let score = 0
          for (const term of terms) {
            if (b.title.toLowerCase().includes(term)) score += 10
            if (b.tags.some(t => t.toLowerCase().includes(term))) score += 8
            if (b.url.toLowerCase().includes(term)) score += 5
            if (b.description.toLowerCase().includes(term)) score += 3
            if (b.domain.toLowerCase().includes(term)) score += 4
          }
          return { bookmark: b, score }
        })
        .filter(item => item.score > 0)
        .sort((a, b) => b.score - a.score)
        .map(item => item.bookmark)
    } else {
      // Default sort by date
      result.sort(
        (a, b) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      )
    }

    return result
  }, [bookmarks, activeFilter, searchQuery])

  const allTags = useMemo(() => {
    const tagMap = new Map<string, number>()
    bookmarks.forEach(b => {
      b.tags.forEach(t => {
        tagMap.set(t, (tagMap.get(t) || 0) + 1)
      })
    })
    return Array.from(tagMap.entries()).sort((a, b) => b[1] - a[1])
  }, [bookmarks])

  const selectedBookmark = useMemo(() => {
    return selectedId ? bookmarks.find(b => b.id === selectedId) ?? null : null
  }, [bookmarks, selectedId])

  const stats: BookmarkStats = useMemo(() => {
    const weekAgo = Date.now() - 7 * 86400000
    return {
      total: bookmarks.length,
      favorites: bookmarks.filter(b => b.isFavorite).length,
      recent: bookmarks.filter(b => new Date(b.createdAt).getTime() > weekAgo).length,
    }
  }, [bookmarks])

  return {
    bookmarks: filteredBookmarks,
    searchQuery,
    setSearchQuery,
    activeFilter,
    setActiveFilter,
    selectedBookmark,
    selectedId,
    setSelectedId,
    addBookmark,
    removeBookmark,
    toggleFavorite,
    allTags,
    stats,
  }
}

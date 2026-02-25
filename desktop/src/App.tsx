import { useState, useEffect } from 'react'
import { useBookmarks } from '@/hooks/useBookmarks'
import Sidebar from '@/components/Sidebar'
import SearchBar from '@/components/SearchBar'
import BookmarkCard from '@/components/BookmarkCard'
import BookmarkDetail from '@/components/BookmarkDetail'
import AddBookmarkModal from '@/components/AddBookmarkModal'
import ExtensionConnect from '@/components/ExtensionConnect'
import EmptyState from '@/components/EmptyState'

function App() {
  const {
    bookmarks,
    searchQuery,
    setSearchQuery,
    activeFilter,
    setActiveFilter,
    selectedBookmark,
    setSelectedId,
    addBookmark,
    removeBookmark,
    toggleFavorite,
    allTags,
    stats,
  } = useBookmarks()

  const [showAddModal, setShowAddModal] = useState(false)
  const [showExtensionModal, setShowExtensionModal] = useState(false)

  // Keyboard shortcut: Ctrl+K to focus search
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault()
        document.getElementById('search-input')?.focus()
      }
      if (e.key === 'Escape') {
        if (showExtensionModal) {
          setShowExtensionModal(false)
        } else if (showAddModal) {
          setShowAddModal(false)
        } else if (selectedBookmark) {
          setSelectedId(null)
        }
      }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [showAddModal, showExtensionModal, selectedBookmark, setSelectedId])

  const handleSearchByTag = (tag: string) => {
    setSearchQuery(tag)
    setActiveFilter('all')
  }

  return (
    <div className="flex h-screen bg-base">
      {/* Sidebar */}
      <Sidebar
        activeFilter={activeFilter}
        onFilterChange={setActiveFilter}
        tags={allTags}
        stats={stats}
        onSearchByTag={handleSearchByTag}
        onAddClick={() => setShowAddModal(true)}
        onExtensionClick={() => setShowExtensionModal(true)}
      />

      {/* Main Content */}
      <main className="flex-1 flex flex-col overflow-hidden min-w-0">
        <SearchBar value={searchQuery} onChange={setSearchQuery} />

        {/* Results Header */}
        <div className="px-6 pb-2 flex items-center justify-between">
          <p className="text-[11px] text-ink-faint">
            {bookmarks.length} 个结果
          </p>
        </div>

        {/* Bookmark Grid */}
        <div className="flex-1 overflow-y-auto px-6 pb-6">
          {bookmarks.length === 0 ? (
            <EmptyState query={searchQuery} />
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-3">
              {bookmarks.map((bookmark, index) => (
                <div
                  key={bookmark.id}
                  className="animate-fade-in opacity-0"
                  style={{ animationDelay: `${index * 40}ms` }}
                >
                  <BookmarkCard
                    bookmark={bookmark}
                    isSelected={selectedBookmark?.id === bookmark.id}
                    onClick={() =>
                      setSelectedId(
                        selectedBookmark?.id === bookmark.id
                          ? null
                          : bookmark.id
                      )
                    }
                    onToggleFavorite={() => toggleFavorite(bookmark.id)}
                  />
                </div>
              ))}
            </div>
          )}
        </div>
      </main>

      {/* Detail Panel */}
      {selectedBookmark && (
        <BookmarkDetail
          bookmark={selectedBookmark}
          onClose={() => setSelectedId(null)}
          onDelete={() => removeBookmark(selectedBookmark.id)}
          onToggleFavorite={() => toggleFavorite(selectedBookmark.id)}
        />
      )}

      {/* Add Bookmark Modal */}
      {showAddModal && (
        <AddBookmarkModal
          onAdd={data => {
            addBookmark(data)
            setShowAddModal(false)
          }}
          onClose={() => setShowAddModal(false)}
        />
      )}

      {/* Extension Connect Modal */}
      {showExtensionModal && (
        <ExtensionConnect onClose={() => setShowExtensionModal(false)} />
      )}
    </div>
  )
}

export default App

export type Bookmark = {
  id: string
  url: string
  title: string
  description: string
  tags: string[]
  favicon: string
  domain: string
  createdAt: string
  isFavorite: boolean
}

export type BookmarkFilter = 'all' | 'recent' | 'favorites'

export type BookmarkFormData = {
  url: string
  title: string
  description: string
  tags: string[]
}

export type BookmarkStats = {
  total: number
  favorites: number
  recent: number
}

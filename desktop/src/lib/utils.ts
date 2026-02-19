import { clsx } from 'clsx'
import type { ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

const TAG_COLORS = [
  'tag-violet',
  'tag-sky',
  'tag-emerald',
  'tag-amber',
  'tag-rose',
  'tag-orange',
] as const

type TagColor = (typeof TAG_COLORS)[number]

const TAG_STYLES: Record<TagColor, { bg: string; text: string }> = {
  'tag-violet': { bg: 'bg-tag-violet/15', text: 'text-tag-violet' },
  'tag-sky': { bg: 'bg-tag-sky/15', text: 'text-tag-sky' },
  'tag-emerald': { bg: 'bg-tag-emerald/15', text: 'text-tag-emerald' },
  'tag-amber': { bg: 'bg-tag-amber/15', text: 'text-tag-amber' },
  'tag-rose': { bg: 'bg-tag-rose/15', text: 'text-tag-rose' },
  'tag-orange': { bg: 'bg-tag-orange/15', text: 'text-tag-orange' },
}

const colorCache = new Map<string, TagColor>()

export function getTagColor(tag: string): TagColor {
  const cached = colorCache.get(tag)
  if (cached) return cached
  const hash = tag.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0)
  const color = TAG_COLORS[hash % TAG_COLORS.length]
  colorCache.set(tag, color)
  return color
}

export function getTagStyles(tag: string) {
  return TAG_STYLES[getTagColor(tag)]
}

export function extractDomain(url: string): string {
  try {
    return new URL(url).hostname.replace(/^www\./, '')
  } catch {
    return url
  }
}

export function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).substring(2, 8)
}

export function formatDate(iso: string): string {
  const date = new Date(iso)
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffDays = Math.floor(diffMs / 86400000)

  if (diffDays === 0) return '今天'
  if (diffDays === 1) return '昨天'
  if (diffDays < 7) return `${diffDays}天前`
  if (diffDays < 30) return `${Math.floor(diffDays / 7)}周前`
  if (diffDays < 365) return `${Math.floor(diffDays / 30)}个月前`
  return `${Math.floor(diffDays / 365)}年前`
}

export function truncate(str: string, maxLen: number): string {
  if (str.length <= maxLen) return str
  return str.substring(0, maxLen) + '...'
}

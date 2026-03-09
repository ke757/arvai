import type { TranslationKey } from './zh'

const en: Record<TranslationKey, string> = {
  'connection.title': 'Server Connection',
  'connection.edit': 'Edit',
  'connection.placeholder': 'Get connection URL from desktop app',
  'connection.verifying': 'Verifying...',
  'connection.save': 'Save',
  'connection.cancel': 'Cancel',
  'connection.connected': 'Connected',
  'connection.urlInvalid': 'Invalid connection URL',
  'connection.serverUnreachable': 'Cannot connect to server',
  'connection.keyInvalid': 'Invalid API Key',
  'connection.networkError': 'Connection failed, check network',
  'bookmark.title': 'Page Bookmark',
  'bookmark.configureFirst': 'Please configure server connection first',
  'bookmark.unsupported': 'Current page is not supported',
  'bookmark.failed': 'Bookmark failed',
  'bookmark.saving': 'Saving...',
  'bookmark.saved': 'Bookmarked',
  'bookmark.noTitle': 'Untitled',
  'bookmark.savedAt': 'Saved on {date}',
  'bookmark.removing': 'Removing...',
  'bookmark.remove': 'Remove Bookmark',
  'bookmark.saveFailed': 'Save failed',
  'bookmark.dataError': 'Invalid response data',
  'bookmark.removeFailed': 'Remove failed',
  'bookmark.statusError': 'Cannot get page status',
  'bookmark.fetchError': 'Failed to fetch page data',
} as const

export default en

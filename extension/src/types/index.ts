// Bookmark types matching backend API
export interface Bookmark {
  id: number;
  url: string;
  title: string;
  description: string;
  favicon: string;
  domain: string;
  tags: string[];
  source: string;
  created_at: string;
  updated_at: string;
}

export interface BookmarkCreate {
  url: string;
  title?: string;
  description?: string;
  favicon?: string;
  tags?: string[];
  source?: string;
}

export interface BookmarkCheck {
  bookmarked: boolean;
  bookmark_id?: number;
  created_at?: string;
}

// Connection config stored in chrome.storage
export interface ConnectionConfig {
  server: string;
  apiKey: string;
  connected: boolean;
  lastVerified?: string;
}

// Page metadata extracted by content script
export interface PageMetadata {
  url: string;
  title: string;
  description: string;
  favicon: string;
}

// Messages between popup, background, and content scripts
export type MessageType =
  | 'CHECK_STATUS'
  | 'ADD_BOOKMARK'
  | 'REMOVE_BOOKMARK'
  | 'GET_PAGE_DATA'
  | 'CONNECTION_CHANGED';

export interface Message {
  type: MessageType;
  payload?: unknown;
}

export interface CheckStatusResponse {
  connected: boolean;
  bookmarked: boolean;
  bookmarkId?: number;
  createdAt?: string;
}

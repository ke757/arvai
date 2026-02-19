/**
 * Arvai API client for browser extension
 */

import type { Bookmark, BookmarkCreate, BookmarkCheck } from '../types';

export class ArvaiApi {
  private server: string;
  private apiKey: string;

  constructor(server: string, apiKey: string) {
    this.server = server.replace(/\/$/, ''); // Remove trailing slash
    this.apiKey = apiKey;
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${this.server}${endpoint}`;
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      'X-Arvai-API-Key': this.apiKey,
      ...options.headers,
    };

    const response = await fetch(url, {
      ...options,
      headers,
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ detail: response.statusText }));
      throw new ApiError(response.status, error.detail || 'Request failed');
    }

    return response.json();
  }

  /**
   * Verify connection by calling health endpoint
   */
  async verifyConnection(): Promise<boolean> {
    try {
      const response = await fetch(`${this.server}/health`);
      return response.ok;
    } catch {
      return false;
    }
  }

  /**
   * Verify API key is valid
   */
  async verifyApiKey(): Promise<boolean> {
    try {
      await this.request<BookmarkCheck>('/api/bookmarks/check?url=https://example.com');
      return true;
    } catch (error) {
      if (error instanceof ApiError && error.status === 401) {
        return false;
      }
      // Other errors (network, etc.) - assume key might be valid
      throw error;
    }
  }

  /**
   * Check if a URL is already bookmarked
   */
  async checkBookmark(url: string): Promise<BookmarkCheck> {
    const encodedUrl = encodeURIComponent(url);
    return this.request<BookmarkCheck>(`/api/bookmarks/check?url=${encodedUrl}`);
  }

  /**
   * Create a new bookmark
   */
  async createBookmark(data: BookmarkCreate): Promise<Bookmark> {
    return this.request<Bookmark>('/api/bookmarks', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  /**
   * Delete a bookmark by ID
   */
  async deleteBookmark(id: number): Promise<void> {
    await this.request(`/api/bookmarks/${id}`, {
      method: 'DELETE',
    });
  }

  /**
   * Get a bookmark by ID
   */
  async getBookmark(id: number): Promise<Bookmark> {
    return this.request<Bookmark>(`/api/bookmarks/${id}`);
  }
}

/**
 * Custom error class for API errors
 */
export class ApiError extends Error {
  status: number;

  constructor(status: number, message: string) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
  }
}

/**
 * Create an API client from stored connection config
 */
export function createApiClient(server: string, apiKey: string): ArvaiApi {
  return new ArvaiApi(server, apiKey);
}

/**
 * Chrome storage wrapper for connection config
 */

import type { ConnectionConfig } from '../types';

const STORAGE_KEY = 'arvai_connection';

/**
 * Get connection config from chrome.storage.local
 */
export async function getConnection(): Promise<ConnectionConfig | null> {
  return new Promise((resolve) => {
    chrome.storage.local.get([STORAGE_KEY], (result) => {
      const config = result[STORAGE_KEY] as ConnectionConfig | undefined;
      resolve(config ?? null);
    });
  });
}

/**
 * Save connection config to chrome.storage.local
 */
export async function saveConnection(config: ConnectionConfig): Promise<void> {
  return new Promise((resolve) => {
    chrome.storage.local.set({ [STORAGE_KEY]: config }, () => {
      resolve();
    });
  });
}

/**
 * Clear connection config from chrome.storage.local
 */
export async function clearConnection(): Promise<void> {
  return new Promise((resolve) => {
    chrome.storage.local.remove([STORAGE_KEY], () => {
      resolve();
    });
  });
}

/**
 * Update partial connection config
 */
export async function updateConnection(
  updates: Partial<ConnectionConfig>
): Promise<ConnectionConfig | null> {
  const current = await getConnection();
  if (!current) return null;

  const updated = { ...current, ...updates };
  await saveConnection(updated);
  return updated;
}

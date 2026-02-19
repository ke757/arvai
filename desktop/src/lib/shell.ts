import { open } from '@tauri-apps/plugin-shell'

declare global {
  interface Window {
    __TAURI_INTERNALS__?: unknown
  }
}

export function isTauri(): boolean {
  return typeof window !== 'undefined' && !!window.__TAURI_INTERNALS__
}

export async function openUrl(url: string): Promise<void> {
  if (isTauri()) {
    await open(url)
  } else {
    window.open(url, '_blank', 'noopener,noreferrer')
  }
}

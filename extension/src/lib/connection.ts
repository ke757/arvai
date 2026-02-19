/**
 * Connection URL parser
 * 
 * Format: http://127.0.0.1:8731/?key=arvai_xxx
 */

export interface ParsedConnection {
  server: string;
  key: string;
}

/**
 * Parse a connection URL into server and key components
 * 
 * @param url - Connection URL like "http://127.0.0.1:8731/?key=arvai_xxx"
 * @returns Parsed connection or null if invalid
 */
export function parseConnectionUrl(url: string): ParsedConnection | null {
  try {
    const parsed = new URL(url);
    const key = parsed.searchParams.get('key');

    if (!key || !key.startsWith('arvai_')) {
      return null;
    }

    // Server is the origin (protocol + host + port)
    const server = parsed.origin;

    return { server, key };
  } catch {
    return null;
  }
}

/**
 * Check if a string is a valid connection URL
 */
export function isValidConnectionUrl(url: string): boolean {
  return parseConnectionUrl(url) !== null;
}

/**
 * Build a connection URL from server and key
 */
export function buildConnectionUrl(server: string, key: string): string {
  const url = new URL(server);
  url.searchParams.set('key', key);
  return url.toString();
}

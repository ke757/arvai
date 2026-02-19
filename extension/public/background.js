/**
 * Arvai Extension Service Worker (Background Script)
 * 
 * Responsibilities:
 * 1. Listen to tab updates and check bookmark status
 * 2. Update extension icon based on bookmark state
 * 3. Handle messages from popup and content scripts
 */

const STORAGE_KEY = 'arvai_connection';

// Icon paths
const ICONS = {
  default: {
    16: 'icons/icon-16.png',
    32: 'icons/icon-32.png',
  },
  bookmarked: {
    16: 'icons/bookmarked-16.png',
    32: 'icons/bookmarked-32.png',
  },
};

// Cache for bookmark status (url -> { bookmarked, timestamp })
const statusCache = new Map();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

/**
 * Get connection config from storage
 */
async function getConnection() {
  return new Promise((resolve) => {
    chrome.storage.local.get([STORAGE_KEY], (result) => {
      resolve(result[STORAGE_KEY] || null);
    });
  });
}

/**
 * Check if URL is bookmarked via API
 */
async function checkBookmarkStatus(url) {
  const connection = await getConnection();
  if (!connection || !connection.connected) {
    return { bookmarked: false, connected: false };
  }

  // Check cache first
  const cached = statusCache.get(url);
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    return { ...cached, connected: true };
  }

  try {
    const response = await fetch(
      `${connection.server}/api/bookmarks/check?url=${encodeURIComponent(url)}`,
      {
        headers: {
          'X-Arvai-API-Key': connection.apiKey,
        },
      }
    );

    if (!response.ok) {
      throw new Error('API request failed');
    }

    const data = await response.json();
    const status = {
      bookmarked: data.bookmarked,
      bookmarkId: data.bookmark_id,
      createdAt: data.created_at,
      timestamp: Date.now(),
    };

    // Update cache
    statusCache.set(url, status);

    return { ...status, connected: true };
  } catch (error) {
    console.error('Failed to check bookmark status:', error);
    return { bookmarked: false, connected: true, error: error.message };
  }
}

/**
 * Update extension icon for a tab
 */
async function updateIcon(tabId, url) {
  // Skip non-http URLs
  if (!url || (!url.startsWith('http://') && !url.startsWith('https://'))) {
    await chrome.action.setIcon({ tabId, path: ICONS.default });
    await chrome.action.setTitle({ tabId, title: 'Arvai' });
    return;
  }

  const connection = await getConnection();
  if (!connection || !connection.connected) {
    await chrome.action.setIcon({ tabId, path: ICONS.default });
    await chrome.action.setTitle({ tabId, title: '连接到 Arvai' });
    return;
  }

  const status = await checkBookmarkStatus(url);

  if (status.bookmarked) {
    await chrome.action.setIcon({ tabId, path: ICONS.bookmarked });
    await chrome.action.setTitle({ tabId, title: '已保存到 Arvai' });
  } else {
    await chrome.action.setIcon({ tabId, path: ICONS.default });
    await chrome.action.setTitle({ tabId, title: '添加到 Arvai' });
  }
}

/**
 * Create a bookmark via API
 */
async function createBookmark(data) {
  const connection = await getConnection();
  if (!connection || !connection.connected) {
    throw new Error('Not connected');
  }

  const response = await fetch(`${connection.server}/api/bookmarks`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Arvai-API-Key': connection.apiKey,
    },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.detail || 'Failed to create bookmark');
  }

  const bookmark = await response.json();

  // Update cache
  statusCache.set(data.url, {
    bookmarked: true,
    bookmarkId: bookmark.id,
    createdAt: bookmark.created_at,
    timestamp: Date.now(),
  });

  return bookmark;
}

/**
 * Delete a bookmark via API
 */
async function deleteBookmark(bookmarkId, url) {
  const connection = await getConnection();
  if (!connection || !connection.connected) {
    throw new Error('Not connected');
  }

  const response = await fetch(`${connection.server}/api/bookmarks/${bookmarkId}`, {
    method: 'DELETE',
    headers: {
      'X-Arvai-API-Key': connection.apiKey,
    },
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.detail || 'Failed to delete bookmark');
  }

  // Update cache
  if (url) {
    statusCache.set(url, {
      bookmarked: false,
      timestamp: Date.now(),
    });
  }
}

// Listen for tab updates
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (changeInfo.status === 'complete' && tab.url) {
    updateIcon(tabId, tab.url);
  }
});

// Listen for tab activation
chrome.tabs.onActivated.addListener(async (activeInfo) => {
  const tab = await chrome.tabs.get(activeInfo.tabId);
  if (tab.url) {
    updateIcon(activeInfo.tabId, tab.url);
  }
});

// Handle messages from popup and content scripts
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  (async () => {
    try {
      switch (message.type) {
        case 'CHECK_STATUS': {
          const status = await checkBookmarkStatus(message.url);
          sendResponse(status);
          break;
        }

        case 'ADD_BOOKMARK': {
          const bookmark = await createBookmark(message.data);
          // Update icon for current tab
          const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
          if (tab && tab.id) {
            await updateIcon(tab.id, message.data.url);
          }
          sendResponse({ success: true, bookmark });
          break;
        }

        case 'REMOVE_BOOKMARK': {
          await deleteBookmark(message.bookmarkId, message.url);
          // Update icon for current tab
          const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
          if (tab && tab.id) {
            await updateIcon(tab.id, message.url);
          }
          sendResponse({ success: true });
          break;
        }

        case 'CONNECTION_CHANGED': {
          // Clear cache and update current tab icon
          statusCache.clear();
          const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
          if (tab && tab.id && tab.url) {
            await updateIcon(tab.id, tab.url);
          }
          sendResponse({ success: true });
          break;
        }

        case 'GET_PAGE_DATA': {
          // Forward to content script
          const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
          if (tab && tab.id) {
            const response = await chrome.tabs.sendMessage(tab.id, { type: 'GET_PAGE_DATA' });
            sendResponse(response);
          } else {
            sendResponse({ error: 'No active tab' });
          }
          break;
        }

        default:
          sendResponse({ error: 'Unknown message type' });
      }
    } catch (error) {
      console.error('Message handler error:', error);
      sendResponse({ error: error.message });
    }
  })();

  // Return true to indicate async response
  return true;
});

// Initialize on install
chrome.runtime.onInstalled.addListener(() => {
  console.log('Arvai extension installed');
});

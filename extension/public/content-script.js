/**
 * Arvai Extension Content Script
 * 
 * Extracts page metadata for bookmarking
 */

/**
 * Extract page metadata
 */
function extractPageMetadata() {
  // Get title - prefer og:title, fallback to document.title
  const ogTitle = document.querySelector('meta[property="og:title"]');
  const title = ogTitle?.getAttribute('content') || document.title || '';

  // Get description - prefer og:description, fallback to meta description
  const ogDesc = document.querySelector('meta[property="og:description"]');
  const metaDesc = document.querySelector('meta[name="description"]');
  const description = ogDesc?.getAttribute('content') || metaDesc?.getAttribute('content') || '';

  // Get favicon
  let favicon = '';
  const iconLink = document.querySelector('link[rel="icon"]') ||
    document.querySelector('link[rel="shortcut icon"]') ||
    document.querySelector('link[rel="apple-touch-icon"]');

  if (iconLink) {
    const href = iconLink.getAttribute('href');
    if (href) {
      // Convert relative URL to absolute
      favicon = new URL(href, window.location.origin).href;
    }
  }

  // Fallback to default favicon location
  if (!favicon) {
    favicon = `${window.location.origin}/favicon.ico`;
  }

  return {
    url: window.location.href,
    title: title.trim(),
    description: description.trim(),
    favicon,
  };
}

// Listen for messages from background script
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === 'GET_PAGE_DATA') {
    const metadata = extractPageMetadata();
    sendResponse(metadata);
  }
  return true;
});

/**
 * Arvai Extension Content Script
 * 
 * Extracts page metadata for bookmarking
 */
import { Readability } from 'https://cdn.jsdelivr.net/npm/@mozilla/readability@0.5.0/Readability.js';


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

// TODO: 对于 SPA (单页应用)，可能需要等待特定网络请求完成后再提取
/**
 * Extract page content
 */
function extractPageContent() {
  // 1. 克隆整个 document，避免污染当前页面
  const documentClone = document.cloneNode(true);

  // 2. (可选) 预处理：移除明显的噪声节点，提高提取准确率
  // 例如移除广告容器、导航栏等（根据具体网站调整选择器）
  const noiseSelectors = ['header', 'footer', 'nav', '.ad-container', '.sidebar'];
  noiseSelectors.forEach(selector => {
    documentClone.querySelectorAll(selector).forEach(el => el.remove());
  });

  // 3. 实例化并解析
  // Readability 需要传入 document 对象
  const reader = new Readability(documentClone);
  const article = reader.parse();

  if (!article) {
    console.warn('Readability 无法提取该内容，可能是非文章页。');
    return null;
  }

  return article;
}

// Listen for messages from background script
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === 'GET_PAGE_DATA') {
    const metadata = extractPageContent();
    sendResponse(metadata);
  }
  return true;
});

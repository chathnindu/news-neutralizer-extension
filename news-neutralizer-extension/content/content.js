/**
 * ============================================
 * Content Script - content/content.js
 * ============================================
 * 
 * Runs on every web page to extract article content.
 * This script is injected into the page by Chrome and
 * responds to messages from the popup/background.
 * 
 * Extraction strategy:
 * 1. Try common article selectors (article, main, etc.)
 * 2. Look for semantic markup (itemprop, role)
 * 3. Fall back to body text if needed
 */

(function () {
  'use strict';

  // ============================================
  // Configuration
  // ============================================

  /**
   * CSS selectors to try for finding article content
   * Ordered by specificity - more specific first
   */
  const CONTENT_SELECTORS = [
    // Semantic article selectors
    'article',
    '[role="article"]',
    '[itemprop="articleBody"]',

    // Common class names used by news sites
    '.article-body',
    '.article-content',
    '.post-content',
    '.entry-content',
    '.story-body',
    '.content-body',

    // Generic but often correct
    'main',
    '[role="main"]',
    '.content'
  ];

  /**
   * Minimum content length to be considered a valid article
   */
  const MIN_CONTENT_LENGTH = 200;

  /**
   * Maximum content length to send (prevent huge payloads)
   */
  const MAX_CONTENT_LENGTH = 15000;

  // ============================================
  // Extraction Functions
  // ============================================

  /**
   * Get the source domain from current URL
   * @returns {string} - Clean domain name (e.g., "bbc.com")
   */
  function getSource() {
    try {
      const hostname = new URL(window.location.href).hostname;
      // Remove 'www.' prefix if present
      return hostname.replace(/^www\./, '');
    } catch {
      return 'unknown';
    }
  }

  /**
   * Extract the page title
   * Tries meta tags first, then falls back to document.title
   * @returns {string}
   */
  function getTitle() {
    // Try Open Graph title first (usually cleaner)
    const ogTitle = document.querySelector('meta[property="og:title"]');
    if (ogTitle?.content) {
      return ogTitle.content.trim();
    }

    // Try article headline
    const headline = document.querySelector('h1');
    if (headline?.textContent?.length > 10) {
      return headline.textContent.trim();
    }

    // Fall back to document title
    return document.title || 'Untitled';
  }

  /**
   * Extract the main article content
   * Tries multiple selectors until finding substantial content
   * @returns {string}
   */
  function getContent() {
    // Try each selector in order
    for (const selector of CONTENT_SELECTORS) {
      const element = document.querySelector(selector);
      if (element) {
        const text = extractText(element);
        // Only return if we got substantial content
        if (text.length >= MIN_CONTENT_LENGTH) {
          console.log(`📄 Found content using: ${selector}`);
          return text.slice(0, MAX_CONTENT_LENGTH);
        }
      }
    }

    // Fallback: Use body text
    console.log('📄 Using body fallback');
    const bodyText = extractText(document.body);
    return bodyText.slice(0, MAX_CONTENT_LENGTH);
  }

  /**
   * Extract clean text from an element
   * Removes unwanted elements and cleans whitespace
   * @param {Element} element 
   * @returns {string}
   */
  function extractText(element) {
    // Clone to avoid modifying the page
    const clone = element.cloneNode(true);

    // Remove elements that don't contain article content
    const unwantedSelectors = [
      'script', 'style', 'nav', 'header', 'footer',
      'aside', '.sidebar', '.comments', '.related',
      '.advertisement', '.ad', '[role="navigation"]',
      '.social-share', '.newsletter', 'form'
    ];

    unwantedSelectors.forEach(sel => {
      clone.querySelectorAll(sel).forEach(el => el.remove());
    });

    // Get text and clean it up
    let text = clone.innerText || clone.textContent || '';

    // Normalize whitespace
    text = text
      .replace(/\s+/g, ' ')     // Multiple spaces -> single space
      .replace(/\n\s*\n/g, '\n') // Multiple newlines -> single
      .trim();

    return text;
  }

  /**
   * Check if this page looks like a news article
   * Uses simple heuristics
   * @param {string} content - Already extracted content
   * @returns {boolean}
   */
  function isNewsArticle(content) {
    // Check for article-related meta tags
    const hasArticleType = !!document.querySelector(
      'meta[property="og:type"][content="article"]'
    );

    // Check for article element
    const hasArticleElement = !!document.querySelector('article');

    // Check URL patterns (common for news sites)
    const url = window.location.href.toLowerCase();
    const newsUrlPatterns = [
      '/article/', '/news/', '/story/', '/post/',
      '/blog/', '/opinion/', '/analysis/'
    ];
    const hasNewsUrl = newsUrlPatterns.some(p => url.includes(p));

    // Check content length
    const hasSubstantialContent = content.length >= MIN_CONTENT_LENGTH;

    return hasSubstantialContent && (hasArticleType || hasArticleElement || hasNewsUrl);
  }

  /**
   * Main extraction function
   * Returns all article data in a clean format
   * @returns {object}
   */
  function extractArticle() {
    const content = getContent();
    return {
      url: window.location.href,
      title: getTitle(),
      content: content,
      source: getSource(),
      isNews: isNewsArticle(content),
      extractedAt: Date.now()
    };
  }

  // ============================================
  // Message Listener
  // ============================================

  /**
   * Listen for messages from popup or background script
   * Responds with extracted article data when requested
   */
  chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    // Handle article extraction request
    if (message.type === 'GET_ARTICLE') {
      console.log('📰 News Neutralizer: Extracting article...');

      try {
        const article = extractArticle();
        console.log(`📰 Extracted: "${article.title}" (${article.content.length} chars)`);
        sendResponse({ ok: true, article });
      } catch (error) {
        console.error('📰 Extraction failed:', error);
        sendResponse({ ok: false, error: error.message });
      }

      return true; // Keep message channel open for async response
    }

    // Handle quick check for news article
    if (message.type === 'IS_NEWS') {
      const content = getContent();
      sendResponse({ isNews: isNewsArticle(content) });
      return true;
    }

    // Handle ping from popup to check if script is loaded
    if (message.type === 'PING') {
      sendResponse({ ok: true });
      return true;
    }
  });

  // Log that content script is loaded (helps with debugging)
  console.log('📰 News Neutralizer content script loaded');

})();

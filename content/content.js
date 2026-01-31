/**
 * Content Script - Runs in the context of web pages
 * Responsible for scraping page content and responding to background script requests
 */

// Listen for messages from background script
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  console.log('Content script received message:', message);

  if (message.type === 'SCRAPE_PAGE') {
    handleScrapePage(sendResponse);
    return true; // Keep channel open for async response
  }

  return false;
});

/**
 * Handle page scraping request
 * Extracts title, text content, and URL from the current page
 */
async function handleScrapePage(sendResponse) {
  try {
    // Extract page title
    const title = document.title || '';

    // Extract main text content
    const text = extractMainText();

    // Get page URL
    const url = window.location.href;

    console.log('Page scraped:', { title, textLength: text.length, url });

    sendResponse({
      success: true,
      data: { title, text, url }
    });
  } catch (error) {
    console.error('Error scraping page:', error);
    sendResponse({
      success: false,
      error: error.message
    });
  }
}

/**
 * Extract main text content from the page
 * Uses various heuristics to find the main article content
 */
function extractMainText() {
  // Try to find main content using common article selectors
  const articleSelectors = [
    'article',
    '[role="main"]',
    'main',
    '.article-content',
    '.post-content',
    '.entry-content',
    '#content',
    '.content'
  ];

  let mainElement = null;

  // Try each selector until we find content
  for (const selector of articleSelectors) {
    const element = document.querySelector(selector);
    if (element && element.innerText && element.innerText.length > 100) {
      mainElement = element;
      break;
    }
  }

  // If no main element found, fall back to body
  if (!mainElement) {
    mainElement = document.body;
  }

  // Extract text content, removing script and style elements
  const clone = mainElement.cloneNode(true);

  // Remove unwanted elements
  const unwantedSelectors = ['script', 'style', 'nav', 'header', 'footer', 'aside', '.ad', '.advertisement'];
  unwantedSelectors.forEach(selector => {
    clone.querySelectorAll(selector).forEach(el => el.remove());
  });

  // Get text content and clean it up
  let text = clone.innerText || clone.textContent || '';

  // Clean up whitespace
  text = text
    .replace(/\s+/g, ' ') // Replace multiple spaces with single space
    .replace(/\n+/g, '\n') // Replace multiple newlines with single newline
    .trim();

  return text;
}

console.log('News Neutralizer content script loaded');

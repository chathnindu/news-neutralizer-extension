/**
 * content/content.js
 * Page scraper: extracts title + main article text from current page; sends to background on request.
 */
(function () {
  function getSource() {
    try {
      return new URL(window.location.href).hostname.replace(/^www\./, '');
    } catch {
      return 'unknown';
    }
  }

  function extractArticle() {
    const title = document.title || '';
    const selectors = [
      'article',
      'main',
      '[role="main"]',
      '.post-content',
      '.article-body',
      '.entry-content',
      '.content',
      '.story-body',
      '[itemprop="articleBody"]',
    ];
    let content = '';
    for (const sel of selectors) {
      const el = document.querySelector(sel);
      if (el) {
        content = (el.innerText || el.textContent || '').trim();
        if (content.length > 200) break;
      }
    }
    if (!content) content = (document.body?.innerText || '').trim();
    const maxLength = 15000;
    return {
      url: window.location.href,
      title,
      content: content.slice(0, maxLength),
      source: getSource(),
    };
  }

  chrome.runtime.onMessage.addListener((msg, _sender, sendResponse) => {
    if (msg.type === 'GET_PAGE_ARTICLE') {
      try {
        sendResponse(extractArticle());
      } catch (e) {
        sendResponse({ error: e.message });
      }
    }
  });
})();

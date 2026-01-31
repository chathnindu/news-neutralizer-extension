// Content script for News Neutralizer Extension
// Handles page scraping when requested by the background service worker

// Listen for messages from background script
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === 'SCRAPE_PAGE') {
    try {
      // Get page URL
      const url = window.location.href;
      
      // Get page title
      const title = document.title || '';
      
      // Try to extract site name from meta tags
      let siteName = '';
      const ogSiteName = document.querySelector('meta[property="og:site_name"]');
      if (ogSiteName) {
        siteName = ogSiteName.content;
      } else {
        // Fallback to hostname
        try {
          const urlObj = new URL(url);
          siteName = urlObj.hostname.replace(/^www\./, '');
        } catch (e) {
          siteName = '';
        }
      }
      
      // Extract main text content
      let text = '';
      
      // Try to find article element first
      const article = document.querySelector('article');
      if (article) {
        text = article.innerText || '';
      } else {
        // Fallback: try common content selectors
        const contentSelectors = [
          'main',
          '[role="main"]',
          '.article-content',
          '.post-content',
          '.entry-content',
          '.content'
        ];
        
        for (const selector of contentSelectors) {
          const element = document.querySelector(selector);
          if (element) {
            text = element.innerText || '';
            if (text.length > 100) {
              break;
            }
          }
        }
        
        // Final fallback to body
        if (!text || text.length < 100) {
          text = document.body.innerText || '';
        }
      }
      
      // Clean and trim text
      text = text
        .replace(/\s+/g, ' ')
        .trim()
        .slice(0, 5000); // Limit to 5000 characters
      
      // Send response
      sendResponse({
        ok: true,
        payload: {
          url,
          title,
          text,
          siteName
        }
      });
      
    } catch (error) {
      console.error('Error scraping page:', error);
      sendResponse({
        ok: false,
        error: error.message
      });
    }
    
    return false; // Synchronous response
  }
});

console.log('News Neutralizer content script loaded');

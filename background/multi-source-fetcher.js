// Multi-source article fetcher
import { searchRelatedArticles } from './news-api-handler.js';

/**
 * Find related articles based on keywords
 * @param {Object} options
 * @param {string[]} options.keywords - Array of keywords to search for
 * @param {string} options.originalUrl - URL of the original article to filter out
 * @param {number} options.limit - Maximum number of articles to return
 * @returns {Promise<Array>} Array of related articles
 */
export async function findRelatedArticles({ keywords, originalUrl, limit = 10 }) {
  try {
    // Create search query from keywords
    const query = keywords.slice(0, 5).join(' ');
    
    // Get articles from news API
    const articles = await searchRelatedArticles({ query, limit: limit * 2 });
    
    // Extract domain from original URL
    let originalDomain;
    try {
      const url = new URL(originalUrl);
      originalDomain = url.hostname.replace(/^www\./, '');
    } catch (error) {
      console.error('Invalid original URL:', error);
      originalDomain = '';
    }
    
    // Deduplicate by URL and filter out same domain
    const seen = new Set();
    const filtered = [];
    
    for (const article of articles) {
      if (!article.url || seen.has(article.url)) {
        continue;
      }
      
      // Filter out articles from the same domain
      try {
        const articleUrl = new URL(article.url);
        const articleDomain = articleUrl.hostname.replace(/^www\./, '');
        
        if (articleDomain === originalDomain) {
          continue;
        }
      } catch (error) {
        console.error('Invalid article URL:', error);
        continue;
      }
      
      seen.add(article.url);
      filtered.push(article);
      
      if (filtered.length >= limit) {
        break;
      }
    }
    
    return filtered;
    
  } catch (error) {
    console.error('Error finding related articles:', error);
    return [];
  }
}

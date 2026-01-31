/**
 * Multi-source fetcher for finding related articles from various news sources
 */

import { searchRelatedArticles } from './news-api-handler.js';

/**
 * Find related articles based on keywords
 * @param {Object} params - Search parameters
 * @param {string[]} params.keywords - Keywords to search for
 * @param {string} params.originalUrl - URL of the original article (to filter out)
 * @param {number} params.limit - Maximum number of articles to return
 * @returns {Promise<Array>} Array of related articles
 */
export async function findRelatedArticles({ keywords, originalUrl, limit = 5 }) {
  try {
    // Build search query from keywords
    const query = keywords.join(' ');
    
    console.log('Searching for related articles with query:', query);
    
    // Call news API handler
    const articles = await searchRelatedArticles({ query, limit: limit * 2 }); // Request more to account for filtering
    
    // Extract domain from original URL for filtering
    const originalDomain = extractDomain(originalUrl);
    
    // Filter duplicates and same domain
    const uniqueArticles = [];
    const seenUrls = new Set();
    
    for (const article of articles) {
      const articleUrl = article.url;
      const articleDomain = extractDomain(articleUrl);
      
      // Skip if duplicate URL
      if (seenUrls.has(articleUrl)) {
        continue;
      }
      
      // Skip if same domain as original
      if (originalDomain && articleDomain === originalDomain) {
        console.log('Filtering out same domain:', articleDomain);
        continue;
      }
      
      seenUrls.add(articleUrl);
      uniqueArticles.push(article);
      
      // Stop if we have enough articles
      if (uniqueArticles.length >= limit) {
        break;
      }
    }
    
    console.log(`Found ${uniqueArticles.length} unique related articles`);
    return uniqueArticles;
  } catch (error) {
    console.error('Error finding related articles:', error);
    // Return empty array instead of throwing, so pipeline can continue
    return [];
  }
}

/**
 * Extract domain from URL
 * @param {string} url - Full URL
 * @returns {string|null} Domain or null if invalid
 */
function extractDomain(url) {
  if (!url) return null;
  
  try {
    const urlObj = new URL(url);
    return urlObj.hostname.toLowerCase().replace(/^www\./, '');
  } catch (error) {
    console.error('Invalid URL:', url);
    return null;
  }
}

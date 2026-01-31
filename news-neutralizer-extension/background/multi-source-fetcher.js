/**
 * background/multi-source-fetcher.js
 * Take News API results and return top 3–5 normalized articles (no CORS scrape; use API data only).
 */

const MAX_SOURCES = 5;
const MIN_SOURCES = 2;

const multiSourceFetcher = {
  /**
   * Normalize News API items to { url, title, content, source } and limit count.
   * Uses description/content from API (no cross-origin scraping).
   * @param {Array<{ url: string, title: string, description: string, content?: string, source: string }>} apiArticles
   * @param {number} max
   * @returns {Array<{ url: string, title: string, content: string, source: string }>}
   */
  normalizeAndLimit(apiArticles, max = MAX_SOURCES) {
    if (!Array.isArray(apiArticles)) return [];
    return apiArticles.slice(0, max).map((a) => ({
      url: a.url,
      title: a.title || '',
      content: (a.content || a.description || '').trim().slice(0, 8000),
      source: a.source || new URL(a.url).hostname,
    }));
  },

  /**
   * Get top 3–5 related articles from News API results for use in analysis.
   * @param {Array} apiArticles - Raw results from newsApiHandler.search()
   * @returns {Array<{ url: string, title: string, content: string, source: string }>}
   */
  getTopSources(apiArticles) {
    return this.normalizeAndLimit(apiArticles, MAX_SOURCES);
  },

  getMaxSources() {
    return MAX_SOURCES;
  },
  getMinSources() {
    return MIN_SOURCES;
  },
};

export { multiSourceFetcher };

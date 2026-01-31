/**
 * background/news-api-handler.js
 * Search for related articles via NewsAPI.org (v2 everything).
 */

const NEWS_API_KEY = '7b7deb9282ce41b8a7f1f8d2eaf48789';
const NEWS_API_BASE = 'https://newsapi.org/v2/everything';
const MAX_RESULTS = 10;
const PAGE_SIZE = 10;

const newsApiHandler = {
  /**
   * Search News API for articles matching the query.
   * @param {string} query - Search query (topic or keywords)
   * @param {object} options - { pageSize, excludeUrl }
   * @returns {Promise<Array<{ url: string, title: string, description: string, content?: string, source: string, publishedAt: string }>>}
   */
  async search(query, options = {}) {
    const pageSize = Math.min(options.pageSize || PAGE_SIZE, 20);
    const excludeUrl = options.excludeUrl || '';
    const params = new URLSearchParams({
      q: query.slice(0, 500),
      apiKey: NEWS_API_KEY,
      pageSize: String(pageSize),
      sortBy: 'relevancy',
      language: 'en',
    });
    const url = `${NEWS_API_BASE}?${params.toString()}`;
    try {
      const res = await fetch(url);
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.message || `News API error: ${res.status}`);
      }
      const data = await res.json();
      const articles = (data.articles || [])
        .filter((a) => a.url && a.title && a.url !== excludeUrl)
        .map((a) => ({
          url: a.url,
          title: a.title,
          description: a.description || '',
          content: a.content || a.description || '',
          source: (a.source && a.source.name) || new URL(a.url).hostname,
          publishedAt: a.publishedAt || '',
        }));
      return articles;
    } catch (e) {
      console.error('News API search failed:', e);
      return [];
    }
  },
};

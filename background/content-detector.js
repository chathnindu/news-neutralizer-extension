/**
 * background/content-detector.js
 * Auto-detect if page is a news article and extract main topic/keywords for related-article search.
 */

const contentDetector = {
  /** Minimum content length to consider as news article */
  MIN_CONTENT_LENGTH: 200,

  /** Stop words for keyword extraction */
  STOP_WORDS: new Set([
    'the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of',
    'with', 'by', 'from', 'as', 'is', 'was', 'are', 'been', 'be', 'have', 'has',
    'had', 'do', 'does', 'did', 'will', 'would', 'should', 'could', 'may', 'might',
    'must', 'can', 'this', 'that', 'these', 'those', 'it', 'its', 'they', 'them',
  ]),

  /**
   * Determine if the extracted data looks like a news article.
   * @param {{ url: string, title: string, content: string, source: string }} article
   * @returns {boolean}
   */
  isNewsArticle(article) {
    if (!article || !article.content) return false;
    if (article.content.length < this.MIN_CONTENT_LENGTH) return false;
    if (!article.title || article.title.length < 10) return false;
    return true;
  },

  /**
   * Extract main topic (for search query). Uses title + first sentence.
   * @param {{ title: string, content: string }} article
   * @returns {string}
   */
  extractMainTopic(article) {
    const title = (article.title || '').trim();
    const firstPart = (article.content || '').slice(0, 300).trim();
    const combined = `${title} ${firstPart}`.replace(/\s+/g, ' ').trim();
    return combined.slice(0, 200);
  },

  /**
   * Extract top keywords for search (word frequency, no stop words).
   * @param {string} content
   * @param {number} maxKeywords
   * @returns {string[]}
   */
  extractKeywords(content, maxKeywords = 10) {
    if (!content) return [];
    const words = content
      .toLowerCase()
      .replace(/[^\w\s]/g, ' ')
      .split(/\s+/)
      .filter((w) => w.length > 2 && !this.STOP_WORDS.has(w));
    const freq = {};
    words.forEach((w) => { freq[w] = (freq[w] || 0) + 1; });
    return Object.entries(freq)
      .sort((a, b) => b[1] - a[1])
      .slice(0, maxKeywords)
      .map(([word]) => word);
  },

  /**
   * Full detection: is news + main topic + keywords.
   * @param {{ url: string, title: string, content: string, source: string }} article
   * @returns {{ isNews: boolean, mainTopic: string, keywords: string[] }}
   */
  detect(article) {
    const isNews = this.isNewsArticle(article);
    const mainTopic = this.extractMainTopic(article);
    const keywords = this.extractKeywords(article.content || '', 10);
    return { isNews, mainTopic, keywords };
  },
};

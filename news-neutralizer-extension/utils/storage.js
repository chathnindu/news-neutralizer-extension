class StorageManager {
    constructor() {
      this.CACHE_DURATION = 60 * 60 * 1000;
    }
  
    /**
     * Article analysis results cache කරනවා
     * @param {string} articleUrl - Article එකේ URL
     * @param {object} analysisData - Analysis results
     */
    async cacheAnalysis(articleUrl, analysisData) {
      const cacheKey = `analysis_${this.hashUrl(articleUrl)}`;
      const cacheData = {
        data: analysisData,
        timestamp: Date.now(),
        url: articleUrl
      };
  
      await chrome.storage.local.set({ [cacheKey]: cacheData });
      console.log(`✅ Cached analysis for: ${articleUrl}`);
    }
  
    /**
     * Cache එකෙන් analysis එක ගන්නවා
     * @param {string} articleUrl
     * @returns {object|null} - Cache එකේ තිබ්බොත් data, නැත්නම් null
     */
    async getCachedAnalysis(articleUrl) {
      const cacheKey = `analysis_${this.hashUrl(articleUrl)}`;
      const result = await chrome.storage.local.get([cacheKey]);
      
      if (!result[cacheKey]) {
        return null; // Cache එකේ නෑ
      }
  
      const cached = result[cacheKey];
      const age = Date.now() - cached.timestamp;
  
      // Cache එක පරණද බලනවා
      if (age > this.CACHE_DURATION) {
        console.log(`⏰ Cache expired for: ${articleUrl}`);
        await this.clearCache(articleUrl);
        return null;
      }
  
      console.log(`✅ Cache hit for: ${articleUrl}`);
      return cached.data;
    }
  
    /**
     * Specific article එකක cache clear කරනවා
     */
    async clearCache(articleUrl) {
      const cacheKey = `analysis_${this.hashUrl(articleUrl)}`;
      await chrome.storage.local.remove([cacheKey]);
    }
  
    /**
     * සියලු cache එක clear කරනවා
     */
    async clearAllCache() {
      const allData = await chrome.storage.local.get(null);
      const cacheKeys = Object.keys(allData).filter(key => key.startsWith('analysis_'));
      
      if (cacheKeys.length > 0) {
        await chrome.storage.local.remove(cacheKeys);
        console.log(`🗑️ Cleared ${cacheKeys.length} cached analyses`);
      }
    }
  
    /**
     * Related articles list save කරනවා
     */
    async saveRelatedArticles(mainArticleUrl, relatedArticles) {
      const key = `related_${this.hashUrl(mainArticleUrl)}`;
      await chrome.storage.local.set({
        [key]: {
          articles: relatedArticles,
          timestamp: Date.now()
        }
      });
    }
  
    /**
     * Related articles list load කරනවා
     */
    async getRelatedArticles(mainArticleUrl) {
      const key = `related_${this.hashUrl(mainArticleUrl)}`;
      const result = await chrome.storage.local.get([key]);
      
      if (!result[key]) return null;
  
      const age = Date.now() - result[key].timestamp;
      if (age > this.CACHE_DURATION) {
        await chrome.storage.local.remove([key]);
        return null;
      }
  
      return result[key].articles;
    }
  
    /**
     * User preferences save කරනවා
     */
    async savePreferences(preferences) {
      await chrome.storage.sync.set({ userPreferences: preferences });
      console.log("💾 Saved user preferences");
    }
  
    /**
     * User preferences load කරනවා
     */
    async getPreferences() {
      const result = await chrome.storage.sync.get(['userPreferences']);
      return result.userPreferences || {
        autoDetect: true,
        showBiasScore: true,
        minSources: 3,
        preferredSources: []
      };
    }
  
    /**
     * Storage space usage check කරනවා
     */
    async getStorageStats() {
      const bytes = await chrome.storage.local.getBytesInUse();
      const mb = (bytes / (1024 * 1024)).toFixed(2);
      
      return {
        bytesUsed: bytes,
        megabytesUsed: mb,
        quota: 10 // Chrome local storage limit: 10MB
      };
    }
  
    /**
     * URL එකක් hash කරනවා (cache key එකක් හදන්න)
     * Simple hash function - URL එක කෙටි ID එකක් කරනවා
     */
    hashUrl(url) {
      let hash = 0;
      for (let i = 0; i < url.length; i++) {
        const char = url.charCodeAt(i);
        hash = ((hash << 5) - hash) + char;
        hash = hash & hash; // Convert to 32-bit integer
      }
      return Math.abs(hash).toString(36);
    }
  
    /**
     * Analysis history save කරනවා (user ට past analyses බලන්න)
     */
    async addToHistory(articleUrl, analysisData) {
      const history = await this.getHistory();
      
      history.unshift({
        url: articleUrl,
        title: analysisData.title || "Unknown Article",
        timestamp: Date.now(),
        biasScore: analysisData.biasScore,
        sources: analysisData.sources?.length || 0
      });
  
      // Keep only last 50 items
      if (history.length > 50) {
        history.splice(50);
      }
  
      await chrome.storage.local.set({ analysisHistory: history });
    }
  
    /**
     * Analysis history load කරනවා
     */
    async getHistory() {
      const result = await chrome.storage.local.get(['analysisHistory']);
      return result.analysisHistory || [];
    }
  
    /**
     * History clear කරනවා
     */
    async clearHistory() {
      await chrome.storage.local.remove(['analysisHistory']);
      console.log("🗑️ Cleared analysis history");
    }
  }
  
  // Singleton instance
  const storage = new StorageManager();

  export { storage };
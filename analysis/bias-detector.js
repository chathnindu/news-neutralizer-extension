class BiasDetector {
    constructor() {
      // Bias detection criteria
      this.biasIndicators = {
        loadedWords: {
          leftLeaning: ['progressive', 'social justice', 'inequality', 'corporate greed'],
          rightLeaning: ['traditional values', 'law and order', 'free market', 'patriot'],
          emotional: ['shocking', 'outrageous', 'devastating', 'alarming', 'crisis']
        }
      };
    }
  
    /**
     * Main function - Article එකක bias detect කරනවා
     * @param {object} article - { url, title, content, source }
     * @returns {Promise<object>} - Bias analysis results
     */
    async analyzeArticle(article) {
      console.log(`🔍 Analyzing bias for: ${article.title}`);
  
      try {
        // Cache check කරනවා
        const cached = await storage.getCachedAnalysis(article.url);
        if (cached && cached.biasAnalysis) {
          console.log("📦 Using cached bias analysis");
          return cached.biasAnalysis;
        }
  
        // Claude AI එකට prompt කරනවා
        const biasAnalysis = await this.detectWithAI(article);
  
        // Quick keyword analysis එකත් add කරනවා
        const keywordAnalysis = this.analyzeKeywords(article.content);
        
        // Combine both results
        const finalResult = {
          ...biasAnalysis,
          keywordIndicators: keywordAnalysis,
          timestamp: Date.now()
        };
  
        // Cache එකේ save කරනවා
        await storage.cacheAnalysis(article.url, { biasAnalysis: finalResult });
  
        return finalResult;
  
      } catch (error) {
        console.error("Bias detection failed:", error);
        // Fallback to keyword-only analysis
        return this.getFallbackAnalysis(article);
      }
    }
  
    /**
     * Claude AI use කරලා bias detect කරනවා
     */
    async detectWithAI(article) {
      const prompt = `You are an expert media bias analyst. Analyze this news article for bias.
  
  ARTICLE DETAILS:
  Title: ${article.title}
  Source: ${article.source}
  Content: ${article.content.substring(0, 3000)} ${article.content.length > 3000 ? '...' : ''}
  
  ANALYSIS REQUIRED:
  1. Overall bias score (0.0 = completely neutral, 1.0 = extremely biased)
  2. Bias direction (left-leaning, right-leaning, neutral, sensationalist)
  3. List of loaded/emotional words used
  4. Framing techniques detected (e.g., one-sided quotes, missing context)
  5. Source credibility assessment
  6. Specific examples of bias in the text
  
  Respond in this EXACT JSON format:
  {
    "biasScore": 0.0-1.0,
    "biasDirection": "neutral|left-leaning|right-leaning|sensationalist",
    "loadedWords": ["word1", "word2"],
    "framingTechniques": [
      {
        "type": "technique name",
        "example": "specific text from article",
        "explanation": "why this is biased"
      }
    ],
    "sourceCredibility": "high|medium|low",
    "credibilityFactors": ["factor1", "factor2"],
    "overallAssessment": "brief 2-3 sentence summary",
    "recommendations": ["what's missing", "what to verify"]
  }`;
  
      // Claude API ට JSON response එකක් ඉල්ලනවා
      const response = await deepseekAPI.sendMessageJSON(prompt, 2000);
  
      return {
        biasScore: this.clampScore(response.biasScore),
        biasDirection: response.biasDirection || 'neutral',
        loadedWords: response.loadedWords || [],
        framingTechniques: response.framingTechniques || [],
        sourceCredibility: response.sourceCredibility || 'medium',
        credibilityFactors: response.credibilityFactors || [],
        overallAssessment: response.overallAssessment || '',
        recommendations: response.recommendations || [],
        method: 'ai-powered'
      };
    }
  
    /**
     * Keyword-based bias detection (AI එක fail වුනොත් backup එකක්)
     */
    analyzeKeywords(content) {
      const lowerContent = content.toLowerCase();
      const foundIndicators = {
        leftLeaning: [],
        rightLeaning: [],
        emotional: []
      };
  
      // Left-leaning words හොයනවා
      for (const word of this.biasIndicators.loadedWords.leftLeaning) {
        if (lowerContent.includes(word.toLowerCase())) {
          foundIndicators.leftLeaning.push(word);
        }
      }
  
      // Right-leaning words හොයනවා
      for (const word of this.biasIndicators.loadedWords.rightLeaning) {
        if (lowerContent.includes(word.toLowerCase())) {
          foundIndicators.rightLeaning.push(word);
        }
      }
  
      // Emotional words හොයනවා
      for (const word of this.biasIndicators.loadedWords.emotional) {
        if (lowerContent.includes(word.toLowerCase())) {
          foundIndicators.emotional.push(word);
        }
      }
  
      return foundIndicators;
    }
  
    /**
     * Fallback analysis (AI fail වුනොත්)
     */
    getFallbackAnalysis(article) {
      const keywordAnalysis = this.analyzeKeywords(article.content);
      
      const leftCount = keywordAnalysis.leftLeaning.length;
      const rightCount = keywordAnalysis.rightLeaning.length;
      const emotionalCount = keywordAnalysis.emotional.length;
  
      let biasDirection = 'neutral';
      let biasScore = 0.0;
  
      if (leftCount > rightCount + 2) {
        biasDirection = 'left-leaning';
        biasScore = Math.min(0.5 + (leftCount * 0.05), 0.8);
      } else if (rightCount > leftCount + 2) {
        biasDirection = 'right-leaning';
        biasScore = Math.min(0.5 + (rightCount * 0.05), 0.8);
      } else if (emotionalCount > 5) {
        biasDirection = 'sensationalist';
        biasScore = Math.min(0.4 + (emotionalCount * 0.04), 0.7);
      }
  
      return {
        biasScore: biasScore,
        biasDirection: biasDirection,
        loadedWords: [
          ...keywordAnalysis.leftLeaning,
          ...keywordAnalysis.rightLeaning,
          ...keywordAnalysis.emotional
        ],
        framingTechniques: [],
        sourceCredibility: 'unknown',
        credibilityFactors: [],
        overallAssessment: 'Basic keyword analysis (AI analysis unavailable)',
        recommendations: ['Enable AI analysis for detailed bias detection'],
        method: 'keyword-based',
        keywordIndicators: keywordAnalysis
      };
    }
  
    /**
     * Bias score එක 0-1 range එකට limit කරනවා
     */
    clampScore(score) {
      return Math.max(0.0, Math.min(1.0, parseFloat(score) || 0.0));
    }
  
    /**
     * Multiple articles වලට batch bias analysis
     */
    async analyzeBatch(articles) {
      console.log(`🔍 Batch analyzing ${articles.length} articles for bias`);
      
      const results = await Promise.all(
        articles.map(article => this.analyzeArticle(article))
      );
  
      return results;
    }
  
    /**
     * Bias score එක human-readable label එකක් කරනවා
     */
    getBiasLabel(biasScore) {
      if (biasScore < 0.2) return 'Minimal Bias';
      if (biasScore < 0.4) return 'Slight Bias';
      if (biasScore < 0.6) return 'Moderate Bias';
      if (biasScore < 0.8) return 'Significant Bias';
      return 'Extreme Bias';
    }
  
    /**
     * Bias direction color code (UI එකට)
     */
    getBiasColor(biasDirection) {
      const colors = {
        'neutral': '#28a745',        // Green
        'left-leaning': '#007bff',   // Blue
        'right-leaning': '#dc3545',  // Red
        'sensationalist': '#ffc107'  // Yellow/Orange
      };
      return colors[biasDirection] || '#6c757d'; // Gray as default
    }
  }
  
  // Singleton instance
  const biasDetector = new BiasDetector();
  
  // Export
  if (typeof module !== 'undefined' && module.exports) {
    module.exports = biasDetector;
  }
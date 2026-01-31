/**
 * analysis/narrative-analyzer.js
 * Narrative Comparison Engine
 * Multiple sources එකට compare කරලා narrative differences හොයනවා
 */

import { deepseekAPI } from '../utils/api.js';

class NarrativeAnalyzer {
    constructor() {
      this.minSources = 2; // Compare කරන්න අවම sources 2ක්
    }
  
    /**
     * Main function - Multiple articles compare කරනවා
     * @param {Array} articles - [{ url, title, content, source, biasAnalysis }]
     * @returns {Promise<object>} - Narrative comparison results
     */
    async compareNarratives(articles) {
      console.log(`📊 Comparing narratives across ${articles.length} sources`);
  
      if (articles.length < this.minSources) {
        throw new Error(`අඩුම තරමේ ${this.minSources} sources අවශ්‍යයි comparison එකට`);
      }
  
      try {
        // Cache check (main article URL එකෙන්)
        const mainUrl = articles[0].url;
        const cacheKey = `narrative_${articles.map(a => a.source).join('_')}`;
        
        // AI-powered comparison
        const comparison = await this.compareWithAI(articles);
  
        // Add metadata
        comparison.analyzedAt = Date.now();
        comparison.sourceCount = articles.length;
        comparison.sources = articles.map(a => ({
          name: a.source,
          url: a.url,
          biasScore: a.biasAnalysis?.biasScore || 0
        }));
  
        return comparison;
  
      } catch (error) {
        console.error("Narrative comparison failed:", error);
        // Fallback to basic comparison
        return this.getBasicComparison(articles);
      }
    }
  
    /**
     * Claude AI use කරලා narratives compare කරනවා
     */
    async compareWithAI(articles) {
      // Articles data prepare කරනවා
      const articlesData = articles.map((article, index) => ({
        id: index + 1,
        source: article.source,
        title: article.title,
        content: article.content.substring(0, 2000), // First 2000 chars
        biasDirection: article.biasAnalysis?.biasDirection || 'unknown'
      }));
  
      const prompt = `You are an expert media analyst. Compare how these different news sources cover the same story.
  
  SOURCES TO COMPARE:
  ${JSON.stringify(articlesData, null, 2)}
  
  ANALYSIS REQUIRED:
  1. What facts do ALL sources agree on? (consensus points)
  2. What details vary between sources? (differences)
  3. What unique angles does each source emphasize? (unique perspectives)
  4. What information is missing from some sources but present in others?
  5. Overall narrative consistency score (0.0 = completely different stories, 1.0 = identical coverage)
  
  Respond in this EXACT JSON format:
  {
    "consensusPoints": [
      "fact that all sources agree on",
      "another consensus point"
    ],
    "differences": [
      {
        "aspect": "what differs",
        "sourceViews": {
          "Source 1": "their perspective",
          "Source 2": "their perspective"
        }
      }
    ],
    "uniqueAngles": [
      {
        "source": "Source Name",
        "angle": "unique perspective they emphasize",
        "example": "specific quote or detail"
      }
    ],
    "missingInformation": [
      {
        "info": "what's missing",
        "presentIn": ["Source 1"],
        "absentFrom": ["Source 2", "Source 3"]
      }
    ],
    "narrativeConsistency": 0.0-1.0,
    "overallSummary": "2-3 sentence summary of how coverage differs",
    "trustworthinessRanking": [
      {
        "source": "Source Name",
        "score": 0.0-1.0,
        "reasoning": "why this score"
      }
    ]
  }`;
  
      const response = await deepseekAPI.sendMessageJSON(prompt, 3000);
  
      return {
        commonPoints: response.consensusPoints || [],
        differences: response.differences || [],
        uniqueAngles: response.uniqueAngles || [],
        missingInformation: response.missingInformation || [],
        narrativeConsistency: this.clampScore(response.narrativeConsistency),
        overallSummary: response.overallSummary || '',
        trustworthinessRanking: response.trustworthinessRanking || [],
        method: 'ai-powered'
      };
    }
  
    /**
     * Basic comparison (AI නැතිව)
     */
    getBasicComparison(articles) {
      // සරල keyword overlap එකක් බලනවා
      const allWords = new Set();
      const sourceWords = articles.map(article => {
        const words = this.extractKeywords(article.content);
        words.forEach(w => allWords.add(w));
        return { source: article.source, words: new Set(words) };
      });
  
      // Common keywords හොයනවා
      const commonKeywords = [...allWords].filter(word => {
        return sourceWords.every(sw => sw.words.has(word));
      });
  
      // Unique keywords හොයනවා
      const uniqueAngles = sourceWords.map(sw => {
        const unique = [...sw.words].filter(word => {
          return sourceWords.filter(other => other.words.has(word)).length === 1;
        });
        return {
          source: sw.source,
          uniqueKeywords: unique.slice(0, 10) // Top 10
        };
      });
  
      return {
        commonPoints: commonKeywords.length > 0 
          ? [`${commonKeywords.length} common keywords found`]
          : ['Limited overlap detected'],
        differences: [],
        uniqueAngles: uniqueAngles,
        missingInformation: [],
        narrativeConsistency: this.calculateKeywordOverlap(sourceWords),
        overallSummary: 'Basic keyword analysis (AI analysis unavailable)',
        trustworthinessRanking: [],
        method: 'keyword-based'
      };
    }
  
    /**
     * Content එකෙන් important keywords extract කරනවා
     */
    extractKeywords(content) {
      // Stop words remove කරනවා
      const stopWords = new Set([
        'the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for',
        'of', 'with', 'by', 'from', 'as', 'is', 'was', 'are', 'been', 'be',
        'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would', 'should',
        'could', 'may', 'might', 'must', 'can', 'this', 'that', 'these', 'those'
      ]);
  
      const words = content
        .toLowerCase()
        .replace(/[^\w\s]/g, ' ') // Punctuation remove
        .split(/\s+/)
        .filter(word => word.length > 3 && !stopWords.has(word));
  
      // Word frequency count
      const frequency = {};
      words.forEach(word => {
        frequency[word] = (frequency[word] || 0) + 1;
      });
  
      // Top keywords return කරනවා
      return Object.entries(frequency)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 50)
        .map(([word]) => word);
    }
  
    /**
     * Keyword overlap percentage calculate කරනවා
     */
    calculateKeywordOverlap(sourceWords) {
      if (sourceWords.length < 2) return 0;
  
      const overlaps = [];
      for (let i = 0; i < sourceWords.length; i++) {
        for (let j = i + 1; j < sourceWords.length; j++) {
          const intersection = new Set(
            [...sourceWords[i].words].filter(w => sourceWords[j].words.has(w))
          );
          const union = new Set([...sourceWords[i].words, ...sourceWords[j].words]);
          const overlap = intersection.size / union.size;
          overlaps.push(overlap);
        }
      }
  
      const avgOverlap = overlaps.reduce((a, b) => a + b, 0) / overlaps.length;
      return Math.round(avgOverlap * 100) / 100; // Round to 2 decimals
    }
  
    /**
     * Score එක 0-1 range එකට limit කරනවා
     */
    clampScore(score) {
      return Math.max(0.0, Math.min(1.0, parseFloat(score) || 0.0));
    }
  
    /**
     * Narrative consistency label (UI එකට)
     */
    getConsistencyLabel(score) {
      if (score > 0.8) return 'Very Consistent';
      if (score > 0.6) return 'Mostly Consistent';
      if (score > 0.4) return 'Somewhat Varied';
      if (score > 0.2) return 'Significantly Different';
      return 'Completely Different';
    }
  
    /**
     * විශේෂ කතාවක් සඳහා "missing context" හොයනවා
     * මේක පුළුවන් political/controversial topics වලට වැදගත්
     */
    async identifyMissingContext(articles, topic) {
      const prompt = `These news sources are covering: "${topic}"
  
  ${articles.map((a, i) => `Source ${i + 1} (${a.source}): ${a.content.substring(0, 1500)}`).join('\n\n')}
  
  What important context or background information is missing from one or more sources that readers should know?
  
  Respond with JSON:
  {
    "missingContext": [
      {
        "context": "what's missing",
        "importance": "high|medium|low",
        "absentFrom": ["Source names"]
      }
    ]
  }`;
  
      try {
        const response = await deepseekAPI.sendMessageJSON(prompt, 1500);
        return response.missingContext || [];
      } catch (error) {
        console.error("Failed to identify missing context:", error);
        return [];
      }
    }
  
    /**
     * Timeline comparison - sources කීපයකම events කියන order එක compare කරනවා
     */
    compareTimelines(articles) {
      // Simple implementation - AI එකෙන් improve කරන්න පුළුවන්
      const timelines = articles.map(article => ({
        source: article.source,
        mentions: this.extractTimeReferences(article.content)
      }));
  
      return {
        timelines: timelines,
        chronologyConsistent: timelines.length > 0
      };
    }
  
    /**
     * Time/date references extract කරනවා
     */
    extractTimeReferences(content) {
      const timePatterns = [
        /\d{4}-\d{2}-\d{2}/g,           // 2024-01-15
        /\d{1,2}\/\d{1,2}\/\d{2,4}/g,   // 01/15/2024
        /(january|february|march|april|may|june|july|august|september|october|november|december)\s+\d{1,2}/gi,
        /(yesterday|today|tomorrow|last week|next week)/gi
      ];
  
      const matches = [];
      timePatterns.forEach(pattern => {
        const found = content.match(pattern);
        if (found) matches.push(...found);
      });
  
      return matches;
    }
  }
  
  // Singleton instance
  const narrativeAnalyzer = new NarrativeAnalyzer();

  export { narrativeAnalyzer };
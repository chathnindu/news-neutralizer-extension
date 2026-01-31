/**
 * analysis/cross-summary.js
 * Cross-Source Neutral Summary Generator
 * Multiple sources බලලා bias-free summary එකක් generate කරනවා
 */

import { storage } from '../utils/storage.js';
import { deepseekAPI } from '../utils/api.js';

class CrossSummaryGenerator {
    constructor() {
      this.maxSummaryLength = 500; // Maximum words in summary
    }
  
    /**
     * Main function - Neutral summary generate කරනවා
     * @param {Array} articles - [{ url, title, content, source, biasAnalysis }]
     * @param {object} narrativeComparison - compareNarratives() results
     * @returns {Promise<object>} - Neutral summary + facts breakdown
     */
    async generateNeutralSummary(articles, narrativeComparison = null) {
      console.log(`✍️ Generating neutral summary from ${articles.length} sources`);
  
      if (articles.length === 0) {
        throw new Error("Summary එකක් generate කරන්න articles අවශ්‍යයි");
      }
  
      try {
        // Cache check
        const cacheKey = articles.map(a => a.url).join('|');
        const cached = await storage.getCachedAnalysis(cacheKey);
        if (cached && cached.neutralSummary) {
          console.log("📦 Using cached summary");
          return cached.neutralSummary;
        }
  
        // Generate summary with AI
        const summary = await this.generateWithAI(articles, narrativeComparison);
  
        // Cache save කරනවා
        await storage.cacheAnalysis(cacheKey, { neutralSummary: summary });
  
        return summary;
  
      } catch (error) {
        console.error("Summary generation failed:", error);
        return this.getFallbackSummary(articles);
      }
    }
  
    /**
     * Claude AI use කරලා neutral summary generate කරනවා
     */
    async generateWithAI(articles, narrativeComparison) {
      // Prepare articles for AI
      const articlesData = articles.map((article, index) => ({
        id: index + 1,
        source: article.source,
        title: article.title,
        content: article.content.substring(0, 2500), // First 2500 chars
        biasDirection: article.biasAnalysis?.biasDirection || 'unknown',
        biasScore: article.biasAnalysis?.biasScore || 0
      }));
  
      // Add narrative comparison if available
      const contextInfo = narrativeComparison ? `
  NARRATIVE COMPARISON CONTEXT:
  - Consensus points: ${narrativeComparison.commonPoints?.join(', ')}
  - Consistency score: ${narrativeComparison.narrativeConsistency}
  ` : '';
  
      const prompt = `You are a professional neutral journalist. Create an unbiased summary of this story based on multiple sources.
  
  SOURCES:
  ${JSON.stringify(articlesData, null, 2)}
  
  ${contextInfo}
  
  REQUIREMENTS:
  1. Write a neutral, factual summary (200-400 words)
  2. Only include facts that appear in multiple sources
  3. Clearly separate verified facts from disputed claims
  4. DO NOT use loaded language or emotional words
  5. Present all perspectives fairly
  6. Highlight what sources agree vs disagree on
  7. Note any crucial missing information
  
  Respond in this EXACT JSON format:
  {
    "neutralSummary": "Balanced summary paragraph here",
    "consensusFacts": [
      "Fact confirmed by multiple sources",
      "Another verified fact"
    ],
    "disputedPoints": [
      {
        "claim": "What's being disputed",
        "sources": {
          "Supporting": ["Source A", "Source B"],
          "Opposing": ["Source C"]
        }
      }
    ],
    "verifiedDetails": {
      "who": "Key people/entities involved",
      "what": "What happened",
      "when": "Timeline",
      "where": "Location",
      "why": "Stated reasons/motivations",
      "how": "How it unfolded"
    },
    "missingInfo": [
      "What information is unclear or absent from all sources"
    ],
    "confidence": 0.0-1.0,
    "recommendedAction": "What readers should verify independently"
  }`;
  
      const response = await deepseekAPI.sendMessageJSON(prompt, 3000);
  
      return {
        summary: response.neutralSummary || '',
        consensusFacts: response.consensusFacts || [],
        disputedPoints: response.disputedPoints || [],
        verifiedDetails: response.verifiedDetails || {},
        missingInfo: response.missingInfo || [],
        confidence: this.clampScore(response.confidence),
        recommendedAction: response.recommendedAction || '',
        wordCount: this.countWords(response.neutralSummary),
        generatedAt: Date.now(),
        method: 'ai-powered',
        sourcesUsed: articles.length
      };
    }
  
    /**
     * Fallback summary (AI නැතිව)
     */
    getFallbackSummary(articles) {
      // Most common sentences extract කරනවා
      const allSentences = articles.flatMap(article => 
        this.extractSentences(article.content)
      );
  
      // Sentence frequency count
      const sentenceFreq = {};
      allSentences.forEach(sentence => {
        const normalized = sentence.toLowerCase().trim();
        sentenceFreq[normalized] = (sentenceFreq[normalized] || 0) + 1;
      });
  
      // Multiple sources වල තියෙන sentences විතරක් select කරනවා
      const commonSentences = Object.entries(sentenceFreq)
        .filter(([_, count]) => count > 1)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5)
        .map(([sentence]) => sentence);
  
      const summary = commonSentences.length > 0
        ? commonSentences.join(' ')
        : articles[0].content.substring(0, 500);
  
      return {
        summary: summary,
        consensusFacts: commonSentences,
        disputedPoints: [],
        verifiedDetails: {},
        missingInfo: ['Detailed analysis unavailable - AI service required'],
        confidence: 0.3,
        recommendedAction: 'Read multiple sources independently',
        wordCount: this.countWords(summary),
        generatedAt: Date.now(),
        method: 'fallback',
        sourcesUsed: articles.length
      };
    }
  
    /**
     * Content එකෙන් sentences extract කරනවා
     */
    extractSentences(content) {
      // Simple sentence splitting
      return content
        .split(/[.!?]+/)
        .map(s => s.trim())
        .filter(s => s.length > 20 && s.length < 200); // Reasonable length
    }
  
    /**
     * Word count
     */
    countWords(text) {
      return text.split(/\s+/).filter(word => word.length > 0).length;
    }
  
    /**
     * Score එක 0-1 range එකට limit කරනවා
     */
    clampScore(score) {
      return Math.max(0.0, Math.min(1.0, parseFloat(score) || 0.0));
    }
  
    /**
     * Summary confidence level label
     */
    getConfidenceLabel(confidence) {
      if (confidence > 0.8) return 'Very High';
      if (confidence > 0.6) return 'High';
      if (confidence > 0.4) return 'Moderate';
      if (confidence > 0.2) return 'Low';
      return 'Very Low';
    }
  
    /**
     * විශේෂ topic එකකට focused summary එකක්
     * උදා: "Tell me about the economic impact" කියලා අහනවා නම්
     */
    async generateFocusedSummary(articles, focusArea) {
      const prompt = `Based on these articles, provide a focused summary about: "${focusArea}"
  
  ${articles.map(a => `${a.source}: ${a.content.substring(0, 1500)}`).join('\n\n')}
  
  Create a brief (100-200 words) neutral summary specifically about ${focusArea}.
  Only include verified information from the sources.
  
  Respond with JSON:
  {
    "focusedSummary": "summary text",
    "relevantFacts": ["fact 1", "fact 2"],
    "sourceAttribution": {
      "Fact": ["Sources that mention it"]
    }
  }`;
  
      try {
        const response = await deepseekAPI.sendMessageJSON(prompt, 1500);
        return {
          summary: response.focusedSummary,
          facts: response.relevantFacts || [],
          attribution: response.sourceAttribution || {},
          focus: focusArea
        };
      } catch (error) {
        console.error("Focused summary generation failed:", error);
        return null;
      }
    }
  
    /**
     * Timeline-based summary - chronological order එකට
     */
    async generateTimelineSummary(articles) {
      const prompt = `Create a timeline of events based on these articles:
  
  ${articles.map(a => `${a.source}: ${a.content.substring(0, 2000)}`).join('\n\n')}
  
  Extract key events in chronological order. Respond with JSON:
  {
    "timeline": [
      {
        "date": "when it happened (or 'unknown')",
        "event": "what happened",
        "sources": ["which sources mention it"]
      }
    ]
  }`;
  
      try {
        const response = await deepseekAPI.sendMessageJSON(prompt, 2000);
        return response.timeline || [];
      } catch (error) {
        console.error("Timeline generation failed:", error);
        return [];
      }
    }
  
    /**
     * Key quotes extract කරනවා multiple sources වලින්
     */
    async extractKeyQuotes(articles) {
      const prompt = `Extract the most important direct quotes from these articles:
  
  ${articles.map(a => `${a.source}: ${a.content.substring(0, 2000)}`).join('\n\n')}
  
  Find quotes that:
  1. Come from credible sources
  2. Add important context
  3. Are not inflammatory/biased
  
  Respond with JSON:
  {
    "quotes": [
      {
        "text": "the quote",
        "speaker": "who said it",
        "source": "which article",
        "context": "why it matters"
      }
    ]
  }`;
  
      try {
        const response = await deepseekAPI.sendMessageJSON(prompt, 1500);
        return response.quotes || [];
      } catch (error) {
        console.error("Quote extraction failed:", error);
        return [];
      }
    }
  
    /**
     * Summary quality check
     */
    assessSummaryQuality(summary, articles) {
      const quality = {
        length: summary.wordCount > 50 && summary.wordCount < 600,
        hasConsensus: summary.consensusFacts.length > 0,
        hasMultipleSources: summary.sourcesUsed >= 2,
        highConfidence: summary.confidence > 0.6,
        method: summary.method
      };
  
      quality.overall = Object.values(quality).filter(v => v === true).length / 4;
      quality.recommendation = quality.overall > 0.7 
        ? 'Summary is reliable'
        : 'Read original sources for better understanding';
  
      return quality;
    }
  }
  
  // Singleton instance
  const crossSummaryGenerator = new CrossSummaryGenerator();

  export { crossSummaryGenerator };
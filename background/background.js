importScripts(
  'utils/api.js',
  'utils/storage.js',
  'background/content-detector.js',
  'background/news-api-handler.js',
  'background/multi-source-fetcher.js',
  'analysis/bias-detector.js',
  'analysis/narrative-analyzer.js',
  'analysis/cross-summary.js'
);

const BADGE_ANALYZING = '...';
const BADGE_COLOR = '#2563eb';
const STORAGE_KEY_LAST_RESULT = 'lastAnalysisResult';

function setBadge(text) {
  try {
    chrome.action.setBadgeText({ text: String(text) });
    chrome.action.setBadgeBackgroundColor({ color: BADGE_COLOR });
  } catch (e) {
    console.warn('Badge update failed:', e);
  }
}

function clearBadge() {
  try {
    chrome.action.setBadgeText({ text: '' });
  } catch (e) {}
}

chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  if (msg.type !== 'ANALYZE_PAGE') return;
  const article = msg.payload;
  if (!article || !article.content) {
    sendResponse({ ok: false, error: 'No article content' });
    return;
  }

  (async () => {
    try {
      const detected = contentDetector.detect(article);
      if (!detected.isNews) {
        sendResponse({ ok: false, error: 'Page does not look like a news article' });
        return;
      }

      setBadge(BADGE_ANALYZING);

      // 1. Extract main topic/keywords (already in detected)
      const searchQuery = detected.mainTopic || article.title || article.content.slice(0, 150);

      // 2. Search for related articles
      const apiArticles = await newsApiHandler.search(searchQuery, {
        pageSize: 10,
        excludeUrl: article.url,
      });

      // 3. Top 3–5 sources (use API data only; no CORS scrape)
      const relatedArticles = multiSourceFetcher.getTopSources(apiArticles);

      // Build full articles list: current + related (need content for analysis)
      const allArticles = [
        { ...article, source: article.source || new URL(article.url).hostname },
        ...relatedArticles,
      ].filter((a) => a.content && a.content.length >= 100);

      if (allArticles.length === 0) {
        clearBadge();
        sendResponse({ ok: false, error: 'Could not get enough article content' });
        return;
      }

      // 4. Bias for current article (and optionally for related)
      const biasResult = await biasDetector.analyzeArticle(article);
      const articleWithBias = { ...article, biasAnalysis: biasResult };
      const relatedWithBias = await Promise.all(
        relatedArticles.map((a) =>
          biasDetector.analyzeArticle(a).then((bias) => ({ ...a, biasAnalysis: bias }))
        )
      );
      const articlesWithBias = [articleWithBias, ...relatedWithBias];

      // 5. Compare narratives (if 2+ sources)
      let narrativeResult = null;
      if (articlesWithBias.length >= 2) {
        narrativeResult = await narrativeAnalyzer.compareNarratives(articlesWithBias);
      }

      // 6. Generate neutral summary
      const neutralSummary = await crossSummaryGenerator.generateNeutralSummary(
        articlesWithBias,
        narrativeResult
      );

      const sourceCount = articlesWithBias.length;
      setBadge(sourceCount);

      const result = {
        ok: true,
        bias: biasResult,
        biasLabel: biasDetector.getBiasLabel(biasResult.biasScore),
        neutralSummary,
        narrative: narrativeResult,
        sources: articlesWithBias.map((a) => ({
          url: a.url,
          title: a.title,
          source: a.source,
          biasScore: a.biasAnalysis?.biasScore,
          biasDirection: a.biasAnalysis?.biasDirection,
        })),
        sourceCount,
      };

      await chrome.storage.local.set({ [STORAGE_KEY_LAST_RESULT]: { ...result, analyzedAt: Date.now() } });
      await storage.addToHistory(article.url, {
        title: article.title,
        biasScore: biasResult.biasScore,
        sources: sourceCount,
      });

      sendResponse(result);
    } catch (e) {
      console.error('Analysis failed:', e);
      clearBadge();
      sendResponse({ ok: false, error: e.message || String(e) });
    }
  })();
  return true;
});

// Popup can request last result without re-running analysis
chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  if (msg.type !== 'GET_LAST_RESULT') return;
  chrome.storage.local.get([STORAGE_KEY_LAST_RESULT], (data) => {
    sendResponse(data[STORAGE_KEY_LAST_RESULT] || null);
  });
  return true;
});

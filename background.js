/**
 * Background service worker: runs in background.
 * Loads analysis modules and runs bias + neutral summary when popup requests analysis.
 */
importScripts(
  'utils/api.js',
  'utils/storage.js',
  'analysis/bias-detector.js',
  'analysis/narrative-analyzer.js',
  'analysis/cross-summary.js'
);

chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  if (msg.type !== 'ANALYZE_PAGE') return;
  const article = msg.payload;
  if (!article || !article.content) {
    sendResponse({ ok: false, error: 'No article content' });
    return;
  }

  (async () => {
    try {
      const biasResult = await biasDetector.analyzeArticle(article);
      const articleWithBias = { ...article, biasAnalysis: biasResult };
      const narrativeResult = null;
      const neutralSummary = await crossSummaryGenerator.generateNeutralSummary(
        [articleWithBias],
        narrativeResult
      );
      await storage.addToHistory(article.url, {
        title: article.title,
        biasScore: biasResult.biasScore,
        sources: 1,
      });
      const biasLabel = biasDetector.getBiasLabel(biasResult.biasScore);
      sendResponse({
        ok: true,
        bias: biasResult,
        biasLabel,
        neutralSummary,
        narrative: narrativeResult,
        relatedLinks: [],
      });
    } catch (e) {
      console.error('Analysis failed:', e);
      sendResponse({ ok: false, error: e.message || String(e) });
    }
  })();
  return true;
});

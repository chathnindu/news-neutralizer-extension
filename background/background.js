/**
 * Background Service Worker (MV3) - Main orchestrator for News Neutralizer
 * Handles message passing between popup and content scripts, manages analysis pipeline
 */

import { findRelatedArticles } from './multi-source-fetcher.js';
import { extractKeywords } from './keyword-extractor.js';

// Storage key for current analysis state
const STORAGE_KEY = 'currentAnalysisState';

/**
 * Initialize the extension
 */
chrome.runtime.onInstalled.addListener(() => {
  console.log('News Neutralizer extension installed');
  // Initialize storage with empty state
  chrome.storage.local.set({
    [STORAGE_KEY]: {
      status: 'idle',
      timestamp: Date.now()
    }
  });
});

/**
 * Message listener for popup and content script communication
 */
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  console.log('Background received message:', message);

  if (message.type === 'GET_STATE') {
    handleGetState(sendResponse);
    return true; // Keep channel open for async response
  }

  if (message.type === 'ANALYZE_ACTIVE_TAB') {
    handleAnalyzeActiveTab(sendResponse);
    return true; // Keep channel open for async response
  }

  return false;
});

/**
 * Handle GET_STATE message - return current analysis state from storage
 */
async function handleGetState(sendResponse) {
  try {
    const result = await chrome.storage.local.get(STORAGE_KEY);
    const state = result[STORAGE_KEY] || { status: 'idle', timestamp: Date.now() };
    sendResponse({ success: true, state });
  } catch (error) {
    console.error('Error getting state:', error);
    sendResponse({ success: false, error: error.message });
  }
}

/**
 * Handle ANALYZE_ACTIVE_TAB message - run analysis pipeline for current active tab
 */
async function handleAnalyzeActiveTab(sendResponse) {
  try {
    // Get active tab
    const [activeTab] = await chrome.tabs.query({ active: true, currentWindow: true });
    
    if (!activeTab) {
      throw new Error('No active tab found');
    }

    // Run the analysis pipeline
    await runAnalysisPipeline(activeTab);
    
    sendResponse({ success: true });
  } catch (error) {
    console.error('Error analyzing active tab:', error);
    await setErrorState(error.message);
    sendResponse({ success: false, error: error.message });
  }
}

/**
 * Main analysis pipeline
 */
async function runAnalysisPipeline(tab) {
  const tabId = tab.id;
  const tabUrl = tab.url;

  // Step 1: Set badge to "..." with orange color while running
  await setBadgeLoading(tabId);
  await updateState({
    status: 'analyzing',
    tabId,
    tabUrl,
    timestamp: Date.now(),
    error: null
  });

  try {
    // Step 2: Request scrape from content script
    console.log('Requesting page scrape from content script...');
    const scrapeResult = await sendMessageToTab(tabId, { type: 'SCRAPE_PAGE' });

    if (!scrapeResult || !scrapeResult.success) {
      throw new Error(scrapeResult?.error || 'Failed to scrape page content');
    }

    const { title, text, url } = scrapeResult.data;
    console.log('Scrape successful:', { title, textLength: text?.length, url });

    // Step 3: Extract keywords from title and text
    const keywords = extractKeywords(title, text);
    console.log('Extracted keywords:', keywords);

    // Step 4: Find related sources
    console.log('Finding related articles...');
    const relatedArticles = await findRelatedArticles({
      keywords,
      originalUrl: url || tabUrl,
      limit: 5
    });
    console.log('Found related articles:', relatedArticles.length);

    // Step 5: Call analysis modules (placeholders for now)
    let narrativeAnalysis = null;
    let crossSummary = null;

    try {
      // Import analysis modules if available
      const { analyzeNarrative } = await import('../analysis/narrative-analyzer.js');
      narrativeAnalysis = await analyzeNarrative({ title, text, relatedArticles });
    } catch (error) {
      console.log('Narrative analyzer not available or error:', error.message);
      narrativeAnalysis = { status: 'not_available', placeholder: true };
    }

    try {
      const { generateCrossSummary } = await import('../analysis/cross-summary.js');
      crossSummary = await generateCrossSummary({ title, text, relatedArticles });
    } catch (error) {
      console.log('Cross summary not available or error:', error.message);
      crossSummary = { status: 'not_available', placeholder: true };
    }

    // Step 6: Store results in storage
    const finalState = {
      status: 'complete',
      tabId,
      tabUrl,
      timestamp: Date.now(),
      originalArticle: { title, url: url || tabUrl, textLength: text?.length || 0 },
      keywords,
      relatedArticles,
      narrativeAnalysis,
      crossSummary,
      error: null
    };

    await updateState(finalState);

    // Step 7: Set badge to number of sources found (green)
    await setBadgeSuccess(tabId, relatedArticles.length);

    console.log('Analysis pipeline complete');
  } catch (error) {
    console.error('Error in analysis pipeline:', error);
    await setErrorState(error.message);
    await setBadgeError(tabId);
    throw error;
  }
}

/**
 * Send message to content script in tab
 */
function sendMessageToTab(tabId, message) {
  return new Promise((resolve, reject) => {
    chrome.tabs.sendMessage(tabId, message, (response) => {
      if (chrome.runtime.lastError) {
        reject(new Error(chrome.runtime.lastError.message));
      } else {
        resolve(response);
      }
    });
  });
}

/**
 * Update state in storage
 */
async function updateState(stateUpdate) {
  await chrome.storage.local.set({
    [STORAGE_KEY]: stateUpdate
  });
}

/**
 * Set error state
 */
async function setErrorState(errorMessage) {
  await chrome.storage.local.get(STORAGE_KEY, (result) => {
    const currentState = result[STORAGE_KEY] || {};
    chrome.storage.local.set({
      [STORAGE_KEY]: {
        ...currentState,
        status: 'error',
        error: errorMessage,
        timestamp: Date.now()
      }
    });
  });
}

/**
 * Badge management - Loading state
 */
async function setBadgeLoading(tabId) {
  await chrome.action.setBadgeText({ text: '...', tabId });
  await chrome.action.setBadgeBackgroundColor({ color: '#FFA500', tabId }); // Orange
}

/**
 * Badge management - Success state
 */
async function setBadgeSuccess(tabId, count) {
  await chrome.action.setBadgeText({ text: String(count), tabId });
  await chrome.action.setBadgeBackgroundColor({ color: '#00AA00', tabId }); // Green
}

/**
 * Badge management - Error state
 */
async function setBadgeError(tabId) {
  await chrome.action.setBadgeText({ text: '!', tabId });
  await chrome.action.setBadgeBackgroundColor({ color: '#FF0000', tabId }); // Red
}

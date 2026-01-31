// MV3 Service Worker for News Neutralizer Extension
import { findRelatedArticles } from './multi-source-fetcher.js';

const STORAGE_KEY = 'currentAnalysisState';

// Default idle state
function getDefaultState() {
  return {
    status: 'idle',
    timestamp: Date.now(),
    data: null,
    error: null
  };
}

// Get current state from storage
async function getState() {
  try {
    const result = await chrome.storage.local.get(STORAGE_KEY);
    return result[STORAGE_KEY] || getDefaultState();
  } catch (error) {
    console.error('Error getting state:', error);
    return getDefaultState();
  }
}

// Save state to storage
async function saveState(state) {
  try {
    await chrome.storage.local.set({ [STORAGE_KEY]: state });
  } catch (error) {
    console.error('Error saving state:', error);
  }
}

// Set badge text and color
function setBadge(text, color) {
  chrome.action.setBadgeText({ text: text });
  chrome.action.setBadgeBackgroundColor({ color: color });
}

// Extract simple keywords from title and text
function extractKeywords(title, text) {
  const combined = `${title} ${text}`.toLowerCase();
  
  // Remove common stop words and special characters
  const stopWords = new Set(['the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by', 'from', 'as', 'is', 'was', 'are', 'were', 'been', 'be', 'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would', 'could', 'should', 'may', 'might', 'must', 'can', 'this', 'that', 'these', 'those', 'it', 'its', 'they', 'their', 'them']);
  
  const words = combined
    .replace(/[^a-z0-9\s]/g, ' ')
    .split(/\s+/)
    .filter(word => word.length > 3 && !stopWords.has(word));
  
  // Get unique words and take top 10 by frequency
  const wordFreq = {};
  words.forEach(word => {
    wordFreq[word] = (wordFreq[word] || 0) + 1;
  });
  
  const keywords = Object.entries(wordFreq)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .map(([word]) => word);
  
  return keywords;
}

// Main analysis pipeline
async function analyzeActiveTab() {
  try {
    // Set badge to indicate processing
    setBadge('...', '#FFA500'); // orange
    
    // Update state to scraping
    await saveState({
      status: 'scraping',
      timestamp: Date.now(),
      data: null,
      error: null
    });
    
    // Get active tab
    const [activeTab] = await chrome.tabs.query({ active: true, currentWindow: true });
    
    if (!activeTab || !activeTab.id) {
      throw new Error('No active tab found');
    }
    
    // Send message to content script to scrape page
    let response;
    try {
      response = await chrome.tabs.sendMessage(activeTab.id, { type: 'SCRAPE_PAGE' });
    } catch (error) {
      // Content script might not be injected yet, try to inject it
      console.log('Content script not ready, attempting to inject...');
      throw new Error('Content script not available. Please refresh the page and try again.');
    }
    
    // Check response
    if (!response || !response.ok) {
      throw new Error(response?.error || 'Failed to scrape page');
    }
    
    const { payload } = response;
    const { url, title, text, siteName } = payload;
    
    // Extract keywords
    const keywords = extractKeywords(title, text);
    
    // Update state to fetching
    await saveState({
      status: 'fetching',
      timestamp: Date.now(),
      data: { url, title, siteName, keywords },
      error: null
    });
    
    // Fetch related articles
    const relatedArticles = await findRelatedArticles({
      keywords,
      originalUrl: url,
      limit: 10
    });
    
    // Update state to done
    const finalState = {
      status: 'done',
      timestamp: Date.now(),
      data: {
        url,
        title,
        siteName,
        keywords,
        relatedArticles
      },
      error: null
    };
    
    await saveState(finalState);
    
    // Set badge to show number of related articles
    const count = relatedArticles.length;
    setBadge(count.toString(), '#4CAF50'); // green
    
    return finalState;
    
  } catch (error) {
    console.error('Analysis error:', error);
    
    // Update state to error
    const errorState = {
      status: 'error',
      timestamp: Date.now(),
      data: null,
      error: error.message
    };
    
    await saveState(errorState);
    
    // Set badge to indicate error
    setBadge('!', '#F44336'); // red
    
    throw error;
  }
}

// Message handler
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === 'GET_STATE') {
    getState().then(state => {
      sendResponse({ ok: true, state });
    }).catch(error => {
      sendResponse({ ok: false, error: error.message });
    });
    return true; // Keep channel open for async response
  }
  
  if (message.type === 'ANALYZE_ACTIVE_TAB') {
    analyzeActiveTab().then(state => {
      sendResponse({ ok: true, state });
    }).catch(error => {
      sendResponse({ ok: false, error: error.message });
    });
    return true; // Keep channel open for async response
  }
  
  return false;
});

// Initialize badge on installation
chrome.runtime.onInstalled.addListener(() => {
  setBadge('', '#4CAF50');
  saveState(getDefaultState());
});

console.log('News Neutralizer service worker loaded');

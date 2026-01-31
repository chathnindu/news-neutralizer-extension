# Quick Start Testing Guide

## Installation (2 minutes)

1. **Open Chrome Extensions Page**
   ```
   chrome://extensions/
   ```

2. **Enable Developer Mode**
   - Toggle switch in top-right corner

3. **Load Extension**
   - Click "Load unpacked"
   - Select this directory
   - Extension should appear with green "N" icon

## Quick Test (1 minute)

### Test 1: Basic State Retrieval
1. Click the extension icon (top-right toolbar)
2. Popup opens showing "News Neutralizer"
3. Click "Get Current State"
4. **Expected**: Shows "Ready to analyze" with timestamp

### Test 2: Analyze Test Page
1. Open `test-page.html` in a new tab (File → Open File)
2. Click extension icon
3. Click "Analyze Current Page"
4. **Expected**:
   - Badge shows "..." then "0"
   - Status shows: Scraping → Fetching → Complete
   - "Found 0 related article(s)" (API is placeholder)

### Test 3: Analyze Real News Site
1. Go to any news website (e.g., bbc.com/news/...)
2. Open any article
3. Click extension icon
4. Click "Analyze Current Page"
5. **Expected**: Same as Test 2

## What to Look For

### ✅ Success Indicators
- Badge changes from "" → "..." → "0"
- Badge color: gray → orange → green
- Status updates automatically (no manual refresh needed)
- State persists when closing/reopening popup

### ⚠️ Known Behavior
- Related articles = 0 (API is placeholder - see news-api-handler.js TODO)
- Some sites may fail if content script isn't injected
- Chrome internal pages (chrome://*) will show error

## Debugging

### Check Service Worker Console
1. Go to `chrome://extensions/`
2. Find "News Neutralizer"
3. Click "service worker" link
4. Check console for:
   ```
   News Neutralizer service worker loaded
   searchRelatedArticles called with query: "...", limit: 20
   TODO: Implement actual news API integration
   ```

### Check Content Script Console
1. Open DevTools on the page (F12)
2. Look for:
   ```
   News Neutralizer content script loaded
   ```

### Check Storage
In service worker console:
```javascript
chrome.storage.local.get('currentAnalysisState', console.log);
```

## Next Steps

To make the extension fully functional:
1. Get a news API key (e.g., from NewsAPI.org)
2. Implement the `searchRelatedArticles` function in `background/news-api-handler.js`
3. Test with real API responses

## Questions?

See full documentation:
- README.md - Complete user guide
- TESTING.md - Detailed test procedures
- IMPLEMENTATION_SUMMARY.md - Architecture overview

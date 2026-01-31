# Testing Guide

## Manual Testing Steps

### Prerequisites
1. Load the extension in Chrome:
   - Open Chrome and go to `chrome://extensions/`
   - Enable "Developer mode" (toggle in top right)
   - Click "Load unpacked"
   - Select the extension directory

### Test 1: GET_STATE Functionality
**Objective**: Verify that popup can retrieve state from background

1. Open any webpage
2. Click the extension icon
3. Click "Get Current State"
4. **Expected Result**: Status shows "Ready to analyze" with current timestamp
5. Close and reopen popup
6. **Expected Result**: State persists (same status and timestamp shown)

### Test 2: ANALYZE_ACTIVE_TAB Pipeline
**Objective**: Verify full analysis pipeline runs correctly

1. Open `test-page.html` in a new tab (included in extension folder)
2. Click the extension icon
3. Click "Analyze Current Page"
4. **Expected Results**:
   - Badge shows "..." in orange
   - Status changes to "Scraping page content..."
   - Status changes to "Fetching related articles..."
   - Status changes to "Analysis complete!"
   - Badge shows "0" (since API is placeholder)
   - Badge color is green
   - Popup shows "Found 0 related article(s)"

### Test 3: Error Handling
**Objective**: Verify error handling works correctly

1. Open a Chrome internal page (e.g., `chrome://extensions/`)
2. Click the extension icon
3. Click "Analyze Current Page"
4. **Expected Results**:
   - Badge shows "!" in red
   - Status shows error message
   - Error persists when reopening popup

### Test 4: Real News Site
**Objective**: Test on actual news article

1. Navigate to any news website (e.g., BBC, CNN, etc.)
2. Open any article
3. Click the extension icon
4. Click "Analyze Current Page"
5. **Expected Results**:
   - Pipeline completes successfully
   - Badge shows "0" (placeholder API returns empty array)
   - Keywords are extracted (visible in console logs)
   - State includes article title and URL

### Test 5: State Persistence
**Objective**: Verify state persists across sessions

1. Analyze a page (any page)
2. Wait for analysis to complete
3. Close popup
4. Click extension icon to reopen
5. **Expected Result**: Previous analysis results still displayed

### Test 6: Storage Change Listener
**Objective**: Verify popup updates automatically

1. Open popup
2. Click "Analyze Current Page"
3. **Expected Result**: Popup updates automatically as state changes (no need to click "Get Current State")

## Debugging Tips

### Check Service Worker Console
1. Go to `chrome://extensions/`
2. Find "News Neutralizer"
3. Click "service worker" link
4. Check console for logs

### Check Content Script Console
1. Open DevTools on the page (F12)
2. Look for "News Neutralizer content script loaded"
3. Check for any errors

### Check Storage
1. In service worker console, run:
   ```javascript
   chrome.storage.local.get('currentAnalysisState', (result) => {
     console.log(result);
   });
   ```

## Expected Console Output

### Successful Analysis
```
News Neutralizer service worker loaded
News Neutralizer content script loaded
searchRelatedArticles called with query: "...", limit: 20
TODO: Implement actual news API integration
```

### With Errors
Check for specific error messages:
- "No active tab found"
- "Content script not available. Please refresh the page and try again."
- "Failed to scrape page"

## Requirements Verification Checklist

- [x] Manifest references background/background.js
- [x] Manifest references content/content.js
- [x] Manifest has correct permissions (activeTab, storage, tabs)
- [x] GET_STATE returns persisted state from chrome.storage.local
- [x] GET_STATE returns default idle state if no state exists
- [x] ANALYZE_ACTIVE_TAB runs complete pipeline
- [x] Pipeline sets badge to '...' (orange) during processing
- [x] Pipeline identifies active tab
- [x] Pipeline sends SCRAPE_PAGE message to content script
- [x] Content script responds with {ok, payload} format
- [x] Keywords are extracted from title/text
- [x] multi-source-fetcher is called
- [x] State transitions are persisted to storage
- [x] Success sets badge to article count (green)
- [x] Error sets badge to '!' (red)
- [x] multi-source-fetcher exports findRelatedArticles
- [x] multi-source-fetcher calls news-api-handler
- [x] multi-source-fetcher deduplicates by URL
- [x] multi-source-fetcher filters same domain
- [x] news-api-handler exports searchRelatedArticles
- [x] news-api-handler returns empty array (placeholder)
- [x] news-api-handler has TODO comment
- [x] news-api-handler documents expected return type
- [x] content.js responds to SCRAPE_PAGE
- [x] content.js extracts title, url, text, siteName
- [x] content.js tries article element first
- [x] content.js has body.innerText fallback
- [x] Code is MV3 compliant

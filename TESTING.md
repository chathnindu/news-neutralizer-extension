# Testing Guide for News Neutralizer Extension

## Manual Testing Steps

### 1. Load Extension in Chrome

1. Open Chrome and navigate to `chrome://extensions/`
2. Enable "Developer mode" (toggle in top right)
3. Click "Load unpacked"
4. Select the extension folder
5. Verify the extension icon appears in the toolbar

### 2. Test Basic Popup Functionality

1. Click the extension icon
2. Popup should open with:
   - Title: "News Neutralizer"
   - "Analyze Active Tab" button
   - "Refresh State" button
   - Status showing "Idle"

### 3. Test Analysis Pipeline

#### Test on a News Article:

1. Navigate to any news article (e.g., CNN, BBC, The Guardian)
2. Open the extension popup
3. Click "Analyze Active Tab"
4. Observe the following:
   - Button changes to "Analyzing..."
   - Extension badge shows "..." in orange
   - After a few seconds, status updates

#### Expected Results:

- **Status**: Should show "Complete" with timestamp
- **Badge**: Should show "0" (green) since news API is not configured
- **Original Article**: Should display the page title
- **Keywords**: Should show 3-5 extracted keywords
- **Related Articles**: Should show "No related articles found" (expected with placeholder API)

### 4. Test Error Handling

#### Test on Non-Article Page:

1. Navigate to a simple page (e.g., `chrome://extensions/`)
2. Open popup and click "Analyze Active Tab"
3. Should see error or complete with extracted content

#### Test Content Script Communication:

1. Open DevTools → Console
2. Filter by "News Neutralizer" or "Content script"
3. Analyze a page
4. Verify console logs show:
   - Background script receiving messages
   - Content script scraping page
   - Pipeline execution steps

### 5. Test State Persistence

1. Analyze a news article
2. Close the popup
3. Reopen the popup
4. Click "Refresh State"
5. Previous analysis results should still be displayed

### 6. Test Badge Indicators

Monitor the extension badge during analysis:
- **Orange "..."**: Analysis in progress
- **Green "0"**: Analysis complete (0 related articles with placeholder API)
- **Red "!"**: Error occurred (if content script fails)

## Automated Testing

### Keyword Extraction Test

Run the keyword extraction test:

```bash
node test-keyword-extraction.js
```

Expected output: All 3 tests should pass

## Console Log Checks

### Background Service Worker Logs

1. Go to `chrome://extensions/`
2. Find News Neutralizer extension
3. Click "service worker" link under "Inspect views"
4. Trigger an analysis
5. Verify logs show:
   ```
   Background received message: {type: 'ANALYZE_ACTIVE_TAB'}
   Requesting page scrape from content script...
   Scrape successful: {title: '...', textLength: ..., url: '...'}
   Extracted keywords: [...]
   Finding related articles...
   [NEWS-API-HANDLER] Returning empty results (placeholder implementation)
   Found 0 unique related articles
   Analysis pipeline complete
   ```

### Content Script Logs

1. Navigate to a news article
2. Open DevTools → Console
3. Trigger analysis
4. Verify logs show:
   ```
   News Neutralizer content script loaded
   Content script received message: {type: 'SCRAPE_PAGE'}
   Page scraped: {title: '...', textLength: ..., url: '...'}
   ```

## Integration Testing

### Message Flow Test

Verify the complete message flow:

1. **Popup → Background (GET_STATE)**
   - Popup opens
   - Requests current state
   - Receives state response

2. **Popup → Background (ANALYZE_ACTIVE_TAB)**
   - User clicks "Analyze"
   - Background receives request
   - Background responds with success

3. **Background → Content Script (SCRAPE_PAGE)**
   - Background sends scrape request
   - Content script extracts page content
   - Content script sends data back

4. **Background → Storage**
   - Results stored in chrome.storage.local
   - State persists across popup sessions

## Expected Issues with Placeholder API

Since `news-api-handler.js` is a placeholder:
- ✓ Pipeline should complete successfully
- ✓ Keywords should be extracted
- ✓ Related articles count will be 0
- ✓ Badge will show "0" (green)
- ✓ No actual external API calls are made

## Performance Checks

- Popup should open instantly
- State loading should be < 100ms
- Analysis should complete in < 5 seconds
- No memory leaks in service worker
- No errors in console (except expected placeholder notices)

## Known Limitations

1. News API integration is not yet implemented (placeholder only)
2. Analysis modules (narrative-analyzer, cross-summary) return placeholders
3. No user preferences or settings yet
4. Basic keyword extraction (can be improved with NLP)

## Success Criteria

✅ Extension loads without errors
✅ Popup UI displays correctly
✅ Analysis pipeline executes end-to-end
✅ State persists in chrome.storage.local
✅ Badge indicators work correctly
✅ Content script successfully scrapes pages
✅ Keywords are extracted from articles
✅ Error handling works (graceful failures)
✅ MV3 service worker operates correctly
✅ No console errors (except expected placeholder notices)

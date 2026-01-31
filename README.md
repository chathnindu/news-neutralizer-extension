# News Neutralizer Extension

A Chrome extension (Manifest V3) that analyzes news articles and finds related sources from different perspectives.

## Features

- **On-demand Analysis**: Click the extension icon to analyze the current page
- **Smart Content Extraction**: Automatically extracts article title, text, and metadata
- **Keyword Extraction**: Identifies key topics from the article
- **Related Article Finder**: Searches for related articles from different sources (placeholder API)
- **Visual Feedback**: Badge shows analysis status and number of related articles found
- **State Management**: Persistent state tracking across sessions

## Architecture

### Folder Structure

```
news-neutralizer-extension/
├── manifest.json              # Extension manifest (MV3)
├── background/
│   ├── background.js          # Service worker (main logic)
│   ├── multi-source-fetcher.js # Article fetching & deduplication
│   └── news-api-handler.js    # News API placeholder
├── content/
│   └── content.js            # Content script for page scraping
├── popup/
│   ├── popup.html            # Extension popup UI
│   └── popup.js              # Popup logic
└── icons/
    ├── icon16.png
    ├── icon48.png
    └── icon128.png
```

### Message API

The extension uses Chrome's message passing API:

#### GET_STATE
Request current analysis state from background service worker.

```javascript
chrome.runtime.sendMessage({ type: 'GET_STATE' }, (response) => {
  console.log(response.state);
});
```

**Response:**
```javascript
{
  ok: true,
  state: {
    status: 'idle' | 'scraping' | 'fetching' | 'done' | 'error',
    timestamp: number,
    data: object | null,
    error: string | null
  }
}
```

#### ANALYZE_ACTIVE_TAB
Trigger analysis of the currently active tab.

```javascript
chrome.runtime.sendMessage({ type: 'ANALYZE_ACTIVE_TAB' }, (response) => {
  console.log(response.state);
});
```

**Pipeline:**
1. Sets badge to "..." (orange)
2. Scrapes current page via content script
3. Extracts keywords from title/text
4. Fetches related articles from news API
5. Updates badge with article count (green) or "!" on error (red)
6. Stores final state in chrome.storage.local

## Installation

1. Clone this repository
2. Open Chrome and navigate to `chrome://extensions/`
3. Enable "Developer mode" (top right)
4. Click "Load unpacked"
5. Select the extension directory

## Usage

1. Navigate to any news article
2. Click the News Neutralizer extension icon
3. Click "Analyze Current Page"
4. View the analysis results and related articles

## Testing

### Manual Testing

1. Load the extension in Chrome
2. Open `test-page.html` in a browser tab
3. Click the extension icon
4. Click "Analyze Current Page"
5. Verify:
   - Badge shows "..." then a number or "!"
   - Popup displays status updates
   - State persists when reopening popup

### Expected Behavior

- **Status transitions**: idle → scraping → fetching → done
- **Badge updates**: "" → "..." → "0" (or count)
- **State persistence**: State remains after popup closes
- **Error handling**: Shows "!" badge and error message on failure

## Development Notes

### News API Integration

The `background/news-api-handler.js` is currently a placeholder. To integrate a real news API:

1. Get an API key from a news service (e.g., NewsAPI.org)
2. Implement the `searchRelatedArticles` function
3. Return articles in the expected format:

```javascript
[
  {
    title: string,
    url: string,
    source: string,
    publishedAt: string,
    snippet: string
  }
]
```

### Content Script

The content script attempts to extract text in this order:
1. `<article>` element
2. Common content selectors (`main`, `[role="main"]`, `.article-content`, etc.)
3. Fallback to `body.innerText`

### State Management

State is stored in `chrome.storage.local` under the key `currentAnalysisState`. The state object includes:
- `status`: Current pipeline stage
- `timestamp`: Last update time
- `data`: Analysis results (keywords, related articles, etc.)
- `error`: Error message if status is 'error'

## Requirements Met

✅ Manifest.json references folder-based paths (background/background.js, content/content.js)  
✅ Background service worker implements GET_STATE and ANALYZE_ACTIVE_TAB messages  
✅ Complete analysis pipeline with state transitions and badge updates  
✅ Multi-source fetcher with deduplication and same-domain filtering  
✅ Placeholder news API handler with clear TODO and return type  
✅ Content script with safe page scraping  
✅ Popup can trigger analysis and view state  
✅ MV3 compliant

## License

See LICENSE file for details.
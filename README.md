# News Neutralizer Extension

A Chrome extension (Manifest V3) that analyzes news articles and finds alternative perspectives from multiple sources.

## Features

- 🔍 **On-Demand Analysis**: Analyze any news article with a single click
- 🎯 **Keyword Extraction**: Automatically extracts key topics from articles
- 📰 **Multi-Source Fetching**: Finds related articles from various news sources
- 🎨 **Visual Feedback**: Badge indicators show analysis status (analyzing, complete, error)
- 💾 **Persistent State**: Results saved in chrome.storage for quick access

## Project Structure

```
news-neutralizer-extension/
├── manifest.json              # MV3 manifest with correct paths
├── background/
│   ├── background.js          # Main orchestrator (service worker)
│   ├── keyword-extractor.js   # Keyword extraction utility
│   ├── multi-source-fetcher.js # Related article fetcher
│   └── news-api-handler.js    # News API adapter (placeholder)
├── content/
│   └── content.js            # Page scraping script
├── analysis/
│   ├── narrative-analyzer.js  # Narrative analysis (placeholder)
│   └── cross-summary.js      # Cross-perspective summary (placeholder)
├── popup/
│   ├── index.html            # Popup UI
│   └── popup.js              # Popup logic
└── icons/                    # Extension icons
```

## Installation

### For Development

1. Clone the repository:
   ```bash
   git clone https://github.com/chathnindu/news-neutralizer-extension.git
   cd news-neutralizer-extension
   ```

2. Load the extension in Chrome:
   - Open Chrome and navigate to `chrome://extensions/`
   - Enable "Developer mode" (toggle in top right)
   - Click "Load unpacked"
   - Select the `news-neutralizer-extension` folder

3. The extension icon should appear in your toolbar!

## Usage

1. **Navigate to a news article** on any website
2. **Click the News Neutralizer icon** in your toolbar
3. **Click "Analyze Active Tab"** button in the popup
4. **View results**:
   - Extracted keywords from the article
   - Related articles from other sources (when API is configured)
   - Analysis status and metadata

## Badge Indicators

- **`...` (Orange)**: Analysis in progress
- **`0-9` (Green)**: Analysis complete, shows number of related sources found
- **`!` (Red)**: Analysis error occurred

## Message Flow

### Popup → Background
- `GET_STATE`: Request current analysis state
- `ANALYZE_ACTIVE_TAB`: Trigger analysis on active tab

### Background → Content Script
- `SCRAPE_PAGE`: Request page content extraction

## Analysis Pipeline

The background service worker orchestrates the following steps:

1. **Set loading badge** (orange "...")
2. **Scrape page content** via content script
3. **Extract keywords** using heuristic algorithm
4. **Find related articles** from news APIs
5. **Run analysis modules** (narrative analysis, cross-summary)
6. **Store results** in chrome.storage.local
7. **Set success badge** (green with count)

## API Integration

The `background/news-api-handler.js` is currently a placeholder. To integrate real news APIs:

1. Choose a news API service:
   - [NewsAPI](https://newsapi.org/)
   - [News Data API](https://newsdata.io/)
   - [GNews API](https://gnews.io/)
   - [The Guardian API](https://open-platform.theguardian.com/)

2. Add your API key to the handler
3. Implement the `searchRelatedArticles` function
4. Follow the documented return format

## Configuration

All configuration is handled through:
- `manifest.json` - Extension permissions and entry points
- `chrome.storage.local` - Runtime state storage
- Environment-specific settings can be added as needed

## MV3 Compliance

This extension is fully compliant with Manifest V3:
- ✅ Uses service worker for background tasks
- ✅ ES modules for imports/exports
- ✅ chrome.storage.local for persistence
- ✅ Proper async message handling (return true pattern)
- ✅ No eval() or remote code execution

## Future Enhancements

- [ ] Integrate real news API
- [ ] Implement sentiment analysis
- [ ] Add bias detection
- [ ] Create Svelte 5 popup UI
- [ ] Add user preferences
- [ ] Support for multiple languages
- [ ] Bookmark and history features

## Development

### Testing the Pipeline

1. Open the extension popup on any news article
2. Open browser DevTools → Console
3. Click "Analyze Active Tab"
4. Monitor console logs for pipeline execution:
   - Background service worker logs
   - Content script logs
   - Message passing

### Debugging

- **Background logs**: `chrome://extensions/` → Extension details → "service worker" link
- **Content script logs**: Page DevTools → Console (filter by "Content script")
- **Popup logs**: Right-click popup → "Inspect"

## License

See LICENSE file for details.

## Contributing

Contributions welcome! Please ensure:
- MV3 compliance
- Proper error handling
- Console logging for debugging
- Documentation for new features
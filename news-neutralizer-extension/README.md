# News Neutralizer

Chrome extension: see how **multiple sources** cover the same story — neutral summary, bias detection, comparison.

## Flow

1. **Content script** extracts the article you’re reading (title + main text).
2. **Background worker** finds related articles (News API), compares narratives (AI), and generates a neutral summary (AI).
3. **Badge** shows `...` then `N` (sources analyzed).
4. **Popup** (Svelte 5) shows neutral summary, bias, comparison view, and source cards.

## Setup

1. **Build the popup (Svelte 5):**
   ```bash
   cd popup-src
   npm install
   npm run build
   ```
   This writes `popup/index.html` and `popup/assets/`.

2. **Load the extension:**  
   Chrome → `chrome://extensions` → Developer mode → **Load unpacked** → select this folder.

3. **Use:** Open a news article, click the extension icon, then **Get neutral view**.

## Project structure

- `background/` — orchestrator, content-detector, news-api-handler, multi-source-fetcher
- `content/` — page scraper (current tab)
- `analysis/` — bias-detector, narrative-analyzer, cross-summary
- `popup-src/` — Svelte 5 app (builds to `popup/`)
- `utils/` — api.js (DeepSeek), storage.js

See **HACKATHON.md** for work split and **DEMO.md** for the judges’ demo script.

## API keys

- **DeepSeek:** `utils/api.js` (bias/summary/narrative).
- **News API:** `background/news-api-handler.js` (related articles).

For production, move keys to settings and read from `chrome.storage`.

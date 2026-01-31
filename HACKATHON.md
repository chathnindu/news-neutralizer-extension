# News Neutralizer – Hackathon Guide (3–5 hours, 3 people)

## What This Extension Does (Wise News–style)

**Goal:** While the user reads a news article, the extension:

1. **Analyzes** the current page content (title + body).
2. **Finds other sources** covering the same story (search or known news APIs).
3. **Runs AI analysis** on this article + related articles:
   - **Bias** (bias-detector): score, direction, loaded language.
   - **Narrative** (narrative-analyzer): what sources agree on vs. differ on.
   - **Neutral summary** (cross-summary): one balanced summary from multiple sources.
4. **Shows the user** a neutral view + related links so they can “understand it even more.”

So it’s not a classic “scraper” that crawls the whole web. It:

- **Scrapes/reads** only: (1) the current tab’s article, (2) a few related articles (from search or API).
- **Uses AI** to compare them and produce a neutral summary + bias/narrative analysis.

---

## How the “News Scraper / Neutralizer” Flow Works

```
User reads article on NYT
         ↓
[Content Script detects article]
         ↓
[Background Worker starts analysis]
         ↓
    ┌────────────────────────────────┐
    │  1. Extract main topic/keywords │
    │  2. Search for related articles │  (News API)
    │  3. Top 3–5 sources (API data)  │
    │  4. Compare narratives         │  (AI)
    │  5. Generate neutral summary   │  (AI)
    └────────────────────────────────┘
         ↓
[Badge shows "N sources analyzed"]
         ↓
[User clicks → sees comparison]
```

**Step 1 — Auto-detection:** Content script extracts title + main text from the current page.

**Step 2 — Background analysis:** Service worker (no blocking):
- Extracts main topic/keywords (content-detector).
- Searches News API for related articles (news-api-handler).
- Takes top 3–5 sources (multi-source-fetcher; uses API snippets, no CORS scrape).
- Runs bias on each article, narrative comparison, then cross-source neutral summary.

**Step 3 — Badge:** `chrome.action.setBadgeText` shows `...` then `N` (sources analyzed).

**Step 4 — Popup (Svelte 5):** Neutral summary, bias, comparison view (what sources agree on / where they differ), source cards.

---

## Tech Stack

| Layer            | Choice              |
|------------------|---------------------|
| Extension        | Chrome MV3          |
| Background       | Vanilla JS (service worker) |
| AI               | DeepSeek API (`utils/api.js`) |
| Related articles | News API (newsapi.org) — key in `background/news-api-handler.js` |
| “Scraping”       | Content script DOM (current tab) + News API data (related articles) |
| Storage          | chrome.storage.local/sync (`utils/storage.js`) |
| Popup UI         | **Svelte 5** (build from `popup-src/` → `popup/`) |

**No backend:** Everything in the extension. News API is called from the background; if CORS blocks in production, use a small proxy or server-side key.

---

## How to Divide Work (3 people, 3–5 hours)

### Person 1 – Content + “Scraping” + Background orchestration (≈1.5 h)

- **Content script**
  - Detect if the page is a news article (URL patterns + DOM).
  - Extract `title` and main text (selectors: `article`, `main`, `[role="main"]`, `.post-content`, etc.).
  - Send `{ url, title, content, source }` to background (e.g. `chrome.runtime.sendMessage`).
- **Background**
  - Receive message; optionally call “related articles” (can be a stub that returns `[]` for MVP).
  - Call `biasDetector.analyzeArticle(currentArticle)`.
  - If you have 2+ articles: `narrativeAnalyzer.compareNarratives(articles)` and `crossSummaryGenerator.generateNeutralSummary(articles, narrativeResult)`; else only bias + single-article summary.
  - Save to `storage`; send result back to popup (e.g. via `chrome.runtime.sendMessage` or storage listener).
- **Script loading:** In background (service worker), you’ll need a single bundled file or `importScripts` of `api.js`, `storage.js`, then the three analysis scripts, in order.

### Person 2 – AI pipeline and wiring (≈1.5 h)

- **Ensure** `bias-detector.js`, `narrative-analyzer.js`, `cross-summary.js` use `deepseekAPI` and `storage` (already fixed in repo).
- **Orchestration in background:** One function `runFullAnalysis(currentArticle, relatedArticles)` that:
  1. Runs bias on current (and optionally on related).
  2. If ≥2 articles: runs narrative comparison, then cross-summary; else single-article summary path.
  3. Returns one object: `{ bias, narrative, neutralSummary, relatedLinks }`.
- **Caching:** Use existing `storage.cacheAnalysis()` so the same article isn’t re-analyzed every time.
- **Fallbacks:** If DeepSeek fails, your existing fallbacks (keyword bias, fallback summary) keep the popup from breaking.

### Person 3 – Popup UI + UX (≈1.5 h)

- **Popup**
  - Button: “Get neutral view” (or auto-trigger when popup opens on a news URL).
  - States: Loading → Result / Error.
  - Show:
    - **Neutral summary** (from `cross-summary`).
    - **Bias** (score + label from `bias-detector`).
    - **Consensus / disputed** (from `narrative-analyzer` / `cross-summary`).
    - **Other sources** (list of links).
- **Optional:** Small settings area (e.g. API key, or “analyze in background” toggle).
- **Styling:** Simple, readable; optional dark mode.

**Sync point (once):** Agree on the message/API between content → background and background → popup (e.g. `{ type: 'ANALYZE_PAGE' }`, `{ type: 'ANALYSIS_RESULT', payload: { ... } }`). Then each person can work in parallel.

---

## Project Structure

```
news-neutralizer-extension/
├── manifest.json
├── background/
│   ├── background.js           # Main orchestrator
│   ├── content-detector.js     # Auto-detect articles, topic/keywords (Person 1)
│   ├── multi-source-fetcher.js # Top 3–5 sources from API (Person 1)
│   └── news-api-handler.js     # News API search (Person 1)
├── content/
│   └── content.js              # Page scraper (current tab)
├── analysis/
│   ├── narrative-analyzer.js   # Compare narratives (Person 3)
│   ├── bias-detector.js        # Detect bias (Person 3)
│   └── cross-summary.js        # Multi-source summary (Person 3)
├── popup/                      # Built from popup-src (Person 2)
│   ├── index.html
│   └── assets/
├── popup-src/                   # Svelte 5 source (Person 2)
│   ├── src/
│   │   ├── App.svelte
│   │   ├── ComparisonView.svelte
│   │   └── SourceCard.svelte
│   ├── index.html
│   ├── package.json
│   └── vite.config.js
├── utils/
│   ├── api.js                  # DeepSeek API
│   └── storage.js
└── icons/
```

Your **AI analyzer** is exactly: `bias-detector.js` + `narrative-analyzer.js` + `cross-summary.js`, with `utils/api.js` and `utils/storage.js` as helpers. The “news scraper” is the content script that extracts the current article and (optionally) the step that finds related articles.

---

## MVP in 3 Hours (if time is tight)

1. **Content script:** Extract title + body from current tab; send to background.
2. **Background:** Run only **bias-detector** on that one article; optionally run **cross-summary** with a single article (your code can support 1 article with a small check).
3. **Popup:** Show bias score + one neutral summary; no “other sources” yet.
4. **Later:** Add “related articles” (search/API) and then full pipeline (narrative + multi-source neutral summary).

---

## Quick Reference: Your Modules

| File                  | Role |
|-----------------------|------|
| `utils/api.js`        | DeepSeek API (`deepseekAPI.sendMessage`, `sendMessageJSON`). |
| `utils/storage.js`    | Cache analysis, related articles, preferences (`storage`). |
| `analysis/bias-detector.js` | `biasDetector.analyzeArticle(article)` → bias score, direction, framing. |
| `analysis/narrative-analyzer.js` | `narrativeAnalyzer.compareNarratives(articles)` → consensus, differences. |
| `analysis/cross-summary.js` | `crossSummaryGenerator.generateNeutralSummary(articles, narrative?)` → neutral summary, consensus facts, disputed points. |

Use these in the **background** (with scripts loaded via `importScripts` or one bundled file) so analysis runs in the background and the popup only displays results.

---

## Quick setup

1. **Build the popup (Svelte 5):**  
   `cd popup-src && npm install && npm run build`  
   This writes `popup/index.html` and `popup/assets/`. Load the extension only after this step.

2. **Load the extension:** Chrome → `chrome://extensions` → Developer mode → Load unpacked → select the project folder.

3. **Icon:** If loading fails, remove the `"default_icon"` line from `manifest.json` or add a 48×48 PNG at `icons/icon48.png`.

4. **API keys:**  
   - DeepSeek: `utils/api.js` (for bias/summary/narrative).  
   - News API: `background/news-api-handler.js` (key `7b7deb9282ce41b8a7f1f8d2eaf48789`).  
   For production, move keys to settings and read from `chrome.storage`.

# News Neutralizer — Demo Script for Judges

## Opening

**"Current news scrapers just summarize one article. We ask: what if you could instantly see how MULTIPLE sources cover the same story?"**

---

## Live Demo

1. **Open a NYT article** (or any major news site) about a current event.
2. **Extension badge** shows `...` while analyzing (background worker is running).
3. **Badge updates** to a number (e.g. `4`) — "4 sources found and analyzed."
4. **Click the extension icon** to open the popup.
5. **Show:**
   - **Neutral summary** — what the story is about, in balanced language.
   - **What all sources agree on** — consensus facts.
   - **Where they differ** — different angles, framing, or facts.
   - **Bias (current article)** — score and short assessment.
   - **Sources** — list of the analyzed articles (current + related); click to open.

---

## Closing

**"In a few seconds, you go from reading ONE perspective to understanding the FULL story across multiple sources. That's the power of News Neutralizer."**

---

## Flow Recap (for judges)

1. **Content script** detects the article and extracts title + main text from the page you’re reading.
2. **Background worker** (no blocking):
   - Extracts main topic/keywords.
   - Searches for related articles (News API).
   - Takes top 3–5 sources (using API data; no full-page scrape).
   - Compares narratives (AI).
   - Generates a neutral, cross-source summary (AI).
3. **Badge** shows "..." then "N" (sources analyzed).
4. **Popup** (Svelte 5): neutral summary, bias, comparison view, source cards.

---

## Clever Optimizations (to mention)

1. **Cache results** — Same article isn’t re-analyzed every time; cache TTL in storage.
2. **Progressive display** — Popup can show last result immediately; re-run analysis on demand.
3. **Limit scraping** — Only 3–5 related articles; use News API snippets to avoid CORS/scraping issues.

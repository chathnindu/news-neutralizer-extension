/**
 * ============================================
 * Popup Script - popup/popup.js (Simplified)
 * ============================================
 * 
 * Main popup with DIRECT API calls (no service worker routing).
 * This is more reliable for Chrome extensions.
 */

// ============================================
// Configuration
// ============================================

const AI_PROVIDERS = {
  gemini: {
    name: 'Google AI (Gemini)',
    baseUrl: 'https://generativelanguage.googleapis.com/v1beta/models',
    model: 'gemini-2.0-flash',
    signupUrl: 'https://aistudio.google.com/app/apikey'
  },
  groq: {
    name: 'Groq',
    baseUrl: 'https://api.groq.com/openai/v1/chat/completions',
    model: 'llama-3.3-70b-versatile',
    signupUrl: 'https://console.groq.com/keys'
  }
};

const NEWS_PROVIDERS = {
  gnews: {
    name: 'GNews',
    baseUrl: 'https://gnews.io/api/v4/search',
    signupUrl: 'https://gnews.io/register'
  }
};

// ============================================
// DOM Elements
// ============================================

const mainView = document.getElementById('main-view');
const settingsView = document.getElementById('settings-view');
const statusEl = document.getElementById('status');
const notConfiguredEl = document.getElementById('not-configured');
const analyzeBtn = document.getElementById('analyze-btn');
const resultsEl = document.getElementById('results');

// Result elements
const sourceBadgeEl = document.getElementById('source-badge');
const summaryTextEl = document.getElementById('summary-text');
const keyFactsEl = document.getElementById('key-facts');
const factsListEl = document.getElementById('facts-list');
const biasLabelEl = document.getElementById('bias-label');
const scoreFillEl = document.getElementById('score-fill');
const biasValueEl = document.getElementById('bias-value');
const biasDirectionEl = document.getElementById('bias-direction');
const biasAssessmentEl = document.getElementById('bias-assessment');
const toggleComparisonBtn = document.getElementById('toggle-comparison');
const comparisonSection = document.getElementById('comparison-section');
const consensusListEl = document.getElementById('consensus-list');
const differencesListEl = document.getElementById('differences-list');
const sourcesListEl = document.getElementById('sources-list');

// Settings elements
const settingsBtn = document.getElementById('settings-btn');
const openSettingsBtn = document.getElementById('open-settings');
const backBtn = document.getElementById('back-btn');
const saveSettingsBtn = document.getElementById('save-settings');
const aiProviderSelect = document.getElementById('ai-provider');
const aiKeyInput = document.getElementById('ai-key');
const newsProviderSelect = document.getElementById('news-provider');
const newsKeyInput = document.getElementById('news-key');
const aiSignupLink = document.getElementById('ai-signup-link');
const newsSignupLink = document.getElementById('news-signup-link');

// ============================================
// Storage Helpers (using chrome.storage.local)
// ============================================

async function getConfig() {
  const result = await chrome.storage.local.get(['aiProvider', 'aiApiKey', 'newsProvider', 'newsApiKey']);
  return {
    aiProvider: result.aiProvider || 'gemini',
    aiApiKey: result.aiApiKey || '',
    newsProvider: result.newsProvider || 'gnews',
    newsApiKey: result.newsApiKey || ''
  };
}

async function saveConfig(config) {
  await chrome.storage.local.set(config);
}

async function isConfigured() {
  const config = await getConfig();
  return !!(config.aiApiKey && config.newsApiKey);
}

// ============================================
// View Management
// ============================================

function showMainView() {
  mainView.classList.remove('hidden');
  settingsView.classList.add('hidden');
}

function showSettingsView() {
  mainView.classList.add('hidden');
  settingsView.classList.remove('hidden');
  loadSettings();
}

function updateSignupLinks() {
  const aiProvider = aiProviderSelect.value;
  const newsProvider = newsProviderSelect.value;
  aiSignupLink.href = AI_PROVIDERS[aiProvider]?.signupUrl || '#';
  newsSignupLink.href = NEWS_PROVIDERS[newsProvider]?.signupUrl || '#';
}

// ============================================
// Status Messages
// ============================================

function showStatus(message, type = 'loading') {
  statusEl.textContent = message;
  statusEl.className = `status ${type}`;
  statusEl.classList.remove('hidden');
}

function hideStatus() {
  statusEl.classList.add('hidden');
}

// ============================================
// Settings
// ============================================

async function loadSettings() {
  const config = await getConfig();
  aiProviderSelect.value = config.aiProvider;
  aiKeyInput.value = config.aiApiKey;
  newsProviderSelect.value = config.newsProvider;
  newsKeyInput.value = config.newsApiKey;
  updateSignupLinks();
}

async function saveSettings() {
  await saveConfig({
    aiProvider: aiProviderSelect.value,
    aiApiKey: aiKeyInput.value.trim(),
    newsProvider: newsProviderSelect.value,
    newsApiKey: newsKeyInput.value.trim()
  });

  showStatus('Settings saved!', 'success');
  setTimeout(() => {
    hideStatus();
    showMainView();
    checkConfiguration();
  }, 1000);
}

async function checkConfiguration() {
  const configured = await isConfigured();
  if (configured) {
    notConfiguredEl.classList.add('hidden');
    analyzeBtn.classList.remove('hidden');
  } else {
    notConfiguredEl.classList.remove('hidden');
    analyzeBtn.classList.add('hidden');
  }
  return configured;
}

// ============================================
// API Calls (Direct - no service worker)
// ============================================

/**
 * Call Gemini API directly
 */
async function callGemini(prompt, apiKey) {
  const config = AI_PROVIDERS.gemini;
  const url = `${config.baseUrl}/${config.model}:generateContent?key=${apiKey}`;

  console.log('🤖 Calling Gemini API...');

  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [{ parts: [{ text: prompt }] }],
      generationConfig: { maxOutputTokens: 4096, temperature: 0.7 }
    })
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    console.error('Gemini error:', error);
    throw new Error(error.error?.message || `Gemini API error: ${response.status}`);
  }

  const data = await response.json();
  const text = data.candidates?.[0]?.content?.parts?.[0]?.text;

  if (!text) {
    throw new Error('No response from Gemini');
  }

  return text;
}

/**
 * Call Groq API directly
 */
async function callGroq(prompt, apiKey) {
  const config = AI_PROVIDERS.groq;

  console.log('🤖 Calling Groq API...');

  const response = await fetch(config.baseUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`
    },
    body: JSON.stringify({
      model: config.model,
      messages: [{ role: 'user', content: prompt }],
      max_tokens: 4096
    })
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.error?.message || `Groq API error: ${response.status}`);
  }

  const data = await response.json();
  return data.choices?.[0]?.message?.content || '';
}

/**
 * Send prompt to configured AI provider
 */
async function sendToAI(prompt) {
  const config = await getConfig();

  if (!config.aiApiKey) {
    throw new Error('AI API key not configured');
  }

  switch (config.aiProvider) {
    case 'gemini':
      return callGemini(prompt, config.aiApiKey);
    case 'groq':
      return callGroq(prompt, config.aiApiKey);
    default:
      return callGemini(prompt, config.aiApiKey);
  }
}

/**
 * Send prompt and parse as JSON
 */
async function sendToAIJSON(prompt) {
  const fullPrompt = `${prompt}\n\nIMPORTANT: Respond ONLY with valid JSON. No markdown, no explanation.`;
  const response = await sendToAI(fullPrompt);

  // Clean up response
  const cleaned = response
    .replace(/```json\n?/g, '')
    .replace(/```\n?/g, '')
    .trim();

  return JSON.parse(cleaned);
}

/**
 * Search GNews for related articles
 */
async function searchNews(query) {
  const config = await getConfig();

  if (!config.newsApiKey) {
    console.warn('News API key not configured, skipping search');
    return [];
  }

  // Clean query
  const cleanQuery = query
    .replace(/[^\w\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, 100);

  const params = new URLSearchParams({
    q: cleanQuery,
    apikey: config.newsApiKey,
    max: '5',
    lang: 'en'
  });

  const url = `${NEWS_PROVIDERS.gnews.baseUrl}?${params}`;
  console.log('🔍 Searching news...');

  try {
    const response = await fetch(url);

    if (!response.ok) {
      console.warn('News search failed:', response.status);
      return [];
    }

    const data = await response.json();
    return (data.articles || []).map(a => ({
      url: a.url,
      title: a.title,
      content: a.content || a.description || '',
      source: a.source?.name || 'Unknown'
    }));
  } catch (error) {
    console.warn('News search error:', error);
    return [];
  }
}

// ============================================
// Analysis
// ============================================

async function runAnalysis() {
  analyzeBtn.classList.add('loading');
  analyzeBtn.disabled = true;
  resultsEl.classList.add('hidden');

  showStatus('Extracting article content...', 'loading');

  try {
    // Get current tab
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (!tab?.id) throw new Error('No active tab found');

    // Try to inject content script first (in case it wasn't loaded)
    try {
      await chrome.scripting.executeScript({
        target: { tabId: tab.id },
        files: ['content/content.js']
      });
      console.log('📜 Content script injected');
    } catch (e) {
      console.log('📜 Content script already loaded or injection failed:', e.message);
    }

    // Small delay to let script initialize
    await new Promise(r => setTimeout(r, 100));

    // Extract article from page
    let extractResult;
    try {
      extractResult = await chrome.tabs.sendMessage(tab.id, { type: 'GET_ARTICLE' });
    } catch (error) {
      console.error('Message failed:', error);
      throw new Error('Could not access page. Try refreshing the page and trying again.');
    }

    if (!extractResult?.ok) {
      throw new Error(extractResult?.error || 'Failed to extract article');
    }

    const article = extractResult.article;

    if (!article.content || article.content.length < 100) {
      throw new Error('Not enough content. Make sure you\'re on a news article.');
    }

    console.log('📰 Article extracted:', article.title);

    // Search for related articles
    showStatus('Finding related sources...', 'loading');
    const relatedArticles = await searchNews(article.title);
    console.log(`📚 Found ${relatedArticles.length} related articles`);

    // Analyze with AI
    showStatus('Analyzing with AI...', 'loading');

    const allArticles = [article, ...relatedArticles];
    const articlesText = allArticles.map((a, i) =>
      `Source ${i + 1} (${a.source}): ${a.content.substring(0, 1500)}`
    ).join('\n\n');

    const prompt = `Analyze this news article for bias and create a neutral summary.

${articlesText}

Respond with JSON:
{
  "summary": "A neutral, factual summary in 100-200 words",
  "keyFacts": ["Fact 1", "Fact 2", "Fact 3"],
  "biasScore": 0.0-1.0 (0=neutral, 1=very biased),
  "biasDirection": "neutral" | "left-leaning" | "right-leaning" | "sensationalist",
  "biasAssessment": "Brief explanation of bias"
}`;

    const result = await sendToAIJSON(prompt);

    // Display results
    hideStatus();
    displayResults({
      summary: { text: result.summary, keyFacts: result.keyFacts || [] },
      bias: {
        score: result.biasScore || 0,
        direction: result.biasDirection || 'neutral',
        assessment: result.biasAssessment || '',
        label: getBiasLabel(result.biasScore || 0)
      },
      sources: allArticles.map(a => ({ url: a.url, title: a.title, source: a.source })),
      sourceCount: allArticles.length
    });

  } catch (error) {
    console.error('Analysis failed:', error);
    showStatus(error.message || 'Analysis failed', 'error');
  } finally {
    analyzeBtn.classList.remove('loading');
    analyzeBtn.disabled = false;
  }
}

function getBiasLabel(score) {
  if (score < 0.2) return 'Minimal Bias';
  if (score < 0.4) return 'Slight Bias';
  if (score < 0.6) return 'Moderate Bias';
  if (score < 0.8) return 'Significant Bias';
  return 'Extreme Bias';
}

function displayResults(result) {
  resultsEl.classList.remove('hidden');

  // Source count
  sourceBadgeEl.querySelector('.badge').textContent =
    `${result.sourceCount} source${result.sourceCount > 1 ? 's' : ''} analyzed`;

  // Summary
  summaryTextEl.textContent = result.summary?.text || '-';

  if (result.summary?.keyFacts?.length > 0) {
    keyFactsEl.classList.remove('hidden');
    factsListEl.innerHTML = result.summary.keyFacts
      .map(fact => `<li>${escapeHtml(fact)}</li>`)
      .join('');
  } else {
    keyFactsEl.classList.add('hidden');
  }

  // Bias
  const biasPercent = Math.round((result.bias?.score || 0) * 100);
  biasLabelEl.textContent = result.bias?.label || 'Unknown';
  scoreFillEl.style.width = `${biasPercent}%`;
  biasValueEl.textContent = `${biasPercent}%`;
  biasDirectionEl.textContent = formatDirection(result.bias?.direction);
  biasAssessmentEl.textContent = result.bias?.assessment || '';

  // Sources
  if (result.sources?.length > 0) {
    sourcesListEl.innerHTML = result.sources
      .map(s => `
                <a href="${escapeHtml(s.url || '#')}" target="_blank" class="source-item">
                    <span class="title">${escapeHtml(s.title || 'Untitled')}</span>
                    <span class="meta">${escapeHtml(s.source || 'Unknown')}</span>
                </a>
            `)
      .join('');
  }

  // Hide comparison for now (simplified)
  toggleComparisonBtn.classList.add('hidden');
}

function formatDirection(direction) {
  const labels = {
    'neutral': '✅ Neutral',
    'left-leaning': '⬅️ Left-leaning',
    'right-leaning': '➡️ Right-leaning',
    'sensationalist': '⚡ Sensationalist'
  };
  return labels[direction] || direction || 'Unknown';
}

function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text || '';
  return div.innerHTML;
}

// ============================================
// Event Listeners
// ============================================

settingsBtn.addEventListener('click', showSettingsView);
openSettingsBtn.addEventListener('click', showSettingsView);
backBtn.addEventListener('click', showMainView);
aiProviderSelect.addEventListener('change', updateSignupLinks);
newsProviderSelect.addEventListener('change', updateSignupLinks);
saveSettingsBtn.addEventListener('click', saveSettings);
analyzeBtn.addEventListener('click', runAnalysis);

toggleComparisonBtn?.addEventListener('click', () => {
  const isHidden = comparisonSection.classList.toggle('hidden');
  toggleComparisonBtn.textContent = isHidden ? 'Show Comparison ▼' : 'Hide Comparison ▲';
});

// ============================================
// Initialize
// ============================================

(async function init() {
  await checkConfiguration();
})();

<script>
  let status = $state('idle'); // idle | loading | done | error
  let errorMessage = $state('');
  let result = $state(null);
  let showComparison = $state(false);

  async function runAnalysis() {
    status = 'loading';
    errorMessage = '';
    result = null;

    try {
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      if (!tab?.id) {
        status = 'error';
        errorMessage = 'No active tab';
        return;
      }

      const article = await chrome.tabs.sendMessage(tab.id, { type: 'GET_PAGE_ARTICLE' });
      if (chrome.runtime.lastError) {
        status = 'error';
        errorMessage = 'Open a news article page first.';
        return;
      }
      if (!article?.content || article.content.length < 50) {
        status = 'error';
        errorMessage = 'Could not find enough text on this page.';
        return;
      }

      const res = await chrome.runtime.sendMessage({ type: 'ANALYZE_PAGE', payload: article });
      if (res?.ok) {
        result = res;
        status = 'done';
      } else {
        status = 'error';
        errorMessage = res?.error || 'Analysis failed';
      }
    } catch (e) {
      status = 'error';
      errorMessage = e?.message || 'Something went wrong';
    }
  }

  async function loadLastResult() {
    const last = await chrome.runtime.sendMessage({ type: 'GET_LAST_RESULT' });
    if (last?.ok) {
      result = last;
      status = 'done';
    }
  }

  $effect(() => {
    loadLastResult();
  });
</script>

<main class="popup">
  <header>
    <h1>News Neutralizer</h1>
    <p class="subtitle">See how multiple sources cover the same story</p>
  </header>

  {#if status === 'idle' || status === 'error'}
    <button class="primary" onclick={runAnalysis} disabled={status === 'loading'}>
      Get neutral view
    </button>
  {/if}

  {#if status === 'loading'}
    <div class="status loading">Analyzing… (searching related sources)</div>
  {/if}

  {#if status === 'error'}
    <div class="status error">{errorMessage}</div>
  {/if}

  {#if status === 'done' && result}
    <div class="badge-row">
      <span class="badge">{result.sourceCount} sources analyzed</span>
    </div>

    <section class="card summary-card">
      <h2>Neutral summary</h2>
      <p>{result.neutralSummary?.summary ?? '—'}</p>
    </section>

    <section class="card bias-card">
      <h2>Bias (current article)</h2>
      <p class="bias-label">{result.biasLabel ?? '—'} (score: {result.bias?.biasScore != null ? (result.bias.biasScore).toFixed(2) : '—'})</p>
      {#if result.bias?.overallAssessment}
        <p class="muted">{result.bias.overallAssessment}</p>
      {/if}
    </section>

    <button class="secondary" onclick={() => showComparison = !showComparison}>
      {showComparison ? 'Hide' : 'Show'} comparison
    </button>

    {#if showComparison}
      <ComparisonView {result} />
    {/if}

    <section class="sources-section">
      <h2>Sources</h2>
      <div class="source-grid">
        {#each result.sources ?? [] as source}
          <SourceCard {source} />
        {/each}
      </div>
    </section>
  {/if}
</main>

<style>
  .popup {
    width: 380px;
    min-height: 320px;
    padding: 16px;
    font-family: system-ui, -apple-system, sans-serif;
    font-size: 14px;
  }
  header {
    margin-bottom: 12px;
  }
  h1 {
    margin: 0;
    font-size: 18px;
  }
  .subtitle {
    margin: 4px 0 0;
    color: #64748b;
    font-size: 12px;
  }
  .primary {
    width: 100%;
    padding: 10px 16px;
    font-size: 14px;
    background: #2563eb;
    color: white;
    border: none;
    border-radius: 8px;
    cursor: pointer;
  }
  .primary:hover {
    background: #1d4ed8;
  }
  .primary:disabled {
    background: #94a3b8;
    cursor: not-allowed;
  }
  .secondary {
    width: 100%;
    margin-top: 8px;
    padding: 8px 12px;
    font-size: 13px;
    background: #f1f5f9;
    color: #475569;
    border: 1px solid #e2e8f0;
    border-radius: 6px;
    cursor: pointer;
  }
  .secondary:hover {
    background: #e2e8f0;
  }
  .status {
    margin-top: 12px;
    padding: 8px 12px;
    border-radius: 6px;
  }
  .status.loading {
    background: #e0f2fe;
    color: #0369a1;
  }
  .status.error {
    background: #fee2e2;
    color: #b91c1c;
  }
  .badge-row {
    margin-bottom: 12px;
  }
  .badge {
    display: inline-block;
    padding: 4px 10px;
    background: #2563eb;
    color: white;
    border-radius: 999px;
    font-size: 12px;
    font-weight: 600;
  }
  .card {
    margin-bottom: 12px;
    padding: 12px;
    background: #f8fafc;
    border-radius: 8px;
    border-left: 3px solid #e2e8f0;
  }
  .card h2 {
    margin: 0 0 8px;
    font-size: 12px;
    text-transform: uppercase;
    color: #64748b;
  }
  .card p {
    margin: 0;
    line-height: 1.5;
  }
  .bias-label {
    font-weight: 600;
  }
  .muted {
    margin-top: 6px !important;
    color: #64748b;
    font-size: 13px;
  }
  .sources-section {
    margin-top: 16px;
  }
  .sources-section h2 {
    margin: 0 0 8px;
    font-size: 12px;
    text-transform: uppercase;
    color: #64748b;
  }
  .source-grid {
    display: flex;
    flex-direction: column;
    gap: 8px;
  }
</style>

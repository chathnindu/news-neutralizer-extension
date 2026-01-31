(function () {
  const analyzeBtn = document.getElementById('analyze');
  const statusEl = document.getElementById('status');
  const resultEl = document.getElementById('result');
  const badgeRow = document.getElementById('badge-row');
  const summaryCard = document.getElementById('summary-card');
  const biasCard = document.getElementById('bias-card');
  const toggleComparison = document.getElementById('toggle-comparison');
  const comparisonEl = document.getElementById('comparison');
  const sourcesSection = document.getElementById('sources');
  const sourceList = document.getElementById('source-list');

  function showStatus(text, type) {
    statusEl.textContent = text;
    statusEl.className = 'status ' + (type || '');
    statusEl.classList.remove('hidden');
  }

  function showResult(data) {
    resultEl.classList.remove('hidden');
    badgeRow.innerHTML = '';
    summaryCard.innerHTML = '';
    biasCard.innerHTML = '';
    comparisonEl.innerHTML = '';
    sourceList.innerHTML = '';
    badgeRow.classList.add('hidden');
    summaryCard.classList.add('hidden');
    biasCard.classList.add('hidden');
    toggleComparison.classList.add('hidden');
    comparisonEl.classList.add('hidden');
    sourcesSection.classList.add('hidden');

    if (data.bias) {
      const b = data.bias;
      const label = data.biasLabel || (b.biasScore < 0.4 ? 'Low' : b.biasScore < 0.7 ? 'Moderate' : 'High');
      biasCard.classList.remove('hidden');
      biasCard.innerHTML = '<h2>Bias (current article)</h2><p class="bias-label">' + label + ' (score: ' + (b.biasScore != null ? b.biasScore.toFixed(2) : '—') + ')</p>' + (b.overallAssessment ? '<p class="muted">' + b.overallAssessment + '</p>' : '');
    }

    if (data.neutralSummary && data.neutralSummary.summary) {
      summaryCard.classList.remove('hidden');
      summaryCard.innerHTML = '<h2>Neutral summary</h2><p>' + data.neutralSummary.summary + '</p>';
    }

    const count = data.sourceCount || (data.sources && data.sources.length) || 0;
    if (count > 0) {
      badgeRow.classList.remove('hidden');
      badgeRow.innerHTML = '<span class="badge">' + count + ' sources analyzed</span>';
    }

    const narrative = data.narrative;
    const summary = data.neutralSummary;
    const consensus = (narrative && narrative.commonPoints) || (summary && summary.consensusFacts) || [];
    const differences = (narrative && narrative.differences) || (summary && summary.disputedPoints) || [];
    if (consensus.length > 0 || differences.length > 0) {
      toggleComparison.classList.remove('hidden');
      toggleComparison.textContent = 'Show comparison';
      comparisonEl.classList.add('hidden');
      comparisonEl.innerHTML = '<h3>What sources agree on</h3><ul>' + consensus.map(function (c) { return '<li>' + (typeof c === 'string' ? c : (c.claim || JSON.stringify(c))) + '</li>'; }).join('') + '</ul><h3>Where they differ</h3><ul>' + differences.map(function (d) { return '<li>' + (typeof d === 'string' ? d : (d.aspect ? d.aspect + ': ' + JSON.stringify(d.sourceViews || d.sources || '') : (d.claim || JSON.stringify(d)))) + '</li>'; }).join('') + '</ul>';
      toggleComparison.onclick = function () {
        if (comparisonEl.classList.contains('hidden')) {
          comparisonEl.classList.remove('hidden');
          toggleComparison.textContent = 'Hide comparison';
        } else {
          comparisonEl.classList.add('hidden');
          toggleComparison.textContent = 'Show comparison';
        }
      };
    }

    if (data.sources && data.sources.length > 0) {
      sourcesSection.classList.remove('hidden');
      data.sources.forEach(function (s) {
        const a = document.createElement('a');
        a.href = s.url || '#';
        a.target = '_blank';
        a.rel = 'noopener noreferrer';
        a.className = 'source-card';
        const meta = s.biasDirection ? ' · ' + s.biasDirection + ' (' + (s.biasScore != null ? (s.biasScore * 100).toFixed(0) + '%' : '—') + ')' : '';
        a.innerHTML = '<span class="title">' + (s.title || 'Untitled') + '</span><span class="meta">' + (s.source || '') + meta + '</span>';
        sourceList.appendChild(a);
      });
    }
  }

  function loadLastResult() {
    chrome.runtime.sendMessage({ type: 'GET_LAST_RESULT' }, function (last) {
      if (last && last.ok) {
        showResult(last);
      }
    });
  }

  loadLastResult();

  analyzeBtn.addEventListener('click', function () {
    analyzeBtn.disabled = true;
    resultEl.classList.add('hidden');
    showStatus('Getting page content…', 'loading');

    chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
      var tab = tabs[0];
      if (!tab || !tab.id) {
        showStatus('No active tab', 'error');
        analyzeBtn.disabled = false;
        return;
      }
      chrome.tabs.sendMessage(tab.id, { type: 'GET_PAGE_ARTICLE' }, function (article) {
        if (chrome.runtime.lastError) {
          showStatus('Open a news article page first.', 'error');
          analyzeBtn.disabled = false;
          return;
        }
        if (!article || !article.content || article.content.length < 50) {
          showStatus('Could not find enough text on this page.', 'error');
          analyzeBtn.disabled = false;
          return;
        }
        showStatus('Analyzing… (searching related sources)', 'loading');
        chrome.runtime.sendMessage({ type: 'ANALYZE_PAGE', payload: article }, function (res) {
          analyzeBtn.disabled = false;
          if (res && res.ok) {
            showStatus('Done.', 'loading');
            statusEl.classList.remove('loading');
            statusEl.classList.add('hidden');
            showResult(res);
          } else {
            showStatus(res && res.error ? res.error : 'Analysis failed', 'error');
          }
        });
      });
    });
  });
})();

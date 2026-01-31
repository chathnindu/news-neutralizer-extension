(function () {
  const analyzeBtn = document.getElementById('analyze');
  const statusEl = document.getElementById('status');
  const resultEl = document.getElementById('result');
  const biasSection = document.getElementById('bias-section');
  const summarySection = document.getElementById('summary-section');
  const relatedSection = document.getElementById('related-section');

  function showStatus(text, type) {
    statusEl.textContent = text;
    statusEl.className = 'status ' + (type || '');
    statusEl.classList.remove('hidden');
  }

  function showResult(data) {
    resultEl.classList.remove('hidden');
    biasSection.innerHTML = '';
    summarySection.innerHTML = '';
    relatedSection.innerHTML = '';
    relatedSection.classList.add('hidden');

    if (data.bias) {
      const b = data.bias;
      const label = data.biasLabel || (b.biasScore < 0.4 ? 'Low' : b.biasScore < 0.7 ? 'Moderate' : 'High');
      biasSection.innerHTML = '<h3>Bias</h3><p class="score">' + label + ' (score: ' + (Math.round(b.biasScore * 100) / 100) + ')</p><p>' + (b.overallAssessment || b.biasDirection || '') + '</p>';
    }

    if (data.neutralSummary && data.neutralSummary.summary) {
      summarySection.innerHTML = '<h3>Neutral summary</h3><p>' + data.neutralSummary.summary + '</p>';
    }

    if (data.relatedLinks && data.relatedLinks.length > 0) {
      relatedSection.classList.remove('hidden');
      const ul = document.createElement('ul');
      data.relatedLinks.forEach(function (link) {
        const li = document.createElement('li');
        const a = document.createElement('a');
        a.href = link.url || link;
        a.target = '_blank';
        a.rel = 'noopener';
        a.textContent = link.title || link.url || link;
        li.appendChild(a);
        ul.appendChild(li);
      });
      relatedSection.appendChild(document.createElement('h3')).textContent = 'Other sources';
      relatedSection.appendChild(ul);
    }
  }

  analyzeBtn.addEventListener('click', function () {
    analyzeBtn.disabled = true;
    resultEl.classList.add('hidden');
    showStatus('Getting page content…', 'loading');

    chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
      const tab = tabs[0];
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
        showStatus('Analyzing…', 'loading');
        chrome.runtime.sendMessage({ type: 'ANALYZE_PAGE', payload: article }, function (res) {
          analyzeBtn.disabled = false;
          if (res && res.ok) {
            showStatus('Done.', 'success');
            showResult(res);
          } else {
            showStatus(res && res.error ? res.error : 'Analysis failed', 'error');
          }
        });
      });
    });
  });
})();

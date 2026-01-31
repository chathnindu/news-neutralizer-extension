/**
 * Popup script for News Neutralizer
 * Communicates with background service worker to trigger analysis and display results
 */

const analyzeBtn = document.getElementById('analyzeBtn');
const refreshBtn = document.getElementById('refreshBtn');
const statusDiv = document.getElementById('status');
const resultsDiv = document.getElementById('results');

// Load initial state when popup opens
loadState();

// Analyze button click handler
analyzeBtn.addEventListener('click', async () => {
  analyzeBtn.disabled = true;
  analyzeBtn.textContent = 'Analyzing...';
  
  try {
    const response = await sendMessage({ type: 'ANALYZE_ACTIVE_TAB' });
    
    if (response.success) {
      console.log('Analysis started successfully');
      // Wait a moment then refresh state
      setTimeout(loadState, 500);
    } else {
      console.error('Analysis failed:', response.error);
      showError(response.error);
    }
  } catch (error) {
    console.error('Error sending analyze message:', error);
    showError(error.message);
  } finally {
    analyzeBtn.disabled = false;
    analyzeBtn.textContent = 'Analyze Active Tab';
  }
});

// Refresh button click handler
refreshBtn.addEventListener('click', () => {
  loadState();
});

/**
 * Load current state from background
 */
async function loadState() {
  try {
    const response = await sendMessage({ type: 'GET_STATE' });
    
    if (response.success) {
      displayState(response.state);
    } else {
      showError(response.error || 'Failed to load state');
    }
  } catch (error) {
    console.error('Error loading state:', error);
    showError(error.message);
  }
}

/**
 * Display state in UI
 */
function displayState(state) {
  statusDiv.className = `status-${state.status}`;
  
  // Update status text
  switch (state.status) {
    case 'idle':
      statusDiv.textContent = 'Status: Idle - Click "Analyze" to start';
      resultsDiv.innerHTML = '';
      break;
      
    case 'analyzing':
      statusDiv.textContent = 'Status: Analyzing...';
      resultsDiv.innerHTML = '<p>Please wait while we analyze the page...</p>';
      break;
      
    case 'complete':
      const time = new Date(state.timestamp).toLocaleTimeString();
      statusDiv.textContent = `Status: Complete (${time})`;
      displayResults(state);
      break;
      
    case 'error':
      statusDiv.textContent = `Status: Error - ${state.error}`;
      resultsDiv.innerHTML = '';
      break;
      
    default:
      statusDiv.textContent = `Status: ${state.status}`;
      resultsDiv.innerHTML = '';
  }
}

/**
 * Display analysis results
 */
function displayResults(state) {
  let html = '<h3>Original Article:</h3>';
  html += `<p><strong>${state.originalArticle.title}</strong></p>`;
  
  html += '<h3>Keywords:</h3>';
  if (state.keywords && state.keywords.length > 0) {
    html += '<ul>';
    state.keywords.forEach(keyword => {
      html += `<li>${keyword}</li>`;
    });
    html += '</ul>';
  } else {
    html += '<p>No keywords extracted</p>';
  }
  
  html += '<h3>Related Articles:</h3>';
  if (state.relatedArticles && state.relatedArticles.length > 0) {
    html += '<ul>';
    state.relatedArticles.forEach(article => {
      html += `<li><a href="${article.url}" target="_blank">${article.title}</a> (${article.source})</li>`;
    });
    html += '</ul>';
  } else {
    html += '<p>No related articles found</p>';
  }
  
  resultsDiv.innerHTML = html;
}

/**
 * Show error message
 */
function showError(message) {
  statusDiv.className = 'status-error';
  statusDiv.textContent = `Error: ${message}`;
}

/**
 * Send message to background script
 */
function sendMessage(message) {
  return new Promise((resolve, reject) => {
    chrome.runtime.sendMessage(message, (response) => {
      if (chrome.runtime.lastError) {
        reject(new Error(chrome.runtime.lastError.message));
      } else {
        resolve(response);
      }
    });
  });
}

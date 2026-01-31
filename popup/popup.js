// Popup script for News Neutralizer Extension

const analyzeBtn = document.getElementById('analyzeBtn');
const getStateBtn = document.getElementById('getStateBtn');
const statusDisplay = document.getElementById('statusDisplay');
const resultsDisplay = document.getElementById('resultsDisplay');

// Display status
function displayStatus(state) {
  if (!state) {
    statusDisplay.innerHTML = '<div class="status idle">No state available</div>';
    return;
  }
  
  const statusClass = state.status;
  let statusText = '';
  
  switch (state.status) {
    case 'idle':
      statusText = 'Ready to analyze';
      break;
    case 'scraping':
      statusText = 'Scraping page content...';
      break;
    case 'fetching':
      statusText = 'Fetching related articles...';
      break;
    case 'done':
      statusText = 'Analysis complete!';
      break;
    case 'error':
      statusText = `Error: ${state.error || 'Unknown error'}`;
      break;
    default:
      statusText = `Status: ${state.status}`;
  }
  
  const timestamp = new Date(state.timestamp).toLocaleTimeString();
  statusDisplay.innerHTML = `<div class="status ${statusClass}">${statusText}<br><small>${timestamp}</small></div>`;
  
  // Display results if available
  if (state.status === 'done' && state.data && state.data.relatedArticles) {
    displayResults(state.data);
  } else {
    resultsDisplay.innerHTML = '';
  }
}

// Display results
function displayResults(data) {
  const articles = data.relatedArticles || [];
  
  if (articles.length === 0) {
    resultsDisplay.innerHTML = '<div class="results"><p>No related articles found.</p></div>';
    return;
  }
  
  let html = '<div class="results">';
  html += `<p><strong>Found ${articles.length} related article(s):</strong></p>`;
  
  articles.forEach(article => {
    html += '<div class="result-item">';
    html += `<div class="result-title">${escapeHtml(article.title || 'Untitled')}</div>`;
    html += `<div class="result-source">${escapeHtml(article.source || 'Unknown source')}</div>`;
    html += '</div>';
  });
  
  html += '</div>';
  resultsDisplay.innerHTML = html;
}

// Escape HTML to prevent XSS
function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

// Get current state
async function getCurrentState() {
  try {
    const response = await chrome.runtime.sendMessage({ type: 'GET_STATE' });
    
    if (response && response.ok) {
      displayStatus(response.state);
    } else {
      statusDisplay.innerHTML = '<div class="status error">Failed to get state</div>';
    }
  } catch (error) {
    console.error('Error getting state:', error);
    statusDisplay.innerHTML = `<div class="status error">Error: ${error.message}</div>`;
  }
}

// Analyze current page
async function analyzeCurrentPage() {
  try {
    analyzeBtn.disabled = true;
    analyzeBtn.textContent = 'Analyzing...';
    
    statusDisplay.innerHTML = '<div class="status scraping">Starting analysis...</div>';
    resultsDisplay.innerHTML = '';
    
    const response = await chrome.runtime.sendMessage({ type: 'ANALYZE_ACTIVE_TAB' });
    
    if (response && response.ok) {
      displayStatus(response.state);
    } else {
      statusDisplay.innerHTML = `<div class="status error">Error: ${response?.error || 'Unknown error'}</div>`;
    }
  } catch (error) {
    console.error('Error analyzing page:', error);
    statusDisplay.innerHTML = `<div class="status error">Error: ${error.message}</div>`;
  } finally {
    analyzeBtn.disabled = false;
    analyzeBtn.textContent = 'Analyze Current Page';
  }
}

// Event listeners
analyzeBtn.addEventListener('click', analyzeCurrentPage);
getStateBtn.addEventListener('click', getCurrentState);

// Load initial state on popup open
getCurrentState();

// Poll for state updates every 2 seconds
setInterval(getCurrentState, 2000);

import { renderStats } from './components/stats.js';
import { renderSiteList } from './components/site-list.js';

// Get data from extension storage (via chrome.storage API or local server)
async function loadAnalyses() {
  // For hackathon, can use localStorage or simple JSON file
  const analyses = JSON.parse(localStorage.getItem('cookieAnalyses') || '[]');
  return analyses;
}

async function init() {
  const analyses = await loadAnalyses();
  
  renderStats(analyses, document.getElementById('stats'));
  renderSiteList(analyses, document.getElementById('site-list'));
  
  // Refresh every 5 seconds for demo
  setInterval(async () => {
    const updated = await loadAnalyses();
    renderStats(updated, document.getElementById('stats'));
    renderSiteList(updated, document.getElementById('site-list'));
  }, 5000);
}

init();
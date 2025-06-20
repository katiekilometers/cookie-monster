document.addEventListener('DOMContentLoaded', async () => {
    await loadPopupData();
    showDomainAnalysis();
    document.getElementById('refreshBtn').addEventListener('click', () => {
      loadPopupData();
      showDomainAnalysis();
    });
    document.getElementById('clearBtn').addEventListener('click', clearData);

    // Auto-refresh analysis after 3 seconds (in case LLM is slow)
    setTimeout(showDomainAnalysis, 3000);
  });
  
  async function loadPopupData() {
    try {
      const result = await chrome.storage.local.get(['cookiePopups']);
      const popups = result.cookiePopups || [];
      
      displayStats(popups);
      displayPopups(popups);
    } catch (error) {
      console.error('Error loading popup data:', error);
    }
  }
  
  function displayStats(popups) {
    const totalCount = popups.length;
    const uniqueDomains = new Set(popups.map(p => p.domain)).size;
    
    document.getElementById('totalCount').textContent = totalCount;
    document.getElementById('domainCount').textContent = uniqueDomains;
  }
  
  function displayPopups(popups) {
    const container = document.getElementById('popupsList');
    container.innerHTML = '';
    
    if (popups.length === 0) {
      container.innerHTML = '<div style="text-align: center; color: #666;">No popups detected yet</div>';
      return;
    }
    
    // Show last 10 popups
    const recentPopups = popups.slice(-10).reverse();
    
    recentPopups.forEach(popup => {
      const item = document.createElement('div');
      item.className = 'popup-item';
      
      const truncatedText = popup.textContent.length > 150 
        ? popup.textContent.substring(0, 150) + '...'
        : popup.textContent;
      
      // Add analysis if available
      const analysisHtml = popup.analysis_text
        ? formatAnalysis(popup.analysis_text)
        : '';
      
      item.innerHTML = `
        <div class="popup-domain">${popup.domain}</div>
        <div class="popup-text">${truncatedText}</div>
        ${analysisHtml}
        <div class="popup-time">${new Date(popup.timestamp).toLocaleString()}</div>
      `;
      
      container.appendChild(item);
    });
  }
  
  async function clearData() {
    if (confirm('Are you sure you want to clear all popup data?')) {
      try {
        await chrome.storage.local.remove(['cookiePopups']);
        await loadPopupData();
      } catch (error) {
        console.error('Error clearing data:', error);
      }
    }
  }

  function getDomainFromUrl(url) {
    try {
      return new URL(url).hostname;
    } catch {
      return '';
    }
  }

  async function showDomainAnalysis() {
    chrome.tabs.query({ active: true, currentWindow: true }, async (tabs) => {
      if (!tabs.length) return;
      const url = tabs[0].url;
      const domain = getDomainFromUrl(url);
      if (!domain) return;

      const analysisDiv = document.getElementById('domainAnalysis');
      analysisDiv.innerHTML = '<div style="color:#888;">Loading privacy analysis...</div>';

      try {
        const response = await fetch(`http://localhost:3000/api/cookie-banners/domain/${domain}`);
        const data = await response.json();
        if (data.success && data.banners.length > 0) {
          const banner = data.banners[0];
          if (banner.analysis_text) {
            const analysisHtml = formatAnalysis(banner.analysis_text);
            analysisDiv.innerHTML = analysisHtml;
          } else {
            analysisDiv.innerHTML = '<div style="color:#888;">No analysis available for this site yet.</div>';
          }
        } else {
          analysisDiv.innerHTML = '<div style="color:#888;">No analysis available for this site yet.</div>';
        }
      } catch (err) {
        analysisDiv.innerHTML = '<div style="color:#db4437;">Error loading analysis.</div>';
      }
    });
  }

  function formatAnalysis(analysisText) {
    if (!analysisText) return '';
    let parsed = null;
    try {
      parsed = JSON.parse(analysisText);
    } catch {
      // fallback: show as plain text if not valid JSON
      return `
        <div class="popup-analysis">
          <strong>Privacy Analysis:</strong>
          <pre style="white-space: pre-wrap; font-size: 13px;">${analysisText}</pre>
        </div>
      `;
    }
    return `
      <div class="popup-analysis">
        <strong>Privacy Analysis:</strong>
        <ul>
          <li><strong>Clear Opt-Out:</strong> ${parsed.clear_opt_out || 'N/A'}</li>
          <li><strong>Tracking Enabled:</strong> ${parsed.tracking_enabled || 'N/A'}</li>
          <li><strong>Dark Patterns:</strong> ${parsed.dark_patterns || 'N/A'}</li>
          <li><strong>Privacy Grade:</strong> ${parsed.privacy_grade || 'N/A'}</li>
        </ul>
      </div>
    `;
  }
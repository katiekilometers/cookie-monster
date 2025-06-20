document.addEventListener('DOMContentLoaded', async () => {
    await loadPopupData();
    
    document.getElementById('refreshBtn').addEventListener('click', loadPopupData);
    document.getElementById('clearBtn').addEventListener('click', clearData);
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
        ? `<div class="popup-analysis"><strong>Plain Language:</strong> ${popup.analysis_text}</div>`
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
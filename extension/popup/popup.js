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
    
    // Add heading at the top
    const heading = document.createElement('div');
    heading.textContent = 'Websites Looking to Track Your Data';
    heading.style.fontWeight = '700';
    heading.style.fontSize = '1.08em';
    heading.style.margin = '18px 0 12px 0';
    heading.style.letterSpacing = '0.2px';
    heading.style.color = '#e3e8ff';
    heading.style.textAlign = 'center';
    container.appendChild(heading);

    if (popups.length === 0) {
      container.innerHTML += '<div style="text-align: center; color: #666;">No popups detected yet</div>';
      return;
    }
    
    // Show most recent first
    const sortedPopups = popups.slice().sort((a, b) => b.timestamp - a.timestamp);

    // Table setup
    const tableWrapper = document.createElement('div');
    tableWrapper.style.maxHeight = '168px'; // About 3 rows
    tableWrapper.style.overflowY = 'auto';
    tableWrapper.style.borderRadius = '12px';
    tableWrapper.style.background = 'rgba(36,44,80,0.35)';
    tableWrapper.style.boxShadow = '0 1px 6px #23294622';
    tableWrapper.style.margin = '0 0 10px 0';

    const table = document.createElement('table');
    table.style.width = '100%';
    table.style.borderCollapse = 'collapse';
    table.style.fontSize = '1em';

    // Table header
    const thead = document.createElement('thead');
    const headerRow = document.createElement('tr');
    ['Domain', 'Date'].forEach(text => {
      const th = document.createElement('th');
      th.textContent = text;
      th.style.textAlign = 'left';
      th.style.padding = '8px 12px';
      th.style.color = '#e3e8ff';
      th.style.fontWeight = '600';
      th.style.background = 'rgba(36,44,80,0.12)';
      th.style.position = 'sticky';
      th.style.top = '0';
      headerRow.appendChild(th);
    });
    thead.appendChild(headerRow);
    table.appendChild(thead);

    // Table body
    const tbody = document.createElement('tbody');
    sortedPopups.forEach((popup, idx) => {
      const row = document.createElement('tr');
      // Only show top 3, but allow scrolling for more
      row.style.display = idx < 3 ? '' : '';
      row.style.transition = 'background-color 0.2s ease';
      row.style.cursor = 'default';
      
      // Add hover effect
      row.addEventListener('mouseenter', function() {
        row.style.backgroundColor = 'rgba(168,85,247,0.15)';
      });
      row.addEventListener('mouseleave', function() {
        row.style.backgroundColor = 'transparent';
      });
      
      // Domain cell
      const domainCell = document.createElement('td');
      domainCell.textContent = popup.domain;
      domainCell.className = 'popup-domain';
      domainCell.style.cursor = 'pointer';
      domainCell.style.textDecoration = 'underline';
      domainCell.style.color = '#10b981';
      domainCell.style.padding = '8px 12px';
      domainCell.addEventListener('click', function(e) {
        e.stopPropagation();
        showAnalysisModal(popup);
      });
      // Date cell
      const dateCell = document.createElement('td');
      dateCell.textContent = new Date(popup.timestamp).toLocaleDateString();
      dateCell.className = 'popup-time';
      dateCell.style.padding = '8px 12px';
      dateCell.style.color = '#34d399';
      row.appendChild(domainCell);
      row.appendChild(dateCell);
      tbody.appendChild(row);
    });
    table.appendChild(tbody);
    tableWrapper.appendChild(table);
    container.appendChild(tableWrapper);

    // Modal container (create if not exists)
    let modal = document.getElementById('analysisModal');
    if (!modal) {
      modal = document.createElement('div');
      modal.id = 'analysisModal';
      modal.style.display = 'none';
      modal.style.position = 'fixed';
      modal.style.top = '0';
      modal.style.left = '0';
      modal.style.width = '100vw';
      modal.style.height = '100vh';
      modal.style.background = 'rgba(24,28,43,0.82)';
      modal.style.zIndex = '9999';
      modal.style.justifyContent = 'center';
      modal.style.alignItems = 'center';
      modal.style.backdropFilter = 'blur(2px)';
      modal.innerHTML = '<div id="modalContent" style="background:rgba(36,44,80,0.98);border-radius:16px;padding:28px 24px;max-width:340px;box-shadow:0 4px 32px #23294655;color:#f3f6fa;position:relative;"></div>';
      document.body.appendChild(modal);
    }
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
          }
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

  // Show analysis modal for a popup
  function showAnalysisModal(popup) {
    const modal = document.getElementById('analysisModal');
    const content = modal.querySelector('#modalContent');
    let html = `<div style="font-size:1.1em;font-weight:700;margin-bottom:10px;color:#7f9cf5;">${popup.domain}</div>`;
    if (popup.analysis_text) {
      html += formatAnalysis(popup.analysis_text);
    } else {
      html += '<div style="color:#bfc9e6;">No analysis available for this site.</div>';
    }
    html += '<button id="closeModalBtn" style="margin-top:18px;padding:7px 18px;border-radius:12px;background:#7f9cf5;color:#fff;border:none;font-weight:600;cursor:pointer;">Close</button>';
    content.innerHTML = html;
    modal.style.display = 'flex';
    document.getElementById('closeModalBtn').onclick = function() {
      modal.style.display = 'none';
    };
    // Also close modal on click outside content
    modal.onclick = function(e) {
      if (e.target === modal) modal.style.display = 'none';
    };
  }

  // Animate header gradient based on cursor position (moved from popup.html inline script)
  document.addEventListener('DOMContentLoaded', function() {
    const header = document.querySelector('.header');
    const glassBg = document.querySelector('.popup-glass-bg');
    if (!header) {
      console.log('[CookiePopup] .header not found');
      return;
    }
    // Set initial background size for movement
    header.style.backgroundSize = '200% 200%';
    if (glassBg) glassBg.style.backgroundSize = '200% 200%';
    
    // Function to update gradients based on mouse position
    function updateGradients(e) {
      const rect = glassBg ? glassBg.getBoundingClientRect() : header.getBoundingClientRect();
      const x = (e.clientX - rect.left) / rect.width;
      const y = (e.clientY - rect.top) / rect.height;
      // Move the gradient with the mouse
      const posX = 50 + (x - 0.5) * 60; // range: 20% to 80%
      const posY = 50 + (y - 0.5) * 60; // range: 20% to 80%
      const angle = 90 + (x - 0.5) * 40 + (y - 0.5) * 40;
      
      // Update header
      header.style.backgroundPosition = `${posX}% ${posY}%`;
      header.style.backgroundImage = `linear-gradient(${angle}deg, rgba(168,85,247,0.65) 0%, rgba(16,185,129,0.35) 100%)`;
      
      // Update main background
      if (glassBg) {
        glassBg.style.backgroundPosition = `${posX}% ${posY}%`;
        glassBg.style.backgroundImage = `linear-gradient(${angle}deg, rgba(124,58,237,0.55) 0%, rgba(16,185,129,0.18) 100%)`;
      }
    }
    
    // Add mousemove listener to the entire popup background
    if (glassBg) {
      glassBg.addEventListener('mousemove', updateGradients);
    }
  });
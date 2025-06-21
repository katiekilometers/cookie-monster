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
    
    // Listen for privacy analysis completion messages
    chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
      if (message.type === 'PRIVACY_ANALYSIS_COMPLETE') {
        console.log('🔒 Privacy analysis completed:', message.data);
        showPrivacyAnalysisResults(message.data);
      }
    });
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

  function displayBannerData(bannerData) {
    const bannerContainer = document.getElementById('bannerData');
    
    if (!bannerData) {
      bannerContainer.innerHTML = '<p class="no-data">No banner detected on this page</p>';
      return;
    }

    const analysis = parseAnalysis(bannerData.analysis?.banner);
    const privacyAnalysis = parseAnalysis(bannerData.analysis?.privacyPolicy);
    
    bannerContainer.innerHTML = `
      <div class="banner-info">
        <h3>🎯 Cookie Banner Detected</h3>
        <p><strong>Domain:</strong> ${bannerData.domain}</p>
        <p><strong>Method:</strong> ${bannerData.detectionMethod}</p>
        <p><strong>Time:</strong> ${new Date(bannerData.timestamp).toLocaleTimeString()}</p>
      </div>

      ${analysis ? `
        <div class="analysis-section">
          <h4>📊 Banner Analysis</h4>
          <div class="grade-badge ${analysis.privacy_grade?.toLowerCase()}">
            Grade: ${analysis.privacy_grade || 'N/A'}
          </div>
          <div class="analysis-details">
            <p><strong>Opt-Out:</strong> ${analysis.clear_opt_out || 'N/A'}</p>
            <p><strong>Tracking:</strong> ${analysis.tracking_enabled || 'N/A'}</p>
            <p><strong>Dark Patterns:</strong> ${analysis.dark_patterns || 'N/A'}</p>
            <p><strong>Consent:</strong> ${analysis.consent_mechanism || 'N/A'}</p>
            <p><strong>Language:</strong> ${analysis.language_clarity || 'N/A'}</p>
          </div>
        </div>
      ` : '<p class="no-analysis">Analysis in progress...</p>'}

      ${privacyAnalysis ? `
        <div class="analysis-section">
          <h4>🔒 Privacy Policy Analysis</h4>
          <div class="grade-badge ${privacyAnalysis.overall_score?.toLowerCase()}">
            Overall: ${privacyAnalysis.overall_score || 'N/A'}
          </div>
          <div class="analysis-details">
            <p><strong>Data Collection:</strong> ${privacyAnalysis.data_collection || 'N/A'}</p>
            <p><strong>Data Sharing:</strong> ${privacyAnalysis.data_sharing || 'N/A'}</p>
            <p><strong>User Rights:</strong> ${privacyAnalysis.user_rights || 'N/A'}</p>
            <p><strong>Compliance:</strong> ${privacyAnalysis.compliance || 'N/A'}</p>
          </div>
          
          ${privacyAnalysis.red_flags && privacyAnalysis.red_flags.length > 0 ? `
            <div class="flags-section red-flags">
              <h5>⚠️ Red Flags</h5>
              <ul>
                ${privacyAnalysis.red_flags.map(flag => `<li>${flag}</li>`).join('')}
              </ul>
            </div>
          ` : ''}
          
          ${privacyAnalysis.green_flags && privacyAnalysis.green_flags.length > 0 ? `
            <div class="flags-section green-flags">
              <h5>✅ Green Flags</h5>
              <ul>
                ${privacyAnalysis.green_flags.map(flag => `<li>${flag}</li>`).join('')}
              </ul>
            </div>
          ` : ''}
        </div>
      ` : ''}

      ${bannerData.privacyLinks && bannerData.privacyLinks.length > 0 ? `
        <div class="links-section">
          <h4>🔗 Privacy Policy Links</h4>
          ${bannerData.privacyLinks.map(link => `
            <div class="policy-link">
              <a href="${link.href}" target="_blank" class="link-button">
                ${link.text} (${link.type})
              </a>
            </div>
          `).join('')}
        </div>
      ` : ''}

      <div class="banner-content">
        <h4>📝 Banner Content</h4>
        <div class="content-preview">
          ${bannerData.textContent ? bannerData.textContent.substring(0, 200) + (bannerData.textContent.length > 200 ? '...' : '') : 'No content available'}
        </div>
      </div>

      <div class="actions">
        <button id="viewDetails" class="action-button">
          📊 View Full Analysis
        </button>
        <button id="openDashboard" class="action-button">
          📈 Open Dashboard
        </button>
      </div>
    `;

    // Add event listeners
    document.getElementById('viewDetails')?.addEventListener('click', () => {
      showDetailedAnalysis(bannerData);
    });

    document.getElementById('openDashboard')?.addEventListener('click', () => {
      chrome.tabs.create({ url: 'http://localhost:3001' });
    });
  }

  function showDetailedAnalysis(bannerData) {
    const analysis = parseAnalysis(bannerData.analysis?.banner);
    const privacyAnalysis = parseAnalysis(bannerData.analysis?.privacyPolicy);
    
    const modal = document.createElement('div');
    modal.className = 'modal-overlay';
    modal.innerHTML = `
      <div class="modal-content">
        <div class="modal-header">
          <h3>Detailed Analysis: ${bannerData.domain}</h3>
          <button class="close-button">&times;</button>
        </div>
        <div class="modal-body">
          ${analysis ? `
            <div class="analysis-section">
              <h4>Cookie Banner Analysis</h4>
              <div class="grade-badge ${analysis.privacy_grade?.toLowerCase()}">
                Grade: ${analysis.privacy_grade || 'N/A'}
              </div>
              <div class="analysis-details">
                <p><strong>Clear Opt-Out:</strong> ${analysis.clear_opt_out || 'N/A'}</p>
                <p><strong>Tracking Enabled:</strong> ${analysis.tracking_enabled || 'N/A'}</p>
                <p><strong>Dark Patterns:</strong> ${analysis.dark_patterns || 'N/A'}</p>
                <p><strong>Consent Mechanism:</strong> ${analysis.consent_mechanism || 'N/A'}</p>
                <p><strong>Language Clarity:</strong> ${analysis.language_clarity || 'N/A'}</p>
                <p><strong>Button Analysis:</strong> ${analysis.button_analysis || 'N/A'}</p>
              </div>
              
              ${analysis.key_concerns && analysis.key_concerns.length > 0 ? `
                <div class="concerns-section">
                  <h5>Key Concerns</h5>
                  <ul>
                    ${analysis.key_concerns.map(concern => `<li>${concern}</li>`).join('')}
                  </ul>
                </div>
              ` : ''}
              
              ${analysis.recommendations && analysis.recommendations.length > 0 ? `
                <div class="recommendations-section">
                  <h5>Recommendations</h5>
                  <ul>
                    ${analysis.recommendations.map(rec => `<li>${rec}</li>`).join('')}
                  </ul>
                </div>
              ` : ''}
            </div>
          ` : '<p>No banner analysis available.</p>'}

          ${privacyAnalysis ? `
            <div class="analysis-section">
              <h4>Privacy Policy Analysis</h4>
              <div class="grade-badge ${privacyAnalysis.overall_score?.toLowerCase()}">
                Overall Score: ${privacyAnalysis.overall_score || 'N/A'}
              </div>
              <div class="analysis-details">
                <p><strong>Data Collection:</strong> ${privacyAnalysis.data_collection || 'N/A'}</p>
                <p><strong>Data Sharing:</strong> ${privacyAnalysis.data_sharing || 'N/A'}</p>
                <p><strong>User Rights:</strong> ${privacyAnalysis.user_rights || 'N/A'}</p>
                <p><strong>Retention:</strong> ${privacyAnalysis.retention || 'N/A'}</p>
                <p><strong>Third Parties:</strong> ${privacyAnalysis.third_parties || 'N/A'}</p>
                <p><strong>International Transfers:</strong> ${privacyAnalysis.international_transfers || 'N/A'}</p>
                <p><strong>Children's Privacy:</strong> ${privacyAnalysis.children_privacy || 'N/A'}</p>
                <p><strong>Security Measures:</strong> ${privacyAnalysis.security_measures || 'N/A'}</p>
                <p><strong>Contact Info:</strong> ${privacyAnalysis.contact_info || 'N/A'}</p>
                <p><strong>Compliance:</strong> ${privacyAnalysis.compliance || 'N/A'}</p>
              </div>
              
              ${privacyAnalysis.summary ? `
                <div class="summary-section">
                  <h5>Summary</h5>
                  <p>${privacyAnalysis.summary}</p>
                </div>
              ` : ''}
            </div>
          ` : '<p>No privacy policy analysis available.</p>'}

          <div class="banner-content">
            <h4>Full Banner Content</h4>
            <div class="content-full">
              ${bannerData.textContent || 'No content available'}
            </div>
          </div>
        </div>
      </div>
    `;

    document.body.appendChild(modal);

    // Close modal functionality
    modal.querySelector('.close-button').addEventListener('click', () => {
      document.body.removeChild(modal);
    });

    modal.addEventListener('click', (e) => {
      if (e.target === modal) {
        document.body.removeChild(modal);
      }
    });
  }

  function parseAnalysis(analysisText) {
    if (!analysisText) return null;
    try {
      return JSON.parse(analysisText);
    } catch (error) {
      console.error('Error parsing analysis:', error);
      return null;
    }
  }

  function showPrivacyAnalysisResults(analysisData) {
    const { domain, analysis, policyUrl } = analysisData;
    
    // Create or get the privacy analysis container
    let privacyContainer = document.getElementById('privacyAnalysisContainer');
    if (!privacyContainer) {
      privacyContainer = document.createElement('div');
      privacyContainer.id = 'privacyAnalysisContainer';
      privacyContainer.style.marginTop = '16px';
      privacyContainer.style.padding = '16px';
      privacyContainer.style.background = 'rgba(36,44,80,0.35)';
      privacyContainer.style.borderRadius = '12px';
      privacyContainer.style.border = '1px solid rgba(168,85,247,0.2)';
      
      // Insert after the popups list
      const popupsList = document.getElementById('popupsList');
      popupsList.parentNode.insertBefore(privacyContainer, popupsList.nextSibling);
    }
    
    const { analysis_summary, key_findings } = analysis;
    
    // Create privacy analysis HTML
    const privacyHtml = `
      <div style="margin-bottom: 16px;">
        <h3 style="color: #e3e8ff; margin: 0 0 12px 0; font-size: 1.1em; text-align: center;">
          🔒 Privacy Analysis: ${domain}
        </h3>
        
        <!-- Privacy Scores -->
        <div style="display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 8px; margin-bottom: 16px;">
          <div style="text-align: center; padding: 8px; background: rgba(16,185,129,0.1); border-radius: 8px; border: 1px solid rgba(16,185,129,0.3);">
            <div style="font-size: 1.2em; font-weight: bold; color: #10b981;">
              ${analysis_summary.privacy_score}/100
            </div>
            <div style="font-size: 0.8em; color: #34d399;">Privacy Score</div>
          </div>
          <div style="text-align: center; padding: 8px; background: rgba(59,130,246,0.1); border-radius: 8px; border: 1px solid rgba(59,130,246,0.3);">
            <div style="font-size: 1.2em; font-weight: bold; color: #3b82f6;">
              ${analysis_summary.transparency_score}/100
            </div>
            <div style="font-size: 0.8em; color: #60a5fa;">Transparency</div>
          </div>
          <div style="text-align: center; padding: 8px; background: rgba(168,85,247,0.1); border-radius: 8px; border: 1px solid rgba(168,85,247,0.3);">
            <div style="font-size: 1.2em; font-weight: bold; color: #a855f7;">
              ${analysis_summary.user_control_score}/100
            </div>
            <div style="font-size: 0.8em; color: #c084fc;">User Control</div>
          </div>
        </div>
        
        <!-- Risk Level -->
        <div style="text-align: center; margin-bottom: 16px;">
          <div style="display: inline-block; padding: 6px 12px; border-radius: 20px; font-weight: bold; font-size: 0.9em; text-transform: uppercase; letter-spacing: 0.5px; 
            background: ${getRiskColor(analysis_summary.overall_risk_level).bg}; 
            color: ${getRiskColor(analysis_summary.overall_risk_level).text}; 
            border: 1px solid ${getRiskColor(analysis_summary.overall_risk_level).border};">
            ${analysis_summary.overall_risk_level} Risk
          </div>
        </div>
        
        <!-- Key Findings -->
        <div style="margin-bottom: 16px;">
          <h4 style="color: #e3e8ff; margin: 0 0 8px 0; font-size: 1em;">Key Findings</h4>
          
          <!-- Data Collection -->
          <div style="margin-bottom: 12px;">
            <div style="font-weight: bold; color: #fbbf24; margin-bottom: 4px;">📊 Data Collection:</div>
            <div style="font-size: 0.9em; color: #d1d5db; line-height: 1.4;">
              ${formatDataCollection(key_findings.data_collection)}
            </div>
          </div>
          
          <!-- Data Sharing -->
          <div style="margin-bottom: 12px;">
            <div style="font-weight: bold; color: #f87171; margin-bottom: 4px;">🔄 Data Sharing:</div>
            <div style="font-size: 0.9em; color: #d1d5db; line-height: 1.4;">
              ${formatDataSharing(key_findings.data_sharing)}
            </div>
          </div>
          
          <!-- User Rights -->
          <div style="margin-bottom: 12px;">
            <div style="font-weight: bold; color: #34d399; margin-bottom: 4px;">⚖️ User Rights:</div>
            <div style="font-size: 0.9em; color: #d1d5db; line-height: 1.4;">
              ${formatUserRights(key_findings.user_rights)}
            </div>
          </div>
        </div>
        
        <!-- Policy Link -->
        <div style="text-align: center;">
          <a href="${policyUrl}" target="_blank" style="color: #60a5fa; text-decoration: none; font-size: 0.9em;">
            📄 View Privacy Policy
          </a>
        </div>
      </div>
    `;
    
    privacyContainer.innerHTML = privacyHtml;
  }
  
  function getRiskColor(riskLevel) {
    switch (riskLevel.toLowerCase()) {
      case 'low':
        return { bg: 'rgba(16,185,129,0.1)', text: '#10b981', border: 'rgba(16,185,129,0.3)' };
      case 'medium':
        return { bg: 'rgba(245,158,11,0.1)', text: '#f59e0b', border: 'rgba(245,158,11,0.3)' };
      case 'high':
        return { bg: 'rgba(239,68,68,0.1)', text: '#ef4444', border: 'rgba(239,68,68,0.3)' };
      case 'critical':
        return { bg: 'rgba(220,38,38,0.1)', text: '#dc2626', border: 'rgba(220,38,38,0.3)' };
      default:
        return { bg: 'rgba(107,114,128,0.1)', text: '#6b7280', border: 'rgba(107,114,128,0.3)' };
    }
  }
  
  function formatDataCollection(dataCollection) {
    const items = [];
    if (dataCollection.collects_personal_info) items.push('Personal information');
    if (dataCollection.collects_contact_info) items.push('Contact details');
    if (dataCollection.collects_financial_info) items.push('Financial data');
    if (dataCollection.collects_location_data) items.push('Location data');
    if (dataCollection.collects_device_info) items.push('Device information');
    if (dataCollection.collects_browsing_history) items.push('Browsing history');
    if (dataCollection.uses_tracking_pixels) items.push('Tracking pixels');
    if (dataCollection.uses_fingerprinting) items.push('Device fingerprinting');
    
    return items.length > 0 ? items.join(', ') : 'Minimal data collection';
  }
  
  function formatDataSharing(dataSharing) {
    const items = [];
    if (dataSharing.shares_with_affiliates) items.push('Affiliates');
    if (dataSharing.shares_with_partners) items.push('Partners');
    if (dataSharing.shares_with_advertisers) items.push('Advertisers');
    if (dataSharing.sells_personal_data) items.push('Sells data');
    if (dataSharing.transfers_outside_region) items.push('International transfers');
    
    return items.length > 0 ? items.join(', ') : 'Limited sharing';
  }
  
  function formatUserRights(userRights) {
    const rights = [];
    if (userRights.right_to_access) rights.push('Access');
    if (userRights.right_to_rectification) rights.push('Correction');
    if (userRights.right_to_erasure) rights.push('Deletion');
    if (userRights.right_to_portability) rights.push('Portability');
    if (userRights.right_to_object) rights.push('Objection');
    if (userRights.right_to_withdraw_consent) rights.push('Withdraw consent');
    
    return rights.length > 0 ? rights.join(', ') : 'Limited rights';
  }
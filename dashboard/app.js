// Dashboard Application
class CookieDashboard {
  constructor() {
    this.apiBaseUrl = 'http://localhost:3000/api';
    this.data = [];
    this.privacyData = [];
    this.charts = {};
    this.filters = {
      domain: '',
      grade: '',
      search: ''
    };
    
    this.init();
  }

  async init() {
    console.log('🚀 Initializing Cookie Dashboard...');
    
    try {
      await this.loadData();
      this.setupEventListeners();
      this.renderDashboard();
      this.setupCharts();
      
      console.log('✅ Dashboard initialized successfully');
      
      // Auto-refresh every 30 seconds
      setInterval(() => this.loadData(), 30000);
    } catch (error) {
      console.error('❌ Error during dashboard initialization:', error);
    }
  }

  async loadData() {
    try {
      this.updateStatus('Loading data...', '#f59e0b');
      
      // Load cookie banner data
      const response = await fetch(`${this.apiBaseUrl}/cookie-banners`);
      if (response.ok) {
        const result = await response.json();
        this.data = result.banners || [];
        console.log(`Loaded ${this.data.length} cookie banners`);
      } else {
        console.error('Failed to load cookie banner data:', response.status);
      }
      
      // Load privacy analysis data
      const privacyResponse = await fetch(`${this.apiBaseUrl}/privacy-analyses`);
      if (privacyResponse.ok) {
        const privacyResult = await privacyResponse.json();
        this.privacyData = privacyResult.analyses || [];
        console.log(`Loaded ${this.privacyData.length} privacy analyses`);
        
        // Normalize the data structure (convert 1/0 to true/false)
        this.privacyData = this.privacyData.map(analysis => ({
          ...analysis,
          data_collection: {
            collects_personal_info: Boolean(analysis.data_collection.collects_personal_info),
            collects_financial_info: Boolean(analysis.data_collection.collects_financial_info),
            collects_location_data: Boolean(analysis.data_collection.collects_location_data),
            collects_device_info: Boolean(analysis.data_collection.collects_device_info || 0),
            collects_browsing_history: Boolean(analysis.data_collection.collects_browsing_history || 0)
          },
          data_sharing: {
            shares_with_advertisers: Boolean(analysis.data_sharing.shares_with_advertisers),
            sells_personal_data: Boolean(analysis.data_sharing.sells_personal_data),
            transfers_outside_region: Boolean(analysis.data_sharing.transfers_outside_region || 0),
            opt_out_available: Boolean(analysis.data_sharing.opt_out_available || 0)
          },
          user_rights: {
            right_to_access: Boolean(analysis.user_rights.right_to_access || 0),
            right_to_erasure: Boolean(analysis.user_rights.right_to_erasure),
            right_to_portability: Boolean(analysis.user_rights.right_to_portability || 0),
            right_to_withdraw_consent: Boolean(analysis.user_rights.right_to_withdraw_consent)
          }
        }));
        
        this.updateStatus(`Loaded ${this.data.length} banners, ${this.privacyData.length} privacy analyses`, '#10b981');
      } else {
        console.error('Failed to load privacy analysis data:', privacyResponse.status);
        this.privacyData = [];
        this.updateStatus('Failed to load privacy data', '#ef4444');
      }
    } catch (error) {
      console.error('Error loading data:', error);
      this.privacyData = [];
      this.updateStatus('Error loading data', '#ef4444');
    }
  }

  updateStatus(message, color) {
    const statusElement = document.getElementById('statusIndicator');
    if (statusElement) {
      statusElement.textContent = message;
      statusElement.style.color = color;
    }
  }

  setupEventListeners() {
    // Refresh button
    document.getElementById('refreshBtn').addEventListener('click', () => {
      console.log('🔄 Manual refresh triggered');
      this.loadData().then(() => {
        console.log('✅ Data loaded, rendering dashboard');
        this.renderDashboard();
      });
    });

    // Export button
    document.getElementById('exportBtn').addEventListener('click', () => {
      this.exportData();
    });

    // Filters
    document.getElementById('domainFilter').addEventListener('change', (e) => {
      this.filters.domain = e.target.value;
      this.renderDetectionsList();
    });

    document.getElementById('gradeFilter').addEventListener('change', (e) => {
      this.filters.grade = e.target.value;
      this.renderDetectionsList();
    });

    document.getElementById('searchInput').addEventListener('input', (e) => {
      this.filters.search = e.target.value;
      this.renderDetectionsList();
    });

    // Modal close
    document.getElementById('closeModal').addEventListener('click', () => {
      this.closeModal();
    });

    // Close modal on outside click
    document.getElementById('analysisModal').addEventListener('click', (e) => {
      if (e.target.id === 'analysisModal') {
        this.closeModal();
      }
    });
  }

  renderDashboard() {
    this.renderOverviewStats();
    this.renderTopDomains();
    this.renderPrivacyGrades();
    this.renderDetectionsList();
    this.renderPrivacyAnalysis();
    this.updateCharts();
  }

  renderOverviewStats() {
    const totalPopups = this.data.length;
    const uniqueDomains = new Set(this.data.map(banner => banner.domain)).size;
    
    // Calculate high risk sites (grades D and F)
    const highRiskSites = this.data.filter(banner => {
      const analysis = this.parseAnalysis(banner.analysis_text);
      return analysis && ['D', 'F'].includes(analysis.privacy_grade);
    }).length;

    // Calculate average privacy score
    const scores = this.data
      .map(banner => {
        const analysis = this.parseAnalysis(banner.analysis_text);
        return analysis ? this.gradeToScore(analysis.privacy_grade) : null;
      })
      .filter(score => score !== null);
    
    const avgScore = scores.length > 0 
      ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length)
      : 0;

    // Calculate partner statistics
    const sitesWithPartners = this.data.filter(banner => banner.partner_count > 0).length;
    const totalPartners = this.data.reduce((sum, banner) => sum + (banner.partner_count || 0), 0);
    const avgPartners = sitesWithPartners > 0 ? Math.round(totalPartners / sitesWithPartners) : 0;

    // Update DOM elements
    const totalPopupsElement = document.getElementById('totalPopups');
    const uniqueDomainsElement = document.getElementById('uniqueDomains');
    const highRiskSitesElement = document.getElementById('highRiskSites');
    const avgPrivacyScoreElement = document.getElementById('avgPrivacyScore');
    
    if (totalPopupsElement) totalPopupsElement.textContent = totalPopups;
    if (uniqueDomainsElement) uniqueDomainsElement.textContent = uniqueDomains;
    if (highRiskSitesElement) highRiskSitesElement.textContent = highRiskSites;
    if (avgPrivacyScoreElement) avgPrivacyScoreElement.textContent = avgScore;
    
    // Add partner stats if the elements exist
    const partnerStatsElement = document.getElementById('partnerStats');
    if (partnerStatsElement) {
      partnerStatsElement.innerHTML = `
        <div class="stat-card">
          <div class="stat-icon">🤝</div>
          <div class="stat-value">${sitesWithPartners}</div>
          <div class="stat-label">Sites with Partners</div>
        </div>
        <div class="stat-card">
          <div class="stat-icon">📊</div>
          <div class="stat-value">${totalPartners}</div>
          <div class="stat-label">Total Partners</div>
        </div>
        <div class="stat-card">
          <div class="stat-icon">📈</div>
          <div class="stat-value">${avgPartners}</div>
          <div class="stat-label">Avg Partners/Site</div>
        </div>
      `;
    }
  }

  renderTopDomains() {
    const domainCounts = {};
    this.data.forEach(banner => {
      domainCounts[banner.domain] = (domainCounts[banner.domain] || 0) + 1;
    });

    const topDomains = Object.entries(domainCounts)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 10);

    const container = document.getElementById('topDomains');
    container.innerHTML = topDomains.map(([domain, count]) => `
      <div class="domain-item">
        <span class="domain-name">${domain}</span>
        <span class="domain-count">${count}</span>
      </div>
    `).join('');
  }

  renderPrivacyGrades() {
    const gradeCounts = { A: 0, B: 0, C: 0, D: 0, F: 0 };
    
    this.data.forEach(banner => {
      const analysis = this.parseAnalysis(banner.analysis_text);
      if (analysis && analysis.privacy_grade) {
        gradeCounts[analysis.privacy_grade] = (gradeCounts[analysis.privacy_grade] || 0) + 1;
      }
    });

    const container = document.getElementById('privacyGrades');
    container.innerHTML = Object.entries(gradeCounts).map(([grade, count]) => `
      <div class="grade-item grade-${grade.toLowerCase()}">
        <span>Grade ${grade}</span>
        <span>${count}</span>
      </div>
    `).join('');
  }

  renderDetectionsList() {
    let filteredData = [...this.data];

    // Apply filters
    if (this.filters.domain) {
      filteredData = filteredData.filter(banner => banner.domain === this.filters.domain);
    }

    if (this.filters.grade) {
      filteredData = filteredData.filter(banner => {
        const analysis = this.parseAnalysis(banner.analysis_text);
        return analysis && analysis.privacy_grade === this.filters.grade;
      });
    }

    if (this.filters.search) {
      const searchTerm = this.filters.search.toLowerCase();
      filteredData = filteredData.filter(banner => 
        banner.domain.toLowerCase().includes(searchTerm) ||
        banner.textContent?.toLowerCase().includes(searchTerm)
      );
    }

    // Sort by timestamp (newest first)
    filteredData.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

    const container = document.getElementById('recentDetections');
    container.innerHTML = filteredData.map(banner => this.createDetectionItem(banner)).join('');

    // Update domain filter options
    this.updateDomainFilter();
  }

  createDetectionItem(banner) {
    const analysis = this.parseAnalysis(banner.analysis_text);
    const grade = analysis?.privacy_grade || 'N/A';
    const timestamp = new Date(banner.timestamp).toLocaleString();
    
    // Partner information
    const partnerCount = banner.partner_count || 0;
    const partnerNames = banner.partnerNames || [];
    const partnerInfo = partnerCount > 0 
      ? `<div class="detail-item">
          <div class="detail-label">Partners</div>
          <div class="detail-value">
            <span class="partner-count">${partnerCount}</span>
            ${partnerNames.length > 0 ? `<div class="partner-names">${partnerNames.slice(0, 3).join(', ')}${partnerNames.length > 3 ? '...' : ''}</div>` : ''}
          </div>
        </div>`
      : '';
    
    return `
      <div class="detection-item" onclick="dashboard.showDetailedAnalysis('${banner.id}')">
        <div class="detection-header">
          <div class="detection-domain">${banner.domain}</div>
          <div class="detection-time">${timestamp}</div>
        </div>
        <div class="detection-details">
          <div class="detail-item">
            <div class="detail-label">Privacy Grade</div>
            <div class="detail-value">
              <span class="privacy-badge ${grade.toLowerCase()}">${grade}</span>
            </div>
          </div>
          <div class="detail-item">
            <div class="detail-label">Detection Method</div>
            <div class="detail-value">${banner.detectionMethod || 'Unknown'}</div>
          </div>
          <div class="detail-item">
            <div class="detail-label">Text Length</div>
            <div class="detail-value">${banner.textContent?.length || 0} chars</div>
          </div>
          ${partnerInfo}
        </div>
      </div>
    `;
  }

  updateDomainFilter() {
    const domains = [...new Set(this.data.map(banner => banner.domain))].sort();
    const select = document.getElementById('domainFilter');
    const currentValue = select.value;
    
    select.innerHTML = '<option value="">All Domains</option>';
    domains.forEach(domain => {
      const option = document.createElement('option');
      option.value = domain;
      option.textContent = domain;
      if (domain === currentValue) option.selected = true;
      select.appendChild(option);
    });
  }

  setupCharts() {
    this.setupPrivacyChart();
    this.setupTimelineChart();
  }

  setupPrivacyChart() {
    const ctx = document.getElementById('privacyChart').getContext('2d');
    this.charts.privacy = new Chart(ctx, {
      type: 'doughnut',
      data: {
        labels: ['Grade A', 'Grade B', 'Grade C', 'Grade D', 'Grade F'],
        datasets: [{
          data: [0, 0, 0, 0, 0],
          backgroundColor: [
            '#10b981',
            '#22c55e',
            '#fbbf24',
            '#fb923c',
            '#ef4444'
          ],
          borderWidth: 0
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            position: 'bottom',
            labels: {
              color: '#f3f6fa',
              font: {
                family: 'Montserrat',
                size: 12
              }
            }
          }
        }
      }
    });
  }

  setupTimelineChart() {
    const ctx = document.getElementById('timelineChart').getContext('2d');
    this.charts.timeline = new Chart(ctx, {
      type: 'line',
      data: {
        labels: [],
        datasets: [{
          label: 'Detections per Day',
          data: [],
          borderColor: '#10b981',
          backgroundColor: 'rgba(16,185,129,0.1)',
          borderWidth: 2,
          fill: true,
          tension: 0.4
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            labels: {
              color: '#f3f6fa',
              font: {
                family: 'Montserrat',
                size: 12
              }
            }
          }
        },
        scales: {
          x: {
            ticks: {
              color: '#a7f3d0'
            },
            grid: {
              color: 'rgba(168,85,247,0.1)'
            }
          },
          y: {
            ticks: {
              color: '#a7f3d0'
            },
            grid: {
              color: 'rgba(168,85,247,0.1)'
            }
          }
        }
      }
    });
  }

  updateCharts() {
    this.updatePrivacyChart();
    this.updateTimelineChart();
  }

  updatePrivacyChart() {
    const gradeCounts = { A: 0, B: 0, C: 0, D: 0, F: 0 };
    
    this.data.forEach(banner => {
      const analysis = this.parseAnalysis(banner.analysis_text);
      if (analysis && analysis.privacy_grade) {
        gradeCounts[analysis.privacy_grade] = (gradeCounts[analysis.privacy_grade] || 0) + 1;
      }
    });

    this.charts.privacy.data.datasets[0].data = [
      gradeCounts.A, gradeCounts.B, gradeCounts.C, gradeCounts.D, gradeCounts.F
    ];
    this.charts.privacy.update();
  }

  updateTimelineChart() {
    // Group detections by date
    const dateCounts = {};
    this.data.forEach(banner => {
      const date = new Date(banner.timestamp).toLocaleDateString();
      dateCounts[date] = (dateCounts[date] || 0) + 1;
    });

    const sortedDates = Object.keys(dateCounts).sort();
    const counts = sortedDates.map(date => dateCounts[date]);

    this.charts.timeline.data.labels = sortedDates;
    this.charts.timeline.data.datasets[0].data = counts;
    this.charts.timeline.update();
  }

  async showDetailedAnalysis(bannerId) {
    const banner = this.data.find(b => b.id === bannerId);
    if (!banner) return;

    const analysis = this.parseAnalysis(banner.analysis_text);
    const privacyAnalysis = this.parseAnalysis(banner.privacy_policy_analysis);
    
    document.getElementById('modalTitle').textContent = `Analysis: ${banner.domain}`;
    
    // Partner information
    const partnerCount = banner.partner_count || 0;
    const partnerNames = banner.partnerNames || [];
    const partnerInfo = partnerCount > 0 ? `
      <div style="margin-bottom: 20px;">
        <h4 style="color: #a855f7; margin-bottom: 10px;">🤝 Partner Information</h4>
        <p><strong>Total Partners:</strong> <span class="partner-count">${partnerCount}</span></p>
        ${partnerNames.length > 0 ? `
          <p><strong>Partner Names:</strong></p>
          <div style="background: rgba(168,85,247,0.1); padding: 10px; border-radius: 8px; margin-top: 5px;">
            <p style="font-size: 0.9rem; line-height: 1.4; color: #a7f3d0;">
              ${partnerNames.join(', ')}
            </p>
          </div>
        ` : ''}
      </div>
    ` : '';
    
    const modalBody = document.getElementById('modalBody');
    modalBody.innerHTML = `
      <div style="margin-bottom: 20px;">
        <h4 style="color: #10b981; margin-bottom: 10px;">Domain Information</h4>
        <p><strong>Domain:</strong> ${banner.domain}</p>
        <p><strong>Detected:</strong> ${new Date(banner.timestamp).toLocaleString()}</p>
        <p><strong>Method:</strong> ${banner.detectionMethod || 'Unknown'}</p>
      </div>
      
      ${partnerInfo}
      
      ${analysis ? `
        <div style="margin-bottom: 20px;">
          <h4 style="color: #10b981; margin-bottom: 10px;">Cookie Banner Analysis</h4>
          <p><strong>Grade:</strong> <span class="privacy-badge ${analysis.privacy_grade?.toLowerCase()}">${analysis.privacy_grade || 'N/A'}</span></p>
          <p><strong>Clear Opt-Out:</strong> ${analysis.clear_opt_out || 'N/A'}</p>
          <p><strong>Tracking Enabled:</strong> ${analysis.tracking_enabled || 'N/A'}</p>
          <p><strong>Dark Patterns:</strong> ${analysis.dark_patterns || 'N/A'}</p>
          <p><strong>Consent Mechanism:</strong> ${analysis.consent_mechanism || 'N/A'}</p>
          <p><strong>Language Clarity:</strong> ${analysis.language_clarity || 'N/A'}</p>
          ${analysis.partner_impact ? `<p><strong>Partner Impact:</strong> ${analysis.partner_impact}</p>` : ''}
        </div>
      ` : '<p style="color: #a7f3d0;">No banner analysis available.</p>'}
      
      ${privacyAnalysis ? `
        <div style="margin-bottom: 20px;">
          <h4 style="color: #10b981; margin-bottom: 10px;">Privacy Policy Analysis</h4>
          <p><strong>Overall Score:</strong> <span class="privacy-badge ${privacyAnalysis.overall_score?.toLowerCase()}">${privacyAnalysis.overall_score || 'N/A'}</span></p>
          ${privacyAnalysis.partner_count ? `<p><strong>Partner Count:</strong> <span class="partner-count">${privacyAnalysis.partner_count}</span></p>` : ''}
          <p><strong>Data Collection:</strong> ${privacyAnalysis.data_collection || 'N/A'}</p>
          <p><strong>Data Sharing:</strong> ${privacyAnalysis.data_sharing || 'N/A'}</p>
          <p><strong>User Rights:</strong> ${privacyAnalysis.user_rights || 'N/A'}</p>
          <p><strong>Retention:</strong> ${privacyAnalysis.retention || 'N/A'}</p>
          <p><strong>Third Parties:</strong> ${privacyAnalysis.third_parties || 'N/A'}</p>
          <p><strong>Compliance:</strong> ${privacyAnalysis.compliance || 'N/A'}</p>
          
          ${privacyAnalysis.red_flags && privacyAnalysis.red_flags.length > 0 ? `
            <div style="margin-top: 10px;">
              <strong style="color: #ef4444;">Red Flags:</strong>
              <ul style="color: #ef4444; margin: 5px 0;">
                ${privacyAnalysis.red_flags.map(flag => `<li>${flag}</li>`).join('')}
              </ul>
            </div>
          ` : ''}
          
          ${privacyAnalysis.green_flags && privacyAnalysis.green_flags.length > 0 ? `
            <div style="margin-top: 10px;">
              <strong style="color: #10b981;">Green Flags:</strong>
              <ul style="color: #10b981; margin: 5px 0;">
                ${privacyAnalysis.green_flags.map(flag => `<li>${flag}</li>`).join('')}
              </ul>
            </div>
          ` : ''}
          
          ${privacyAnalysis.summary ? `
            <div style="margin-top: 10px;">
              <strong>Summary:</strong>
              <p style="color: #a7f3d0; font-style: italic;">${privacyAnalysis.summary}</p>
            </div>
          ` : ''}
        </div>
      ` : this.getPrivacyPolicyStatusMessage(banner.privacy_policy_status)}
      
      ${banner.privacyLinks && banner.privacyLinks.length > 0 ? `
        <div style="margin-bottom: 20px;">
          <h4 style="color: #10b981; margin-bottom: 10px;">Privacy Policy Links</h4>
          ${banner.privacyLinks.map(link => `
            <div style="margin-bottom: 8px;">
              <a href="${link.href}" target="_blank" style="color: #10b981; text-decoration: underline;">
                ${link.text} (${link.type})
              </a>
            </div>
          `).join('')}
        </div>
      ` : ''}
      
      <div style="margin-bottom: 20px;">
        <h4 style="color: #10b981; margin-bottom: 10px;">Banner Content</h4>
        <div style="background: rgba(168,85,247,0.1); padding: 15px; border-radius: 10px; max-height: 200px; overflow-y: auto;">
          <p style="font-family: monospace; font-size: 0.9rem; line-height: 1.4;">${banner.textContent || 'No content available'}</p>
        </div>
      </div>
      
      ${banner.privacy_policy_content ? `
        <div style="margin-bottom: 20px;">
          <h4 style="color: #10b981; margin-bottom: 10px;">Privacy Policy Content (Preview)</h4>
          <div style="background: rgba(168,85,247,0.1); padding: 15px; border-radius: 10px; max-height: 300px; overflow-y: auto;">
            <p style="font-family: monospace; font-size: 0.8rem; line-height: 1.4; color: #a7f3d0;">
              ${banner.privacy_policy_content.substring(0, 2000)}${banner.privacy_policy_content.length > 2000 ? '...' : ''}
            </p>
          </div>
        </div>
      ` : ''}
    `;

    document.getElementById('analysisModal').style.display = 'block';
  }

  getPrivacyPolicyStatusMessage(status) {
    const statusMessages = {
      'success': '<p style="color: #10b981;">✅ Privacy policy analysis completed successfully.</p>',
      'fetch_failed': '<p style="color: #fbbf24;">⚠️ Privacy policy could not be fetched - website may block automated requests.</p>',
      'analysis_failed': '<p style="color: #fbbf24;">⚠️ Privacy policy was fetched but analysis failed.</p>',
      'no_link': '<p style="color: #a7f3d0;">ℹ️ No privacy policy link found in the cookie banner.</p>',
      'no_links': '<p style="color: #a7f3d0;">ℹ️ No privacy policy links detected in the cookie banner.</p>',
      'error': '<p style="color: #ef4444;">❌ Error occurred during privacy policy analysis.</p>',
      'not_found': '<p style="color: #a7f3d0;">ℹ️ Privacy policy analysis not available.</p>'
    };
    
    return statusMessages[status] || statusMessages['not_found'];
  }

  closeModal() {
    document.getElementById('analysisModal').style.display = 'none';
  }

  parseAnalysis(analysisText) {
    if (!analysisText) return null;
    try {
      return JSON.parse(analysisText);
    } catch (error) {
      console.error('Failed to parse analysis text:', error);
      return null;
    }
  }

  gradeToScore(grade) {
    const scores = { A: 95, B: 85, C: 75, D: 65, F: 55 };
    return scores[grade] || 0;
  }

  exportData() {
    const exportData = {
      timestamp: new Date().toISOString(),
      totalBanners: this.data.length,
      uniqueDomains: new Set(this.data.map(b => b.domain)).size,
      banners: this.data
    };

    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `cookie-analysis-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  renderPrivacyAnalysis() {
    console.log('🔍 Rendering privacy analysis with data:', this.privacyData);
    
    if (!this.privacyData || this.privacyData.length === 0) {
      console.log('⚠️ No privacy data available, rendering empty state');
      this.renderEmptyPrivacyAnalysis();
      return;
    }
    
    console.log('✅ Privacy data available, rendering components');
    this.renderPrivacyScoresOverview();
    this.renderDataCollectionAnalysis();
    this.renderDataSharingAnalysis();
    this.renderUserRightsAnalysis();
    this.renderPrivacyAnalysisList();
  }

  renderEmptyPrivacyAnalysis() {
    document.getElementById('privacyScoresOverview').innerHTML = 
      '<div style="text-align: center; color: #6b7280; padding: 2rem;">No privacy analysis data available</div>';
    document.getElementById('dataCollectionAnalysis').innerHTML = 
      '<div style="text-align: center; color: #6b7280; padding: 2rem;">No data collection analysis available</div>';
    document.getElementById('dataSharingAnalysis').innerHTML = 
      '<div style="text-align: center; color: #6b7280; padding: 2rem;">No data sharing analysis available</div>';
    document.getElementById('userRightsAnalysis').innerHTML = 
      '<div style="text-align: center; color: #6b7280; padding: 2rem;">No user rights analysis available</div>';
    document.getElementById('privacyAnalysisList').innerHTML = 
      '<div style="text-align: center; color: #6b7280; padding: 2rem;">No privacy policy analyses available</div>';
  }

  renderPrivacyScoresOverview() {
    console.log('📊 Rendering privacy scores overview');
    const scores = this.calculateAveragePrivacyScores();
    console.log('📊 Calculated average scores:', scores);
    const container = document.getElementById('privacyScoresOverview');
    
    if (!container) {
      console.error('❌ Privacy scores overview container not found');
      return;
    }
    
    container.innerHTML = `
      <div class="privacy-score-item ${this.getScoreClass(scores.privacy_score)}">
        <div class="privacy-score-value">${scores.privacy_score}</div>
        <div class="privacy-score-label">Privacy Score</div>
      </div>
      <div class="privacy-score-item ${this.getScoreClass(scores.transparency_score)}">
        <div class="privacy-score-value">${scores.transparency_score}</div>
        <div class="privacy-score-label">Transparency</div>
      </div>
      <div class="privacy-score-item ${this.getScoreClass(scores.user_control_score)}">
        <div class="privacy-score-value">${scores.user_control_score}</div>
        <div class="privacy-score-label">User Control</div>
      </div>
    `;
    console.log('✅ Privacy scores overview rendered');
  }

  renderDataCollectionAnalysis() {
    console.log('📊 Rendering data collection analysis');
    const collection = this.analyzeDataCollection();
    console.log('📊 Analyzed data collection:', collection);
    const container = document.getElementById('dataCollectionAnalysis');
    
    if (!container) {
      console.error('❌ Data collection analysis container not found');
      return;
    }
    
    container.innerHTML = `
      <div class="data-analysis-item">
        <span class="data-analysis-label">Personal Information</span>
        <span class="data-analysis-value ${collection.personal_info ? 'negative' : 'positive'}">
          ${collection.personal_info ? 'Yes' : 'No'}
        </span>
      </div>
      <div class="data-analysis-item">
        <span class="data-analysis-label">Financial Data</span>
        <span class="data-analysis-value ${collection.financial_info ? 'negative' : 'positive'}">
          ${collection.financial_info ? 'Yes' : 'No'}
        </span>
      </div>
      <div class="data-analysis-item">
        <span class="data-analysis-label">Location Data</span>
        <span class="data-analysis-value ${collection.location_data ? 'negative' : 'positive'}">
          ${collection.location_data ? 'Yes' : 'No'}
        </span>
      </div>
      <div class="data-analysis-item">
        <span class="data-analysis-label">Device Information</span>
        <span class="data-analysis-value ${collection.device_info ? 'negative' : 'positive'}">
          ${collection.device_info ? 'Yes' : 'No'}
        </span>
      </div>
      <div class="data-analysis-item">
        <span class="data-analysis-label">Browsing History</span>
        <span class="data-analysis-value ${collection.browsing_history ? 'negative' : 'positive'}">
          ${collection.browsing_history ? 'Yes' : 'No'}
        </span>
      </div>
    `;
    console.log('✅ Data collection analysis rendered');
  }

  renderDataSharingAnalysis() {
    const sharing = this.analyzeDataSharing();
    const container = document.getElementById('dataSharingAnalysis');
    
    container.innerHTML = `
      <div class="data-analysis-item">
        <span class="data-analysis-label">Shares with Advertisers</span>
        <span class="data-analysis-value ${sharing.advertisers ? 'negative' : 'positive'}">
          ${sharing.advertisers ? 'Yes' : 'No'}
        </span>
      </div>
      <div class="data-analysis-item">
        <span class="data-analysis-label">Sells Personal Data</span>
        <span class="data-analysis-value ${sharing.sells_data ? 'negative' : 'positive'}">
          ${sharing.sells_data ? 'Yes' : 'No'}
        </span>
      </div>
      <div class="data-analysis-item">
        <span class="data-analysis-label">International Transfers</span>
        <span class="data-analysis-value ${sharing.international ? 'negative' : 'positive'}">
          ${sharing.international ? 'Yes' : 'No'}
        </span>
      </div>
      <div class="data-analysis-item">
        <span class="data-analysis-label">Opt-out Available</span>
        <span class="data-analysis-value ${sharing.opt_out ? 'positive' : 'negative'}">
          ${sharing.opt_out ? 'Yes' : 'No'}
        </span>
      </div>
    `;
  }

  renderUserRightsAnalysis() {
    const rights = this.analyzeUserRights();
    const container = document.getElementById('userRightsAnalysis');
    
    container.innerHTML = `
      <div class="data-analysis-item">
        <span class="data-analysis-label">Right to Access</span>
        <span class="data-analysis-value ${rights.access ? 'positive' : 'negative'}">
          ${rights.access ? 'Yes' : 'No'}
        </span>
      </div>
      <div class="data-analysis-item">
        <span class="data-analysis-label">Right to Deletion</span>
        <span class="data-analysis-value ${rights.deletion ? 'positive' : 'negative'}">
          ${rights.deletion ? 'Yes' : 'No'}
        </span>
      </div>
      <div class="data-analysis-item">
        <span class="data-analysis-label">Right to Portability</span>
        <span class="data-analysis-value ${rights.portability ? 'positive' : 'negative'}">
          ${rights.portability ? 'Yes' : 'No'}
        </span>
      </div>
      <div class="data-analysis-item">
        <span class="data-analysis-label">Right to Withdraw Consent</span>
        <span class="data-analysis-value ${rights.withdraw_consent ? 'positive' : 'negative'}">
          ${rights.withdraw_consent ? 'Yes' : 'No'}
        </span>
      </div>
    `;
  }

  renderPrivacyAnalysisList() {
    console.log('📊 Rendering privacy analysis list');
    const container = document.getElementById('privacyAnalysisList');
    
    if (!container) {
      console.error('❌ Privacy analysis list container not found');
      return;
    }
    
    const recentAnalyses = this.privacyData.slice(0, 5); // Show last 5 analyses
    console.log('📊 Recent analyses to display:', recentAnalyses);
    
    if (recentAnalyses.length === 0) {
      container.innerHTML = '<div style="text-align: center; color: #6b7280; padding: 2rem;">No privacy policy analyses available</div>';
      console.log('⚠️ No recent analyses to display');
      return;
    }
    
    container.innerHTML = recentAnalyses.map(analysis => `
      <div class="analysis-item" onclick="dashboard.showPrivacyAnalysisDetails('${analysis.domain}')">
        <div class="analysis-header">
          <div class="analysis-domain">${analysis.domain}</div>
          <div class="analysis-date">${new Date(analysis.analyzed_at).toLocaleDateString()}</div>
        </div>
        <div class="analysis-scores">
          <div class="analysis-score">
            <div class="analysis-score-value">${analysis.scores.privacy_score}</div>
            <div class="analysis-score-label">Privacy</div>
          </div>
          <div class="analysis-score">
            <div class="analysis-score-value">${analysis.scores.transparency_score}</div>
            <div class="analysis-score-label">Transparency</div>
          </div>
          <div class="analysis-score">
            <div class="analysis-score-value">${analysis.scores.user_control_score}</div>
            <div class="analysis-score-label">Control</div>
          </div>
          <span class="risk-badge ${analysis.scores.overall_risk_level}">${analysis.scores.overall_risk_level}</span>
        </div>
        <div class="analysis-summary">
          ${this.generatePrivacySummary(analysis)}
        </div>
      </div>
    `).join('');
    console.log('✅ Privacy analysis list rendered');
  }

  calculateAveragePrivacyScores() {
    if (!this.privacyData || this.privacyData.length === 0) {
      return { privacy_score: 0, transparency_score: 0, user_control_score: 0 };
    }
    
    const total = this.privacyData.reduce((acc, analysis) => {
      acc.privacy_score += analysis.scores.privacy_score || 0;
      acc.transparency_score += analysis.scores.transparency_score || 0;
      acc.user_control_score += analysis.scores.user_control_score || 0;
      return acc;
    }, { privacy_score: 0, transparency_score: 0, user_control_score: 0 });
    
    const count = this.privacyData.length;
    return {
      privacy_score: Math.round(total.privacy_score / count),
      transparency_score: Math.round(total.transparency_score / count),
      user_control_score: Math.round(total.user_control_score / count)
    };
  }

  analyzeDataCollection() {
    if (!this.privacyData || this.privacyData.length === 0) {
      return { personal_info: false, financial_info: false, location_data: false, device_info: false, browsing_history: false };
    }
    
    const total = this.privacyData.length;
    const collection = this.privacyData.reduce((acc, analysis) => {
      if (analysis.data_collection.collects_personal_info) acc.personal_info++;
      if (analysis.data_collection.collects_financial_info) acc.financial_info++;
      if (analysis.data_collection.collects_location_data) acc.location_data++;
      if (analysis.data_collection.collects_device_info) acc.device_info++;
      if (analysis.data_collection.collects_browsing_history) acc.browsing_history++;
      return acc;
    }, { personal_info: 0, financial_info: 0, location_data: 0, device_info: 0, browsing_history: 0 });
    
    return {
      personal_info: collection.personal_info > total / 2,
      financial_info: collection.financial_info > total / 2,
      location_data: collection.location_data > total / 2,
      device_info: collection.device_info > total / 2,
      browsing_history: collection.browsing_history > total / 2
    };
  }

  analyzeDataSharing() {
    if (!this.privacyData || this.privacyData.length === 0) {
      return { advertisers: false, sells_data: false, international: false, opt_out: false };
    }
    
    const total = this.privacyData.length;
    const sharing = this.privacyData.reduce((acc, analysis) => {
      if (analysis.data_sharing.shares_with_advertisers) acc.advertisers++;
      if (analysis.data_sharing.sells_personal_data) acc.sells_data++;
      if (analysis.data_sharing.transfers_outside_region) acc.international++;
      if (analysis.data_sharing.opt_out_available) acc.opt_out++;
      return acc;
    }, { advertisers: 0, sells_data: 0, international: 0, opt_out: 0 });
    
    return {
      advertisers: sharing.advertisers > total / 2,
      sells_data: sharing.sells_data > total / 2,
      international: sharing.international > total / 2,
      opt_out: sharing.opt_out > total / 2
    };
  }

  analyzeUserRights() {
    if (!this.privacyData || this.privacyData.length === 0) {
      return { access: false, deletion: false, portability: false, withdraw_consent: false };
    }
    
    const total = this.privacyData.length;
    const rights = this.privacyData.reduce((acc, analysis) => {
      if (analysis.user_rights.right_to_access) acc.access++;
      if (analysis.user_rights.right_to_erasure) acc.deletion++;
      if (analysis.user_rights.right_to_portability) acc.portability++;
      if (analysis.user_rights.right_to_withdraw_consent) acc.withdraw_consent++;
      return acc;
    }, { access: 0, deletion: 0, portability: 0, withdraw_consent: 0 });
    
    return {
      access: rights.access > total / 2,
      deletion: rights.deletion > total / 2,
      portability: rights.portability > total / 2,
      withdraw_consent: rights.withdraw_consent > total / 2
    };
  }

  getScoreClass(score) {
    if (score >= 70) return 'high';
    if (score >= 40) return 'medium';
    return 'low';
  }

  generatePrivacySummary(analysis) {
    const summary = [];
    
    if (analysis.data_collection.collects_personal_info) summary.push('Collects personal data');
    if (analysis.data_sharing.shares_with_advertisers) summary.push('Shares with advertisers');
    if (analysis.user_rights.right_to_erasure) summary.push('Right to deletion');
    if (analysis.data_sharing.sells_personal_data) summary.push('Sells personal data');
    
    return summary.length > 0 ? summary.slice(0, 3).join(', ') : 'Standard privacy practices';
  }

  async showPrivacyAnalysisDetails(domain) {
    try {
      const response = await fetch(`${this.apiBaseUrl}/privacy-analysis/${domain}`);
      if (response.ok) {
        const result = await response.json();
        this.showPrivacyAnalysisModal(result.analysis);
      } else {
        console.error('Failed to load privacy analysis details:', response.status);
      }
    } catch (error) {
      console.error('Error loading privacy analysis details:', error);
    }
  }

  showPrivacyAnalysisModal(analysis) {
    const modal = document.getElementById('analysisModal');
    const modalTitle = document.getElementById('modalTitle');
    const modalBody = document.getElementById('modalBody');
    
    modalTitle.textContent = `Privacy Analysis: ${analysis.domain}`;
    
    modalBody.innerHTML = `
      <div style="margin-bottom: 2rem;">
        <h4 style="color: #e3e8ff; margin-bottom: 1rem;">Privacy Scores</h4>
        <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 1rem; margin-bottom: 1rem;">
          <div style="text-align: center; padding: 1rem; background: rgba(16,185,129,0.1); border-radius: 8px;">
            <div style="font-size: 1.5rem; font-weight: bold; color: #10b981;">${analysis.scores.privacy_score}</div>
            <div style="font-size: 0.9rem; color: #34d399;">Privacy Score</div>
          </div>
          <div style="text-align: center; padding: 1rem; background: rgba(59,130,246,0.1); border-radius: 8px;">
            <div style="font-size: 1.5rem; font-weight: bold; color: #3b82f6;">${analysis.scores.transparency_score}</div>
            <div style="font-size: 0.9rem; color: #60a5fa;">Transparency</div>
          </div>
          <div style="text-align: center; padding: 1rem; background: rgba(168,85,247,0.1); border-radius: 8px;">
            <div style="font-size: 1.5rem; font-weight: bold; color: #a855f7;">${analysis.scores.user_control_score}</div>
            <div style="font-size: 0.9rem; color: #c084fc;">User Control</div>
          </div>
        </div>
        <div style="text-align: center;">
          <span class="risk-badge ${analysis.scores.overall_risk_level}">${analysis.scores.overall_risk_level} Risk</span>
        </div>
      </div>
      
      <div style="margin-bottom: 2rem;">
        <h4 style="color: #e3e8ff; margin-bottom: 1rem;">Data Collection</h4>
        <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 0.5rem;">
          <div style="padding: 0.5rem; background: rgba(255,255,255,0.05); border-radius: 4px;">
            <span style="color: #d1d5db;">Personal Info:</span> 
            <span style="color: ${analysis.data_collection.collects_personal_info ? '#ef4444' : '#10b981'}; font-weight: bold;">
              ${analysis.data_collection.collects_personal_info ? 'Yes' : 'No'}
            </span>
          </div>
          <div style="padding: 0.5rem; background: rgba(255,255,255,0.05); border-radius: 4px;">
            <span style="color: #d1d5db;">Financial Data:</span> 
            <span style="color: ${analysis.data_collection.collects_financial_info ? '#ef4444' : '#10b981'}; font-weight: bold;">
              ${analysis.data_collection.collects_financial_info ? 'Yes' : 'No'}
            </span>
          </div>
          <div style="padding: 0.5rem; background: rgba(255,255,255,0.05); border-radius: 4px;">
            <span style="color: #d1d5db;">Location Data:</span> 
            <span style="color: ${analysis.data_collection.collects_location_data ? '#ef4444' : '#10b981'}; font-weight: bold;">
              ${analysis.data_collection.collects_location_data ? 'Yes' : 'No'}
            </span>
          </div>
          <div style="padding: 0.5rem; background: rgba(255,255,255,0.05); border-radius: 4px;">
            <span style="color: #d1d5db;">Device Info:</span> 
            <span style="color: ${analysis.data_collection.collects_device_info ? '#ef4444' : '#10b981'}; font-weight: bold;">
              ${analysis.data_collection.collects_device_info ? 'Yes' : 'No'}
            </span>
          </div>
        </div>
      </div>
      
      <div style="margin-bottom: 2rem;">
        <h4 style="color: #e3e8ff; margin-bottom: 1rem;">Data Sharing</h4>
        <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 0.5rem;">
          <div style="padding: 0.5rem; background: rgba(255,255,255,0.05); border-radius: 4px;">
            <span style="color: #d1d5db;">With Advertisers:</span> 
            <span style="color: ${analysis.data_sharing.shares_with_advertisers ? '#ef4444' : '#10b981'}; font-weight: bold;">
              ${analysis.data_sharing.shares_with_advertisers ? 'Yes' : 'No'}
            </span>
          </div>
          <div style="padding: 0.5rem; background: rgba(255,255,255,0.05); border-radius: 4px;">
            <span style="color: #d1d5db;">Sells Data:</span> 
            <span style="color: ${analysis.data_sharing.sells_personal_data ? '#ef4444' : '#10b981'}; font-weight: bold;">
              ${analysis.data_sharing.sells_personal_data ? 'Yes' : 'No'}
            </span>
          </div>
          <div style="padding: 0.5rem; background: rgba(255,255,255,0.05); border-radius: 4px;">
            <span style="color: #d1d5db;">International Transfers:</span> 
            <span style="color: ${analysis.data_sharing.transfers_outside_region ? '#ef4444' : '#10b981'}; font-weight: bold;">
              ${analysis.data_sharing.transfers_outside_region ? 'Yes' : 'No'}
            </span>
          </div>
          <div style="padding: 0.5rem; background: rgba(255,255,255,0.05); border-radius: 4px;">
            <span style="color: #d1d5db;">Opt-out Available:</span> 
            <span style="color: ${analysis.data_sharing.opt_out_available ? '#10b981' : '#ef4444'}; font-weight: bold;">
              ${analysis.data_sharing.opt_out_available ? 'Yes' : 'No'}
            </span>
          </div>
        </div>
      </div>
      
      <div>
        <h4 style="color: #e3e8ff; margin-bottom: 1rem;">User Rights</h4>
        <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 0.5rem;">
          <div style="padding: 0.5rem; background: rgba(255,255,255,0.05); border-radius: 4px;">
            <span style="color: #d1d5db;">Right to Access:</span> 
            <span style="color: ${analysis.user_rights.right_to_access ? '#10b981' : '#ef4444'}; font-weight: bold;">
              ${analysis.user_rights.right_to_access ? 'Yes' : 'No'}
            </span>
          </div>
          <div style="padding: 0.5rem; background: rgba(255,255,255,0.05); border-radius: 4px;">
            <span style="color: #d1d5db;">Right to Deletion:</span> 
            <span style="color: ${analysis.user_rights.right_to_erasure ? '#10b981' : '#ef4444'}; font-weight: bold;">
              ${analysis.user_rights.right_to_erasure ? 'Yes' : 'No'}
            </span>
          </div>
          <div style="padding: 0.5rem; background: rgba(255,255,255,0.05); border-radius: 4px;">
            <span style="color: #d1d5db;">Right to Portability:</span> 
            <span style="color: ${analysis.user_rights.right_to_portability ? '#10b981' : '#ef4444'}; font-weight: bold;">
              ${analysis.user_rights.right_to_portability ? 'Yes' : 'No'}
            </span>
          </div>
          <div style="padding: 0.5rem; background: rgba(255,255,255,0.05); border-radius: 4px;">
            <span style="color: #d1d5db;">Withdraw Consent:</span> 
            <span style="color: ${analysis.user_rights.right_to_withdraw_consent ? '#10b981' : '#ef4444'}; font-weight: bold;">
              ${analysis.user_rights.right_to_withdraw_consent ? 'Yes' : 'No'}
            </span>
          </div>
        </div>
      </div>
    `;
    
    modal.style.display = 'flex';
  }
}

// Initialize dashboard
const dashboard = new CookieDashboard();

// Make dashboard globally available for onclick handlers
window.dashboard = dashboard;
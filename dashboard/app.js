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

// Dashboard Application
class CookieDashboard {
  constructor() {
    this.apiBaseUrl = 'http://localhost:3000/api';
    this.data = [];
    this.charts = {};
    this.filters = {
      domain: '',
      grade: '',
      search: ''
    };
    
    this.init();
  }

  async init() {
    await this.loadData();
    this.setupEventListeners();
    this.renderDashboard();
    this.setupCharts();
    
    // Auto-refresh every 30 seconds
    setInterval(() => this.loadData(), 30000);
  }

  async loadData() {
    try {
      const response = await fetch(`${this.apiBaseUrl}/cookie-banners`);
      if (response.ok) {
        const result = await response.json();
        this.data = result.banners || [];
        console.log(`Loaded ${this.data.length} cookie banners`);
      } else {
        console.error('Failed to load data:', response.status);
      }
    } catch (error) {
      console.error('Error loading data:', error);
    }
  }

  setupEventListeners() {
    // Refresh button
    document.getElementById('refreshBtn').addEventListener('click', () => {
      this.loadData().then(() => this.renderDashboard());
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

    document.getElementById('totalPopups').textContent = totalPopups;
    document.getElementById('uniqueDomains').textContent = uniqueDomains;
    document.getElementById('highRiskSites').textContent = highRiskSites;
    document.getElementById('avgPrivacyScore').textContent = avgScore;
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
    
    document.getElementById('modalTitle').textContent = `Analysis: ${banner.domain}`;
    
    const modalBody = document.getElementById('modalBody');
    modalBody.innerHTML = `
      <div style="margin-bottom: 20px;">
        <h4 style="color: #10b981; margin-bottom: 10px;">Domain Information</h4>
        <p><strong>Domain:</strong> ${banner.domain}</p>
        <p><strong>Detected:</strong> ${new Date(banner.timestamp).toLocaleString()}</p>
        <p><strong>Method:</strong> ${banner.detectionMethod || 'Unknown'}</p>
      </div>
      
      ${analysis ? `
        <div style="margin-bottom: 20px;">
          <h4 style="color: #10b981; margin-bottom: 10px;">Privacy Analysis</h4>
          <p><strong>Grade:</strong> <span class="privacy-badge ${analysis.privacy_grade?.toLowerCase()}">${analysis.privacy_grade || 'N/A'}</span></p>
          <p><strong>Clear Opt-Out:</strong> ${analysis.clear_opt_out || 'N/A'}</p>
          <p><strong>Tracking Enabled:</strong> ${analysis.tracking_enabled || 'N/A'}</p>
          <p><strong>Dark Patterns:</strong> ${analysis.dark_patterns || 'N/A'}</p>
        </div>
      ` : '<p style="color: #a7f3d0;">No analysis available for this banner.</p>'}
      
      <div style="margin-bottom: 20px;">
        <h4 style="color: #10b981; margin-bottom: 10px;">Banner Content</h4>
        <div style="background: rgba(168,85,247,0.1); padding: 15px; border-radius: 10px; max-height: 200px; overflow-y: auto;">
          <p style="font-family: monospace; font-size: 0.9rem; line-height: 1.4;">${banner.textContent || 'No content available'}</p>
        </div>
      </div>
    `;

    document.getElementById('analysisModal').style.display = 'block';
  }

  closeModal() {
    document.getElementById('analysisModal').style.display = 'none';
  }

  parseAnalysis(analysisText) {
    if (!analysisText) return null;
    try {
      return JSON.parse(analysisText);
    } catch {
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
}

// Initialize dashboard
const dashboard = new CookieDashboard();
// Dashboard Application
class CookieDashboard {
  constructor() {
    this.apiBaseUrl = 'http://localhost:3000/api';
    this.data = [];
    this.filters = {
      domain: '',
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
        this.updateStatus(`Loaded ${this.data.length} banners`, '#10b981');
      } else {
        console.error('Failed to load cookie banner data:', response.status);
        this.updateStatus('Failed to load data', '#ef4444');
      }
    } catch (error) {
      console.error('Error loading data:', error);
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
    this.renderDetectionsList();
    this.setupCharts();
    this.updateCharts();
  }

  renderOverviewStats() {
    const totalPopups = this.data.length;
    const uniqueDomains = new Set(this.data.map(banner => banner.domain)).size;

    // Update DOM elements
    const totalPopupsElement = document.getElementById('totalPopups');
    const uniqueDomainsElement = document.getElementById('uniqueDomains');
    
    if (totalPopupsElement) totalPopupsElement.textContent = totalPopups;
    if (uniqueDomainsElement) uniqueDomainsElement.textContent = uniqueDomains;
  }

  renderTopDomains() {
    const domainCounts = {};
    this.data.forEach(banner => {
      domainCounts[banner.domain] = (domainCounts[banner.domain] || 0) + 1;
    });

    const topDomains = Object.entries(domainCounts)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 5);

    const container = document.getElementById('topDomains');
    if (!container) return;

    container.innerHTML = topDomains.length > 0 
      ? topDomains.map(([domain, count]) => `
          <div class="domain-item">
            <span class="domain-name">${domain}</span>
            <span class="domain-count">${count}</span>
          </div>
        `).join('')
      : '<div class="no-data">No data available</div>';
  }

  renderDetectionsList() {
    const container = document.getElementById('detectionsList');
    if (!container) return;

    let filteredData = this.data;

    // Apply filters
    if (this.filters.domain) {
      filteredData = filteredData.filter(banner => 
        banner.domain.toLowerCase().includes(this.filters.domain.toLowerCase())
      );
    }

    if (this.filters.search) {
      filteredData = filteredData.filter(banner => 
        banner.domain.toLowerCase().includes(this.filters.search.toLowerCase()) ||
        banner.textContent?.toLowerCase().includes(this.filters.search.toLowerCase())
      );
    }

    container.innerHTML = filteredData.length > 0 
      ? filteredData.map(banner => this.createDetectionItem(banner)).join('')
      : '<div class="no-data">No detections found</div>';

    this.updateDomainFilter();
  }

  createDetectionItem(banner) {
    return `
      <div class="detection-item" onclick="dashboard.showDetailedAnalysis(${banner.id})">
        <div class="detection-header">
          <div class="detection-domain">${banner.domain}</div>
          <div class="detection-time">${new Date(banner.created_at).toLocaleDateString()}</div>
        </div>
        <div class="detection-content">
          <div class="detection-text">
            ${banner.textContent ? banner.textContent.substring(0, 100) + '...' : 'No content available'}
          </div>
          <div class="detection-meta">
            <span class="detection-method">${banner.detectionMethod}</span>
            <span class="detection-url">${banner.url}</span>
          </div>
        </div>
      </div>
    `;
  }

  updateDomainFilter() {
    const domains = [...new Set(this.data.map(banner => banner.domain))].sort();
    const filter = document.getElementById('domainFilter');
    if (!filter) return;

    const currentValue = filter.value;
    filter.innerHTML = '<option value="">All Domains</option>' + 
      domains.map(domain => `<option value="${domain}">${domain}</option>`).join('');
    filter.value = currentValue;
  }

  setupCharts() {
    this.setupTimelineChart();
  }

  setupTimelineChart() {
    const ctx = document.getElementById('timelineChart');
    if (!ctx) return;

    this.charts.timeline = new Chart(ctx, {
      type: 'line',
      data: {
        labels: [],
        datasets: [{
          label: 'Detections',
          data: [],
          borderColor: '#7c3aed',
          backgroundColor: 'rgba(124, 58, 237, 0.1)',
          tension: 0.4,
          fill: true
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            display: false
          }
        },
        scales: {
          y: {
            beginAtZero: true,
            grid: {
              color: 'rgba(255, 255, 255, 0.1)'
            },
            ticks: {
              color: '#e5e7eb'
            }
          },
          x: {
            grid: {
              color: 'rgba(255, 255, 255, 0.1)'
            },
            ticks: {
              color: '#e5e7eb'
            }
          }
        }
      }
    });
  }

  updateCharts() {
    this.updateTimelineChart();
  }

  updateTimelineChart() {
    if (!this.charts.timeline) return;

    // Group detections by date
    const dateCounts = {};
    this.data.forEach(banner => {
      const date = new Date(banner.created_at).toLocaleDateString();
      dateCounts[date] = (dateCounts[date] || 0) + 1;
    });

    const dates = Object.keys(dateCounts).sort();
    const counts = dates.map(date => dateCounts[date]);

    this.charts.timeline.data.labels = dates;
    this.charts.timeline.data.datasets[0].data = counts;
    this.charts.timeline.update();
  }

  async showDetailedAnalysis(bannerId) {
    const banner = this.data.find(b => b.id === bannerId);
    if (!banner) return;

    const modal = document.getElementById('analysisModal');
    const content = document.getElementById('modalContent');
    
    content.innerHTML = `
      <div class="modal-header">
        <h3>Cookie Banner Details</h3>
        <button id="closeModal">&times;</button>
      </div>
      <div class="modal-body">
        <div class="detail-section">
          <h4>Basic Information</h4>
          <p><strong>Domain:</strong> ${banner.domain}</p>
          <p><strong>URL:</strong> ${banner.url}</p>
          <p><strong>Detection Method:</strong> ${banner.detectionMethod}</p>
          <p><strong>Detected:</strong> ${new Date(banner.created_at).toLocaleString()}</p>
        </div>
        
        <div class="detail-section">
          <h4>Banner Content</h4>
          <div class="content-box">
            ${banner.textContent || 'No content available'}
          </div>
        </div>
        
        ${banner.buttons && banner.buttons.length > 0 ? `
          <div class="detail-section">
            <h4>Buttons Found</h4>
            <ul>
              ${banner.buttons.map(btn => `<li>${btn.text || 'Unknown button'}</li>`).join('')}
            </ul>
          </div>
        ` : ''}
        
        ${banner.policyLinks && banner.policyLinks.length > 0 ? `
          <div class="detail-section">
            <h4>Policy Links</h4>
            <ul>
              ${banner.policyLinks.map(link => `<li><a href="${link.href}" target="_blank">${link.text}</a></li>`).join('')}
            </ul>
          </div>
        ` : ''}
      </div>
    `;
    
    modal.style.display = 'flex';
  }

  closeModal() {
    document.getElementById('analysisModal').style.display = 'none';
  }

  exportData() {
    const csvContent = this.convertToCSV(this.data);
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `cookie_banners_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  convertToCSV(data) {
    const headers = ['id', 'domain', 'url', 'detectionMethod', 'textContent', 'created_at'];
    const csvRows = [headers.join(',')];
    
    data.forEach(banner => {
      const row = headers.map(header => {
        const value = banner[header] || '';
        return `"${value.toString().replace(/"/g, '""')}"`;
      });
      csvRows.push(row.join(','));
    });
    
    return csvRows.join('\n');
  }
}

// Initialize dashboard
const dashboard = new CookieDashboard();
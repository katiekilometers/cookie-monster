document.addEventListener('DOMContentLoaded', async () => {
    console.log('🚀 Popup initialized');
    
    // Debug: Check if tabs exist in DOM
    const tabsContainer = document.querySelector('.tabs');
    console.log('📑 Tabs container found:', tabsContainer);
    
    const tabs = document.querySelectorAll('.tab');
    console.log(`📑 Found ${tabs.length} tabs:`, tabs);
    
    // Debug: Log each tab's data-tab attribute
    tabs.forEach((tab, index) => {
      console.log(`🔗 Tab ${index}:`, {
        text: tab.textContent,
        dataTab: tab.getAttribute('data-tab'),
        classes: tab.className
      });
    });
    
    await loadPopupData();
    document.getElementById('refreshBtn').addEventListener('click', async () => {
      await loadPopupData();
    });
    document.getElementById('clearBtn').addEventListener('click', clearData);
    
    // Add tab switching functionality
    tabs.forEach(tab => {
      console.log(`🔗 Setting up tab: ${tab.getAttribute('data-tab')}`);
      tab.addEventListener('click', (e) => {
        e.preventDefault();
        const targetTab = tab.getAttribute('data-tab');
        console.log(`🔄 Switching to tab: ${targetTab}`);
        switchTab(targetTab);
      });
    });
    
    // Add listener for tab changes to update popup data
    chrome.tabs.onActivated.addListener(async () => {
      await loadPopupData();
    });
    
    // Add listener for tab updates (when URL changes)
    chrome.tabs.onUpdated.addListener(async (tabId, changeInfo, tab) => {
      if (changeInfo.status === 'complete') {
        await loadPopupData();
      }
    });
    
    // Load aggregate data on initialization
    await loadAggregateData();
    
    // Add listener for popup focus to refresh data
    window.addEventListener('focus', async () => {
      await loadPopupData();
    });
    
    // Listen for storage changes (when content script detects new banners)
    chrome.storage.onChanged.addListener(async (changes, namespace) => {
      if (namespace === 'local' && changes.cookiePopups) {
        console.log('Storage changed - new cookie banner detected');
        await loadPopupData();
      }
    });
    
    // Listen for messages from content script
    chrome.runtime.onMessage.addListener(async (message, sender, sendResponse) => {
      if (message.type === 'POPUP_DETECTED') {
        console.log('New popup detected from content script');
        await loadPopupData();
      }
    });
  });
  
  // Tab switching function
  function switchTab(tabName) {
    console.log(`🔄 Switching to tab: ${tabName}`);
    
    // Update tab buttons
    const allTabs = document.querySelectorAll('.tab');
    console.log(`📑 Updating ${allTabs.length} tab buttons`);
    
    allTabs.forEach(tab => {
      tab.classList.remove('active');
    });
    
    const activeTab = document.querySelector(`[data-tab="${tabName}"]`);
    if (activeTab) {
      activeTab.classList.add('active');
      console.log(`✅ Activated tab button: ${tabName}`);
    } else {
      console.error(`❌ Tab button not found: ${tabName}`);
    }
    
    // Update tab content
    const allContents = document.querySelectorAll('.tab-content');
    console.log(`📄 Updating ${allContents.length} tab contents`);
    
    allContents.forEach(content => {
      content.classList.remove('active');
    });
    
    const activeContent = document.getElementById(`${tabName}Tab`);
    if (activeContent) {
      activeContent.classList.add('active');
      console.log(`✅ Activated tab content: ${tabName}Tab`);
    } else {
      console.error(`❌ Tab content not found: ${tabName}Tab`);
    }
    
    // Load aggregate data if switching to aggregate tab
    if (tabName === 'aggregate') {
      console.log('📊 Loading aggregate data...');
      loadAggregateData();
    }
  }
  
  async function loadPopupData() {
    try {
      console.log('🔄 Loading popup data...');
      const result = await chrome.storage.local.get(['cookiePopups']);
      const popups = result.cookiePopups || [];
      
      console.log(`📊 Found ${popups.length} stored popups`);
      
      await displayStats(popups);
      await displayPrivacyPolicy();
      
      // Add visual feedback that data was refreshed
      const refreshBtn = document.getElementById('refreshBtn');
      if (refreshBtn) {
        refreshBtn.textContent = '✓ Refreshed';
        setTimeout(() => {
          refreshBtn.textContent = '🔄 Refresh';
        }, 1000);
      }
      
      console.log('✅ Popup data loaded successfully');
    } catch (error) {
      console.error('❌ Error loading popup data:', error);
    }
  }
  
  async function loadAggregateData() {
    try {
      console.log('📊 Loading aggregate data...');
      
      // Fetch all banner data from API
      const response = await fetch('http://localhost:3000/api/cookie-banners');
      const data = await response.json();
      
      if (!data.success) {
        console.error('Failed to fetch aggregate data');
        return;
      }
      
      const banners = data.banners || [];
      
      // Get all privacy analysis data from storage
      const allKeys = await chrome.storage.local.get(null);
      const privacyKeys = Object.keys(allKeys).filter(key => key.startsWith('privacyAnalysis_'));
      
      const scores = [];
      const gradeCounts = { A: 0, B: 0, C: 0, D: 0, E: 0, F: 0 };
      const siteScores = {};
      
      // Process privacy analysis data
      privacyKeys.forEach(key => {
        const analysis = allKeys[key];
        if (analysis && analysis.scoreData) {
          const score = analysis.scoreData.score;
          const grade = analysis.scoreData.grade;
          const domain = analysis.domain;
          
          scores.push(score);
          gradeCounts[grade] = (gradeCounts[grade] || 0) + 1;
          
          siteScores[domain] = {
            domain: domain,
            score: score,
            grade: grade,
            bannerCount: banners.filter(b => b.domain === domain).length
          };
        }
      });
      
      // Calculate averages and rankings
      const avgScore = scores.length > 0 ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length) : 0;
      
      const siteArray = Object.values(siteScores);
      const topSites = siteArray
        .filter(site => site.score >= 70)
        .sort((a, b) => b.score - a.score)
        .slice(0, 5);
      
      const lowScores = siteArray
        .filter(site => site.score < 50)
        .sort((a, b) => a.score - b.score)
        .slice(0, 5);
      
      const aggregateStats = {
        totalSites: new Set(banners.map(b => b.domain)).size,
        totalBanners: banners.length,
        totalPolicies: banners.filter(b => b.privacyLinks && b.privacyLinks.length > 0).length,
        avgScore: avgScore,
        gradeDistribution: gradeCounts,
        topSites: topSites,
        lowScores: lowScores
      };
      
      // Display aggregate statistics
      displayAggregateStats(aggregateStats);
      
      // Display grade distribution
      displayGradeDistribution(aggregateStats.gradeDistribution);
      
      // Display top and low performing sites
      displayTopSites(aggregateStats.topSites);
      displayLowScores(aggregateStats.lowScores);
      
      console.log('✅ Aggregate data loaded successfully');
    } catch (error) {
      console.error('❌ Error loading aggregate data:', error);
    }
  }
  
  function calculateAggregateStats(banners) {
    const domains = new Set();
    const scores = [];
    const gradeCounts = { A: 0, B: 0, C: 0, D: 0, E: 0, F: 0 };
    const siteScores = {};
    
    banners.forEach(banner => {
      domains.add(banner.domain);
    });
    
    // For now, return basic stats without privacy analysis
    // Privacy analysis data will be loaded asynchronously
    return {
      totalSites: domains.size,
      totalBanners: banners.length,
      totalPolicies: banners.filter(b => b.privacyLinks && b.privacyLinks.length > 0).length,
      avgScore: 0,
      gradeDistribution: gradeCounts,
      topSites: [],
      lowScores: []
    };
  }
  
  function displayAggregateStats(stats) {
    document.getElementById('totalSites').textContent = stats.totalSites;
    document.getElementById('totalBanners').textContent = stats.totalBanners;
    document.getElementById('totalPolicies').textContent = stats.totalPolicies;
    document.getElementById('avgScore').textContent = stats.avgScore > 0 ? `${stats.avgScore}/100` : '-';
  }
  
  function displayGradeDistribution(gradeDistribution) {
    const container = document.getElementById('gradeDistribution');
    container.innerHTML = '';
    
    const grades = ['A', 'B', 'C', 'D', 'E', 'F'];
    const colors = {
      'A': '#10b981',
      'B': '#3b82f6', 
      'C': '#f59e0b',
      'D': '#f97316',
      'E': '#ef4444',
      'F': '#dc2626'
    };
    
    grades.forEach(grade => {
      const count = gradeDistribution[grade] || 0;
      const bar = document.createElement('div');
      bar.className = 'grade-bar';
      bar.style.backgroundColor = `${colors[grade]}20`;
      bar.style.color = colors[grade];
      bar.style.border = `1px solid ${colors[grade]}40`;
      bar.textContent = count;
      container.appendChild(bar);
    });
  }
  
  function displayTopSites(topSites) {
    const container = document.getElementById('topSites');
    container.innerHTML = '';
    
    if (topSites.length === 0) {
      container.innerHTML = '<div style="text-align: center; color: #94a3b8; font-style: italic; padding: 20px;">No high-performing sites yet</div>';
      return;
    }
    
    topSites.forEach(site => {
      const item = document.createElement('div');
      item.className = 'site-item';
      item.innerHTML = `
        <div class="site-domain">${site.domain}</div>
        <div class="site-score grade-${site.grade.toLowerCase()}">${site.score}/100</div>
      `;
      container.appendChild(item);
    });
  }
  
  function displayLowScores(lowScores) {
    const container = document.getElementById('lowScores');
    container.innerHTML = '';
    
    if (lowScores.length === 0) {
      container.innerHTML = '<div style="text-align: center; color: #94a3b8; font-style: italic; padding: 20px;">No low-scoring sites found</div>';
      return;
    }
    
    lowScores.forEach(site => {
      const item = document.createElement('div');
      item.className = 'site-item';
      item.innerHTML = `
        <div class="site-domain">${site.domain}</div>
        <div class="site-score grade-${site.grade.toLowerCase()}">${site.score}/100</div>
      `;
      container.appendChild(item);
    });
  }
  
  async function displayStats(popups) {
    try {
      // Get current domain for privacy analysis
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      const domain = getDomainFromUrl(tab.url);
      
      // Get privacy analysis data for current domain
      const privacyResult = await chrome.storage.local.get([`privacyAnalysis_${domain}`]);
      const privacyData = privacyResult[`privacyAnalysis_${domain}`];
      
      // Update privacy score stat
      const privacyScoreValue = document.getElementById('privacyScoreValue');
      if (privacyData && privacyData.scoreData) {
        privacyScoreValue.textContent = `${privacyData.scoreData.score}/100`;
        privacyScoreValue.style.color = getGradeColor(privacyData.scoreData.grade);
      } else {
        privacyScoreValue.textContent = '-';
        privacyScoreValue.style.color = '#6b7280';
      }
      
      // Count unique domains with privacy policies
      const domainsWithPolicies = new Set();
      for (const popup of popups) {
        if (popup.privacyLinks && popup.privacyLinks.length > 0) {
          domainsWithPolicies.add(getDomainFromUrl(popup.url));
        }
      }
      
      const policyCount = document.getElementById('policyCount');
      policyCount.textContent = domainsWithPolicies.size;
      
    } catch (error) {
      console.error('Error displaying stats:', error);
    }
  }
  
  function getGradeColor(grade) {
    const gradeColors = {
      'A': '#10b981',
      'B': '#3b82f6', 
      'C': '#f59e0b',
      'D': '#f97316',
      'E': '#ef4444',
      'F': '#dc2626'
    };
    return gradeColors[grade] || '#6b7280';
  }
  
  async function displayPrivacyPolicy() {
    try {
      console.log('🔍 Checking for privacy policy data...');
      // Get current tab to check for privacy policy links
      const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
      if (!tabs.length) return;

      const currentTab = tabs[0];
      const domain = getDomainFromUrl(currentTab.url);
      console.log(`🌐 Current domain: ${domain}`);
      
      // Check for cached privacy analysis results
      const cachedResult = await chrome.storage.local.get([`privacyAnalysis_${domain}`]);
      const cachedData = cachedResult[`privacyAnalysis_${domain}`];
      
      // Fetch banner data for current domain
      const response = await fetch(`http://localhost:3000/api/cookie-banners/domain/${domain}`);
      const data = await response.json();
      
      console.log(`📋 Found ${data.banners?.length || 0} banners for ${domain}`);
      
      if (!data.success || !data.banners.length) {
        // Hide privacy section if no banner data
        const privacySection = document.getElementById('privacySection');
        if (privacySection) {
          privacySection.style.display = 'none';
        }
        console.log('❌ No banner data found, hiding privacy section');
        return;
      }

      const banner = data.banners[0];
      const privacyLinks = banner.privacyLinks || [];
      
      if (privacyLinks.length === 0) {
        return;
      }

      // Show privacy section
      const privacySection = document.getElementById('privacySection');
      const privacyHeader = document.getElementById('privacyHeader');
      privacyHeader.textContent = '🔒 Privacy Policy for Current Site';
      privacySection.style.display = 'block';
      
      // Hide privacy content by default
      const privacyContent = document.getElementById('privacyContent');
      privacyContent.style.display = 'none';
      
      // Show privacy links section
      const privacyLinksSection = document.getElementById('privacyLinks');
      privacyLinksSection.style.display = 'block';
      
      // Show privacy score section
      const privacyScoreSection = document.getElementById('privacyScore');
      privacyScoreSection.style.display = 'block';
      
      // Display privacy links
      const linksContainer = document.getElementById('linksContainer');
      linksContainer.innerHTML = '';
      privacyLinks.forEach(link => {
        const linkElement = document.createElement('div');
        linkElement.className = 'policy-link';
        // Display the text property if available, otherwise use the href
        linkElement.textContent = link.text || link.href || link;
        linkElement.onclick = async (e) => {
          e.preventDefault();
          await showPrivacyPolicyModal(link.href || link);
        };
        linksContainer.appendChild(linkElement);
      });

      // Handle Claude analysis with caching
      const claudeSummary = document.getElementById('claudeSummary');
      claudeSummary.style.display = 'block';
      const summaryContent = document.getElementById('summaryContent');
      
      if (cachedData && cachedData.claudeSummary) {
        // Use cached Claude summary
        summaryContent.textContent = cachedData.claudeSummary;
      } else {
        // Run new Claude analysis
        summaryContent.textContent = 'Analyzing...';
        
        // Get the first privacy link URL (extract href from the object)
        const firstPrivacyUrl = privacyLinks[0]?.href || privacyLinks[0];
        
        const analyzeRes = await fetch('http://localhost:3000/api/analyze-privacy-policy', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ url: firstPrivacyUrl })
        });
        const analyzeData = await analyzeRes.json();
        
        if (analyzeData.success && analyzeData.summary) {
          summaryContent.textContent = analyzeData.summary;
          
          // Cache the result
          await chrome.storage.local.set({
            [`privacyAnalysis_${domain}`]: {
              claudeSummary: analyzeData.summary,
              timestamp: Date.now(),
              domain: domain
            }
          });
        } else {
          summaryContent.textContent = 'Failed to analyze privacy policy.';
        }
      }

      // Handle privacy scoring with caching
      const scoreContent = document.getElementById('scoreContent');
      if (cachedData && cachedData.scoreData) {
        // Use cached score data
        displayPrivacyScore(cachedData.scoreData);
      } else {
        // Automatically run scoring instead of showing button
        try {
          // Get the first privacy link URL
          const firstPrivacyUrl = privacyLinks[0]?.href || privacyLinks[0];
          
          // Show loading state
          scoreContent.innerHTML = '<div style="text-align: center; color: #cbd5e1; padding: 20px;">Scoring privacy policy...</div>';
          
          // Call the scoring API
          const scoreRes = await fetch('http://localhost:3000/api/score-privacy-policy', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ url: firstPrivacyUrl })
          });
          
          const scoreData = await scoreRes.json();
          
          if (scoreData.success) {
            displayPrivacyScore(scoreData);
            
            // Cache the score result
            const currentCache = await chrome.storage.local.get([`privacyAnalysis_${domain}`]);
            const updatedCache = {
              ...currentCache[`privacyAnalysis_${domain}`],
              scoreData: scoreData,
              timestamp: Date.now()
            };
            await chrome.storage.local.set({
              [`privacyAnalysis_${domain}`]: updatedCache
            });
          } else {
            // Fallback to button if scoring fails
            scoreContent.innerHTML = '<button id="scoreBtn" class="score-btn">Score Privacy Policy</button>';
            
            // Add scoring button functionality
            const scoreBtn = document.getElementById('scoreBtn');
            if (scoreBtn) {
              scoreBtn.addEventListener('click', async function() {
                try {
                  scoreBtn.disabled = true;
                  scoreBtn.textContent = 'Scoring...';
                  
                  const retryRes = await fetch('http://localhost:3000/api/score-privacy-policy', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ url: firstPrivacyUrl })
                  });
                  
                  const retryData = await retryRes.json();
                  
                  if (retryData.success) {
                    displayPrivacyScore(retryData);
                    
                    // Cache the score result
                    const currentCache = await chrome.storage.local.get([`privacyAnalysis_${domain}`]);
                    const updatedCache = {
                      ...currentCache[`privacyAnalysis_${domain}`],
                      scoreData: retryData,
                      timestamp: Date.now()
                    };
                    await chrome.storage.local.set({
                      [`privacyAnalysis_${domain}`]: updatedCache
                    });
                  } else {
                    scoreContent.innerHTML = '<div style="color: #ef4444;">Failed to score privacy policy.</div>';
                  }
                  
                } catch (error) {
                  console.error('Error scoring privacy policy:', error);
                  scoreContent.innerHTML = '<div style="color: #ef4444;">Error scoring privacy policy.</div>';
                } finally {
                  scoreBtn.disabled = false;
                  scoreBtn.textContent = 'Score Privacy Policy';
                }
              });
            }
          }
          
        } catch (error) {
          console.error('Error automatically scoring privacy policy:', error);
          // Fallback to button if automatic scoring fails
          scoreContent.innerHTML = '<button id="scoreBtn" class="score-btn">Score Privacy Policy</button>';
          
          // Add scoring button functionality
          const scoreBtn = document.getElementById('scoreBtn');
          if (scoreBtn) {
            scoreBtn.addEventListener('click', async function() {
              try {
                const firstPrivacyUrl = privacyLinks[0]?.href || privacyLinks[0];
                scoreBtn.disabled = true;
                scoreBtn.textContent = 'Scoring...';
                
                const retryRes = await fetch('http://localhost:3000/api/score-privacy-policy', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ url: firstPrivacyUrl })
                });
                
                const retryData = await retryRes.json();
                
                if (retryData.success) {
                  displayPrivacyScore(retryData);
                  
                  // Cache the score result
                  const currentCache = await chrome.storage.local.get([`privacyAnalysis_${domain}`]);
                  const updatedCache = {
                    ...currentCache[`privacyAnalysis_${domain}`],
                    scoreData: retryData,
                    timestamp: Date.now()
                  };
                  await chrome.storage.local.set({
                    [`privacyAnalysis_${domain}`]: updatedCache
                  });
                } else {
                  scoreContent.innerHTML = '<div style="color: #ef4444;">Failed to score privacy policy.</div>';
                }
                
              } catch (error) {
                console.error('Error scoring privacy policy:', error);
                scoreContent.innerHTML = '<div style="color: #ef4444;">Error scoring privacy policy.</div>';
              } finally {
                scoreBtn.disabled = false;
                scoreBtn.textContent = 'Score Privacy Policy';
              }
            });
          }
        }
      }

    } catch (error) {
      console.error('Error displaying privacy policy:', error);
    }
  }

  async function fetchPrivacyPolicyContent(url) {
    const contentContainer = document.getElementById('privacyContent');
    
    try {
      // Show loading state
      contentContainer.innerHTML = '<div class="loading">Loading privacy policy content...</div>';
      contentContainer.className = 'privacy-content loading';

      // Fetch privacy policy content
      const response = await fetch(`http://localhost:3000/api/privacy-policy?url=${encodeURIComponent(url)}`);
      const data = await response.json();

      if (data.success) {
        // Display the content
        const content = data.content;
        const truncatedContent = content.length > 1000 
          ? content.substring(0, 1000) + '...\n\n[Content truncated - click link above to view full policy]'
          : content;
        
        contentContainer.innerHTML = `<div>${truncatedContent.replace(/\n/g, '<br>')}</div>`;
        contentContainer.className = 'privacy-content';
      } else {
        contentContainer.innerHTML = `<div class="error">Failed to load privacy policy: ${data.error}</div>`;
        contentContainer.className = 'privacy-content error';
      }

    } catch (error) {
      console.error('Error fetching privacy policy content:', error);
      contentContainer.innerHTML = '<div class="error">Error loading privacy policy content</div>';
      contentContainer.className = 'privacy-content error';
    }
  }

  async function analyzePrivacyPolicy(url) {
    const summaryContent = document.getElementById('summaryContent');
    const analyzeBtn = document.getElementById('analyzeBtn');
    
    try {
      // Show loading state
      summaryContent.innerHTML = '<div style="text-align: center; color: #888; font-style: italic;">Analyzing with Claude...</div>';
      analyzeBtn.disabled = true;
      analyzeBtn.textContent = 'Analyzing...';

      // Send to API for Claude analysis
      const response = await fetch('http://localhost:3000/api/analyze-privacy-policy', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ url: url })
      });

      const data = await response.json();

      if (data.success) {
        // Display the Claude summary
        summaryContent.innerHTML = `<div style="color: #10b981; font-weight: 600;">${data.summary}</div>`;
      } else {
        summaryContent.innerHTML = `<div style="color: #ef4444;">Failed to analyze: ${data.error}</div>`;
      }

    } catch (error) {
      console.error('Error analyzing privacy policy:', error);
      summaryContent.innerHTML = '<div style="color: #ef4444;">Error analyzing privacy policy</div>';
    } finally {
      // Reset button state
      analyzeBtn.disabled = false;
      analyzeBtn.textContent = 'Analyze with Claude';
    }
  }

  async function clearData() {
    try {
      // Clear local storage
      await chrome.storage.local.remove(['cookiePopups']);
      
      // Clear privacy analysis cache
      const allKeys = await chrome.storage.local.get(null);
      const privacyKeys = Object.keys(allKeys).filter(key => key.startsWith('privacyAnalysis_'));
      if (privacyKeys.length > 0) {
        await chrome.storage.local.remove(privacyKeys);
      }
      
      // Clear API data
      await fetch('http://localhost:3000/api/cookie-banners', {
        method: 'DELETE'
      });
      
      // Reload data
      await loadPopupData();
      
      console.log('Data cleared successfully');
    } catch (error) {
      console.error('Error clearing data:', error);
    }
  }

  function getDomainFromUrl(url) {
    try {
      const urlObj = new URL(url);
      // Include port in domain for localhost to distinguish between test sites
      const domain = urlObj.hostname === 'localhost' || urlObj.hostname === '127.0.0.1' 
        ? `${urlObj.hostname}:${urlObj.port}`
        : urlObj.hostname;
      return domain;
    } catch (e) {
      return url;
    }
  }

  // Animate header gradient based on cursor position
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

  function showPrivacyContent() {
    const privacyContent = document.getElementById('privacyContent');
    if (privacyContent) {
      privacyContent.style.display = 'block';
    }
  }

  async function showPrivacyPolicyModal(url) {
    try {
      // Show the modal
      const modal = document.getElementById('privacyModal');
      const modalContent = document.getElementById('modalContent');
      modal.style.display = 'block';
      
      // Show loading state
      modalContent.innerHTML = '<div style="text-align: center; padding: 20px;">Loading privacy policy...</div>';
      
      // Fetch the privacy policy content
      const response = await fetch(`http://localhost:3000/api/privacy-policy?url=${encodeURIComponent(url)}`);
      const data = await response.json();
      
      if (data.success && data.content) {
        // Display the full privacy policy content
        modalContent.innerHTML = `
          <div style="white-space: pre-wrap; font-size: 0.9em; line-height: 1.5; color: #bfc9e6;">
            ${data.content}
          </div>
        `;
      } else {
        modalContent.innerHTML = '<div style="text-align: center; padding: 20px; color: #ef4444;">Failed to load privacy policy</div>';
      }
    } catch (error) {
      console.error('Error fetching privacy policy:', error);
      const modalContent = document.getElementById('modalContent');
      modalContent.innerHTML = '<div style="text-align: center; padding: 20px; color: #ef4444;">Error loading privacy policy</div>';
    }
  }

  // Add modal close functionality
  document.addEventListener('DOMContentLoaded', function() {
    const modal = document.getElementById('privacyModal');
    const closeBtn = document.getElementById('closeModal');
    
    // Close modal when clicking the X button
    closeBtn.onclick = function() {
      modal.style.display = 'none';
    }
    
    // Close modal when clicking outside of it
    window.onclick = function(event) {
      if (event.target === modal) {
        modal.style.display = 'none';
      }
    }
    
    // Close modal with Escape key
    document.addEventListener('keydown', function(event) {
      if (event.key === 'Escape' && modal.style.display === 'block') {
        modal.style.display = 'none';
      }
    });

    // Add refresh analysis button functionality
    const refreshAnalysisBtn = document.getElementById('refreshAnalysisBtn');
    if (refreshAnalysisBtn) {
      refreshAnalysisBtn.addEventListener('click', async function() {
        try {
          // Get current tab to check for privacy policy links
          const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
          if (!tabs.length) return;

          const currentTab = tabs[0];
          const domain = getDomainFromUrl(currentTab.url);
          
          // Fetch banner data for current domain
          const response = await fetch(`http://localhost:3000/api/cookie-banners/domain/${domain}`);
          const data = await response.json();
          
          if (!data.success || !data.banners.length) {
            return;
          }

          const banner = data.banners[0];
          const privacyLinks = banner.privacyLinks || [];
          
          if (privacyLinks.length === 0) {
            return;
          }

          // Show loading state
          refreshAnalysisBtn.disabled = true;
          refreshAnalysisBtn.textContent = '🔄 Refreshing...';
          
          const summaryContent = document.getElementById('summaryContent');
          summaryContent.textContent = 'Analyzing...';
          
          // Get the first privacy link URL
          const firstPrivacyUrl = privacyLinks[0]?.href || privacyLinks[0];
          
          // Run new Claude analysis
          const analyzeRes = await fetch('http://localhost:3000/api/analyze-privacy-policy', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ url: firstPrivacyUrl })
          });
          const analyzeData = await analyzeRes.json();
          
          if (analyzeData.success && analyzeData.summary) {
            summaryContent.textContent = analyzeData.summary;
            
            // Update cache with new analysis
            await chrome.storage.local.set({
              [`privacyAnalysis_${domain}`]: {
                claudeSummary: analyzeData.summary,
                timestamp: Date.now(),
                domain: domain
              }
            });
          } else {
            summaryContent.textContent = 'Failed to analyze privacy policy.';
          }
          
          // Run new privacy scoring
          const scoreRes = await fetch('http://localhost:3000/api/score-privacy-policy', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ url: firstPrivacyUrl })
          });
          
          const scoreData = await scoreRes.json();
          
          if (scoreData.success) {
            displayPrivacyScore(scoreData);
            
            // Update cache with new score data
            const currentCache = await chrome.storage.local.get([`privacyAnalysis_${domain}`]);
            const updatedCache = {
              ...currentCache[`privacyAnalysis_${domain}`],
              scoreData: scoreData,
              timestamp: Date.now()
            };
            await chrome.storage.local.set({
              [`privacyAnalysis_${domain}`]: updatedCache
            });
          }
          
        } catch (error) {
          console.error('Error refreshing analysis:', error);
          const summaryContent = document.getElementById('summaryContent');
          summaryContent.textContent = 'Error refreshing analysis.';
        } finally {
          refreshAnalysisBtn.disabled = false;
          refreshAnalysisBtn.textContent = '🔄 Refresh Analysis';
        }
      });
    }
  });

  function displayPrivacyScore(scoreData) {
    const scoreContent = document.getElementById('scoreContent');
    
    if (!scoreContent) {
      console.error('scoreContent element not found');
      return;
    }
    
    // Clear any loading content first
    scoreContent.innerHTML = '';
    
    let scoreGrade = document.getElementById('scoreGrade');
    let scoreBtn = document.getElementById('scoreBtn');
    let detailedAnalysisBtn = document.getElementById('detailedAnalysisBtn');
    
    const gradeColors = {
      'A': '#10b981',
      'B': '#3b82f6', 
      'C': '#f59e0b',
      'D': '#f97316',
      'E': '#ef4444',
      'F': '#dc2626'
    };
    
    const gradeColor = gradeColors[scoreData.grade] || '#6b7280';
    
    // Create scoreGrade element if it doesn't exist
    if (!scoreGrade) {
      scoreGrade = document.createElement('div');
      scoreGrade.id = 'scoreGrade';
      scoreGrade.className = 'score-grade';
      scoreContent.appendChild(scoreGrade);
    }
    
    // Show the grade automatically with better styling
    scoreGrade.style.display = 'block';
    scoreGrade.className = `score-grade grade-${scoreData.grade.toLowerCase()}`;
    scoreGrade.style.textAlign = 'center';
    scoreGrade.style.padding = '12px';
    scoreGrade.style.marginBottom = '12px';
    scoreGrade.style.borderRadius = '8px';
    scoreGrade.style.backgroundColor = `${gradeColor}20`;
    scoreGrade.style.border = `2px solid ${gradeColor}`;
    scoreGrade.innerHTML = `
      <div style="font-size: 1.8em; font-weight: bold; color: ${gradeColor}; margin-bottom: 4px;">Grade ${scoreData.grade}</div>
      <div style="font-size: 1.2em; color: #e2e8f0;">${scoreData.score}/100 points</div>
    `;
    
    // Hide the score button if it exists
    if (scoreBtn) {
      scoreBtn.style.display = 'none';
    }
    
    // Create detailedAnalysisBtn if it doesn't exist
    if (!detailedAnalysisBtn) {
      detailedAnalysisBtn = document.createElement('button');
      detailedAnalysisBtn.id = 'detailedAnalysisBtn';
      detailedAnalysisBtn.className = 'detailed-analysis-btn';
      detailedAnalysisBtn.textContent = '📋 See Detailed Analysis';
      scoreContent.appendChild(detailedAnalysisBtn);
    }
    
    // Show detailed analysis button with better styling
    detailedAnalysisBtn.style.display = 'block';
    detailedAnalysisBtn.style.marginTop = '8px';
    detailedAnalysisBtn.style.width = '100%';
    detailedAnalysisBtn.style.padding = '8px 12px';
    detailedAnalysisBtn.style.backgroundColor = '#374151';
    detailedAnalysisBtn.style.color = '#e2e8f0';
    detailedAnalysisBtn.style.border = '1px solid #4b5563';
    detailedAnalysisBtn.style.borderRadius = '6px';
    detailedAnalysisBtn.style.cursor = 'pointer';
    detailedAnalysisBtn.style.fontSize = '0.85em';
    detailedAnalysisBtn.style.transition = 'all 0.2s ease';
    
    // Add hover effect
    detailedAnalysisBtn.onmouseenter = function() {
      this.style.backgroundColor = '#4b5563';
      this.style.borderColor = '#6b7280';
    };
    detailedAnalysisBtn.onmouseleave = function() {
      this.style.backgroundColor = '#374151';
      this.style.borderColor = '#4b5563';
    };
    
    let breakdownHtml = '';
    Object.keys(scoreData.breakdown).forEach(factor => {
      const score = scoreData.breakdown[factor];
      const maxScore = getMaxScoreForFactor(factor);
      const percentage = Math.round((score / maxScore) * 100);
      const color = percentage >= 70 ? '#10b981' : percentage >= 40 ? '#f59e0b' : '#ef4444';
      breakdownHtml += `
        <div class="score-breakdown-item" style="display: flex; justify-content: space-between; padding: 6px 0; border-bottom: 1px solid #374151;">
          <span style="color: #e2e8f0;">${formatFactorName(factor)}</span>
          <span style="color: ${color}; font-weight: 500;">${score}/${maxScore} (${percentage}%)</span>
        </div>
      `;
    });
    
    // Store the full breakdown HTML for later use
    scoreContent.setAttribute('data-breakdown', breakdownHtml);
    scoreContent.setAttribute('data-recommendations', JSON.stringify(scoreData.recommendations || []));
    
    // Add click handler for detailed analysis button
    detailedAnalysisBtn.onclick = function() {
      const breakdown = scoreContent.querySelector('.score-breakdown');
      const recommendations = scoreContent.querySelector('.recommendations');
      
      if (breakdown && breakdown.classList.contains('show')) {
        // Hide detailed analysis
        breakdown.classList.remove('show');
        if (recommendations) recommendations.style.display = 'none';
        detailedAnalysisBtn.textContent = '📋 See Detailed Analysis';
      } else {
        // Show detailed analysis
        if (!breakdown) {
          const newBreakdown = document.createElement('div');
          newBreakdown.className = 'score-breakdown show';
          newBreakdown.style.marginTop = '12px';
          newBreakdown.style.padding = '12px';
          newBreakdown.style.backgroundColor = 'rgba(30, 41, 59, 0.4)';
          newBreakdown.style.borderRadius = '6px';
          newBreakdown.style.border = '1px solid #374151';
          newBreakdown.innerHTML = `
            <div style="font-weight: 600; color: #e2e8f0; margin-bottom: 8px; font-size: 0.9em;">Score Breakdown:</div>
            ${breakdownHtml}
          `;
          scoreContent.appendChild(newBreakdown);
          
          // Add recommendations if they exist
          const recs = JSON.parse(scoreContent.getAttribute('data-recommendations') || '[]');
          if (recs.length > 0) {
            const recsDiv = document.createElement('div');
            recsDiv.className = 'recommendations';
            recsDiv.style.marginTop = '12px';
            recsDiv.style.padding = '12px';
            recsDiv.style.backgroundColor = 'rgba(239, 68, 68, 0.1)';
            recsDiv.style.borderRadius = '6px';
            recsDiv.style.border = '1px solid rgba(239, 68, 68, 0.3)';
            recsDiv.style.fontSize = '0.8em';
            recsDiv.innerHTML = `
              <strong style="color: #ef4444;">Recommendations for Improvement:</strong>
              <ul style="margin: 8px 0; padding-left: 16px; color: #cbd5e1;">
                ${recs.map(rec => `<li style="margin-bottom: 4px;">${rec}</li>`).join('')}
              </ul>
            `;
            scoreContent.appendChild(recsDiv);
          }
        } else {
          breakdown.classList.add('show');
          if (recommendations) recommendations.style.display = 'block';
        }
        detailedAnalysisBtn.textContent = '📋 Hide Detailed Analysis';
      }
    };
  }

  function getMaxScoreForFactor(factor) {
    const maxScores = {
      dataCollection: 20,
      dataSharing: 15,
      userRights: 15,
      dataSecurity: 10,
      clarity: 15,
      dataRetention: 10,
      consentMechanisms: 15
    };
    return maxScores[factor] || 0;
  }

  function formatFactorName(factor) {
    const names = {
      dataCollection: 'Data Collection',
      dataSharing: 'Data Sharing',
      userRights: 'User Rights',
      dataSecurity: 'Data Security',
      clarity: 'Clarity',
      dataRetention: 'Data Retention',
      consentMechanisms: 'Consent Mechanisms'
    };
    return names[factor] || factor;
  }
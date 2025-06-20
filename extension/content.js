console.log('CookiePopupDetector content script loaded on', window.location.href);

class CookiePopupDetector {
    constructor() {

        this.API_BASE_URL = 'http://localhost:3000/api';
      // More specific cookie-related keywords
      this.cookieKeywords = [
        'cookie', 'cookies', 'consent', 'privacy', 'gdpr', 'ccpa',
        'tracking', 'analytics', 'we use cookies', 'this site uses',
        'accept cookies', 'cookie policy', 'privacy policy'
      ];
      
      // Specific selectors for known cookie banner patterns
      this.cookieBannerSelectors = [
        // Common cookie banner specific selectors
        '[class*="cookie-banner" i]',
        '[class*="cookie-consent" i]',
        '[class*="cookie-notice" i]',
        '[class*="cookie-bar" i]',
        '[id*="cookie-banner" i]',
        '[id*="cookie-consent" i]',
        '[id*="cookie-notice" i]',
        '[id*="cookie-bar" i]',
        
        // GDPR/Privacy specific
        '[class*="gdpr" i]',
        '[class*="privacy-banner" i]',
        '[class*="consent-banner" i]',
        '[id*="gdpr" i]',
        '[id*="privacy-banner" i]',
        '[id*="consent-banner" i]',
        
        // Common CMP (Consent Management Platform) selectors
        '[id*="onetrust"]',
        '[class*="onetrust"]',
        '.onetrust-banner-container',
        '#onetrust-consent-sdk',
        '[id*="cookiebot"]',
        '[class*="cookiebot"]',
        '[id*="CybotCookiebotDialog"]',
        '[id*="quantcast"]',
        '[class*="quantcast"]',
        '.qc-cmp-ui',
        '[id*="didomi"]',
        '[class*="didomi"]',
        '[id*="trustarcbar"]',
        '[class*="trustarc"]',
        '[id*="cookiefirst"]',
        '[class*="cookiefirst"]',
        '.cookiealert',
        '.cookie-alert',
        '.cc-banner',
        '#cookieconsent',
        '.cookieconsent'
      ];
      
      this.detectedPopups = new Set();
      this.checkedElements = new WeakSet();
      
      this.init();
    }
  
    init() {
      console.log('🍪 Cookie Banner Detector initialized');
      
      // Staggered detection to catch banners that load at different times
      const delays = [0, 1000, 2000, 3000, 5000];
      delays.forEach(delay => {
        setTimeout(() => {
          console.log(`🔍 Scanning for cookie banners (${delay}ms)`);
          this.scanForCookieBanners();
        }, delay);
      });
      
      // Set up observers for dynamic content
      this.setupMutationObserver();
    }
  
    scanForCookieBanners() {
      // Method 1: Known cookie banner selectors
      this.scanByKnownSelectors();
      
      // Method 2: Position + content analysis (for unknown patterns)
      this.scanByPositionAndContent();
    }
  
    scanByKnownSelectors() {
      const elements = document.querySelectorAll(this.cookieBannerSelectors.join(', '));
      console.log(`Found ${elements.length} elements with known cookie banner selectors`);
      
      elements.forEach(element => {
        if (!this.checkedElements.has(element) && this.isElementVisible(element)) {
          this.checkedElements.add(element);
          console.log('Checking known selector element:', element);
          
          // For known selectors, we're more lenient with scoring
          if (this.calculateCookieBannerScore(element) >= 2) {
            this.processPopup(element, 'known-selector');
          }
        }
      });
    }
  
    scanByPositionAndContent() {
      // Only look at elements that are positioned like typical cookie banners
      const potentialBanners = document.querySelectorAll('div, section, aside, header, footer');
      
      potentialBanners.forEach(element => {
        if (!this.checkedElements.has(element) && this.isLikelyCookieBannerPosition(element)) {
          this.checkedElements.add(element);
          
          const score = this.calculateCookieBannerScore(element);
          console.log('Checking positioned element:', {
            element: this.getElementDescription(element),
            score: score,
            text: element.textContent?.substring(0, 100)
          });
          
          // Higher threshold for unknown patterns
          if (score >= 5) {
            this.processPopup(element, 'position-content');
          }
        }
      });
    }
  
    isLikelyCookieBannerPosition(element) {
      if (!this.isElementVisible(element)) return false;
      
      const style = window.getComputedStyle(element);
      const rect = element.getBoundingClientRect();
      
      // Must be positioned as overlay or banner
      const isPositioned = (
        style.position === 'fixed' || 
        style.position === 'sticky' ||
        style.position === 'absolute'
      );
      
      if (!isPositioned) return false;
      
      // Check if it's positioned like a typical cookie banner
      const isTopBanner = rect.top <= 50 && rect.width > window.innerWidth * 0.5;
      const isBottomBanner = rect.bottom >= window.innerHeight - 50 && rect.width > window.innerWidth * 0.5;
      const isCornerBanner = (
        (rect.width > 250 && rect.width < window.innerWidth * 0.8) &&
        (rect.height > 80 && rect.height < window.innerHeight * 0.8)
      );
      const isFullOverlay = (
        rect.width > window.innerWidth * 0.3 &&
        rect.height > window.innerHeight * 0.3 &&
        parseInt(style.zIndex) > 100
      );
      
      return isTopBanner || isBottomBanner || isCornerBanner || isFullOverlay;
    }
  
    calculateCookieBannerScore(element) {
      let score = 0;
      const text = element.textContent?.toLowerCase() || '';
      const className = element.className?.toLowerCase() || '';
      const id = element.id?.toLowerCase() || '';
      
      // 1. Cookie-specific keywords (high weight)
      const cookieKeywordMatches = this.cookieKeywords.filter(keyword => 
        text.includes(keyword)
      ).length;
      score += cookieKeywordMatches * 1.5;
      
      // 2. Must have accept/decline buttons (critical for cookie banners)
      const buttons = element.querySelectorAll('button, a[role="button"], input[type="button"], input[type="submit"], [role="button"]');
      const acceptButtons = Array.from(buttons).filter(btn => {
        const btnText = btn.textContent?.toLowerCase() || '';
        const btnClass = btn.className?.toLowerCase() || '';
        const btnId = btn.id?.toLowerCase() || '';
        
        return (
          btnText.includes('accept') || btnText.includes('agree') || 
          btnText.includes('allow') || btnText.includes('ok') ||
          btnText.includes('got it') || btnText.includes('understand') ||
          btnClass.includes('accept') || btnId.includes('accept')
        );
      });
      
      const declineButtons = Array.from(buttons).filter(btn => {
        const btnText = btn.textContent?.toLowerCase() || '';
        const btnClass = btn.className?.toLowerCase() || '';
        const btnId = btn.id?.toLowerCase() || '';
        
        return (
          btnText.includes('decline') || btnText.includes('reject') ||
          btnText.includes('deny') || btnText.includes('refuse') ||
          btnClass.includes('decline') || btnClass.includes('reject') ||
          btnId.includes('decline') || btnId.includes('reject')
        );
      });
      
      if (acceptButtons.length > 0) score += 3;
      if (declineButtons.length > 0) score += 2;
      if (acceptButtons.length > 0 && declineButtons.length > 0) score += 1; // Both buttons
      
      // 3. Privacy/cookie policy links
      const links = element.querySelectorAll('a[href]');
      const policyLinks = Array.from(links).filter(link => {
        const linkText = link.textContent?.toLowerCase() || '';
        const href = link.href?.toLowerCase() || '';
        return (
          linkText.includes('privacy') || linkText.includes('cookie') ||
          linkText.includes('policy') || linkText.includes('terms') ||
          href.includes('privacy') || href.includes('cookie') || href.includes('policy')
        );
      });
      
      if (policyLinks.length > 0) score += 1;
      
      // 4. Class/ID indicates cookie banner
      const bannerIndicators = ['cookie', 'consent', 'privacy', 'gdpr', 'banner', 'notice'];
      const classIdMatches = bannerIndicators.filter(indicator => 
        className.includes(indicator) || id.includes(indicator)
      ).length;
      score += classIdMatches * 0.5;
      
      // 5. Common CMP patterns
      const cmpPatterns = ['onetrust', 'cookiebot', 'quantcast', 'didomi', 'trustarc'];
      if (cmpPatterns.some(pattern => className.includes(pattern) || id.includes(pattern))) {
        score += 2;
      }
      
      // 6. Text patterns specific to cookie banners
      const cookieBannerPhrases = [
        'we use cookies',
        'this site uses cookies',
        'by continuing to use',
        'by clicking accept',
        'to improve your experience',
        'necessary cookies',
        'analytics cookies',
        'marketing cookies'
      ];
      
      const phraseMatches = cookieBannerPhrases.filter(phrase => text.includes(phrase)).length;
      score += phraseMatches * 0.5;
      
      // 7. Size constraints (cookie banners shouldn't be too big or too small)
      const rect = element.getBoundingClientRect();
      const screenArea = window.innerWidth * window.innerHeight;
      const elementArea = rect.width * rect.height;
      const areaRatio = elementArea / screenArea;
      
      // Penalty for elements that are too large (likely not cookie banners)
      if (areaRatio > 0.8) score -= 2;
      if (areaRatio > 0.6) score -= 1;
      
      // Penalty for elements that are too small
      if (rect.width < 200 || rect.height < 50) score -= 1;
      
      return score;
    }
  
    isElementVisible(element) {
      if (!element) return false;
      
      const style = window.getComputedStyle(element);
      const rect = element.getBoundingClientRect();
      
      return (
        style.display !== 'none' &&
        style.visibility !== 'hidden' &&
        parseFloat(style.opacity) > 0.1 &&
        rect.width > 0 &&
        rect.height > 0 &&
        rect.top < window.innerHeight &&
        rect.bottom > 0 &&
        rect.left < window.innerWidth &&
        rect.right > 0
      );
    }
  
    processPopup(element, detectionMethod) {
      if (this.detectedPopups.has(element)) return;
      
      console.log('✅ Cookie banner detected!', {
        method: detectionMethod,
        element: this.getElementDescription(element),
        text: element.textContent?.substring(0, 200)
      });
      
      this.detectedPopups.add(element);
      
      const popupData = this.extractPopupData(element, detectionMethod);
      this.storePopupData(popupData);
      this.highlightPopup(element);
      this.showDetectionNotification(popupData);
    }
  
    extractPopupData(element, detectionMethod) {
      const rect = element.getBoundingClientRect();
      const style = window.getComputedStyle(element);
      
      // Extract text content
      const textContent = element.textContent?.trim() || '';
      
      // Extract HTML (limit size)
      let htmlContent = element.innerHTML;
      if (htmlContent.length > 5000) {
        htmlContent = htmlContent.substring(0, 5000) + '... [truncated]';
      }
      
      // Extract buttons
      const buttons = Array.from(element.querySelectorAll('button, a[role="button"], input[type="button"], input[type="submit"], [role="button"]'))
        .map(btn => ({
          text: btn.textContent?.trim() || '',
          type: btn.tagName.toLowerCase(),
          classes: btn.className,
          id: btn.id,
          href: btn.href || null
        }));
  
      // Extract policy links
      const policyLinks = Array.from(element.querySelectorAll('a[href]'))
        .filter(link => {
          const text = link.textContent?.toLowerCase() || '';
          return text.includes('privacy') || text.includes('cookie') || 
                 text.includes('policy') || text.includes('terms');
        })
        .map(link => ({
          text: link.textContent?.trim() || '',
          href: link.href
        }));
  
      return {
        id: this.generatePopupId(),
        url: window.location.href,
        domain: window.location.hostname,
        timestamp: new Date().toISOString(),
        detectionMethod,
        textContent,
        htmlContent,
        buttons,
        policyLinks,
        position: {
          top: rect.top,
          left: rect.left,
          width: rect.width,
          height: rect.height
        },
        styling: {
          position: style.position,
          zIndex: style.zIndex,
          backgroundColor: style.backgroundColor
        },
        selector: this.generateSelector(element),
        classes: element.className,
        elementId: element.id
      };
    }
  
    getElementDescription(element) {
      const tag = element.tagName.toLowerCase();
      const id = element.id ? `#${element.id}` : '';
      const className = element.className ? `.${element.className.split(' ')[0]}` : '';
      return `${tag}${id}${className}`;
    }
  
    generatePopupId() {
      return 'popup_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    }
  
    generateSelector(element) {
      if (element.id) return `#${element.id}`;
      if (element.className) {
        const firstClass = element.className.split(' ').filter(cls => cls.trim())[0];
        if (firstClass) return `.${firstClass}`;
      }
      return element.tagName.toLowerCase();
    }
  
    async storePopupData(popupData) {
      try {
        if (!chrome || !chrome.storage || !chrome.storage.local) {
          throw new Error('Chrome storage API not available (extension context may be invalidated)');
        }
        // Store locally as backup
        const result = await chrome.storage.local.get(['cookiePopups']);
        const existingPopups = result.cookiePopups || [];
        
        const isDuplicate = existingPopups.some(existing => 
          existing.domain === popupData.domain && 
          existing.textContent.length > 0 &&
          popupData.textContent.length > 0 &&
          Math.abs(existing.textContent.length - popupData.textContent.length) < 100
        );
  
        if (!isDuplicate) {
          existingPopups.push(popupData);
          const popupsToStore = existingPopups.slice(-50); // Keep fewer locally
          
          await chrome.storage.local.set({
            cookiePopups: popupsToStore
          });
  
          // Send to database API automatically
          await this.sendToDatabase(popupData);
          
          console.log('✅ Cookie banner data stored locally and sent to database');
          
          chrome.runtime.sendMessage({
            type: 'POPUP_DETECTED',
            data: popupData
          });
        } else {
          console.log('⚠️ Duplicate cookie banner detected, skipping');
        }
        
      } catch (error) {
        console.error('❌ Error storing popup data:', error);
      }
    }
  
    async sendToDatabase(popupData) {
      try {
        const response = await fetch(`${this.API_BASE_URL}/cookie-banners`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(popupData)
        });
  
        if (response.ok) {
          const result = await response.json();
          console.log('🗄️ Data sent to database successfully:', result.bannerId);
          
          // Show success notification
          this.showDatabaseNotification('✅ Sent to database!', '#4CAF50');
        } else {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
      } catch (error) {
        console.error('❌ Failed to send to database:', error);
        
        // Show error notification
        this.showDatabaseNotification('⚠️ Database unavailable', '#FF9800');
        
        // Store failed attempts for retry
        this.storeFailedAttempt(popupData);
      }
    }
  
    async storeFailedAttempt(popupData) {
      try {
        const result = await chrome.storage.local.get(['failedUploads']);
        const failedUploads = result.failedUploads || [];
        
        failedUploads.push({
          ...popupData,
          failedAt: new Date().toISOString()
        });
        
        // Keep only last 20 failed attempts
        const attemptsToStore = failedUploads.slice(-20);
        
        await chrome.storage.local.set({
          failedUploads: attemptsToStore
        });
        
      } catch (error) {
        console.error('❌ Error storing failed attempt:', error);
      }
    }
  
    showDatabaseNotification(message, color) {
      const notification = document.createElement('div');
      notification.style.cssText = `
        position: fixed;
        top: 70px;
        right: 20px;
        background: ${color};
        color: white;
        padding: 8px 16px;
        border-radius: 6px;
        z-index: 999998;
        font-family: Arial, sans-serif;
        font-size: 12px;
        font-weight: bold;
        box-shadow: 0 2px 8px rgba(0,0,0,0.2);
        max-width: 250px;
      `;
      notification.textContent = message;
      
      document.body.appendChild(notification);
      
      setTimeout(() => {
        if (notification.parentNode) {
          notification.parentNode.removeChild(notification);
        }
      }, 2000);
    }
    
    highlightPopup(element) {
      const originalBorder = element.style.border;
      const originalBoxShadow = element.style.boxShadow;
      
      element.style.border = '3px solid #ff4444';
      element.style.boxShadow = '0 0 15px rgba(255, 68, 68, 0.6)';
      
      setTimeout(() => {
        element.style.border = originalBorder;
        element.style.boxShadow = originalBoxShadow;
      }, 4000);
    }
  
    showDetectionNotification(popupData) {
      const notification = document.createElement('div');
      notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: #4CAF50;
        color: white;
        padding: 12px 20px;
        border-radius: 8px;
        z-index: 999999;
        font-family: Arial, sans-serif;
        font-size: 14px;
        font-weight: bold;
        box-shadow: 0 4px 12px rgba(0,0,0,0.3);
        max-width: 300px;
      `;
      notification.innerHTML = `
        🍪 Cookie Banner Detected!<br>
        <small style="font-weight: normal;">${popupData.domain}</small>
      `;
      
      document.body.appendChild(notification);
      
      setTimeout(() => {
        if (notification.parentNode) {
          notification.parentNode.removeChild(notification);
        }
      }, 3000);
    }
  
    setupMutationObserver() {
      const observer = new MutationObserver((mutations) => {
        let shouldScan = false;
        
        mutations.forEach((mutation) => {
          if (mutation.type === 'childList') {
            mutation.addedNodes.forEach(node => {
              if (node.nodeType === Node.ELEMENT_NODE) {
                // Only trigger scan if new node looks like it could be a cookie banner
                const element = node;
                const text = element.textContent?.toLowerCase() || '';
                const className = element.className?.toLowerCase() || '';
                const id = element.id?.toLowerCase() || '';
                
                const hasCookieKeywords = this.cookieKeywords.some(keyword => 
                  text.includes(keyword) || className.includes(keyword) || id.includes(keyword)
                );
                
                if (hasCookieKeywords) {
                  shouldScan = true;
                }
              }
            });
          }
        });
        
        if (shouldScan) {
          clearTimeout(this.mutationTimeout);
          this.mutationTimeout = setTimeout(() => {
            console.log('🔄 New cookie-related content detected, rescanning...');
            this.scanForCookieBanners();
          }, 500);
        }
      });
  
      observer.observe(document.body, {
        childList: true,
        subtree: true
      });
    }
  }
  
  // Initialize the detector
  const initDetector = () => {
    if (document.body) {
      new CookiePopupDetector();
    } else {
      setTimeout(initDetector, 100);
    }
  };
  
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initDetector);
  } else {
    initDetector();
  }

// SPA support: re-initialize detector on URL changes
(function() {
  let lastUrl = location.href;
  const observer = new MutationObserver(() => {
    const url = location.href;
    if (url !== lastUrl) {
      lastUrl = url;
      console.log('SPA navigation detected, re-initializing CookiePopupDetector on', url);
      // Remove any previous detector state if needed (optional, since each instance is independent)
      setTimeout(() => {
        if (document.body) {
          new CookiePopupDetector();
        }
      }, 100);
    }
  });
  observer.observe(document, {subtree: true, childList: true});
})();
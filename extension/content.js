console.log('CookiePopupDetector content script loaded on', window.location.href);

// Restrict script to only run on test sites
if (!/^localhost(:\d+)?$/.test(location.hostname) && !/^127\.0\.0\.1$/.test(location.hostname)) {
  // Not a test site, do nothing
  console.log('Not a test site, skipping CookiePopupDetector initialization');
} else {
  console.log('Test site detected, will initialize CookiePopupDetector');
}

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
        '[id*="cookiefirst"]',
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
      
      // More frequent detection to catch banners that load at different times
      const delays = [0, 500, 1000, 1500, 2000, 3000, 5000, 8000];
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
      
      // Check if element is hidden by CSS
      if (style.display === 'none' || style.visibility === 'hidden' || style.opacity === '0') {
        return false;
      }
      
      // Check if element has dimensions
      if (rect.width === 0 || rect.height === 0) {
        // Special case: check if it's a cookie banner that might be hidden with transform
        const text = element.textContent?.toLowerCase() || '';
        const hasCookieContent = this.cookieKeywords.some(keyword => text.includes(keyword));
        const hasCookieClass = element.className?.toLowerCase().includes('cookie') || 
                              element.id?.toLowerCase().includes('cookie');
        
        // If it has cookie content or class, check it even if hidden
        if (hasCookieContent || hasCookieClass) {
          console.log('Found hidden cookie banner element:', element);
          return true;
        }
        return false;
      }
      
      return true;
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
      const textContent = element.textContent?.trim() || '';
      const htmlContent = element.innerHTML || '';
      
      // Extract buttons and their text
      const buttons = Array.from(element.querySelectorAll('button, input[type="button"], input[type="submit"], .btn, [role="button"]'))
        .map(btn => ({
          text: btn.textContent?.trim() || btn.value || '',
          type: btn.type || 'button',
          classes: btn.className || '',
          id: btn.id || ''
        }))
        .filter(btn => btn.text.length > 0);

      // Extract privacy policy links
      const privacyLinks = this.extractPrivacyPolicyLinks(element);
      
      // Debug: Log detected privacy links
      if (privacyLinks.length > 0) {
        console.log('🔗 Detected privacy links:', privacyLinks.map(link => ({
          text: link.text,
          href: link.href,
          type: link.type,
          context: link.context
        })));
      } else {
        console.log('ℹ️ No privacy links found in banner');
      }
      
      // Extract other policy links
      const policyLinks = Array.from(element.querySelectorAll('a[href*="policy"], a[href*="privacy"], a[href*="terms"], a[href*="cookie"]'))
        .map(link => ({
          text: link.textContent?.trim() || '',
          href: link.href || '',
          classes: link.className || '',
          id: link.id || ''
        }))
        .filter(link => link.href.length > 0);

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
        privacyLinks,
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
  
    extractPrivacyPolicyLinks(element) {
      const privacyLinks = [];
      
      // Comprehensive privacy policy link patterns
      const privacyPatterns = [
        // Direct privacy policy mentions
        /privacy\s*policy/i,
        /privacy\s*notice/i,
        /privacy\s*statement/i,
        /data\s*protection/i,
        /data\s*privacy/i,
        /gdpr/i,
        /ccpa/i,
        /cookie\s*policy/i,
        /cookie\s*notice/i,
        /terms\s*of\s*service/i,
        /terms\s*and\s*conditions/i,
        /legal\s*notice/i,
        /legal\s*information/i,
        
        // Common action phrases that often link to privacy policies
        /click\s*here/i,
        /learn\s*more/i,
        /read\s*more/i,
        /find\s*out\s*more/i,
        /see\s*more/i,
        /view\s*more/i,
        /details/i,
        /more\s*info/i,
        /more\s*information/i,
        /full\s*details/i,
        /complete\s*details/i,
        /here/i,
        /this\s*link/i,
        
        // Privacy-related action words
        /manage\s*cookies/i,
        /cookie\s*settings/i,
        /privacy\s*settings/i,
        /consent\s*management/i,
        /preferences/i,
        /settings/i,
        /customize/i,
        /configure/i,
        /opt\s*out/i,
        /opt\s*in/i,
        
        // Common button/link text
        /accept\s*all/i,
        /reject\s*all/i,
        /accept\s*selected/i,
        /save\s*preferences/i,
        /continue/i,
        /proceed/i,
        /ok/i,
        /got\s*it/i,
        /understand/i,
        /agree/i,
        /disagree/i
      ];

      // Find all links in the element
      const links = element.querySelectorAll('a[href]');
      
      console.log(`🔍 Checking ${links.length} links for privacy policy detection`);
      
      links.forEach(link => {
        const linkText = link.textContent?.trim() || '';
        const href = link.href || '';
        const linkTitle = link.title?.trim() || '';
        const linkAriaLabel = link.getAttribute('aria-label')?.trim() || '';
        
        // Check if link text matches privacy patterns
        const isPrivacyLink = privacyPatterns.some(pattern => pattern.test(linkText));
        
        // Check if href contains privacy-related keywords
        const hrefContainsPrivacy = /privacy|gdpr|ccpa|cookie|terms|legal|policy|notice|statement/i.test(href);
        
        // Check if title or aria-label contains privacy keywords
        const titleContainsPrivacy = /privacy|gdpr|ccpa|cookie|terms|legal|policy|notice|statement/i.test(linkTitle);
        const ariaContainsPrivacy = /privacy|gdpr|ccpa|cookie|terms|legal|policy|notice|statement/i.test(linkAriaLabel);
        
        // Check surrounding text for privacy context (within 50 characters)
        const surroundingText = this.getSurroundingText(link, 50);
        const surroundingContainsPrivacy = /privacy|gdpr|ccpa|cookie|terms|legal|policy|notice|statement/i.test(surroundingText);
        
        // Check if this is a generic link (like "click here") but in privacy context
        const isGenericLink = /click\s*here|here|learn\s*more|read\s*more|more\s*info|details/i.test(linkText);
        const hasPrivacyContext = surroundingContainsPrivacy || titleContainsPrivacy || ariaContainsPrivacy;
        
        // Check if link is in a privacy-related container
        const isInPrivacyContainer = this.isInPrivacyContainer(link);
        
        // Debug: Log link analysis
        if (linkText.length > 0) {
          console.log(`🔗 Link analysis: "${linkText}"`, {
            href: href.substring(0, 50) + (href.length > 50 ? '...' : ''),
            isPrivacyLink,
            hrefContainsPrivacy,
            titleContainsPrivacy,
            ariaContainsPrivacy,
            surroundingContainsPrivacy,
            isGenericLink,
            hasPrivacyContext,
            isInPrivacyContainer,
            surroundingText: surroundingText.substring(0, 30) + (surroundingText.length > 30 ? '...' : '')
          });
        }
        
        if (isPrivacyLink || hrefContainsPrivacy || titleContainsPrivacy || ariaContainsPrivacy || 
            (isGenericLink && (hasPrivacyContext || isInPrivacyContainer))) {
          privacyLinks.push({
            text: linkText,
            href: href,
            title: linkTitle,
            ariaLabel: linkAriaLabel,
            type: this.categorizePrivacyLink(linkText, href),
            classes: link.className || '',
            id: link.id || '',
            surroundingText: surroundingText.substring(0, 100),
            context: {
              hasPrivacyContext,
              isInPrivacyContainer,
              isGenericLink
            }
          });
        }
      });

      return privacyLinks;
    }
    
    getSurroundingText(element, maxChars = 50) {
      let text = '';
      
      // Get text from parent element
      const parent = element.parentElement;
      if (parent) {
        text += parent.textContent || '';
      }
      
      // Get text from previous and next siblings
      let prevSibling = element.previousElementSibling;
      let nextSibling = element.nextElementSibling;
      
      if (prevSibling) {
        text += ' ' + (prevSibling.textContent || '');
      }
      
      if (nextSibling) {
        text += ' ' + (nextSibling.textContent || '');
      }
      
      return text.substring(0, maxChars);
    }
    
    isInPrivacyContainer(element) {
      // Check if element is inside a container with privacy-related classes/IDs
      let current = element.parentElement;
      const maxDepth = 5; // Don't go too deep
      let depth = 0;
      
      while (current && depth < maxDepth) {
        const className = current.className?.toLowerCase() || '';
        const id = current.id?.toLowerCase() || '';
        const text = current.textContent?.toLowerCase() || '';
        
        // Check for privacy-related patterns in container
        const hasPrivacyClass = /privacy|gdpr|ccpa|cookie|consent|policy|notice|legal/i.test(className);
        const hasPrivacyId = /privacy|gdpr|ccpa|cookie|consent|policy|notice|legal/i.test(id);
        const hasPrivacyText = /privacy|gdpr|ccpa|cookie|consent|policy|notice|legal/i.test(text);
        
        if (hasPrivacyClass || hasPrivacyId || hasPrivacyText) {
          return true;
        }
        
        current = current.parentElement;
        depth++;
      }
      
      return false;
    }
  
    categorizePrivacyLink(text, href) {
      const lowerText = text.toLowerCase();
      const lowerHref = href.toLowerCase();
      
      // Direct policy links
      if (/privacy\s*policy/i.test(lowerText) || /privacy\s*policy/i.test(lowerHref)) {
        return 'privacy_policy';
      } else if (/cookie\s*policy/i.test(lowerText) || /cookie\s*policy/i.test(lowerHref)) {
        return 'cookie_policy';
      } else if (/terms/i.test(lowerText) || /terms/i.test(lowerHref)) {
        return 'terms_of_service';
      } else if (/gdpr/i.test(lowerText) || /gdpr/i.test(lowerHref)) {
        return 'gdpr_info';
      } else if (/legal/i.test(lowerText) || /legal/i.test(lowerHref)) {
        return 'legal_notice';
      }
      
      // Action-based links
      if (/manage\s*cookies|cookie\s*settings|privacy\s*settings|consent\s*management/i.test(lowerText)) {
        return 'cookie_settings';
      } else if (/preferences|settings|customize|configure/i.test(lowerText)) {
        return 'preferences';
      } else if (/opt\s*out|opt\s*in/i.test(lowerText)) {
        return 'opt_out_in';
      }
      
      // Generic action links (click here, learn more, etc.)
      if (/click\s*here|here|learn\s*more|read\s*more|more\s*info|details/i.test(lowerText)) {
        return 'generic_action';
      }
      
      // Button-style links
      if (/accept\s*all|reject\s*all|accept\s*selected|save\s*preferences/i.test(lowerText)) {
        return 'consent_button';
      } else if (/continue|proceed|ok|got\s*it|understand|agree|disagree/i.test(lowerText)) {
        return 'action_button';
      }
      
      // Default fallback
      return 'other_policy';
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
          
          // If privacy links were detected, send them for comprehensive analysis
          if (popupData.privacyLinks && popupData.privacyLinks.length > 0) {
            await this.sendPrivacyLinksForAnalysis(popupData.privacyLinks, popupData.domain);
          }
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
  
    // New function to send privacy policy URLs for comprehensive analysis
    async sendPrivacyLinksForAnalysis(privacyLinks, domain) {
      try {
        // Find the best privacy policy link
        const privacyPolicyLink = privacyLinks.find(link => 
          link.type === 'privacy_policy' || link.type === 'cookie_policy'
        );
        
        if (!privacyPolicyLink) {
          console.log('ℹ️ No suitable privacy policy link found for comprehensive analysis');
          return;
        }
        
        console.log(`🔍 Sending privacy policy for comprehensive analysis: ${privacyPolicyLink.href}`);
        
        const response = await fetch(`${this.API_BASE_URL}/privacy-analysis`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            policyUrl: privacyPolicyLink.href,
            domain: domain
          })
        });

        if (response.ok) {
          const result = await response.json();
          console.log('✅ Privacy policy analysis completed:', result.analysis);
          
          // Show success notification for privacy analysis
          this.showDatabaseNotification('🔒 Privacy analysis complete!', '#2196F3');
          
          // Send analysis results to popup
          chrome.runtime.sendMessage({
            type: 'PRIVACY_ANALYSIS_COMPLETE',
            data: {
              domain: domain,
              analysis: result.analysis,
              policyUrl: privacyPolicyLink.href
            }
          });
        } else {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
      } catch (error) {
        console.error('❌ Failed to send privacy policy for analysis:', error);
        
        // Show error notification
        this.showDatabaseNotification('⚠️ Privacy analysis failed', '#FF5722');
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
      // Add a persistent glowy box effect around the detected cookie popup element
      element.style.border = '3px solid #7f9cf5';
      element.style.boxShadow = '0 0 32px 8px #7f9cf5cc, 0 0 0 2px #232946';
      element.style.background = 'linear-gradient(135deg, rgba(44,62,80,0.85) 0%, rgba(95,75,182,0.85) 100%)';
      element.style.backdropFilter = 'blur(8px)';
      element.style.zIndex = '2147483647';
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

  // Initialize the detector only on test sites
  if (/^localhost(:\d+)?$/.test(location.hostname) || /^127\.0\.0\.1$/.test(location.hostname)) {
    const initDetector = () => {
      console.log('Initializing CookiePopupDetector on test site');
      new CookiePopupDetector();
    };

    // Wait for DOM to be ready
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', initDetector);
    } else {
      initDetector();
    }
  }
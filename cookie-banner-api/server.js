const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const cors = require('cors');
const bodyParser = require('body-parser');
const helmet = require('helmet');
const path = require('path');
const { JSDOM } = require('jsdom');
const { PrivacyPolicyAnalyzer } = require('../privacy_analysis_pipeline');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(helmet());
app.use(cors());
app.use(bodyParser.json({ limit: '10mb' }));
app.use(bodyParser.urlencoded({ extended: true }));

// Initialize SQLite database
const dbPath = path.join(__dirname, 'cookie_banners.db');
const db = new sqlite3.Database(dbPath);

// Initialize Privacy Policy Analyzer
const privacyAnalyzer = new PrivacyPolicyAnalyzer(process.env.ANTHROPIC_API_KEY);

// Initialize database with enhanced schema
db.serialize(() => {
  // Drop existing table to recreate with new schema
  db.run(`DROP TABLE IF EXISTS cookie_banners`);
  
  // Create enhanced cookie_banners table
  db.run(`CREATE TABLE IF NOT EXISTS cookie_banners (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    url TEXT,
    domain TEXT,
    timestamp TEXT,
    detectionMethod TEXT,
    textContent TEXT,
    htmlContent TEXT,
    buttons TEXT,
    policyLinks TEXT,
    privacyLinks TEXT,
    position TEXT,
    styling TEXT,
    selector TEXT,
    classes TEXT,
    elementId TEXT,
    analysis_text TEXT,
    privacy_policy_content TEXT,
    privacy_policy_analysis TEXT,
    privacy_policy_status TEXT,
    partner_count INTEGER DEFAULT 0,
    partner_names TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )`);

  // Create websites table
  db.run(`CREATE TABLE IF NOT EXISTS websites (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    domain TEXT UNIQUE NOT NULL,
    company_name TEXT,
    industry TEXT,
    headquarters_country TEXT,
    company_size TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )`);

  // Create privacy_policies table
  db.run(`CREATE TABLE IF NOT EXISTS privacy_policies (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    website_id INTEGER,
    policy_url TEXT,
    policy_text TEXT,
    policy_html TEXT,
    last_updated DATE,
    analyzed_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    policy_version TEXT,
    language TEXT DEFAULT 'en',
    word_count INTEGER,
    readability_score REAL,
    FOREIGN KEY (website_id) REFERENCES websites(id)
  )`);

  // Create data_collection table
  db.run(`CREATE TABLE IF NOT EXISTS data_collection (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    policy_id INTEGER,
    collects_personal_info BOOLEAN DEFAULT FALSE,
    collects_contact_info BOOLEAN DEFAULT FALSE,
    collects_financial_info BOOLEAN DEFAULT FALSE,
    collects_health_info BOOLEAN DEFAULT FALSE,
    collects_biometric_info BOOLEAN DEFAULT FALSE,
    collects_location_data BOOLEAN DEFAULT FALSE,
    collects_device_info BOOLEAN DEFAULT FALSE,
    collects_browsing_history BOOLEAN DEFAULT FALSE,
    collects_social_media BOOLEAN DEFAULT FALSE,
    collects_cookies BOOLEAN DEFAULT FALSE,
    uses_tracking_pixels BOOLEAN DEFAULT FALSE,
    uses_fingerprinting BOOLEAN DEFAULT FALSE,
    uses_cross_site_tracking BOOLEAN DEFAULT FALSE,
    uses_third_party_cookies BOOLEAN DEFAULT FALSE,
    data_used_for_ai_training BOOLEAN DEFAULT FALSE,
    automated_decision_making BOOLEAN DEFAULT FALSE,
    profiling_activities BOOLEAN DEFAULT FALSE,
    collection_purpose TEXT,
    collection_legal_basis TEXT,
    FOREIGN KEY (policy_id) REFERENCES privacy_policies(id)
  )`);

  // Create data_sharing table
  db.run(`CREATE TABLE IF NOT EXISTS data_sharing (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    policy_id INTEGER,
    shares_with_affiliates BOOLEAN DEFAULT FALSE,
    shares_with_partners BOOLEAN DEFAULT FALSE,
    shares_with_advertisers BOOLEAN DEFAULT FALSE,
    shares_with_data_brokers BOOLEAN DEFAULT FALSE,
    sells_personal_data BOOLEAN DEFAULT FALSE,
    advertising_networks TEXT,
    analytics_providers TEXT,
    social_media_platforms TEXT,
    transfers_outside_region BOOLEAN DEFAULT FALSE,
    transfer_countries TEXT,
    adequacy_decision BOOLEAN DEFAULT FALSE,
    transfer_safeguards TEXT,
    opt_out_available BOOLEAN DEFAULT FALSE,
    opt_out_difficulty_score INTEGER,
    FOREIGN KEY (policy_id) REFERENCES privacy_policies(id)
  )`);

  // Create data_retention table
  db.run(`CREATE TABLE IF NOT EXISTS data_retention (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    policy_id INTEGER,
    personal_data_retention_days INTEGER,
    cookies_retention_days INTEGER,
    logs_retention_days INTEGER,
    backup_retention_days INTEGER,
    retention_policy_clear BOOLEAN DEFAULT FALSE,
    uses_vague_language BOOLEAN DEFAULT TRUE,
    automatic_deletion BOOLEAN DEFAULT FALSE,
    user_can_request_deletion BOOLEAN DEFAULT FALSE,
    deletion_process_complexity INTEGER,
    deletion_timeframe_days INTEGER,
    deletion_exceptions TEXT,
    FOREIGN KEY (policy_id) REFERENCES privacy_policies(id)
  )`);

  // Create user_rights table
  db.run(`CREATE TABLE IF NOT EXISTS user_rights (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    policy_id INTEGER,
    right_to_access BOOLEAN DEFAULT FALSE,
    right_to_rectification BOOLEAN DEFAULT FALSE,
    right_to_erasure BOOLEAN DEFAULT FALSE,
    right_to_portability BOOLEAN DEFAULT FALSE,
    right_to_restrict_processing BOOLEAN DEFAULT FALSE,
    right_to_object BOOLEAN DEFAULT FALSE,
    right_to_withdraw_consent BOOLEAN DEFAULT FALSE,
    right_to_know BOOLEAN DEFAULT FALSE,
    right_to_delete_ccpa BOOLEAN DEFAULT FALSE,
    right_to_opt_out_sale BOOLEAN DEFAULT FALSE,
    right_to_non_discrimination BOOLEAN DEFAULT FALSE,
    rights_exercise_method TEXT,
    response_timeframe_days INTEGER,
    identity_verification_required BOOLEAN DEFAULT FALSE,
    verification_complexity INTEGER,
    FOREIGN KEY (policy_id) REFERENCES privacy_policies(id)
  )`);

  // Create dark_patterns table
  db.run(`CREATE TABLE IF NOT EXISTS dark_patterns (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    policy_id INTEGER,
    pre_checked_boxes BOOLEAN DEFAULT FALSE,
    accept_all_prominent BOOLEAN DEFAULT FALSE,
    reject_all_hidden BOOLEAN DEFAULT FALSE,
    necessary_cookies_bundled BOOLEAN DEFAULT FALSE,
    confusing_language BOOLEAN DEFAULT FALSE,
    buried_important_info BOOLEAN DEFAULT FALSE,
    frequent_policy_changes BOOLEAN DEFAULT FALSE,
    misleading_headings BOOLEAN DEFAULT FALSE,
    wall_of_text BOOLEAN DEFAULT FALSE,
    implied_consent BOOLEAN DEFAULT FALSE,
    forced_consent BOOLEAN DEFAULT FALSE,
    dark_pattern_score INTEGER,
    FOREIGN KEY (policy_id) REFERENCES privacy_policies(id)
  )`);

  // Create compliance_analysis table
  db.run(`CREATE TABLE IF NOT EXISTS compliance_analysis (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    policy_id INTEGER,
    gdpr_compliance_score INTEGER,
    ccpa_compliance_score INTEGER,
    coppa_compliance_score INTEGER,
    lawful_basis_specified BOOLEAN DEFAULT FALSE,
    data_controller_identified BOOLEAN DEFAULT FALSE,
    dpo_contact_provided BOOLEAN DEFAULT FALSE,
    processing_purposes_clear BOOLEAN DEFAULT FALSE,
    FOREIGN KEY (policy_id) REFERENCES privacy_policies(id)
  )`);

  // Create privacy_scores table
  db.run(`CREATE TABLE IF NOT EXISTS privacy_scores (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    policy_id INTEGER,
    privacy_score INTEGER,
    transparency_score INTEGER,
    user_control_score INTEGER,
    data_collection_risk TEXT,
    sharing_risk TEXT,
    overall_risk_level TEXT,
    FOREIGN KEY (policy_id) REFERENCES privacy_policies(id)
  )`);

  console.log('📊 Database initialized with comprehensive privacy analysis schema');
});

// Anthropic API integration
async function getAnalysisFromAnthropic(text) {
  try {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'x-api-key': process.env.ANTHROPIC_API_KEY,
        'content-type': 'application/json',
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: 'claude-3-haiku-20240307',
        max_tokens: 512,
        messages: [
          {
            role: 'user',
            content: `You are a privacy assistant. Given this popup text, analyze it and return a JSON object with the following fields:\n{\n  "clear_opt_out": "yes/no + short explanation",\n  "tracking_enabled": "yes/no + short explanation",\n  "dark_patterns": "yes/no + short explanation",\n  "privacy_grade": "A-F + short explanation"\n}\nPopup text:\n${text}`
          }
        ]
      })
    });
    const data = await response.json();
    console.log('Anthropic API response:', data);

    if (data.error) {
      console.error('Anthropic API returned error:', data.error);
      return '';
    }
    if (!data?.content || !Array.isArray(data.content) || !data.content[0]?.text) {
      console.warn('Unexpected Anthropic API response structure:', data);
      return '';
    }
    return data.content[0].text;
  } catch (err) {
    console.error('Anthropic API error:', err);
    return '';
  }
}

// Helper function to validate partner names
function validatePartnerName(name) {
  // Common words that are not company names
  const commonWords = [
    'we', 'our', 'the', 'this', 'that', 'these', 'those', 'you', 'your', 'their', 'his', 'her', 'its',
    'and', 'or', 'but', 'if', 'then', 'else', 'when', 'where', 'why', 'how', 'what', 'who', 'which',
    'will', 'would', 'could', 'should', 'may', 'might', 'can', 'must', 'shall', 'do', 'does', 'did',
    'have', 'has', 'had', 'be', 'been', 'being', 'am', 'is', 'are', 'was', 'were',
    'data', 'information', 'personal', 'privacy', 'policy', 'cookies', 'tracking', 'advertising',
    'partners', 'vendors', 'providers', 'services', 'companies', 'business', 'commercial',
    'analytics', 'marketing', 'technology', 'platform', 'network', 'solutions', 'group',
    'inc', 'corp', 'llc', 'ltd', 'limited', 'corporation', 'company', 'technologies'
  ];
  
  // Known common partner companies (whitelist for accuracy)
  const knownPartners = [
    'google', 'facebook', 'microsoft', 'amazon', 'apple', 'twitter', 'linkedin', 'instagram',
    'youtube', 'netflix', 'spotify', 'uber', 'airbnb', 'salesforce', 'adobe', 'oracle',
    'ibm', 'intel', 'cisco', 'vmware', 'sap', 'workday', 'servicenow', 'slack',
    'zoom', 'dropbox', 'box', 'atlassian', 'github', 'gitlab', 'stripe', 'paypal',
    'square', 'shopify', 'magento', 'woocommerce', 'mailchimp', 'hubspot', 'zendesk',
    'intercom', 'mixpanel', 'amplitude', 'segment', 'hotjar', 'crazyegg', 'optimizely',
    'vwo', 'google analytics', 'google ads', 'facebook pixel', 'facebook ads',
    'twitter ads', 'linkedin ads', 'amazon ads', 'bing ads', 'youtube ads',
    'tiktok', 'snapchat', 'pinterest', 'reddit', 'quora', 'medium', 'wordpress',
    'squarespace', 'wix', 'weebly', 'shopify', 'bigcommerce', 'woocommerce'
  ];
  
  // Check if it's a common word
  if (commonWords.includes(name.toLowerCase())) {
    return false;
  }
  
  // Check if it's a known partner (case-insensitive)
  if (knownPartners.includes(name.toLowerCase())) {
    return true;
  }
  
  // Check if it looks like a real company name (proper capitalization, reasonable length)
  if (!/^[A-Z][a-z]+(?:\s+[A-Z][a-z]+)*$/.test(name)) {
    return false;
  }
  
  // Check length
  if (name.length < 2 || name.length > 30) {
    return false;
  }
  
  // Check for common company name patterns
  const companyPatterns = [
    /^[A-Z][a-z]+$/, // Single word like "Google"
    /^[A-Z][a-z]+\s+[A-Z][a-z]+$/, // Two words like "Microsoft Corporation"
    /^[A-Z][a-z]+\s+[A-Z][a-z]+\s+[A-Z][a-z]+$/ // Three words like "International Business Machines"
  ];
  
  return companyPatterns.some(pattern => pattern.test(name));
}

// Helper function to fetch privacy policy content
async function fetchPrivacyPolicy(url) {
  try {
    // Enhanced headers to mimic a real browser
    const headers = {
      'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,image/apng,*/*;q=0.8',
      'Accept-Language': 'en-US,en;q=0.9',
      'Accept-Encoding': 'gzip, deflate, br',
      'DNT': '1',
      'Connection': 'keep-alive',
      'Upgrade-Insecure-Requests': '1',
      'Sec-Fetch-Dest': 'document',
      'Sec-Fetch-Mode': 'navigate',
      'Sec-Fetch-Site': 'none',
      'Sec-Fetch-User': '?1',
      'Cache-Control': 'max-age=0'
    };

    // Try with enhanced headers first
    let response = await fetch(url, {
      headers: headers,
      timeout: 15000,
      redirect: 'follow'
    });
    
    // If 403, try with different approach
    if (response.status === 403) {
      console.log(`🔄 403 error, trying alternative approach for: ${url}`);
      
      // Try with simpler headers
      response = await fetch(url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8'
        },
        timeout: 15000,
        redirect: 'follow'
      });
    }
    
    // If still 403, try with minimal headers
    if (response.status === 403) {
      console.log(`🔄 Still 403, trying minimal headers for: ${url}`);
      
      response = await fetch(url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (compatible; PrivacyBot/1.0)'
        },
        timeout: 15000,
        redirect: 'follow'
      });
    }
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    
    const html = await response.text();
    
    // Extract main content (remove navigation, headers, footers)
    const content = extractMainContent(html);
    
    return {
      success: true,
      content: content,
      url: url,
      length: content.length
    };
  } catch (error) {
    console.error('Error fetching privacy policy:', error);
    
    // Return a more informative error message
    let errorMessage = error.message;
    if (error.message.includes('403')) {
      errorMessage = 'Access forbidden - website blocks automated requests';
    } else if (error.message.includes('404')) {
      errorMessage = 'Privacy policy page not found';
    } else if (error.message.includes('timeout')) {
      errorMessage = 'Request timed out';
    }
    
    return {
      success: false,
      error: errorMessage,
      url: url
    };
  }
}

// Helper function to extract main content from HTML using JSDOM
function extractMainContent(html) {
  try {
    // Remove script and style tags
    let content = html.replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '');
    content = content.replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '');
    
    // Create a DOM using JSDOM
    const dom = new JSDOM(content);
    const document = dom.window.document;
    
    // Remove common navigation and header elements
    const removeSelectors = [
      'nav', 'header', 'footer', '.nav', '.header', '.footer',
      '.navigation', '.menu', '.sidebar', '.advertisement',
      '[class*="nav"]', '[class*="menu"]', '[class*="header"]', '[class*="footer"]'
    ];
    
    // Remove unwanted elements
    removeSelectors.forEach(selector => {
      const elements = document.querySelectorAll(selector);
      elements.forEach(el => el.remove());
    });
    
    // Extract text content
    const textContent = document.body ? document.body.textContent : content;
    
    // Clean up whitespace
    return textContent
      .replace(/\s+/g, ' ')
      .replace(/\n+/g, '\n')
      .trim()
      .substring(0, 50000); // Limit to 50KB
  } catch (error) {
    console.error('Error extracting content:', error);
    // Fallback to simple text extraction
    return html
      .replace(/<[^>]*>/g, ' ')
      .replace(/\s+/g, ' ')
      .trim()
      .substring(0, 50000);
  }
}

// Extract key privacy facts from the policy text
function extractPrivacyFacts(policyText) {
  // Lowercase for easier searching
  const text = policyText.toLowerCase();

  // Enhanced partner detection with more precise patterns
  let partnerCount = 0;
  let partnerNames = [];
  
  // First, look for specific partner count mentions in privacy policy context
  const partnerCountPatterns = [
    // "we share data with X partners"
    /(?:we|our|this\s+website|the\s+site)\s+(?:share|disclose|provide|transfer|send)\s+(?:data|information|personal\s+data|your\s+data)\s+(?:with|to)\s+(\d+)\s+(?:partners?|third[- ]?part(?:y|ies)|vendors?|companies?|providers?|advertisers?)/gi,
    // "X partners may collect data"
    /(\d+)\s+(?:partners?|third[- ]?part(?:y|ies)|vendors?|companies?|providers?|advertisers?)\s+(?:may|can|will|do)\s+(?:collect|process|receive|access|use)/gi,
    // "cookies from X vendors"
    /(?:cookies?|tracking|advertising)\s+(?:from|by|with)\s+(\d+)\s+(?:vendors?|partners?|companies?|providers?|advertisers?)/gi,
    // "X third-party services"
    /(\d+)\s+(?:third[- ]?part(?:y|ies)|external|partner|vendor)\s+(?:companies?|services?|providers?|platforms?)/gi,
    // "we work with X advertising partners"
    /(?:we|our)\s+(?:work|partner|collaborate)\s+with\s+(\d+)\s+(?:advertising|marketing|technology|business|commercial)\s+partners?/gi,
    // "our cookie list includes X vendors"
    /(?:our|the)\s+(?:cookie|tracking|advertising)\s+(?:list|policy|statement)\s+(?:includes?|contains?|features?)\s+(\d+)\s+(?:vendors?|partners?|companies?|providers?)/gi,
    // "X companies may access your data"
    /(\d+)\s+(?:companies?|vendors?|partners?)\s+(?:may|can|will)\s+(?:access|collect|process|receive)\s+(?:your|personal|user)\s+data/gi,
    // "we use X third-party services"
    /(?:we|our|this\s+website)\s+(?:use|utilize|employ)\s+(\d+)\s+(?:third[- ]?part(?:y|ies)|external|partner|vendor)\s+(?:services?|providers?|companies?)/gi
  ];
  
  // Find partner counts from specific patterns
  partnerCountPatterns.forEach(pattern => {
    const matches = text.match(pattern);
    if (matches) {
      matches.forEach(match => {
        const numberMatch = match.match(/(\d+)/);
        if (numberMatch) {
          const num = parseInt(numberMatch[1]);
          if (num > partnerCount && num <= 1000) { // Reasonable range check
            partnerCount = num;
          }
        }
      });
    }
  });
  
  // Look for specific partner sections in privacy policy
  const partnerSectionPatterns = [
    /(?:partners?|third[- ]?part(?:y|ies)|vendors?|affiliates?|service\s+providers?|data\s+processors?|advertisers?|analytics\s+providers?|social\s+media\s+platforms?|advertising\s+networks?|marketing\s+partners?|technology\s+partners?|business\s+partners?|commercial\s+partners?)/gi
  ];
  
  // Find partner-related sections (but be more restrictive)
  let partnerSections = [];
  partnerSectionPatterns.forEach(pattern => {
    // Look for partner mentions in privacy policy context
    const contextPattern = new RegExp(`(?:privacy|data|information|personal|your|we|our|this\\s+website|the\\s+site).{0,100}${pattern.source}`, 'gi');
    const matches = text.match(contextPattern);
    if (matches) {
      partnerSections = partnerSections.concat(matches);
    }
  });
  
  if (partnerSections.length > 0) {
    // Extract URLs from partner sections (more reliable)
    const urls = new Set();
    partnerSections.forEach(section => {
      const urlMatches = section.match(/https?:\/\/[^\s"'<>]+/g) || [];
      urlMatches.forEach(url => {
        try {
          const domain = new URL(url).hostname.replace('www.', '');
          // Only add if it looks like a real partner domain
          if (domain.length > 3 && !domain.includes('localhost') && !domain.includes('127.0.0.1')) {
            urls.add(domain);
          }
        } catch (e) {
          // Invalid URL, skip
        }
      });
    });
    
    // Extract company names with much more restrictive patterns
    const companyMatches = new Set();
    partnerSections.forEach(section => {
      // Only look for well-known company patterns in partner context
      const companyPatterns = [
        // "we share data with Google, Facebook, and Microsoft"
        /(?:with|to|including|such\s+as)\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+){0,2})/g,
        // "Google Analytics", "Facebook Pixel", "Microsoft Advertising"
        /([A-Z][a-z]+(?:\s+[A-Z][a-z]+){0,2})\s+(?:analytics|pixel|advertising|marketing|tracking|services|platform|network)/gi,
        // "partners like Google and Facebook"
        /(?:partners?|vendors?|providers?)\s+(?:like|such\s+as|including)\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+){0,2})/gi
      ];
      
      companyPatterns.forEach(pattern => {
        const matches = section.match(pattern);
        if (matches) {
          matches.forEach(match => {
            // Clean up the match to get just the company name
            const cleanName = match.replace(/(?:with|to|including|such\s+as|partners?|vendors?|providers?|like|analytics|pixel|advertising|marketing|tracking|services|platform|network)\s+/gi, '').trim();
            
            // Only add if it's a valid partner name
            if (validatePartnerName(cleanName)) {
              companyMatches.add(cleanName);
            }
          });
        }
      });
    });
    
    // Update partner count if we found specific companies
    if (companyMatches.size > 0) {
      partnerCount = Math.max(partnerCount, companyMatches.size);
    }
    
    // Store partner names for reference (limit to actual companies)
    partnerNames = Array.from(companyMatches).slice(0, 10);
    
    // Add URL domains as partner names
    if (urls.size > 0) {
      urls.forEach(url => {
        if (!partnerNames.includes(url)) {
          partnerNames.push(url);
        }
      });
    }
  }
  
  // If we still don't have a partner count, look for cookie vendor lists
  if (partnerCount === 0) {
    const cookieVendorPatterns = [
      /(\d+)\s+(?:vendors?|partners?|companies?|providers?|advertisers?)\s+(?:in\s+our\s+cookie\s+list|on\s+our\s+website|that\s+we\s+use)/gi,
      /(?:cookie|tracking|advertising)\s+(?:from|by|with)\s+(\d+)\s+(?:companies?|vendors?|partners?)\s+(?:including|such\s+as)/gi
    ];
    
    cookieVendorPatterns.forEach(pattern => {
      const matches = text.match(pattern);
      if (matches) {
        matches.forEach(match => {
          const numberMatch = match.match(/(\d+)/);
          if (numberMatch) {
            const num = parseInt(numberMatch[1]);
            if (num > 0 && num <= 1000) {
              partnerCount = num;
            }
          }
        });
      }
    });
  }

  // Check for common privacy practices
  const mentionsDataSharing = /share|disclose|provide.*(third[- ]?part(y|ies)|partner|vendor|affiliate)/.test(text);
  const mentionsCookies = /cookie(s)?|tracking|browser.*data/.test(text);
  const mentionsRetention = /retain|retention|store.*data/.test(text);
  const mentionsChildren = /children|minor|under\s?13|under\s?16/.test(text);
  const mentionsSecurity = /security|encryption|protect|safeguard/.test(text);
  const mentionsInternational = /transfer.*(international|outside|europe|us|uk|country)/.test(text);
  const mentionsUserRights = /access.*data|delete.*data|correct.*data|right.*(access|delete|correct|object)/.test(text);
  const mentionsContact = /contact.*(privacy|data.*protection|officer|email|phone)/.test(text);

  // Sample: first 1500 chars
  const sample = policyText.substring(0, 1500);

  return {
    partnerCount,
    partnerNames,
    mentionsDataSharing,
    mentionsCookies,
    mentionsRetention,
    mentionsChildren,
    mentionsSecurity,
    mentionsInternational,
    mentionsUserRights,
    mentionsContact,
    sample
  };
}

// Enhanced analysis with privacy policy
async function analyzeWithPrivacyPolicy(bannerData) {
  try {
    let privacyPolicyContent = '';
    let privacyPolicyAnalysis = '';
    let privacyPolicyStatus = 'not_found';
    let privacyFacts = null;
    let comprehensiveAnalysis = null;
    
    // Extract privacy policy if available
    if (bannerData.privacyLinks && bannerData.privacyLinks.length > 0) {
      const privacyLink = bannerData.privacyLinks.find(link => 
        link.type === 'privacy_policy' || link.type === 'cookie_policy'
      );
      
      if (privacyLink) {
        console.log(`🔍 Fetching privacy policy from: ${privacyLink.href}`);
        const policyResult = await fetchPrivacyPolicy(privacyLink.href);
        
        if (policyResult.success) {
          privacyPolicyContent = policyResult.content;
          privacyPolicyStatus = 'success';
          console.log(`✅ Privacy policy extracted (${policyResult.length} chars)`);
          
          // Extract privacy facts for banner analysis
          privacyFacts = extractPrivacyFacts(policyResult.content);
          console.log(`📊 Found ${privacyFacts.partnerCount} partners: ${privacyFacts.partnerNames.join(', ')}`);
          
          // Run comprehensive privacy analysis
          try {
            comprehensiveAnalysis = await analyzePrivacyPolicyComprehensive(
              privacyLink.href, 
              bannerData.domain, 
              policyResult.content
            );
            
            if (comprehensiveAnalysis.success) {
              console.log(`✅ Comprehensive privacy analysis completed`);
              privacyPolicyAnalysis = JSON.stringify(comprehensiveAnalysis);
            } else {
              console.log(`⚠️ Comprehensive privacy analysis failed: ${comprehensiveAnalysis.error}`);
              privacyPolicyStatus = 'analysis_failed';
            }
          } catch (analysisError) {
            console.error('Error in comprehensive privacy analysis:', analysisError);
            privacyPolicyStatus = 'analysis_failed';
          }
        } else {
          console.log(`❌ Failed to fetch privacy policy: ${policyResult.error}`);
          privacyPolicyStatus = 'fetch_failed';
        }
      } else {
        console.log(`ℹ️ No privacy policy link found in banner`);
        privacyPolicyStatus = 'no_link';
      }
    } else {
      console.log(`ℹ️ No privacy links found in banner`);
      privacyPolicyStatus = 'no_links';
    }
    
    // Analyze banner content with privacy policy context
    let bannerAnalysis = null;
    try {
      bannerAnalysis = await analyzeBannerContent(bannerData.textContent, bannerData.domain, privacyFacts);
      if (bannerAnalysis) {
        console.log(`✅ Banner analysis completed`);
      } else {
        console.log(`⚠️ Banner analysis failed`);
      }
    } catch (bannerError) {
      console.error('Error analyzing banner content:', bannerError);
    }
    
    return {
      bannerAnalysis,
      privacyPolicyContent,
      privacyPolicyAnalysis,
      privacyPolicyStatus,
      privacyFacts,
      comprehensiveAnalysis
    };
  } catch (error) {
    console.error('Error in enhanced analysis:', error);
    return {
      bannerAnalysis: null,
      privacyPolicyContent: '',
      privacyPolicyAnalysis: '',
      privacyPolicyStatus: 'error',
      privacyFacts: null,
      comprehensiveAnalysis: null
    };
  }
}

// Analyze privacy policy content
async function analyzePrivacyPolicy(content, domain) {
  try {
    const facts = extractPrivacyFacts(content);
    const prompt = `Here are key facts extracted from a privacy policy for ${domain}:

- Number of partners mentioned: ${facts.partnerCount}
- Partner names: ${facts.partnerNames.join(', ')}
- Mentions data sharing: ${facts.mentionsDataSharing ? 'Yes' : 'No'}
- Mentions cookies: ${facts.mentionsCookies ? 'Yes' : 'No'}
- Mentions retention: ${facts.mentionsRetention ? 'Yes' : 'No'}
- Mentions children: ${facts.mentionsChildren ? 'Yes' : 'No'}
- Mentions security: ${facts.mentionsSecurity ? 'Yes' : 'No'}
- Mentions international transfers: ${facts.mentionsInternational ? 'Yes' : 'No'}
- Mentions user rights: ${facts.mentionsUserRights ? 'Yes' : 'No'}
- Mentions contact info: ${facts.mentionsContact ? 'Yes' : 'No'}

Sample from the policy:\n${facts.sample}

Please provide a privacy analysis in this exact JSON format:\n{
  "overall_score": "A-F grade",
  "partner_count": ${facts.partnerCount},
  "partner_names": ["List of identified partner names"],
  "data_collection": "What data is collected",
  "data_sharing": "How data is shared",
  "user_rights": "User rights and controls",
  "retention": "Data retention policies",
  "third_parties": "Third-party sharing details",
  "international_transfers": "International data transfers",
  "children_privacy": "Children's privacy protection",
  "security_measures": "Security measures described",
  "contact_info": "Privacy contact information",
  "compliance": "GDPR/CCPA compliance status",
  "red_flags": ["List of concerning practices"],
  "green_flags": ["List of good practices"],
  "summary": "Brief summary of key findings"
}`;

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': process.env.ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: 'claude-3-haiku-20240307',
        max_tokens: 2000,
        messages: [{ role: 'user', content: prompt }]
      })
    });

    if (!response.ok) {
      throw new Error(`Anthropic API error: ${response.status}`);
    }

    const result = await response.json();
    console.log('Anthropic API response for privacy policy analysis:', result);
    
    if (!result.content || !Array.isArray(result.content) || !result.content[0]?.text) {
      console.warn('Unexpected Anthropic API response structure:', result);
      return null;
    }
    
    const analysisText = result.content[0].text;
    console.log('Privacy policy analysis text received:', analysisText);
    
    // Try to parse as JSON, but don't fail if it's not valid JSON
    try {
      JSON.parse(analysisText);
      return analysisText;
    } catch (jsonError) {
      console.warn('Privacy policy analysis response is not valid JSON, returning as text:', jsonError.message);
      return analysisText;
    }
  } catch (error) {
    console.error('Error analyzing privacy policy:', error);
    return null;
  }
}

// Enhanced banner analysis
async function analyzeBannerContent(content, domain, privacyFacts = null) {
  try {
    let partnerInfo = '';
    if (privacyFacts && privacyFacts.partnerCount > 0) {
      partnerInfo = `\n\nPrivacy Policy Partner Information:
- Number of partners: ${privacyFacts.partnerCount}
- Partner names: ${privacyFacts.partnerNames.join(', ')}`;
    }

    const prompt = `Analyze this cookie banner from ${domain} and provide a comprehensive assessment in JSON format:${partnerInfo}

Banner Content:
${content}

Please provide analysis in this exact JSON format:
{
  "privacy_grade": "A-F grade",
  "clear_opt_out": "Yes/No - Is there a clear opt-out option?",
  "tracking_enabled": "Yes/No - Is tracking enabled by default?",
  "dark_patterns": ["List of dark patterns found"],
  "consent_mechanism": "Type of consent mechanism used",
  "language_clarity": "How clear is the language used",
  "button_analysis": "Analysis of accept/reject buttons",
  "key_concerns": ["Main privacy concerns"],
  "positive_aspects": ["Positive privacy practices"],
  "recommendations": ["Recommendations for improvement"]${privacyFacts && privacyFacts.partnerCount > 0 ? ',\n  "partner_impact": "How the number of partners affects privacy risk"' : ''}
}`;

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': process.env.ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: 'claude-3-haiku-20240307',
        max_tokens: 1500,
        messages: [{ role: 'user', content: prompt }]
      })
    });

    if (!response.ok) {
      throw new Error(`Anthropic API error: ${response.status}`);
    }

    const result = await response.json();
    console.log('Anthropic API response for banner analysis:', result);
    
    if (!result.content || !Array.isArray(result.content) || !result.content[0]?.text) {
      console.warn('Unexpected Anthropic API response structure:', result);
      return null;
    }
    
    const analysisText = result.content[0].text;
    console.log('Analysis text received:', analysisText);
    
    // Try to parse as JSON, but don't fail if it's not valid JSON
    try {
      JSON.parse(analysisText);
      return analysisText;
    } catch (jsonError) {
      console.warn('Analysis response is not valid JSON, returning as text:', jsonError.message);
      return analysisText;
    }
  } catch (error) {
    console.error('Error analyzing banner content:', error);
    return null;
  }
}

// Comprehensive Privacy Analysis Pipeline
async function analyzePrivacyPolicyComprehensive(policyUrl, domain, policyContent) {
  try {
    console.log(`🔍 Starting comprehensive privacy analysis for: ${domain}`);
    
    // Step 1: Get or create website record
    const websiteId = await getOrCreateWebsite(domain);
    
    // Step 2: Create privacy policy record
    const policyId = await createPrivacyPolicy(websiteId, policyUrl, policyContent);
    
    // Step 3: Run comprehensive analysis
    const analysis = await privacyAnalyzer.analyzePolicy(policyContent, domain);
    
    // Step 4: Store analysis results in database
    await storePrivacyAnalysis(policyId, analysis);
    
    // Step 5: Return summary for extension
    const summary = {
      success: true,
      policy_id: policyId,
      domain: domain,
      analysis_summary: {
        privacy_score: analysis.scores.privacy_score,
        transparency_score: analysis.scores.transparency_score,
        user_control_score: analysis.scores.user_control_score,
        data_collection_risk: analysis.scores.data_collection_risk,
        sharing_risk: analysis.scores.sharing_risk,
        overall_risk_level: analysis.scores.overall_risk_level || 'medium'
      },
      key_findings: {
        data_collection: analysis.dataCollection,
        data_sharing: analysis.dataSharing,
        user_rights: analysis.userRights,
        dark_patterns: analysis.darkPatterns,
        compliance: analysis.compliance
      }
    };
    
    console.log(`✅ Comprehensive privacy analysis completed for ${domain}`);
    return summary;
    
  } catch (error) {
    console.error(`❌ Privacy analysis failed for ${domain}:`, error);
    return {
      success: false,
      error: error.message,
      domain: domain
    };
  }
}

// Helper function to get or create website record
function getOrCreateWebsite(domain) {
  return new Promise((resolve, reject) => {
    // First try to find existing website
    db.get('SELECT id FROM websites WHERE domain = ?', [domain], (err, row) => {
      if (err) {
        reject(err);
        return;
      }
      
      if (row) {
        resolve(row.id);
        return;
      }
      
      // Create new website record
      db.run('INSERT INTO websites (domain) VALUES (?)', [domain], function(err) {
        if (err) {
          reject(err);
          return;
        }
        resolve(this.lastID);
      });
    });
  });
}

// Helper function to create privacy policy record
function createPrivacyPolicy(websiteId, policyUrl, policyContent) {
  return new Promise((resolve, reject) => {
    const wordCount = policyContent.split(/\s+/).length;
    
    db.run(
      'INSERT INTO privacy_policies (website_id, policy_url, policy_text, word_count, analyzed_at) VALUES (?, ?, ?, ?, ?)',
      [websiteId, policyUrl, policyContent, wordCount, new Date().toISOString()],
      function(err) {
        if (err) {
          reject(err);
          return;
        }
        resolve(this.lastID);
      }
    );
  });
}

// Helper function to store comprehensive analysis results
async function storePrivacyAnalysis(policyId, analysis) {
  return new Promise((resolve, reject) => {
    db.serialize(() => {
      // Store data collection analysis
      db.run(
        `INSERT INTO data_collection (
          policy_id, collects_personal_info, collects_contact_info, collects_financial_info,
          collects_health_info, collects_biometric_info, collects_location_data,
          collects_device_info, collects_browsing_history, uses_tracking_pixels,
          uses_fingerprinting, data_used_for_ai_training, automated_decision_making,
          collection_purpose, collection_legal_basis
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          policyId,
          analysis.dataCollection.collects_personal_info,
          analysis.dataCollection.collects_contact_info,
          analysis.dataCollection.collects_financial_info,
          analysis.dataCollection.collects_health_info,
          analysis.dataCollection.collects_biometric_info,
          analysis.dataCollection.collects_location_data,
          analysis.dataCollection.collects_device_info,
          analysis.dataCollection.collects_browsing_history,
          analysis.dataCollection.uses_tracking_pixels,
          analysis.dataCollection.uses_fingerprinting,
          analysis.dataCollection.data_used_for_ai_training,
          analysis.dataCollection.automated_decision_making,
          JSON.stringify(analysis.dataCollection.collection_purpose),
          analysis.dataCollection.collection_legal_basis
        ]
      );

      // Store data sharing analysis
      db.run(
        `INSERT INTO data_sharing (
          policy_id, shares_with_affiliates, shares_with_partners, shares_with_advertisers,
          sells_personal_data, advertising_networks, analytics_providers,
          social_media_platforms, transfers_outside_region, opt_out_available,
          opt_out_difficulty_score
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          policyId,
          analysis.dataSharing.shares_with_affiliates,
          analysis.dataSharing.shares_with_partners,
          analysis.dataSharing.shares_with_advertisers,
          analysis.dataSharing.sells_personal_data,
          JSON.stringify(analysis.dataSharing.advertising_networks),
          JSON.stringify(analysis.dataSharing.analytics_providers),
          JSON.stringify(analysis.dataSharing.social_media_platforms),
          analysis.dataSharing.transfers_outside_region,
          analysis.dataSharing.opt_out_available,
          analysis.dataSharing.opt_out_difficulty_score
        ]
      );

      // Store data retention analysis
      db.run(
        `INSERT INTO data_retention (
          policy_id, personal_data_retention_days, retention_policy_clear,
          uses_vague_language, automatic_deletion, user_can_request_deletion
        ) VALUES (?, ?, ?, ?, ?, ?)`,
        [
          policyId,
          analysis.dataRetention.personal_data_retention_days,
          analysis.dataRetention.retention_policy_clear,
          analysis.dataRetention.uses_vague_language,
          analysis.dataRetention.automatic_deletion,
          analysis.dataRetention.user_can_request_deletion
        ]
      );

      // Store user rights analysis
      db.run(
        `INSERT INTO user_rights (
          policy_id, right_to_access, right_to_rectification, right_to_erasure,
          right_to_portability, right_to_object, right_to_withdraw_consent,
          response_timeframe_days
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          policyId,
          analysis.userRights.right_to_access,
          analysis.userRights.right_to_rectification,
          analysis.userRights.right_to_erasure,
          analysis.userRights.right_to_portability,
          analysis.userRights.right_to_object,
          analysis.userRights.right_to_withdraw_consent,
          analysis.userRights.response_timeframe_days
        ]
      );

      // Store dark patterns analysis
      db.run(
        `INSERT INTO dark_patterns (
          policy_id, pre_checked_boxes, accept_all_prominent, reject_all_hidden,
          confusing_language, wall_of_text, dark_pattern_score
        ) VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [
          policyId,
          analysis.darkPatterns.pre_checked_boxes,
          analysis.darkPatterns.accept_all_prominent,
          analysis.darkPatterns.reject_all_hidden,
          analysis.darkPatterns.confusing_language,
          analysis.darkPatterns.wall_of_text,
          analysis.darkPatterns.dark_pattern_score
        ]
      );

      // Store compliance analysis
      db.run(
        `INSERT INTO compliance_analysis (
          policy_id, gdpr_compliance_score, lawful_basis_specified,
          data_controller_identified, processing_purposes_clear
        ) VALUES (?, ?, ?, ?, ?)`,
        [
          policyId,
          analysis.compliance.gdpr_compliance_score,
          analysis.compliance.lawful_basis_specified,
          analysis.compliance.data_controller_identified,
          analysis.compliance.processing_purposes_clear
        ]
      );

      // Store privacy scores
      db.run(
        `INSERT INTO privacy_scores (
          policy_id, privacy_score, transparency_score, user_control_score,
          data_collection_risk, sharing_risk, overall_risk_level
        ) VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [
          policyId,
          analysis.scores.privacy_score,
          analysis.scores.transparency_score,
          analysis.scores.user_control_score,
          analysis.scores.data_collection_risk,
          analysis.scores.sharing_risk,
          analysis.scores.overall_risk_level || 'medium'
        ]
      );

      resolve();
    });
  });
}

// POST endpoint to store cookie banner data with enhanced analysis
app.post('/api/cookie-banners', async (req, res) => {
  try {
    const bannerData = req.body;
    
    // Perform enhanced analysis
    const analysis = await analyzeWithPrivacyPolicy(bannerData);
    
    // Store in database
    const stmt = db.prepare(`
      INSERT INTO cookie_banners (
        url, domain, timestamp, detectionMethod, textContent, htmlContent,
        buttons, policyLinks, privacyLinks, position, styling, selector,
        classes, elementId, analysis_text, privacy_policy_content, privacy_policy_analysis, privacy_policy_status, partner_count, partner_names
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    
    stmt.run(
      bannerData.url,
      bannerData.domain,
      bannerData.timestamp,
      bannerData.detectionMethod,
      bannerData.textContent,
      bannerData.htmlContent,
      JSON.stringify(bannerData.buttons),
      JSON.stringify(bannerData.policyLinks),
      JSON.stringify(bannerData.privacyLinks),
      JSON.stringify(bannerData.position),
      JSON.stringify(bannerData.styling),
      bannerData.selector,
      bannerData.classes,
      bannerData.elementId,
      analysis.bannerAnalysis,
      analysis.privacyPolicyContent,
      analysis.privacyPolicyAnalysis,
      analysis.privacyPolicyStatus,
      analysis.privacyFacts ? analysis.privacyFacts.partnerCount : 0,
      analysis.privacyFacts ? JSON.stringify(analysis.privacyFacts.partnerNames) : '[]'
    );
    
    stmt.finalize();
    
    res.json({
      success: true,
      bannerId: bannerData.id,
      analysis: {
        banner: analysis.bannerAnalysis ? (() => {
          try {
            return JSON.parse(analysis.bannerAnalysis);
          } catch (e) {
            console.warn('Banner analysis is not valid JSON, returning as text');
            return { raw_text: analysis.bannerAnalysis };
          }
        })() : null,
        privacyPolicy: analysis.privacyPolicyAnalysis ? (() => {
          try {
            return JSON.parse(analysis.privacyPolicyAnalysis);
          } catch (e) {
            console.warn('Privacy policy analysis is not valid JSON, returning as text');
            return { raw_text: analysis.privacyPolicyAnalysis };
          }
        })() : null,
        privacyPolicyStatus: analysis.privacyPolicyStatus,
        partnerInfo: analysis.privacyFacts ? {
          partnerCount: analysis.privacyFacts.partnerCount,
          partnerNames: analysis.privacyFacts.partnerNames,
          mentionsDataSharing: analysis.privacyFacts.mentionsDataSharing,
          mentionsCookies: analysis.privacyFacts.mentionsCookies,
          mentionsRetention: analysis.privacyFacts.mentionsRetention,
          mentionsChildren: analysis.privacyFacts.mentionsChildren,
          mentionsSecurity: analysis.privacyFacts.mentionsSecurity,
          mentionsInternational: analysis.privacyFacts.mentionsInternational,
          mentionsUserRights: analysis.privacyFacts.mentionsUserRights,
          mentionsContact: analysis.privacyFacts.mentionsContact
        } : null
      }
    });
    
  } catch (error) {
    console.error('Error storing cookie banner:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// GET endpoint to retrieve all cookie banners with enhanced data
app.get('/api/cookie-banners', (req, res) => {
  db.all(`
    SELECT * FROM cookie_banners 
    ORDER BY created_at DESC
  `, (err, rows) => {
    if (err) {
      res.status(500).json({ success: false, error: err.message });
    } else {
      res.json({
        success: true,
        banners: rows.map(row => ({
          ...row,
          buttons: JSON.parse(row.buttons || '[]'),
          policyLinks: JSON.parse(row.policyLinks || '[]'),
          privacyLinks: JSON.parse(row.privacyLinks || '[]'),
          position: JSON.parse(row.position || '{}'),
          styling: JSON.parse(row.styling || '{}'),
          partnerNames: JSON.parse(row.partner_names || '[]')
        }))
      });
    }
  });
});

// GET endpoint for domain-specific data
app.get('/api/cookie-banners/domain/:domain', (req, res) => {
  const domain = req.params.domain;
  
  db.all(`
    SELECT * FROM cookie_banners 
    WHERE domain = ? 
    ORDER BY created_at DESC
  `, [domain], (err, rows) => {
    if (err) {
      res.status(500).json({ success: false, error: err.message });
    } else {
      res.json({
        success: true,
        banners: rows.map(row => ({
          ...row,
          buttons: JSON.parse(row.buttons || '[]'),
          policyLinks: JSON.parse(row.policyLinks || '[]'),
          privacyLinks: JSON.parse(row.privacyLinks || '[]'),
          position: JSON.parse(row.position || '{}'),
          styling: JSON.parse(row.styling || '{}'),
          partnerNames: JSON.parse(row.partner_names || '[]')
        }))
      });
    }
  });
});

// Get statistics
app.get('/api/stats', (req, res) => {
  const queries = {
    totalBanners: "SELECT COUNT(*) as count FROM cookie_banners",
    uniqueDomains: "SELECT COUNT(DISTINCT domain) as count FROM cookie_banners",
    recentBanners: "SELECT COUNT(*) as count FROM cookie_banners WHERE timestamp > datetime('now', '-24 hours')",
    topDomains: `
      SELECT domain, COUNT(*) as count 
      FROM cookie_banners 
      GROUP BY domain 
      ORDER BY count DESC 
      LIMIT 10
    `
  };

  Promise.all([
    new Promise((resolve, reject) => {
      db.get(queries.totalBanners, (err, row) => err ? reject(err) : resolve(row));
    }),
    new Promise((resolve, reject) => {
      db.get(queries.uniqueDomains, (err, row) => err ? reject(err) : resolve(row));
    }),
    new Promise((resolve, reject) => {
      db.get(queries.recentBanners, (err, row) => err ? reject(err) : resolve(row));
    }),
    new Promise((resolve, reject) => {
      db.all(queries.topDomains, (err, rows) => err ? reject(err) : resolve(rows));
    })
  ]).then(([total, domains, recent, topDomains]) => {
    res.json({
      success: true,
      stats: {
        totalBanners: total.count,
        uniqueDomains: domains.count,
        recentBanners: recent.count,
        topDomains: topDomains
      }
    });
  }).catch(err => {
    console.error('❌ Error fetching stats:', err);
    res.status(500).json({ error: 'Failed to fetch statistics' });
  });
});

// Health check
app.get('/api/health', (req, res) => {
  res.json({ 
    success: true, 
    message: 'Cookie Banner API is running',
    timestamp: new Date().toISOString()
  });
});

// DELETE endpoint to clear all data
app.delete('/api/cookie-banners/clear', (req, res) => {
  db.run('DELETE FROM cookie_banners', (err) => {
    if (err) {
      res.status(500).json({ success: false, error: err.message });
    } else {
      res.json({ success: true, message: 'All cookie banner data cleared' });
    }
  });
});

// Get partner statistics
app.get('/api/partner-stats', (req, res) => {
  const queries = {
    totalPartners: "SELECT SUM(partner_count) as total FROM cookie_banners WHERE partner_count > 0",
    avgPartners: "SELECT AVG(partner_count) as average FROM cookie_banners WHERE partner_count > 0",
    maxPartners: "SELECT MAX(partner_count) as maximum FROM cookie_banners WHERE partner_count > 0",
    sitesWithPartners: "SELECT COUNT(*) as count FROM cookie_banners WHERE partner_count > 0",
    topPartners: `
      SELECT partner_names, COUNT(*) as frequency
      FROM cookie_banners 
      WHERE partner_names != '[]' AND partner_names IS NOT NULL
      GROUP BY partner_names
      ORDER BY frequency DESC
      LIMIT 20
    `,
    partnerDistribution: `
      SELECT 
        CASE 
          WHEN partner_count = 0 THEN 'No Partners'
          WHEN partner_count BETWEEN 1 AND 5 THEN '1-5 Partners'
          WHEN partner_count BETWEEN 6 AND 20 THEN '6-20 Partners'
          WHEN partner_count BETWEEN 21 AND 50 THEN '21-50 Partners'
          ELSE '50+ Partners'
        END as partner_range,
        COUNT(*) as site_count
      FROM cookie_banners 
      GROUP BY partner_range
      ORDER BY site_count DESC
    `
  };

  Promise.all([
    new Promise((resolve, reject) => {
      db.get(queries.totalPartners, (err, row) => err ? reject(err) : resolve(row));
    }),
    new Promise((resolve, reject) => {
      db.get(queries.avgPartners, (err, row) => err ? reject(err) : resolve(row));
    }),
    new Promise((resolve, reject) => {
      db.get(queries.maxPartners, (err, row) => err ? reject(err) : resolve(row));
    }),
    new Promise((resolve, reject) => {
      db.get(queries.sitesWithPartners, (err, row) => err ? reject(err) : resolve(row));
    }),
    new Promise((resolve, reject) => {
      db.all(queries.topPartners, (err, rows) => err ? reject(err) : resolve(rows));
    }),
    new Promise((resolve, reject) => {
      db.all(queries.partnerDistribution, (err, rows) => err ? reject(err) : resolve(rows));
    })
  ]).then(([total, avg, max, sites, topPartners, distribution]) => {
    res.json({
      success: true,
      partnerStats: {
        totalPartners: total.total || 0,
        averagePartners: Math.round((avg.average || 0) * 100) / 100,
        maxPartners: max.maximum || 0,
        sitesWithPartners: sites.count || 0,
        topPartners: topPartners.map(row => ({
          partners: JSON.parse(row.partner_names || '[]'),
          frequency: row.frequency
        })),
        partnerDistribution: distribution
      }
    });
  }).catch(err => {
    console.error('❌ Error fetching partner stats:', err);
    res.status(500).json({ error: 'Failed to fetch partner statistics' });
  });
});

// POST endpoint for privacy policy analysis
app.post('/api/privacy-analysis', async (req, res) => {
  try {
    const { policyUrl, domain } = req.body;
    
    if (!policyUrl || !domain) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: policyUrl and domain'
      });
    }
    
    console.log(`🔍 Processing privacy policy analysis request for: ${domain}`);
    
    // Fetch privacy policy content
    const policyResult = await fetchPrivacyPolicy(policyUrl);
    
    if (!policyResult.success) {
      return res.status(400).json({
        success: false,
        error: `Failed to fetch privacy policy: ${policyResult.error}`,
        domain: domain
      });
    }
    
    // Run comprehensive analysis
    const analysis = await analyzePrivacyPolicyComprehensive(
      policyUrl,
      domain,
      policyResult.content
    );
    
    if (analysis.success) {
      res.json({
        success: true,
        analysis: analysis,
        policy_url: policyUrl,
        domain: domain
      });
    } else {
      res.status(500).json({
        success: false,
        error: analysis.error,
        domain: domain
      });
    }
    
  } catch (error) {
    console.error('Error in privacy analysis endpoint:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// GET endpoint to retrieve privacy analysis results
app.get('/api/privacy-analysis/:domain', (req, res) => {
  const domain = req.params.domain;
  
  const query = `
    SELECT 
      w.domain,
      pp.policy_url,
      pp.analyzed_at,
      pp.word_count,
      dc.*,
      ds.*,
      dr.*,
      ur.*,
      dp.*,
      ca.*,
      ps.*
    FROM websites w
    JOIN privacy_policies pp ON w.id = pp.website_id
    LEFT JOIN data_collection dc ON pp.id = dc.policy_id
    LEFT JOIN data_sharing ds ON pp.id = ds.policy_id
    LEFT JOIN data_retention dr ON pp.id = dr.policy_id
    LEFT JOIN user_rights ur ON pp.id = ur.policy_id
    LEFT JOIN dark_patterns dp ON pp.id = dp.policy_id
    LEFT JOIN compliance_analysis ca ON pp.id = ca.policy_id
    LEFT JOIN privacy_scores ps ON pp.id = ps.policy_id
    WHERE w.domain = ?
    ORDER BY pp.analyzed_at DESC
    LIMIT 1
  `;
  
  db.get(query, [domain], (err, row) => {
    if (err) {
      res.status(500).json({ success: false, error: err.message });
    } else if (!row) {
      res.status(404).json({ success: false, error: 'No privacy analysis found for this domain' });
    } else {
      // Parse JSON fields
      const analysis = {
        domain: row.domain,
        policy_url: row.policy_url,
        analyzed_at: row.analyzed_at,
        word_count: row.word_count,
        data_collection: {
          collects_personal_info: row.collects_personal_info,
          collects_contact_info: row.collects_contact_info,
          collects_financial_info: row.collects_financial_info,
          collects_health_info: row.collects_health_info,
          collects_biometric_info: row.collects_biometric_info,
          collects_location_data: row.collects_location_data,
          collects_device_info: row.collects_device_info,
          collects_browsing_history: row.collects_browsing_history,
          uses_tracking_pixels: row.uses_tracking_pixels,
          uses_fingerprinting: row.uses_fingerprinting,
          data_used_for_ai_training: row.data_used_for_ai_training,
          automated_decision_making: row.automated_decision_making,
          collection_purpose: row.collection_purpose ? JSON.parse(row.collection_purpose) : [],
          collection_legal_basis: row.collection_legal_basis
        },
        data_sharing: {
          shares_with_affiliates: row.shares_with_affiliates,
          shares_with_partners: row.shares_with_partners,
          shares_with_advertisers: row.shares_with_advertisers,
          sells_personal_data: row.sells_personal_data,
          advertising_networks: row.advertising_networks ? JSON.parse(row.advertising_networks) : [],
          analytics_providers: row.analytics_providers ? JSON.parse(row.analytics_providers) : [],
          social_media_platforms: row.social_media_platforms ? JSON.parse(row.social_media_platforms) : [],
          transfers_outside_region: row.transfers_outside_region,
          opt_out_available: row.opt_out_available,
          opt_out_difficulty_score: row.opt_out_difficulty_score
        },
        data_retention: {
          personal_data_retention_days: row.personal_data_retention_days,
          retention_policy_clear: row.retention_policy_clear,
          uses_vague_language: row.uses_vague_language,
          automatic_deletion: row.automatic_deletion,
          user_can_request_deletion: row.user_can_request_deletion
        },
        user_rights: {
          right_to_access: row.right_to_access,
          right_to_rectification: row.right_to_rectification,
          right_to_erasure: row.right_to_erasure,
          right_to_portability: row.right_to_portability,
          right_to_object: row.right_to_object,
          right_to_withdraw_consent: row.right_to_withdraw_consent,
          response_timeframe_days: row.response_timeframe_days
        },
        dark_patterns: {
          pre_checked_boxes: row.pre_checked_boxes,
          accept_all_prominent: row.accept_all_prominent,
          reject_all_hidden: row.reject_all_hidden,
          confusing_language: row.confusing_language,
          wall_of_text: row.wall_of_text,
          dark_pattern_score: row.dark_pattern_score
        },
        compliance: {
          gdpr_compliance_score: row.gdpr_compliance_score,
          lawful_basis_specified: row.lawful_basis_specified,
          data_controller_identified: row.data_controller_identified,
          processing_purposes_clear: row.processing_purposes_clear
        },
        scores: {
          privacy_score: row.privacy_score,
          transparency_score: row.transparency_score,
          user_control_score: row.user_control_score,
          data_collection_risk: row.data_collection_risk,
          sharing_risk: row.sharing_risk,
          overall_risk_level: row.overall_risk_level
        }
      };
      
      res.json({
        success: true,
        analysis: analysis
      });
    }
  });
});

// GET endpoint to retrieve all privacy analyses
app.get('/api/privacy-analyses', (req, res) => {
  const query = `
    SELECT 
      w.domain,
      pp.policy_url,
      pp.analyzed_at,
      pp.word_count,
      ps.privacy_score,
      ps.transparency_score,
      ps.user_control_score,
      ps.overall_risk_level,
      dc.collects_personal_info,
      dc.collects_financial_info,
      dc.collects_location_data,
      ds.shares_with_advertisers,
      ds.sells_personal_data,
      ur.right_to_erasure,
      ur.right_to_withdraw_consent
    FROM websites w
    JOIN privacy_policies pp ON w.id = pp.website_id
    LEFT JOIN privacy_scores ps ON pp.id = ps.policy_id
    LEFT JOIN data_collection dc ON pp.id = dc.policy_id
    LEFT JOIN data_sharing ds ON pp.id = ds.policy_id
    LEFT JOIN user_rights ur ON pp.id = ur.policy_id
    ORDER BY pp.analyzed_at DESC
  `;
  
  db.all(query, (err, rows) => {
    if (err) {
      res.status(500).json({ success: false, error: err.message });
    } else {
      res.json({
        success: true,
        analyses: rows.map(row => ({
          domain: row.domain,
          policy_url: row.policy_url,
          analyzed_at: row.analyzed_at,
          word_count: row.word_count,
          scores: {
            privacy_score: row.privacy_score,
            transparency_score: row.transparency_score,
            user_control_score: row.user_control_score,
            overall_risk_level: row.overall_risk_level
          },
          data_collection: {
            collects_personal_info: row.collects_personal_info,
            collects_financial_info: row.collects_financial_info,
            collects_location_data: row.collects_location_data
          },
          data_sharing: {
            shares_with_advertisers: row.shares_with_advertisers,
            sells_personal_data: row.sells_personal_data
          },
          user_rights: {
            right_to_erasure: row.right_to_erasure,
            right_to_withdraw_consent: row.right_to_withdraw_consent
          }
        }))
      });
    }
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('❌ Unhandled error:', err);
  res.status(500).json({ error: 'Internal server error' });
});

// Start server
app.listen(PORT, () => {
  console.log(`🍪 Cookie Banner API server running on port ${PORT}`);
  console.log(`📊 Database: ${dbPath}`);
});

// Graceful shutdown
process.on('SIGINT', () => {
  console.log('\n🛑 Shutting down server...');
  db.close((err) => {
    if (err) {
      console.error('❌ Error closing database:', err);
    } else {
      console.log('✅ Database connection closed');
    }
    process.exit(0);
  });
});
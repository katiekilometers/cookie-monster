const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const cors = require('cors');
const bodyParser = require('body-parser');
const helmet = require('helmet');
const path = require('path');
const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));
const { JSDOM } = require('jsdom');
const PrivacyPolicyScorer = require('./privacy-scorer');
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

// Initialize database with simplified schema (no analysis)
db.serialize(() => {
  // Drop existing table to recreate with new schema
  db.run(`DROP TABLE IF EXISTS cookie_banners`);
  
  // Create simplified cookie_banners table without analysis
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
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )`);

  console.log('📊 Database initialized with simplified schema (no analysis)');
});

// Function to fetch and extract privacy policy content
async function fetchPrivacyPolicy(url) {
  try {
    console.log(`🔍 Fetching privacy policy from: ${url}`);
    
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.5',
        'Accept-Encoding': 'gzip, deflate',
        'Connection': 'keep-alive',
        'Upgrade-Insecure-Requests': '1',
      },
      timeout: 10000
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const html = await response.text();
    const dom = new JSDOM(html);
    const document = dom.window.document;

    // Remove script and style elements
    const scripts = document.querySelectorAll('script, style, nav, header, footer, .header, .footer, .nav, .navigation');
    scripts.forEach(el => el.remove());

    // Extract text content
    const body = document.querySelector('body');
    if (!body) {
      throw new Error('No body element found');
    }

    // Try to find the main content area
    const mainContent = body.querySelector('main, .main, .content, .container, .wrapper, article, .article') || body;
    
    // Get text content and clean it up
    let textContent = mainContent.textContent || '';
    
    // Clean up the text
    textContent = textContent
      .replace(/\s+/g, ' ') // Replace multiple whitespace with single space
      .replace(/\n+/g, '\n') // Replace multiple newlines with single newline
      .trim();

    console.log(`✅ Privacy policy extracted (${textContent.length} chars)`);
    
    return {
      success: true,
      content: textContent,
      url: url,
      length: textContent.length
    };

  } catch (error) {
    console.error(`❌ Error fetching privacy policy from ${url}:`, error.message);
    return {
      success: false,
      error: error.message,
      url: url
    };
  }
}

// POST endpoint to store cookie banner data
app.post('/api/cookie-banners', async (req, res) => {
  try {
    const bannerData = req.body;
    
    // Store in database without analysis
    const stmt = db.prepare(`
      INSERT INTO cookie_banners (
        url, domain, timestamp, detectionMethod, textContent, htmlContent, 
        buttons, policyLinks, privacyLinks, position, styling, selector, 
        classes, elementId
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
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
      bannerData.position,
      bannerData.styling,
      bannerData.selector,
      bannerData.classes,
      bannerData.elementId
    );
    
    stmt.finalize();
    
    res.json({
      success: true,
      message: 'Cookie banner data stored successfully'
    });
    
  } catch (error) {
    console.error('Error storing cookie banner data:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to store cookie banner data',
      details: error.message
    });
  }
});

// GET endpoint to fetch privacy policy content
app.get('/api/privacy-policy', async (req, res) => {
  try {
    const { url } = req.query;
    
    if (!url) {
      return res.status(400).json({
        success: false,
        error: 'URL parameter is required'
      });
    }

    const result = await fetchPrivacyPolicy(url);
    res.json(result);

  } catch (error) {
    console.error('Error fetching privacy policy:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch privacy policy',
      details: error.message
    });
  }
});

// POST endpoint to analyze privacy policy with Anthropic
app.post('/api/analyze-privacy-policy', async (req, res) => {
  try {
    const { url } = req.body;
    
    if (!url) {
      return res.status(400).json({
        success: false,
        error: 'URL parameter is required'
      });
    }

    const urlObj = new URL(url);
    const domain = urlObj.hostname === 'localhost' || urlObj.hostname === '127.0.0.1' 
      ? `${urlObj.hostname}:${urlObj.port}`
      : urlObj.hostname;
    console.log('🔍 Processing privacy policy analysis request for:', domain);
    
    // Fetch privacy policy content
    const policyResult = await fetchPrivacyPolicy(url);
    
    if (!policyResult.success) {
      return res.status(500).json({
        success: false,
        error: 'Failed to fetch privacy policy',
        details: policyResult.error
      });
    }

    // Send to Claude for analysis
    const prompt = `Summarise this privacy policy, extracting the key information for someone interested in their privacy. Provide only the bottomline key message in one sentence`;
    
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': process.env.ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: 'claude-3-haiku-20240307',
        max_tokens: 150,
        messages: [
          {
            role: 'user',
            content: `${prompt}\n\nPrivacy Policy Content:\n${policyResult.content}`
          }
        ]
      })
    });

    const data = await response.json();
    
    if (data.content && data.content[0] && data.content[0].text) {
      const summary = data.content[0].text.trim();
      
      res.json({
        success: true,
        summary: summary,
        content: policyResult.content
      });
    } else {
      res.json({
        success: false,
        error: 'Failed to generate summary',
        details: data
      });
    }

  } catch (error) {
    console.error('Error analyzing privacy policy:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to analyze privacy policy',
      details: error.message
    });
  }
});

// POST endpoint to score privacy policy (no Claude)
app.post('/api/score-privacy-policy', async (req, res) => {
  try {
    const { url } = req.body;
    
    if (!url) {
      return res.status(400).json({
        success: false,
        error: 'URL parameter is required'
      });
    }

    console.log('🔍 Processing privacy policy scoring request for:', new URL(url).hostname);
    
    // Fetch privacy policy content
    const policyResult = await fetchPrivacyPolicy(url);
    
    if (!policyResult.success) {
      return res.status(500).json({
        success: false,
        error: 'Failed to fetch privacy policy',
        details: policyResult.error
      });
    }

    // Score the privacy policy
    const scorer = new PrivacyPolicyScorer();
    const scoreResult = scorer.scorePrivacyPolicy(policyResult.content);
    
    res.json({
      success: true,
      score: scoreResult.totalScore,
      grade: scoreResult.letterGrade,
      breakdown: scoreResult.breakdown,
      details: scoreResult.details,
      recommendations: scoreResult.recommendations,
      content: policyResult.content
    });

  } catch (error) {
    console.error('Error scoring privacy policy:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to score privacy policy',
      details: error.message
    });
  }
});

// GET endpoint to retrieve all cookie banners
app.get('/api/cookie-banners', (req, res) => {
  db.all(`
    SELECT * FROM cookie_banners 
    ORDER BY created_at DESC
  `, [], (err, rows) => {
    if (err) {
      console.error('Error retrieving cookie banners:', err);
      res.status(500).json({
        success: false,
        error: 'Failed to retrieve cookie banners'
      });
    } else {
      // Parse JSON fields
      const banners = rows.map(row => ({
        ...row,
        buttons: row.buttons ? JSON.parse(row.buttons) : [],
        policyLinks: row.policyLinks ? JSON.parse(row.policyLinks) : [],
        privacyLinks: row.privacyLinks ? JSON.parse(row.privacyLinks) : []
      }));
      
      res.json({
        success: true,
        banners: banners
      });
    }
  });
});

// GET endpoint to retrieve cookie banners by domain
app.get('/api/cookie-banners/domain/:domain', (req, res) => {
  const domain = req.params.domain;
  
  db.all(`
    SELECT * FROM cookie_banners 
    WHERE domain = ? 
    ORDER BY created_at DESC
  `, [domain], (err, rows) => {
    if (err) {
      console.error('Error retrieving cookie banners for domain:', err);
      res.status(500).json({
        success: false,
        error: 'Failed to retrieve cookie banners for domain'
      });
    } else {
      // Parse JSON fields
      const banners = rows.map(row => ({
        ...row,
        buttons: row.buttons ? JSON.parse(row.buttons) : [],
        policyLinks: row.policyLinks ? JSON.parse(row.policyLinks) : [],
        privacyLinks: row.privacyLinks ? JSON.parse(row.privacyLinks) : []
      }));
      
      res.json({
        success: true,
        banners: banners
      });
    }
  });
});

// DELETE endpoint to clear all cookie banner data
app.delete('/api/cookie-banners', (req, res) => {
  db.run('DELETE FROM cookie_banners', (err) => {
    if (err) {
      console.error('Error clearing cookie banners:', err);
      res.status(500).json({
        success: false,
        error: 'Failed to clear cookie banners'
      });
    } else {
      res.json({
        success: true,
        message: 'All cookie banner data cleared'
      });
    }
  });
});

// GET endpoint for basic statistics
app.get('/api/stats', (req, res) => {
  db.all(`
    SELECT 
      COUNT(*) as total_banners,
      COUNT(DISTINCT domain) as unique_domains
    FROM cookie_banners
  `, [], (err, rows) => {
    if (err) {
      console.error('Error retrieving stats:', err);
      res.status(500).json({
        success: false,
        error: 'Failed to retrieve statistics'
      });
    } else {
      const stats = rows[0] || { total_banners: 0, unique_domains: 0 };
      res.json({
        success: true,
        stats: {
          total_banners: stats.total_banners,
          unique_domains: stats.unique_domains
        }
      });
    }
  });
});

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({
    success: true,
    message: 'Cookie Banner API is running',
    timestamp: new Date().toISOString(),
    database: dbPath
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`🍪 Cookie Banner API server running on port ${PORT}`);
  console.log(`📊 Database: ${dbPath}`);
}); 
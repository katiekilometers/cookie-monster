const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const cors = require('cors');
const bodyParser = require('body-parser');
const helmet = require('helmet');
const path = require('path');
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

// Create tables if they don't exist (resetting for new schema)
db.serialize(() => {
  // Main cookie banners table
  db.run(`
    DROP TABLE IF EXISTS cookie_banners;
  `);
  db.run(`
    CREATE TABLE IF NOT EXISTS cookie_banners (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      banner_id TEXT UNIQUE,
      url TEXT NOT NULL,
      domain TEXT NOT NULL,
      timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
      detection_method TEXT,
      text_content TEXT,
      html_content TEXT,
      position_data TEXT,
      styling_data TEXT,
      selector TEXT,
      classes TEXT,
      element_id TEXT,
      analysis_text TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Buttons table
  db.run(`
    DROP TABLE IF EXISTS banner_buttons;
  `);
  db.run(`
    CREATE TABLE IF NOT EXISTS banner_buttons (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      banner_id TEXT,
      button_text TEXT,
      button_type TEXT,
      button_classes TEXT,
      button_id TEXT,
      button_href TEXT,
      FOREIGN KEY (banner_id) REFERENCES cookie_banners (banner_id)
    )
  `);

  // Policy links table
  db.run(`
    DROP TABLE IF EXISTS policy_links;
  `);
  db.run(`
    CREATE TABLE IF NOT EXISTS policy_links (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      banner_id TEXT,
      link_text TEXT,
      link_href TEXT,
      FOREIGN KEY (banner_id) REFERENCES cookie_banners (banner_id)
    )
  `);

  console.log('✅ Database tables initialized (reset)');
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
        max_tokens: 256,
        messages: [
          {
            role: 'user',
            content: `You are a privacy assistant. Given this popup text, answer:\n1. Does it provide clear opt-out choices?\n2. Is it using dark patterns?\n3. Is tracking enabled by default?\n4. How privacy-friendly is it? (Grade A-F)\n\nPopup text:\n${text}`
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

// Store cookie banner data
app.post('/api/cookie-banners', async (req, res) => {
  const bannerData = req.body;

  // Get plain language analysis from Anthropic
  let analysisText = '';
  try {
    analysisText = await getAnalysisFromAnthropic(bannerData.textContent || '');
  } catch (e) {
    analysisText = '';
  }

  // Insert main banner data, now including analysisText
  const insertBanner = `
    INSERT OR REPLACE INTO cookie_banners (
      banner_id, url, domain, detection_method, text_content, 
      html_content, position_data, styling_data, selector, 
      classes, element_id, analysis_text
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `;

  db.run(insertBanner, [
    bannerData.id,
    bannerData.url,
    bannerData.domain,
    bannerData.detectionMethod,
    bannerData.textContent,
    bannerData.htmlContent,
    JSON.stringify(bannerData.position),
    JSON.stringify(bannerData.styling),
    bannerData.selector,
    bannerData.classes,
    bannerData.elementId,
    analysisText
  ], function(err) {
    if (err) {
      console.error('❌ Error inserting banner:', err);
      return res.status(500).json({ error: 'Failed to store banner data' });
    }

    // Insert buttons
    if (bannerData.buttons && bannerData.buttons.length > 0) {
      const insertButton = `INSERT INTO banner_buttons (banner_id, button_text, button_type, button_classes, button_id, button_href) VALUES (?, ?, ?, ?, ?, ?)`;
      bannerData.buttons.forEach(button => {
        db.run(insertButton, [
          bannerData.id,
          button.text,
          button.type,
          button.classes,
          button.id,
          button.href
        ]);
      });
    }

    // Insert policy links
    if (bannerData.policyLinks && bannerData.policyLinks.length > 0) {
      const insertLink = `INSERT INTO policy_links (banner_id, link_text, link_href) VALUES (?, ?, ?)`;
      bannerData.policyLinks.forEach(link => {
        db.run(insertLink, [
          bannerData.id,
          link.text,
          link.href
        ]);
      });
    }

    console.log('✅ Cookie banner stored successfully:', bannerData.id);
    res.json({ 
      success: true, 
      message: 'Cookie banner data stored successfully',
      bannerId: bannerData.id 
    });
  });
});

// Get all cookie banners
app.get('/api/cookie-banners', (req, res) => {
  const query = `
    SELECT 
      cb.*,
      GROUP_CONCAT(DISTINCT bb.button_text) as button_texts,
      GROUP_CONCAT(DISTINCT pl.link_text) as policy_links
    FROM cookie_banners cb
    LEFT JOIN banner_buttons bb ON cb.banner_id = bb.banner_id
    LEFT JOIN policy_links pl ON cb.banner_id = pl.banner_id
    GROUP BY cb.banner_id
    ORDER BY cb.timestamp DESC
    LIMIT 100
  `;

  db.all(query, [], (err, rows) => {
    if (err) {
      console.error('❌ Error fetching banners:', err);
      return res.status(500).json({ error: 'Failed to fetch banner data' });
    }

    res.json({
      success: true,
      count: rows.length,
      banners: rows
    });
  });
});

// Get banners by domain
app.get('/api/cookie-banners/domain/:domain', (req, res) => {
  const domain = req.params.domain;
  
  const query = `
    SELECT cb.*, 
           json_group_array(json_object('text', bb.button_text, 'type', bb.button_type)) as buttons,
           json_group_array(json_object('text', pl.link_text, 'href', pl.link_href)) as policy_links
    FROM cookie_banners cb
    LEFT JOIN banner_buttons bb ON cb.banner_id = bb.banner_id
    LEFT JOIN policy_links pl ON cb.banner_id = pl.banner_id
    WHERE cb.domain = ?
    GROUP BY cb.banner_id
    ORDER BY cb.timestamp DESC
  `;

  db.all(query, [domain], (err, rows) => {
    if (err) {
      console.error('❌ Error fetching banners for domain:', err);
      return res.status(500).json({ error: 'Failed to fetch banner data' });
    }

    res.json({
      success: true,
      domain: domain,
      count: rows.length,
      banners: rows
    });
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

// Clear all cookie banners and related data
app.delete('/api/cookie-banners/clear', (req, res) => {
  db.serialize(() => {
    db.run('DELETE FROM banner_buttons');
    db.run('DELETE FROM policy_links');
    db.run('DELETE FROM cookie_banners', (err) => {
      if (err) {
        console.error('❌ Error clearing banners:', err);
        return res.status(500).json({ error: 'Failed to clear banner data' });
      }
      console.log('🗑️ All cookie banner data cleared');
      res.json({ success: true, message: 'All cookie banner data cleared' });
    });
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
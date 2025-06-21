> **Disclaimer:** This project is for demonstration and research purposes only. It is intended to be used with fake/test websites, or on sites where you have explicit permission and have agreed to the terms of service for such use. Do not use this tool on real websites without proper authorization.

# 🍪 Cookie Popup Analyzer

A comprehensive Chrome extension that detects cookie banners on websites, analyzes them using AI for privacy insights and dark pattern detection, and provides detailed privacy policy analysis. The extension includes a modern dashboard for data visualization and aggregated analytics.

## 🌟 Features

### 🔍 **Smart Detection**
- Automatically detects cookie banners and privacy notices
- Uses multiple detection methods (selectors, keywords, positioning)
- Real-time scanning with mutation observers
- Visual highlighting of detected banners

### 🤖 **AI-Powered Analysis**
- Sends banner content to Anthropic Claude API for analysis
- Translates complex privacy policies into plain English
- Identifies dark patterns and deceptive practices
- Provides privacy grades (A-F) with detailed breakdowns

### 📊 **Comprehensive Dashboard**
- Real-time data visualization with interactive charts
- Privacy score distribution and timeline analysis
- Advanced filtering and search capabilities
- Detailed analysis modal for each detection
- Data export functionality

### 🎨 **Beautiful UI**
- Dark purple and green theme with glassmorphism effects
- Responsive design that works on all devices
- Smooth animations and hover effects
- Professional, modern interface

### Enhanced Privacy Policy Analysis
- **Link Detection**: Automatically identifies privacy policy links in cookie banners
- **Content Extraction**: Fetches and extracts full privacy policy content
- **Comprehensive Analysis**: Analyzes privacy policies for:
  - Data collection practices
  - Data sharing policies
  - User rights and controls
  - Data retention policies
  - Third-party sharing
  - International data transfers
  - Children's privacy protection
  - Security measures
  - GDPR/CCPA compliance
  - Red flags and concerning practices
  - Green flags and good practices

## 🏗️ Project Structure

```
cookie-monster/
├── extension/                 # Chrome extension
│   ├── manifest.json         # Extension configuration
│   ├── background.js         # Service worker
│   ├── content.js            # Content script for detection
│   ├── popup/                # Extension popup UI
│   │   ├── popup.html        # Popup interface
│   │   ├── popup.js          # Popup functionality
│   │   └── popup.css         # Popup styling
│   ├── icons/                # Extension icons
│   └── lib/                  # Shared libraries
├── cookie-banner-api/        # Backend API server
│   ├── server.js             # Express server
│   ├── package.json          # API dependencies
│   └── cookie_banners.db     # SQLite database
├── dashboard/                # Web dashboard
│   ├── index.html            # Dashboard interface
│   ├── style.css             # Dashboard styling
│   ├── app.js                # Dashboard functionality
│   ├── server.js             # Dashboard server
│   └── package.json          # Dashboard dependencies
├── shared/                   # Shared constants
└── package.json              # Root package.json
```

## 🚀 Quick Start

### Prerequisites
- **Node.js** (v14 or higher)
- **Chrome Browser** (for the extension)
- **Anthropic API Key** (for AI analysis)

### 1. Clone and Install
```bash
git clone <repository-url>
cd cookie-monster
npm run install:all
```

### 2. Configure API Key
Create a `.env` file in the `cookie-banner-api` directory:
```bash
cd cookie-banner-api
echo "ANTHROPIC_API_KEY=your_api_key_here" > .env
```

### 3. Start All Services
```bash
npm start
```

This will start:
- **API Server**: `http://localhost:3000`
- **Dashboard**: `http://localhost:3001`

### 4. Load the Extension
1. Open Chrome and go to `chrome://extensions/`
2. Enable "Developer mode"
3. Click "Load unpacked"
4. Select the `extension` folder
5. The extension icon should appear in your toolbar

## 📖 Detailed Setup

### API Server Setup
```bash
cd cookie-banner-api
npm install
npm start
```

The API server provides:
- Cookie banner data storage
- AI analysis integration
- Data retrieval endpoints
- Database management

### Dashboard Setup
```bash
cd dashboard
npm install
npm start
```

The dashboard provides:
- Real-time data visualization
- Interactive charts and analytics
- Advanced filtering and search
- Data export functionality

### Extension Setup
1. **Load in Chrome:**
   - Navigate to `chrome://extensions/`
   - Enable "Developer mode"
   - Click "Load unpacked"
   - Select the `extension` folder

2. **Configure Permissions:**
   - The extension will request permissions for active tabs and storage
   - Grant permissions when prompted

## 🎯 Usage

### Using the Extension
1. **Browse normally** - The extension automatically scans for cookie banners
2. **View detections** - Click the extension icon to see detected banners
3. **Get analysis** - Each detection includes AI-powered privacy analysis
4. **View details** - Click on domains in the popup for detailed analysis

### Using the Dashboard
1. **Open dashboard** - Navigate to `http://localhost:3001`
2. **View overview** - See total detections, unique domains, and risk assessment
3. **Explore charts** - Interactive privacy score distribution and timeline
4. **Filter data** - Use domain, grade, and search filters
5. **Export data** - Download comprehensive reports

## 🔍 Privacy Policy Analysis

### How It Works
The extension now provides comprehensive privacy policy analysis:

1. **Link Detection**: When a cookie banner is detected, the extension automatically identifies privacy policy links using pattern matching for:
   - Privacy policy links
   - Cookie policy links
   - Terms of service links
   - GDPR/CCPA information links

2. **Content Extraction**: The extension fetches the full privacy policy content by:
   - Making HTTP requests to privacy policy URLs
   - Extracting main content while removing navigation and headers
   - Processing and cleaning the text for analysis
   - Limiting content size for API efficiency

3. **AI Analysis**: The extracted privacy policy is analyzed using Claude AI for:
   - **Overall Score**: A-F rating for the entire policy
   - **Data Collection**: What types of data are collected
   - **Data Sharing**: How and with whom data is shared
   - **User Rights**: What rights users have over their data
   - **Retention Policies**: How long data is retained
   - **Third-party Sharing**: Extent of third-party data sharing
   - **International Transfers**: Cross-border data transfers
   - **Children's Privacy**: Protection for children's data
   - **Security Measures**: Security practices described
   - **Contact Information**: Privacy contact details
   - **Compliance**: GDPR/CCPA compliance assessment
   - **Red Flags**: Concerning practices and potential issues
   - **Green Flags**: Good practices and positive aspects
   - **Summary**: Brief overview of key findings

### Enhanced Analysis Features
- **Dual Analysis**: Both cookie banner and privacy policy are analyzed
- **Comprehensive Coverage**: Covers all major privacy policy aspects
- **Regulatory Compliance**: Checks for GDPR, CCPA, and other privacy laws
- **Risk Assessment**: Identifies potential privacy risks and concerns
- **Best Practices**: Highlights good privacy practices and transparency

### Privacy Policy Content Storage
- **Full Content**: Complete privacy policy text is stored in the database
- **Content Preview**: Dashboard shows preview of extracted content
- **Link Preservation**: Original privacy policy links are preserved
- **Categorization**: Links are categorized by type (privacy, cookie, terms, etc.)

## 🔧 Development

### Development Mode
```bash
npm run dev
```
Runs both servers with auto-restart for development.

### Individual Services
```bash
# API only
npm run api

# Dashboard only
npm run dashboard

# API in dev mode
npm run api:dev

# Dashboard in dev mode
npm run dashboard:dev
```

### API Endpoints
- `GET /api/cookie-banners` - Get all banner data
- `POST /api/cookie-banners` - Store new banner data
- `GET /api/cookie-banners/domain/:domain` - Get domain-specific data
- `DELETE /api/cookie-banners/clear` - Clear all data

## 🎨 Customization

### Theme Colors
The project uses a dark purple and green theme. To customize:
- **Extension**: Edit `extension/popup/popup.html` CSS variables
- **Dashboard**: Edit `dashboard/style.css` color values

### Detection Sensitivity
Adjust detection sensitivity in `extension/content.js`:
- Modify `cookieKeywords` array
- Update `cookieBannerSelectors` array
- Adjust scoring thresholds

## 🐛 Troubleshooting

### Extension Not Detecting Banners
1. Check browser console for errors
2. Verify extension permissions
3. Reload the extension
4. Check if the API server is running

### Dashboard Not Loading Data
1. Ensure API server is running on port 3000
2. Check browser console for CORS errors
3. Verify API endpoints are accessible
4. Check network connectivity

### API Connection Issues
1. Verify `.env` file exists with API key
2. Check if Anthropic API key is valid
3. Ensure database file is writable
4. Check server logs for errors

## 📊 Data Export

The dashboard provides comprehensive data export:
- **JSON Format**: Complete banner data with analysis
- **Timestamps**: All detection times and metadata
- **Analysis Results**: AI-generated privacy assessments
- **Summary Statistics**: Aggregated metrics and insights

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## 📄 License

MIT License - see LICENSE file for details

## 🙏 Acknowledgments

- **Anthropic Claude** for AI-powered analysis
- **Chart.js** for data visualization
- **Express.js** for the API server
- **Chrome Extensions API** for browser integration

---

**Happy Privacy Analysis! 🍪🔍**
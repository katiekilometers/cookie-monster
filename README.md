> **Disclaimer:** This project is for demonstration and research purposes only. It is intended to be used with fake/test websites, or on sites where you have explicit permission and have agreed to the terms of service for such use. Do not use this tool on real websites without proper authorization.

# 🍪 Cookie Popup Analyzer

## 🎯 **Proof of Concept: Empowering Users to Understand Their Privacy**

This project demonstrates a proof of concept mechanism designed to give users the power to understand their privacy in the digital landscape. In today's interconnected world, privacy policies and cookie banners are often complex, lengthy, and filled with legal jargon that makes it difficult for users to make informed decisions about their data.

### **The Problem**
- Privacy policies are typically written in complex legal language
- Cookie banners use dark patterns to manipulate user choices
- Users lack tools to quickly understand what data is being collected
- There's no easy way to compare privacy practices across websites
- Users often click "Accept All" without understanding the implications

### **Our Solution**
This proof of concept demonstrates how technology can bridge the gap between complex privacy policies and user understanding by:

1. **Automatically Detecting** cookie banners and privacy notices
2. **Translating Complex Language** into plain English using AI
3. **Identifying Dark Patterns** and deceptive practices
4. **Providing Privacy Grades** (A-F) with detailed breakdowns
5. **Aggregating Data** to show privacy trends across websites
6. **Empowering Users** to make informed decisions about their data

### **The Vision**
This project represents a step toward a future where:
- Users can instantly understand what data a website collects
- Privacy practices are transparent and comparable
- Dark patterns are automatically identified and flagged
- Users have the tools to make informed privacy decisions
- Privacy becomes a competitive advantage for companies

---

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

### 📊 **Comprehensive Privacy Policy Analysis**
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

### 📈 **Aggregate Data Analytics**
- **Tabbed Interface**: Switch between "Current Site" and "Aggregate Data" views
- **Statistics Dashboard**: Shows total sites analyzed, average privacy score, total banners found, and total policies discovered
- **Grade Distribution**: Visual breakdown of A-F grades across all analyzed sites
- **Top Performing Sites**: List of sites with scores ≥70, sorted by highest score
- **Low Scoring Sites**: Sites with scores <50 that need attention
- **Real-time Updates**: Data refreshes automatically as you browse

### 🎨 **Beautiful UI**
- Dark purple and green theme with glassmorphism effects
- Responsive design that works on all devices
- Smooth animations and hover effects
- Professional, modern interface
- Tabbed popup interface for easy navigation

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

### 3. Start the API Server
```bash
cd cookie-banner-api
npm start
```

This will start:
- **API Server**: `http://localhost:3000`

### 4. Load the Extension
1. Open Chrome and go to `chrome://extensions/`
2. Enable "Developer mode"
3. Click "Load unpacked"
4. Select the `extension` folder
5. The extension icon should appear in your toolbar

### 5. Test with Sample Websites
Start the included test websites:
```bash
# Terminal 1 - Chattr website
cd chattr
python3 -m http.server 8000

# Terminal 2 - ShopSmart website  
cd shopsmart
python3 -m http.server 8081
```

Visit:
- **Chattr**: `http://localhost:8000`
- **ShopSmart**: `http://localhost:8081`

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
- Privacy policy analysis and scoring

### Extension Setup
1. **Load in Chrome:**
   - Navigate to `chrome://extensions/`
   - Enable "Developer mode"
   - Click "Load unpacked"
   - Select the `extension` folder

2. **Configure Permissions:**
   - The extension will request permissions for active tabs and storage
   - Grant permissions when prompted

3. **Test Websites Setup:**
   - The project includes two sample websites for testing
   - Chattr: `http://localhost:8000`
   - ShopSmart: `http://localhost:8081`

## 🎯 Usage

### Using the Extension
1. **Browse normally** - The extension automatically scans for cookie banners
2. **View detections** - Click the extension icon to see detected banners
3. **Switch tabs** - Use the "Current Site" and "Aggregate Data" tabs
4. **Get analysis** - Each detection includes AI-powered privacy analysis
5. **View privacy scores** - See A-F grades with detailed breakdowns
6. **Explore aggregate data** - View statistics across all analyzed sites

### Extension Features

#### **Current Site Tab**
- Shows privacy policy analysis for the current website
- Displays detected cookie banners and privacy notices
- Provides AI-generated summaries and privacy scores
- Lists discovered privacy policy links
- Shows detailed analysis with red flags and green flags

#### **Aggregate Data Tab**
- **Statistics Overview**: Total sites, average score, banners found, policies discovered
- **Grade Distribution**: Visual breakdown of A-F grades across all sites
- **Top Performers**: Sites with scores ≥70, sorted by highest score
- **Low Scores**: Sites with scores <50 that need attention
- **Real-time Updates**: Data refreshes as you browse different sites

### Privacy Policy Analysis
The extension provides comprehensive privacy policy analysis including:
- Overall privacy score (A-F grade)
- Data collection practices
- Data sharing policies
- User rights and controls
- Data retention policies
- Third-party sharing
- International data transfers
- Children's privacy protection
- Security measures
- GDPR/CCPA compliance assessment
- Red flags and concerning practices
- Green flags and good practices

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
Runs the API server with auto-restart for development.

### Individual Services
```bash
# API only
npm run api

# API in dev mode
npm run api:dev
```

### API Endpoints
- `GET /api/cookie-banners` - Get all banner data
- `POST /api/cookie-banners` - Store new banner data
- `GET /api/cookie-banners/domain/:domain` - Get domain-specific data
- `DELETE /api/cookie-banners/clear` - Clear all data
- `POST /api/analyze-privacy-policy` - Analyze privacy policy content
- `POST /api/score-privacy-policy` - Score privacy policy

## 🎨 Customization

### Theme Colors
The project uses a dark purple and green theme. To customize:
- **Extension**: Edit `extension/popup/popup.html` CSS variables

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

### API Connection Issues
1. Verify `.env` file exists with API key
2. Check if Anthropic API key is valid
3. Ensure database file is writable
4. Check server logs for errors

### Tab Switching Not Working
1. Reload the extension in Chrome
2. Check browser console for JavaScript errors
3. Verify popup HTML structure is correct
4. Clear extension storage and try again

## 📊 Data Storage

The extension stores comprehensive data:
- **Cookie Banner Data**: All detected banners with metadata
- **Privacy Policy Content**: Full extracted privacy policy text
- **Analysis Results**: AI-generated privacy assessments
- **Aggregate Statistics**: Cross-site analytics and trends

## 🚀 Future Improvements

This proof of concept demonstrates the foundation for a comprehensive privacy analysis platform. Here are potential future enhancements:

### 📊 **Advanced Dashboard & Analytics**
- **Interactive Dashboard**: Web-based dashboard for comprehensive data visualization
- **Real-time Analytics**: Live charts showing privacy trends across websites
- **Comparative Analysis**: Side-by-side comparison of privacy practices between sites
- **Historical Tracking**: Monitor how privacy policies change over time
- **Export Capabilities**: Generate detailed reports in PDF, CSV, or JSON formats
- **Custom Alerts**: Notifications when privacy policies change or new risks are detected

### 🤖 **Enhanced AI Capabilities**
- **Multi-language Support**: Analyze privacy policies in different languages
- **Regulatory Compliance**: Automated checking against GDPR, CCPA, LGPD, and other regulations
- **Risk Scoring**: Advanced algorithms to calculate privacy risk scores
- **Dark Pattern Detection**: Identify and flag deceptive UI patterns in cookie banners
- **Sentiment Analysis**: Understand the tone and user-friendliness of privacy communications
- **Automated Summaries**: Generate executive summaries for different user types

### 🔍 **Advanced Detection & Analysis**
- **Machine Learning Models**: Train custom models for better banner and policy detection
- **Image Recognition**: Analyze visual elements in cookie banners and privacy notices
- **Cross-Platform Support**: Extend to Firefox, Safari, and mobile browsers
- **API Integration**: Connect with privacy databases and regulatory sources
- **Blockchain Verification**: Verify privacy policy authenticity and changes
- **Real-time Monitoring**: Continuous monitoring of privacy policy changes

### 👥 **User Experience Enhancements**
- **Personalized Insights**: Tailored recommendations based on user preferences
- **Privacy Score Dashboard**: Personal privacy score across all visited sites
- **Educational Content**: Built-in privacy education and best practices
- **Community Features**: Share findings and collaborate with other users
- **Privacy Recommendations**: Suggest privacy-focused alternatives to services
- **Customizable Alerts**: Set preferences for what privacy issues to flag

### 🔧 **Technical Improvements**
- **Performance Optimization**: Faster analysis and reduced resource usage
- **Offline Capabilities**: Basic analysis without internet connection
- **Data Privacy**: Enhanced encryption and local data storage options
- **API Rate Limiting**: Intelligent caching and request optimization
- **Scalability**: Support for enterprise-level deployments
- **Integration APIs**: Allow third-party tools to access analysis data

### 🌐 **Ecosystem Integration**
- **Browser Extensions**: Native integration with major browsers
- **Mobile Apps**: iOS and Android applications for mobile privacy analysis
- **Enterprise Solutions**: Corporate privacy compliance tools
- **Developer Tools**: APIs and SDKs for developers to integrate privacy analysis
- **Regulatory Tools**: Tools for compliance officers and legal teams
- **Research Platform**: Academic and research tools for privacy studies

### 📈 **Business Intelligence**
- **Privacy Benchmarking**: Compare privacy practices across industries
- **Trend Analysis**: Identify emerging privacy trends and patterns
- **Competitive Intelligence**: Monitor competitor privacy practices
- **Risk Assessment**: Enterprise risk scoring and reporting
- **Compliance Monitoring**: Automated compliance checking and reporting
- **Stakeholder Reporting**: Generate reports for executives and boards

### 🎯 **Social Impact Features**
- **Privacy Advocacy**: Tools to support privacy rights organizations
- **Public Awareness**: Public dashboards showing privacy trends
- **Regulatory Reporting**: Automated reporting to privacy regulators
- **Whistleblower Protection**: Secure reporting of privacy violations
- **Educational Resources**: Privacy literacy tools for schools and organizations
- **Research Collaboration**: Platform for privacy researchers and academics

These improvements would transform this proof of concept into a comprehensive privacy empowerment platform, giving users unprecedented control and understanding of their digital privacy landscape.

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
- **Express.js** for the API server
- **Chrome Extensions API** for browser integration

---

**Happy Privacy Analysis! 🍪🔍**
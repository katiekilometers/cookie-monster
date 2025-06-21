# ShopSmart - Test Website

> **Disclaimer:** This web application is for demonstration and testing purposes only. It is intended to be used with the Cookie Popup Analyzer extension on fake/test websites, or on sites where you have explicit permission and have agreed to the terms of service for such use. Do not use this tool on real websites without proper authorization.

A fake e-commerce website for testing the Cookie Popup Analyzer extension.

## Features

- Realistic shopping interface
- Cookie banner with privacy policy link
- Privacy policy page with comprehensive content
- Test data for extension analysis

## Quick Start

1. Navigate to the shopsmart directory:
```bash
cd shopsmart
```

2. Start the local server:
```bash
python3 -m http.server 8000
```

3. Open your browser and go to:
```
http://localhost:8000
```

4. The extension should detect the cookie banner and analyze the privacy policy.

## Structure

- `index.html` - Main shopping page with cookie banner
- `privacy-policy.html` - Privacy policy page
- `styles.css` - Styling for both pages
- `script.js` - JavaScript functionality

## Testing

This site is designed to test:
- Cookie banner detection
- Privacy policy link extraction
- Content analysis
- Data storage and retrieval

## File Structure

```
shopsmart/
├── index.html              # Main shopping site with cookie banner
├── privacy-policy.html     # Comprehensive privacy policy page
├── styles.css              # Modern CSS styling
├── script.js               # Interactive functionality
└── README.md               # This file
```

## How to Use

### 1. Start the Web App
```bash
# Navigate to the test web app directory
cd shopsmart

# Open the main page in your browser
open index.html
# or
python -m http.server 8000  # Then visit http://localhost:8000
```

### 2. Test the Cookie Banner
1. **Load the page** - The cookie banner will appear after 1 second
2. **Test different actions**:
   - Click "Accept All" to accept all cookies
   - Click "Reject All" to reject non-essential cookies
   - Click "Manage Preferences" to open the detailed modal
   - Click the "Privacy Policy" link to view the privacy policy page

### 3. Test with Your Extension
1. **Load your Chrome extension** in developer mode
2. **Navigate to the test site** (http://localhost:8000 or file:// path)
3. **Observe the extension's behavior**:
   - Cookie banner detection
   - Privacy policy link extraction
   - Analysis results in the extension popup
   - Data sent to your backend API

### 4. Test Privacy Policy Analysis
1. **Click the "Privacy Policy" link** in the cookie banner
2. **Verify the extension detects** the privacy policy URL
3. **Check the backend** for privacy policy analysis results
4. **Review the dashboard** for aggregated data

## Cookie Banner Features

### Banner Content
- **Clear messaging** about cookie usage
- **Privacy policy link** for detailed information
- **Multiple action buttons** with different consent levels
- **Professional styling** that matches modern websites

### Cookie Categories
- **Essential Cookies**: Required for website functionality (always enabled)
- **Analytics Cookies**: Website usage analysis
- **Marketing Cookies**: Advertising and targeting
- **Preference Cookies**: User settings and customization

### User Interactions
- **Accept All**: Enables all cookie categories
- **Reject All**: Only enables essential cookies
- **Manage Preferences**: Opens modal for granular control
- **Save Preferences**: Applies selected cookie settings

## Privacy Policy Content

The privacy policy includes standard sections:

1. **Information Collection** - Personal and automatic data collection
2. **Data Usage** - How collected information is used
3. **Information Sharing** - Third-party disclosures and partnerships
4. **Data Security** - Protection measures and retention policies
5. **User Rights** - Access, correction, and deletion rights
6. **International Transfers** - Cross-border data processing
7. **Children's Privacy** - Age restrictions and protections
8. **Policy Updates** - Change notification procedures
9. **Contact Information** - How to reach the company

## Testing Scenarios

### Scenario 1: Basic Detection
- Load the page and verify the extension detects the cookie banner
- Check that the privacy policy link is identified
- Verify banner analysis is sent to the backend

### Scenario 2: Privacy Policy Analysis
- Click the privacy policy link
- Verify the extension extracts the policy URL
- Check that the backend fetches and analyzes the policy content
- Review the analysis results in the dashboard

### Scenario 3: User Interactions
- Test different cookie consent actions
- Verify the extension tracks user interactions
- Check that consent data is properly recorded

### Scenario 4: Multiple Visits
- Visit the site multiple times
- Test with different consent choices
- Verify data aggregation in the dashboard

## Customization

### Modify Cookie Banner
Edit `index.html` to change:
- Banner text and messaging
- Button labels and actions
- Privacy policy link URL

### Update Privacy Policy
Edit `privacy-policy.html` to modify:
- Policy content and sections
- Company information
- Data practices and policies

### Adjust Styling
Edit `styles.css` to customize:
- Colors and typography
- Layout and spacing
- Responsive design

### Enhance Functionality
Edit `script.js` to add:
- Additional cookie categories
- More complex consent logic
- Enhanced user interactions

## Troubleshooting

### Banner Not Appearing
- Check browser console for JavaScript errors
- Verify localStorage is not blocking the banner
- Ensure all script files are loaded correctly

### Extension Not Detecting
- Verify the extension is loaded and enabled
- Check extension permissions for the test domain
- Review extension console logs for errors

### Privacy Policy Issues
- Ensure the privacy policy URL is accessible
- Check that the extension can navigate to the policy page
- Verify backend API is running and accessible

## Browser Compatibility

- **Chrome**: Full support (recommended for extension testing)
- **Firefox**: Full support
- **Safari**: Full support
- **Edge**: Full support

## Security Notes

This is a test application with:
- No real data collection or processing
- No actual e-commerce functionality
- No real privacy policy enforcement
- Designed solely for extension testing purposes

## Support

For issues with the test web app:
1. Check browser console for errors
2. Verify all files are in the correct directory
3. Ensure proper file permissions
4. Test with a simple HTTP server if file:// protocol has issues

For extension-related issues, refer to your main project documentation. 
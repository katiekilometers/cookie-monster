# Cookie Popup Analyzer Dashboard

A comprehensive web dashboard for visualizing and analyzing cookie banner data collected by the Cookie Popup Analyzer Chrome extension.

## Features

### 📊 Overview Statistics
- Total cookie banners detected
- Unique domains analyzed
- High-risk sites identified
- Average privacy score

### 📈 Interactive Charts
- **Privacy Score Distribution**: Doughnut chart showing grade distribution (A-F)
- **Detection Timeline**: Line chart showing detections over time

### 🔍 Detailed Analytics
- **Top Tracking Domains**: Most frequently detected domains
- **Privacy Grade Breakdown**: Detailed breakdown of privacy grades
- **Recent Detections**: Filterable list of all detections

### 🎯 Advanced Filtering
- Filter by domain
- Filter by privacy grade
- Search functionality
- Real-time filtering

### 📋 Detailed Analysis Modal
- Click any detection for detailed analysis
- View full banner content
- See privacy analysis breakdown
- Domain information and metadata

## Setup

### Prerequisites
- Node.js (v14 or higher)
- The Cookie Popup Analyzer API server running on `http://localhost:3000`

### Installation

1. **Install dependencies:**
   ```bash
   cd dashboard
   npm install
   ```

2. **Start the dashboard server:**
   ```bash
   npm start
   ```

3. **Access the dashboard:**
   Open your browser and navigate to `http://localhost:3001`

### Development Mode
For development with auto-restart:
```bash
npm run dev
```

## API Integration

The dashboard automatically connects to the Cookie Popup Analyzer API at `http://localhost:3000/api` to fetch:

- All cookie banner data
- Privacy analysis results
- Domain-specific information

## Data Export

Click the "Export Report" button to download a JSON file containing:
- All banner data
- Analysis results
- Timestamps and metadata
- Summary statistics

## UI/UX Features

### 🎨 Design System
- **Dark Purple & Green Theme**: Matches the extension's aesthetic
- **Glassmorphism Effects**: Modern, translucent UI elements
- **Responsive Design**: Works on desktop and mobile devices
- **Smooth Animations**: Hover effects and transitions

### 🔄 Real-time Updates
- Auto-refreshes data every 30 seconds
- Manual refresh button
- Live chart updates
- Real-time filtering

### 📱 Mobile Responsive
- Responsive grid layouts
- Touch-friendly interactions
- Optimized for mobile browsers

## File Structure

```
dashboard/
├── index.html          # Main dashboard HTML
├── style.css           # Comprehensive styling
├── app.js              # Dashboard application logic
├── server.js           # Express server
├── package.json        # Dependencies
└── README.md           # This file
```

## Browser Compatibility

- Chrome 80+
- Firefox 75+
- Safari 13+
- Edge 80+

## Troubleshooting

### Dashboard not loading data
1. Ensure the API server is running on `http://localhost:3000`
2. Check browser console for CORS errors
3. Verify API endpoints are accessible

### Charts not displaying
1. Ensure Chart.js is loaded (CDN)
2. Check for JavaScript errors in console
3. Verify data format from API

### Styling issues
1. Clear browser cache
2. Check if fonts are loading properly
3. Verify CSS file is being served

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

MIT License - see LICENSE file for details 
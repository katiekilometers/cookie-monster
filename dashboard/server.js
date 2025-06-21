const express = require('express');
const path = require('path');
const cors = require('cors');

const app = express();
const PORT = 3001;

// Enable CORS for API communication
app.use(cors());

// Serve static files
app.use(express.static(__dirname));

// Serve the dashboard
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.listen(PORT, () => {
  console.log(`🚀 Dashboard server running on http://localhost:${PORT}`);
  console.log(`📊 Dashboard available at http://localhost:${PORT}`);
}); 
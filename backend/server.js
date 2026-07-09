const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = process.env.PORT || 5000;

// Enable CORS
app.use(cors());
app.use(express.json());

console.log('✅ Server starting...');

// API Routes
app.get('/api/test', (req, res) => {
    res.json({ 
        message: 'API is working!',
        timestamp: new Date().toISOString()
    });
});

app.get('/api/clients', (req, res) => {
    res.json([
        { id: 1, name: 'Sample Client 1', contact: 'John Doe' },
        { id: 2, name: 'Sample Client 2', contact: 'Jane Smith' }
    ]);
});

app.get('/api/vessels', (req, res) => {
    res.json([
        { id: 1, name: 'Vessel 1', type: 'Cargo' },
        { id: 2, name: 'Vessel 2', type: 'Tanker' }
    ]);
});

// Health check endpoint
app.get('/health', (req, res) => {
    res.status(200).json({ status: 'healthy' });
});

// Serve frontend if built
const frontendBuildPath = path.join(__dirname, '../frontend/build');
console.log('Looking for frontend at:', frontendBuildPath);

if (fs.existsSync(frontendBuildPath)) {
    console.log('✅ Serving frontend');
    app.use(express.static(frontendBuildPath));
    app.get('*', (req, res) => {
        res.sendFile(path.join(frontendBuildPath, 'index.html'));
    });
} else {
    console.log('⚠️ Frontend not built, API only mode');
    app.get('/', (req, res) => {
        res.send(`
            <!DOCTYPE html>
            <html>
            <head>
                <title>🚢 DJ Group Chartering Database</title>
                <style>
                    body { font-family: Arial, sans-serif; max-width: 800px; margin: 50px auto; padding: 20px; background: #f5f5f5; }
                    .container { background: white; padding: 30px; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
                    h1 { color: #1a2a6c; }
                    .status { color: #28a745; font-weight: bold; }
                    .endpoint { background: #f8f9fa; padding: 10px; margin: 10px 0; border-radius: 5px; }
                    a { color: #1a2a6c; text-decoration: none; }
                    a:hover { text-decoration: underline; }
                </style>
            </head>
            <body>
                <div class="container">
                    <h1>🚢 DJ Group Chartering Database</h1>
                    <p><span class="status">✅ Backend is running!</span></p>
                    <p>Server started at: ${new Date().toISOString()}</p>
                    <h3>Available Endpoints:</h3>
                    <div class="endpoint">
                        <strong>GET</strong> <a href="/api/test">/api/test</a> - Test API
                    </div>
                    <div class="endpoint">
                        <strong>GET</strong> <a href="/api/clients">/api/clients</a> - Get clients
                    </div>
                    <div class="endpoint">
                        <strong>GET</strong> <a href="/api/vessels">/api/vessels</a> - Get vessels
                    </div>
                    <div class="endpoint">
                        <strong>GET</strong> <a href="/health">/health</a> - Health check
                    </div>
                    <p style="margin-top: 20px; color: #666; font-size: 14px;">
                        Frontend will be served here when built successfully.
                    </p>
                </div>
            </body>
            </html>
        `);
    });
}

// Start server
app.listen(PORT, () => {
    console.log(`🚀 Server running on port: ${PORT}`);
    console.log(`🌐 URL: http://localhost:${PORT}`);
});
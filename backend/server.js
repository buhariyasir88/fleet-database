const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const sqlite3 = require('sqlite3').verbose();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// ===== DATABASE SETUP =====
// Create database folder if it doesn't exist
if (!fs.existsSync('./database')) {
    fs.mkdirSync('./database');
}

const db = new sqlite3.Database('./database/fleet.db');

// Create all tables
db.serialize(function() {
    // Users table
    db.run(`CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        username TEXT UNIQUE NOT NULL,
        password TEXT NOT NULL,
        role TEXT DEFAULT 'user'
    )`);

    // Clients table
    db.run(`CREATE TABLE IF NOT EXISTS clients (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        contact_person TEXT,
        email TEXT,
        phone TEXT,
        address TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )`);

    // Vessels table
    db.run(`CREATE TABLE IF NOT EXISTS vessels (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        type TEXT,
        flag TEXT,
        year INTEGER,
        grt INTEGER,
        dwt INTEGER,
        speed TEXT,
        total_seat INTEGER,
        spec_file TEXT,
        ga_file TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )`);

    // Contracts table
    db.run(`CREATE TABLE IF NOT EXISTS contracts (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        client_id INTEGER,
        vessel_id INTEGER,
        title TEXT,
        dcr TEXT,
        commencement_date DATE,
        completion_date DATE,
        duration TEXT,
        mob_demob TEXT,
        contract_value REAL,
        status TEXT DEFAULT 'active',
        remarks TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )`);

    // Tenders table
    db.run(`CREATE TABLE IF NOT EXISTS tenders (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        client_id INTEGER,
        title TEXT,
        dcr TEXT,
        start_date DATE,
        end_date DATE,
        duration TEXT,
        proposed_vessel TEXT,
        proposed_amount REAL,
        status TEXT DEFAULT 'submitted',
        chances TEXT,
        remarks TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )`);

    // Invoices table
    db.run(`CREATE TABLE IF NOT EXISTS invoices (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        contract_id INTEGER,
        vessel_name TEXT,
        charterer TEXT,
        dcr TEXT,
        duration REAL,
        submission_date DATE,
        total_amount REAL,
        expected_payment_date DATE,
        month TEXT,
        budgeted_sale REAL,
        actual_bill REAL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )`);

    // Vessel Utilization table
    db.run(`CREATE TABLE IF NOT EXISTS vessel_utilization (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        vessel_id INTEGER,
        month TEXT,
        year INTEGER,
        budget_days INTEGER,
        onhire_days INTEGER,
        variance_days INTEGER,
        variance_percent REAL,
        remarks TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )`);

    // Insert default admin user
    db.run(`INSERT OR IGNORE INTO users (username, password, role) VALUES ('admin', 'admin123', 'admin')`);
    db.run(`INSERT OR IGNORE INTO users (username, password, role) VALUES ('chartering', 'chartering123', 'user')`);

    console.log('✅ Database tables created successfully!');
});

// ===== AUTHENTICATION =====
app.post('/api/login', (req, res) => {
    const { username, password } = req.body;
    db.get('SELECT * FROM users WHERE username = ? AND password = ?', [username, password], function(err, user) {
        if (err) {
            return res.status(500).json({ error: err.message });
        }
        if (!user) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }
        res.json({ 
            success: true,
            user: { 
                id: user.id, 
                username: user.username, 
                role: user.role 
            } 
        });
    });
});

// ===== CLIENTS =====
app.get('/api/clients', (req, res) => {
    db.all('SELECT * FROM clients ORDER BY name', function(err, rows) {
        if (err) {
            res.status(500).json({ error: err.message });
        } else {
            res.json(rows);
        }
    });
});

app.post('/api/clients', (req, res) => {
    const { name, contact_person, email, phone, address } = req.body;
    db.run(
        'INSERT INTO clients (name, contact_person, email, phone, address) VALUES (?, ?, ?, ?, ?)',
        [name, contact_person, email, phone, address],
        function(err) {
            if (err) {
                res.status(500).json({ error: err.message });
            } else {
                res.json({ id: this.lastID });
            }
        }
    );
});

app.put('/api/clients/:id', (req, res) => {
    const { name, contact_person, email, phone, address } = req.body;
    db.run(
        'UPDATE clients SET name=?, contact_person=?, email=?, phone=?, address=? WHERE id=?',
        [name, contact_person, email, phone, address, req.params.id],
        function(err) {
            if (err) {
                res.status(500).json({ error: err.message });
            } else {
                res.json({ updated: this.changes });
            }
        }
    );
});

app.delete('/api/clients/:id', (req, res) => {
    db.run('DELETE FROM clients WHERE id=?', [req.params.id], function(err) {
        if (err) {
            res.status(500).json({ error: err.message });
        } else {
            res.json({ deleted: this.changes });
        }
    });
});

// ===== VESSELS =====
app.get('/api/vessels', (req, res) => {
    db.all('SELECT * FROM vessels ORDER BY name', function(err, rows) {
        if (err) {
            res.status(500).json({ error: err.message });
        } else {
            res.json(rows);
        }
    });
});

app.post('/api/vessels', (req, res) => {
    const { name, type, flag, year, grt, dwt, speed, total_seat } = req.body;
    db.run(
        'INSERT INTO vessels (name, type, flag, year, grt, dwt, speed, total_seat) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
        [name, type, flag, year, grt, dwt, speed, total_seat],
        function(err) {
            if (err) {
                res.status(500).json({ error: err.message });
            } else {
                res.json({ id: this.lastID });
            }
        }
    );
});

app.put('/api/vessels/:id', (req, res) => {
    const { name, type, flag, year, grt, dwt, speed, total_seat } = req.body;
    db.run(
        'UPDATE vessels SET name=?, type=?, flag=?, year=?, grt=?, dwt=?, speed=?, total_seat=? WHERE id=?',
        [name, type, flag, year, grt, dwt, speed, total_seat, req.params.id],
        function(err) {
            if (err) {
                res.status(500).json({ error: err.message });
            } else {
                res.json({ updated: this.changes });
            }
        }
    );
});

app.delete('/api/vessels/:id', (req, res) => {
    db.run('DELETE FROM vessels WHERE id=?', [req.params.id], function(err) {
        if (err) {
            res.status(500).json({ error: err.message });
        } else {
            res.json({ deleted: this.changes });
        }
    });
});

// ===== CONTRACTS =====
app.get('/api/contracts', (req, res) => {
    db.all(`
        SELECT c.*, cl.name as client_name, v.name as vessel_name 
        FROM contracts c
        LEFT JOIN clients cl ON c.client_id = cl.id
        LEFT JOIN vessels v ON c.vessel_id = v.id
        ORDER BY c.created_at DESC
    `, function(err, rows) {
        if (err) {
            res.status(500).json({ error: err.message });
        } else {
            res.json(rows);
        }
    });
});

app.post('/api/contracts', (req, res) => {
    const { client_id, vessel_id, title, dcr, commencement_date, completion_date, duration, mob_demob, contract_value, status, remarks } = req.body;
    db.run(
        `INSERT INTO contracts (client_id, vessel_id, title, dcr, commencement_date, completion_date, duration, mob_demob, contract_value, status, remarks) 
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [client_id, vessel_id, title, dcr, commencement_date, completion_date, duration, mob_demob, contract_value, status, remarks],
        function(err) {
            if (err) {
                res.status(500).json({ error: err.message });
            } else {
                res.json({ id: this.lastID });
            }
        }
    );
});

// ===== TENDERS =====
app.get('/api/tenders', (req, res) => {
    db.all(`
        SELECT t.*, cl.name as client_name 
        FROM tenders t
        LEFT JOIN clients cl ON t.client_id = cl.id
        ORDER BY t.created_at DESC
    `, function(err, rows) {
        if (err) {
            res.status(500).json({ error: err.message });
        } else {
            res.json(rows);
        }
    });
});

app.post('/api/tenders', (req, res) => {
    const { client_id, title, dcr, start_date, duration, proposed_vessel, proposed_amount, status, chances, remarks } = req.body;
    db.run(
        `INSERT INTO tenders (client_id, title, dcr, start_date, duration, proposed_vessel, proposed_amount, status, chances, remarks) 
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [client_id, title, dcr, start_date, duration, proposed_vessel, proposed_amount, status, chances, remarks],
        function(err) {
            if (err) {
                res.status(500).json({ error: err.message });
            } else {
                res.json({ id: this.lastID });
            }
        }
    );
});

// ===== INVOICES =====
app.get('/api/invoices', (req, res) => {
    db.all('SELECT * FROM invoices ORDER BY created_at DESC', function(err, rows) {
        if (err) {
            res.status(500).json({ error: err.message });
        } else {
            res.json(rows);
        }
    });
});

app.post('/api/invoices', (req, res) => {
    const { contract_id, vessel_name, charterer, dcr, duration, submission_date, total_amount, expected_payment_date, month, budgeted_sale, actual_bill } = req.body;
    db.run(
        `INSERT INTO invoices (contract_id, vessel_name, charterer, dcr, duration, submission_date, total_amount, expected_payment_date, month, budgeted_sale, actual_bill) 
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [contract_id, vessel_name, charterer, dcr, duration, submission_date, total_amount, expected_payment_date, month, budgeted_sale, actual_bill],
        function(err) {
            if (err) {
                res.status(500).json({ error: err.message });
            } else {
                res.json({ id: this.lastID });
            }
        }
    );
});

// ===== VESSEL UTILIZATION =====
app.get('/api/utilization', (req, res) => {
    db.all('SELECT * FROM vessel_utilization ORDER BY year DESC, month DESC', function(err, rows) {
        if (err) {
            res.status(500).json({ error: err.message });
        } else {
            res.json(rows);
        }
    });
});

app.post('/api/utilization', (req, res) => {
    const { vessel_id, month, year, budget_days, onhire_days, variance_days, variance_percent, remarks } = req.body;
    db.run(
        `INSERT INTO vessel_utilization (vessel_id, month, year, budget_days, onhire_days, variance_days, variance_percent, remarks) 
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [vessel_id, month, year, budget_days, onhire_days, variance_days, variance_percent, remarks],
        function(err) {
            if (err) {
                res.status(500).json({ error: err.message });
            } else {
                res.json({ id: this.lastID });
            }
        }
    );
});

// ===== DASHBOARD =====
app.get('/api/dashboard', (req, res) => {
    const data = {};

    db.get('SELECT COUNT(*) as total FROM clients', function(err, row) {
        data.clients = row ? row.total : 0;
    });

    db.get('SELECT COUNT(*) as total FROM vessels', function(err, row) {
        data.vessels = row ? row.total : 0;
    });

    db.get('SELECT COUNT(*) as total FROM contracts WHERE status = "active"', function(err, row) {
        data.activeContracts = row ? row.total : 0;
    });

    db.get('SELECT COUNT(*) as total FROM contracts WHERE status = "completed"', function(err, row) {
        data.completedContracts = row ? row.total : 0;
    });

    setTimeout(function() {
        res.json(data);
    }, 500);
});

// ===== SERVE FRONTEND =====
// Serve static files from the React app
const frontendBuildPath = path.join(__dirname, '../frontend/build');

// Check if frontend build exists
if (fs.existsSync(frontendBuildPath)) {
    console.log('✅ Serving frontend from:', frontendBuildPath);
    app.use(express.static(frontendBuildPath));
    
    // The "catchall" handler: for any request that doesn't match an API route
    app.get('*', (req, res) => {
        res.sendFile(path.join(frontendBuildPath, 'index.html'));
    });
} else {
    console.log('⚠️ Frontend build not found at:', frontendBuildPath);
    console.log('Please run: cd frontend && npm run build');
    
    // Send a simple message if frontend is not built
    app.get('/', (req, res) => {
        res.send(`
            <h1>🚢 DJ Group Chartering Database</h1>
            <p>Frontend not found. Please check your deployment.</p>
            <p>API is working! <a href="/api/clients">Test API</a></p>
        `);
    });
}

// Start server
app.listen(PORT, function() {
    console.log('🚀 Server running on port:', PORT);
    console.log('📊 Database initialized successfully!');
});
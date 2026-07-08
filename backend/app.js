// Force SQLite to use the correct binding
process.env.SQLITE3_USE_SQLITE_JS = '1';
const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const cors = require('cors');
const fs = require('fs');
const multer = require('multer');
const path = require('path');

console.log('✅ Starting DJ Group Chartering Database...');

const app = express();
const PORT = 3000;

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ===== CREATE UPLOADS FOLDER =====
const uploadDir = path.join(__dirname, '../uploads');
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
}

// ===== SERVE UPLOADS =====
app.use('/uploads', express.static(uploadDir));

// ===== MULTER SETUP =====
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, uploadDir);
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        const ext = path.extname(file.originalname);
        cb(null, 'vessel-' + req.params.id + '-' + uniqueSuffix + ext);
    }
});

const upload = multer({
    storage: storage,
    limits: { fileSize: 10 * 1024 * 1024 },
    fileFilter: (req, file, cb) => {
        const allowedTypes = ['.pdf', '.doc', '.docx', '.jpg', '.jpeg', '.png'];
        const ext = path.extname(file.originalname).toLowerCase();
        if (allowedTypes.includes(ext)) {
            cb(null, true);
        } else {
            cb(new Error('Invalid file type'));
        }
    }
});

// ===== DATABASE =====
const db = new sqlite3.Database('./database/dj_chartering.db');

db.serialize(function() {
    // Users
    db.run(`CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        username TEXT UNIQUE NOT NULL,
        password TEXT NOT NULL,
        role TEXT DEFAULT 'user'
    )`);

    // Clients
    db.run(`CREATE TABLE IF NOT EXISTS clients (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        contact_person TEXT,
        email TEXT,
        phone TEXT,
        address TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )`);

    // Vessels
    db.run(`CREATE TABLE IF NOT EXISTS vessels (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        imo TEXT,
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

    // Contracts
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

    // Tenders - FIXED with all columns
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
        proposed_rate TEXT,
        submission_date DATE,
        status TEXT DEFAULT 'submitted',
        chances TEXT,
        remarks TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (client_id) REFERENCES clients(id)
    )`);

    // Invoices
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

    // Insert default users
    db.run(`INSERT OR IGNORE INTO users (username, password, role) VALUES ('admin', 'admin123', 'admin')`);
    db.run(`INSERT OR IGNORE INTO users (username, password, role) VALUES ('chartering', 'chartering123', 'user')`);

    console.log('✅ Database created successfully!');
});

// ===== API ROUTES =====

// Login
app.post('/api/login', (req, res) => {
    const { username, password } = req.body;
    db.get('SELECT * FROM users WHERE username = ? AND password = ?', [username, password], function(err, user) {
        if (err) {
            console.error('Login error:', err);
            return res.status(500).json({ error: err.message });
        }
        if (!user) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }
        res.json({
            success: true,
            user: { id: user.id, username: user.username, role: user.role }
        });
    });
});

// ===== CLIENTS =====
app.get('/api/clients', (req, res) => {
    db.all('SELECT * FROM clients ORDER BY name', function(err, rows) {
        if (err) {
            console.error('Error fetching clients:', err);
            res.status(500).json({ error: err.message });
        } else {
            res.json(rows);
        }
    });
});

app.post('/api/clients', (req, res) => {
    const { name, contact_person, email, phone, address } = req.body;
    console.log('Adding client:', req.body);
    db.run(
        'INSERT INTO clients (name, contact_person, email, phone, address) VALUES (?, ?, ?, ?, ?)',
        [name, contact_person, email, phone, address],
        function(err) {
            if (err) {
                console.error('Error adding client:', err);
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
                console.error('Error updating client:', err);
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
            console.error('Error deleting client:', err);
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
            console.error('Error fetching vessels:', err);
            res.status(500).json({ error: err.message });
        } else {
            res.json(rows);
        }
    });
});

app.post('/api/vessels', (req, res) => {
    console.log('📦 Received vessel data:', req.body);
    
    const { name, imo, type, flag, year, grt, dwt, speed, total_seat } = req.body;
    
    if (!name || name.trim() === '') {
        return res.status(400).json({ error: 'Vessel name is required' });
    }
    
    db.run(
        `INSERT INTO vessels (name, imo, type, flag, year, grt, dwt, speed, total_seat) 
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
            name.trim(), 
            imo ? imo.trim() : '', 
            type ? type.trim() : '', 
            flag ? flag.trim() : '', 
            year || 0, 
            grt || 0, 
            dwt || 0, 
            speed ? speed.trim() : '', 
            total_seat || 0
        ],
        function(err) {
            if (err) {
                console.error('❌ Database error adding vessel:', err);
                res.status(500).json({ error: err.message });
            } else {
                console.log('✅ Vessel added successfully! ID:', this.lastID);
                res.json({ id: this.lastID, message: 'Vessel added successfully' });
            }
        }
    );
});

app.put('/api/vessels/:id', (req, res) => {
    const { name, imo, type, flag, year, grt, dwt, speed, total_seat } = req.body;
    db.run(
        'UPDATE vessels SET name=?, imo=?, type=?, flag=?, year=?, grt=?, dwt=?, speed=?, total_seat=? WHERE id=?',
        [name, imo, type, flag, year, grt, dwt, speed, total_seat, req.params.id],
        function(err) {
            if (err) {
                console.error('Error updating vessel:', err);
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
            console.error('Error deleting vessel:', err);
            res.status(500).json({ error: err.message });
        } else {
            res.json({ deleted: this.changes });
        }
    });
});

// ===== VESSEL FILE UPLOADS =====
app.post('/api/vessels/:id/upload-spec', upload.single('file'), (req, res) => {
    console.log('Uploading spec for vessel:', req.params.id);
    
    if (!req.file) {
        return res.status(400).json({ error: 'No file uploaded' });
    }

    const id = req.params.id;
    const filePath = req.file.filename;

    db.run('UPDATE vessels SET spec_file = ? WHERE id = ?', [filePath, id], function(err) {
        if (err) {
            console.error('DB Error:', err);
            res.status(500).json({ error: err.message });
        } else {
            console.log('Spec uploaded successfully:', filePath);
            res.json({ file: filePath, message: 'Spec uploaded successfully' });
        }
    });
});

app.post('/api/vessels/:id/upload-ga', upload.single('file'), (req, res) => {
    console.log('Uploading GA for vessel:', req.params.id);

    if (!req.file) {
        return res.status(400).json({ error: 'No file uploaded' });
    }

    const id = req.params.id;
    const filePath = req.file.filename;

    db.run('UPDATE vessels SET ga_file = ? WHERE id = ?', [filePath, id], function(err) {
        if (err) {
            console.error('DB Error:', err);
            res.status(500).json({ error: err.message });
        } else {
            console.log('GA uploaded successfully:', filePath);
            res.json({ file: filePath, message: 'GA uploaded successfully' });
        }
    });
});

// ===== CONTRACTS =====
app.get('/api/contracts', (req, res) => {
    db.all(`SELECT c.*, cl.name as client_name, v.name as vessel_name 
            FROM contracts c
            LEFT JOIN clients cl ON c.client_id = cl.id
            LEFT JOIN vessels v ON c.vessel_id = v.id
            ORDER BY c.created_at DESC`, function(err, rows) {
        if (err) {
            console.error('Error fetching contracts:', err);
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
                console.error('Error adding contract:', err);
                res.status(500).json({ error: err.message });
            } else {
                res.json({ id: this.lastID });
            }
        }
    );
});

app.put('/api/contracts/:id', (req, res) => {
    const { client_id, vessel_id, title, dcr, commencement_date, completion_date, duration, mob_demob, contract_value, status, remarks } = req.body;
    db.run(
        `UPDATE contracts SET client_id=?, vessel_id=?, title=?, dcr=?, commencement_date=?, completion_date=?, duration=?, mob_demob=?, contract_value=?, status=?, remarks=? WHERE id=?`,
        [client_id, vessel_id, title, dcr, commencement_date, completion_date, duration, mob_demob, contract_value, status, remarks, req.params.id],
        function(err) {
            if (err) {
                console.error('Error updating contract:', err);
                res.status(500).json({ error: err.message });
            } else {
                res.json({ updated: this.changes });
            }
        }
    );
});

app.delete('/api/contracts/:id', (req, res) => {
    db.run('DELETE FROM contracts WHERE id=?', [req.params.id], function(err) {
        if (err) {
            console.error('Error deleting contract:', err);
            res.status(500).json({ error: err.message });
        } else {
            res.json({ deleted: this.changes });
        }
    });
});

// ===== TENDERS =====
app.get('/api/tenders', (req, res) => {
    db.all(`SELECT t.*, cl.name as client_name 
            FROM tenders t
            LEFT JOIN clients cl ON t.client_id = cl.id
            ORDER BY t.created_at DESC`, function(err, rows) {
        if (err) {
            console.error('Error fetching tenders:', err);
            res.status(500).json({ error: err.message });
        } else {
            res.json(rows);
        }
    });
});

app.post('/api/tenders', (req, res) => {
    const { 
        client_id, title, dcr, start_date, end_date, duration, 
        proposed_vessel, proposed_amount, proposed_rate, 
        submission_date, status, chances, remarks 
    } = req.body;
    
    console.log('📦 Received tender data:', req.body);
    
    const sql = `INSERT INTO tenders (
        client_id, title, dcr, start_date, end_date, duration, 
        proposed_vessel, proposed_amount, proposed_rate, 
        submission_date, status, chances, remarks
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`;
    
    const params = [
        client_id || null,
        title || '',
        dcr || '',
        start_date || '',
        end_date || '',
        duration || '',
        proposed_vessel || '',
        proposed_amount || 0,
        proposed_rate || '',
        submission_date || '',
        status || 'submitted',
        chances || '',
        remarks || ''
    ];
    
    db.run(sql, params, function(err) {
        if (err) {
            console.error('❌ Error adding tender:', err);
            res.status(500).json({ error: err.message });
        } else {
            console.log('✅ Tender added! ID:', this.lastID);
            res.json({ id: this.lastID, message: 'Tender added successfully' });
        }
    });
});

app.put('/api/tenders/:id', (req, res) => {
    const { 
        client_id, title, dcr, start_date, end_date, duration, 
        proposed_vessel, proposed_amount, proposed_rate, 
        submission_date, status, chances, remarks 
    } = req.body;
    
    console.log('📦 Updating tender:', req.params.id, req.body);
    
    const sql = `UPDATE tenders SET 
        client_id = ?, title = ?, dcr = ?, start_date = ?, end_date = ?, duration = ?, 
        proposed_vessel = ?, proposed_amount = ?, proposed_rate = ?, 
        submission_date = ?, status = ?, chances = ?, remarks = ? 
    WHERE id = ?`;
    
    const params = [
        client_id || null,
        title || '',
        dcr || '',
        start_date || '',
        end_date || '',
        duration || '',
        proposed_vessel || '',
        proposed_amount || 0,
        proposed_rate || '',
        submission_date || '',
        status || 'submitted',
        chances || '',
        remarks || '',
        req.params.id
    ];
    
    db.run(sql, params, function(err) {
        if (err) {
            console.error('❌ Error updating tender:', err);
            res.status(500).json({ error: err.message });
        } else {
            console.log('✅ Tender updated!');
            res.json({ updated: this.changes, message: 'Tender updated successfully' });
        }
    });
});

app.delete('/api/tenders/:id', (req, res) => {
    db.run('DELETE FROM tenders WHERE id=?', [req.params.id], function(err) {
        if (err) {
            console.error('Error deleting tender:', err);
            res.status(500).json({ error: err.message });
        } else {
            res.json({ deleted: this.changes });
        }
    });
});

// ===== INVOICES =====
app.get('/api/invoices', (req, res) => {
    db.all('SELECT * FROM invoices ORDER BY created_at DESC', function(err, rows) {
        if (err) {
            console.error('Error fetching invoices:', err);
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
                console.error('Error adding invoice:', err);
                res.status(500).json({ error: err.message });
            } else {
                res.json({ id: this.lastID });
            }
        }
    );
});

app.put('/api/invoices/:id', (req, res) => {
    const { contract_id, vessel_name, charterer, dcr, duration, submission_date, total_amount, expected_payment_date, month, budgeted_sale, actual_bill } = req.body;
    db.run(
        `UPDATE invoices SET contract_id=?, vessel_name=?, charterer=?, dcr=?, duration=?, submission_date=?, total_amount=?, expected_payment_date=?, month=?, budgeted_sale=?, actual_bill=? WHERE id=?`,
        [contract_id, vessel_name, charterer, dcr, duration, submission_date, total_amount, expected_payment_date, month, budgeted_sale, actual_bill, req.params.id],
        function(err) {
            if (err) {
                console.error('Error updating invoice:', err);
                res.status(500).json({ error: err.message });
            } else {
                res.json({ updated: this.changes });
            }
        }
    );
});

app.delete('/api/invoices/:id', (req, res) => {
    db.run('DELETE FROM invoices WHERE id=?', [req.params.id], function(err) {
        if (err) {
            console.error('Error deleting invoice:', err);
            res.status(500).json({ error: err.message });
        } else {
            res.json({ deleted: this.changes });
        }
    });
});

// ===== DASHBOARD =====
app.get('/api/dashboard', (req, res) => {
    const data = {};
    let count = 0;

    db.get('SELECT COUNT(*) as total FROM clients', function(err, row) {
        data.clients = row ? row.total : 0;
        count++;
        if (count === 4) res.json(data);
    });

    db.get('SELECT COUNT(*) as total FROM vessels', function(err, row) {
        data.vessels = row ? row.total : 0;
        count++;
        if (count === 4) res.json(data);
    });

    db.get('SELECT COUNT(*) as total FROM contracts WHERE status = "active"', function(err, row) {
        data.activeContracts = row ? row.total : 0;
        count++;
        if (count === 4) res.json(data);
    });

    db.get('SELECT COUNT(*) as total FROM contracts WHERE status = "completed"', function(err, row) {
        data.completedContracts = row ? row.total : 0;
        count++;
        if (count === 4) res.json(data);
    });
});

// ===== START SERVER =====
app.listen(PORT, function() {
    console.log('');
    console.log('========================================');
    console.log('  🚀 DJ GROUP CHARTERING DATABASE');
    console.log('========================================');
    console.log('  Server: http://localhost:' + PORT);
    console.log('  Database: dj_chartering.db');
    console.log('  Login: admin / admin123');
    console.log('========================================');
    console.log('');
});
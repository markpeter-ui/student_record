const express = require('express');
const mysql = require('mysql2');
const cors = require('cors');
const bodyParser = require('body-parser');

const app = express();
const PORT = 3000;

app.use(cors());
app.use(bodyParser.json());
app.use(express.static('public'));

// ===== MYSQL (XAMPP) =====
const db = mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: '',
    database: 'my_student_records_db',        // ✅ ITO
    port: 3306
});

db.connect((err) => {
    if (err) {
        console.error('❌ MySQL connection failed:', err.message);
        return;
    }
    console.log('✅ Connected to XAMPP MySQL — Database: my_student_records_db');
});

// ===== CREATE =====
app.post('/api/students', (req, res) => {
    const { student_id, name, program } = req.body;

    if (!student_id || !name || !program) {
        return res.status(400).json({ error: 'All fields are required.' });
    }

    db.query(
        `INSERT INTO students (student_id, name, program, is_archived) VALUES (?, ?, ?, 0)`,
        [student_id, name, program],
        (err, result) => {
            if (err) return res.status(500).json({ error: err.message });
            res.json({ message: 'Created', id: result.insertId });
        }
    );
});

// ===== READ ALL =====
app.get('/api/students', (req, res) => {
    db.query(
        `SELECT id, student_id, name, program, is_archived FROM students ORDER BY is_archived ASC, id DESC`,
        (err, rows) => {
            if (err) return res.status(500).json({ error: err.message });
            res.json(rows);
        }
    );
});

// ===== UPDATE =====
app.put('/api/students/:id', (req, res) => {
    const { student_id, name, program } = req.body;
    const { id } = req.params;

    if (!student_id || !name || !program) {
        return res.status(400).json({ error: 'All fields are required.' });
    }

    db.query(
        `UPDATE students SET student_id=?, name=?, program=? WHERE id=? AND is_archived=0`,
        [student_id, name, program, id],
        (err) => {
            if (err) return res.status(500).json({ error: err.message });
            res.json({ message: 'Updated' });
        }
    );
});

// ===== ARCHIVE =====
app.put('/api/students/archive/:id', (req, res) => {
    const { id } = req.params;
    db.query(
        `UPDATE students SET is_archived=1 WHERE id=? AND is_archived=0`,
        [id],
        (err, result) => {
            if (err) return res.status(500).json({ error: err.message });
            if (result.affectedRows === 0)
                return res.status(404).json({ error: 'Not found or already archived.' });
            res.json({ message: 'Archived' });
        }
    );
});

// ===== RESTORE =====
app.put('/api/students/restore/:id', (req, res) => {
    const { id } = req.params;
    db.query(
        `UPDATE students SET is_archived=0 WHERE id=?`,
        [id],
        (err) => {
            if (err) return res.status(500).json({ error: err.message });
            res.json({ message: 'Restored' });
        }
    );
});

// ===== SERVER =====
app.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 Server running: http://localhost:${PORT}`);
    console.log(`🌐 LAN access: http://<YOUR-LOCAL-IP>:${PORT}`);
});
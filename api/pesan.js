const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json());

// SQLite di serverless cloud bersifat sementara (Ephemeral)
const db = new sqlite3.Database(':memory:'); // Menggunakan database memori sementara untuk uji coba cloud

db.serialize(() => {
    db.run(`
        CREATE TABLE IF NOT EXISTS pesan (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            nama TEXT NOT NULL,
            email TEXT,
            pesan TEXT NOT NULL,
            waktu DATETIME DEFAULT CURRENT_TIMESTAMP
        )
    `);
});

// Endpoint GET
app.get('/api/pesan', (req, res) => {
    const query = `SELECT * FROM pesan ORDER BY id DESC`;
    db.all(query, [], (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ total: rows.length, data: rows });
    });
});

// Endpoint POST
app.post('/api/pesan', (req, res) => {
    const { nama, email, pesan } = req.body;
    if (!nama || !pesan) {
        return res.status(400).json({ status: "error", pesan: "Nama dan pesan wajib diisi!" });
    }

    const query = `INSERT INTO pesan (nama, email, pesan) VALUES (?, ?, ?)`;
    db.run(query, [nama, email || "Tidak ada email", pesan], function (err) {
        if (err) return res.status(500).json({ error: err.message });
        res.status(201).json({
            status: "sukses",
            pesan: "Pesan berhasil dikirim!",
            data: { id: this.lastID, nama, email, pesan }
        });
    });
});

module.exports = app;
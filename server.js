const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());

// Database SQLite
const db = new sqlite3.Database('./database.sqlite', (err) => {
    if (err) {
        console.error('Gagal menghubungkan database:', err.message);
    } else {
        console.log('Terhubung ke database SQLite lokal.');
    }
});

// Buat Tabel Pesan
db.run(`
    CREATE TABLE IF NOT EXISTS pesan (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        nama TEXT NOT NULL,
        email TEXT,
        pesan TEXT NOT NULL,
        waktu DATETIME DEFAULT CURRENT_TIMESTAMP
    )
`);

// Endpoint GET: Ambil pesan
app.get('/api/pesan', (req, res) => {
    const query = `SELECT * FROM pesan ORDER BY id DESC`;
    db.all(query, [], (err, rows) => {
        if (err) {
            return res.status(500).json({ status: "error", error: err.message });
        }
        res.json({
            total: rows.length,
            data: rows
        });
    });
});

// Endpoint POST: Simpan pesan baru
app.post('/api/pesan', (req, res) => {
    const { nama, email, pesan } = req.body;

    if (!nama || !pesan) {
        return res.status(400).json({
            status: "error",
            pesan: "Nama dan pesan wajib diisi!"
        });
    }

    const query = `INSERT INTO pesan (nama, email, pesan) VALUES (?, ?, ?)`;
    const params = [nama, email || "Tidak ada email", pesan];

    db.run(query, params, function (err) {
        if (err) {
            return res.status(500).json({ status: "error", error: err.message });
        }
        res.status(201).json({
            status: "sukses",
            pesan: "Data berhasil disimpan permanen ke database!",
            data: { id: this.lastID, nama, email, pesan }
        });
    });
});

// Jalankan Server
app.listen(PORT, () => {
    console.log(`Server berjalan di: http://localhost:${PORT}`);
});
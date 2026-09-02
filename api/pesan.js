const { createClient } = require('@libsql/client/web');

module.exports = async (req, res) => {
    // Header CORS
    res.setHeader('Access-Control-Allow-Credentials', 'true');
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,POST');
    res.setHeader(
        'Access-Control-Allow-Headers',
        'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
    );

    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    try {
        let url = process.env.TURSO_DATABASE_URL || '';
        const authToken = process.env.TURSO_AUTH_TOKEN;

        if (!url || !authToken) {
            return res.status(500).json({
                status: 'error',
                pesan: 'TURSO_DATABASE_URL atau TURSO_AUTH_TOKEN belum terpasang di Vercel Settings!'
            });
        }

        // Ubah format libsql:// menjadi https:// jika diperlukan oleh web client
        if (url.startsWith('libsql://')) {
            url = url.replace('libsql://', 'https://');
        }

        const db = createClient({ url, authToken });

        // GET: Ambil daftar pesan
        if (req.method === 'GET') {
            const hasil = await db.execute('SELECT * FROM pesan ORDER BY id DESC');
            return res.status(200).json({
                total: hasil.rows.length,
                data: hasil.rows
            });
        }

        // POST: Simpan pesan baru
        if (req.method === 'POST') {
            let body = req.body;
            if (typeof body === 'string') {
                try {
                    body = JSON.parse(body);
                } catch {
                    body = {};
                }
            }
            body = body || {};

            const { nama, email, pesan } = body;

            if (!nama || !pesan) {
                return res.status(400).json({
                    status: 'error',
                    pesan: 'Nama dan pesan wajib diisi!'
                });
            }

            const insertResult = await db.execute({
                sql: 'INSERT INTO pesan (nama, email, pesan) VALUES (?, ?, ?)',
                args: [nama, email || 'Tidak ada email', pesan]
            });

            return res.status(201).json({
                status: 'sukses',
                pesan: 'Pesan berhasil disimpan ke Turso!',
                data: {
                    id: Number(insertResult.lastInsertRowid),
                    nama,
                    email: email || 'Tidak ada email',
                    pesan,
                    waktu: new Date().toISOString()
                }
            });
        }

        return res.status(405).json({ status: 'error', pesan: 'Metode tidak didukung.' });
    } catch (err) {
        return res.status(500).json({
            status: 'error',
            pesan: err.message
        });
    }
};
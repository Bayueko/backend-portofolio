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

    let dbUrl = process.env.TURSO_DATABASE_URL || '';
    const authToken = process.env.TURSO_AUTH_TOKEN;

    if (!dbUrl || !authToken) {
        return res.status(500).json({
            status: 'error',
            pesan: 'TURSO_DATABASE_URL atau TURSO_AUTH_TOKEN belum terpasang di Vercel.'
        });
    }

    // Normalisasi URL ke format HTTPS untuk REST API Turso
    dbUrl = dbUrl.replace('libsql://', 'https://');
    if (dbUrl.endsWith('/')) {
        dbUrl = dbUrl.slice(0, -1);
    }
    const endpointTurso = `${dbUrl}/v2/pipeline`;

    // Helper fungsi untuk mengeksekusi query SQL via REST API Turso
    async function executeQuery(sql, args = []) {
        const response = await fetch(endpointTurso, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${authToken}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                requests: [
                    {
                        type: 'execute',
                        stmt: {
                            sql: sql,
                            args: args.map(arg => {
                                if (typeof arg === 'number') return { type: 'integer', value: String(arg) };
                                return { type: 'text', value: String(arg) };
                            })
                        }
                    },
                    { type: 'close' }
                ]
            })
        });

        if (!response.ok) {
            const errText = await response.text();
            throw new Error(`Turso Error (${response.status}): ${errText}`);
        }

        const data = await response.json();
        const execResult = data.results[0];
        
        if (execResult.type === 'error') {
            throw new Error(execResult.error.message);
        }

        // Parsing baris hasil query SELECT
        const cols = execResult.response.result.cols.map(c => c.name);
        const rows = execResult.response.result.rows.map(row => {
            const obj = {};
            row.forEach((val, idx) => {
                obj[cols[idx]] = val.value;
            });
            return obj;
        });

        return { rows };
    }

    try {
        // GET: Ambil daftar pesan
        if (req.method === 'GET') {
            const hasil = await executeQuery('SELECT * FROM pesan ORDER BY id DESC');
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

            await executeQuery(
                'INSERT INTO pesan (nama, email, pesan) VALUES (?, ?, ?)',
                [nama, email || 'Tidak ada email', pesan]
            );

            return res.status(201).json({
                status: 'sukses',
                pesan: 'Pesan berhasil disimpan ke Turso!',
                data: {
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
// Simpanan data sederhana di level runtime instance
let daftarPesan = [];

module.exports = async (req, res) => {
    // Header CORS lengkap
    res.setHeader('Access-Control-Allow-Credentials', 'true');
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,POST');
    res.setHeader(
        'Access-Control-Allow-Headers',
        'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
    );

    // Tangani preflight OPTIONS dari browser
    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    try {
        // Endpoint GET: Menampilkan pesan
        if (req.method === 'GET') {
            return res.status(200).json({
                total: daftarPesan.length,
                data: daftarPesan
            });
        }

        // Endpoint POST: Menerima pesan baru
        if (req.method === 'POST') {
            // Parsing body secara aman (jika format berupa JSON string)
            let body = req.body;
            if (typeof body === 'string') {
                try {
                    body = JSON.parse(body);
                } catch (e) {
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

            const dataBaru = {
                id: daftarPesan.length + 1,
                nama: String(nama),
                email: email ? String(email) : 'Tidak ada email',
                pesan: String(pesan),
                waktu: new Date().toISOString()
            };

            daftarPesan.unshift(dataBaru);

            return res.status(201).json({
                status: 'sukses',
                pesan: 'Pesan berhasil disimpan!',
                data: dataBaru
            });
        }

        return res.status(405).json({ status: 'error', pesan: 'Metode HTTP tidak diizinkan' });

    } catch (err) {
        return res.status(500).json({
            status: 'error',
            pesan: err.message || 'Terjadi kesalahan internal server'
        });
    }
};
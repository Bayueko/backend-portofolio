// Database memori sederhana untuk serverless function
let daftarPesan = [];

export default function handler(req, res) {
    // Header CORS agar Netlify diizinkan mengakses
    res.setHeader('Access-Control-Allow-Credentials', true);
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
    res.setHeader(
        'Access-Control-Allow-Headers',
        'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
    );

    // Tangani pre-flight request dari browser
    if (req.method === 'OPTIONS') {
        res.status(200).end();
        return;
    }

    // Endpoint GET: Ambil daftar pesan
    if (req.method === 'GET') {
        return res.status(200).json({
            total: daftarPesan.length,
            data: daftarPesan
        });
    }

    // Endpoint POST: Simpan pesan baru
    if (req.method === 'POST') {
        const { nama, email, pesan } = req.body || {};

        if (!nama || !pesan) {
            return res.status(400).json({ status: 'error', pesan: 'Nama dan pesan wajib diisi!' });
        }

        const dataBaru = {
            id: daftarPesan.length + 1,
            nama,
            email: email || 'Tidak ada email',
            pesan,
            waktu: new Date().toISOString()
        };

        daftarPesan.unshift(dataBaru);

        return res.status(201).json({
            status: 'sukses',
            pesan: 'Pesan berhasil dikirim!',
            data: dataBaru
        });
    }

    return res.status(405).json({ status: 'error', pesan: 'Metode tidak didukung' });
}
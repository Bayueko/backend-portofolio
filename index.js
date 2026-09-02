module.exports = (req, res) => {
    res.status(200).json({
        status: "online",
        pesan: "Backend API siap digunakan. Akses endpoint di /api/pesan"
    });
};
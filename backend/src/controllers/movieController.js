const Movie = require('../models/movieModel');

// 1. เพิ่มหนังใหม่ (Admin)
exports.createMovie = async (req, res) => {
    try {
        const newMovie = await Movie.create(req.body);
        res.status(201).json({ success: true, data: newMovie });
    } catch (error) {
        res.status(400).json({ success: false, message: error.message });
    }
};

// 2. ดึงหนังทั้งหมด (อาจจะใช้หน้า Admin)
exports.getAllMovies = async (req, res) => {
    try {
        const movies = await Movie.find().sort({ createdAt: -1 });
        res.status(200).json({ success: true, data: movies });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// 3. ดึงหนังที่ "กำลังฉาย" (Now Showing) - สำคัญสำหรับหน้า Home
exports.getNowShowingMovies = async (req, res) => {
    try {
        const today = new Date();
        const movies = await Movie.find({
            start_date: { $lte: today }, // เริ่มฉายแล้ว (น้อยกว่าหรือเท่ากับวันนี้)
            due_date: { $gte: today }    // ยังไม่ถอดโปรแกรม (มากกว่าหรือเท่ากับวันนี้)
        });
        res.status(200).json({ success: true, data: movies });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// 4. ดูรายละเอียดหนัง 1 เรื่อง
exports.getMovieById = async (req, res) => {
    try {
        const movie = await Movie.findById(req.params.id);
        if (!movie) return res.status(404).json({ message: "ไม่พบหนังเรื่องนี้" });
        res.status(200).json({ success: true, data: movie });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};
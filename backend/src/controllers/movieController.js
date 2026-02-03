const Movie = require('../models/movieModel');
const saveLog = require('../utils/logger'); // ✅ นำเข้า logger มาใช้งาน

// 1. เพิ่มหนังใหม่ (Admin)
exports.createMovie = async (req, res) => {
    try {
        const newMovie = await Movie.create(req.body);

        // ✅ บันทึก Log เมื่อมีการเพิ่มหนังใหม่
        await saveLog({
            req,
            action: 'create',
            table: 'Movie',
            targetId: newMovie._id,
            newVal: { 
                title: newMovie.title_th, 
                genre: newMovie.genre,
                start_date: newMovie.start_date
            },
            note: `เพิ่มภาพยนตร์ใหม่เรื่อง: ${newMovie.title_th}`
        });

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
            start_date: { $lte: today }, // เริ่มฉายแล้ว
            due_date: { $gte: today }    // ยังไม่ถอดโปรแกรม
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
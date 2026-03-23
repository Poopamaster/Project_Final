const Movie = require('../models/movieModel');
const systemLog = require('../utils/logger'); // ✅ 1. นำเข้า Logger

// 1. เพิ่มหนังใหม่ (Admin)
exports.createMovie = async (req, res) => {
    try {
        const newMovie = await Movie.create(req.body);

        // 📝 2. บันทึก Log: การสร้างภาพยนตร์ใหม่
        systemLog({
            level: 'INFO',
            actor: req.user, // Admin คนที่กดสร้าง
            context: { 
                action: 'create', 
                table: 'movies', 
                target_id: newMovie._id 
            },
            // ใช้ fallback เผื่อว่าไม่ได้ใส่ชื่อภาษาไทยมา
            note: `เพิ่มภาพยนตร์ใหม่: "${newMovie.title_th || newMovie.title_en}"`,
            content: { 
                genre: newMovie.genre, 
                duration_min: newMovie.duration_min,
                start_date: newMovie.start_date 
            },
            req: req
        }).catch(err => console.error("Movie Create Log Error:", err)); // 👈 ใส่ catch กันระบบล่ม

        res.status(201).json({ success: true, data: newMovie });
    } catch (error) {
        // 📝 3. บันทึก Log: กรณีเกิด Error (เช่น ใส่ข้อมูลมาไม่ครบ หรือผิด Type)
        systemLog({
            level: 'ERROR',
            actor: req.user,
            context: { action: 'create', table: 'movies' },
            note: `เพิ่มภาพยนตร์ไม่สำเร็จ: ${error.message}`,
            req: req
        }).catch(() => {});

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

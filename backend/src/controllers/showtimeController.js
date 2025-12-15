const Showtime = require('../models/showtimeModel');
const Movie = require('../models/movieModel');

// 1. สร้างรอบฉาย (Admin)
exports.createShowtime = async (req, res) => {
    try {
        const { movie_id, auditorium_id, start_time, base_price, language } = req.body;

        // --- Step A: คำนวณเวลาจบ (End Time) อัตโนมัติ ---
        // เราต้องไปดึงความยาวหนัง (duration_min) มาบวกกับ start_time
        const movie = await Movie.findById(movie_id);
        if (!movie) return res.status(404).json({ message: "Movie not found" });

        const start = new Date(start_time);
        // บวกเวลาหนัง + เผื่อเวลาทำความสะอาด 20 นาที (แล้วแต่ Business logic)
        const end = new Date(start.getTime() + (movie.duration_min + 20) * 60000); 

        // --- Step B: ตรวจสอบว่ารอบฉาย "ชนกัน" ในโรงเดียวกันหรือไม่ (Overlap Check) ---
        // Logic: ถ้าโรงเดียวกัน และ (เวลาใหม่เริ่มก่อนอันเก่าจบ) และ (เวลาใหม่จบหลังอันเก่าเริ่ม)
        const conflict = await Showtime.findOne({
            auditorium_id,
            $or: [
                { start_time: { $lt: end, $gte: start } }, // เริ่มทับช่วงคนอื่น
                { end_time: { $gt: start, $lte: end } },   // จบทับช่วงคนอื่น
                { start_time: { $lte: start }, end_time: { $gte: end } } // ครอบทับทั้งอัน
            ]
        });

        if (conflict) {
            return res.status(400).json({ message: "เวลานี้มีการใช้โรงฉายไปแล้ว (Time Overlap)" });
        }

        // --- Step C: บันทึก ---
        const newShowtime = await Showtime.create({
            movie_id,
            auditorium_id,
            start_time: start,
            end_time: end,
            language: language || "TH",
            base_price
        });

        res.status(201).json({ success: true, data: newShowtime });

    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// 2. ดึงรอบฉาย "ตามหนัง" (User กดหนังเรื่องไหน ก็เห็นรอบเรื่องนั้น)
// Frontend จะใช้: /api/showtimes/movie/:movieId
exports.getShowtimesByMovie = async (req, res) => {
    try {
        const { movieId } = req.params;
        
        // ดึงรอบฉายของหนังเรื่องนี้ ที่ยังไม่หมดเวลา (start_time > now)
        const showtimes = await Showtime.find({
            movie_id: movieId,
            start_time: { $gte: new Date() } 
        })
        .populate('auditorium_id', 'name') // ดึงชื่อโรงมาด้วย เช่น "Theater 1"
        .sort({ start_time: 1 }); // เรียงตามเวลา

        res.status(200).json({ success: true, data: showtimes });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// 3. ดึงข้อมูลรอบฉายเดี่ยวๆ (เอาไว้ตอน User กดเลือก time slot แล้วจะไปหน้าเลือกที่นั่ง)
exports.getShowtimeById = async (req, res) => {
    try {
        const showtime = await Showtime.findById(req.params.id)
            .populate('movie_id')      // เอาข้อมูลหนังมาโชว์หัวกระดาษ
            .populate('auditorium_id'); // เอาข้อมูลโรง
            
        if (!showtime) return res.status(404).json({ message: "Showtime not found" });

        res.status(200).json({ success: true, data: showtime });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

exports.getAllShowtimes = async (req, res) => {
    try {
        // ดึงข้อมูลรอบฉายทั้งหมด + ดึงข้อมูลหนัง + ดึงข้อมูลโรง + ดึงข้อมูลสาขา
        const showtimes = await Showtime.find()
            .populate('movie_id', 'title poster duration_min') // เอาชื่อหนัง, รูป, เวลา
            .populate({
                path: 'auditorium_id',
                select: 'name cinema_id', // เอาชื่อโรง
                populate: {
                    path: 'cinema_id',    // **Deep Populate** เข้าไปเอาชื่อสาขาด้วย
                    select: 'name'
                }
            })
            .sort({ start_time: -1 }); // เรียงจากเวลาล่าสุดมาเก่า

        res.status(200).json({ success: true, data: showtimes });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};
const Movie = require('../models/movieModel');
const Booking = require('../models/bookingModel'); 
const User = require('../models/userModel');       
const Feedback = require('../models/feedbackModel'); // เพิ่มตัวนี้สำหรับหน้า Report
const axios = require('axios');

// 1. ค้นหาหนังจาก TMDB
exports.searchTMDB = async (req, res) => {
    try {
        const { query } = req.query;
        if (!query) return res.status(400).json({ message: "กรุณาระบุชื่อหนัง" });

        const response = await axios.get(`${process.env.TMDB_BASE_URL}/search/movie`, {
            params: {
                api_key: process.env.TMDB_API_KEY,
                query: query,
                language: 'th-TH'
            }
        });

        const results = response.data.results.map(m => ({
            id: m.id,
            title_th: m.title,
            title_en: m.original_title,
            description: m.overview,
            poster_url: m.poster_path ? `https://image.tmdb.org/t/p/w500${m.poster_path}` : null,
            release_date: m.release_date,
            rating: m.vote_average
        }));

        res.json({ success: true, results });
    } catch (error) {
        res.status(500).json({ message: "Error contacting TMDB" });
    }
};

exports.addMovieFromTMDB = async (req, res) => {
    try {
        const { tmdbId } = req.body;
        if (!tmdbId) return res.status(400).json({ message: "ระบุ TMDB ID" });

        // 1. ดึงรายละเอียดหนังจาก TMDB (ต้องใช้ endpoint /movie/:id เพื่อเอา Runtime และ Genres)
        const response = await axios.get(`${process.env.TMDB_BASE_URL}/movie/${tmdbId}`, {
            params: {
                api_key: process.env.TMDB_API_KEY,
                language: 'th-TH'
            }
        });

        const data = response.data;

        // 2. แปลงข้อมูลให้เข้ากับ Schema ของเรา
        const newMovieData = {
            title_th: data.title,
            title_en: data.original_title,
            poster_url: data.poster_path ? `https://image.tmdb.org/t/p/w500${data.poster_path}` : null,
            genre: data.genres ? data.genres.map(g => g.name).join('/') : 'General',
            duration_min: data.runtime || 120, // ถ้าไม่มีเวลา ให้ default 120
            language: data.original_language === 'th' ? 'TH' : 'EN/TH',
            description: data.overview,
            // วันฉาย: default เป็นวันนี้, วันออกโรง: อีก 14 วัน (แก้ทีหลังได้)
            start_date: new Date(),
            due_date: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000) 
        };

        // 3. ตรวจสอบว่ามีหนังนี้ในระบบหรือยัง
        const existingMovie = await Movie.findOne({ title_en: newMovieData.title_en });
        if (existingMovie) {
            return res.status(400).json({ message: "หนังเรื่องนี้มีในระบบแล้ว" });
        }

        // 4. บันทึก
        const movie = await Movie.create(newMovieData);
        res.status(201).json({ success: true, message: "เพิ่มหนังจาก TMDB สำเร็จ", movie });

    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "เพิ่มหนังไม่สำเร็จ", error: error.message });
    }
};

// 2. เพิ่มหนังใหม่

exports.createMovie = async (req, res) => {
    try {
        const { title_th, title_en, genre, duration_min, start_date, due_date, language } = req.body;
        
        let poster_url = "";
        
        // ถ้ามีการอัปโหลดไฟล์มา (Multer จะเอาไฟล์ไปไว้ใน req.file)
        if (req.file) {
            poster_url = `/uploads/${req.file.filename}`;
        } else {
            poster_url = req.body.poster_url || "";
        }

        const newMovie = await Movie.create({
            title_th, 
            title_en, 
            poster_url, 
            genre, 
            duration_min: Number(duration_min), 
            start_date, 
            due_date, 
            language
        });
        
        res.status(201).json({ success: true, message: "เพิ่มหนังเรียบร้อย!", movie: newMovie });
    } catch (error) {
        // 🚨 เพิ่มบรรทัดนี้ เพื่อให้มันปริ้นท์ Error ออกมาที่หน้าจอดำๆ (Terminal)
        console.error("🔥🔥🔥 Create Movie Error:", error); 
        res.status(500).json({ message: "บันทึกไม่สำเร็จ", error: error.message });
    }
};

// 3. สถิติหน้า Dashboard
exports.getDashboardStats = async (req, res) => {
    try {
        const salesTotal = await Booking.aggregate([
            { $group: { _id: null, total: { $sum: "$totalPrice" } } }
        ]);
        const totalTickets = await Booking.countDocuments();
        const totalUsers = await User.countDocuments();

        res.status(200).json({
            success: true,
            data: {
                sales: salesTotal[0]?.total || 0,
                tickets: totalTickets,
                users: totalUsers
            }
        });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
};

// 4. ดึงหนังทั้งหมด
exports.getAllMovies = async (req, res) => {
    try {
        const movies = await Movie.find().sort({ start_date: -1 });
        res.status(200).json({ success: true, data: movies });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
};

// 5. ลบหนัง
exports.deleteMovie = async (req, res) => {
    try {
        await Movie.findByIdAndDelete(req.params.id);
        res.status(200).json({ success: true, message: "ลบหนังเรียบร้อย" });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
};

// ดึงรายชื่อ Admin ทั้งหมด
exports.getAllAdmins = async (req, res) => {
    try {
        const admins = await User.find({ role: 'admin' }).select('-password');
        res.status(200).json({ success: true, data: admins });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// เพิ่ม Admin ใหม่
exports.addAdmin = async (req, res) => {
    try {
        const { name, email, password } = req.body;
        const existingUser = await User.findOne({ email });
        if (existingUser) return res.status(400).json({ message: "อีเมลนี้ถูกใช้งานแล้ว" });

        const newAdmin = await User.create({
            name, email, password, role: 'admin'
        });
        res.status(201).json({ success: true, data: newAdmin });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// ลบ Admin
exports.deleteAdmin = async (req, res) => {
    try {
        await User.findByIdAndDelete(req.params.id);
        res.status(200).json({ success: true, message: "ลบผู้ดูแลสำเร็จ" });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

exports.getAllBookings = async (req, res) => {
    try {
        const bookings = await Booking.find()
            // 1. ดึง User: เอาทั้ง name และ email (Frontend น้องใช้ search email ด้วย)
            .populate('user_id', 'name email') 
            
            // 2. ดึงข้อมูลรอบฉาย และเจาะเข้าไปเอา "ข้อมูลหนัง" และ "โรงหนัง"
            .populate({
                path: 'showtime_id',
                populate: [
                    { path: 'movie_id', select: 'title_th title_en' }, // เจาะเอาชื่อหนัง
                    { path: 'auditorium_id' } // (ถ้ามี) เจาะเอาชื่อโรง/สาขา
                ]
            })

            // 3. ดึงข้อมูลที่นั่ง: เพื่อให้โชว์เลขที่นั่ง เช่น A1, B2 (ไม่ใช่โชว์ ID ยาวๆ)
            .populate({
                path: 'seats',
                populate: { path: 'seat_type_id' } // เจาะเอาประเภทที่นั่ง/ราคามาด้วย
            })
            
            .sort({ createdAt: -1 });

        res.status(200).json({ success: true, data: bookings });
    } catch (error) {
        console.error("Get All Bookings Error:", error);
        res.status(500).json({ success: false, error: error.message });
    }
};

// 7. ดึงข้อมูลลูกค้าทั้งหมด
exports.getAllUsers = async (req, res) => {
    try {
        const users = await User.find({ role: { $ne: 'admin' } })
            .select('-password')
            .sort({ points: -1 });

        res.status(200).json({ success: true, data: users });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
};

exports.getAllAdmins = async (req, res) => {
    try {
        const admins = await User.find({ role: 'admin' }).select('-password');
        res.status(200).json({ success: true, data: admins });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

exports.getReports = async (req, res) => {
    try {
        // ดึงรายงาน/Feedback จริงจาก DB
        const feedback = await Feedback.find()
            .populate('userId', 'name')
            .sort({ createdAt: -1 });

        // คำนวณสถิติประเภทที่นั่งเพื่อวาดกราฟ Real-time
        const bookings = await Booking.find();
        
        // แยกนับจำนวนตามประเภทที่นั่ง (ปรับชื่อประเภทให้ตรงกับข้อมูลใน DB ของคุณ)
        const seatStats = [
            { name: 'VIP', value: bookings.filter(b => b.seatType === 'VIP').length },
            { name: 'PREMIUM', value: bookings.filter(b => b.seatType === 'PREMIUM').length },
            { name: 'NORMAL', value: bookings.filter(b => b.seatType === 'NORMAL').length }
        ];

        res.status(200).json({ 
            success: true, 
            feedback,
            seatStats 
        });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
};

exports.promoteAdmin = async (req, res) => {
    try {
        const { email } = req.body;

        // 1. ค้นหา User จากอีเมล
        const user = await User.findOne({ email });
        if (!user) {
            return res.status(404).json({ success: false, message: "ไม่พบผู้ใช้งานอีเมลนี้ในระบบ" });
        }

        // 2. ตรวจสอบว่าเป็น Admin อยู่แล้วหรือยัง
        if (user.role === 'admin') {
            return res.status(400).json({ success: false, message: "ผู้ใช้นี้เป็นผู้ดูแลระบบอยู่แล้ว" });
        }

        // 3. อัปเดต Role เป็น admin
        user.role = 'admin';
        await user.save();

        res.status(200).json({ 
            success: true, 
            message: `แต่งตั้ง ${user.name} เป็นผู้ดูแลระบบเรียบร้อยแล้ว`,
            data: user 
        });

    } catch (error) {
        console.error("Promote Admin Error:", error);
        res.status(500).json({ success: false, message: "เกิดข้อผิดพลาดในการดำเนินการ" });
    }
};

exports.updateMovie = async (req, res) => {
    try {
        const { id } = req.params;
        // ค้นหาและอัปเดตข้อมูลตาม ID ที่ส่งมา
        const updatedMovie = await Movie.findByIdAndUpdate(id, req.body, { new: true });
        
        if (!updatedMovie) {
            return res.status(404).json({ success: false, message: "ไม่พบหนังเรื่องนี้" });
        }

        res.status(200).json({ success: true, data: updatedMovie });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};
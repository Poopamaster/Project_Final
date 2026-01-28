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

// 2. เพิ่มหนังใหม่
exports.createMovie = async (req, res) => {
    try {
        const { title_th, title_en, poster_url, genre, duration_min, start_date, due_date, language } = req.body;
        const newMovie = await Movie.create({
            title_th, title_en, poster_url, genre, duration_min, start_date, due_date, language
        });
        res.status(201).json({ success: true, message: "เพิ่มหนังเรียบร้อย!", movie: newMovie });
    } catch (error) {
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
            .populate('user_id', 'name') 
            .populate('showtime_id') 
            .sort({ createdAt: -1 });

        res.status(200).json({ success: true, data: bookings });
    } catch (error) {
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

exports.addAdmin = async (req, res) => {
    try {
        const { name, email, password } = req.body;
        // เช็คว่ามี email นี้หรือยัง
        const existingUser = await User.findOne({ email });
        if (existingUser) return res.status(400).json({ message: "อีเมลนี้ถูกใช้งานแล้ว" });

        const newAdmin = await User.create({
            name,
            email,
            password, // อย่าลืมใส่ Logic hash password ใน Model หรือที่นี่นะครับ
            role: 'admin'
        });

        res.status(201).json({ success: true, data: newAdmin });
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
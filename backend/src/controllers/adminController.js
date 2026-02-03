const Movie = require('../models/movieModel');
const Booking = require('../models/bookingModel'); 
const User = require('../models/userModel');       
const Feedback = require('../models/feedbackModel'); 
const axios = require('axios');

// --- 1. จัดการข้อมูลการจอง (Booking) ---

exports.getAllBookings = async (req, res) => {
    try {
        const bookings = await Booking.find()
            // ดึงชื่อและอีเมลลูกค้า
            .populate('user_id', 'name email') 
            // ดึงข้อมูลรอบฉายและชื่อหนัง
            .populate({
                path: 'showtime_id',
                populate: { path: 'movie_id', select: 'title_th' }
            })
            // ✅ แก้ไข: ดึงฟิลด์ 'row' และ 'seat_number' มาพร้อมกันเพื่อให้ Frontend ต่อสตริงได้
            .populate('seats', 'row_label seat_number') 
            .sort({ createdAt: -1 });

        res.status(200).json({ success: true, data: bookings });
    } catch (error) {
        console.error("Get All Bookings Error:", error);
        res.status(500).json({ success: false, error: error.message });
    }
};

// --- 2. จัดการภาพยนตร์ (Movies) & TMDB API ---

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

        const response = await axios.get(`${process.env.TMDB_BASE_URL}/movie/${tmdbId}`, {
            params: { api_key: process.env.TMDB_API_KEY, language: 'th-TH' }
        });

        const data = response.data;
        const newMovieData = {
            title_th: data.title,
            title_en: data.original_title,
            poster_url: data.poster_path ? `https://image.tmdb.org/t/p/w500${data.poster_path}` : null,
            genre: data.genres ? data.genres.map(g => g.name).join('/') : 'General',
            duration_min: data.runtime || 120,
            language: data.original_language === 'th' ? 'TH' : 'EN/TH',
            description: data.overview,
            start_date: new Date(),
            due_date: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000) 
        };

        const existingMovie = await Movie.findOne({ title_en: newMovieData.title_en });
        if (existingMovie) return res.status(400).json({ message: "หนังเรื่องนี้มีในระบบแล้ว" });

        const movie = await Movie.create(newMovieData);
        res.status(201).json({ success: true, message: "เพิ่มหนังจาก TMDB สำเร็จ", movie });
    } catch (error) {
        res.status(500).json({ message: "เพิ่มหนังไม่สำเร็จ", error: error.message });
    }
};

exports.createMovie = async (req, res) => {
    try {
        const { title_th, title_en, poster_url, genre, duration_min, start_date, due_date, language } = req.body;
        const newMovie = await Movie.create({ title_th, title_en, poster_url, genre, duration_min, start_date, due_date, language });
        res.status(201).json({ success: true, message: "เพิ่มหนังเรียบร้อย!", movie: newMovie });
    } catch (error) {
        res.status(500).json({ message: "บันทึกไม่สำเร็จ", error: error.message });
    }
};

exports.getAllMovies = async (req, res) => {
    try {
        const movies = await Movie.find().sort({ start_date: -1 });
        res.status(200).json({ success: true, data: movies });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
};

exports.deleteMovie = async (req, res) => {
    try {
        await Movie.findByIdAndDelete(req.params.id);
        res.status(200).json({ success: true, message: "ลบหนังเรียบร้อย" });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
};

// --- 3. สถิติ Dashboard & รายงาน ---

exports.getDashboardStats = async (req, res) => {
    try {
        const salesTotal = await Booking.aggregate([
            { $group: { _id: null, total: { $sum: "$totalPrice" } } }
        ]);
        res.status(200).json({
            success: true,
            data: {
                sales: salesTotal[0]?.total || 0,
                tickets: await Booking.countDocuments(),
                users: await User.countDocuments()
            }
        });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
};

exports.getReports = async (req, res) => {
    try {
        const feedback = await Feedback.find().populate('userId', 'name').sort({ createdAt: -1 });
        const bookings = await Booking.find();
        const seatStats = [
            { name: 'VIP', value: bookings.filter(b => b.seatType === 'VIP').length },
            { name: 'PREMIUM', value: bookings.filter(b => b.seatType === 'PREMIUM').length },
            { name: 'NORMAL', value: bookings.filter(b => b.seatType === 'NORMAL').length }
        ];
        res.status(200).json({ success: true, feedback, seatStats });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
};

// --- 4. จัดการผู้ดูแลระบบ (Admins) & ผู้ใช้งาน (Users) ---

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
        const existingUser = await User.findOne({ email });
        if (existingUser) return res.status(400).json({ message: "อีเมลนี้ถูกใช้งานแล้ว" });
        const newAdmin = await User.create({ name, email, password, role: 'admin' });
        res.status(201).json({ success: true, data: newAdmin });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

exports.deleteAdmin = async (req, res) => {
    try {
        await User.findByIdAndDelete(req.params.id);
        res.status(200).json({ success: true, message: "ลบผู้ดูแลสำเร็จ" });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

exports.getAllUsers = async (req, res) => {
    try {
        const users = await User.find({ role: { $ne: 'admin' } }).select('-password').sort({ points: -1 });
        res.status(200).json({ success: true, data: users });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
};

exports.promoteAdmin = async (req, res) => {
    try {
        const { email } = req.body;
        const user = await User.findOne({ email });
        if (!user) return res.status(404).json({ success: false, message: "ไม่พบผู้ใช้งาน" });
        if (user.role === 'admin') return res.status(400).json({ success: false, message: "เป็น Admin อยู่แล้ว" });

        user.role = 'admin';
        await user.save();
        res.status(200).json({ success: true, message: `แต่งตั้ง ${user.name} สำเร็จ`, data: user });
    } catch (error) {
        res.status(500).json({ success: false, message: "เกิดข้อผิดพลาด" });
    }
};
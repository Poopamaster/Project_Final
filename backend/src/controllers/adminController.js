const Movie = require('../models/movieModel');
const Booking = require('../models/bookingModel');
const User = require('../models/userModel');
const Feedback = require('../models/feedbackModel'); // เพิ่มตัวนี้สำหรับหน้า Report
const Log = require('../models/logSystemModel'); // สำหรับระบบ Log
const ExcelJS = require('exceljs');
const { chatWithAI } = require('../services/aiService');
const systemLog = require('../utils/logger');
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

// 2. เพิ่มหนังจาก TMDB
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

        // 📝 บันทึก Log
        await systemLog({
            level: 'INFO',
            actor: req.user,
            context: { action: 'create', table: 'movies', target_id: movie._id },
            note: `เพิ่มหนังเรื่อง "${movie.title_th}" ผ่าน TMDB (ID: ${tmdbId})`,
            req
        });

        res.status(201).json({ success: true, message: "เพิ่มหนังจาก TMDB สำเร็จ", movie });
    } catch (error) {
        res.status(500).json({ message: "เพิ่มหนังไม่สำเร็จ", error: error.message });
    }
};

// 3. เพิ่มหนังใหม่ (Manual)
exports.createMovie = async (req, res) => {
    try {
        const { title_th, title_en, genre, duration_min, start_date, due_date, language } = req.body;

        let poster_url = "";
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

        await systemLog({
            level: 'INFO',
            actor: req.user,
            context: { action: 'create', table: 'movies', target_id: newMovie._id },
            note: `เพิ่มหนังใหม่ (Manual): ${title_th}`,
            req
        });

        res.status(201).json({ success: true, message: "เพิ่มหนังเรียบร้อย!", movie: newMovie });
    } catch (error) {
        console.error("🔥🔥🔥 Create Movie Error:", error);
        res.status(500).json({ message: "บันทึกไม่สำเร็จ", error: error.message });
    }
};

// 4. อัปเดตข้อมูลหนัง
exports.updateMovie = async (req, res) => {
    try {
        const { id } = req.params;

        // 🔍 ดึงข้อมูลเก่าก่อนอัปเดตเพื่อบันทึกการเปลี่ยนแปลง
        const oldMovie = await Movie.findById(id).lean();
        if (!oldMovie) return res.status(404).json({ success: false, message: "ไม่พบหนังเรื่องนี้" });

        const updatedMovie = await Movie.findByIdAndUpdate(id, req.body, { new: true }).lean();

        // 📝 บันทึก Log พร้อม Old/New Data
        await systemLog({
            level: 'INFO',
            actor: req.user,
            context: { action: 'update', table: 'movies', target_id: id },
            changes: { old: oldMovie, new: updatedMovie },
            note: `แก้ไขข้อมูลหนัง: ${updatedMovie.title_th}`,
            req
        });

        res.status(200).json({ success: true, data: updatedMovie });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// 5. ดึงหนังทั้งหมด
exports.getAllMovies = async (req, res) => {
    try {
        const movies = await Movie.find().sort({ start_date: -1 });
        res.status(200).json({ success: true, data: movies });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
};

// 6. ลบหนัง
exports.deleteMovie = async (req, res) => {
    try {
        const movie = await Movie.findById(req.params.id);
        if (movie) {
            await Movie.findByIdAndDelete(req.params.id);
            // 📝 บันทึก Log
            await systemLog({
                level: 'WARN',
                actor: req.user,
                context: { action: 'delete', table: 'movies', target_id: req.params.id },
                note: `ลบหนังออกจากระบบ: ${movie.title_th}`,
                req
            });
        }
        res.status(200).json({ success: true, message: "ลบหนังเรียบร้อย" });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
};

// 7. สถิติหน้า Dashboard
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

// 8. ดึงข้อมูลลูกค้าทั้งหมด
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

// 9. จัดการ Admin
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

        await systemLog({
            level: 'INFO',
            actor: req.user,
            context: { action: 'create', table: 'users', target_id: newAdmin._id },
            note: `สร้าง Admin ใหม่: ${email}`,
            req
        });

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

exports.promoteAdmin = async (req, res) => {
    try {
        const { email } = req.body;
        const user = await User.findOne({ email });
        if (!user) return res.status(404).json({ success: false, message: "ไม่พบผู้ใช้งาน" });

        const oldData = { ...user._doc };
        user.role = 'admin';
        await user.save();

        await systemLog({
            level: 'INFO',
            actor: req.user,
            context: { action: 'update', table: 'users', target_id: user._id },
            changes: { old: oldData, new: user },
            note: `แต่งตั้ง ${user.email} เป็น Admin`,
            req
        });

        res.status(200).json({ success: true, message: `แต่งตั้งสำเร็จ`, data: user });
    } catch (error) {
        res.status(500).json({ success: false, message: "เกิดข้อผิดพลาด" });
    }
};

// 10. ดึงข้อมูลการจองทั้งหมด (✅ คลีน Deep Populate ให้ทะลุถึงสาขาชัวร์ๆ)
exports.getAllBookings = async (req, res) => {
    try {
        const bookings = await Booking.find()
            .populate('user_id', 'name email')
            .populate('cinema_id')
            .populate({
                path: 'showtime_id',
                populate: [
                    { path: 'movie_id', select: 'title_th title_en' },
                    {
                        path: 'auditorium_id',
                        populate: { path: 'cinema_id' } // ✅ ทะลุไปเอาชื่อสาขามาให้ Frontend
                    }
                ]
            })
            .populate({
                path: 'seats',
                populate: { path: 'seat_type_id' }
            })
            .sort({ createdAt: -1 });

        res.status(200).json({ success: true, data: bookings });
    } catch (error) {
        console.error("Get All Bookings Error:", error);
        res.status(500).json({ success: false, error: error.message });
    }
};

// 11. ดึงข้อมูล Reports & Feedbacks
exports.getReports = async (req, res) => {
    try {
        const feedback = await Feedback.find()
            .populate('userId', 'name')
            .sort({ createdAt: -1 });

        const bookings = await Booking.find();

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

exports.getSystemLogs = async (req, res) => {
    try {
        const { page = 0, limit = 15, search = '' } = req.query;

        const query = search ? {
            $or: [
                { 'actor.email': { $regex: search, $options: 'i' } },
                { 'context.table': { $regex: search, $options: 'i' } }
            ]
        } : {};

        const logs = await Log.find(query)
            .sort({ timestamp: -1 })
            .skip(page * limit)
            .limit(parseInt(limit));

        const total = await Log.countDocuments(query);

        res.json({ success: true, data: logs, total });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

exports.importMoviesFromExcel = async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ success: false, message: "กรุณาแนบไฟล์ Excel (.xlsx)" });
        }

        const workbook = new ExcelJS.Workbook();
        await workbook.xlsx.load(req.file.buffer);
        const worksheet = workbook.getWorksheet(1); // อ่าน Sheet แรก

        const movies = [];

        // วนลูปอ่านข้อมูลจากแถว (เริ่มแถวที่ 2 ข้าม Header)
        worksheet.eachRow((row, rowNumber) => {
            if (rowNumber > 1) {
                const movieData = {
                    title_th: row.getCell(1).text?.trim(),
                    title_en: row.getCell(2).text?.trim(),
                    genre: row.getCell(3).text?.trim(),
                    duration_min: parseInt(row.getCell(4).value) || 120,
                    language: row.getCell(5).text?.trim() || 'EN/TH',
                    description: row.getCell(6).text?.trim() || ''
                };

                // เก็บเฉพาะแถวที่มีชื่อหนังภาษาไทย (ป้องกันแถวว่าง)
                if (movieData.title_th) {
                    movies.push(movieData);
                }
            }
        });

        await systemLog({
            level: 'INFO',
            actor: req.user,
            context: { action: 'import', table: 'movies' },
            content: { tools_used: ['bulk_add_movies'], data_count: movies.length },
            note: `นำเข้าข้อมูลหนังจาก Excel จำนวน ${movies.length} เรื่อง`,
            req
        });

        if (movies.length === 0) {
            return res.status(400).json({ success: false, message: "ไม่พบข้อมูลหนังในไฟล์" });
        }

        // 🧠 ส่งข้อมูล JSON ที่ได้ให้ Gemini สรุปและสร้าง Visual Preview
        // จำลองว่า Admin เป็นคนส่งข้อความ "นำเข้าไฟล์ Excel" พร้อมแนบข้อมูล
        const adminUser = { id: req.user?._id || 'admin_id', role: 'admin' };
        const aiMessage = `นำเข้าข้อมูลหนังจาก Excel จำนวน ${movies.length} เรื่อง ดังนี้: ${JSON.stringify(movies)}`;

        // เรียกใช้ aiService (ตัวเดียวกับที่แชทปกติ)
        const aiResponse = await chatWithAI(
            adminUser,
            aiMessage,
            null,
            ['bulk_add_movies'] // อนุญาตให้ใช้ Tool บันทึกหนัง
        );

        res.status(200).json({
            success: true,
            message: "อ่านไฟล์สำเร็จและส่งให้ AI ตรวจสอบแล้ว",
            aiResponse: aiResponse // ส่ง Visual Tag กลับไปให้ Frontend Render ตาราง
        });

    } catch (error) {
        console.error("❌ Excel Import Error:", error);
        res.status(500).json({ success: false, message: "เกิดข้อผิดพลาดในการประมวลผลไฟล์" });
    }
};
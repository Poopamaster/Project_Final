const Movie = require('../models/movieModel');
const axios = require('axios'); // อย่าลืม npm install axios

// 1. ฟังก์ชันค้นหาจาก TMDB (ตัวช่วย)
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

        // แปลงร่างข้อมูลให้พร้อมใช้
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

// 2. ฟังก์ชันสร้างหนังใหม่ (Save ลง DB จริง)
exports.createMovie = async (req, res) => {
    try {
        // รับค่าทั้งหมดมาจาก Frontend (ผสมกันระหว่าง TMDB + Admin กรอก)
        const { 
            title_th, 
            title_en, 
            poster_url, 
            genre, 
            duration_min, 
            start_date, 
            due_date, 
            language 
        } = req.body;

        // Validate นิดหน่อย: เช็คว่ากรอกครบไหม
        if (!title_en || !start_date || !due_date) {
            return res.status(400).json({ message: "กรุณากรอกข้อมูลสำคัญให้ครบ (ชื่อ, วันฉาย)" });
        }

        // สร้างลง DB
        // (ไม่ต้องใส่ created_at, updated_at เพราะ Mongoose ทำให้เอง)
        const newMovie = await Movie.create({
            title_th,
            title_en,
            poster_url,
            genre,
            duration_min,
            start_date,
            due_date,
            language
        });

        res.status(201).json({ 
            success: true, 
            message: "เพิ่มหนังเรียบร้อย!", 
            movie: newMovie 
        });

    } catch (error) {
        console.error("Create Movie Error:", error);
        res.status(500).json({ message: "บันทึกไม่สำเร็จ", error: error.message });
    }
};

exports.getAllMovies = async (req, res) => {
    try {
        // ดึงหนังทั้งหมด เรียงจากใหม่ไปเก่า
        const movies = await Movie.find().sort({ start_date: 1 });
        
        // ส่งกลับเป็น Array ตรงๆ เลย เพื่อให้ Frontend ใช้ง่าย
        res.status(200).json(movies);
    } catch (error) {
        res.status(500).json({ message: "ดึงข้อมูลไม่สำเร็จ", error: error.message });
    }
};

// 4. ฟังก์ชันลบหนัง
exports.deleteMovie = async (req, res) => {
    try {
        const { id } = req.params;
        await Movie.findByIdAndDelete(id);
        res.status(200).json({ message: "ลบหนังเรียบร้อย" });
    } catch (error) {
        res.status(500).json({ message: "ลบไม่สำเร็จ", error: error.message });
    }
};
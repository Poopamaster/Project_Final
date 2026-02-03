const axios = require('axios');
const saveLog = require('../utils/logger'); // ✅ นำเข้า logger มาใช้งาน

// ฟังก์ชันสำหรับค้นหาหนัง (Search)
exports.searchTMDB = async (req, res) => {
    try {
        const { query } = req.query; // รับคำค้นหาจาก Frontend (เช่น ?query=Avatar)

        if (!query) {
            return res.status(400).json({ message: "กรุณาระบุชื่อหนัง" });
        }

        // 1. ยิงไปถาม TMDB
        const response = await axios.get(`${process.env.TMDB_BASE_URL}/search/movie`, {
            params: {
                api_key: process.env.TMDB_API_KEY,
                query: query,
                language: 'th-TH' // ขอผลลัพธ์เป็นภาษาไทย
            }
        });

        // 2. Data Mapping
        const formattedMovies = response.data.results.map(movie => ({
            tmdb_id: movie.id, 
            title_th: movie.title, 
            title_en: movie.original_title,
            description: movie.overview || "ไม่มีเรื่องย่อ",
            release_date: movie.release_date,
            poster_url: movie.poster_path 
                ? `https://image.tmdb.org/t/p/w500${movie.poster_path}` 
                : "https://via.placeholder.com/500x750?text=No+Image",
            rating: movie.vote_average,
            duration_min: 0 
        }));

        // ✅ บันทึก Log: เมื่อ Admin ใช้ระบบค้นหาข้อมูลจาก TMDB
        // เราจะเก็บ Log เพื่อดูว่าแอดมินสนใจดึงข้อมูลหนังเรื่องอะไรมาลงระบบบ้าง
        await saveLog({
            req,
            action: 'read',
            table: 'TMDB_External',
            targetId: 'search_query',
            newVal: { query: query, results_found: formattedMovies.length },
            note: `แอดมินค้นหาข้อมูลหนัง "${query}" จาก TMDB API`
        });

        res.status(200).json({
            success: true,
            results: formattedMovies
        });

    } catch (error) {
        console.error("TMDB Error:", error.message);
        res.status(500).json({ message: "เชื่อมต่อ TMDB ไม่สำเร็จ" });
    }
};
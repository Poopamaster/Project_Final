const axios = require('axios');
const systemLog = require('../utils/logger'); // ✅ 1. นำเข้า Logger

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
                language: 'th-TH' // ขอผลลัพธ์เป็นภาษาไทย (ถ้ามี)
            }
        });

        // 2. Data Mapping (จุดสำคัญ!)
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

        // 💡 เราไม่ใส่ INFO Log ตรงนี้เพื่อประหยัดพื้นที่ Database ครับ
        
        res.status(200).json({
            success: true,
            results: formattedMovies
        });

    } catch (error) {
        // 📝 2. บันทึก Log: กรณีเชื่อมต่อ TMDB ไม่สำเร็จ (สำคัญมาก!)
        systemLog({
            level: 'ERROR',
            actor: req.user,
            context: { action: 'api_call', table: 'movies' }, // ใช้ api_call เพื่อแยกประเภทให้ชัดเจน
            note: `เชื่อมต่อ TMDB ล้มเหลว (คำค้นหา: "${req.query?.query || 'ไม่มี'}"): ${error.message}`,
            req: req
        }).catch(() => {}); // 👈 ใส่ catch กันระบบหลักพัง

        console.error("TMDB Error:", error.message);
        res.status(500).json({ message: "เชื่อมต่อ TMDB ไม่สำเร็จ" });
    }
};
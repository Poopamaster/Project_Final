const axios = require('axios');

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
        // แปลงข้อมูลจาก TMDB ให้เป็นโครงสร้างที่ "เกือบจะ" ตรงกับ Model คุณ
        // เพื่อให้ Frontend เอาไป Auto-fill ลงฟอร์มได้ง่ายๆ
        const formattedMovies = response.data.results.map(movie => ({
            // ข้อมูลสำหรับโชว์และเตรียม Save
            tmdb_id: movie.id, 
            title_th: movie.title, 
            title_en: movie.original_title,
            description: movie.overview || "ไม่มีเรื่องย่อ",
            release_date: movie.release_date,
            
            // จัดการรูปภาพ (ถ้าไม่มีรูป ให้ใช้รูป Placeholder)
            poster_url: movie.poster_path 
                ? `https://image.tmdb.org/t/p/w500${movie.poster_path}` 
                : "https://via.placeholder.com/500x750?text=No+Image",
            
            rating: movie.vote_average,
            
            // *หมายเหตุ: duration_min หาจากหน้า Search ไม่ได้ (ต้องกด Detail) 
            // เราส่ง 0 ไปก่อน หรือให้ Admin กรอกเอง
            duration_min: 0 
        }));

        res.status(200).json({
            success: true,
            results: formattedMovies
        });

    } catch (error) {
        console.error("TMDB Error:", error.message);
        res.status(500).json({ message: "เชื่อมต่อ TMDB ไม่สำเร็จ" });
    }
};
const mongoose = require('mongoose');

const movieSchema = new mongoose.Schema({
    title_th: { type: String, required: true },
    title_en: { type: String, required: true },
    
    // 🌟 เพิ่ม Getter จัดการ URL รูปภาพอัตโนมัติ
    poster_url: { 
        type: String,
        get: function(url) {
            // 1. ถ้าไม่มีรูป ให้ส่งรูป Default
            if (!url) return "https://placehold.co/500x750?text=No+Image";
            
            // 2. ถ้าเป็นรูปที่อัปโหลดเอง (เริ่มด้วย /uploads) ให้เติม URL ของ Backend นำหน้า
            // หมายเหตุ: ถ้า Backend ของคุณรันพอร์ตอื่นที่ไม่ใช่ 5000 ให้แก้เลขตรงนี้ด้วยนะครับ
            if (url.startsWith('/uploads')) {
                const baseUrl = process.env.BACKEND_URL || 'http://localhost:5000';
                return `${baseUrl}${url}`;
            }
 
            return url;
        }
    },

    genre: { type: String, required: true },
    duration_min: { type: Number, required: true },
    start_date: { type: Date, required: true },
    due_date: { type: Date, required: true },
    
    language: { 
        type: String, 
        required: true, 
        default: "TH/EN"
    } 

}, { 
    timestamps: true,
    // 🌟 ต้องเปิดใช้งาน getters ให้ Mongoose แปลงค่าตอนส่ง API ด้วย
    toJSON: { getters: true },
    toObject: { getters: true }
});

module.exports = mongoose.model('Movie', movieSchema);
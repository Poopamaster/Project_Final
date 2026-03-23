const Cinema = require('../models/cinemaModel');
const systemLog = require('../utils/logger'); // ✅ 1. นำเข้า Logger

// --- ส่วนจัดการ Cinema (สาขา) ---

// 1. สร้างสาขาใหม่ (Create Cinema)
exports.createCinema = async (req, res) => {
    try {
        const { name, address, province, phone } = req.body;
        
        const newCinema = await Cinema.create({
            name,
            address,
            province,
            phone
        });

        // 📝 2. บันทึก Log: การสร้างสาขาโรงหนังใหม่
        systemLog({
            level: 'INFO',
            actor: req.user, // Admin คนที่กดสร้าง
            context: { action: 'create', table: 'cinemas', target_id: newCinema._id },
            note: `เพิ่มสาขาโรงภาพยนตร์ใหม่: "${name}" จ.${province}`,
            content: { address, province, phone }, // เก็บข้อมูลที่อยู่และเบอร์โทรไว้ใน content เผื่อดูย้อนหลัง
            req: req
        }).catch(err => console.error("Cinema Log Error:", err)); // 👈 ใส่ catch กันระบบล่ม

        res.status(201).json({ success: true, data: newCinema });
    } catch (error) {
        // 📝 3. บันทึก Log: สร้างสาขาไม่สำเร็จ (เช่น ชื่อซ้ำ หรือส่งข้อมูลมาไม่ครบ)
        systemLog({
            level: 'ERROR',
            actor: req.user,
            context: { action: 'create', table: 'cinemas' },
            note: `เพิ่มสาขาไม่สำเร็จ: ${error.message}`,
            req: req
        }).catch(() => {});

        res.status(400).json({ success: false, message: error.message });
    }
};

// 2. ดึงข้อมูลสาขาทั้งหมด (Get All Cinemas)
exports.getAllCinemas = async (req, res) => {
    try {
        const cinemas = await Cinema.find();
        res.status(200).json({ success: true, data: cinemas });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};
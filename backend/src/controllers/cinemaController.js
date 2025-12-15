const Cinema = require('../models/cinemaModel');

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

        res.status(201).json({ success: true, data: newCinema });
    } catch (error) {
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
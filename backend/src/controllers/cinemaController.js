const Cinema = require('../models/cinemaModel');
const saveLog = require('../utils/logger'); // ✅ นำเข้า logger มาใช้งาน

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

        // ✅ บันทึก Log เมื่อมีการเพิ่มสาขาใหม่
        await saveLog({
            req,
            action: 'create',
            table: 'Cinema',
            targetId: newCinema._id,
            newVal: { 
                name: name, 
                province: province 
            },
            note: `เพิ่มสาขาใหม่: ${name} (จังหวัด${province})`
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
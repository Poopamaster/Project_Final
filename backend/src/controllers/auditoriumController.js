const Auditorium = require('../models/auditoriumModel');
const Cinema = require('../models/cinemaModel');
const saveLog = require('../utils/logger'); // ✅ นำเข้า logger มาใช้งาน

// POST /api/auditoriums (สร้างโรงฉาย)
exports.createAuditorium = async (req, res) => {
    try {
        const { cinema_id, name, capacity, format } = req.body;

        // Validation: เช็คว่าสาขามีจริงไหม
        const cinemaExists = await Cinema.findById(cinema_id);
        if (!cinemaExists) {
            return res.status(404).json({ message: "Cinema not found" });
        }

        const newAuditorium = await Auditorium.create({
            cinema_id,
            name,
            capacity,
            format
        });

        // ✅ บันทึก Log เมื่อมีการสร้างโรงฉายใหม่
        await saveLog({
            req,
            action: 'create',
            table: 'Auditorium',
            targetId: newAuditorium._id,
            newVal: { 
                name: name, 
                cinema: cinemaExists.name,
                capacity: capacity,
                format: format 
            },
            note: `เพิ่มโรงฉาย "${name}" ที่สาขา ${cinemaExists.name}`
        });

        res.status(201).json({ success: true, data: newAuditorium });
    } catch (error) {
        res.status(400).json({ success: false, message: error.message });
    }
};

// GET /api/auditoriums (ดูโรงฉายทั้งหมด ในระบบ - ถ้าอยากใช้)
exports.getAllAuditoriums = async (req, res) => {
    try {
        const auditoriums = await Auditorium.find().populate('cinema_id', 'name'); // ดึงชื่อสาขามาโชว์ด้วย
        res.status(200).json({ success: true, data: auditoriums });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// GET /api/auditoriums/cinema/:cinemaId (ดูโรงฉาย เฉพาะสาขาที่เลือก)
exports.getAuditoriumsByCinemaId = async (req, res) => {
    try {
        const auditoriums = await Auditorium.find({ cinema_id: req.params.cinemaId });
        res.status(200).json({ success: true, data: auditoriums });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};
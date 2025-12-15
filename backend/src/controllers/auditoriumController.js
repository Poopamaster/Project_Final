const Auditorium = require('../models/auditoriumModel');
const Cinema = require('../models/cinemaModel');

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
// ตรงนี้เราย้ายมาไว้ที่นี่แทน
exports.getAuditoriumsByCinemaId = async (req, res) => {
    try {
        const auditoriums = await Auditorium.find({ cinema_id: req.params.cinemaId });
        res.status(200).json({ success: true, data: auditoriums });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};
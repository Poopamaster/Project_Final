const Auditorium = require('../models/auditoriumModel');
const Cinema = require('../models/cinemaModel');
const systemLog = require('../utils/logger');

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

        await systemLog({
            level: 'INFO',
            actor: req.user,
            context: {
                action: 'create',
                table: 'auditoriums',
                target_id: newAuditorium._id
            },
            note: `เพิ่มโรงฉาย "${name}" (${format}) ในสาขา ${cinemaExists.name}`,
            content: { capacity, format }, // เก็บสเปคโรงไว้ดูย้อนหลัง
            req
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

exports.deleteAuditorium = async (req, res) => {
    try {
        const { id } = req.params;
        const auditorium = await Auditorium.findById(id).populate('cinema_id', 'name');
        
        if (!auditorium) return res.status(404).json({ message: "Not found" });

        await Auditorium.findByIdAndDelete(id);

        // 📝 บันทึก Log: การลบโรงฉาย (ระดับ WARN)
        await systemLog({
            level: 'WARN',
            actor: req.user,
            context: { action: 'delete', table: 'auditoriums', target_id: id },
            note: `ลบโรงฉาย "${auditorium.name}" ออกจากสาขา ${auditorium.cinema_id?.name || 'Unknown'}`,
            req
        });

        res.json({ success: true, message: "Deleted successfully" });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};
const SeatType = require('../models/seatTypeModel');
const Seat = require('../models/seatModel');
const Auditorium = require('../models/auditoriumModel');

// --- 1. จัดการ SeatType (ประเภทเก้าอี้) ---

exports.createSeatType = async (req, res) => {
    try {
        // เช่น name: "Premium", price: 200
        const seatType = await SeatType.create(req.body);
        res.status(201).json({ success: true, data: seatType });
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

exports.getAllSeatTypes = async (req, res) => {
    try {
        const types = await SeatType.find();
        res.status(200).json({ success: true, data: types });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// --- 2. จัดการ Seat (ตัวเก้าอี้) ---

// ฟังก์ชันพิเศษ: สร้างเก้าอี้ทีเดียวทั้งโรง (Auto Generate)
// Postman ส่ง: { auditorium_id, row_count, col_count, seat_type_id }
exports.autoGenerateSeats = async (req, res) => {
    try {
        const { auditorium_id, row_count, col_count, seat_type_id } = req.body;

        // เช็คว่าโรงมีจริงไหม
        const auditorium = await Auditorium.findById(auditorium_id);
        if (!auditorium) return res.status(404).json({ message: "Auditorium not found" });

        const seatsToCreate = [];
        const rows = ['A','B','C','D','E','F','G','H','I','J','K','L','M','N','O']; // รองรับ 15 แถว

        // Loop สร้าง Data ตามจำนวนแถวและหลัก
        for (let r = 0; r < row_count; r++) {
            const currentRowLabel = rows[r];
            for (let c = 1; c <= col_count; c++) {
                seatsToCreate.push({
                    auditorium_id,
                    seat_type_id,
                    row_label: currentRowLabel,
                    seat_number: c.toString(), // "1", "2", ...
                    is_blocked: false
                });
            }
        }

        // Insert ทีเดียวหมดเลย (Performance ดีกว่า loop create)
        const createdSeats = await Seat.insertMany(seatsToCreate);

        res.status(201).json({ 
            success: true, 
            message: `สร้างเก้าอี้สำเร็จ ${createdSeats.length} ตัว`,
            data: createdSeats 
        });

    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// ดึงเก้าอี้ทั้งหมดในโรง (เอาไว้วาดผังตอนจอง)
exports.getSeatsByAuditorium = async (req, res) => {
    try {
        const seats = await Seat.find({ auditorium_id: req.params.auditoriumId })
            .populate('seat_type_id') // เอาข้อมูลราคามาด้วย
            .sort({ row_label: 1, seat_number: 1 }); // เรียง A1, A2...

        res.status(200).json({ success: true, data: seats });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};
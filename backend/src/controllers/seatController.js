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

exports.autoGenerateSeats = async (req, res) => {
    try {
        // รับ start_row_index เข้ามาด้วย (default เป็น 0 ถ้าไม่ส่งมา)
        const { auditorium_id, row_count, col_count, seat_type_id, start_row_index = 0 } = req.body;

        // สร้าง Array ตัวอักษร A-Z (รองรับได้ 26 แถว)
        const alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("");
        
        const seatsToCreate = [];

        for (let r = 0; r < row_count; r++) {
            // ✅ ใช้ start_row_index บวกเข้าไป เพื่อให้เริ่มแถวถัดไปได้ (เช่น เริ่มที่ C)
            const currentRowChar = alphabet[start_row_index + r]; 
            
            // กันเหนียว: ถ้าแถวเกิน Z ให้หยุด หรือใช้วิธีอื่น (แต่นี่ 200 ที่น่าจะไม่เกิน)
            if (!currentRowChar) break; 

            for (let c = 1; c <= col_count; c++) {
                seatsToCreate.push({
                    auditorium_id,
                    seat_type_id,
                    row_label: currentRowChar,
                    seat_number: c.toString(),
                    is_blocked: false
                });
            }
        }

        const createdSeats = await Seat.insertMany(seatsToCreate);

        res.status(201).json({ 
            success: true, 
            message: `สร้างเก้าอี้สำเร็จ ${createdSeats.length} ตัว (เริ่มแถว ${alphabet[start_row_index]} ถึง ${alphabet[start_row_index + row_count - 1]})`,
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
const SeatType = require('../models/seatTypeModel');
const Seat = require('../models/seatModel');
const Auditorium = require('../models/auditoriumModel');
const systemLog = require('../utils/logger'); // ✅ 1. นำเข้า Logger

// --- 1. จัดการ SeatType (ประเภทเก้าอี้) ---

exports.createSeatType = async (req, res) => {
    try {
        // เช่น name: "Premium", price: 200
        const seatType = await SeatType.create(req.body);

        // 📝 2. บันทึก Log: สร้างประเภทที่นั่งใหม่
        systemLog({
            level: 'INFO',
            actor: req.user,
            context: { action: 'create', table: 'seattypes', target_id: seatType._id },
            note: `สร้างประเภทที่นั่งใหม่: "${seatType.name}" ราคา ${seatType.price} บาท`,
            content: { name: seatType.name, price: seatType.price },
            req: req
        }).catch(err => console.error("Create SeatType Log Error:", err));

        res.status(201).json({ success: true, data: seatType });
    } catch (error) {
        // 📝 บันทึก Log: สร้างประเภทที่นั่งไม่สำเร็จ
        systemLog({
            level: 'ERROR',
            actor: req.user,
            context: { action: 'create', table: 'seattypes' },
            note: `สร้างประเภทที่นั่งไม่สำเร็จ: ${error.message}`,
            req: req
        }).catch(() => {});

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

        const startRow = alphabet[start_row_index];
        const endRow = alphabet[start_row_index + row_count - 1];

        // 📝 3. บันทึก Log: Generate ผังที่นั่ง (Bulk Action)
        systemLog({
            level: 'INFO',
            actor: req.user,
            context: { action: 'create', table: 'seats', target_id: auditorium_id },
            note: `Generate ที่นั่งอัตโนมัติ ${createdSeats.length} ตัว (แถว ${startRow} ถึง ${endRow})`,
            content: { 
                auditorium_id,
                seat_type_id,
                row_count,
                col_count,
                total_generated: createdSeats.length
            },
            req: req
        }).catch(err => console.error("Generate Seats Log Error:", err));

        res.status(201).json({ 
            success: true, 
            message: `สร้างเก้าอี้สำเร็จ ${createdSeats.length} ตัว (เริ่มแถว ${startRow} ถึง ${endRow})`,
            data: createdSeats 
        });

    } catch (error) {
        // 📝 บันทึก Log: Generate ผังที่นั่งไม่สำเร็จ
        systemLog({
            level: 'ERROR',
            actor: req.user,
            context: { action: 'create', table: 'seats' },
            note: `Generate ที่นั่งไม่สำเร็จ: ${error.message}`,
            req: req
        }).catch(() => {});

        res.status(500).json({ message: error.message });
    }
};

// ดึงเก้าอี้ทั้งหมดในโรง (เอาไว้วาดผังตอนจอง) - ไม่ต้องเก็บ Log
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
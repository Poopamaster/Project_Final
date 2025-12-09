const mongoose = require('mongoose');

const seatSchema = new mongoose.Schema({
    auditorium_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Auditorium', required: true },
    seat_type_id: { type: mongoose.Schema.Types.ObjectId, ref: 'SeatType', required: true },
    row_label: { type: String, required: true },   // A, B, C
    seat_number: { type: String, required: true }, // 1, 2, 3 (ใช้ String เผื่อมี 1A)
    is_blocked: { type: Boolean, default: false }  // เผื่อเก้าอี้เสีย
}, { timestamps: true });

// สร้าง Index เพื่อป้องกันที่นั่งซ้ำในโรงเดียวกัน
seatSchema.index({ auditorium_id: 1, row_label: 1, seat_number: 1 }, { unique: true });

module.exports = mongoose.model('Seat', seatSchema);
const mongoose = require('mongoose');

const seatTypeSchema = new mongoose.Schema({
    name: { type: String, required: true },   // Normal, Honeymoon, Sofa
    price: { type: Number, required: true }   // ราคาบวกเพิ่ม หรือ ราคาตั้งต้น
}, { timestamps: true });

module.exports = mongoose.model('SeatType', seatTypeSchema);
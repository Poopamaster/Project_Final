const express = require('express');
const router = express.Router();
const { createShowtime, getShowtimesByMovie, getShowtimeById, getAllShowtimes, getShowtimeSeats, deleteShowtime } = require('../controllers/showtimeController');

// --- ส่วนของ Admin ---
router.post('/', createShowtime);          // สร้างรอบฉาย
router.get('/', getAllShowtimes);        // ดูรอบฉายทั้งหมด (ใช้ในตาราง Admin)
router.delete('/:id', deleteShowtime);   // 2. เพิ่ม Route สำหรับลบรอบฉาย (รองรับปุ่ม Trash ใน UI)

// --- ส่วนของ User ---
router.get('/movie/:movieId', getShowtimesByMovie); // ดูรอบฉายของหนังเรื่องนั้นๆ
router.get('/:id', getShowtimeById);             // ดูรายละเอียดรอบฉายเดี่ยวๆ
router.get('/:id/seats', getShowtimeSeats);     // ดึงผังที่นั่งของรอบนั้น

module.exports = router;
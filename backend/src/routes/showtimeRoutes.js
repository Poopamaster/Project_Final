const express = require('express');
const router = express.Router();
const { createShowtime, getShowtimesByMovie, getShowtimeById,getAllShowtimes, getShowtimeSeats } = require('../controllers/showtimeController');

router.post('/', createShowtime);                // สร้างรอบฉาย
router.get('/', getAllShowtimes);              // ดูรอบฉายทั้งหมด
router.get('/movie/:movieId', getShowtimesByMovie); // ดูรอบฉายของหนังเรื่อง A
router.get('/:id', getShowtimeById);             // ดูรายละเอียดรอบฉาย (เพื่อไปหน้าจอง)
router.get('/:id/seats', getShowtimeSeats);

module.exports = router;
const express = require('express');
const router = express.Router();
const { createSeatType, getAllSeatTypes, autoGenerateSeats, getSeatsByAuditorium } = require('../controllers/seatController');

router.post('/type', createSeatType);        // สร้างประเภทเก้าอี้
router.get('/type', getAllSeatTypes);        // ดูประเภททั้งหมด
router.post('/generate', autoGenerateSeats); // สร้างเก้าอี้รวดเดียว
router.get('/auditorium/:auditoriumId', getSeatsByAuditorium); // ดึงเก้าอี้ในโรง

module.exports = router;
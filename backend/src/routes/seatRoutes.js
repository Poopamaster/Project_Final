const express = require('express');
const router = express.Router();
const { 
    createSeatType, 
    getAllSeatTypes, 
    autoGenerateSeats, 
    getSeatsByAuditorium 
} = require('../controllers/seatController');

// Import Middleware
const { authenticate, isAdmin } = require('../middleware/authMiddleware');

// --- 🔐 Admin Only (จัดการโครงสร้าง) ---
router.post('/type', authenticate, isAdmin, createSeatType);
router.post('/generate', authenticate, isAdmin, autoGenerateSeats);

// --- 🌐 Authenticated/Public (ดึงข้อมูลไปแสดงผล) ---
router.get('/type', getAllSeatTypes); // ดึงราคาไปแสดง
router.get('/auditorium/:auditoriumId', getSeatsByAuditorium); // ดึงผังที่นั่งไปวาดหน้าเว็บ

module.exports = router;
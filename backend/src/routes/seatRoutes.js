const express = require('express');
const router = express.Router();
const { 
    createSeatType, 
    getAllSeatTypes, 
    autoGenerateSeats, 
    getSeatsByAuditorium ,
    deleteSeatsByAuditorium
} = require('../controllers/seatController');
const { validate, schemas } = require('../middleware/validate');


// Import Middleware
const { authenticate, isAdmin } = require('../middleware/authMiddleware');

// --- 🔐 Admin Only (จัดการโครงสร้าง) ---
router.post('/type', authenticate, isAdmin, validate(schemas.createSeatType), createSeatType);
router.post('/generate', authenticate, isAdmin, autoGenerateSeats);

// --- 🌐 Authenticated/Public (ดึงข้อมูลไปแสดงผล) ---
router.get('/type', getAllSeatTypes); // ดึงราคาไปแสดง
router.get('/auditorium/:auditoriumId', getSeatsByAuditorium); // ดึงผังที่นั่งไปวาดหน้าเว็บ
router.delete('/auditorium/:auditoriumId', authenticate, isAdmin, deleteSeatsByAuditorium);

module.exports = router;
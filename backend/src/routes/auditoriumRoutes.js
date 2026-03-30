const express = require('express');
const router = express.Router();
const { 
    createAuditorium, 
    getAllAuditoriums, 
    getAuditoriumsByCinemaId 
} = require('../controllers/auditoriumController');
const { validate, schemas } = require('../middleware/validate');

// Import Middleware
const { authenticate, isAdmin } = require('../middleware/authMiddleware');

// 1. สร้างโรงฉาย (ต้องเป็น Admin เท่านั้น)
router.post('/', authenticate, isAdmin, validate(schemas.createAuditorium), createAuditorium);

// 2. ดูโรงฉายทั้งหมด (มักใช้ในระบบ Admin)
router.get('/', authenticate, isAdmin, getAllAuditoriums);

// 3. ดูโรงฉายตามสาขา (User ทั่วไปใช้ตอนจองตั๋ว)
router.get('/cinema/:cinemaId', authenticate, getAuditoriumsByCinemaId);

module.exports = router;
const express = require('express');
const router = express.Router();
const { 
    createMovie, 
    getAllMovies, 
    getNowShowingMovies, 
    getMovieById 
} = require('../controllers/movieController');

const { authenticate, isAdmin } = require('../middleware/authMiddleware');

// 1. เพิ่มหนังใหม่ (Admin Only)
router.post('/', authenticate, isAdmin, createMovie);

// 2. ดึงหนังทั้งหมด (ใช้ในหน้าจัดการหนัง)
router.get('/', getAllMovies);

// 3. ดูหนังที่ฉายอยู่ (Public - หน้าแรกของเว็บ)
router.get('/now-showing', getNowShowingMovies);

// 4. ดูรายละเอียดหนังรายเรื่อง (Public - หน้า Detail)
router.get('/:id', getMovieById);

module.exports = router;
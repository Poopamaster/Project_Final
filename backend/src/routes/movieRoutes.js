const express = require('express');
const router = express.Router();
const { createMovie, getAllMovies, getNowShowingMovies, getMovieById } = require('../controllers/movieController');

router.post('/', createMovie);          // สร้างหนัง
router.get('/', getAllMovies);          // ดูหนังทั้งหมด
router.get('/now-showing', getNowShowingMovies); // ดูหนังที่ฉายอยู่ (สำคัญ!)
router.get('/:id', getMovieById);       // ดูรายละเอียดหนัง

module.exports = router;
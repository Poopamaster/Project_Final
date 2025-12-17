const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');
const { authenticate } = require('../middleware/authMiddleware');

router.use(authenticate); 

// 1. Search TMDB
router.get('/tmdb/search', adminController.searchTMDB);

// 2. Create Movie
router.post('/movies', adminController.createMovie);

// ✅ 3. Get All Movies (เพิ่มอันนี้)
router.get('/movies', adminController.getAllMovies);

// ✅ 4. Delete Movie (เพิ่มอันนี้)
router.delete('/movies/:id', adminController.deleteMovie);

module.exports = router;
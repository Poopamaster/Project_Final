const express = require('express');
const router = express.Router();
const { 
    createShowtime, getShowtimesByMovie, getShowtimeById, 
    getAllShowtimes, getShowtimeSeats, deleteShowtime, 
    createBulkShowtimes, deleteMultipleShowtimes 
} = require('../controllers/showtimeController');
const { validate, schemas } = require('../middleware/validate');

// Import Middleware
const { authenticate, isAdmin } = require('../middleware/authMiddleware');

// --- 🔐 ส่วนของ Admin (Protected) ---
router.post('/', authenticate, isAdmin, validate(schemas.createShowtime), createShowtime); 

router.post('/bulk', authenticate, isAdmin, createBulkShowtimes);
router.delete('/:id', authenticate, isAdmin, deleteShowtime);
router.post('/delete-multiple', authenticate, isAdmin, deleteMultipleShowtimes);

// --- 🌐 ส่วนของ User (Public/Authenticated) ---
router.get('/', getAllShowtimes);
router.get('/movie/:movieId', getShowtimesByMovie); 
router.get('/:id', getShowtimeById); 
router.get('/:id/seats', getShowtimeSeats); 

module.exports = router;
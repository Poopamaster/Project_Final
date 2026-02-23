const express = require('express');
const router = express.Router();
const { createCinema, getAllCinemas } = require('../controllers/cinemaController');

const { authenticate, isAdmin } = require('../middleware/authMiddleware');

router.post('/', authenticate, isAdmin, createCinema);

router.get('/', getAllCinemas); 

module.exports = router;
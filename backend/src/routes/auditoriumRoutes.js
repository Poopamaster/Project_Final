const express = require('express');
const router = express.Router();
const { createAuditorium, getAllAuditoriums, getAuditoriumsByCinemaId } = require('../controllers/auditoriumController');

router.post('/', createAuditorium); // POST /api/auditoriums
router.get('/', getAllAuditoriums); // GET /api/auditoriums
router.get('/cinema/:cinemaId', getAuditoriumsByCinemaId); // GET /api/auditoriums/cinema/:cinemaId

module.exports = router;
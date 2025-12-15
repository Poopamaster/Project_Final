const express = require('express');
const router = express.Router();
const { createCinema, getAllCinemas } = require('../controllers/cinemaController');

router.post('/', createCinema);
router.get('/', getAllCinemas);

module.exports = router;
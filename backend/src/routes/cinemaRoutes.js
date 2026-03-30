const express = require('express');
const router = express.Router();
const { createCinema, getAllCinemas } = require('../controllers/cinemaController');
const { validate, schemas } = require('../middleware/validate');

const { authenticate, isAdmin } = require('../middleware/authMiddleware');

router.post('/', authenticate, isAdmin, validate(schemas.createCinema), createCinema);

router.get('/', getAllCinemas); 

module.exports = router;
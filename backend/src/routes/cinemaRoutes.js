const express = require('express');
const router = express.Router();
const { createCinema, getAllCinemas, updateCinema , deleteCinema } = require('../controllers/cinemaController');
const { validate, schemas } = require('../middleware/validate');

const { authenticate, isAdmin } = require('../middleware/authMiddleware');

router.get('/', getAllCinemas); 

router.post('/', authenticate, isAdmin, validate(schemas.createCinema), createCinema);

router.put('/:id', authenticate, isAdmin, updateCinema);

router.delete('/:id', authenticate, isAdmin, deleteCinema);


module.exports = router;
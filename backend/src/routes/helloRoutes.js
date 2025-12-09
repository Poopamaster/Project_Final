const express = require('express');
const router = express.Router();

const { getHello } = require('../controllers/hellocontroller');

router.get('/', getHello);

module.exports = router;

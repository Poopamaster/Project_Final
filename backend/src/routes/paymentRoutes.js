const express = require('express');
const router = express.Router();
const omiseController = require('../controllers/omiseController');
const webhookController = require('../controllers/webhookController');

router.post('/create-qr', omiseController.createPromptPayQR);

router.post('/webhook', webhookController.handleOmiseWebhook);
router.post('/create-qr', omiseController.createPromptPayQR);
router.get('/status/:chargeId', omiseController.checkChargeStatus);
router.post('/simulate-success', omiseController.simulatePaymentSuccess);

module.exports = router;
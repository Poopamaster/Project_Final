const express = require('express');
const router = express.Router();
const paymentController = require('../controllers/paymentController');
const webhookController = require('../controllers/webhookController');

router.post('/create-qr', paymentController.createPromptPayQR);

router.post('/webhook', webhookController.handleOmiseWebhook);
router.post('/create-qr', paymentController.createPromptPayQR);
router.get('/status/:chargeId', paymentController.checkChargeStatus);
router.post('/simulate-success', paymentController.simulatePaymentSuccess);

module.exports = router;
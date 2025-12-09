// src/routes/paymentRoutes.js
const express = require('express');
const router = express.Router();
const omiseController = require('../controllers/omiseController');
const webhookController = require('../controllers/webhookController');

router.post('/create-qr', omiseController.createPromptPayQR);

// Webhook Route (ต้องเอา URL นี้ไปใส่ใน Dashboard ของ Omise ตรงเมนู Webhooks)
router.post('/webhook', webhookController.handleOmiseWebhook);
router.post('/create-qr', omiseController.createPromptPayQR);
router.get('/status/:chargeId', omiseController.checkChargeStatus);

module.exports = router;
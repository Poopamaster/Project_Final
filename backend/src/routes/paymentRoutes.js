const express = require('express');
const router = express.Router();
const paymentController = require('../controllers/paymentController');
const webhookController = require('../controllers/webhookController');

// Import Middleware
const { authenticate, isAdmin } = require('../middleware/authMiddleware');

// 1. สร้าง QR (ต้อง Login ก่อน)
router.post('/create-qr', authenticate, paymentController.createPromptPayQR);

// 2. เช็คสถานะ (ต้อง Login)
router.get('/status/:chargeId', authenticate, paymentController.checkChargeStatus);

// 3. Webhook (ห้ามใส่ authenticate เพราะ Omise ยิงมาโดยไม่มี Token ของเรา)
router.post('/webhook', webhookController.handleOmiseWebhook);

// 4. การจำลองสถานะสำเร็จ (อันตรายมาก! ต้องเป็น Admin เท่านั้น)
router.post('/simulate-success', authenticate, paymentController.simulatePaymentSuccess);

module.exports = router;
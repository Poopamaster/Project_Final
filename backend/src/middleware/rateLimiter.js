// backend/src/middleware/rateLimiter.js
const rateLimit = require('express-rate-limit');

/**
 * Login / Register / Forgot Password
 * จำกัด 10 ครั้ง ต่อ 15 นาที ต่อ IP
 * ป้องกัน Brute Force และ Credential Stuffing
 */
const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 นาที
    max: 10,
    message: {
        success: false,
        error: 'มีการพยายามเข้าสู่ระบบบ่อยเกินไป กรุณารอ 15 นาทีแล้วลองใหม่'
    },
    standardHeaders: true,
    legacyHeaders: false,

    // Skip ถ้า response สำเร็จ (นับเฉพาะ attempt ที่ fail)
    skipSuccessfulRequests: true,
});

/**
 * Forgot Password
 * จำกัดเข้มกว่า: 5 ครั้ง ต่อ 1 ชั่วโมง ต่อ IP
 * ป้องกัน Email Enumeration และ Spam
 */
const forgotPasswordLimiter = rateLimit({
    windowMs: 60 * 60 * 1000, // 1 ชั่วโมง
    max: 5,
    message: {
        success: false,
        error: 'คุณขอรีเซ็ตรหัสผ่านบ่อยเกินไป กรุณารอ 1 ชั่วโมงแล้วลองใหม่'
    },
    standardHeaders: true,
    legacyHeaders: false,
});

/**
 * AI Chatbot (มีอยู่แล้วใน chatbotRoutes แต่รวมไว้ที่นี่ด้วยเพื่อความสะดวก)
 * 20 ครั้ง ต่อ 1 นาที
 */
const aiChatLimiter = rateLimit({
    windowMs: 1 * 60 * 1000,
    max: 20,
    message: {
        success: false,
        error: 'คุณส่งข้อความถี่เกินไป กรุณารอสักครู่'
    },
    standardHeaders: true,
    legacyHeaders: false,
});

/**
 * General API (ป้องกัน DDoS เบื้องต้น)
 * 200 ครั้ง ต่อ 1 นาที ต่อ IP
 */
const generalLimiter = rateLimit({
    windowMs: 1 * 60 * 1000,
    max: 200,
    message: {
        success: false,
        error: 'คำขอมากเกินไป กรุณาลองใหม่ในอีกสักครู่'
    },
    standardHeaders: true,
    legacyHeaders: false,
});

module.exports = { authLimiter, forgotPasswordLimiter, aiChatLimiter, generalLimiter };
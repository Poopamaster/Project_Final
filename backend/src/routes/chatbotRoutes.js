const express = require("express");
const router = express.Router();
const chatbotController = require("../controllers/chatbotController");
const { authenticate } = require("../middleware/authMiddleware");

// 🌟 เพิ่มไลบรารี Rate Limit
const rateLimit = require("express-rate-limit");

// 🛡️ สร้าง Limiter: 1 User พิมพ์แชทหา AI ได้ไม่เกิน 15 ครั้งใน 1 นาที
const aiChatLimiter = rateLimit({
    windowMs: 1 * 60 * 1000, // 1 นาที
    max: 20, 
    message: { success: false, error: "คุณส่งข้อความถี่เกินไป กรุณารอสักครู่ครับ" },
    standardHeaders: true,
    legacyHeaders: false,
});

// นำ aiChatLimiter ไปคั่นไว้ที่ Route POST /chat
router.post("/chat", authenticate, aiChatLimiter, chatbotController.chat);
router.get("/chathistory", authenticate, chatbotController.getHistory);
router.delete("/chathistory", authenticate, chatbotController.clearHistory);

module.exports = router;
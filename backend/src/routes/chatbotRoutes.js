const express = require("express");
const router = express.Router();
const chatbotController = require("../controllers/chatbotController");

// อย่าลืม Import Middleware ที่เช็ค Token ของคุณ
// (ปรับ path ให้ตรงกับที่คุณเก็บไฟล์ authMiddleware ไว้นะครับ)
const { authenticate } = require("../middleware/authMiddleware");

// POST /api/chatbot/chat
router.post("/chat", authenticate, chatbotController.chat);
router.get("/chathistory", authenticate, chatbotController.getHistory);
router.delete("/chathistory", authenticate, chatbotController.clearHistory);

module.exports = router;
const express = require("express");
const router = express.Router();
const chatbotController = require("../controllers/chatbotController");
const { authenticate } = require("../middleware/authMiddleware");
const { aiChatLimiter } = require('../middleware/rateLimiter');


// นำ aiChatLimiter ไปคั่นไว้ที่ Route POST /chat
router.post("/chat", authenticate, aiChatLimiter, chatbotController.chat);
router.get("/chathistory", authenticate, chatbotController.getHistory);
router.delete("/chathistory", authenticate, chatbotController.clearHistory);

module.exports = router;
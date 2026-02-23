const express = require("express");
const router = express.Router();
const mcpController = require("../controllers/mcpController");

// Import Middleware ของคุณ
const { authenticate, isAdmin } = require("../middleware/authMiddleware");

// --- 🌐 User Routes (Public Access) ---
// เปิดให้ทุกคน (หรือ Chatbot) เข้ามาค้นหาข้อมูลได้
router.get("/search", mcpController.searchMovies);
router.get("/genre", mcpController.findMoviesByGenre);
router.get("/latest", mcpController.findLatestMovies);
router.get("/count", mcpController.countTotalMovies);

// --- 🔐 Admin Routes (Protected) ---
// เฉพาะ Admin เท่านั้นที่สามารถเพิ่มหรือลบหนังผ่าน MCP ได้
router.post("/movie", authenticate, isAdmin, mcpController.addMovie);
router.delete("/movie/:id", authenticate, isAdmin, mcpController.deleteMovie);

module.exports = router;
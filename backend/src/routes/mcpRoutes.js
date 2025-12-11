const express = require("express");
const router = express.Router();
const mcpController = require("../controllers/mcpController");

// --- User Routes ---
// GET /api/mcp/search?keyword=Avatar
router.get("/search", mcpController.searchMovies);

// GET /api/mcp/genre?genre=Action
router.get("/genre", mcpController.findMoviesByGenre);

// GET /api/mcp/latest?limit=5
router.get("/latest", mcpController.findLatestMovies);

// GET /api/mcp/count
router.get("/count", mcpController.countTotalMovies);

// --- Admin Routes --- (ควรใส่ Middleware เช็ค Admin ตรงนี้ในอนาคต)
// POST /api/mcp/movie
router.post("/movie", mcpController.addMovie);

// DELETE /api/mcp/movie/65abc12345...
router.delete("/movie/:id", mcpController.deleteMovie);

module.exports = router;
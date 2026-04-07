// src/controllers/mcpController.js
const { customerClient, adminClient } = require("../services/mcpClient");
const systemLog = require('../utils/logger'); // ✅ 1. นำเข้า Logger

const parseMcpResult = (result) => {
    try {
        const textData = result.content[0].text;
        return JSON.parse(textData);
    } catch (error) {
        console.error("Error parsing MCP result:", error);
        return null;
    }
};

// ==========================================
// 🧑‍💻 USER TOOLS - ใช้ customerClient (ไม่เก็บ Log เพื่อประหยัดพื้นที่ DB)
// ==========================================

// 1. ค้นหาหนัง (User Tool)
exports.searchMovies = async (req, res) => {
    try {
        const { keyword } = req.query; 
        if (!keyword) return res.status(400).json({ error: "Keyword required" });

        const result = await customerClient.callTool({
            name: "search_movies",
            arguments: { keyword }
        });

        res.json(parseMcpResult(result));
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// 2. ค้นหาตามประเภท (User Tool)
exports.findMoviesByGenre = async (req, res) => {
    try {
        const { genre } = req.query;
        const result = await customerClient.callTool({
            name: "find_movies_by_genre",
            arguments: { genre }
        });
        res.json(parseMcpResult(result));
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// 3. ดูหนังล่าสุด (User Tool)
exports.findLatestMovies = async (req, res) => {
    try {
        const limit = parseInt(req.query.limit) || 5;
        const result = await customerClient.callTool({
            name: "find_latest_movies",
            arguments: { limit }
        });
        res.json(parseMcpResult(result));
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// 6. นับจำนวนหนังทั้งหมด (User Tool)
exports.countTotalMovies = async (req, res) => {
    try {
        const result = await customerClient.callTool({
            name: "count_total_movies",
            arguments: {}
        });

        res.json(parseMcpResult(result));
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// ==========================================
// 🛡️ ADMIN TOOLS - ใช้ adminClient (เก็บ Log ทุก Action)
// ==========================================

// 4. เพิ่มหนัง (Admin Tool)
exports.addMovie = async (req, res) => {
    try {
        const { title_th, title_en, genre, start_date, due_date } = req.body;

        const result = await adminClient.callTool({
            name: "add_movie",
            arguments: { title_th, title_en, genre, start_date, due_date }
        });

        const parsedResult = parseMcpResult(result);

        // 📝 บันทึก Log: Admin ใช้ MCP Tool ในการเพิ่มหนัง
        systemLog({
            level: 'INFO',
            actor: req.user,
            context: { action: 'create', table: 'movies' }, // ถือว่าเปลี่ยนข้อมูลตาราง movies
            note: `[MCP Tool] เพิ่มภาพยนตร์: "${title_th} (${title_en})"`,
            content: { genre, start_date },
            req: req
        }).catch(err => console.error("MCP Add Movie Log Error:", err));

        res.json(parsedResult);
    } catch (error) {
        // 📝 บันทึก Log: Error
        systemLog({
            level: 'ERROR',
            actor: req.user,
            context: { action: 'create', table: 'movies' },
            note: `[MCP Tool] เพิ่มหนังไม่สำเร็จ: ${error.message}`,
            req: req
        }).catch(() => {});

        res.status(500).json({ error: error.message });
    }
};

// 5. ลบหนัง (Admin Tool)
exports.deleteMovie = async (req, res) => {
    try {
        const { id } = req.params;

        const result = await adminClient.callTool({
            name: "delete_movie",
            arguments: { movie_id: id }
        });

        const parsedResult = parseMcpResult(result);

        // 📝 บันทึก Log: Admin ใช้ MCP Tool ในการลบหนัง
        systemLog({
            level: 'WARN', // ใช้ WARN สำหรับการลบ
            actor: req.user,
            context: { action: 'delete', table: 'movies', target_id: id },
            note: `[MCP Tool] ลบภาพยนตร์ ID: ${id}`,
            req: req
        }).catch(err => console.error("MCP Delete Movie Log Error:", err));

        res.json(parsedResult);
    } catch (error) {
        // 📝 บันทึก Log: Error
        systemLog({
            level: 'ERROR',
            actor: req.user,
            context: { action: 'delete', table: 'movies', target_id: req.params.id },
            note: `[MCP Tool] ลบหนังไม่สำเร็จ: ${error.message}`,
            req: req
        }).catch(() => {});

        res.status(500).json({ error: error.message });
    }
};
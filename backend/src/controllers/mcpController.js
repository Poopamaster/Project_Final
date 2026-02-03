const { client } = require("../services/mcpClient");
const saveLog = require('../utils/logger'); // ✅ นำเข้า logger มาใช้งาน

// Helper function: แปลงผลลัพธ์จาก MCP (Text JSON) เป็น Object ปกติ
const parseMcpResult = (result) => {
    try {
        const textData = result.content[0].text;
        return JSON.parse(textData);
    } catch (error) {
        console.error("Error parsing MCP result:", error);
        return null;
    }
};

// 1. ค้นหาหนัง (User Tool) - (ไม่ต้องเก็บ Log เพื่อไม่ให้ขยะเต็มตาราง)
exports.searchMovies = async (req, res) => {
    try {
        const { keyword } = req.query; 
        if (!keyword) return res.status(400).json({ error: "Keyword required" });

        const result = await client.callTool({
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
        const result = await client.callTool({
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
        const result = await client.callTool({
            name: "find_latest_movies",
            arguments: { limit }
        });
        res.json(parseMcpResult(result));
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// 4. เพิ่มหนัง (Admin Tool)
exports.addMovie = async (req, res) => {
    try {
        const { title_th, title_en, genre, start_date, due_date } = req.body;

        const result = await client.callTool({
            name: "add_movie",
            arguments: { title_th, title_en, genre, start_date, due_date }
        });

        const finalResult = parseMcpResult(result);

        // ✅ บันทึก Log: AI ทำการเพิ่มหนังผ่าน MCP
        await saveLog({
            req: { user: { email: 'MCP_Agent', role: 'ai' } }, // ระบุว่าเป็น AI Action
            action: 'create',
            table: 'Movie',
            targetId: finalResult?.data?._id || "mcp_gen",
            newVal: { title: title_th, genre: genre },
            note: `AI (MCP) ทำการเพิ่มภาพยนตร์ใหม่: ${title_th}`
        });

        res.json(finalResult);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// 5. ลบหนัง (Admin Tool)
exports.deleteMovie = async (req, res) => {
    try {
        const { id } = req.params;

        const result = await client.callTool({
            name: "delete_movie",
            arguments: { movie_id: id }
        });

        const finalResult = parseMcpResult(result);

        // ✅ บันทึก Log: AI ทำการลบหนังผ่าน MCP
        await saveLog({
            req: { user: { email: 'MCP_Agent', role: 'ai' } },
            action: 'delete',
            table: 'Movie',
            targetId: id,
            note: `AI (MCP) ทำการลบภาพยนตร์รหัส: ${id}`
        });

        res.json(finalResult);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// 6. นับจำนวนหนังทั้งหมด (User Tool)
exports.countTotalMovies = async (req, res) => {
    try {
        const result = await client.callTool({
            name: "count_total_movies",
            arguments: {}
        });

        res.json(parseMcpResult(result));
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};